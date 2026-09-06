"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneFrameloop } from "@/lib/use-scene-frameloop";

/**
 * A wireframe form generated from the mission slug — the 3D counterpart to the
 * SVG signature. Same seed, same object, every time: an identity for work that
 * cannot be shown as screenshots.
 *
 * Built as a seeded icosahedron — each vertex pushed in or out along its own
 * normal by the seed — so the result is a faceted crystal rather than a smooth
 * revolved solid. The lathe profile this replaced produced a rounded, vaguely
 * lamp-shaped silhouette that read as an ornament; a polyhedron matches the
 * geometric language the rest of the site is drawn in.
 */

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function Form({ seed }: { seed: string }) {
  const group = useRef<THREE.Group>(null);

  const { edges, verts, ringRadius, ringTilt } = useMemo(() => {
    const rand = rng(hash(seed));

    const geo = new THREE.IcosahedronGeometry(0.78, 1);
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;

    // Displace each vertex along its own radius. Positions are keyed by a
    // rounded coordinate so shared vertices move together and the hull stays
    // closed — displacing raw indices would tear the faces apart.
    const moved = new Map<string, number>();
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const key = `${v.x.toFixed(3)}|${v.y.toFixed(3)}|${v.z.toFixed(3)}`;
      let k = moved.get(key);
      if (k === undefined) {
        k = 0.78 + (rand() - 0.5) * 0.42;
        moved.set(key, k);
      }
      v.setLength(k);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    return {
      edges: new THREE.EdgesGeometry(geo, 1),
      verts: new Float32Array(pos.array as Float32Array),
      ringRadius: 0.95 + rand() * 0.35,
      ringTilt: rand() * Math.PI,
    };
  }, [seed]);

  const ring = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * ringRadius, 0, Math.sin(a) * ringRadius));
    }
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#22d0b2"),
        transparent: true,
        opacity: 0.55,
      }),
    );
  }, [ringRadius]);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += Math.min(delta, 0.05) * 0.22;
    const { x, y } = state.pointer;
    group.current.rotation.x += (y * 0.25 - group.current.rotation.x) * 0.04;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.05;
  });

  return (
    <group ref={group}>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#c3d2d6" transparent opacity={0.5} />
      </lineSegments>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[verts, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          sizeAttenuation
          color="#22d0b2"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      <primitive object={ring} rotation={[ringTilt, 0, 0.35]} />
    </group>
  );
}

export default function MissionObject({ seed }: { seed: string }) {
  const coarse =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  // Reduced motion and off-screen pausing are both decided by this one hook.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameloop = useSceneFrameloop(canvasRef);

  return (
    <Canvas
      ref={canvasRef}
      frameloop={frameloop}
      camera={{ position: [0, 0, 3.4], fov: 40 }}
      dpr={[1, coarse ? 1.4 : 2]}
      gl={{ antialias: !coarse, alpha: true, powerPreference: "low-power" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Form seed={seed} />
    </Canvas>
  );
}
