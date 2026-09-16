"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cameraFocus } from "./cameraFocus";

/*
 * Rocks. A belt of them around the galaxy's middle distance, and a handful
 * of big ones that drift past the camera during the flight.
 *
 * They are the thing the scene was missing: opaque, lit, shaded objects
 * between the camera and the subject. Planets are far and few; dust is
 * additive and weightless. A rock catches the core's light on one side and
 * goes black on the other, tumbles, and slides past at a different rate
 * from the background — parallax, occlusion and shadow, which is what
 * "depth" actually is to an eye.
 *
 * One instanced mesh, one displaced icosahedron (so no two look alike once
 * rotated and scaled), a standard material lit by the core point light.
 */

function rockGeometry(seed: number, detail = 2, smooth = false) {
  // Icosahedron geometry is non-indexed: every face owns its vertices, so
  // computed normals are per-face and the rock looks cut from paper. For
  // the near rocks, merge shared vertices first so normals blend.
  const g = smooth ? mergeVertices(new THREE.IcosahedronGeometry(1, detail)) : new THREE.IcosahedronGeometry(1, detail);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // Low-frequency lumps plus a fine grain, both from cheap hashes.
    const n1 = Math.sin(v.x * 3.1 + seed) * Math.cos(v.y * 2.7 - seed) * Math.sin(v.z * 3.4 + seed * 0.5);
    const n2 = Math.sin(v.x * 11 + v.y * 9 + v.z * 13 + seed) * 0.5;
    const r = 1 + n1 * 0.28 + n2 * 0.08;
    v.multiplyScalar(r);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

const ROCK_A = rockGeometry(1.7);
const ROCK_B = rockGeometry(4.2);
// The passers fill a good part of the frame; they need real surface.
const ROCK_NEAR_A = rockGeometry(2.9, 5, true);
const ROCK_NEAR_B = rockGeometry(6.1, 5, true);

type Rock = { pos: THREE.Vector3; axis: THREE.Vector3; spin: number; scale: number; angle: number; radius: number; orbit: number };

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();

function Belt({ count, geometry, radiusMin, radiusMax, sizeMin, sizeMax, thickness, seed }: { count: number; geometry: THREE.BufferGeometry; radiusMin: number; radiusMax: number; sizeMin: number; sizeMax: number; thickness: number; seed: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const rocks = useMemo<Rock[]>(() => {
    let s = seed;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    return Array.from({ length: count }, () => {
      const radius = radiusMin + Math.pow(rnd(), 0.7) * (radiusMax - radiusMin);
      const angle = rnd() * Math.PI * 2;
      return {
        pos: new THREE.Vector3(),
        axis: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
        spin: (rnd() - 0.5) * 1.2,
        scale: sizeMin + Math.pow(rnd(), 2.2) * (sizeMax - sizeMin),
        angle,
        radius,
        // Kepler-ish: inner rocks orbit faster.
        orbit: 0.02 / Math.pow(radius / radiusMin, 1.5),
      };
    }).map((r) => {
      r.pos.set(Math.cos(r.angle) * r.radius, (Math.random() - 0.5) * thickness, Math.sin(r.angle) * r.radius);
      return r;
    });
  }, [count, radiusMin, radiusMax, sizeMin, sizeMax, thickness, seed]);

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#6b655c", roughness: 0.92, metalness: 0.05, flatShading: true }),
    [],
  );

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    m.frustumCulled = false;
  }, []);

  useFrame((state, dt) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < rocks.length; i++) {
      const r = rocks[i];
      r.angle += r.orbit * dt;
      r.pos.x = Math.cos(r.angle) * r.radius;
      r.pos.z = Math.sin(r.angle) * r.radius;
      _q.setFromAxisAngle(r.axis, t * r.spin);
      // At map distance rocks are black specks on the disc; they earn their
      // size only when the camera is in among them.
      _s.setScalar(r.scale * (0.35 + cameraFocus.on * 0.65));
      _m.compose(r.pos, _q, _s);
      m.setMatrixAt(i, _m);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[geometry, material, count]} />;
}

/*
 * Close passers: a few large rocks that ride just ahead of the camera in
 * flight and slide across the frame, so something big and near crosses in
 * front of the subject now and then. Off the flight they park out of view.
 */
const _fw = new THREE.Vector3();
const _rt = new THREE.Vector3();
const _up = new THREE.Vector3();

function Passers() {
  const group = useRef<THREE.Group>(null);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#5e5851", roughness: 0.95, metalness: 0.02, flatShading: false }),
    [],
  );
  const items = useMemo(
    () => [
      { off: new THREE.Vector3(-1.3, 0.35, 2.4), speed: 0.11, scale: 0.14, geo: ROCK_NEAR_A, spin: 0.35 },
      { off: new THREE.Vector3(1.6, -0.5, 3.1), speed: 0.08, scale: 0.2, geo: ROCK_NEAR_B, spin: -0.25 },
      { off: new THREE.Vector3(0.4, 0.9, 2.0), speed: 0.14, scale: 0.08, geo: ROCK_NEAR_A, spin: 0.5 },
    ],
    [],
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const on = cameraFocus.on;
    g.visible = on > 0.05;
    if (!g.visible) return;
    const cam = state.camera;
    const t = state.clock.elapsedTime;
    cam.getWorldDirection(_fw);
    _rt.crossVectors(_fw, cam.up).normalize();
    _up.crossVectors(_rt, _fw).normalize();
    g.children.forEach((child, i) => {
      const it = items[i];
      // Drift across the frame on a slow cycle, in the camera's own frame.
      const cyc = ((t * it.speed + i * 0.37) % 1) * 2 - 1; // -1 … 1
      const x = it.off.x + cyc * 2.6;
      child.position.copy(cam.position).addScaledVector(_fw, it.off.z).addScaledVector(_rt, x).addScaledVector(_up, it.off.y + Math.sin(t * 0.3 + i) * 0.15);
      child.rotation.set(t * it.spin, t * it.spin * 0.7, 0);
      child.scale.setScalar(it.scale * on);
    });
  });

  return (
    <group ref={group} visible={false}>
      {items.map((it, i) => (
        <mesh key={i} geometry={it.geo} material={material} />
      ))}
    </group>
  );
}

export default function AsteroidField({ count = 520 }: { count?: number }) {
  return (
    <>
      {/* Two belts: a dense inner ring in the dust, a sparse outer one. */}
      <Belt count={Math.round(count * 0.7)} geometry={ROCK_A} radiusMin={2.2} radiusMax={4.6} sizeMin={0.012} sizeMax={0.06} thickness={0.5} seed={11} />
      <Belt count={Math.round(count * 0.3)} geometry={ROCK_B} radiusMin={4.6} radiusMax={7.5} sizeMin={0.02} sizeMax={0.11} thickness={0.9} seed={23} />
      <Passers />
    </>
  );
}
