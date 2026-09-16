"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { registerHeavyScene } from "@/lib/scene-load";
import { useSceneFrameloop } from "@/lib/use-scene-frameloop";

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
    float yaw = uTilt.x;
    float pitch = 0.11 + uTilt.y;
    vec3 ro = vec3(sin(yaw) * cos(pitch), sin(pitch), -cos(yaw) * cos(pitch)) * 46.0;
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

function Quad({ tilt, steps }: { tilt: React.RefObject<{ x: number; y: number }>; steps: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const uniforms = useMemo(
    () => ({
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uTilt: { value: new THREE.Vector2(0, 0) },
      uSteps: { value: steps },
    }),
    [steps],
  );

  useFrame((_, dt) => {
    const u = mat.current?.uniforms;
    if (!u) return;
    u.uTime.value += Math.min(dt, 0.05);
    u.uRes.value.set(size.width, size.height);
    const t = tilt.current ?? { x: 0, y: 0 };
    const cur = u.uTilt.value as THREE.Vector2;
    cur.x += (t.x * 0.22 - cur.x) * Math.min(dt * 3, 1);
    cur.y += (t.y * 0.1 - cur.y) * Math.min(dt * 3, 1);
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
  const tilt = useRef({ x: 0, y: 0 });
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
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [hostRef]);

  return (
    <Canvas
      frameloop={frameloop}
      dpr={1}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
      orthographic
      camera={{ position: [0, 0, 1], near: 0, far: 2 }}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <Quad tilt={tilt} steps={coarse ? 90 : 150} />
    </Canvas>
  );
}
