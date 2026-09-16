"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/*
 * A landing pad: concentric rings and spokes in wireframe emerald on a
 * shadow-catching floor. Instrument, not object — so it is lines, not a
 * shaded disc — and the one place on the site the ship casts a shadow on
 * something. `lit` brightens the rings (touchdown, or the hold-to-launch).
 */
const EMERALD = "#3cdd9e";

export default function Pad({ radius = 1.6, lit = 0.35 }: { radius?: number; lit?: number }) {
  const lines = useRef<THREE.LineSegments>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const ring = (r: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const b = ((i + 1) / n) * Math.PI * 2;
        pts.push(Math.cos(a) * r, 0, Math.sin(a) * r, Math.cos(b) * r, 0, Math.sin(b) * r);
      }
    };
    ring(radius, 96);
    ring(radius * 0.62, 64);
    ring(radius * 0.18, 32);
    // Eight spokes, broken at the inner ring so the centre stays clear.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      pts.push(c * radius * 0.2, 0, s * radius * 0.2, c * radius * 0.6, 0, s * radius * 0.6);
      pts.push(c * radius * 0.64, 0, s * radius * 0.64, c * radius * 1.04, 0, s * radius * 1.04);
    }
    // Corner ticks outside the outer ring, like an apron marking.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const c = Math.cos(a);
      const s = Math.sin(a);
      pts.push(c * radius * 1.12, 0, s * radius * 1.12, c * radius * 1.24, 0, s * radius * 1.24);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [radius]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const m = lines.current?.material as THREE.LineBasicMaterial | undefined;
    if (m) m.opacity = THREE.MathUtils.lerp(0.22, 0.75, lit) + Math.sin(t * 1.6) * 0.04 * lit;
    const p = pulse.current;
    if (p) {
      // A ring that expands and fades from the centre: the pad is live.
      const k = (t * 0.35) % 1;
      p.scale.setScalar(0.2 + k * 1.0);
      (p.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.35 * lit;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]} receiveShadow>
        <planeGeometry args={[radius * 4, radius * 4]} />
        <shadowMaterial opacity={0.55} transparent />
      </mesh>
      <lineSegments ref={lines} geometry={geometry}>
        <lineBasicMaterial color={EMERALD} transparent opacity={0.3} depthWrite={false} />
      </lineSegments>
      <mesh ref={pulse} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[radius * 0.96, radius, 96]} />
        <meshBasicMaterial color={EMERALD} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
