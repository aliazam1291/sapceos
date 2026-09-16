"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import ShipModel, { type ShipHandle } from "./ShipModel";
import { cameraFocus } from "./cameraFocus";

/*
 * The ship flying lead through the mission flight — the frame's subject
 * alongside the world it is approaching.
 *
 * It holds station low-left of the lens, close enough to be large, and its
 * nose points at the planet the beat is about: the ship is *going there*,
 * and the reader is riding with it. Between beats, as the camera swings to
 * the next system, the nose tracks the new subject and the wings bank into
 * the turn. Lit by the core like every planet in frame, with a strong fill
 * from the lens so the hull reads against the dust.
 */

const _fw = new THREE.Vector3();
const _rt = new THREE.Vector3();
const _up = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _prevCam = new THREE.Vector3();
const _vel = new THREE.Vector3();
const _look = new THREE.Vector3();
const _tmp = new THREE.Vector3();
const _subject = new THREE.Vector3();

export default function Starship({ visible }: { visible: boolean }) {
  const ship = useRef<ShipHandle>(null);
  const bank = useRef(0);
  const shown = useRef(0);
  const aim = useRef(new THREE.Vector3(0, 0, -1));
  const keyDir = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const fillDir = useMemo(() => new THREE.Vector3(0, 0, 1), []);

  useFrame((state, dt) => {
    const g = ship.current?.group;
    if (!g) return;
    const cam = state.camera;
    const t = state.clock.elapsedTime;

    const want = visible ? 1 : 0;
    shown.current += (want - shown.current) * Math.min(dt * 3.5, 1);
    g.visible = shown.current > 0.01;
    if (!g.visible) {
      _prevCam.copy(cam.position);
      return;
    }

    cam.getWorldDirection(_fw);
    _rt.crossVectors(_fw, cam.up).normalize();
    _up.crossVectors(_rt, _fw).normalize();

    // Station: low-left, near the lens, locked to the camera (a lagged
    // station reads as the ship sliding backwards on every acceleration).
    const bobY = Math.sin(t * 0.9) * 0.012 + Math.sin(t * 1.7 + 1.0) * 0.006;
    const bobX = Math.sin(t * 0.6 + 2.0) * 0.01;
    _pos.copy(cam.position).addScaledVector(_fw, 1.35).addScaledVector(_rt, -0.5 + bobX).addScaledVector(_up, -0.24 + bobY);
    g.position.copy(_pos);

    _vel.subVectors(cam.position, _prevCam);
    _prevCam.copy(cam.position);
    const speed = _vel.length() / Math.max(dt, 1e-3);
    const lateral = _vel.dot(_rt) / Math.max(dt, 1e-3);

    // Nose on the subject. The aim vector is damped so a beat change swings
    // the nose across to the next world rather than snapping it.
    _subject.set(cameraFocus.target.x, cameraFocus.target.y, cameraFocus.target.z);
    _tmp.subVectors(_subject, g.position);
    if (_tmp.lengthSq() < 0.01) _tmp.copy(_fw);
    _tmp.normalize();
    aim.current.lerp(_tmp, Math.min(dt * 2.2, 1)).normalize();
    _look.copy(g.position).add(aim.current);
    g.lookAt(_look);

    // Bank into the camera's lateral motion and into the nose's own swing.
    const swing = aim.current.dot(_rt);
    const wantBank = THREE.MathUtils.clamp(-lateral * 0.9 - swing * 0.8, -0.7, 0.7) + Math.sin(t * 0.5) * 0.05;
    bank.current += (wantBank - bank.current) * Math.min(dt * 2.5, 1);
    g.rotateZ(bank.current);
    g.scale.setScalar((0.5 + shown.current * 0.5) * 0.46);

    // Key from the core, fill from the lens, both in the ship's frame.
    _tmp.set(0, 0, 0);
    keyDir.copy(g.worldToLocal(_tmp)).normalize();
    _tmp.copy(cam.position);
    fillDir.copy(g.worldToLocal(_tmp)).normalize();

    ship.current?.setThrust(THREE.MathUtils.clamp(0.25 + speed * 0.6, 0.25, 1));
  });

  return <ShipModel ref={ship} keyDir={keyDir} fillDir={fillDir} fillIntensity={2.4} />;
}
