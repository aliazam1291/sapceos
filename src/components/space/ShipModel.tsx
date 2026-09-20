"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { shipEnvIfReady, warmShipEnv } from "./shipEnv";
import * as THREE from "three";
import { getGlowTexture } from "./glowTexture";

/*
 * The operator's ship — the model only.
 *
 * Geometry, materials and the engine state live here; how it flies is the
 * caller's business (Starship flies lead in the galaxy, Companion rides
 * along the whole site). One model, so the ship you meet on the home
 * flight is the ship in the corner of every other page.
 *
 * What makes it read as real rather than a toy: a painted, clear-coated
 * hull (real spacecraft are painted, not chromed, and clearcoat is what
 * paint looks like under a hard light); a procedural room environment so
 * the metal has something to reflect; panel seams and grime injected into
 * the PBR shader; a framed canopy; nozzle rings that glow; and nav lights.
 */

const HULL = "#4a5058"; // gunmetal, not paint
const HULL_DARK = "#22262c";
const HULL_EDGE = "#7b838d";
const EMERALD = "#3cdd9e";
const AMBER = "#ffb35a";

/*
 * An interceptor, built as planforms. Every part is a top-view Shape
 * extruded thin with a bevel, so each edge is a chamfer — that is what
 * puts facets and hard highlights on it. Nose is -Z. Proportions are the
 * ones that read as fast: a long needle, a narrow waist, a wide delta set
 * far back, fins canted out, everything swept.
 */
function planform(points: [number, number][], depth: number, bevel: number) {
  const sh = new THREE.Shape();
  points.forEach(([x, z], i) => (i === 0 ? sh.moveTo(x, z) : sh.lineTo(x, z)));
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, {
    depth,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel * 0.9,
    bevelSegments: 3,
  });
  g.rotateX(-Math.PI / 2);
  // The rotate above lands the shape's fore-aft (+y = aft) on -Z. Turn it
  // round so the nose is -Z, three's forward, and lookAt flies it nose-first.
  g.rotateY(Math.PI);
  g.translate(0, -depth / 2, 0);
  return g;
}

// Fuselage: needle nose, chined, a waist ahead of the wing, square tail.
const FUSELAGE = planform(
  [
    [0, -0.78],
    [0.03, -0.62],
    [0.075, -0.3],
    [0.09, -0.05],
    [0.1, 0.3],
    [0.085, 0.5],
    [-0.085, 0.5],
    [-0.1, 0.3],
    [-0.09, -0.05],
    [-0.075, -0.3],
    [-0.03, -0.62],
  ],
  0.07,
  0.04,
);
// Dorsal spine: the canopy sits on it; it tapers into the tail.
const SPINE = planform(
  [
    [0, -0.4],
    [0.05, -0.2],
    [0.055, 0.2],
    [0.035, 0.46],
    [-0.035, 0.46],
    [-0.055, 0.2],
    [-0.05, -0.2],
  ],
  0.045,
  0.03,
);
// Delta wing, one piece across the body, set far back, with a notch.
const WING = planform(
  [
    [0.08, -0.02],
    [0.66, 0.36],
    [0.68, 0.44],
    [0.56, 0.46],
    [0.3, 0.4],
    [0.12, 0.48],
    [-0.12, 0.48],
    [-0.3, 0.4],
    [-0.56, 0.46],
    [-0.68, 0.44],
    [-0.66, 0.36],
    [-0.08, -0.02],
  ],
  0.016,
  0.012,
);
// Canards: small forward wings by the cockpit.
const CANARD = planform(
  [
    [0.07, -0.34],
    [0.24, -0.22],
    [0.25, -0.18],
    [0.09, -0.2],
    [-0.09, -0.2],
    [-0.25, -0.18],
    [-0.24, -0.22],
    [-0.07, -0.34],
  ],
  0.012,
  0.008,
);
// Canted fins.
const FIN = planform(
  [
    [0, 0.2],
    [0.02, 0.2],
    [0.2, 0.4],
    [0.2, 0.47],
    [0.15, 0.49],
    [0, 0.49],
  ],
  0.012,
  0.008,
);
FIN.rotateZ(-Math.PI / 2); // after the nose flip, +x is mirrored: -90° stands it UP
// Canopy: low, long, dark.
const CANOPY = new THREE.SphereGeometry(0.05, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
// Engines: twin round-rect nozzles with a lit throat.
const NOZZLE = new THREE.CylinderGeometry(0.038, 0.046, 0.16, 8, 1, true);
NOZZLE.rotateX(Math.PI / 2);
const THROAT = new THREE.CircleGeometry(0.036, 16);
// Edge strips: thin emissive lines along the leading edges and the chine.
const STRIP = new THREE.BoxGeometry(1, 0.004, 0.006);
const MAST = new THREE.CylinderGeometry(0.003, 0.003, 0.08, 6);
const LIGHT = new THREE.SphereGeometry(0.006, 8, 8);
// Exhaust: an open cone pointing aft, additive, scaled by thrust. The sprite
// at the nozzle is the hot core; this is the visible jet behind it.
const PLUME = new THREE.ConeGeometry(0.028, 1, 18, 1, true);
// Landing gear: a strut hanging from y=0 and a foot. Scaled in y by the
// gear amount, so retracted it is inside the hull and extended it stands.
const STRUT = new THREE.CylinderGeometry(0.006, 0.007, 0.12, 6).translate(0, -0.06, 0);
const FOOT = new THREE.CylinderGeometry(0.022, 0.026, 0.008, 10).translate(0, -0.12, 0);

/*
 * The exploded view. Each part's offset, in the ship's frame, at full
 * dismantle: things come apart along the directions they were attached —
 * canopy up, wing down and aft, canards forward, fins out and up, engines
 * aft. Keyed by part; shipParts.ts uses the same keys to keep its markers
 * on the parts as they move.
 */
export const EXPLODE: Record<string, [number, number, number]> = {
  fuselage: [0, 0, 0],
  spine: [0, 0.3, 0],
  wing: [0, -0.28, 0.12],
  canard: [0, 0.26, -0.1],
  finL: [-0.3, 0.22, 0.08],
  finR: [0.3, 0.22, 0.08],
  canopy: [0, 0.38, -0.06],
  engines: [0, 0.1, 0.42],
  mast: [0, 0.3, 0.1],
  intakeL: [-0.22, -0.06, 0.05],
  intakeR: [0.22, -0.06, 0.05],
};
const GEAR: [number, number, number][] = [
  [0, -0.02, -0.45],
  [-0.14, -0.02, 0.2],
  [0.14, -0.02, 0.2],
];
PLUME.translate(0, -0.5, 0);
PLUME.rotateX(-Math.PI / 2);

function panelled<T extends THREE.MeshStandardMaterial>(mat: T, scale: number): T {
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjPos = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `#include <common>
        varying vec3 vObjPos;
        float gSeamH = 0.0;
        float ph(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float pn(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(ph(i), ph(i + vec2(1, 0)), f.x), mix(ph(i + vec2(0, 1)), ph(i + vec2(1, 1)), f.x), f.y);
        }`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        /* glsl */ `#include <roughnessmap_fragment>
        {
          vec2 q = vObjPos.zx * ${scale.toFixed(1)};
          float rowA = floor(q.y);
          vec2 a = vec2(q.x + ph(vec2(rowA, 1.0)) * 3.0, q.y);
          vec2 fa = abs(fract(a) - 0.5);
          float lineA = 1.0 - smoothstep(0.44, 0.5, max(fa.x, fa.y));
          vec2 b = q * 0.37 + 0.3;
          vec2 fb = abs(fract(b) - 0.5);
          float lineB = 1.0 - smoothstep(0.46, 0.5, max(fb.x, fb.y));
          float seams = max(lineA * 0.35, lineB * 0.55);
          float grime = pn(vec2(vObjPos.z * 6.0, vObjPos.x * 22.0 + vObjPos.y * 22.0)) * 0.5 + pn(vObjPos.zx * 30.0) * 0.5;
          grime = smoothstep(0.55, 0.9, grime) * 0.35;
          diffuseColor.rgb *= 1.0 - seams * 0.5 - grime * 0.5;
          roughnessFactor = clamp(roughnessFactor + grime * 0.6 + seams * 0.25, 0.0, 1.0);
          gSeamH = seams * 0.6 + grime * 0.2;
        }`,
      )
      // The seams are a height field; its screen-space gradient tilts the
      // normal, so specular breaks up along every panel edge and the flat
      // planes stop reading as flat. Cheap bump mapping with no texture.
      .replace(
        "#include <normal_fragment_maps>",
        /* glsl */ `#include <normal_fragment_maps>
        {
          float hx = dFdx(gSeamH);
          float hy = dFdy(gSeamH);
          normal = normalize(normal - (hx * vec3(1.0, 0.0, 0.0) + hy * vec3(0.0, 1.0, 0.0)) * 1.4);
        }`,
      );
  };
  mat.customProgramCacheKey = () => "panelled-" + scale;
  return mat;
}

export interface ShipHandle {
  group: THREE.Group | null;
  /**
   * Show or hide the airframe. Never set `group.visible` from a driver:
   * the group carries the ship's four lights, and three keys every lit
   * program in the scene on the visible light set — hiding the group
   * recompiled every material on the canvas, synchronously, and showing
   * it again recompiled them all back (2026-09-20, tools/progkeys-uat.mjs:
   * the Touchdown paid ~2 s twice; the boot pad the same). The lights stay;
   * only the meshes go.
   */
  setShown(on: boolean): void;
  /** 0 idle … 1 full burn; drives plume length and nozzle glow. */
  setThrust(v: number): void;
  /** 0 assembled … 1 fully dismantled (see EXPLODE). */
  setExplode(v: number): void;
  /** 0 retracted … 1 down and locked. */
  setGear(v: number): void;
}

interface ShipModelProps {
  /** Key light direction in the ship's local frame, set per frame by the driver. */
  keyDir?: THREE.Vector3;
  fillDir?: THREE.Vector3;
  /** The lens-side fill. The galaxy needs more of it than the page does. */
  fillIntensity?: number;
}

const ShipModel = forwardRef<ShipHandle, ShipModelProps>(function ShipModel({ keyDir, fillDir, fillIntensity = 0.5 }, ref) {
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const plumeL = useRef<THREE.Sprite>(null);
  const plumeR = useRef<THREE.Sprite>(null);
  const jetL = useRef<THREE.Mesh>(null);
  const jetR = useRef<THREE.Mesh>(null);
  const thrust = useRef(0);
  const explode = useRef(0);
  const gear = useRef(0);
  const parts = useRef<Record<string, THREE.Group | null>>({});
  const airframe = useRef<THREE.Group>(null);
  const engineLight = useRef<THREE.PointLight>(null);
  const gearRefs = useRef<(THREE.Group | null)[]>([]);
  const glow = getGlowTexture();
  const gl = useThree((s) => s.gl);

  // The environment map — see shipEnv.ts. Built once per renderer, off the
  // main thread's critical path; every ShipModel on a canvas shares it. It
  // used to be generated here in a useMemo, synchronously, per instance.
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

  // The four materials that carry the map are tagged so WarmShaders can
  // wait until the mapped set is in the scene before it compiles.
  const wantsEnv = <M extends THREE.Material>(m: M): M => {
    m.userData.wantsEnv = true;
    return m;
  };
  const hull = useMemo(
    () =>
      wantsEnv(
        panelled(
          new THREE.MeshPhysicalMaterial({
            color: HULL,
            metalness: 0.45,
            roughness: 0.42,
            clearcoat: 0.12,
            clearcoatRoughness: 0.5,
            envMap: env,
            envMapIntensity: 1.0,
          }),
          14,
        ),
      ),
    [env],
  );
  const hullDark = useMemo(
    () => wantsEnv(panelled(new THREE.MeshStandardMaterial({ color: HULL_DARK, metalness: 0.85, roughness: 0.35, envMap: env, envMapIntensity: 0.7 }), 20)),
    [env],
  );
  const edge = useMemo(() => wantsEnv(new THREE.MeshStandardMaterial({ color: HULL_EDGE, metalness: 0.7, roughness: 0.35, envMap: env, envMapIntensity: 0.6 })), [env]);
  const canopy = useMemo(
    () =>
      wantsEnv(
        new THREE.MeshPhysicalMaterial({
          color: "#16302a",
          metalness: 0.7,
          roughness: 0.05,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          emissive: EMERALD,
          emissiveIntensity: 0.1,
          transparent: true,
          opacity: 0.92,
          envMap: env,
          envMapIntensity: 1.4,
        }),
      ),
    [env],
  );
  const bell = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#151515", metalness: 0.6, roughness: 0.7, emissive: AMBER, emissiveIntensity: 0.9, side: THREE.DoubleSide }),
    [],
  );
  const ring = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0a0a0a", emissive: AMBER, emissiveIntensity: 1.6, roughness: 0.6 }), []);
  const jet = useMemo(
    () => new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    [],
  );
  const strip = useMemo(() => new THREE.MeshBasicMaterial({ color: "#3cdd9e", toneMapped: false }), []);
  const navRed = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ff5a4a" }), []);
  const navGreen = useMemo(() => new THREE.MeshBasicMaterial({ color: EMERALD }), []);
  const strobe = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff" }), []);

  useImperativeHandle(ref, () => ({
    get group() {
      return group.current;
    },
    setThrust(v: number) {
      thrust.current = THREE.MathUtils.clamp(v, 0, 1);
    },
    setExplode(v: number) {
      explode.current = THREE.MathUtils.clamp(v, 0, 1);
    },
    setGear(v: number) {
      gear.current = THREE.MathUtils.clamp(v, 0, 1);
    },
    setShown(on: boolean) {
      if (airframe.current) airframe.current.visible = on;
      // A hidden ship does not light the scene either — intensity is a
      // uniform, so this costs nothing.
      if (engineLight.current) engineLight.current.intensity = on ? 0.9 : 0;
    },
  }));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (light.current && keyDir) light.current.position.copy(keyDir).multiplyScalar(4);
    if (fill.current && fillDir) fill.current.position.copy(fillDir).multiplyScalar(4);

    // Engines: a flicker under a thrust envelope. Plumes stretch aft with burn.
    const f = 0.85 + Math.sin(t * 23.0) * 0.06 + Math.sin(t * 41.0 + 1.3) * 0.05;
    // Below a whisper the engines are off: no plume, nozzles dark.
    const off = thrust.current < 0.02;
    const burn = off ? 0 : 0.35 + thrust.current * 0.65;
    if (plumeL.current) plumeL.current.visible = !off;
    if (plumeR.current) plumeR.current.visible = !off;
    if (jetL.current) jetL.current.visible = !off;
    if (jetR.current) jetR.current.visible = !off;
    const w = 0.12 * f * (0.7 + burn * 0.6);
    const len = 0.12 * f * (0.4 + burn * 2.4);
    if (plumeL.current) plumeL.current.scale.set(w, w * 0.8, 1);
    if (plumeR.current) plumeR.current.scale.set(w * 0.98, w * 0.8, 1);
    if (jetL.current) jetL.current.scale.set(1, 1, len);
    if (jetR.current) jetR.current.scale.set(1, 1, len * 0.97);
    jet.opacity = 0.12 + burn * 0.3;
    bell.emissiveIntensity = (0.5 + f * 0.4) * (0.6 + burn);
    ring.emissiveIntensity = (1.0 + f * 0.6) * (0.5 + burn);
    strobe.opacity = Math.sin(t * 2.4) > 0.94 ? 1 : 0.12;
    strobe.transparent = true;

    // Dismantle: each part slides out along its own offset.
    const e = explode.current;
    for (const key in parts.current) {
      const g = parts.current[key];
      const o = EXPLODE[key];
      if (g && o) g.position.set(o[0] * e, o[1] * e, o[2] * e);
    }
    // The engine lamp rides the engines out (it lives outside the airframe
    // group, see setShown).
    if (engineLight.current) {
      const o = EXPLODE.engines;
      engineLight.current.position.set(o[0] * e, o[1] * e, o[2] * e + 0.62);
    }
    // Gear: the struts extend from inside the hull.
    const gr = gear.current;
    for (let i = 0; i < gearRefs.current.length; i++) {
      const g = gearRefs.current[i];
      if (!g) continue;
      g.visible = gr > 0.03;
      g.scale.set(1, Math.max(gr, 0.01), 1);
    }
  });
  const part = (key: string) => (el: THREE.Group | null) => {
    parts.current[key] = el;
  };

  return (
    <group ref={group}>
      {/* One sun, hard, casting. Fill is a whisper (planet-shine); rim is
          cool and from behind-above so the silhouette parts from black.
          Ambient is almost nothing — in vacuum, shadow is black. */}
      <directionalLight
        ref={light}
        intensity={4.2}
        color="#fff1d6"
        target={target}
        position={[2, 3, 2]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-1}
        shadow-camera-right={1}
        shadow-camera-top={1}
        shadow-camera-bottom={-1}
        shadow-camera-near={0.5}
        shadow-camera-far={9}
        shadow-bias={-0.0006}
        shadow-normalBias={0.01}
      />
      <directionalLight ref={fill} intensity={fillIntensity} color="#9fb8c0" target={target} position={[-2, 1, -3]} />
      <primitive object={target} />
      <hemisphereLight intensity={0.1} color="#5a7f88" groundColor="#050607" />
      {/* The engines light the tail: a warm point at the nozzles, short
          throw. Self-illumination is one of the strongest real-object cues.
          Outside the airframe group on purpose — see ShipHandle.setShown. */}
      <pointLight ref={engineLight} position={[0, 0.0, 0.62]} intensity={0.9} color={AMBER} distance={0.7} decay={2} />

      {/* Airframe — everything a driver may hide. */}
      <group ref={airframe}>
      <group ref={part("fuselage")}>
        <mesh geometry={FUSELAGE} material={hull} castShadow receiveShadow />
        {/* Landing gear, nose and two mains. */}
        {GEAR.map((g, i) => (
          <group
            key={i}
            position={g}
            ref={(el) => {
              gearRefs.current[i] = el;
            }}
          >
            <mesh geometry={STRUT} material={hullDark} castShadow />
            <mesh geometry={FOOT} material={hullDark} castShadow />
          </group>
        ))}
      </group>
      <group ref={part("spine")}>
        <mesh geometry={SPINE} material={hull} position={[0, 0.048, 0]} castShadow receiveShadow />
        {/* Lit edge strip down the chine. The one thing that says "this is
            from later than now". */}
        <mesh geometry={STRIP} material={strip} position={[0, 0.076, 0.1]} rotation={[0, Math.PI / 2, 0]} scale={[0.5, 1, 1]} />
        <mesh geometry={LIGHT} material={strobe} position={[0, 0.16, 0.44]} />
      </group>
      <group ref={part("wing")}>
        <mesh geometry={WING} material={hull} position={[0, -0.01, 0]} castShadow receiveShadow />
        {/* Nav lights: red port, green starboard. */}
        <mesh geometry={LIGHT} material={navRed} position={[-0.6, -0.01, 0.42]} />
        <mesh geometry={LIGHT} material={navGreen} position={[0.6, -0.01, 0.42]} />
      </group>
      <group ref={part("canard")}>
        <mesh geometry={CANARD} material={hull} position={[0, 0.012, 0]} castShadow receiveShadow />
      </group>
      <group ref={part("finL")}>
        <mesh geometry={FIN} material={hull} position={[-0.075, 0.055, 0]} rotation={[0, 0, 0.5]} castShadow receiveShadow />
      </group>
      <group ref={part("finR")}>
        <mesh geometry={FIN} material={hull} position={[0.075, 0.055, 0]} rotation={[0, 0, -0.5]} castShadow receiveShadow />
      </group>

      {/* Canopy and intakes */}
      <group ref={part("canopy")}>
        <mesh geometry={CANOPY} material={canopy} position={[0, 0.07, -0.3]} scale={[0.75, 0.55, 2.6]} />
      </group>
      {([-1, 1] as const).map((side) => (
        <group key={side} ref={part(side < 0 ? "intakeL" : "intakeR")}>
          <mesh material={hullDark} position={[side * 0.11, 0.0, 0.12]}>
            <boxGeometry args={[0.05, 0.036, 0.3]} />
          </mesh>
        </group>
      ))}

      <group ref={part("engines")}>
        {([-1, 1] as const).map((side) => (
          <group key={side} position={[side * 0.06, 0.0, 0.48]}>
            <mesh geometry={NOZZLE} material={hullDark} />
            <mesh geometry={THROAT} material={ring} position={[0, 0, 0.075]} />
          </group>
        ))}
        {glow && (
          <>
            <sprite ref={plumeL} position={[-0.06, 0, 0.58]}>
              <spriteMaterial map={glow} color={AMBER} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.6} />
            </sprite>
            <sprite ref={plumeR} position={[0.06, 0, 0.58]}>
              <spriteMaterial map={glow} color={AMBER} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.6} />
            </sprite>
            <mesh ref={jetL} geometry={PLUME} material={jet} position={[-0.06, 0, 0.57]} />
            <mesh ref={jetR} geometry={PLUME} material={jet} position={[0.06, 0, 0.57]} />
          </>
        )}
      </group>

      <group ref={part("mast")}>
        <mesh geometry={MAST} material={hullDark} position={[0, 0.1, 0.36]} />
      </group>
      </group>
    </group>
  );
});

export default ShipModel;
