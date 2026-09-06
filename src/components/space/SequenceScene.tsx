"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { damp } from "@/lib/scroll-signal";
import { activeBeat, beatRange, BEATS, sequence } from "@/lib/sequence";
import { useSceneFrameloop } from "@/lib/use-scene-frameloop";

/**
 * The body the cinematic sequence flies around.
 *
 * Deliberately GEOMETRIC rather than a dotted sphere: an icosahedron rendered
 * as its own edges, with lit vertex nodes. A dot-sphere reads as a ball — a
 * faceted wireframe reads as an instrument, which is the register this site is
 * written in. Orbits are true inclined ellipses with a bright arc trailing each
 * satellite, not flat rings of points.
 *
 * Everything is procedural: no glTF, no textures, zero asset bytes.
 */

const R = 1;
const ACCENT = "#22d0b2";

/* ── Atmosphere ───────────────────────────────────────────────────────────── */

const atmoVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const atmoFrag = /* glsl */ `
  precision mediump float;
  uniform vec3  uColor;
  uniform float uIntensity;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vView)));
    gl_FragColor = vec4(uColor, pow(clamp(rim, 0.0, 1.0), uPower) * uIntensity);
  }
`;

/**
 * Rim light on the hull.
 *
 * The shell has to be the SAME SOLID as the body. It used to be a smooth
 * sphere: an icosahedron's faces sit at 0.795 of its circumradius, so a sphere
 * at scale 1.0 bulges up to 20% past every flat face and the "atmosphere"
 * rendered as a thick teal crescent bolted to one side of the hull — the exact
 * glow-sticker look the direction rules out. Following the facets instead means
 * the light catches the polyhedron's own silhouette edges, which is what a
 * faceted body should do.
 */
function Atmosphere({
  detail,
  scale,
  intensity,
  power,
}: {
  detail: number;
  scale: number;
  intensity: number;
  power: number;
}) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(ACCENT) },
      uIntensity: { value: intensity },
      uPower: { value: power },
    }),
    [intensity, power],
  );

  return (
    <mesh scale={scale}>
      <icosahedronGeometry args={[R, detail]} />
      <shaderMaterial
        vertexShader={atmoVert}
        fragmentShader={atmoFrag}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ── Faceted body ─────────────────────────────────────────────────────────── */

function FacetedBody({ detail }: { detail: number }) {
  // One icosahedron drives three passes: a solid occluder in the page colour,
  // its own edge wireframe, and a lit point at every vertex. Sharing the source
  // geometry keeps the three perfectly registered.
  const { edges, verts } = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(R, detail);
    const e = new THREE.EdgesGeometry(geo, 1);
    const v = new Float32Array(geo.getAttribute("position").array as Float32Array);
    return { edges: e, verts: v };
  }, [detail]);

  return (
    <group>
      {/* Occluder hides the far side so the hull reads as a body. Inset very
          slightly so it never z-fights the wireframe sitting on the surface. */}
      <mesh scale={0.994}>
        <icosahedronGeometry args={[R, detail]} />
        <meshBasicMaterial color="#060809" />
      </mesh>

      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#c3d2d6" transparent opacity={0.55} />
      </lineSegments>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[verts, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.022}
          sizeAttenuation
          color={ACCENT}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/* ── Orbits ───────────────────────────────────────────────────────────────── */

const SEG = 240;

/**
 * One inclined elliptical orbit: the full path drawn faintly, a bright arc
 * trailing the satellite, and an octahedron riding the ellipse.
 *
 * The trailing arc is what makes an orbit read as motion rather than as
 * decoration — a static ring with a dot on it always looks like clip art.
 */
function Orbit({
  a,
  b,
  tilt,
  speed,
  trail = 46,
  nodeSize = 0.032,
}: {
  a: number;
  b: number;
  tilt: [number, number, number];
  speed: number;
  trail?: number;
  nodeSize?: number;
}) {
  const sat = useRef<THREE.Mesh>(null);
  const arc = useRef<THREE.Line>(null);
  const t = useRef(Math.random() * Math.PI * 2);

  const path = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= SEG; i++) {
      const th = (i / SEG) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(th) * a, 0, Math.sin(th) * b));
    }
    return pts;
  }, [a, b]);

  const fullGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(path), [path]);

  // The trail is a rolling window into a DUPLICATED path, so the visible arc can
  // cross the seam without rebuilding geometry on every frame.
  const trailGeo = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(path.concat(path)),
    [path],
  );

  const trailMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
      }),
    [],
  );

  // Per-vertex colour ramp across one trail window, repeated for the duplicated
  // path. Index within the window maps to brightness, so wherever the draw
  // range lands the arc is dim at its tail and hot at its head.
  const trailColors = useMemo(() => {
    const n = trailGeo.getAttribute("position").count;
    const arr = new Float32Array(n * 3);
    const head = new THREE.Color("#c7fff2");
    const mid = new THREE.Color(ACCENT);
    const tmp = new THREE.Color();
    for (let i = 0; i < n; i++) {
      // Position within the current trail window, 0 at the tail, 1 at the head.
      const t = (i % trail) / Math.max(trail - 1, 1);
      const eased = t * t;
      tmp.copy(mid).lerp(head, eased);
      arr[i * 3] = tmp.r * eased;
      arr[i * 3 + 1] = tmp.g * eased;
      arr[i * 3 + 2] = tmp.b * eased;
    }
    return arr;
  }, [trailGeo, trail]);

  const trailLine = useMemo(() => {
    trailGeo.setAttribute("color", new THREE.BufferAttribute(trailColors, 3));
    return new THREE.Line(trailGeo, trailMat);
  }, [trailGeo, trailMat, trailColors]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    t.current += dt * speed;
    const th = t.current;

    if (sat.current) {
      sat.current.position.set(Math.cos(th) * a, 0, Math.sin(th) * b);
      sat.current.rotation.y += dt * 1.4;
      sat.current.rotation.x += dt * 0.9;
    }

    if (arc.current) {
      const norm = ((th % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const head = Math.floor((norm / (Math.PI * 2)) * SEG) + SEG;
      arc.current.geometry.setDrawRange(head - trail, trail);
    }
  });

  return (
    <group rotation={tilt}>
      <line>
        <primitive object={fullGeo} attach="geometry" />
        <lineBasicMaterial color={ACCENT} transparent opacity={0.3} />
      </line>

      <primitive object={trailLine} ref={arc} />

      <mesh ref={sat}>
        <octahedronGeometry args={[nodeSize, 0]} />
        <meshBasicMaterial color={ACCENT} />
      </mesh>
    </group>
  );
}

/* ── Rig ──────────────────────────────────────────────────────────────────── */

function Rig({ detail, coarse }: { detail: number; coarse: boolean }) {
  const world = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);

  /*
   * One camera keyframe per beat, plus a rest key the last beat settles into.
   *
   * Two things were wrong before.
   *
   * The mapping: progress was spread across `keys.length - 1` = 3 intervals
   * while the copy switches on `floor(p * 4)` = 4 buckets. Those never line up,
   * so by the time you had finished reading "01 — approach" the camera was
   * already 72% of the way into the orbit-insertion framing. The copy and the
   * picture were describing different moments for the whole section. Beats now
   * drive the camera directly, through the same `activeBeat`/`beatRange` pair
   * the copy uses.
   *
   * The framing: at z 6.2 the body already filled ~65% of the viewport height
   * on the FIRST beat, and 2.5 put the camera almost on the surface. A headline
   * cannot compete with that — the section read as a wireframe ball with some
   * text parked beside it. Pulled back so the widest beat is a distant object
   * and the closest pass is the payoff, instead of every beat being close.
   */
  const keys = useMemo(
    () => [
      { z: 8.6, y: 0.62, tilt: 0.34 }, // 01 approach — a body in the distance
      { z: 6.4, y: 0.18, tilt: 0.16 }, // 02 orbit insertion
      { z: 4.8, y: -0.3, tilt: -0.1 }, // 03 surface scan — the close pass
      { z: 5.8, y: 0.24, tilt: 0.22 }, // 04 handoff — pulling back out
      { z: 6.6, y: 0.34, tilt: 0.28 }, // rest, so beat 04 keeps drifting
    ],
    [],
  );

  const s = useRef({ z: keys[0].z, y: keys[0].y, tilt: keys[0].tilt });

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = Math.min(Math.max(sequence.p, 0), 1);

    const i = activeBeat(p);
    const t = beatRange(p, i);
    const A = keys[i];
    const B = keys[Math.min(i + 1, BEATS)];

    s.current.z = damp(s.current.z, A.z + (B.z - A.z) * t, 3, dt);
    s.current.y = damp(s.current.y, A.y + (B.y - A.y) * t, 3, dt);
    s.current.tilt = damp(s.current.tilt, A.tilt + (B.tilt - A.tilt) * t, 3, dt);

    camera.position.set(0, s.current.y, s.current.z);
    camera.lookAt(0, 0, 0);

    if (body.current) body.current.rotation.y += dt * 0.075;
    if (world.current) world.current.rotation.x = s.current.tilt;
  });

  return (
    <group ref={world}>
      <group ref={body} rotation={[0.32, 0, 0.16]}>
        <FacetedBody detail={detail} />
        {/* One tight rim only. The second shell at 1.16 with a soft power was
            not reading as atmosphere — it drew a hard teal crescent hugging one
            side of the hull, which is the "glow sticker" look the direction
            rules out. */}
        <Atmosphere detail={detail} scale={1.02} intensity={0.5} power={3.2} />
      </group>

      {/* Three orbits at genuinely different inclinations and eccentricities —
          a set of concentric circles is what makes orbit diagrams look fake. */}
      <Orbit a={1.62} b={1.44} tilt={[0.38, 0, 0.28]} speed={0.55} />
      <Orbit a={2.15} b={1.86} tilt={[-0.42, 0.5, -0.34]} speed={-0.36} nodeSize={0.026} />
      {coarse ? null : (
        <Orbit a={2.72} b={2.6} tilt={[1.24, 0, 0.1]} speed={0.24} trail={64} nodeSize={0.022} />
      )}
    </group>
  );
}

export default function SequenceScene() {
  const coarse =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  // This scene sits a third of the way down a long page; without this it renders
  // for the whole visit, including from the footer and from another tab.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameloop = useSceneFrameloop(canvasRef);

  return (
    <Canvas
      ref={canvasRef}
      frameloop={frameloop}
      camera={{ position: [0, 0, 8.6], fov: 40, near: 0.1, far: 40 }}
      dpr={coarse ? 1.25 : [1, 1.75]}
      gl={{ antialias: !coarse, powerPreference: "low-power", alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Rig detail={coarse ? 0 : 1} coarse={coarse} />
    </Canvas>
  );
}
