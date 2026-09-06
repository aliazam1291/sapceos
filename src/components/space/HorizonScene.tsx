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
const WIDTH = 46;
const DEPTH = 34;

/** Row and column lines only — no diagonals. */
function buildGrid() {
  const pts: number[] = [];
  const x0 = -WIDTH / 2;
  const z0 = -DEPTH;

  for (let iz = 0; iz <= SEG_Z; iz++) {
    const z = z0 + (iz / SEG_Z) * DEPTH;
    for (let ix = 0; ix < SEG_X; ix++) {
      const xa = x0 + (ix / SEG_X) * WIDTH;
      const xb = x0 + ((ix + 1) / SEG_X) * WIDTH;
      pts.push(xa, 0, z, xb, 0, z);
    }
  }
  for (let ix = 0; ix <= SEG_X; ix++) {
    const x = x0 + (ix / SEG_X) * WIDTH;
    for (let iz = 0; iz < SEG_Z; iz++) {
      const za = z0 + (iz / SEG_Z) * DEPTH;
      const zb = z0 + ((iz + 1) / SEG_Z) * DEPTH;
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
    p.y = (h - 0.7) * uAmp * settle;

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
    vTouch = touch;

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

function Terrain() {
  const geo = useMemo(buildGrid, []);
  const mat = useRef<THREE.ShaderMaterial>(null);
  // Where the pointer is, in the terrain's own coordinates, damped toward.
  const target = useRef({ x: 0, z: -12, on: 0 });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 2.15 },
      uPointer: { value: new THREE.Vector2(0, -12) },
      uPointerOn: { value: 0 },
      uLine: { value: new THREE.Color("#123c39") },
      uCrest: { value: new THREE.Color("#22d0b2") },
    }),
    [],
  );

  useEffect(() => {
    const canvas = document.querySelector<HTMLCanvasElement>("[data-horizon] canvas");
    const host = canvas?.closest("[data-horizon]") as HTMLElement | null;
    if (!host) return;

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) {
        target.current.on = 0;
        return;
      }
      /*
       * Screen position mapped onto the plane by hand rather than by raycasting.
       * A raycast per pointer move would be exact and pointless: the surface is
       * displaced in the vertex shader, so the CPU-side geometry it would hit is
       * a flat plane anyway. This lands the swell where the eye expects it.
       */
      target.current.x = (nx - 0.5) * 34;
      target.current.z = -26 + (1 - ny) * -4 + ny * 26;
      target.current.on = 1;
    };
    const onLeave = () => {
      target.current.on = 0;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useFrame((_, delta) => {
    const m = mat.current;
    if (!m) return;
    const dt = Math.min(delta, 0.05);
    m.uniforms.uTime.value += dt * 1.15;

    // Damped in the loop, never chased off the event — the same contract the
    // rest of the site's pointer motion follows.
    const p = m.uniforms.uPointer.value as THREE.Vector2;
    p.x = damp(p.x, target.current.x, 3.4, dt);
    p.y = damp(p.y, target.current.z, 3.4, dt);
    m.uniforms.uPointerOn.value = damp(
      m.uniforms.uPointerOn.value as number,
      target.current.on,
      2.6,
      dt,
    );
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
      <Terrain />
    </Canvas>
  );
}
