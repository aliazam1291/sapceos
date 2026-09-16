"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { damp } from "@/lib/scroll-signal";
import { useSceneFrameloop } from "@/lib/use-scene-frameloop";

/**
 * The closing beat: a planetary surface running out to a horizon.
 *
 * The last thing on every page was a link list over empty black. This puts
 * ground under it — the camera sits low over a wireframe surface that flows
 * toward you and dissolves into the dark, with the site's own star field
 * showing above it.
 *
 * GRID, NOT MESH. `wireframe: true` triangulates every quad, and the diagonals
 * turn a survey grid into a lattice of triangles — busy, and the wrong register
 * for a site whose language is instrument readouts. The geometry here is only
 * the row and column lines, built once.
 *
 * DISPLACED ON THE GPU. The surface scrolls by advancing the noise sample
 * coordinate in the vertex shader, not by rewriting vertex buffers each frame.
 * Nothing is uploaded per frame and the CPU does no work at all — which is the
 * only reason a third scene is affordable on a page that already runs two.
 */

const SEG_X = 64;
const SEG_Z = 48;
// Touch was previously skipped entirely (see FooterHorizon.tsx). Now it
// mounts, so it needs its own budget rather than desktop's: a quarter the
// line segments is still visually a grid, at a quarter the vertices to
// stream through the vertex shader every frame on a weaker GPU.
const SEG_X_COARSE = 32;
const SEG_Z_COARSE = 24;
const WIDTH = 46;
const DEPTH = 34;

/** Row and column lines only — no diagonals. */
function buildGrid(coarse: boolean) {
  const segX = coarse ? SEG_X_COARSE : SEG_X;
  const segZ = coarse ? SEG_Z_COARSE : SEG_Z;
  const pts: number[] = [];
  const x0 = -WIDTH / 2;
  const z0 = -DEPTH;

  for (let iz = 0; iz <= segZ; iz++) {
    const z = z0 + (iz / segZ) * DEPTH;
    for (let ix = 0; ix < segX; ix++) {
      const xa = x0 + (ix / segX) * WIDTH;
      const xb = x0 + ((ix + 1) / segX) * WIDTH;
      pts.push(xa, 0, z, xb, 0, z);
    }
  }
  for (let ix = 0; ix <= segX; ix++) {
    const x = x0 + (ix / segX) * WIDTH;
    for (let iz = 0; iz < segZ; iz++) {
      const za = z0 + (iz / segZ) * DEPTH;
      const zb = z0 + ((iz + 1) / segZ) * DEPTH;
      pts.push(x, 0, za, x, 0, zb);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

const vert = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform vec2  uPointer;
  uniform float uPointerOn;
  uniform vec3  uRipple; // xy: world position, z: current strength (1 -> 0)
  varying float vFade;
  varying float vHeight;
  varying float vTouch;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // Value noise. Cheap, and at this grid density indistinguishable from
  // anything more expensive once it is displacing a wireframe.
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec3 p = position;

    // Advancing the SAMPLE coordinate rather than the geometry is what makes
    // the terrain flow through a grid that never moves — no buffer rewrites.
    float zs = p.z - uTime;

    float h = noise(vec2(p.x * 0.11, zs * 0.11)) * 1.0
            + noise(vec2(p.x * 0.27, zs * 0.27)) * 0.34
            + noise(vec2(p.x * 0.63, zs * 0.63)) * 0.11;

    // Flatten toward the camera so the near edge reads as a plain rather than
    // a wall of noise cut off by the viewport.
    float settle = smoothstep(-2.0, -12.0, p.z);
    // ...and flatten toward the horizon, hard. Relief lives in the middle
    // distance; the far rows are a plain, so the horizon is a straight line
    // that lands in the same place on every screen, not a crest that wanders.
    float horizon = 1.0 - smoothstep(-18.0, -30.0, p.z);
    p.y = (h - 0.7) * uAmp * settle * horizon;

    /*
     * The surface answers the cursor.
     *
     * A gaussian swell centred on wherever the pointer is over the footer —
     * the ground lifts toward it and the lit crest colour follows, so the
     * terrain is something you can push around rather than a loop playing
     * behind the links.
     */
    float d = distance(vec2(p.x, p.z), uPointer);
    float touch = exp(-(d * d) / 18.0) * uPointerOn;
    p.y += touch * 1.5;

    /*
     * A click/tap ripple — tighter and taller than the ambient cursor swell
     * (radius 9 vs 18, height 2.6 vs 1.5), so a click reads as an event, not
     * just more of the same hover. uRipple.z is a strength that decays in
     * JS (see the damp toward 0 in Terrain below); the shader only has to
     * know "how strong right now", not when it started.
     */
    float rd = distance(vec2(p.x, p.z), uRipple.xy);
    float ripple = exp(-(rd * rd) / 9.0) * uRipple.z;
    p.y += ripple * 2.6;
    vTouch = max(touch, ripple);

    vHeight = clamp(p.y * 0.9 + 0.3, 0.0, 1.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    // Distance fade doing the job of fog: the far rows dissolve instead of
    // ending on a hard line at the edge of the geometry.
    vFade = 1.0 - smoothstep(6.0, 30.0, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  precision mediump float;
  uniform vec3 uLine;
  uniform vec3 uCrest;
  varying float vFade;
  varying float vHeight;
  varying float vTouch;

  void main() {
    // Ridges catch more light than troughs, which is what stops a flat grid
    // from reading as a printed pattern laid over the page.
    vec3 c = mix(uLine, uCrest, vHeight);
    // The swell under the cursor also brightens, so the response is legible
    // even where the terrain was already high.
    c = mix(c, uCrest, clamp(vTouch * 1.4, 0.0, 1.0));
    gl_FragColor = vec4(c, vFade * (0.85 + vTouch * 0.5));
  }
`;

/**
 * Screen Y (0 top, 1 bottom of the footer host) mapped onto the plane by
 * hand rather than by raycasting — the surface is displaced in the vertex
 * shader, so the CPU-side geometry a raycast would hit is a flat plane
 * anyway.
 *
 * THIS USED TO BE INVERTED. `z = -26 + (1-ny)*-4 + ny*26` put the TOP of the
 * footer (ny=0, where `.footerHorizon`'s mask has just finished revealing
 * the terrain, at 22% down) at z=-30 — nearly 40 world units from the camera,
 * which is past where `vFade` (smoothstep 6..30 on camera distance) reaches
 * zero. It put the BOTTOM (ny=1) at z=0, the closest and brightest the
 * terrain ever gets — exactly where the CSS `::after` gradient lays
 * `rgba(6, 6, 6,0.85)` over it. The response was real; it landed once in a
 * spot too far to render and once in a spot too dark to see.
 *
 * Now: top of the footer maps to NEAR (z=-2, ~9.5 units from the 7.5-unit-
 * back camera, vFade≈0.94) and bottom maps to a still-partially-visible
 * z=-13 (~20.5 units, vFade≈0.35) — same direction the mask and the darkening
 * overlay already move in, so the response reinforces the composition
 * instead of fighting it.
 */
const Z_NEAR = -2;
const Z_FAR = -13;

function screenToWorld(nx: number, ny: number) {
  return { x: (nx - 0.5) * 34, z: Z_NEAR + ny * (Z_FAR - Z_NEAR) };
}

function Terrain({ coarse }: { coarse: boolean }) {
  const geo = useMemo(() => buildGrid(coarse), [coarse]);
  const mat = useRef<THREE.ShaderMaterial>(null);
  // Where the pointer is, in the terrain's own coordinates, damped toward.
  const target = useRef({ x: 0, z: Z_NEAR, on: 0 });
  // A click/tap ripple: position plus a strength that decays toward 0 in the
  // frame loop. One active ripple at a time — a second click just restarts
  // it, which reads as "still responding," not as a queue.
  const ripple = useRef({ x: 0, z: Z_NEAR, strength: 0 });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 2.15 },
      uPointer: { value: new THREE.Vector2(0, Z_NEAR) },
      uPointerOn: { value: 0 },
      uRipple: { value: new THREE.Vector3(0, Z_NEAR, 0) },
      uLine: { value: new THREE.Color("#0f3b2e") },
      uCrest: { value: new THREE.Color("#2fbf8a") },
    }),
    [],
  );

  useEffect(() => {
    const canvas = document.querySelector<HTMLCanvasElement>("[data-horizon] canvas");
    const host = canvas?.closest("[data-horizon]") as HTMLElement | null;
    if (!host) return;

    const posFromEvent = (clientX: number, clientY: number) => {
      const r = host.getBoundingClientRect();
      const nx = (clientX - r.left) / r.width;
      const ny = (clientY - r.top) / r.height;
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null;
      return { nx, ny };
    };

    // Fine pointers get continuous tracking; coarse ones only get the tap
    // ripple below — there is no cursor to drift, and chasing `touchmove`
    // the same way just turns scrolling the page into painting the terrain.
    const onMove = (e: PointerEvent) => {
      if (coarse) return;
      const pos = posFromEvent(e.clientX, e.clientY);
      if (!pos) {
        target.current.on = 0;
        return;
      }
      const w = screenToWorld(pos.nx, pos.ny);
      target.current.x = w.x;
      target.current.z = w.z;
      target.current.on = 1;
    };
    const onLeave = () => {
      target.current.on = 0;
    };
    // Click (fine) or tap (coarse): a ripple at the contact point. Kept as a
    // real DOM click rather than folded into pointermove, so it reads as a
    // deliberate response to an action rather than more ambient hover.
    const onDown = (e: PointerEvent) => {
      const pos = posFromEvent(e.clientX, e.clientY);
      if (!pos) return;
      const w = screenToWorld(pos.nx, pos.ny);
      ripple.current.x = w.x;
      ripple.current.z = w.z;
      ripple.current.strength = 1;
      if (coarse) {
        target.current.x = w.x;
        target.current.z = w.z;
        target.current.on = 1;
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [coarse]);

  useFrame((_, delta) => {
    const m = mat.current;
    if (!m) return;
    const dt = Math.min(delta, 0.05);
    m.uniforms.uTime.value += dt * 1.15;

    // Damped in the loop, never chased off the event — the same contract the
    // rest of the site's pointer motion follows. Lambdas raised from 3.4/2.6
    // to 5.5/4.2: the old response was legible only once it had landed
    // somewhere visible, which read as sluggish on top of being misplaced.
    const p = m.uniforms.uPointer.value as THREE.Vector2;
    p.x = damp(p.x, target.current.x, 5.5, dt);
    p.y = damp(p.y, target.current.z, 5.5, dt);
    m.uniforms.uPointerOn.value = damp(
      m.uniforms.uPointerOn.value as number,
      target.current.on,
      4.2,
      dt,
    );

    const r = m.uniforms.uRipple.value as THREE.Vector3;
    r.x = ripple.current.x;
    r.y = ripple.current.z;
    r.z = damp(r.z, 0, 2.2, dt);
    ripple.current.strength = r.z;
  });

  return (
    <lineSegments geometry={geo}>
      <shaderMaterial
        ref={mat}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

export default function HorizonScene() {
  const coarse =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameloop = useSceneFrameloop(canvasRef);

  return (
    <Canvas
      ref={canvasRef}
      frameloop={frameloop}
      /*
       * Camera height and aim are set by where the HORIZON LINE lands, not by
       * what looks good in isolation: at eye level it crossed the link columns
       * and a crest cut straight through the last item in the list. Higher and
       * angled further down puts the vanishing point below the text, so the
       * columns sit against sky and the terrain reads as ground beneath them.
       */
      camera={{ position: [0, 2.05, 7.5], fov: 55, near: 0.1, far: 60 }}
      dpr={coarse ? 1 : [1, 1.6]}
      gl={{ antialias: !coarse, alpha: true, powerPreference: "low-power" }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ camera }) => camera.lookAt(0, -0.35, -14)}
    >
      <Terrain coarse={coarse} />
    </Canvas>
  );
}
