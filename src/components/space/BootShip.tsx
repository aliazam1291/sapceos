"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import ShipModel, { type ShipHandle } from "./ShipModel";
import Pad from "./Pad";

/*
 * The ship on the pad, for the launch sequence.
 *
 * The boot log runs beside it; the hold-to-launch ring is wired to the
 * engines — holding throttles them up, letting go lets them fall back —
 * and when the hold completes the ship lifts off the pad and climbs out
 * of frame as the screen opens onto the site. Same model as everywhere
 * else: this is the ship you then meet in the galaxy.
 */

type Drive = { fill: number; leaving: boolean; ready: boolean };

const _look = new THREE.Vector3(0, 0.25, 0);

function Scene({ drive }: { drive: React.RefObject<Drive> }) {
  const ship = useRef<ShipHandle>(null);
  const thrust = useRef(0.1);
  const lift = useRef(0);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(2.1, 1.1, 2.6);
    camera.lookAt(_look);
  }, [camera]);

  useFrame((state, dt) => {
    const g = ship.current?.group;
    const d = drive.current;
    if (!g || !d) return;
    const t = state.clock.elapsedTime;

    // Engines: idle flicker, then the hold throttles them up.
    const want = d.leaving ? 1 : 0.08 + d.fill * 0.85 + Math.sin(t * 9) * 0.02 * d.fill;
    thrust.current += (want - thrust.current) * Math.min(dt * 6, 1);
    ship.current?.setThrust(THREE.MathUtils.clamp(thrust.current, 0, 1));

    // Lift-off: a slow first metre, then away.
    if (d.leaving) lift.current += dt;
    const l = lift.current;
    const y = 0.07 + d.fill * 0.04 + (l > 0 ? l * l * 2.6 : 0);
    const shake = d.fill * 0.004;
    g.position.set((Math.random() - 0.5) * shake, y + (Math.random() - 0.5) * shake, l * l * -0.6);
    g.rotation.set(-l * 0.35 + d.fill * 0.02, 0.85 + Math.sin(t * 0.3) * 0.03, Math.sin(t * 0.7) * 0.01);
    g.scale.setScalar(2.2);

    // The camera drifts a touch so the pad reads as a place, not a still.
    camera.position.x = 2.1 + Math.sin(t * 0.18) * 0.1;
    camera.position.y = 1.1 + Math.sin(t * 0.23) * 0.04;
    camera.lookAt(_look);
  });

  return (
    <>
      <Pad radius={1.5} lit={0.35 + (drive.current?.fill ?? 0) * 0.6} />
      <ShipModel ref={ship} fillIntensity={0.8} />
    </>
  );
}

export default function BootShip({ fill, leaving, ready }: Drive) {
  const drive = useRef<Drive>({ fill, leaving, ready });
  drive.current.fill = fill;
  drive.current.leaving = leaving;
  drive.current.ready = ready;

  return (
    <Canvas
      dpr={1}
      shadows="soft"
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      camera={{ fov: 30, near: 0.1, far: 30, position: [2.1, 1.1, 2.6] }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <Scene drive={drive} />
    </Canvas>
  );
}
