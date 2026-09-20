"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { shipEnvIfReady, warmShipEnv } from "./shipEnv";
import { getGlowTexture } from "./glowTexture";

/*
 * The relay — a comms satellite in the ship's material language (2026-09-20).
 *
 * Ali: "we need more elements like the spaceship." The open channel is a
 * relay, so /contact gets one: a gunmetal bus wrapped in gold MLI foil, two
 * solar wings on booms, a gold dish on a mast that tracks slowly, a feed horn
 * on a tripod, one emerald beacon and a red nav lamp. Photoreal like the ship
 * (PBR, the same env map, the same key/fill/rim), faceted like the ship (boxes
 * and cones, no lathes), one warm accent (the foil) and one signal (the
 * beacon). It rotates on its own clock; nothing here reads the scroll.
 *
 * Lights live on the root group and are never hidden — see ShipHandle.setShown
 * for why a light that toggles recompiles every program on the canvas.
 */

const HULL = "#4a5058";
const HULL_DARK = "#22262c";
const FOIL = "#c9a24d";
const CELL = "#16304a";
const EMERALD = "#3cdd9e";
const RED = "#ff5a4a";

/** The solar cell grid, drawn once: dark cells, hairline seams, a faint sheen. */
function cellTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 96;
  const g = c.getContext("2d");
  if (!g) return null;
  g.fillStyle = "#0d1f33";
  g.fillRect(0, 0, 256, 96);
  const cols = 16;
  const rows = 6;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const w = 256 / cols;
      const h = 96 / rows;
      const shade = 0.85 + ((x * 7 + y * 13) % 5) * 0.04;
      g.fillStyle = `rgb(${Math.round(11 * shade)}, ${Math.round(30 * shade)}, ${Math.round(52 * shade)})`;
      g.fillRect(x * w + 1, y * h + 1, w - 2, h - 2);
    }
  }
  g.strokeStyle = "rgba(180, 210, 230, 0.35)";
  g.lineWidth = 1;
  for (let x = 0; x <= cols; x++) {
    g.beginPath();
    g.moveTo((x * 256) / cols + 0.5, 0);
    g.lineTo((x * 256) / cols + 0.5, 96);
    g.stroke();
  }
  for (let y = 0; y <= rows; y++) {
    g.beginPath();
    g.moveTo(0, (y * 96) / rows + 0.5);
    g.lineTo(256, (y * 96) / rows + 0.5);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Shared geometry — one satellite per canvas, but the module may mount more than once.
const BUS = new THREE.BoxGeometry(0.46, 0.46, 0.62);
const FOIL_A = new THREE.BoxGeometry(0.48, 0.3, 0.64);
const FOIL_B = new THREE.BoxGeometry(0.3, 0.48, 0.64);
const BOOM = new THREE.CylinderGeometry(0.014, 0.014, 0.32, 6);
const WING = new THREE.BoxGeometry(1.1, 0.018, 0.5);
const WING_FRAME = new THREE.BoxGeometry(1.14, 0.01, 0.54);
const DISH = new THREE.SphereGeometry(0.36, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2.9);
const DISH_MAST = new THREE.CylinderGeometry(0.012, 0.016, 0.34, 6);
const HORN = new THREE.ConeGeometry(0.035, 0.08, 8);
const STRUT = new THREE.CylinderGeometry(0.004, 0.004, 0.3, 4);
const MAST = new THREE.CylinderGeometry(0.008, 0.01, 0.42, 6);
const NOZZLE = new THREE.ConeGeometry(0.035, 0.06, 8, 1, true);
const LAMP = new THREE.SphereGeometry(0.018, 10, 8);

export default function SatelliteModel({ scale = 1 }: { scale?: number }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const dish = useRef<THREE.Group>(null);
  const beacon = useRef<THREE.Mesh>(null);
  const beaconGlow = useRef<THREE.Sprite>(null);
  const gl = useThree((s) => s.gl);

  const [env, setEnv] = useState<THREE.Texture | null>(() => shipEnvIfReady(gl));
  useEffect(() => {
    let live = true;
    warmShipEnv(gl).then((t) => {
      if (live) setEnv(t);
    });
    return () => {
      live = false;
    };
  }, [gl]);

  const wantsEnv = <M extends THREE.Material>(m: M): M => {
    m.userData.wantsEnv = true;
    return m;
  };
  const hull = useMemo(() => wantsEnv(new THREE.MeshPhysicalMaterial({ color: HULL, metalness: 0.5, roughness: 0.42, clearcoat: 0.1, clearcoatRoughness: 0.5, envMap: env, envMapIntensity: 0.9 })), [env]);
  const hullDark = useMemo(() => wantsEnv(new THREE.MeshStandardMaterial({ color: HULL_DARK, metalness: 0.8, roughness: 0.4, envMap: env, envMapIntensity: 0.6 })), [env]);
  const foil = useMemo(
    () => wantsEnv(new THREE.MeshPhysicalMaterial({ color: FOIL, metalness: 0.95, roughness: 0.32, clearcoat: 0.25, clearcoatRoughness: 0.35, envMap: env, envMapIntensity: 1.3 })),
    [env],
  );
  const foilInside = useMemo(() => {
    const m = foil.clone();
    m.side = THREE.BackSide;
    m.userData.wantsEnv = true;
    return m;
  }, [foil]);
  const cells = useMemo(() => cellTexture(), []);
  const cell = useMemo(() => wantsEnv(new THREE.MeshStandardMaterial({ color: CELL, map: cells ?? undefined, metalness: 0.6, roughness: 0.2, emissive: "#0a1a2c", emissiveIntensity: 0.6, envMap: env, envMapIntensity: 1.0 })), [env, cells]);
  const beaconMat = useMemo(() => new THREE.MeshBasicMaterial({ color: EMERALD, toneMapped: false }), []);
  const navMat = useMemo(() => new THREE.MeshBasicMaterial({ color: RED }), []);
  const glow = useMemo(() => getGlowTexture(), []);
  const target = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const r = root.current;
    const b = body.current;
    if (!r || !b) return;
    // A slow yaw on its own clock, a breath of pitch: a body holding station.
    b.rotation.y = t * 0.16;
    b.rotation.x = Math.sin(t * 0.21) * 0.06;
    b.rotation.z = Math.sin(t * 0.13 + 1.2) * 0.04;
    // The dish tracks: it counters the yaw so it keeps facing the lens, with
    // a slow hunt of its own.
    if (dish.current) {
      dish.current.rotation.y = -b.rotation.y + Math.sin(t * 0.3) * 0.25;
      dish.current.rotation.x = -0.35 + Math.sin(t * 0.17 + 0.6) * 0.1;
    }
    // Beacon: a short emerald pulse every 1.8 s.
    const on = (t % 1.8) < 0.12 ? 1 : 0.15;
    beaconMat.color.setHex(0x3cdd9e).multiplyScalar(on);
    if (beaconGlow.current) beaconGlow.current.material.opacity = on * 0.55;
    void dt;
  });

  return (
    <group ref={root} scale={scale}>
      {/* One sun, hard; a cool fill from the planet side; a whisper of ambient. */}
      <directionalLight intensity={4.4} color="#fff1d6" position={[2.5, 3, 2.5]} target={target} />
      <directionalLight intensity={0.7} color="#9fb8c0" position={[-3, -1, -2]} target={target} />
      <primitive object={target} />
      <hemisphereLight intensity={0.12} color="#5a7f88" groundColor="#050607" />

      <group ref={body}>
        {/* The bus, wrapped in foil on two faces. */}
        <mesh geometry={BUS} material={hull} />
        <mesh geometry={FOIL_A} material={foil} />
        <mesh geometry={FOIL_B} material={foil} />

        {/* Solar wings on booms, port and starboard. */}
        {([-1, 1] as const).map((side) => (
          <group key={side} position={[side * 0.23, 0, 0]}>
            <mesh geometry={BOOM} material={hullDark} rotation={[0, 0, Math.PI / 2]} position={[side * 0.16, 0, 0]} />
            <group position={[side * 0.87, 0, 0]} rotation={[0.22, 0, 0]}>
              <mesh geometry={WING_FRAME} material={hullDark} />
              <mesh geometry={WING} material={cell} position={[0, 0.006, 0]} />
              <mesh geometry={WING} material={cell} position={[0, -0.006, 0]} rotation={[Math.PI, 0, 0]} />
              {side > 0 ? <mesh geometry={LAMP} material={navMat} position={[0.56, 0.02, 0.24]} /> : null}
            </group>
          </group>
        ))}

        {/* The dish, on a mast above the bus, feed horn on a tripod. */}
        <group position={[0, 0.23, 0.1]}>
          <mesh geometry={DISH_MAST} material={hullDark} position={[0, 0.17, 0]} />
          <group ref={dish} position={[0, 0.36, 0]}>
            {/* A bowl: the cap's inside (BackSide, gold) faces the horn and the
                lens; a dark shell a hair larger is its back. */}
            <mesh geometry={DISH} material={foilInside} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.1]} />
            <mesh geometry={DISH} material={hullDark} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.104]} scale={[1.01, 1.01, 1.01]} />
            <mesh geometry={HORN} material={hullDark} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.2]} />
            {[0, 1, 2].map((i) => {
              const a = (i / 3) * Math.PI * 2;
              return <mesh key={i} geometry={STRUT} material={hullDark} position={[Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0.06]} rotation={[Math.PI / 2 + 0.4 * Math.sin(a), 0.4 * Math.cos(a), 0]} />;
            })}
          </group>
        </group>

        {/* Antenna mast with the beacon; two attitude nozzles aft. */}
        <group position={[0, -0.23, -0.16]}>
          <mesh geometry={MAST} material={hullDark} position={[0, -0.21, 0]} />
          <mesh ref={beacon} geometry={LAMP} material={beaconMat} position={[0, -0.43, 0]} />
          {glow ? (
            <sprite ref={beaconGlow} position={[0, -0.43, 0]} scale={[0.22, 0.22, 1]}>
              <spriteMaterial map={glow} color={EMERALD} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.4} />
            </sprite>
          ) : null}
        </group>
        {([-1, 1] as const).map((side) => (
          <mesh key={side} geometry={NOZZLE} material={hullDark} position={[side * 0.14, -0.14, -0.34]} rotation={[-Math.PI / 2, 0, 0]} />
        ))}
      </group>
    </group>
  );
}
