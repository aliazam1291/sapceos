"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { WarmShaders } from "@/components/space/useWarmShaders";
import { atmoFrag, atmoVert, planetFrag, planetVert, ringFrag, ringVert } from "@/components/space/planetShader";
import { damp, signal } from "@/lib/scroll-signal";
import { quietGL } from "@/lib/gl";
import { perf } from "@/lib/perf";

/*
 * The studio's world (2026-11-23). Ali, pointing at the /smaak header: "make
 * the studio look better."
 *
 * It was the "CyberPlanet" ported from Ali's studio site: a sphere carrying
 * its colour on `emissive`, a translucent green shell, a faceted wireframe
 * layer and a flat additive ring band. On screen that read as a flat orange
 * disc behind a green film with a grey slab through it. It broke the house rule:
 * worlds are photoreal and instruments are wireframe, with nothing in between.
 *
 * It is now drawn with the galaxy's own pipeline (`planetShader.ts`): a banded
 * ochre gas giant (KIND 0), lit by one warm sun from the upper left so it has
 * a terminator and a night side, a scattering limb, and a ring whose shadow
 * falls across the bands and which goes dark where the planet eclipses it.
 * The one instrument left is a thin emerald orbit with points of light
 * riding it, tilted against the ring.
 *
 * Lighting: those shaders take the sun from the scene origin, so the sun sits
 * at the origin and the world sits a little off it (`AT`). The camera frames
 * the world, not the origin.
 *
 * Same contract as every scene here: `quietGL`, `WarmShaders` with the
 * frameloop held at "never" until warm, paused off screen, dpr and sparkles
 * scaled by `perf.level`, scroll read through `damp()`. Still no
 * `<Environment>`: it would fetch an HDR from a CDN (CSP), and these shaders
 * do not need one.
 */

const AT = new THREE.Vector3(2.4, -1.1, 0.6);
const PLANET = new THREE.SphereGeometry(1, 96, 64);
const RING = new THREE.RingGeometry(1.4, 2.25, 160, 1);
const LOOK = { sea: "#5a3a1f", land: "#c99a62", accent: "#ecd3a8", atmo: "#d6a26a", seed: 3.7 };
const _n = new THREE.Vector3();

export default function SmaakPlanetScene({ paused }: { paused: boolean }) {
  const [warm, setWarm] = useState(false);
  const low = perf.level === "low";

  return (
    <Canvas
      onCreated={quietGL}
      frameloop={!warm || paused ? "never" : "always"}
      dpr={low ? 1 : [1, 1.5]}
      gl={{ antialias: !low, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [AT.x, AT.y + 1.1, AT.z + 8.2], fov: 35, near: 0.1, far: 60 }}
      style={{ background: "transparent" }}
    >
      <Aim />
      <World low={low} />
      {!low ? (
        <Sparkles count={120} scale={[10, 8, 4]} position={[AT.x, AT.y, AT.z - 2]} size={1.6} speed={0.15} opacity={0.5} color="#8af0c8" />
      ) : null}
      <WarmShaders onWarm={() => setWarm(true)} />
    </Canvas>
  );
}

/** Points the camera at the world rather than at the sun at the origin. */
function Aim() {
  const done = useRef(false);
  useFrame(({ camera }) => {
    if (done.current) return;
    camera.lookAt(AT);
    done.current = true;
  });
  return null;
}

function World({ low }: { low: boolean }) {
  const system = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const orbit = useRef<THREE.Group>(null);
  const p = useRef(0);

  const hull = useMemo(
    () => ({
      uSea: { value: new THREE.Color(LOOK.sea) },
      uLand: { value: new THREE.Color(LOOK.land) },
      uAccent: { value: new THREE.Color(LOOK.accent) },
      uAtmo: { value: new THREE.Color(LOOK.atmo) },
      uSeed: { value: LOOK.seed },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uRing: { value: 1 },
      uRingN: { value: new THREE.Vector3(0, 1, 0) },
      uRingIn: { value: 1.4 / 1.06 },
      uRingOut: { value: 2.25 / 1.06 },
      uDefocus: { value: 0 },
    }),
    [],
  );
  const defines = useMemo(() => ({ KIND: 0 }), []);
  const rim = useMemo(() => ({ uAtmo: { value: new THREE.Color(LOOK.atmo) }, uIntensity: { value: 0.32 } }), []);
  const rings = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#d8c29c") },
      uSeed: { value: 148 },
      uOpacity: { value: 0.85 },
      uInner: { value: 1.4 },
      uOuter: { value: 2.25 },
    }),
    [],
  );

  // The instrument: points of light on one thin orbit.
  const count = low ? 6 : 10;
  const R = 2.5;
  const orbitLine = useMemo(() => {
    const pts = Array.from({ length: 129 }, (_, i) => {
      const a = (i / 128) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0);
    });
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    // Scroll tips the system toward the reader and spins the orbit up; it
    // settles when the reader stops (never read raw: damped here).
    p.current = damp(p.current, signal.progress, 2.4, delta);
    const spin = 1 + Math.min(Math.abs(signal.velocity) * 2.2, 3);

    if (system.current) {
      system.current.rotation.x = Math.sin(t * 0.15) * 0.03 + p.current * 0.35;
      system.current.rotation.z = -0.12 + Math.sin(t * 0.11) * 0.02;
      system.current.position.y = AT.y + Math.sin(t * 0.4) * 0.05;
    }
    if (body.current) body.current.rotation.y = t * 0.05;
    if (orbit.current) orbit.current.rotation.z = t * 0.12 * spin;

    hull.uTime.value = t;
    // Ring plane normal in view space, for the ring's shadow on the bands.
    if (ring.current) {
      ring.current.getWorldDirection(_n);
      _n.transformDirection(state.camera.matrixWorldInverse);
      hull.uRingN.value.copy(_n);
    }
  });

  return (
    <group ref={system} position={AT}>
      <mesh ref={body} geometry={PLANET} scale={1.06}>
        <shaderMaterial vertexShader={planetVert} fragmentShader={planetFrag} uniforms={hull} defines={defines} />
      </mesh>

      <mesh geometry={PLANET} scale={1.16}>
        <shaderMaterial
          vertexShader={atmoVert}
          fragmentShader={atmoFrag}
          uniforms={rim}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={ring} geometry={RING} rotation={[Math.PI / 2 - 0.5, 0.18, 0]}>
        <shaderMaterial
          vertexShader={ringVert}
          fragmentShader={ringFrag}
          uniforms={rings}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* The one instrument, emerald, tilted against the ring. */}
      <group rotation={[1.25, -0.35, 0.45]}>
        <lineLoop geometry={orbitLine}>
          <lineBasicMaterial color="#3cdd9e" transparent opacity={0.4} />
        </lineLoop>
        <group ref={orbit}>
          {Array.from({ length: count }, (_, i) => {
            const a = (i / count) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * R, Math.sin(a) * R, 0]}>
                <sphereGeometry args={[i === 0 ? 0.05 : 0.028, 10, 10]} />
                <meshBasicMaterial color={i === 0 ? "#8af0c8" : "#3cdd9e"} transparent opacity={i === 0 ? 1 : 0.75} />
              </mesh>
            );
          })}
        </group>
      </group>
    </group>
  );
}
