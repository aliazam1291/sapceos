"use client";

import { useEffect, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import ShipModel, { type ShipHandle } from "./ShipModel";
import Pad from "./Pad";
import { shipParts } from "./shipParts";
import { useSceneFrameloop } from "@/lib/use-scene-frameloop";
import { registerHeavyScene } from "@/lib/scene-load";

/*
 * Touchdown. The same ship that flew the page comes down onto a pad at
 * the end of it, engines flaring, settles, and its parts introduce the
 * operator one at a time (the markers are HTML, positioned here by
 * projecting each part through the camera every frame).
 *
 * The descent runs on a clock from `arrived`, not on the scrollbar, so a
 * fast scroller still watches it land. `onLanded` fires once it has.
 */

const SHIP_SCALE = 2.4;
const REST_Y = 0.07;
const _v = new THREE.Vector3();
const _look = new THREE.Vector3(0, -0.12, 0);

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

function Scene({
  arrived,
  active,
  markers,
  onLanded,
}: {
  arrived: boolean;
  active: number;
  markers: RefObject<(HTMLElement | null)[]>;
  onLanded: () => void;
}) {
  const ship = useRef<ShipHandle>(null);
  const t0 = useRef(-1);
  const landed = useRef(false);
  const lit = useRef(0.3);
  const tilt = useRef({ x: 0, z: 0 });
  const { camera, size } = useThree();

  useEffect(() => {
    camera.position.set(2.7, 1.7, 3.3);
    camera.lookAt(_look);
  }, [camera]);

  useFrame((state, dt) => {
    const g = ship.current?.group;
    if (!g) return;
    const t = state.clock.elapsedTime;

    if (!arrived) {
      // Holding high above the pad, engines lit, until the reader is here.
      g.position.set(0, 3.2, 0);
      g.visible = false;
      ship.current?.setThrust(0.6);
      return;
    }
    g.visible = true;
    if (t0.current < 0) t0.current = t;
    const p = Math.min((t - t0.current) / 2.8, 1);
    const e = easeOutCubic(p);

    // Descent: tall, then a flare as the engines fight the last metre.
    const y = REST_Y + (1 - e) * 3.0;
    const flare = p < 1 ? 0.35 + (1 - p) * 0.65 + Math.sin(t * 22) * 0.08 * (1 - p) : 0.06 + Math.sin(t * 1.3) * 0.02;
    ship.current?.setThrust(THREE.MathUtils.clamp(flare, 0, 1));
    const settle = p >= 1 ? Math.sin((t - t0.current - 2.8) * 6) * Math.exp(-(t - t0.current - 2.8) * 3) * 0.02 : 0;
    g.position.set(0, y + settle, 0);

    if (p >= 1 && !landed.current) {
      landed.current = true;
      onLanded();
    }

    // Nose to the reader's left, a little nose-up on the way down, then a
    // slow lean toward whichever part is speaking.
    const part = shipParts[active] ?? shipParts[0];
    const wantX = p < 1 ? 0.16 * (1 - p) : part.at[2] * 0.06;
    const wantZ = p < 1 ? 0 : -part.at[0] * 0.1;
    tilt.current.x += (wantX - tilt.current.x) * Math.min(dt * 1.5, 1);
    tilt.current.z += (wantZ - tilt.current.z) * Math.min(dt * 1.5, 1);
    g.rotation.set(tilt.current.x, 0.78 + Math.sin(t * 0.25) * 0.02, tilt.current.z);
    g.scale.setScalar(SHIP_SCALE);

    lit.current += ((p >= 1 ? 1 : 0.35) - lit.current) * Math.min(dt * 2, 1);

    // Project the parts to the HTML markers.
    g.updateMatrixWorld();
    const els = markers.current;
    if (els) {
      for (let i = 0; i < shipParts.length; i++) {
        const el = els[i];
        if (!el) continue;
        const a = shipParts[i].at;
        _v.set(a[0], a[1], a[2]).applyMatrix4(g.matrixWorld).project(camera);
        el.style.left = ((_v.x + 1) * 0.5 * size.width).toFixed(1) + "px";
        el.style.top = ((1 - _v.y) * 0.5 * size.height).toFixed(1) + "px";
      }
    }
  });

  return (
    <>
      <Pad radius={1.7} lit={arrived ? 0.9 : 0.3} />
      <ShipModel ref={ship} fillIntensity={0.9} />
    </>
  );
}

export default function LandingScene(props: {
  arrived: boolean;
  active: number;
  markers: RefObject<(HTMLElement | null)[]>;
  onLanded: () => void;
  host: RefObject<HTMLElement | null>;
}) {
  const frameloop = useSceneFrameloop(props.host, "10% 0px");
  useEffect(() => {
    if (frameloop !== "always") return;
    return registerHeavyScene();
  }, [frameloop]);

  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.5]}
      shadows="soft"
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      camera={{ fov: 30, near: 0.1, far: 40, position: [2.7, 1.7, 3.3] }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <Scene arrived={props.arrived} active={props.active} markers={props.markers} onLanded={props.onLanded} />
    </Canvas>
  );
}
