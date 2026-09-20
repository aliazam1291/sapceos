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
 * Four phases (2026-09-18), one ship:
 *   boarding  — on the overview, at station, nose on the core. It is there
 *               before anything moves; the reader boards, it does not pop in.
 *   flight    — a beat holds: nose on the world. A transit begins: the ship
 *               LEADS — it pulls ahead and toward the destination, banks
 *               into the arc, then rejoins its station as the camera
 *               arrives, with a small overshoot and settle. The station is
 *               a spring on the camera's own velocity, so the ship moves in
 *               the frame exactly as much as the flight is moving.
 *   leaving   — the flight is over: it climbs out top-right and forward,
 *               to where the companion (Companion.tsx, HOME_PLAN p 0.46)
 *               picks it up. One ship crossing a boundary.
 *   off       — not in the flight.
 *
 * Nose first, never at the lens: while a beat holds the nose is on the
 * world; on a transit it is along the path, kept inside the forward
 * hemisphere. Lit by the core like every planet in frame, with a strong
 * fill from the lens so the hull reads against the dust.
 */

export type StarshipPhase = "off" | "boarding" | "flight" | "leaving";

const _fw = new THREE.Vector3();
const _rt = new THREE.Vector3();
const _up = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _prevCam = new THREE.Vector3();
const _vel = new THREE.Vector3();
const _look = new THREE.Vector3();
const _tmp = new THREE.Vector3();
const _subject = new THREE.Vector3();
const _travel = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _worldUp = new THREE.Vector3(0, 1, 0);
/**
 * Minimum of the nose along the camera's forward: 0.72 ≈ 44° off-axis at
 * most. At a beat change the subject snaps to the next world while the
 * camera is still turning, so for a moment it is off-screen; at 70° the
 * nose swung up and the planform faced the lens. The camera brings the
 * world into the cone within a second and the nose settles on it.
 */
const MIN_FORWARD = 0.72;
/** The station: low-left, near the lens, in camera axes (forward, right, up). */
// Raised from up −0.24 (2026-09-19): with the nose finally forward the hull
// reached down over the opener's pitch line; this holds it in the air
// between the flight plan and the copy.
const STATION = { fw: 1.35, rt: -0.46, up: -0.1 };
/** The departure vector, in camera axes: out top-right and ahead. */
const DEPART = { fw: 1.6, rt: 1.3, up: 0.9 };

export default function Starship({ phase }: { phase: StarshipPhase }) {
  const ship = useRef<ShipHandle>(null);
  const bank = useRef(0);
  const shown = useRef(0);
  const aim = useRef(new THREE.Vector3(0, 0, -1));
  // Smoothed direction of travel and how hard we are moving (0..1).
  const heading = useRef(new THREE.Vector3(0, 0, -1));
  const moving = useRef(0);
  // The lead: an underdamped spring on the camera's velocity, in camera
  // axes. It pulls the ship ahead and toward the destination on a transit
  // and lets it drift back past station and settle on arrival.
  const lead = useRef({ x: 0, y: 0, z: 0 });
  const leadV = useRef({ x: 0, y: 0, z: 0 });
  const keyDir = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const fillDir = useMemo(() => new THREE.Vector3(0, 0, 1), []);

  useFrame((state, dt) => {
    const g = ship.current?.group;
    if (!g) return;
    const cam = state.camera;
    const t = state.clock.elapsedTime;

    // Shown: in fast; out slowly enough for the departure to read.
    const want = phase === "off" || phase === "leaving" ? 0 : 1;
    const rate = phase === "leaving" ? 1.1 : 3.5;
    shown.current += (want - shown.current) * Math.min(dt * rate, 1);
    const on = shown.current > 0.01;
    ship.current?.setShown(on);
    if (!on) {
      _prevCam.copy(cam.position);
      return;
    }

    cam.getWorldDirection(_fw);
    _rt.crossVectors(_fw, cam.up).normalize();
    _up.crossVectors(_rt, _fw).normalize();

    // The camera's own motion, in its own axes (units/s).
    _vel.subVectors(cam.position, _prevCam);
    _prevCam.copy(cam.position);
    const inv = 1 / Math.max(dt, 1e-3);
    const speed = _vel.length() * inv;
    const vr = _vel.dot(_rt) * inv;
    const vu = _vel.dot(_up) * inv;
    const lateral = vr;

    // The lead. Wanted offsets follow the velocity — ahead with speed,
    // sideways and up/down with the direction — and a spring with a little
    // underdamping carries the ship there and back: it overshoots the
    // station slightly on arrival and settles, the way a wingman rejoins.
    const wantLead = {
      x: THREE.MathUtils.clamp(vr * 0.08, -0.16, 0.16),
      y: THREE.MathUtils.clamp(vu * 0.08, -0.12, 0.18),
      z: THREE.MathUtils.clamp(speed * 0.12, 0, 0.7),
    };
    const K = 26;
    const C = 2 * Math.sqrt(K) * 0.62;
    const step = Math.min(dt, 0.05);
    for (const k of ["x", "y", "z"] as const) {
      const acc = (wantLead[k] - lead.current[k]) * K - leadV.current[k] * C;
      leadV.current[k] += acc * step;
      lead.current[k] += leadV.current[k] * step;
    }

    // Station + lead + (leaving) the climb-out, in camera axes. Locked to
    // the camera (a lagged station reads as the ship sliding backwards on
    // every acceleration); the lead is the only thing that moves it.
    const gone = 1 - shown.current;
    const bobY = Math.sin(t * 0.9) * 0.012 + Math.sin(t * 1.7 + 1.0) * 0.006;
    const bobX = Math.sin(t * 0.6 + 2.0) * 0.01;
    const fw = STATION.fw + lead.current.z + (phase === "leaving" ? gone * DEPART.fw : 0);
    const rt = STATION.rt + lead.current.x + bobX + (phase === "leaving" ? gone * DEPART.rt : 0);
    const up = STATION.up + lead.current.y + bobY + (phase === "leaving" ? gone * DEPART.up : 0);
    _pos.copy(cam.position).addScaledVector(_fw, fw).addScaledVector(_rt, rt).addScaledVector(_up, up);
    g.position.copy(_pos);

    // Nose first. On a real transit between systems the nose goes along the
    // direction of travel; while a beat holds — even though the camera drifts
    // in its slow orbit — the nose is on the world. The thresholds are set
    // above the orbit's drift speed (~0.15 u/s) so a held shot never counts
    // as travel. Heading is smoothed so a scroll reversal swings the nose
    // round rather than flipping it.
    if (speed > 0.12) {
      _travel.copy(_vel).normalize();
      heading.current.lerp(_travel, Math.min(dt * 4, 1)).normalize();
    }
    const wantMoving = THREE.MathUtils.clamp((speed - 0.25) / 0.5, 0, 1);
    moving.current += (wantMoving - moving.current) * Math.min(dt * 3, 1);

    // The subject: the world while a beat holds, the core while boarding.
    if (phase === "flight" && cameraFocus.on > 0.3) _subject.set(cameraFocus.target.x, cameraFocus.target.y, cameraFocus.target.z);
    else _subject.set(0, 0, 0);
    _tmp.subVectors(_subject, g.position);
    if (_tmp.lengthSq() < 0.01) _tmp.copy(_fw);
    _tmp.normalize();
    // On a transit the nose is along the path but never loses the
    // destination: a curve that starts sideways would otherwise point the
    // ship broadside to the lens for the first half-second.
    _tmp.lerp(heading.current, moving.current * 0.55).normalize();
    if (phase === "leaving") {
      // Climbing out: the nose goes where the ship is going.
      _tmp.set(0, 0, 0).addScaledVector(_fw, DEPART.fw).addScaledVector(_rt, DEPART.rt).addScaledVector(_up, DEPART.up).normalize();
    }
    // Never at the lens. A nose pointed at the reader reads as the ship
    // flying backwards out of the frame; when the flight recedes it flies
    // away-and-across instead — the aim is held inside the forward hemisphere.
    const fwd = _tmp.dot(_fw);
    if (fwd < MIN_FORWARD) _tmp.addScaledVector(_fw, MIN_FORWARD - fwd).normalize();
    aim.current.lerp(_tmp, Math.min(dt * 2.2, 1)).normalize();
    /*
     * Nose ON the aim (2026-09-19). This used to be `g.lookAt(look)`, and
     * three's Object3D.lookAt points an object's +Z at the target — only
     * cameras and lights use −Z. The nose is −Z (ShipModel), so the ship
     * flew tail-first toward every world: the fins led, the nose trailed,
     * and it read as a ship reversing into each system. Ali: "the motion of
     * the spaceship in the galaxy is not correct". Matrix4.lookAt builds the
     * camera-style frame — −Z along (target − eye), +Y kept up — which is
     * the one a vehicle wants.
     */
    _look.copy(g.position).add(aim.current);
    _m.lookAt(g.position, _look, _worldUp);
    g.quaternion.setFromRotationMatrix(_m);

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

    // Engines: with speed, and full burn on the climb-out.
    const burn = phase === "leaving" ? 1 : THREE.MathUtils.clamp(0.25 + speed * 0.6, 0.25, 1);
    ship.current?.setThrust(burn);
  });

  return <ShipModel ref={ship} keyDir={keyDir} fillDir={fillDir} fillIntensity={2.4} />;
}
