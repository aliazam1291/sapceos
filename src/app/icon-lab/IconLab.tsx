"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import ShipModel, { type ShipHandle } from "@/components/space/ShipModel";
import SatelliteModel from "@/components/space/SatelliteModel";
import StarSystemNode from "@/components/space/StarSystemNode";
import Pad from "@/components/space/Pad";
import { GALAXY_NODES } from "@/components/space/galaxyData";
import { WarmShaders } from "@/components/space/useWarmShaders";
import { quietGL } from "@/lib/gl";

/** One transparent square canvas per object. `data-icon` is what the harness screenshots. */
function Stage({ name, camera, children, plain }: { name: string; camera: [number, number, number]; children: React.ReactNode; plain?: boolean }) {
  const [warm, setWarm] = useState(false);
  // The planet shaders do not report ready through compileAsync here; give
  // them a clock instead.
  useEffect(() => {
    if (!plain) return;
    const t = window.setTimeout(() => setWarm(true), 2500);
    return () => window.clearTimeout(t);
  }, [plain]);
  return (
    <div data-icon={name} data-ready={warm || undefined} style={{ width: 512, height: 512, background: "transparent" }}>
      <Canvas
        onCreated={(s) => {
          quietGL(s);
          s.camera.lookAt(0, 0, 0);
        }}
        frameloop={plain || warm ? "always" : "never"}
        dpr={2}
        shadows="percentage"
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1, preserveDrawingBuffer: true }}
        camera={{ position: camera, fov: 30, near: 0.1, far: 60 }}
        style={{ background: "transparent" }}
      >
        {children}
        {plain ? null : <WarmShaders onWarm={() => setWarm(true)} />}
      </Canvas>
    </div>
  );
}

/** Holds the ship still, three-quarter from front-above, gear up, engines lit. */
function ShipIcon({ gear = 0, thrust = 0.5, yaw = Math.PI + 0.7, pitch = 0.18 }: { gear?: number; thrust?: number; yaw?: number; pitch?: number }) {
  const ship = useRef<ShipHandle>(null);
  useFrame(() => {
    const g = ship.current?.group;
    if (!g) return;
    g.rotation.set(pitch, yaw, -0.12);
    g.scale.setScalar(1.8);
    ship.current?.setThrust(thrust);
    ship.current?.setGear(gear);
  });
  return <ShipModel ref={ship} fillIntensity={0.9} />;
}

/** A world from the galaxy, lit by one warm sun off to the upper left. */
function World({ id, size, at, eye }: { id: string; size: number; at: [number, number, number]; eye: [number, number, number] }) {
  const node = GALAXY_NODES.find((n) => n.id === id)!;
  const { camera } = useThree();
  // The planet shader lights every body from the galactic core at the
  // origin, so a body AT the origin has no sun direction and renders flat
  // white: park it out along an arm and look at it from there.
  useEffect(() => {
    camera.position.set(at[0] + eye[0], at[1] + eye[1], at[2] + eye[2]);
    camera.lookAt(at[0], at[1], at[2]);
  }, [camera, at, eye]);
  return (
    <group position={at} scale={size}>
      <StarSystemNode node={{ ...node, position: [0, 0, 0] }} isFocused={false} onSelect={() => {}} anyFocused compact />
    </group>
  );
}

export default function IconLab() {
  return (
    <main style={{ display: "flex", flexWrap: "wrap", gap: 24, padding: 24, background: "transparent" }}>
      <Stage name="ship" camera={[2.9, 1.2, 3.6]}>
        <ShipIcon />
      </Stage>
      <Stage name="ship-landed" camera={[2.6, 1.5, 3.4]}>
        <fog attach="fog" args={["#000000", 6, 14]} />
        <group position={[0, -0.25, 0]}>
          <Pad radius={1.4} lit={0.9} masts={false} />
          <group position={[0, 0.31, 0]}>
            <ShipIcon gear={1} thrust={0} yaw={Math.PI + 0.55} pitch={0} />
          </group>
        </group>
      </Stage>
      <Stage name="satellite" camera={[2.3, 1.1, 3.0]}>
        <SatelliteModel scale={0.95} />
      </Stage>
      <Stage name="giant" camera={[0, 0.9, 5.4]} plain>
        <ambientLight intensity={0.2} color="#7fa8b0" />
        <pointLight position={[0, 0, 0]} intensity={30} color="#ffe2b0" />
        <World id="hub-missions" size={1.15} at={[4, 0.6, 3]} eye={[-2.4, 1.0, -4.8]} />
      </Stage>
      <Stage name="world" camera={[0, 0.4, 3.4]} plain>
        <ambientLight intensity={0.18} color="#7fa8b0" />
        <pointLight position={[0, 0, 0]} intensity={30} color="#ffe2b0" />
        <World id="intouch" size={1.15} at={[4, 0.4, 3]} eye={[-0.62, 0.3, -1.45]} />
      </Stage>
    </main>
  );
}
