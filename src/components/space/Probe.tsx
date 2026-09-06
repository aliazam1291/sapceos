"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sequence } from "@/lib/sequence";

/**
 * The craft the flight is flown from.
 *
 * The rig holds the camera still and slides the galaxy past it, which fixed the
 * framing but cost the section its sense of travel — a stationary lens over a
 * moving map reads as a diagram, not a journey. A craft held in frame while the
 * map slides behind it puts the reader ABOARD something, and that is what makes
 * the movement legible again.
 *
 * Built from the same vocabulary as everything else on the site: faceted
 * low-poly solids, flat normals, a dark hull with its own edges drawn over it.
 * No smooth shading, no imported model, no textures — a lathe-turned or PBR
 * ship would be the one thing in the scene that came from somewhere else.
 *
 * It lives OUTSIDE the moving world group on purpose. Parented to the map it
 * would slide with the galaxy and the whole effect would invert.
 */

const HULL_COLOR = new THREE.Color("#0a1114");
const LIT_COLOR = new THREE.Color("#2d4a4d");

const vert = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const frag = /* glsl */ `
  precision mediump float;
  uniform vec3 uBase;
  uniform vec3 uLit;
  varying vec3 vNormal;

  // Fixed in view space: the key light stays put while the craft banks under it,
  // the same treatment the star systems use so the two read as one world.
  const vec3 KEY = vec3(-0.4, 0.72, 0.56);

  void main() {
    float d = clamp(dot(normalize(vNormal), normalize(KEY)) * 0.5 + 0.5, 0.0, 1.0);
    gl_FragColor = vec4(mix(uBase, uLit, pow(d, 1.6)), 1.0);
  }
`;

/**
 * Fuselage, wings and fins as one merged low-poly form.
 *
 * Composed from primitives and baked into a single geometry so the edge pass
 * below traces the SILHOUETTE of the whole craft rather than drawing every
 * component's outline on top of its neighbours — which is what makes a
 * built-from-primitives model look like a pile of primitives.
 */
function buildCraft() {
  const parts: THREE.BufferGeometry[] = [];

  // Fuselage: a six-sided spindle, nose forward along -Z.
  const body = new THREE.ConeGeometry(0.17, 1.05, 6, 1);
  body.rotateX(-Math.PI / 2);
  parts.push(body);

  // Tail block, so the craft is not a bare spike.
  const tail = new THREE.CylinderGeometry(0.17, 0.1, 0.3, 6, 1);
  tail.rotateX(-Math.PI / 2);
  tail.translate(0, 0, 0.62);
  parts.push(tail);

  // Wings: flattened octahedra, swept back.
  for (const side of [-1, 1]) {
    // Thicker than they look right "on paper": at this scale a 0.09 wing was a
    // hairline on screen and the craft read as a spindle with whiskers.
    const wing = new THREE.OctahedronGeometry(0.46, 0);
    wing.scale(1, 0.16, 0.5);
    wing.rotateY(side * 0.5);
    wing.translate(side * 0.4, -0.02, 0.22);
    parts.push(wing);
  }

  // Dorsal fin.
  const fin = new THREE.OctahedronGeometry(0.26, 0);
  fin.scale(0.1, 1, 0.5);
  fin.translate(0, 0.2, 0.46);
  parts.push(fin);

  const merged = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  return merged;
}

/** Minimal merge — three's BufferGeometryUtils is not worth the import here. */
function mergeGeometries(list: THREE.BufferGeometry[]) {
  let total = 0;
  for (const g of list) total += g.getAttribute("position").count;

  const pos = new Float32Array(total * 3);
  const nrm = new Float32Array(total * 3);
  let o = 0;
  for (const g of list) {
    const src = g.toNonIndexed();
    const p = src.getAttribute("position");
    src.computeVertexNormals();
    const n = src.getAttribute("normal");
    for (let i = 0; i < p.count; i++) {
      pos[o * 3] = p.getX(i);
      pos[o * 3 + 1] = p.getY(i);
      pos[o * 3 + 2] = p.getZ(i);
      nrm[o * 3] = n.getX(i);
      nrm[o * 3 + 1] = n.getY(i);
      nrm[o * 3 + 2] = n.getZ(i);
      o++;
    }
    if (src !== g) src.dispose();
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  return out;
}

/*
 * Placement is COMPUTED, not nudged.
 *
 * The frame is busy: copy column on the left, readout in the middle, spec block
 * on the right, subject on the mark at centre. The one genuinely clear region is
 * the upper-right quadrant, and the first two placements put the craft straight
 * through the ROLE/STACK text because they were guessed.
 *
 * Camera sits at (0, 0.45, 3.6) with a 42-degree vertical field on a 16:10
 * frame, so at 1.9 units ahead a half-frame is 0.729 units tall and 1.167 wide.
 *
 * The height needed a correction the arithmetic missed: R3F aims the default
 * camera at the world origin rather than straight down -Z, which pitches it
 * down ~7 degrees and lifts everything about 150px up the frame. The first
 * computed y put the craft through the top edge for exactly that reason.
 */
export default function Probe({
  position = [0.55, 0.52, 1.7] as [number, number, number],
  scale = 0.3,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  const craft = useMemo(buildCraft, []);
  const edges = useMemo(() => new THREE.EdgesGeometry(craft, 24), [craft]);
  const group = useRef<THREE.Group>(null);
  const bank = useRef(0);

  const uniforms = useMemo(
    () => ({
      uBase: { value: HULL_COLOR.clone() },
      uLit: { value: LIT_COLOR.clone() },
    }),
    [],
  );

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const p = Math.min(Math.max(sequence.p, 0), 1);

    /*
     * Banks INTO the movement between stops and levels off during a hold.
     * The map's slide is what the reader is actually watching, so the craft has
     * to acknowledge it or the two read as unrelated layers.
     */
    const travel = Math.sin(p * Math.PI * 2 * 5) * 0.5 + 0.5;
    bank.current += (travel * 0.34 - 0.17 - bank.current) * (1 - Math.exp(-2.4 * dt));
    g.rotation.z = bank.current;
    /*
     * Held in three-quarter view.
     *
     * The fuselage is a six-sided cone with its nose along -Z, so pointed
     * straight away from a fixed camera it presents its BASE and reads as a
     * plain hexagon — which is exactly how the first pass looked. Yawed round
     * and pitched down, the flank, nose and wing sweep are all legible.
     */
    g.rotation.y = -1.05 + bank.current * 0.35;
    g.rotation.x = 0.2;

    // A slow idle drift, so a held beat is never completely still.
    g.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.7) * 0.022;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh geometry={craft}>
        <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} />
      </mesh>

      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#8fe4d3" transparent opacity={0.72} />
      </lineSegments>

      {/* Engine. One additive point, no bloom pass — the glow budget on this
          page is already spent on the galaxy core. */}
      <mesh position={[0, 0, 0.74]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshBasicMaterial
          color="#22d0b2"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
