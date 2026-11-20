"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import ShipModel, { type ShipHandle } from "./ShipModel";
import Pad from "./Pad";
import { decidePerfLevel, perf } from "@/lib/perf";
import { WarmShaders } from "./useWarmShaders";
import { quietGL } from "@/lib/gl";

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

// The ship sits right of centre; the HUD owns the left.
const _look = new THREE.Vector3(-0.55, 0.35, 0);
const CAM = new THREE.Vector3(3.0, 1.35, 3.4);

function Scene({ drive }: { drive: React.RefObject<Drive> }) {
  const ship = useRef<ShipHandle>(null);
  const thrust = useRef(0.1);
  const lift = useRef(0);
  const { camera, invalidate } = useThree();

  useEffect(() => {
    camera.position.copy(CAM);
    camera.lookAt(_look);
  }, [camera]);

  /*
   * Demand-driven (2026-09-19). The ship on the pad is a slow drift — the
   * camera sways, the engines flicker — and it was drawing at full rate,
   * with shadows, for the whole launch sequence on every first visit. On
   * the mobile audit that one scene was ~30 s of blocked main thread.
   * Idle it draws at 24 fps (30 on a high level); the hold and the
   * lift-off go to full rate, so the part the reader is watching closely
   * is smooth.
   */
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const level = decidePerfLevel();
    /*
     * No GPU (2026-11-19). On a software rasteriser — SwiftShader on
     * PageSpeed's servers — one frame of this scene is ~200 ms of blocked
     * main thread, so "24 fps idle" was really ~5 fps and every frame a long
     * task: 46 frames in the first ten seconds, the whole of the home page's
     * 8.5 s Total Blocking Time there. Idle on the pad nothing travels (a
     * camera sway of a few centimetres, an engine flicker), so without a GPU
     * it is drawn twice a second. The hold and the lift-off still draw every
     * frame, and with a GPU nothing here changes.
     */
    const idleEvery = perf.software ? 500 : level === "high" ? 33 : 42;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const d = drive.current;
      const busy = (d?.fill ?? 0) > 0 || d?.leaving;
      const interval = busy ? 0 : idleEvery;
      if (now - last >= interval) {
        last = now;
        invalidate();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [drive, invalidate]);

  const announced = useRef(false);
  useFrame((state, dt) => {
    const g = ship.current?.group;
    const d = drive.current;
    if (!g || !d) return;
    const t = state.clock.elapsedTime;
    // First frame with the ship on the pad: the launch screen's "ship on
    // the pad" milestone.
    if (!announced.current) {
      announced.current = true;
      window.dispatchEvent(new Event("space:pad"));
    }

    // Engines: idle flicker, then the hold throttles them up.
    const want = d.leaving ? 1 : 0.08 + d.fill * 0.85 + Math.sin(t * 9) * 0.02 * d.fill;
    thrust.current += (want - thrust.current) * Math.min(dt * 6, 1);
    ship.current?.setThrust(THREE.MathUtils.clamp(thrust.current, 0, 1));

    // Lift-off: a slow first metre, then away.
    if (d.leaving) lift.current += dt;
    const l = lift.current;
    // Gear down on the pad; it comes up as the ship climbs.
    ship.current?.setGear(Math.max(0, 1 - l * 1.5));
    const y = 0.31 + d.fill * 0.04 + (l > 0 ? l * l * 2.6 : 0);
    const shake = d.fill * 0.004;
    g.position.set((Math.random() - 0.5) * shake, y + (Math.random() - 0.5) * shake, l * l * -0.6);
    // Nose toward the lens, front three-quarter; climbing out it pitches up.
    g.rotation.set(0, Math.PI + 0.55 + Math.sin(t * 0.3) * 0.02, Math.sin(t * 0.7) * 0.01);
    g.rotateX(l * 0.4 + d.fill * 0.02);
    g.scale.setScalar(2.2);

    // The camera drifts a touch so the pad reads as a place, not a still.
    camera.position.x = CAM.x + Math.sin(t * 0.18) * 0.1;
    camera.position.y = CAM.y + Math.sin(t * 0.23) * 0.04;
    // The hold pulls the lens in a touch; lift-off lets it fall back.
    camera.position.z = CAM.z - d.fill * 0.25 + l * 0.6;
    camera.lookAt(_look);
  });

  return (
    <>
      <fog attach="fog" args={["#030303", 4.5, 11]} />
      <Pad radius={1.6} lit={0.35 + (drive.current?.fill ?? 0) * 0.6} />
      {/* A cool rim from behind so the silhouette parts from the black. */}
      <directionalLight position={[-3, 2.5, -4]} intensity={1.4} color="#7fd6c8" />
      <ShipModel ref={ship} fillIntensity={0.9} />
    </>
  );
}

export default function BootShip({ fill, leaving, ready }: Drive) {
  const drive = useRef<Drive>({ fill, leaving, ready });
  // Nothing draws until the shaders have compiled in parallel (WarmShaders).
  const [warm, setWarm] = useState(false);
  const level = decidePerfLevel();
  drive.current.fill = fill;
  drive.current.leaving = leaving;
  drive.current.ready = ready;

  return (
    <Canvas
      onCreated={(state) => {
        quietGL(state);
        /*
         * R3F calls forceContextLoss() when this canvas unmounts at the end
         * of the launch. On a software rasteriser that single call blocked
         * the main thread for 3.8 s (CPU profile, SwiftShader, 2026-11-19).
         * Without a GPU the context is left for the browser to collect with
         * the canvas; with a GPU the call is instant and stays.
         */
        if (perf.software) state.gl.forceContextLoss = () => {};
      }}
      dpr={1}
      frameloop={warm ? "demand" : "never"}
      // A shadow pass doubles the draw; only where the frame is cheap.
      // "percentage" = PCFShadowMap, named on purpose (2026-09-20): R3F's
      // default for `shadows` is PCFSoftShadowMap, which three r185 swaps
      // for PCF on the first shadow pass — and the swap changes every lit
      // program's cache key, so the whole scene compiled again, synchronously,
      // one frame after the warm-up (tools/progkeys-uat.mjs).
      shadows={level === "high" ? "percentage" : false}
      // MSAA on a software rasteriser multiplies the per-frame cost; a GPU keeps it.
      gl={{ antialias: !perf.software, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      camera={{ fov: 32, near: 0.1, far: 30, position: [3.0, 1.35, 3.4] }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <Scene drive={drive} />
      <WarmShaders onWarm={() => setWarm(true)} />
    </Canvas>
  );
}
