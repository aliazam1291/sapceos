"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { WarmShaders } from "@/components/space/useWarmShaders";
import { damp, signal } from "@/lib/scroll-signal";
import { quietGL } from "@/lib/gl";
import { perf } from "@/lib/perf";

/*
 * The Smaak.ux planet (2026-09-26).
 *
 * Ported from Ali's own studio site — D:/lap165/Projects/smaak-ux,
 * `src/components/scene/Hero3D.tsx`, the "CyberPlanet". Same geometry as he
 * built it: a metallic void core, a glass shell over it, a faint wireframe
 * layer, a tilted data ring, and twelve particles orbiting the ring.
 *
 * THE COLOUR IS A DELIBERATE EXCEPTION AND MUST NOT BE "FIXED".
 * Everything else on this site is black + emerald, and a blue cast was tried
 * and rejected on 2026-09-12. This scene stays Smaak blue (#0066FF /
 * #00CCFF / #4D9FFF) because Ali asked for it on 2026-09-26: Smaak.ux is a
 * separate brand with its own identity, and /smaak is its page inside the
 * portfolio rather than another room of it. The exception is scoped to this
 * one route — nothing else imports this scene, and the page's blue lives in
 * local custom properties, not in the tokens.
 *
 * What changed in the port, all of it required by this repo's rules:
 *  - `quietGL` on create, `WarmShaders` before the first frame, and the
 *    frameloop held at "never" until warm — shaders compile in parallel
 *    rather than blocking the main thread on first draw.
 *  - The loop stops when the hero is off screen (`paused`), so it is not
 *    rendering ten screens above the reader.
 *  - dpr, sparkle count and the particle ring scale with `perf.level`; the
 *    glass shell's transmission is the expensive part and is dropped to a
 *    plain translucent material below "high".
 *  - `Environment preset="city"` is gone: it fetches an HDR from a CDN at
 *    runtime, which is a network request and a third-party origin the CSP
 *    would have to allow. Three lights do the same job here.
 */

export default function SmaakPlanetScene({ paused }: { paused: boolean }) {
  const [warm, setWarm] = useState(false);
  const low = perf.level === "low";

  return (
    <Canvas
      onCreated={quietGL}
      frameloop={!warm || paused ? "never" : "always"}
      dpr={low ? 1 : [1, 1.5]}
      gl={{ antialias: !low, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 0, 18], fov: 45, near: 0.1, far: 60 }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.2} color="#001133" />
      <pointLight position={[15, 10, 10]} intensity={2.5} color="#0066FF" distance={50} />
      <pointLight position={[-15, -10, -5]} intensity={1.5} color="#00CCFF" distance={50} />
      <spotLight position={[0, 15, 0]} intensity={1} angle={0.3} penumbra={1} color="#4D9FFF" />

      <Float speed={1.2} rotationIntensity={0.5} floatIntensity={0.5}>
        <CyberPlanet low={low} />
      </Float>

      {!low ? <Sparkles count={200} scale={30} size={2} speed={0.2} opacity={0.6} color="#80AAFF" /> : null}

      <WarmShaders onWarm={() => setWarm(true)} />
    </Canvas>
  );
}

function CyberPlanet({ low }: { low: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);

  // Scroll drives the planet, but never directly: the reader's progress is
  // damped toward in the frame loop, the way every other scene here reads
  // scroll (CLAUDE.md — "route it through scroll-signal"). Scrolling tips
  // the planet over and spins the ring up; stopping lets it settle.
  const p = useRef(0);
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    p.current = damp(p.current, signal.progress, 2.4, delta);
    const spin = 1 + Math.min(Math.abs(signal.velocity) * 2.2, 3);

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.05 + p.current * Math.PI * 0.9;
      // Tips away from the reader as the page goes down, so the ring opens.
      groupRef.current.rotation.x = p.current * 0.55;
      const s = 1 - p.current * 0.18;
      groupRef.current.scale.setScalar(s);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.02 * spin;
      ringRef.current.rotation.x = Math.sin(t * 0.1) * 0.1 + p.current * 0.35;
    }
  });

  const orbiters = useMemo(() => Array.from({ length: low ? 6 : 12 }), [low]);

  return (
    <group ref={groupRef}>
      {/* 1. The void core. */}
      <mesh>
        <sphereGeometry args={[3.8, low ? 32 : 64, low ? 32 : 64]} />
        <meshPhysicalMaterial
          color="#000510"
          emissive="#001133"
          emissiveIntensity={0.2}
          roughness={0.1}
          metalness={0.9}
          clearcoat={1}
          clearcoatRoughness={0.1}
          reflectivity={1}
        />
      </mesh>

      {/* 2. The glass shell. Transmission is a second render pass per frame,
             so below "high" it degrades to a plain translucent shell. */}
      <mesh scale={[1.1, 1.1, 1.1]}>
        <sphereGeometry args={[3.8, low ? 32 : 64, low ? 32 : 64]} />
        {perf.level === "high" ? (
          <meshPhysicalMaterial
            color="#0066FF"
            transmission={0.6}
            thickness={1.5}
            roughness={0}
            ior={1.4}
            clearcoat={1}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshBasicMaterial color="#0066FF" transparent opacity={0.16} side={THREE.DoubleSide} />
        )}
      </mesh>

      {/* 3. The wireframe layer. */}
      <mesh scale={[1.15, 1.15, 1.15]}>
        <icosahedronGeometry args={[3.8, 2]} />
        <meshBasicMaterial color="#00CCFF" wireframe transparent opacity={0.08} side={THREE.FrontSide} />
      </mesh>

      {/* 4. The data ring, and what rides it. */}
      <group ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <mesh>
          <torusGeometry args={[6.5, 0.02, 16, 100]} />
          <meshBasicMaterial color="#4D9FFF" transparent opacity={0.6} />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[5.5, 7.5, 64]} />
          <meshBasicMaterial color="#003399" transparent opacity={0.05} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>

        {orbiters.map((_, i) => (
          <OrbitingParticle key={i} index={i} total={orbiters.length} radius={6.5} speed={0.5} />
        ))}
      </group>
    </group>
  );
}

function OrbitingParticle({ index, total, radius, speed }: { index: number; total: number; radius: number; speed: number }) {
  const ref = useRef<THREE.Group>(null);
  const offset = (index / total) * Math.PI * 2;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() * speed;
    ref.current.position.x = Math.cos(t + offset) * radius;
    ref.current.position.y = Math.sin(t + offset) * radius;
    ref.current.position.z = Math.sin(t * 3 + offset) * 0.5;
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh scale={[2, 2, 2]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#00CCFF" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
