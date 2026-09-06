"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneFrameloop } from "@/lib/use-scene-frameloop";

export type OrbitBody = {
  label: string;
  radius: number;
  period: number;
  offset: number;
  tilt: number;
};

/** A ring of line segments — an orbit path, drawn once and reused. */
function OrbitRing({ radius, tilt, lit }: { radius: number; tilt: number; lit: boolean }) {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  const line = useMemo(
    () =>
      new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: new THREE.Color(lit ? "#22d0b2" : "#f5f5f5"),
          transparent: true,
          opacity: lit ? 0.4 : 0.12,
        }),
      ),
    [geometry, lit],
  );

  return <primitive object={line} rotation={[tilt, 0, 0]} />;
}

function Body({ body, lit }: { body: OrbitBody; lit: boolean }) {
  const pivot = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!pivot.current) return;
    const t = state.clock.elapsedTime;
    pivot.current.rotation.y = ((t + body.offset) / body.period) * Math.PI * 2;
  });

  return (
    <group rotation={[body.tilt, 0, 0]}>
      <group ref={pivot}>
        <mesh position={[body.radius, 0, 0]}>
          <octahedronGeometry args={[lit ? 0.085 : 0.058, 0]} />
          <meshBasicMaterial color={lit ? "#22d0b2" : "#f5f5f5"} />
        </mesh>
        {/* A short trailing arc, so motion reads even in a still frame. */}
        <mesh position={[body.radius, 0, 0]}>
          <octahedronGeometry args={[lit ? 0.17 : 0.12, 0]} />
          <meshBasicMaterial
            color={lit ? "#22d0b2" : "#f5f5f5"}
            transparent
            opacity={0.14}
          />
        </mesh>
      </group>
    </group>
  );
}

function System({ bodies }: { bodies: OrbitBody[] }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.06;
    // Lean toward the pointer, clamped so it never tips past readable.
    const { x, y } = state.pointer;
    group.current.rotation.x += (y * 0.3 + 0.38 - group.current.rotation.x) * 0.04;
    group.current.rotation.z += (x * 0.08 - group.current.rotation.z) * 0.04;
  });

  return (
    <group ref={group} rotation={[0.38, 0, 0]}>
      {/* The core: what everything here is actually orbiting. */}
      <mesh>
        <icosahedronGeometry args={[0.15, 1]} />
        <meshBasicMaterial color="#22d0b2" wireframe />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshBasicMaterial color="#22d0b2" transparent opacity={0.09} />
      </mesh>

      {bodies.map((body, i) => (
        <group key={body.label}>
          <OrbitRing radius={body.radius} tilt={body.tilt} lit={i === 0} />
          <Body body={body} lit={i === 0} />
        </group>
      ))}
    </group>
  );
}

export default function OrbitScene({ bodies }: { bodies: OrbitBody[] }) {
  const coarse =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  // Reduced motion and off-screen pausing are both decided by this one hook.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameloop = useSceneFrameloop(canvasRef);

  return (
    <Canvas
      ref={canvasRef}
      frameloop={frameloop}
      camera={{ position: [0, 1.5, 4.2], fov: 40 }}
      dpr={[1, coarse ? 1.5 : 2]}
      gl={{ antialias: !coarse, alpha: true, powerPreference: "low-power" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <System bodies={bodies} />
    </Canvas>
  );
}
