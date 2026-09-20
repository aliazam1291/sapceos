"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getGlowTexture } from "./glowTexture";

/*
 * A landing platform: a raised gunmetal deck with a lit inset ring and a
 * chase of edge beacons, wireframe apron markings on top, floodlight masts
 * around it, all on a dark ground that catches the ship's shadow. The
 * deck is an object (PBR, like the hull); the markings are an instrument
 * (lines). `lit` brightens the markings and the beacons (touchdown, or the
 * hold-to-launch). `masts` off for the small launch-screen view.
 */
const EMERALD = "#3cdd9e";
const AMBER = "#ffb35a";
const BEACONS = 16;

export default function Pad({ radius = 1.6, lit = 0.35, masts = true }: { radius?: number; lit?: number; masts?: boolean }) {
  const lines = useRef<THREE.LineSegments>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const beacons = useRef<THREE.Mesh[]>([]);
  const inset = useRef<THREE.MeshStandardMaterial>(null);
  const glow = getGlowTexture();

  const markings = useMemo(() => {
    const pts: number[] = [];
    const ring = (r: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const b = ((i + 1) / n) * Math.PI * 2;
        pts.push(Math.cos(a) * r, 0, Math.sin(a) * r, Math.cos(b) * r, 0, Math.sin(b) * r);
      }
    };
    ring(radius * 0.94, 96);
    ring(radius * 0.18, 32);
    // Eight spokes, broken at the inner ring so the centre stays clear.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      pts.push(c * radius * 0.2, 0, s * radius * 0.2, c * radius * 0.58, 0, s * radius * 0.58);
      pts.push(c * radius * 0.66, 0, s * radius * 0.66, c * radius * 0.92, 0, s * radius * 0.92);
    }
    // Apron ticks outside the deck.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const c = Math.cos(a);
      const s = Math.sin(a);
      pts.push(c * radius * 1.14, 0, s * radius * 1.14, c * radius * 1.28, 0, s * radius * 1.28);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [radius]);

  const beaconGeo = useMemo(() => new THREE.SphereGeometry(0.018, 10, 8), []);
  const beaconPositions = useMemo(
    () =>
      Array.from({ length: BEACONS }, (_, i) => {
        const a = (i / BEACONS) * Math.PI * 2;
        return [Math.cos(a) * radius * 0.985, 0.03, Math.sin(a) * radius * 0.985] as [number, number, number];
      }),
    [radius],
  );
  const mastPositions = useMemo(
    () =>
      // Kept out of the camera's quadrant (it looks from +x,+z).
      [2.0, 3.3, 4.9].map((a) => [Math.cos(a) * radius * 1.45, 0, Math.sin(a) * radius * 1.45] as [number, number, number]),
    [radius],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const m = lines.current?.material as THREE.LineBasicMaterial | undefined;
    if (m) m.opacity = THREE.MathUtils.lerp(0.16, 0.6, lit) + Math.sin(t * 1.6) * 0.04 * lit;
    if (inset.current) inset.current.emissiveIntensity = 0.4 + lit * 1.4 + Math.sin(t * 2.0) * 0.15 * lit;
    const p = pulse.current;
    if (p) {
      // A ring that expands and fades from the centre: the pad is live.
      const k = (t * 0.35) % 1;
      p.scale.setScalar(0.2 + k * 1.0);
      (p.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.3 * lit;
    }
    // Beacons: a chase running round the rim, faster when lit.
    const head = (t * (0.6 + lit * 1.2)) % 1;
    for (let i = 0; i < beacons.current.length; i++) {
      const b = beacons.current[i];
      if (!b) continue;
      const d = ((i / BEACONS - head) % 1 + 1) % 1;
      const on = Math.exp(-d * 9.0);
      (b.material as THREE.MeshBasicMaterial).color.setStyle(i % 4 === 0 ? AMBER : EMERALD).multiplyScalar(0.25 + on * 1.4);
      b.scale.setScalar(0.8 + on * 0.6);
    }
  });

  return (
    <group>
      {/* Ground: dark, matte, catches the shadow. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0]} receiveShadow>
        <planeGeometry args={[radius * 9, radius * 9]} />
        <meshStandardMaterial color="#070809" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* The deck: a raised gunmetal disc, chamfered by its taper. */}
      <mesh position={[0, -0.035, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[radius, radius * 1.03, 0.07, 64]} />
        <meshPhysicalMaterial color="#2b3037" roughness={0.58} metalness={0.55} clearcoat={0.15} clearcoatRoughness={0.6} />
      </mesh>
      {/* Lit inset ring, recessed into the deck. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[radius * 0.6, radius * 0.64, 96]} />
        <meshStandardMaterial ref={inset} color="#0a2a1e" emissive={EMERALD} emissiveIntensity={1} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Centre plate. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <circleGeometry args={[radius * 0.16, 32]} />
        <meshStandardMaterial color="#1c2026" roughness={0.7} metalness={0.5} />
      </mesh>

      {/* Markings. */}
      <lineSegments ref={lines} geometry={markings} position={[0, 0.006, 0]}>
        <lineBasicMaterial color={EMERALD} transparent opacity={0.3} depthWrite={false} />
      </lineSegments>
      <mesh ref={pulse} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[radius * 0.96, radius, 96]} />
        <meshBasicMaterial color={EMERALD} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Edge beacons. */}
      {beaconPositions.map((pos, i) => (
        <mesh
          key={i}
          geometry={beaconGeo}
          position={pos}
          ref={(el) => {
            if (el) beacons.current[i] = el;
          }}
        >
          <meshBasicMaterial color={EMERALD} toneMapped={false} />
        </mesh>
      ))}

      {/* Floodlight masts around the apron, heads glowing, lamps on the deck. */}
      {masts &&
        mastPositions.map((pos, i) => (
          <group key={i} position={pos}>
            <mesh position={[0, 0.6, 0]} castShadow>
              <cylinderGeometry args={[0.012, 0.016, 1.2, 8]} />
              <meshStandardMaterial color="#1f242a" roughness={0.6} metalness={0.6} />
            </mesh>
            <mesh position={[0, 1.22, 0]}>
              <boxGeometry args={[0.1, 0.05, 0.07]} />
              <meshStandardMaterial color="#2a3037" roughness={0.5} metalness={0.6} emissive="#e8fff4" emissiveIntensity={0.6} />
            </mesh>
            {glow && (
              <sprite position={[0, 1.22, 0]} scale={[0.35, 0.35, 1]}>
                <spriteMaterial map={glow} color="#cfeee2" transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.35} />
              </sprite>
            )}
            <spotLight position={[0, 1.22, 0]} angle={0.55} penumbra={0.9} intensity={2.2} color="#dff7ee" distance={7} decay={2} />
          </group>
        ))}
    </group>
  );
}
