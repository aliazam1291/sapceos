"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { WarmShaders } from "./useWarmShaders";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { registerHeavyScene } from "@/lib/scene-load";
import { useSceneFrameloop } from "@/lib/use-scene-frameloop";
import ShipModel, { type ShipHandle } from "./ShipModel";
import { shipState } from "./shipState";
import { perf } from "@/lib/perf";
import { quietGL } from "@/lib/gl";

/*
 * The ship, slung around the hole. Its layer is a perspective camera whose
 * z=0 plane has a half-height of 1, so positions here are in the ray
 * marcher's screen units: the hole's centre sits at x≈0.4 (the cuv offset
 * of 0.2 over a half-height of 0.5) and its shadow has a radius of ≈0.33.
 * The orbit is driven by scroll progress through the section — the reader
 * flies the ship round the mass — tilted so the near pass crosses in front
 * of the disc, low, and the far pass rides high over the lensed far side.
 * A dive pulls the orbit in with the camera.
 */
const CAM_Z = 1 / Math.tan((40 * Math.PI) / 360);
const HOLE = new THREE.Vector3(0.4, 0.0, 0);
const _p = new THREE.Vector3();
const _n = new THREE.Vector3();
const _lookM = new THREE.Matrix4();
const _upV = new THREE.Vector3(0, 1, 0);
const _key = new THREE.Vector3();
const _fill = new THREE.Vector3();

function orbitAt(s: number, pull: number, out: THREE.Vector3) {
  const th = Math.PI * 0.15 + s * Math.PI * 1.7;
  const rx = 0.82 - pull * 0.3;
  const rz = 0.55 - pull * 0.2;
  out.set(HOLE.x + Math.cos(th) * rx, 0.1 - Math.sin(th) * 0.3 + pull * 0.05, Math.sin(th) * rz);
  return out;
}

function OrbitingShip({ progress, drive, host }: { progress: React.RefObject<number>; drive: React.RefObject<Drive>; host: React.RefObject<HTMLElement | null> }) {
  const ship = useRef<ShipHandle>(null);
  const s = useRef(0);
  const pull = useRef(0);
  const keyDir = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const fillDir = useMemo(() => new THREE.Vector3(0, 0, 1), []);

  useFrame((state, dt) => {
    const g = ship.current?.group;
    if (!g) return;
    const t = state.clock.elapsedTime;
    // Scroll progress through the section, read here so the layout read
    // only happens while the scene is actually rendering.
    const el = host.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      progress.current = THREE.MathUtils.clamp((vh - r.top) / (vh + r.height), 0, 1);
    }
    s.current += ((progress.current ?? 0) - s.current) * Math.min(dt * 2.2, 1);
    pull.current += ((drive.current?.dive ? 1 : 0) - pull.current) * Math.min(dt * 1.2, 1);

    orbitAt(s.current, pull.current, _p);
    orbitAt(s.current + 0.01, pull.current, _n);
    // Wobble: the mass tugs at it.
    _p.y += Math.sin(t * 1.3) * 0.012;
    g.position.copy(_p);
    // Nose along the orbit: Matrix4.lookAt puts −Z (the nose) on the next
    // point; Object3D.lookAt would put +Z there and fly it backwards (the
    // same bug the galaxy's ship had — see Starship.tsx).
    _lookM.lookAt(_p, _n, _upV);
    g.quaternion.setFromRotationMatrix(_lookM);
    g.rotateZ(-0.35 + Math.sin(t * 0.7) * 0.05);
    const depth = THREE.MathUtils.clamp((_p.z + 0.6) / 1.2, 0, 1);
    g.scale.setScalar(0.2 + depth * 0.16);

    // Lit by the disc: the key comes from the hole, warm.
    _key.copy(HOLE).sub(g.position);
    keyDir.copy(g.worldToLocal(_key.add(g.position))).normalize();
    _fill.set(0, 0, CAM_Z);
    fillDir.copy(g.worldToLocal(_fill)).normalize();
    ship.current?.setThrust(0.7 + pull.current * 0.3);
  });

  return (
    <>
      <pointLight position={[HOLE.x, 0, 0.2]} intensity={3} color="#ffb35a" distance={3} decay={2} />
      <ShipModel ref={ship} keyDir={keyDir} fillDir={fillDir} fillIntensity={1.2} />
    </>
  );
}

/*
 * A black hole, ray-marched.
 *
 * One full-screen quad; every pixel fires a ray that is bent toward the
 * mass as it travels (a Newtonian 1/r² pull on the direction — not general
 * relativity, but the same picture it produces: the far side of the
 * accretion disc lensed up over the top of the shadow, a bright ring
 * hugging the horizon, stars smeared around the edge). Rays that fall
 * inside the horizon return black. The disc is hot inside and cool outside,
 * rotates differentially (inner orbits faster, as Kepler says), and the
 * side coming toward the camera is brighter — relativistic beaming, which
 * is why real images of these things are lopsided.
 *
 * Cost is steps × pixels. The canvas runs at dpr 1, capped in width, and
 * takes fewer steps on a coarse pointer. `useSceneFrameloop` stops it dead
 * off-screen.
 */
const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform vec2  uRes;
  uniform float uTime;
  uniform vec2  uTilt;     // camera orbit from the pointer, radians
  uniform vec2  uOrbit;    // camera orbit from a drag, radians, persistent
  uniform float uDist;     // camera distance: 46 at rest, ~16 on a dive
  uniform float uSteps;    // march budget
  varying vec2 vUv;

  float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
  }

  vec3 aces(vec3 x) {
    return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
  }

  // Sky: a sparse point field with a faint band of haze, so the lensing has
  // something to smear. Sampled by direction after the ray has finished
  // bending, which is exactly how a lens works.
  vec3 sky(vec3 d) {
    vec2 a = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0)));
    vec2 g = a * vec2(38.0, 60.0);
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float h = hash21(id);
    vec2 off = (vec2(hash21(id + 1.3), hash21(id + 2.7)) - 0.5) * 0.8;
    float dd = length(f - off);
    float bright = smoothstep(0.975, 1.0, h);
    float s = bright * exp(-dd * dd * 320.0) * (0.6 + 0.8 * hash21(id + 9.1));
    vec3 tint = mix(vec3(1.0, 0.88, 0.72), vec3(0.72, 0.84, 1.0), hash21(id + 5.1));
    float haze = exp(-pow((d.y + 0.15) * 2.6, 2.0)) * 0.022 * (0.5 + noise(a * 5.0));
    return tint * s * 1.6 + vec3(0.55, 0.7, 0.75) * haze;
  }

  void main() {
    vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    // The hole sits right of centre: the copy owns the left third.
    vec2 cuv = uv - vec2(0.2, 0.0);

    // Camera: just above the disc plane, so the near side of the disc
    // crosses in front of the shadow and the far side is lensed over it.
    float yaw = uTilt.x + uOrbit.x;
    float pitch = clamp(0.11 + uTilt.y + uOrbit.y, -0.5, 0.9);
    vec3 ro = vec3(sin(yaw) * cos(pitch), sin(pitch), -cos(yaw) * cos(pitch)) * uDist;
    vec3 fw = normalize(-ro);
    vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw));
    vec3 up = cross(fw, rt);
    vec3 rd = normalize(fw * 2.9 + rt * cuv.x + up * cuv.y);

    const float RS = 1.0;      // horizon
    vec3 p = ro;
    vec3 v = rd;
    vec3 col = vec3(0.0);
    float T = 1.0;             // transmittance
    float minR = 1e3;

    for (int i = 0; i < 160; i++) {
      if (float(i) >= uSteps) break;
      float r = length(p);
      minR = min(minR, r);
      if (r < RS) { T = 0.0; break; }
      if (r > 80.0 && dot(p, v) > 0.0) break;

      // Fine steps near the mass, where the bending happens.
      float dt = clamp(r * 0.14, 0.05, 2.0);
      vec3 acc = -p * (1.55 * RS / (r * r * r));
      v = normalize(v + acc * dt);
      vec3 np = p + v * dt;

      // Disc crossing: the ray passed through y = 0 this step.
      if (p.y * np.y < 0.0) {
        float t = p.y / (p.y - np.y);
        vec3 hp = mix(p, np, t);
        float hr = length(hp.xz);
        if (hr > 2.3 * RS && hr < 8.0 * RS) {
          float ang = atan(hp.z, hp.x);
          // Keplerian: inner material laps the outer.
          float kep = uTime * 0.55 / pow(hr, 1.5);
          float band = noise(vec2(hr * 2.6, (ang + kep) * 3.0));
          float fine = noise(vec2(hr * 9.0, (ang + kep * 1.3) * 8.0));
          float dens = smoothstep(2.3, 3.3, hr) * (1.0 - smoothstep(5.2, 8.0, hr));
          dens *= 0.5 + 0.65 * band + 0.3 * fine;

          float temp = 1.0 / hr;
          vec3 dc = mix(vec3(1.0, 0.36, 0.10), vec3(1.0, 0.82, 0.55), smoothstep(0.10, 0.40, temp));
          dc = mix(dc, vec3(1.25, 1.15, 1.05), smoothstep(0.34, 0.46, temp));

          // Beaming: the half of the disc orbiting toward us is brighter.
          vec3 tang = vec3(-hp.z, 0.0, hp.x) / hr;
          float dop = dot(tang, -rd);
          float beam = 1.0 + 0.95 * dop;

          float emit = dens * beam * (0.22 + 1.7 * temp);
          col += T * dc * emit;
          T *= 1.0 - dens * 0.55;
        }
      }
      p = np;
    }

    col += T * sky(v);

    // Photon ring: light that orbited the hole once before leaving. A thin
    // hot line at ~1.5 RS, drawn from the closest approach of the ray.
    float ring = exp(-abs(minR - 1.5 * RS) * 9.0) * step(RS, minR);
    col += vec3(1.0, 0.85, 0.65) * ring * 0.9;

    // Vignette, then film.
    float vig = 1.0 - smoothstep(0.55, 1.35, length(cuv * vec2(0.85, 1.25)));
    col *= 0.35 + 0.65 * vig;
    vec3 mapped = aces(col);
    gl_FragColor = vec4(pow(mapped, vec3(1.0 / 2.2)), 1.0);
  }
`;

type Drive = { x: number; y: number; ox: number; oy: number; dive: boolean };

function Quad({ tilt, steps }: { tilt: React.RefObject<Drive>; steps: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const uniforms = useMemo(
    () => ({
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uTilt: { value: new THREE.Vector2(0, 0) },
      uOrbit: { value: new THREE.Vector2(0, 0) },
      uDist: { value: 46 },
      uSteps: { value: steps },
    }),
    [steps],
  );

  useFrame((_, dt) => {
    const u = mat.current?.uniforms;
    if (!u) return;
    u.uTime.value += Math.min(dt, 0.05);
    u.uRes.value.set(size.width, size.height);
    const t = tilt.current ?? { x: 0, y: 0, ox: 0, oy: 0, dive: false };
    const cur = u.uTilt.value as THREE.Vector2;
    cur.x += (t.x * 0.22 - cur.x) * Math.min(dt * 3, 1);
    cur.y += (t.y * 0.1 - cur.y) * Math.min(dt * 3, 1);
    // Drag orbits (persistent); a hold dives toward the horizon and the
    // release lets the hole throw you back out.
    const orb = u.uOrbit.value as THREE.Vector2;
    orb.x += (t.ox - orb.x) * Math.min(dt * 4, 1);
    orb.y += (t.oy - orb.y) * Math.min(dt * 4, 1);
    const wantDist = t.dive ? 22 : 46;
    u.uDist.value += (wantDist - u.uDist.value) * Math.min(dt * (t.dive ? 0.9 : 1.6), 1);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} depthWrite={false} />
    </mesh>
  );
}

export default function SingularityScene({ hostRef }: { hostRef: React.RefObject<HTMLElement | null> }) {
  const frameloop = useSceneFrameloop(hostRef);
  // The ship's canvas draws nothing until its shaders have compiled in
  // parallel (WarmShaders); the ray-marched hole has one quad and one shader.
  const [warm, setWarm] = useState(false);
  const [warmQuad, setWarmQuad] = useState(false);
  const tilt = useRef<Drive>({ x: 0, y: 0, ox: 0, oy: 0, dive: false });
  const progress = useRef(0);
  const coarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  useEffect(() => {
    if (frameloop !== "always") return;
    return registerHeavyScene();
  }, [frameloop]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tilt.current.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      tilt.current.y = ((e.clientY - r.top) / r.height - 0.5) * -2;
    };
    const onLeave = () => {
      tilt.current.x = 0;
      tilt.current.y = 0;
      tilt.current.dive = false;
      drag = null;
    };
    // Drag to orbit, hold to dive. A drag that moves is an orbit; a press
    // that stays put (or any press, after 180ms) is a dive.
    let drag: { x: number; y: number; ox: number; oy: number; t: number } | null = null;
    let diveTimer = 0;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, ox: tilt.current.ox, oy: tilt.current.oy, t: performance.now() };
      window.clearTimeout(diveTimer);
      diveTimer = window.setTimeout(() => {
        if (drag) tilt.current.dive = true;
      }, 180);
      el.setAttribute("data-hold", "");
    };
    const onDrag = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      tilt.current.ox = drag.ox + dx * 0.004;
      tilt.current.oy = drag.oy - dy * 0.003;
      if (Math.hypot(dx, dy) > 12) {
        window.clearTimeout(diveTimer);
        tilt.current.dive = false;
      }
    };
    const onUp = () => {
      window.clearTimeout(diveTimer);
      tilt.current.dive = false;
      drag = null;
      el.removeAttribute("data-hold");
    };
    // The capture flag: while the hole has more than 45% of the viewport.
    const io = new IntersectionObserver(
      ([e]) => {
        shipState.captured = e.intersectionRatio > 0.45 ? 1 : 0;
      },
      { threshold: [0, 0.45, 0.6] },
    );
    io.observe(el);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointermove", onDrag);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      io.disconnect();
      window.clearTimeout(diveTimer);
      shipState.captured = 0;
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointermove", onDrag);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [hostRef]);

  return (
    <>
    <Canvas
      onCreated={quietGL}
      frameloop={warmQuad ? frameloop : "never"}
      dpr={1}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
      orthographic
      camera={{ position: [0, 0, 1], near: 0, far: 2 }}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <Quad tilt={tilt} steps={coarse || perf.level === "low" ? 80 : perf.level === "medium" ? 110 : 150} />
      <WarmShaders onWarm={() => setWarmQuad(true)} />
    </Canvas>
    {/* The ship, on its own transparent layer over the hole. */}
    <Canvas
      onCreated={quietGL}
      frameloop={warm ? frameloop : "never"}
      dpr={1}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      camera={{ fov: 40, near: 0.1, far: 30, position: [0, 0, CAM_Z] }}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <OrbitingShip progress={progress} drive={tilt} host={hostRef} />
      <WarmShaders onWarm={() => setWarm(true)} />
    </Canvas>
    </>
  );
}
