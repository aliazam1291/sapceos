"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import ShipModel, { type ShipHandle } from "./ShipModel";
import { cameraFocus } from "./cameraFocus";
import { shipState } from "./shipState";
import { decay, signal } from "@/lib/scroll-signal";
import { perf } from "@/lib/perf";
import { heavySceneLive } from "@/lib/scene-load";
import { usePathname } from "next/navigation";
import styles from "./Companion.module.scss";

/*
 * The ship that travels with you.
 *
 * A fixed, click-through, transparent WebGL layer over every route, with
 * the operator's ship holding station low-right, flying "into" the page.
 * It is the same model that flies lead in the home flight, so the journey
 * is continuous: you meet it in the galaxy and it stays with you.
 *
 * It answers three things. Scroll: the nose dips with the direction of
 * travel and the engines burn with speed, so scrolling reads as flying.
 * The pointer: the ship yaws slightly toward it, a pilot glancing over.
 * Navigation: on `space:warp` (any internal link) it lunges forward under
 * full burn and settles back once the new page lands.
 *
 * It yields while the home flight is running (the lead ship has the
 * frame), on coarse pointers it is smaller and lower, and under reduced
 * motion it parks with idle engines. Cost: one small mesh set at dpr ≤1.5,
 * frames skipped to half rate while a heavy scene is live.
 */

const _tmp = new THREE.Vector3();

/*
 * The flight plan. The ship is the page's hero object: it does not sit in
 * a corner, it flies a route through the page and the sections arrive
 * around it. Each waypoint is where it is at a scroll progress — screen
 * fractions, x right, y up — plus how big it is there. Between waypoints
 * it eases; its heading follows the route. The home plan is written for
 * the home page's sections; every other page gets the short plan.
 */
type Waypoint = { p: number; x: number; y: number; s: number };
const HOME_PLAN: Waypoint[] = [
  // Measured against the sections (tools/sections-uat.mjs, 1440x900):
  // flight 0-0.48, hangar ~0.59, results field ~0.69, operator ~0.76,
  // drone bay ~0.85, open channel ~0.92, footer 1. Re-measure when a
  // section moves.
  { p: 0.0, x: 0.36, y: -0.3, s: 0.7 }, // boarding (the galaxy flight has the frame; the companion yields)
  { p: 0.5, x: 0.34, y: 0.3, s: 1.0 }, // out of the flight: top right, large
  { p: 0.59, x: 0.1, y: 0.4, s: 0.55 }, // hangar: high and small, a distant pass over the projectors
  { p: 0.68, x: -0.3, y: 0.3, s: 0.6 }, // results field: over the black hole's sky, top left
  { p: 0.76, x: 0.26, y: 0.0, s: 1.5 }, // operator: the hero moment — huge, beside the one sentence
  { p: 0.83, x: 0.3, y: 0.42, s: 0.5 }, // drone bay: high, small, distant — the drones own the frame
  { p: 0.92, x: 0.0, y: 0.1, s: 1.1 }, // touchdown: descends toward the pad, then hands off to the landed ship (shipState.landed)
  { p: 1.0, x: 0.0, y: -0.1, s: 1.1 },
];
const PAGE_PLAN: Waypoint[] = [
  { p: 0.0, x: 0.36, y: -0.3, s: 0.8 },
  { p: 0.5, x: -0.34, y: 0.02, s: 1.0 },
  { p: 1.0, x: 0.36, y: -0.3, s: 0.8 },
];
// A Catmull-Rom spline through the waypoints: the route has continuous
// velocity, so the ship never changes direction at a point — it curves.
function cr(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}
function planAt(plan: Waypoint[], prog: number) {
  let i = 0;
  while (i < plan.length - 2 && prog > plan[i + 1].p) i++;
  const a = plan[i];
  const b = plan[i + 1];
  const p0 = plan[Math.max(0, i - 1)];
  const p3 = plan[Math.min(plan.length - 1, i + 2)];
  const t = THREE.MathUtils.clamp((prog - a.p) / (b.p - a.p), 0, 1);
  return {
    x: cr(p0.x, a.x, b.x, p3.x, t),
    y: cr(p0.y, a.y, b.y, p3.y, t),
    s: cr(p0.s, a.s, b.s, p3.s, t),
  };
}

function Pilot({ pointer, warp, light, plan }: { pointer: React.RefObject<{ x: number; y: number }>; warp: React.RefObject<number>; light: React.RefObject<HTMLDivElement | null>; plan: Waypoint[] }) {
  const ship = useRef<ShipHandle>(null);
  const keyDir = useMemo(() => new THREE.Vector3(-0.6, 0.8, 0.4).normalize(), []);
  const fillDir = useMemo(() => new THREE.Vector3(0.3, -0.2, 1).normalize(), []);
  const { viewport, invalidate } = useThree();
  const frameIx = useRef(0);
  const pitch = useRef(0);
  const yaw = useRef(0);
  const roll = useRef(0);
  const lunge = useRef(0);
  const shown = useRef(0);
  const skip = useRef(false);
  const barrel = useRef(0); // 0 … 1 through a roll
  const prog = useRef(0);
  const px = useRef(0);
  const py = useRef(0);
  const cool = useRef(0);
  const heading = useRef(0);
  const started = useRef(false);
  // Smoothed velocity of the ship itself (units/s), the only thing the
  // attitude is allowed to read.
  const svx = useRef(0);
  const svy = useRef(0);

  // Demand-driven: this loop decides when the next frame is worth drawing.
  // Idle (no scroll, no lunge) the ship bobs at 30fps; scrolling or warping
  // it goes to full rate. Behind a heavy scene, or on a low level, 20fps.
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const busy = signal.velocity > 0.02 || (warp.current ?? 0) > 0.02;
      const slow = heavySceneLive() || perf.level === "low";
      const interval = slow ? 50 : busy ? 0 : 33;
      if (now - last >= interval) {
        last = now;
        invalidate();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [invalidate, warp]);

  useFrame((state, dt) => {
    const g = ship.current?.group;
    if (!g) return;
    frameIx.current++;
    void skip;
    const t = state.clock.elapsedTime;

    // Yield to the lead ship during the home flight.
    // Only while the galaxy is actually rendering: off-screen its loop stops
    // and the flag would otherwise stay raised for the rest of the page.
    // Stale = a few galaxy frames have not arrived, whatever a frame costs
    // on this GPU. On a real one that is ~80 ms; on a software renderer, seconds.
    const flightLive = cameraFocus.on > 0.5 && performance.now() - cameraFocus.tick < Math.max(120, cameraFocus.frameMs * 5);
    // Landed (the Touchdown section is in view): the ship is on the pad there.
    const want = flightLive || shipState.landed ? 0 : 1;
    shown.current += (want - shown.current) * Math.min(dt * 3, 1);
    g.visible = shown.current > 0.02;
    if (!g.visible) {
      shipState.on = 0;
      shipState.thrust = 0;
      // The lamp goes out with the ship; a warm pool with no ship above it
      // read as a stain on the hangar floor.
      light.current?.style.setProperty("--li", "0");
      return;
    }

    // Station: low-right of the frame, in viewport units at z = 0.
    const w = viewport.width;
    const h = viewport.height;
    const bobY = Math.sin(t * 0.8) * 0.02 + Math.sin(t * 1.9 + 0.7) * 0.01;
    const bobX = Math.sin(t * 0.55 + 1.3) * 0.012;

    // Scroll: velocity is unsigned, delta carries the sign.
    const dir = Math.sign(signal.delta) || 0;
    const v = signal.velocity;
    // Pitch follows the route's own climb and descent (below), not the
    // scroll direction — flipping the nose on every reversal read as jitter.
    void dir;
    pitch.current += (0 - pitch.current) * Math.min(dt * 4, 1);

    // The ship flies the page. Its station sweeps across the frame with
    // scroll progress — right at the top, across to the left through the
    // middle, back right by the end — so a long scroll is a flight path,
    // not a parked model. Damped so it trails the scroll, like a wingman.
    prog.current += (signal.progress - prog.current) * Math.min(dt * 1.6, 1);
    const wp = planAt(plan, prog.current);
    const wantX = w * wp.x;
    const wantY = h * wp.y;
    // First frame: start at the station, or the lerp from 0 reads as a
    // violent lateral move and the ship rolls and yaws on page load.
    if (!started.current) {
      px.current = wantX;
      py.current = wantY;
      prog.current = signal.progress;
      started.current = true;
    }
    const prevX = px.current;
    const prevY = py.current;
    px.current += (wantX - px.current) * Math.min(dt * 2.4, 1);
    py.current += (wantY - py.current) * Math.min(dt * 2.4, 1);
    // Attitude reads the ship's own velocity, low-passed. It used to read
    // (target - position) / dt — the remaining error over the frame time —
    // which doubles whenever a 16ms frame follows a 33ms one (demand
    // frameloop), so the wings flapped with the frame rate.
    const ivx = (px.current - prevX) / Math.max(dt, 1e-3);
    const ivy = (py.current - prevY) / Math.max(dt, 1e-3);
    svx.current += (ivx - svx.current) * Math.min(dt * 5, 1);
    svy.current += (ivy - svy.current) * Math.min(dt * 5, 1);
    const vx = svx.current;
    const vy = svy.current;

    // A hard flick rolls the ship all the way over. Once, then a cooldown.
    // No barrel roll: a hero object does not do tricks. The lunge on a
    // page change is the one flourish.
    cool.current = Math.max(0, cool.current - dt);
    if (barrel.current > 0) {
      barrel.current += dt * 0.9;
      if (barrel.current >= 1) barrel.current = 0;
    }
    const rollEase = barrel.current > 0 ? (1 - Math.cos(barrel.current * Math.PI)) / 2 : 0;
    const barrelRoll = rollEase * Math.PI * 2;

    // Pointer: a glance, not a turn.
    const p = pointer.current ?? { x: 0, y: 0 };
    yaw.current += (p.x * 0.35 - yaw.current) * Math.min(dt * 2.5, 1);
    // Bank into the sweep: lateral velocity across the frame rolls the wings.
    const wantRoll = -p.x * 0.1 + Math.sin(t * 0.4) * 0.03 + THREE.MathUtils.clamp(-vx * 0.22, -0.4, 0.4);
    roll.current += (wantRoll - roll.current) * Math.min(dt * 1.8, 1);

    // Warp: a lunge forward that decays.
    lunge.current += ((warp.current ?? 0) - lunge.current) * Math.min(dt * 5, 1);
    if (warp.current) warp.current = Math.max(0, warp.current - dt * 1.4);

    const scale = shown.current * (wp.s * 0.66 + lunge.current * 0.25);
    g.position.set(px.current + bobX, py.current + bobY + lunge.current * 0.15 + pitch.current * 0.05, lunge.current * 0.6);
    g.rotation.set(0, 0, 0);
    // Nose into the page, three-quarter view, turned toward the direction
    // of the sweep, then the flight attitude on top.
    // Seen from the front quarter, slightly above — the wingman view. The
    // nose leads the sweep: it turns toward wherever the station is moving.
    // Heading follows the direction of travel, turning like a vehicle:
    // moving left, the nose comes round to the left; moving right, to the
    // right; at rest it settles to the rear three-quarter the galaxy flight
    // uses. Seen from slightly above, so the wings and canopy read.
    const wantHeading = THREE.MathUtils.clamp(-vx * 0.5, -0.45, 0.45);
    heading.current += (wantHeading - heading.current) * Math.min(dt * 1.6, 1);
    g.rotateY(-0.5 + heading.current + yaw.current * 0.5);
    // Climbing on the route lifts the nose; descending dips it.
    g.rotateX(pitch.current - THREE.MathUtils.clamp(vy * 0.14, -0.22, 0.22));
    g.rotateZ(roll.current + barrelRoll);
    g.scale.setScalar(scale);

    // Light from upper-left of the screen, in the ship's frame.
    // Sun from the reader's upper-left, in front: the lit side faces the page.
    // Sun over the reader's left shoulder: top surfaces lit, facing us.
    _tmp.set(-2.2, 3.4, 3.2);
    keyDir.copy(g.worldToLocal(_tmp.add(g.position))).normalize();
    _tmp.set(2.5, -0.6, 3.5);
    fillDir.copy(g.worldToLocal(_tmp.add(g.position))).normalize();

    const thrust = THREE.MathUtils.clamp(0.12 + v * 0.9 + lunge.current + rollEase * 0.5, 0, 1);
    ship.current?.setThrust(thrust);

    // Publish for the star field: screen-normalised position and velocity.
    const nx = g.position.x / (w * 0.5);
    const ny = g.position.y / (h * 0.5);
    shipState.vx = (nx - shipState.x) / Math.max(dt, 1e-3);
    shipState.vy = (ny - shipState.y) / Math.max(dt, 1e-3);
    shipState.x = nx;
    shipState.y = ny;
    shipState.thrust = thrust;
    shipState.on = shown.current;

    // The ship lights the page beneath it: a warm pool that follows the
    // engines and brightens with thrust. This is what makes the ship part
    // of the page rather than a sticker on top of it.
    const el = light.current;
    if (el) {
      const sx = (nx * 0.5 + 0.5) * 100;
      const sy = (0.5 - ny * 0.5) * 100;
      el.style.setProperty("--lx", sx.toFixed(2) + "%");
      el.style.setProperty("--ly", (sy + 6).toFixed(2) + "%");
      el.style.setProperty("--li", (shown.current * (0.35 + thrust * 0.65)).toFixed(3));
    }
    decay(dt);
  });

  return <ShipModel ref={ship} keyDir={keyDir} fillDir={fillDir} />;
}

export default function Companion() {
  const [enabled, setEnabled] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const pointer = useRef({ x: 0, y: 0 });
  const warp = useRef(0);
  const light = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const plan = pathname === "/" ? HOME_PLAN : PAGE_PLAN;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
    // Mount after first paint; the ship is never on the critical path.
    const id = window.setTimeout(() => setEnabled(true), 800);
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (e.clientY / window.innerHeight - 0.5) * -2;
    };
    const onWarp = () => {
      warp.current = 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("space:warp", onWarp);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("space:warp", onWarp);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className={`${styles.layer} ${coarse ? styles.coarse : ""}`} aria-hidden="true" style={{ pointerEvents: "none" }}>
      <div ref={light} className={styles.light} />
      <Canvas
        frameloop="demand"
        shadows="soft"
        dpr={1}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power", toneMappingExposure: 1.12 }}
        // The camera sits above and behind the ship, like the galaxy shot:
        // the wings, spine and canopy are what the reader sees.
        camera={{ position: [0, 1.9, 3.6], fov: 32, near: 0.1, far: 20 }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
        style={{ background: "transparent", pointerEvents: "none" }}
      >
        <Pilot pointer={pointer} warp={warp} light={light} plan={plan} />
      </Canvas>
    </div>
  );
}
