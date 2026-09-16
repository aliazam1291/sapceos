"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
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
  /** 0 idle … 1 full burn; drives plume length and nozzle glow. */
  setThrust(v: number): void;
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
  const glow = getGlowTexture();
  const gl = useThree((s) => s.gl);

  // A space environment, not a studio: black, one hot sun, a faint cool
  // sky band. Reflections on the hull are then one hard highlight and a
  // lot of dark — which is what metal in vacuum looks like. RoomEnvironment
  // (bright walls all round) is what made it look like plastic.
  const env = useMemo(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#020304");
    const sun = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(14, 12, 9) }));
    sun.position.set(-6, 9, 8);
    scene.add(sun);
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(30, 24, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0.05, 0.08, 0.1), side: THREE.BackSide }),
    );
    sky.position.y = -22;
    scene.add(sky);
    const pmrem = new THREE.PMREMGenerator(gl);
    const tex = pmrem.fromScene(scene, 0.02).texture;
    pmrem.dispose();
    return tex;
  }, [gl]);

  const hull = useMemo(
    () =>
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
    [env],
  );
  const hullDark = useMemo(
    () => panelled(new THREE.MeshStandardMaterial({ color: HULL_DARK, metalness: 0.85, roughness: 0.35, envMap: env, envMapIntensity: 0.7 }), 20),
    [env],
  );
  const edge = useMemo(() => new THREE.MeshStandardMaterial({ color: HULL_EDGE, metalness: 0.7, roughness: 0.35, envMap: env, envMapIntensity: 0.6 }), [env]);
  const canopy = useMemo(
    () =>
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
  }));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (light.current && keyDir) light.current.position.copy(keyDir).multiplyScalar(4);
    if (fill.current && fillDir) fill.current.position.copy(fillDir).multiplyScalar(4);

    // Engines: a flicker under a thrust envelope. Plumes stretch aft with burn.
    const f = 0.85 + Math.sin(t * 23.0) * 0.06 + Math.sin(t * 41.0 + 1.3) * 0.05;
    const burn = 0.35 + thrust.current * 0.65;
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
  });

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

      {/* Airframe */}
      <mesh geometry={FUSELAGE} material={hull} castShadow receiveShadow />
      <mesh geometry={SPINE} material={hull} position={[0, 0.048, 0]} castShadow receiveShadow />
      <mesh geometry={WING} material={hull} position={[0, -0.01, 0]} castShadow receiveShadow />
      <mesh geometry={CANARD} material={hull} position={[0, 0.012, 0]} castShadow receiveShadow />
      <mesh geometry={FIN} material={hull} position={[-0.075, 0.055, 0]} rotation={[0, 0, 0.5]} castShadow receiveShadow />
      <mesh geometry={FIN} material={hull} position={[0.075, 0.055, 0]} rotation={[0, 0, -0.5]} castShadow receiveShadow />

      {/* Lit edge strips: emerald along the wing leading edges and down the
          chine. The one thing that says "this is from later than now". */}
      <mesh geometry={STRIP} material={strip} position={[0, 0.076, 0.1]} rotation={[0, Math.PI / 2, 0]} scale={[0.5, 1, 1]} />

      {/* Canopy and intakes */}
      <mesh geometry={CANOPY} material={canopy} position={[0, 0.07, -0.3]} scale={[0.75, 0.55, 2.6]} />
      {([-1, 1] as const).map((side) => (
        <mesh key={side} material={hullDark} position={[side * 0.11, 0.0, 0.12]}>
          <boxGeometry args={[0.05, 0.036, 0.3]} />
        </mesh>
      ))}

      {/* The engines light the tail: a warm point at the nozzles, short
          throw. Self-illumination is one of the strongest real-object cues. */}
      <pointLight position={[0, 0.0, 0.62]} intensity={0.9} color={AMBER} distance={0.7} decay={2} />
      {/* Engines */}
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

      <mesh geometry={MAST} material={hullDark} position={[0, 0.1, 0.36]} />

      {/* Nav lights: red port, green starboard, white strobe on the fin. */}
      <mesh geometry={LIGHT} material={navRed} position={[-0.6, -0.01, 0.42]} />
      <mesh geometry={LIGHT} material={navGreen} position={[0.6, -0.01, 0.42]} />
      <mesh geometry={LIGHT} material={strobe} position={[0, 0.16, 0.44]} />
    </group>
  );
});

export default ShipModel;
