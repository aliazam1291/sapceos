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
 * COLOUR (2026-09-28). **The blue exception is withdrawn.** Ali, reversing
 * the 2026-09-26 call: "for the smaak section we need better UI with our
 * space theme." So the body follows the site's palette rules rather than
 * Smaak's brand — the world is amber/ochre lit by one warm sun (CLAUDE.md:
 * "amber is for the field — planets, dust, the core"), and every instrument
 * line on it is emerald. Nothing here is blue any more, and the page no
 * longer defines local blue custom properties.
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
      {/* One warm sun, a cool bounce and a soft emerald key — the same
          lighting logic the galaxy's own bodies use. */}
      <ambientLight intensity={0.3} color="#1b2a26" />
      <pointLight position={[15, 10, 10]} intensity={3.4} color="#ffd9a0" distance={50} />
      <pointLight position={[-15, -10, -5]} intensity={1.2} color="#3a6f5e" distance={50} />
      <spotLight position={[0, 15, 0]} intensity={0.9} angle={0.3} penumbra={1} color="#8af0c8" />

      <Float speed={1.2} rotationIntensity={0.5} floatIntensity={0.5}>
        <CyberPlanet low={low} />
      </Float>

      {!low ? <Sparkles count={200} scale={30} size={2} speed={0.2} opacity={0.55} color="#8af0c8" /> : null}

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
      {/* 1. The body. Ochre rock, not a void: a world on this site is amber,
             and the saturation comes from the warm sun rather than the paint.
             Metalness 0.9/roughness 0.1 was left over from the port's
             original "metallic void core" (Ali's studio site, pre-retheme) —
             a near-mirror surface with nothing to reflect, since Environment
             preset="city" was cut for CSP (see the note above). Lowering
             metalness helped but did not fix it: isolated with a plain
             meshBasicMaterial swapped in for a frame (2026-09-29, browser
             pane, perf.level "low" — SwiftShader), the body itself drew
             fine, so the direct point lights simply were not reaching a
             meshPhysicalMaterial's PBR path in that pipeline, at any
             metalness/roughness. The colour is carried on `emissive` now
             instead of depending on that lighting resolving — the point
             lights still add clearcoat sheen where they do land, but the
             rock reads warm even where they do not. */}
      <mesh>
        <sphereGeometry args={[3.8, low ? 32 : 64, low ? 32 : 64]} />
        <meshPhysicalMaterial
          color="#8a5a30"
          emissive="#7a4a20"
          emissiveIntensity={0.85}
          roughness={0.55}
          metalness={0.15}
          clearcoat={0.35}
          clearcoatRoughness={0.3}
        />
      </mesh>

      {/* 2. The glass shell. `transmission` refracts whatever the environment
             map shows through the glass — and there is no environment map
             (see the note at the top: `Environment preset="city"` was cut
             for CSP), so at roughness 0 this had nothing correct to render
             and came out as a near-black murky layer sitting right over the
             body, the same failure mode the body's metalness had. A plain
             translucent shell is what it visually was anyway once there's
             no environment for the "glass" to be optically doing anything
             with; the clearcoat keeps a soft highlight without needing one. */}
      <mesh scale={[1.1, 1.1, 1.1]}>
        <sphereGeometry args={[3.8, low ? 32 : 64, low ? 32 : 64]} />
        {perf.level === "high" ? (
          <meshPhysicalMaterial
            color="#4fd8a0"
            roughness={0.3}
            clearcoat={0.6}
            clearcoatRoughness={0.2}
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshBasicMaterial color="#2fbf8a" transparent opacity={0.14} side={THREE.DoubleSide} />
        )}
      </mesh>

      {/* 3. The wireframe layer — an instrument over a world, so emerald. */}
      <mesh scale={[1.15, 1.15, 1.15]}>
        <icosahedronGeometry args={[3.8, 2]} />
        <meshBasicMaterial color="#8af0c8" wireframe transparent opacity={0.09} side={THREE.FrontSide} />
      </mesh>

      {/* 4. The data ring, and what rides it. Emerald instrument line over a
             warm dust band — the same division the galaxy uses. */}
      <group ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <mesh>
          <torusGeometry args={[6.5, 0.02, 16, 100]} />
          <meshBasicMaterial color="#3cdd9e" transparent opacity={0.6} />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[5.5, 7.5, 64]} />
          <meshBasicMaterial color="#ffb35a" transparent opacity={0.07} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
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
        <meshBasicMaterial color="#3cdd9e" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
