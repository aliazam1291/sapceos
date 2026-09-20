"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { WarmShaders } from "./useWarmShaders";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import ShipModel, { EXPLODE, type ShipHandle } from "./ShipModel";
import Pad from "./Pad";
import { getGlowTexture } from "./glowTexture";
import { shipParts } from "./shipParts";
import { useSceneFrameloop } from "@/lib/use-scene-frameloop";
import { registerHeavyScene } from "@/lib/scene-load";
import { perf } from "@/lib/perf";
import { quietGL } from "@/lib/gl";

/*
 * Touchdown. The same ship that flew the page comes down onto a pad at
 * the end of it — gear down over the last stretch, engines flaring, a
 * dust ring on contact, a settle — and its parts introduce the operator
 * (the markers are HTML, positioned here by projecting each part through
 * the camera every frame, so they ride the parts when the ship is
 * dismantled).
 *
 * The descent runs on a clock from `arrived`, not on the scrollbar, so a
 * fast scroller still watches it land. `onLanded` fires once it has.
 * `exploded` pulls the airframe apart along EXPLODE; the camera backs off
 * to hold the whole spread.
 */

const SHIP_SCALE = 2.15;
// Resting height: the gear feet (local y −0.14, ×scale) stand on the deck.
const REST_Y = 0.14 * 2.15;
const DESCENT_S = 3.2;
const _v = new THREE.Vector3();
// Off-centre: the ship sits right of middle so the caption owns the left.
const _look = new THREE.Vector3(-0.3, -0.1, 0);
const CAM_HOME = new THREE.Vector3(2.7, 1.7, 3.3);
const CAM_OPEN = new THREE.Vector3(3.9, 3.1, 4.7);
const _cam = new THREE.Vector3();
// The approach: in from high and far behind-right, curving down onto the
// pad, nose along the path, flaring at the end. A quadratic Bézier.
const P0 = new THREE.Vector3(3.0, 3.6, -2.6);
const P1 = new THREE.Vector3(1.1, 1.6, -0.8);
const P2 = new THREE.Vector3(0, REST_Y, 0);
const _pos = new THREE.Vector3();
const _next = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _qApproach = new THREE.Quaternion();
const _qRest = new THREE.Quaternion();
const _eRest = new THREE.Euler();
const NEG_Z = new THREE.Vector3(0, 0, -1);
function bez(t: number, out: THREE.Vector3) {
  const u = 1 - t;
  return out.set(0, 0, 0).addScaledVector(P0, u * u).addScaledVector(P1, 2 * u * t).addScaledVector(P2, t * t);
}

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

/* A ring of dust kicked out on contact: sprites pushed outward and fading. */
const DUST_N = 26;
function Dust({ fire }: { fire: RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const glow = getGlowTexture();
  const seeds = useMemo(
    () =>
      Array.from({ length: DUST_N }, (_, i) => ({
        a: (i / DUST_N) * Math.PI * 2 + Math.random() * 0.2,
        r: 0.7 + Math.random() * 0.5,
        s: 0.35 + Math.random() * 0.4,
        rise: 0.1 + Math.random() * 0.25,
      })),
    [],
  );
  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t0 = fire.current ?? -1;
    const age = t0 < 0 ? -1 : state.clock.elapsedTime - t0;
    g.visible = age >= 0 && age < 2.2;
    if (!g.visible) return;
    const k = age / 2.2;
    const e = easeOutCubic(k);
    g.children.forEach((c, i) => {
      const sd = seeds[i];
      const r = 0.25 + e * sd.r * 2.2;
      c.position.set(Math.cos(sd.a) * r, 0.02 + e * sd.rise, Math.sin(sd.a) * r);
      c.scale.setScalar(sd.s * (0.4 + e * 1.4));
      (c as THREE.Sprite).material.opacity = (1 - k) * (1 - k) * 0.28;
    });
  });
  return (
    <group ref={group} visible={false}>
      {seeds.map((_, i) => (
        <sprite key={i}>
          <spriteMaterial map={glow ?? undefined} color="#b9ad97" transparent depthWrite={false} opacity={0} />
        </sprite>
      ))}
    </group>
  );
}

/* A faint ground grid that fades into the fog: the pad sits on a place. */
function Ground() {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const n = 24;
    const step = 0.5;
    const half = (n * step) / 2;
    for (let i = 0; i <= n; i++) {
      const p = -half + i * step;
      pts.push(-half, 0, p, half, 0, p, p, 0, -half, p, 0, half);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geometry} position={[0, -0.01, 0]}>
      <lineBasicMaterial color="#3cdd9e" transparent opacity={0.07} depthWrite={false} />
    </lineSegments>
  );
}

function Scene({
  arrived,
  active,
  exploded,
  markers,
  pointer,
  onLanded,
}: {
  arrived: boolean;
  active: number;
  exploded: boolean;
  markers: RefObject<(HTMLElement | null)[]>;
  pointer: RefObject<{ x: number; y: number }>;
  onLanded: () => void;
}) {
  const ship = useRef<ShipHandle>(null);
  const t0 = useRef(-1);
  const landed = useRef(false);
  const dustAt = useRef(-1);
  const open = useRef(0);
  const tilt = useRef({ x: 0, z: 0 });
  const { camera, size } = useThree();

  useFrame((state, dt) => {
    const g = ship.current?.group;
    if (!g) return;
    const t = state.clock.elapsedTime;

    if (!arrived) {
      ship.current?.setShown(false);
      ship.current?.setThrust(0.6);
      return;
    }
    ship.current?.setShown(true);
    if (t0.current < 0) t0.current = t;
    const age = t - t0.current;
    const p = Math.min(age / DESCENT_S, 1);
    const e = easeOutCubic(p);

    // Descent along the approach curve, then a flare as the engines fight
    // the last metre; the gear comes down through the middle of it.
    bez(e, _pos);
    bez(Math.min(e + 0.02, 1), _next);
    // Engines: a flare on the way down, then shut down within a second of
    // contact — a parked ship does not idle its mains.
    const flare = p < 1 ? 0.35 + (1 - p) * 0.65 + Math.sin(t * 22) * 0.08 * (1 - p) : Math.max(0, 0.4 - (age - DESCENT_S) * 0.5);
    ship.current?.setThrust(THREE.MathUtils.clamp(flare, 0, 1));
    ship.current?.setGear(THREE.MathUtils.smoothstep(p, 0.35, 0.75));
    const settle = p >= 1 ? Math.sin((age - DESCENT_S) * 7) * Math.exp(-(age - DESCENT_S) * 3.5) * 0.03 : 0;
    g.position.set(_pos.x, _pos.y + settle, _pos.z);

    if (p >= 1 && !landed.current) {
      landed.current = true;
      dustAt.current = t;
      window.dispatchEvent(new CustomEvent("space:sfx", { detail: "land" }));
      onLanded();
    }

    // Dismantle: the parts ease out; the camera backs off to hold them.
    open.current += ((exploded ? 1 : 0) - open.current) * Math.min(dt * 2.2, 1);
    const o = (1 - Math.cos(open.current * Math.PI)) / 2;
    ship.current?.setExplode(o);

    // Nose to the reader's left, nose-up on the way down, then a slow lean
    // toward whichever part is speaking (not while dismantled — the spread
    // should hold still so the eye can read it).
    const part = shipParts[active] ?? shipParts[0];
    const wantX = p < 1 ? 0 : part.at[2] * 0.06 * (1 - o);
    const wantZ = p < 1 ? 0 : -part.at[0] * 0.1 * (1 - o);
    tilt.current.x += (wantX - tilt.current.x) * Math.min(dt * 1.5, 1);
    tilt.current.z += (wantZ - tilt.current.z) * Math.min(dt * 1.5, 1);
    // Rest attitude (the walkaround), and the approach attitude: nose along
    // the path with a flare that grows toward touchdown. The last quarter of
    // the descent turns the ship from the path onto its parking heading.
    _eRest.set(tilt.current.x, 0.78 + Math.sin(t * 0.25) * 0.02 + o * 0.1, tilt.current.z);
    _qRest.setFromEuler(_eRest);
    _dir.subVectors(_next, _pos);
    if (_dir.lengthSq() < 1e-8) _dir.set(-0.5, -0.4, 0.4);
    _dir.normalize();
    _qApproach.setFromUnitVectors(NEG_Z, _dir);
    const blend = THREE.MathUtils.smoothstep(p, 0.72, 1);
    g.quaternion.slerpQuaternions(_qApproach, _qRest, blend);
    // Flare: nose up as it arrives, gone once it is down.
    g.rotateX(0.32 * THREE.MathUtils.smoothstep(p, 0.3, 0.85) * (1 - blend));
    g.scale.setScalar(SHIP_SCALE);

    // Camera: a slow drift once down, a glance with the pointer, and a
    // step back for the exploded view.
    const pt = pointer.current ?? { x: 0, y: 0 };
    _cam.lerpVectors(CAM_HOME, CAM_OPEN, o);
    const drift = p >= 1 ? 1 : 0;
    _cam.x += Math.sin(t * 0.12) * 0.18 * drift + pt.x * 0.25;
    _cam.y += Math.sin(t * 0.17) * 0.06 * drift + pt.y * 0.12;
    camera.position.lerp(_cam, Math.min(dt * 2, 1));
    _v.copy(_look);
    _v.y += o * 0.38;
    camera.lookAt(_v);

    // Project the parts to the HTML markers (riding their exploded offsets).
    g.updateMatrixWorld();
    const els = markers.current;
    if (els) {
      for (let i = 0; i < shipParts.length; i++) {
        const el = els[i];
        if (!el) continue;
        const a = shipParts[i].at;
        const off = EXPLODE[shipParts[i].part] ?? [0, 0, 0];
        _v.set(a[0] + off[0] * o, a[1] + off[1] * o, a[2] + off[2] * o).applyMatrix4(g.matrixWorld).project(camera);
        el.style.left = ((_v.x + 1) * 0.5 * size.width).toFixed(1) + "px";
        el.style.top = ((1 - _v.y) * 0.5 * size.height).toFixed(1) + "px";
      }
    }
  });

  return (
    <>
      <fog attach="fog" args={["#030303", 5, 13]} />
      <Ground />
      <Pad radius={1.7} lit={arrived ? 0.9 : 0.3} />
      <Dust fire={dustAt} />
      {/* A cool rim from behind-above parts the hull from the black; a
          floodlight over the pad gives the top surfaces something to catch. */}
      <directionalLight position={[-3, 2.5, -4]} intensity={1.6} color="#7fd6c8" />
      <spotLight position={[0, 6, 0.5]} angle={0.5} penumbra={0.8} intensity={14} color="#e8fff4" distance={12} decay={2} />
      <ShipModel ref={ship} fillIntensity={0.9} />
    </>
  );
}

export default function LandingScene(props: {
  arrived: boolean;
  active: number;
  exploded: boolean;
  markers: RefObject<(HTMLElement | null)[]>;
  pointer: RefObject<{ x: number; y: number }>;
  onLanded: () => void;
  host: RefObject<HTMLElement | null>;
}) {
  const frameloop = useSceneFrameloop(props.host, "10% 0px");
  // Nothing draws until the shaders have compiled in parallel (WarmShaders).
  const [warm, setWarm] = useState(false);
  useEffect(() => {
    if (frameloop !== "always") return;
    return registerHeavyScene();
  }, [frameloop]);

  return (
    <Canvas
      onCreated={quietGL}
      frameloop={warm ? frameloop : "never"}
      dpr={perf.level === "low" ? 1 : [1, 1.25]}
      // "percentage" = PCFShadowMap, not R3F's PCFSoft default — see BootShip.
      shadows={perf.level !== "low" ? "percentage" : false}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      camera={{ fov: 30, near: 0.1, far: 40, position: [2.7, 1.7, 3.3] }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <Scene
        arrived={props.arrived}
        active={props.active}
        exploded={props.exploded}
        markers={props.markers}
        pointer={props.pointer}
        onLanded={props.onLanded}
      />
      <WarmShaders onWarm={() => setWarm(true)} />
    </Canvas>
  );
}
