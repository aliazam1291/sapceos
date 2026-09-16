"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/*
 * Shooting stars. A pool of four streaks; every few seconds one starts far
 * out on one side of the frame and crosses in under a second, bright at the
 * head, fading along its length and out at the end. Rare on purpose — one
 * every five seconds is a sky; one every second is a screensaver.
 */

type Streak = { head: THREE.Vector3; dir: THREE.Vector3; t: number; dur: number; len: number; active: boolean };

const _tail = new THREE.Vector3();

export default function ShootingStars() {
  const group = useRef<THREE.Group>(null);
  const streaks = useMemo<Streak[]>(
    () => Array.from({ length: 4 }, () => ({ head: new THREE.Vector3(), dir: new THREE.Vector3(), t: 0, dur: 0.8, len: 1.4, active: false })),
    [],
  );
  const next = useRef(2.5);
  const lines = useMemo(
    () =>
      streaks.map(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
        geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array([1, 1, 1, 0, 0, 0]), 3));
        const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
        return new THREE.Line(geo, mat);
      }),
    [streaks],
  );

  useFrame((state, dt) => {
    next.current -= dt;
    if (next.current <= 0) {
      next.current = 3 + Math.random() * 4;
      const s = streaks.find((x) => !x.active);
      if (s) {
        // Start high and to one side, well behind the disc plane, and cross.
        const side = Math.random() < 0.5 ? -1 : 1;
        s.head.set(side * (7 + Math.random() * 4), 3 + Math.random() * 3, -6 - Math.random() * 8);
        s.dir.set(-side * (0.7 + Math.random() * 0.3), -(0.15 + Math.random() * 0.3), (Math.random() - 0.5) * 0.2).normalize();
        s.t = 0;
        s.dur = 0.55 + Math.random() * 0.4;
        s.len = 1.2 + Math.random() * 1.2;
        s.active = true;
      }
    }
    streaks.forEach((s, i) => {
      const line = lines[i];
      const mat = line.material as THREE.LineBasicMaterial;
      if (!s.active) {
        mat.opacity = 0;
        return;
      }
      s.t += dt;
      const p = s.t / s.dur;
      if (p >= 1) {
        s.active = false;
        mat.opacity = 0;
        return;
      }
      s.head.addScaledVector(s.dir, dt * 11);
      _tail.copy(s.head).addScaledVector(s.dir, -s.len);
      const pos = line.geometry.attributes.position as THREE.BufferAttribute;
      pos.setXYZ(0, s.head.x, s.head.y, s.head.z);
      pos.setXYZ(1, _tail.x, _tail.y, _tail.z);
      pos.needsUpdate = true;
      // Fade in fast, out slow.
      mat.opacity = Math.min(1, p * 6) * (1 - p) * 0.9;
    });
  });

  return (
    <group ref={group}>
      {lines.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
    </group>
  );
}
