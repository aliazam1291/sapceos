"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import SatelliteModel from "./SatelliteModel";
import { WarmShaders } from "./useWarmShaders";
import { quietGL } from "@/lib/gl";
import { perf } from "@/lib/perf";

/**
 * The relay's own canvas: transparent, no fog, framed from front-right and a
 * little above so the dish, a wing and the beacon are all in the shot.
 * Shaders compile in parallel before the first frame (WarmShaders); the
 * owner pauses the loop when the object is off screen.
 */
export default function SatelliteScene({ paused }: { paused: boolean }) {
  const [warm, setWarm] = useState(false);
  return (
    <Canvas
      onCreated={(state) => {
        quietGL(state);
        state.camera.lookAt(0, 0.05, 0);
      }}
      frameloop={!warm || paused ? "never" : "always"}
      dpr={perf.level === "low" ? 1 : [1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      camera={{ position: [2.2, 1.0, 2.9], fov: 38, near: 0.1, far: 20 }}
      style={{ background: "transparent" }}
    >
      <SatelliteModel scale={0.8} />
      <WarmShaders onWarm={() => setWarm(true)} />
    </Canvas>
  );
}
