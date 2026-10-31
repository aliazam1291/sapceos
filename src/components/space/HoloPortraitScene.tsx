"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WarmShaders } from "./useWarmShaders";
import { quietGL } from "@/lib/gl";
import { perf } from "@/lib/perf";

/*
 * The landing's portrait as a hologram (2026-10-31). Ali: "a 3D animated
 * space version of me, futuristic, with mask … and red as the third colour."
 *
 * The cut-out photo (tools/cutout-portrait.py) is sampled once into a grid
 * of points, and its alpha is the mask: only points on him exist. Depth is
 * inferred, not scanned — the silhouette is inflated (distance to its edge,
 * capped, so the chest plateaus instead of ballooning), the head gets a
 * dome of its own (found where the silhouette is narrowest: the neck), and
 * luminance adds a little relief. Enough for a slow turn to read as a body
 * in space rather than a picture on a card.
 *
 * Colour: luminance onto the emerald ramp the holograms use, a share of the
 * true colour so it is still him, an emerald rim from the left and a red
 * rim from the right — red is heat in the 3D (CLAUDE.md, 2026-10-24). A
 * visor band glints across his glasses (the "mask"), a scan passes down
 * him, and the outermost curls fizz off upward and come back.
 *
 * Arrival — "downloading": once the reader can see it, a scan plane rises
 * from his chest to above his hair and he exists below it, flaring where it
 * passes; the still under the canvas fades as it starts, and the owner
 * installs the skills one by one into the orbit as the plane climbs
 * (`onProgress`). Behind the points, a dark silhouette cut from the same
 * alpha keeps the far half of the CSS orbit behind him.
 *
 * No lights, two small ShaderMaterials, compiled in parallel before the
 * first frame (WarmShaders) — the repo's rules for every canvas.
 */

// The avatar's aspect (1199 × 1312). The figure is 2 world units tall.
const ASPECT = 1199 / 1312;
// The canvas is the figure's box grown 8% upward and 12% to each side
// (PortfolioHero.module.scss `.holo`), so curls can fizz past the edge.
const WORLD_H = 2 * 1.08;
const WORLD_CY = (-1 + (1 + 0.16)) / 2;

type Cloud = {
  positions: Float32Array;
  colors: Float32Array;
  normals: Float32Array;
  seeds: Float32Array;
  edges: Float32Array;
  rows: number;
  visor: { y: number; x: number; half: number };
  texture: THREE.Texture;
};

/** Sample the cut-out into points with inferred depth. Runs once, ~10 ms. */
function buildCloud(img: HTMLImageElement, cols: number): Cloud {
  const rows = Math.round(cols / ASPECT);
  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(img, 0, 0, cols, rows);
  const px = ctx.getImageData(0, 0, cols, rows).data;
  const n = cols * rows;

  const mask = new Uint8Array(n);
  for (let i = 0; i < n; i++) mask[i] = px[i * 4 + 3] > 110 ? 1 : 0;

  // Distance to the silhouette's edge (chamfer 3-4, two passes). The
  // image's own borders are not an edge: the suit runs off the print.
  const d = new Float32Array(n);
  for (let i = 0; i < n; i++) d[i] = mask[i] ? 1e9 : 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      if (!mask[i]) continue;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 3);
      if (y > 0) {
        v = Math.min(v, d[i - cols] + 3);
        if (x > 0) v = Math.min(v, d[i - cols - 1] + 4);
        if (x < cols - 1) v = Math.min(v, d[i - cols + 1] + 4);
      }
      d[i] = v;
    }
  }
  for (let y = rows - 1; y >= 0; y--) {
    for (let x = cols - 1; x >= 0; x--) {
      const i = y * cols + x;
      if (!mask[i]) continue;
      let v = d[i];
      if (x < cols - 1) v = Math.min(v, d[i + 1] + 3);
      if (y < rows - 1) {
        v = Math.min(v, d[i + cols] + 3);
        if (x < cols - 1) v = Math.min(v, d[i + cols + 1] + 4);
        if (x > 0) v = Math.min(v, d[i + cols - 1] + 4);
      }
      d[i] = v;
    }
  }

  // The head: everything above the narrowest row between 30% and 62% down.
  const width = new Int32Array(rows);
  const left = new Int32Array(rows).fill(cols);
  const right = new Int32Array(rows).fill(-1);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!mask[y * cols + x]) continue;
      width[y]++;
      if (x < left[y]) left[y] = x;
      if (x > right[y]) right[y] = x;
    }
  }
  let neck = Math.round(rows * 0.45);
  let narrowest = Infinity;
  for (let y = Math.round(rows * 0.3); y < Math.round(rows * 0.62); y++) {
    if (width[y] > 0 && width[y] < narrowest) {
      narrowest = width[y];
      neck = y;
    }
  }
  let top = 0;
  while (top < neck && width[top] === 0) top++;
  let hx0 = cols;
  let hx1 = 0;
  for (let y = top; y < neck; y++) {
    if (!width[y]) continue;
    hx0 = Math.min(hx0, left[y]);
    hx1 = Math.max(hx1, right[y]);
  }
  const hcx = (hx0 + hx1) / 2;
  const hcy = (top + neck) / 2;
  const hrx = Math.max(4, (hx1 - hx0) / 2);
  const hry = Math.max(4, (neck - top) / 2);

  // Depth: an inflated body, the head's dome in front of it, a little relief.
  const cap = hrx * 0.9 * 3;
  const z = new Float32Array(n);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      if (!mask[i]) continue;
      let zi = Math.sqrt(Math.min(d[i], cap) / cap) * 0.26;
      if (y < neck + hry * 0.25) {
        const nx = (x - hcx) / (hrx * 1.05);
        const ny = (y - hcy) / (hry * 1.1);
        const dome = 1 - nx * nx - ny * ny;
        if (dome > 0) zi = Math.max(zi, Math.sqrt(dome) * 0.42 * Math.min(1, Math.sqrt(d[i] / 9)));
      }
      const lum = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255;
      z[i] = zi + (lum - 0.45) * 0.05;
    }
  }

  const count = mask.reduce((s, m) => s + m, 0);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const edges = new Float32Array(count);
  const cell = (2 * ASPECT) / cols;
  const at = (x: number, y: number, fallback: number) => {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return fallback;
    const i = y * cols + x;
    return mask[i] ? z[i] : 0;
  };
  let k = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      if (!mask[i]) continue;
      positions[k * 3] = ((x + 0.5) / cols - 0.5) * 2 * ASPECT;
      positions[k * 3 + 1] = (0.5 - (y + 0.5) / rows) * 2;
      positions[k * 3 + 2] = z[i];
      colors[k * 3] = px[i * 4] / 255;
      colors[k * 3 + 1] = px[i * 4 + 1] / 255;
      colors[k * 3 + 2] = px[i * 4 + 2] / 255;
      // The surface's normal from the depth's slope: steep at the rim.
      const dzdx = (at(x + 1, y, z[i]) - at(x - 1, y, z[i])) / (2 * cell);
      const dzdy = (at(x, y - 1, z[i]) - at(x, y + 1, z[i])) / (2 * cell);
      const len = Math.hypot(dzdx, dzdy, 1);
      normals[k * 3] = -dzdx / len;
      normals[k * 3 + 1] = -dzdy / len;
      normals[k * 3 + 2] = 1 / len;
      const h = Math.sin(i * 12.9898) * 43758.5453;
      seeds[k] = h - Math.floor(h);
      edges[k] = Math.min(1, d[i] / (3 * 6));
      k++;
    }
  }

  // The visor sits across his glasses: a little over half-way down the head.
  const eyeRow = top + (neck - top) * 0.56;
  const texture = new THREE.Texture(img);
  texture.needsUpdate = true;
  return {
    positions,
    colors,
    normals,
    seeds,
    edges,
    rows,
    visor: {
      y: (0.5 - eyeRow / rows) * 2,
      x: (hcx / cols - 0.5) * 2 * ASPECT,
      half: (hrx / cols) * 2 * ASPECT * 0.86,
    },
    texture,
  };
}

const POINTS_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAssemble;
  uniform float uSize;
  uniform float uScan;
  uniform vec3 uVisor;
  attribute vec3 aColor;
  attribute vec3 aNormal;
  attribute float aSeed;
  attribute float aEdge;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 p = position;

    // Fizz: the outermost curls drift up and away, and return.
    float fizz = (1.0 - smoothstep(0.0, 0.4, aEdge)) * step(0.1, p.y);
    float ft = fract(uTime * 0.08 + aSeed * 7.0);
    p += fizz * vec3((aSeed - 0.5) * 0.12 * ft, ft * 0.14, (fract(aSeed * 13.7) - 0.5) * 0.08 * ft);
    float keep = 1.0 - fizz * smoothstep(0.25, 1.0, ft);

    // Scan: a band passes down him; points in it lift toward the lens.
    float scan = exp(-pow((p.y - uScan) / 0.03, 2.0));
    p.z += scan * 0.03;

    // Materialise: a scan plane rises from below his chest to above his
    // hair; a point exists once the plane has passed it, flaring as it does.
    float ahead = position.y - mix(-1.1, 1.25, uAssemble);
    float a = 1.0 - smoothstep(-0.015, 0.015, ahead);
    float plane = exp(-pow(ahead / 0.03, 2.0)) * (1.0 - step(0.999, uAssemble));
    p.x += (aSeed - 0.5) * 0.04 * plane;
    p.z += plane * 0.05;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (1.0 + plane * 0.6) * (0.85 + 0.3 * fract(aSeed * 5.3));

    // Luminance on the emerald ramp, with a share of the true colour.
    float L = dot(aColor, vec3(0.2126, 0.7152, 0.0722));
    vec3 ramp = mix(vec3(0.02, 0.13, 0.09), vec3(0.22, 0.86, 0.6), smoothstep(0.04, 0.7, L));
    ramp = mix(ramp, vec3(0.7, 0.98, 0.87), smoothstep(0.72, 1.0, L));
    vec3 col = mix(ramp, aColor, 0.38);

    // Rims: emerald from the left, red heat from the right.
    vec3 nv = normalize(normalMatrix * aNormal);
    col += vec3(0.24, 0.87, 0.62) * pow(clamp(-nv.x, 0.0, 1.0), 2.0) * 0.55;
    col += vec3(1.0, 0.2, 0.13) * pow(clamp(nv.x, 0.0, 1.0), 3.0) * 0.7;

    // The visor: a glass band across his glasses and a glint that sweeps it.
    float vy = 1.0 - smoothstep(0.05, 0.075, abs(position.y - uVisor.x));
    float vx = 1.0 - smoothstep(uVisor.z * 0.8, uVisor.z, abs(position.x - uVisor.y));
    float visor = vy * vx * a;
    float gx = uVisor.y + uVisor.z * (fract(uTime * 0.14) * 3.0 - 1.5);
    float glint = exp(-pow((position.x - gx) / 0.045, 2.0)) * visor;
    col = mix(col, col * 0.55 + vec3(0.2, 0.85, 0.66) * 0.45, visor * 0.6);
    col += vec3(0.75, 1.0, 0.92) * glint;

    col += vec3(0.35, 1.0, 0.78) * scan * 0.5;
    col += vec3(0.55, 1.0, 0.85) * plane * 0.9;

    // The suit dissolves at the bottom and at the print's side crops.
    float fade = smoothstep(-1.0, -0.45, position.y) * (1.0 - smoothstep(${(ASPECT * 0.76).toFixed(3)}, ${ASPECT.toFixed(3)}, abs(position.x)));
    vColor = col * 0.86;
    vAlpha = fade * keep * max(a, plane);
  }
`;

const POINTS_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r2 = dot(c, c);
    if (r2 > 0.25) discard;
    gl_FragColor = vec4(vColor, (1.0 - smoothstep(0.06, 0.25, r2)) * vAlpha);
  }
`;

const SHADOW_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SHADOW_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform float uLevel;
  varying vec2 vUv;
  void main() {
    float a = texture2D(uMap, vUv).a * (1.0 - smoothstep(uLevel - 0.03, uLevel, (vUv.y - 0.5) * 2.0));
    float fade = smoothstep(0.0, 0.27, vUv.y) * (1.0 - smoothstep(0.76, 1.0, abs(vUv.x - 0.5) * 2.0));
    gl_FragColor = vec4(vec3(0.012), a * fade * uOpacity);
  }
`;

function Hologram({
  cloud,
  go,
  onLive,
  onProgress,
  onResolved,
}: {
  cloud: Cloud;
  go: boolean;
  onLive: () => void;
  onProgress: (k: number) => void;
  onResolved: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const { size, camera, viewport } = useThree();
  // Its own clock: R3F restarts the shared one whenever the frameloop
  // resumes, and a pause (scrolled away) must not replay the beam-in.
  const clock = useRef(0);
  const startAt = useRef(-1);
  const done = useRef(false);
  const finishedAt = useRef(-1);
  const resolved = useRef(false);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(cloud.positions, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(cloud.colors, 3));
    g.setAttribute("aNormal", new THREE.BufferAttribute(cloud.normals, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(cloud.seeds, 1));
    g.setAttribute("aEdge", new THREE.BufferAttribute(cloud.edges, 1));
    return g;
  }, [cloud]);

  const pointsMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: POINTS_VERT,
        fragmentShader: POINTS_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uAssemble: { value: 0 },
          uSize: { value: 3 },
          uScan: { value: 2 },
          uVisor: { value: new THREE.Vector3(cloud.visor.y, cloud.visor.x, cloud.visor.half) },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [cloud],
  );

  const shadowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SHADOW_VERT,
        fragmentShader: SHADOW_FRAG,
        uniforms: { uMap: { value: cloud.texture }, uOpacity: { value: 0 }, uLevel: { value: -1.1 } },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [cloud],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      pointsMat.dispose();
      shadowMat.dispose();
      cloud.texture.dispose();
    },
    [geometry, pointsMat, shadowMat, cloud],
  );

  // Frame the figure: 2.16 world units tall, whatever the canvas's pixels;
  // points sized to overlap their neighbours a little, so it reads as an
  // image at rest and as a cloud when it turns.
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    cam.zoom = size.height / WORLD_H;
    cam.position.set(0, WORLD_CY, 6);
    cam.updateProjectionMatrix();
    pointsMat.uniforms.uSize.value = ((size.height / 1.08) / cloud.rows) * 1.45 * viewport.dpr;
  }, [camera, size.height, viewport.dpr, pointsMat, cloud.rows]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.current.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, dt) => {
    clock.current += Math.min(dt, 0.1);
    const t = clock.current;
    if (go && startAt.current < 0) {
      startAt.current = t;
      onLive();
    }
    // A download, not a flourish: near-linear, easing only at the end.
    const k = startAt.current < 0 ? 0 : Math.min(1, (t - startAt.current) / 3.4);
    const assemble = 1 - Math.pow(1 - k, 1.6);
    if (startAt.current >= 0 && (k < 1 || !done.current)) {
      done.current = k >= 1;
      onProgress(assemble);
    }
    pointsMat.uniforms.uAssemble.value = assemble;
    pointsMat.uniforms.uTime.value = t;
    // Once he is in: a scan every seven seconds, five to pass down him, two
    // of rest — never during the download, whose plane is the scan then.
    if (k >= 1 && finishedAt.current < 0) finishedAt.current = t;
    // Installed: hold a beat, then hand the frame back to the avatar.
    if (finishedAt.current >= 0 && !resolved.current && t - finishedAt.current > 0.9) {
      resolved.current = true;
      onResolved();
    }
    const s = finishedAt.current < 0 ? 2 : ((t - finishedAt.current + 5) % 7) / 5; // first pass 2 s after
    pointsMat.uniforms.uScan.value = s <= 1 ? 1.15 - s * 2.4 : 3;
    shadowMat.uniforms.uOpacity.value = startAt.current < 0 ? 0 : 0.9;
    shadowMat.uniforms.uLevel.value = THREE.MathUtils.lerp(-1.1, 1.25, assemble);

    const pt = pointer.current;
    const f = Math.min(1, dt * 2.5);
    pt.x += (pt.tx - pt.x) * f;
    pt.y += (pt.ty - pt.y) * f;
    const g = group.current;
    if (g) {
      g.rotation.y = Math.sin(t * 0.3) * 0.13 + pt.x * 0.16;
      g.rotation.x = Math.sin(t * 0.21) * 0.03 + pt.y * 0.05;
    }
  });

  return (
    <group ref={group}>
      <mesh material={shadowMat} position={[0, 0, 0.12]} scale={0.985} renderOrder={0}>
        <planeGeometry args={[2 * ASPECT, 2]} />
      </mesh>
      <points geometry={geometry} material={pointsMat} renderOrder={1} frustumCulled={false} />
    </group>
  );
}

export default function HoloPortraitScene({
  src,
  go,
  paused,
  onLive,
  onProgress,
  onResolved,
}: {
  src: string;
  /** The reader can see it (on screen, launch screen gone): beam in. */
  go: boolean;
  paused: boolean;
  onLive: () => void;
  /** The materialise, 0 → 1: the owner installs the skills as it climbs. */
  onProgress: (k: number) => void;
  /** Downloaded: the owner shows the avatar again and stops this canvas. */
  onResolved: () => void;
}) {
  const [cloud, setCloud] = useState<Cloud | null>(null);
  const [warm, setWarm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    img
      .decode()
      .then(() => {
        if (cancelled) return;
        // Fewer points where the GPU is weaker (~36k / ~27k / ~19k): points
        // are cheap, and below ~160 columns his face stops reading.
        const cols = perf.level === "high" ? 220 : perf.level === "medium" ? 190 : 160;
        setCloud(buildCloud(img, cols));
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <Canvas
      orthographic
      onCreated={quietGL}
      frameloop={!warm || paused || !go ? "never" : "always"}
      dpr={perf.level === "low" ? 1 : [1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, WORLD_CY, 6], zoom: 100, near: 0.1, far: 20 }}
      style={{ background: "transparent" }}
    >
      {cloud ? (
        <>
          <Hologram cloud={cloud} go={go} onLive={onLive} onProgress={onProgress} onResolved={onResolved} />
          <WarmShaders onWarm={() => setWarm(true)} />
        </>
      ) : null}
    </Canvas>
  );
}
