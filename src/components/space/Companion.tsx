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
import { WarmShaders } from "./useWarmShaders";
import { usePathname } from "next/navigation";
import styles from "./Companion.module.scss";
import { quietGL } from "@/lib/gl";

/*
 * The ship that travels with you.
 *
 * A fixed, click-through, transparent WebGL layer over every route, with
 * the operator's ship holding station low-right, flying "into" the page.
 * It is the same model that flies lead in the home flight, so the journey
 * is continuous: you meet it in the galaxy and it stays with you.
 *
 * It answers three things. Scroll: it flies its plan with the reader and
 * the engines burn with speed, so scrolling reads as flying. The pointer:
 * the ship yaws slightly toward it, a pilot glancing over. Navigation: on
 * `space:warp` (any internal link) it departs — full burn, ahead and up out
 * of the frame — and flies back in from the low right once the new page
 * has mounted. Every appearance is an entrance: it never fades up in place.
 * The motion model is a damped spring (see Pilot), so it has mass.
 *
 * It yields while the home flight is running (the lead ship has the
 * frame), on coarse pointers it is smaller and lower, and under reduced
 * motion it parks with idle engines. Cost: one small mesh set at dpr ≤1.5,
 * frames skipped to half rate while a heavy scene is live.
 */

const _tmp = new THREE.Vector3();
const _dir = new THREE.Vector3();
const NEG_Z = new THREE.Vector3(0, 0, -1);
// At rest: nose into the page and a little right — the wingman's station.
const REST_AIM = new THREE.Vector3(0.42, -0.05, -0.9).normalize();

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
  // Measured against the ten legs (tools/sections-uat.mjs, 1440x900,
  // 2026-09-19, H 16472): flight 0-0.314, operator 0.369-0.385, hangar
  // 0.44-0.471, debrief 0.526, impact 0.581-0.617, flight rules 0.672,
  // flight log 0.729-0.748, studio 0.803, field notes 0.858-0.869,
  // touchdown 0.924-0.941, footer 1. Re-measure when a section moves.
  { p: 0.0, x: 0.36, y: -0.3, s: 0.7 }, // boarding (the galaxy flight has the frame; the companion yields)
  { p: 0.33, x: 0.34, y: 0.3, s: 1.0 }, // out of the flight: top right, large
  { p: 0.377, x: 0.36, y: 0.08, s: 0.85 }, // operator: the copy holds the left two-thirds; the ship in the air right of it
  { p: 0.455, x: 0.1, y: 0.4, s: 0.55 }, // hangar: high and small, a distant pass over the projectors
  { p: 0.526, x: -0.3, y: 0.3, s: 0.6 }, // debrief: over the black hole's sky, top left (the hole then captures it)
  { p: 0.6, x: 0.0, y: 0.42, s: 0.5 }, // impact: full-width panels — a small high pass
  { p: 0.673, x: 0.3, y: 0.02, s: 1.5 }, // flight rules: the hero moment — huge, in the air right of the beacons
  { p: 0.74, x: 0.34, y: 0.06, s: 0.9 }, // flight log: the route holds the left; the ship rides the right
  { p: 0.803, x: 0.1, y: 0.42, s: 0.5 }, // studio: projectors — high, small, distant
  { p: 0.863, x: 0.3, y: 0.42, s: 0.5 }, // drone bay: high, small, distant — the drones own the frame
  { p: 0.932, x: 0.0, y: 0.1, s: 1.1 }, // touchdown: descends toward the pad, then hands off to the landed ship (shipState.landed)
  { p: 1.0, x: 0.0, y: -0.1, s: 1.1 },
];
/*
 * Secondary pages, by kind (2026-09-19). One plan for every page put the
 * rest position 80% down the first screen — on a report that is the
 * manifest's last cell, on any page the second section's head — and the
 * mid-page sweep to the left crossed a report's navigation rail (measured
 * on /missions/vahan-shakti: the ship on "Sector · Government" at rest,
 * on LEARNINGS mid-page). What every page header does leave free is the
 * air above its title, top-left, beside the heading: the figure has the
 * right column, the title sits at ~48% down. So every kind rests there,
 * and the middle of the page depends on what the page is:
 *   report — a sticky rail top-left, prose to the right, empty below the
 *            rail: the sweep goes low-left, under the rail.
 *   deck   — full-width object rows or panels (holograms, drones, the
 *            airframe and ledgers on /about): a small, high, distant
 *            pass, as over the Hangar.
 *   prose  — a left column of text with air on the right (decisions,
 *            history, about): hold the right, small and high.
 * Every plan ends right, above the handoff buttons.
 */
const REST: Waypoint = { p: 0.0, x: -0.28, y: 0.24, s: 0.72 };
const END: Waypoint = { p: 1.0, x: 0.3, y: 0.12, s: 0.8 };
const PAGE_PLAN_REPORT: Waypoint[] = [REST, { p: 0.5, x: -0.36, y: -0.32, s: 0.7 }, END];
const PAGE_PLAN_DECK: Waypoint[] = [REST, { p: 0.5, x: 0.1, y: 0.4, s: 0.5 }, END];
const PAGE_PLAN_PROSE: Waypoint[] = [REST, { p: 0.5, x: 0.32, y: 0.3, s: 0.62 }, END];
function pagePlanFor(pathname: string): Waypoint[] {
  // The venture page has a report's shape (manifest, sticky rail, rows).
  if (/^\/(missions|field-notes)\/[^/]+/.test(pathname) || pathname === "/dumbmoney") return PAGE_PLAN_REPORT;
  // /flight-data's bar rows run the full width like a deck's object rows,
  // and the numbers at their right end are text the ship would sit on.
  if (/^\/(missions|field-notes|lab|studio|about|flight-data)\/?$/.test(pathname)) return PAGE_PLAN_DECK;
  return PAGE_PLAN_PROSE;
}
// Phones (2026-09-18): the same low-right station is a fixed SCREEN
// fraction regardless of device, so on a short mobile viewport it is ~80%
// down the first screen — landing on the second section's heading and
// body copy on every page with a compact header (/about, /contact,
// /mission-history, /decisions all measured with the ship over live text).
// Raising the rest position was not enough on its own: at mobile width a
// single text column runs almost edge to edge (measured ~20%–94% of the
// viewport on /decisions), so any waypoint inside that range crosses
// whatever paragraph is on screen once the page scrolls. There is no safe
// interior spot on a full-width column — so on mobile the ship flies past
// the right margin instead, most of its body beyond where the text wraps,
// smaller so what does cross the edge is a wingtip, not a wing.
const PAGE_PLAN_COARSE: Waypoint[] = [
  { p: 0.0, x: 0.44, y: 0.3, s: 0.4 },
  { p: 0.5, x: 0.4, y: 0.36, s: 0.36 },
  { p: 1.0, x: 0.44, y: 0.3, s: 0.4 },
];
/*
 * Docked (2026-09-22, the app shell). Below 768px the page has a top bar
 * (MobileShell) whose right end is left empty as the ship's berth, and the
 * ship holds there for the whole page, every page, home included — the
 * PAGE_PLAN_COARSE margin pass still crossed every heading's last word,
 * and on the home page the desktop plan flew it over the operator's copy,
 * the ownership matrix and the footer links (phone sheets, tools/
 * mobile-shots.mjs). Fractions are computed from the viewport so the
 * station is the berth's centre in pixels: 46px in from the right, 31px
 * below the safe-area inset (measured: at 52/26 the fin tips clipped the
 * top edge and the exhaust reached the search glyph).
 */
function dockedPlan(w: number, h: number, safeTop: number): Waypoint[] {
  const x = 0.5 - 46 / w;
  const y = 0.5 - (safeTop + 31) / h;
  const s = 0.26;
  return [
    { p: 0.0, x, y, s },
    { p: 1.0, x, y, s },
  ];
}
/*
 * Is there readable text under this screen point? The ship must never sit
 * on copy (2026-09-19). The flight plans keep it clear at the positions
 * they were measured at, but a page's content scrolls under fixed screen
 * fractions, and every plan change so far has produced one waypoint over a
 * heading somewhere. So the ship also looks: a hit-test at its centre and
 * wingtips, a few times a second, and if a text node is under it the
 * station lifts until it is clear. `elementFromPoint` ignores
 * pointer-events:none layers (this canvas, the cursor, the vignette), so
 * what it returns is the page. Objects — canvases, images, SVG — are fine to
 * fly over; only a leaf with its own text counts.
 */
function copyAt(x: number, y: number): boolean {
  const el = document.elementFromPoint(x, y);
  // Any readable text counts — the page, the footer, and the fixed chrome
  // (the rail's "Leg 02 / 10" is copy too; the ship sat on it once).
  if (!el || el === document.documentElement || el === document.body) return false;
  if (el.closest("canvas, svg, img, picture, video")) return false;
  // The caret API answers "is there text at this point" directly: over a
  // glyph run it returns the text node; in a container's empty padding it
  // returns the element.
  const d = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const node = d.caretPositionFromPoint?.(x, y)?.offsetNode ?? d.caretRangeFromPoint?.(x, y)?.startContainer ?? null;
  if (node && node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim()) {
    // The caret snaps to the NEAREST text in the hit element, which can be
    // a whole column away; only count it if the point is on its glyphs.
    const r = document.createRange();
    r.selectNodeContents(node);
    for (const rect of r.getClientRects()) {
      if (x >= rect.left - 6 && x <= rect.right + 6 && y >= rect.top - 6 && y <= rect.bottom + 6) return true;
    }
  }
  // A leaf with its own words (a chip, a label) counts even when the point
  // is in its padding.
  return el.children.length === 0 && (el.textContent ?? "").trim().length > 0;
}

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

function Pilot({
  pointer,
  warp,
  light,
  plan,
  pathname,
  avoid,
}: {
  pointer: React.RefObject<{ x: number; y: number }>;
  warp: React.RefObject<number>;
  light: React.RefObject<HTMLDivElement | null>;
  plan: Waypoint[];
  pathname: string;
  /**
   * Copy avoidance on/off. Off on narrow viewports: a single full-width
   * column has no clear interior spot, and the search pulled the ship off
   * the right margin (where PAGE_PLAN_COARSE parks it, half outside the
   * frame on purpose) and onto the manifest looking for one.
   */
  avoid: boolean;
}) {
  const ship = useRef<ShipHandle>(null);
  const keyDir = useMemo(() => new THREE.Vector3(-0.6, 0.8, 0.4).normalize(), []);
  const fillDir = useMemo(() => new THREE.Vector3(0.3, -0.2, 1).normalize(), []);
  const { viewport, invalidate } = useThree();
  const yaw = useRef(0);
  const roll = useRef(0);
  const lunge = useRef(0);
  const shown = useRef(0);
  const prog = useRef(0);
  const aim = useRef(REST_AIM.clone());
  /*
   * The ship has mass (2026-09-19). Position and size follow their targets
   * through a damped spring — a body with velocity that a target pulls on —
   * instead of an exponential lerp that arrives asymptotically. A spring
   * gives three things the lerp could not: an entrance (start it off-screen
   * with a velocity and it flies in on an arc and settles), a departure
   * (throw the target past the frame and it accelerates out), and a little
   * overshoot on every station change so the ship is seen to fly to the
   * spot rather than fade onto it. `pv` is the ship's own velocity, and it
   * is the only thing attitude and thrust are allowed to read.
   */
  const px = useRef(0);
  const py = useRef(0);
  const pz = useRef(0);
  const ps = useRef(0.7);
  const pvx = useRef(0);
  const pvy = useRef(0);
  const pvz = useRef(0);
  const pvs = useRef(0);
  // Low-passed acceleration: the engines flare when the ship is pushed.
  const acc = useRef(0);
  const zPush = useRef(0);
  // Copy avoidance: the offset (screen fractions) that keeps the station
  // clear of text, chosen on a clock from a short list of candidates and
  // eased into. {0,0} whenever the plan's own station is clear.
  const dodgeX = useRef(0);
  const dodgeY = useRef(0);
  const dodgeWantX = useRef(0);
  const dodgeWantY = useRef(0);
  const dodgeAt = useRef(0);
  // The last sample's pick; a new offset is adopted only when two samples
  // in a row agree, so a paragraph edge cannot make the ship hunt.
  const dodgeLast = useRef<[number, number]>([0, 0]);
  const started = useRef(false);
  // 1 while the ship is flying out of the frame on a route change.
  const departing = useRef(0);
  // Where the next entrance starts: the edge the ship is coming from.
  const entryFrom = useRef<"above" | "high-right">("above");
  const lastPath = useRef(pathname);
  const mountedAt = useRef(0);

  /*
   * Entrance: put the ship beyond the frame's edge with a velocity aimed
   * past the station, so the spring bends the path into an arc — in, a
   * bank, a settle. "above" descends onto the station from over the top
   * edge on the station's own side, so the approach crosses sky, never the
   * copy (an arc from the low right crossed the page title on every
   * secondary page). "high-right" is where the galaxy's ship climbs out
   * (Starship, `DEPART`), so on the home page the companion enters from
   * the point the lead ship left: one ship crossing a boundary.
   */
  const enter = (w: number, h: number, from: "above" | "high-right") => {
    const wp = planAt(plan, prog.current);
    if (from === "high-right") {
      px.current = w * 0.75;
      py.current = h * 0.62;
      pvx.current = -w * 0.9;
      pvy.current = -h * 0.15;
    } else {
      const side = wp.x < 0 ? -1 : 1;
      px.current = w * wp.x + side * w * 0.28;
      py.current = h * 0.95;
      pvx.current = -side * w * 0.3;
      pvy.current = -h * 1.15;
    }
    pz.current = -1.2;
    pvz.current = 1.6;
    ps.current = wp.s * 0.35;
    pvs.current = 0;
    acc.current = 1;
    departing.current = 0;
    started.current = true;
  };

  // Route change: the departure was fired by `space:warp` on the click; the
  // new page mounts and the ship comes back down onto its station.
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    prog.current = 0;
    entryFrom.current = "above";
    started.current = false;
  }, [pathname]);

  // Demand-driven: this loop decides when the next frame is worth drawing.
  // Idle (no scroll, no lunge) the ship bobs at 30fps; scrolling, entering or
  // departing it goes to full rate. Behind a heavy scene, or on a low level, 20fps.
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const flying = Math.hypot(pvx.current, pvy.current) > 0.25 || departing.current > 0;
      const busy = signal.velocity > 0.02 || (warp.current ?? 0) > 0.02 || flying;
      const slow = heavySceneLive() || perf.level === "low";
      const interval = slow ? 50 : busy ? (perf.level === "high" ? 0 : 33) : 33;
      if (now - last >= interval) {
        last = now;
        invalidate();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [invalidate, warp]);

  useFrame((state, rawDt) => {
    const g = ship.current?.group;
    if (!g) return;
    // A demand frameloop can hand us a long gap; the spring integrates in
    // 50ms steps below so it stays stable, and the cap keeps a stalled tab
    // from replaying a whole flight in one frame.
    const dt = Math.min(rawDt, 0.25);
    const t = state.clock.elapsedTime;
    const w = viewport.width;
    const h = viewport.height;

    // Yield to the lead ship during the home flight — only while the galaxy
    // is actually rendering (off-screen its loop stops and the flag would
    // stay raised). Stale = a few galaxy frames have not arrived, whatever a
    // frame costs on this GPU. And while the launch screen is up: the pad
    // has the ship.
    const booting = document.documentElement.hasAttribute("data-booting");
    const now = performance.now();
    if (!mountedAt.current) mountedAt.current = now;
    const flightLive = cameraFocus.ship > 0.5 && now - cameraFocus.tick < Math.max(120, cameraFocus.frameMs * 5);
    // The galaxy is a lazy chunk; on the home page it arrives after this
    // ship does. Until it has drawn a frame (`tick`), the flight is
    // presumed live at the top of the page — otherwise the companion flew
    // in, and a second later the lead ship appeared beside it (measured
    // 2026-09-19: two ships in the boarding frame for ~2 s). Eight seconds
    // is the ceiling, so a galaxy that never mounts (reduced motion, a
    // failed chunk) does not keep the ship away for the whole visit.
    const galaxyPending = pathname === "/" && cameraFocus.tick === 0 && signal.progress < 0.45 && now - mountedAt.current < 8000;
    const want = flightLive || galaxyPending || booting || shipState.landed || shipState.captured ? 0 : 1;
    const wasShown = shown.current > 0.02;
    shown.current += (want - shown.current) * Math.min(dt * 3, 1);
    const on = shown.current > 0.02 && !booting;
    ship.current?.setShown(on);
    if (!on) {
      shipState.on = 0;
      shipState.thrust = 0;
      light.current?.style.setProperty("--li", "0");
      // Hand-off: the galaxy's ship climbs out top-right, so that is where
      // the companion will appear from when the flight releases it.
      if (flightLive) entryFrom.current = "high-right";
      started.current = false;
      return;
    }
    // Coming back on screen — from the flight, the hole, the pad, or a new
    // route — the ship flies in; it does not fade up in place.
    if (!started.current || !wasShown) {
      prog.current = signal.progress;
      enter(w, h, entryFrom.current);
      entryFrom.current = "above";
    }

    // The station on the flight plan, damped so the ship trails the scroll.
    prog.current += (signal.progress - prog.current) * Math.min(dt * 2.0, 1);
    const wp = planAt(plan, prog.current);
    let tx = w * wp.x;
    let ty = h * wp.y;
    let ts = wp.s;
    let tz = 0;

    // Warp: a link was followed. The ship goes first — full burn, ahead along
    // its nose and up out of the frame, shrinking into the distance — and the
    // new page's entrance brings it back.
    if ((warp.current ?? 0) > 0.98 && departing.current === 0) departing.current = 1;
    if (departing.current > 0) {
      departing.current += dt;
      // A departure with no arrival (the navigation was cancelled, or the
      // route was the same after a redirect): after 2.4 s the ship simply
      // comes back in rather than waiting outside the frame forever.
      if (departing.current > 3.4) {
        started.current = false;
        return;
      }
      tx = px.current + aim.current.x * w * 1.6 + w * 0.4;
      ty = py.current + Math.max(aim.current.y, 0.25) * h * 1.4;
      tz = -2.4;
      ts = 0.2;
    }
    lunge.current += ((warp.current ?? 0) - lunge.current) * Math.min(dt * 5, 1);
    if (warp.current) warp.current = Math.max(0, warp.current - dt * 1.4);

    // Scroll speed presses the ship a little toward the lens: flying forward.
    zPush.current += (THREE.MathUtils.clamp(signal.velocity * 0.6, 0, 1) * 0.5 - zPush.current) * Math.min(dt * 3, 1);
    tz += zPush.current + lunge.current * 0.5;

    // Copy avoidance (see copyAt). Every 120ms the station the plan wants
    // is hit-tested at the hull and both wingtips; if it is over text, the
    // first clear offset from a short list wins — up first, then up and to
    // a side, then further out — and the ship eases there. The current
    // offset is kept while it stays clear, so the ship does not hunt, and
    // it relaxes back onto the plan once the page has moved on.
    if (avoid && departing.current === 0 && now - dodgeAt.current > 120) {
      dodgeAt.current = now;
      // The hull's screen box at this scale: wingspan ≈ 0.32 of the width
      // at s=1, height about a third of that. Sampled as a 5×3 grid.
      const half = ts * 0.66 * 0.16 * window.innerWidth;
      const tall = half * 0.36;
      const clear = (dx: number, dy: number) => {
        const cx = (tx / w + 0.5 + dx) * window.innerWidth;
        const cy = (0.5 - Math.min(ty / h + dy, 0.46)) * window.innerHeight;
        for (let i = -2; i <= 2; i++) {
          for (let j = -1; j <= 1; j++) {
            if (copyAt(cx + (i * half) / 2, cy + j * tall)) return false;
          }
        }
        return true;
      };
      // Toward the frame's centre and the far side first: on every page
      // the empty sky is across from the copy, and an offset toward the
      // near edge leaves half a ship outside the frame. The list is a
      // preference order and the first clear entry wins every sample, so
      // the ship comes back in as soon as a nearer spot frees up.
      const side = tx < 0 ? 1 : -1;
      const inFrame = (dx: number) => Math.abs(tx / w + dx) <= 0.42;
      const candidates: [number, number][] = [
        [0, 0],
        [0, 0.16],
        [side * 0.18, 0.12],
        [side * 0.34, 0.12],
        [side * 0.5, 0.1],
        [-side * 0.14, 0.14],
        [0, 0.3],
      ].filter(([dx]) => inFrame(dx)) as [number, number][];
      const pick = candidates.find(([dx, dy]) => clear(dx, dy)) ?? candidates[candidates.length - 1] ?? [0, 0.3];
      const [lx, ly] = dodgeLast.current;
      if (pick[0] === lx && pick[1] === ly) {
        dodgeWantX.current = pick[0];
        dodgeWantY.current = pick[1];
      }
      dodgeLast.current = pick;
    }
    dodgeX.current += (dodgeWantX.current - dodgeX.current) * Math.min(dt * 2.2, 1);
    dodgeY.current += (dodgeWantY.current - dodgeY.current) * Math.min(dt * 2.2, 1);
    tx += dodgeX.current * w;
    ty = Math.min(ty + dodgeY.current * h, h * 0.46);
    ts *= 1 - Math.min(1, Math.hypot(dodgeX.current, dodgeY.current) * 2.5) * 0.3;

    // The spring. ω sets how quickly it gets there, ζ how much it overshoots:
    // ζ 0.78 is one soft overshoot and a settle — a wingman rejoining, not a
    // UI element easing. Departures are stiffer so the exit is decisive.
    const omega = departing.current > 0 ? 5.5 : 3.1;
    const zeta = departing.current > 0 ? 1.0 : 0.78;
    const prevVx = pvx.current;
    const prevVy = pvy.current;
    let remaining = dt;
    while (remaining > 1e-4) {
      const step = Math.min(remaining, 0.05);
      remaining -= step;
      const ax = omega * omega * (tx - px.current) - 2 * zeta * omega * pvx.current;
      const ay = omega * omega * (ty - py.current) - 2 * zeta * omega * pvy.current;
      const az = 16 * (tz - pz.current) - 2 * 0.9 * 4 * pvz.current;
      const as = 20 * (ts - ps.current) - 2 * 0.95 * 4.47 * pvs.current;
      pvx.current += ax * step;
      pvy.current += ay * step;
      pvz.current += az * step;
      pvs.current += as * step;
      px.current += pvx.current * step;
      py.current += pvy.current * step;
      pz.current += pvz.current * step;
      ps.current += pvs.current * step;
    }
    const vx = pvx.current;
    const vy = pvy.current;
    const speed = Math.hypot(vx, vy);
    // Acceleration this frame, low-passed: what the engines answer.
    const aMag = Math.hypot(vx - prevVx, vy - prevVy) / Math.max(dt, 1e-3);
    acc.current += (THREE.MathUtils.clamp(aMag / 12, 0, 1) - acc.current) * Math.min(dt * 4, 1);

    // Idle: a slow drift, two incommensurate periods so it never loops.
    const bobY = Math.sin(t * 0.8) * 0.02 + Math.sin(t * 1.9 + 0.7) * 0.01;
    const bobX = Math.sin(t * 0.55 + 1.3) * 0.012;

    // Pointer: a glance, not a turn.
    const p = pointer.current ?? { x: 0, y: 0 };
    yaw.current += (p.x * 0.35 - yaw.current) * Math.min(dt * 2.5, 1);
    // Bank into the turn: lateral velocity rolls the wings, and the roll
    // leads a little on lateral acceleration, the way a pilot rolls in
    // before the turn tightens. Gains are small on purpose; it flies calm.
    const latAcc = (vx - prevVx) / Math.max(dt, 1e-3);
    const wantRoll =
      -p.x * 0.1 + Math.sin(t * 0.4) * 0.03 + THREE.MathUtils.clamp(-vx * 0.2 - latAcc * 0.012, -0.5, 0.5);
    roll.current += (wantRoll - roll.current) * Math.min(dt * 2.2, 1);

    const scale = shown.current * (ps.current * 0.66 + lunge.current * 0.1);
    g.position.set(px.current + bobX, py.current + bobY, pz.current);

    // Nose first: aim along the ship's own velocity, blended toward the
    // resting three-quarter as it slows, kept a little into the page so the
    // hull always reads in three-quarter.
    const k = THREE.MathUtils.clamp(speed / 1.6, 0, 1);
    if (speed > 1e-4) _dir.set(vx / speed, vy / speed, -0.55);
    else _dir.copy(REST_AIM);
    _dir.normalize().multiplyScalar(k).addScaledVector(REST_AIM, 1 - k).normalize();
    aim.current.lerp(_dir, Math.min(dt * 2.6, 1)).normalize();
    g.quaternion.setFromUnitVectors(NEG_Z, aim.current);
    g.rotateY(yaw.current * 0.5);
    g.rotateZ(roll.current);
    g.scale.setScalar(Math.max(scale, 0.001));

    // Sun over the reader's left shoulder, in the ship's frame; a fill from
    // the lower right so the underside is not a silhouette.
    _tmp.set(-2.2, 3.4, 3.2);
    keyDir.copy(g.worldToLocal(_tmp.add(g.position))).normalize();
    _tmp.set(2.5, -0.6, 3.5);
    fillDir.copy(g.worldToLocal(_tmp.add(g.position))).normalize();

    // Engines: idle glow, brighter with speed, flaring on acceleration, full
    // on a departure. Thrust is what the reader hears the ship "doing".
    const thrust = THREE.MathUtils.clamp(
      0.1 + speed * 0.18 + acc.current * 0.45 + signal.velocity * 0.5 + lunge.current * 0.6 + (departing.current > 0 ? 1 : 0),
      0,
      1,
    );
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
    // engines and brightens with thrust.
    const el = light.current;
    if (el) {
      const sx = (nx * 0.5 + 0.5) * 100;
      const sy = (0.5 - ny * 0.5) * 100;
      el.style.transform = `translate3d(${((sx / 100) * window.innerWidth).toFixed(1)}px, ${(((sy + 6) / 100) * window.innerHeight).toFixed(1)}px, 0)`;
      const onScreen = Math.abs(nx) < 1.3 && Math.abs(ny) < 1.3 ? 1 : 0;
      el.style.setProperty("--li", (shown.current * onScreen * (0.35 + thrust * 0.65)).toFixed(3));
    }
    decay(dt);
  });

  return <ShipModel ref={ship} keyDir={keyDir} fillDir={fillDir} />;
}

export default function Companion() {
  const [enabled, setEnabled] = useState(false);
  const [coarse, setCoarse] = useState(false);
  // Distinct from `coarse` (touch capability): this is about viewport
  // shape, not input type — a narrow window on a mouse-driven laptop hits
  // the same low-right-crosses-content problem a phone does. Same 768px
  // breakpoint the rest of the site uses for mobile layout.
  const [narrow, setNarrow] = useState(false);
  // Nothing draws until the hull's shaders have compiled in parallel.
  const [warm, setWarm] = useState(false);
  const pointer = useRef({ x: 0, y: 0 });
  const warp = useRef(0);
  const light = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [docked, setDocked] = useState<Waypoint[] | null>(null);
  const plan = narrow && docked ? docked : pathname === "/" ? HOME_PLAN : narrow ? PAGE_PLAN_COARSE : pagePlanFor(pathname);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
    const narrowQuery = window.matchMedia("(max-width: 767px)");
    const measureDock = () => {
      const safeTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-top")) || 0;
      setDocked(dockedPlan(window.innerWidth, window.innerHeight, safeTop));
    };
    setNarrow(narrowQuery.matches);
    if (narrowQuery.matches) measureDock();
    const onNarrowChange = (e: MediaQueryListEvent) => {
      setNarrow(e.matches);
      if (e.matches) measureDock();
    };
    narrowQuery.addEventListener("change", onNarrowChange);
    window.addEventListener("resize", measureDock, { passive: true });
    // CompanionLoader has already waited for idle; this is only so the
    // canvas is not created in the same frame the chunk finishes parsing.
    const id = window.setTimeout(() => setEnabled(true), 250);
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
      narrowQuery.removeEventListener("change", onNarrowChange);
      window.removeEventListener("resize", measureDock);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("space:warp", onWarp);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className={`${styles.layer} ${coarse ? styles.coarse : ""}`} aria-hidden="true" style={{ pointerEvents: "none" }}>
      <div ref={light} className={styles.light} />
      <Canvas
        frameloop={warm ? "demand" : "never"}
        dpr={1}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power", toneMappingExposure: 1.12 }}
        // The camera sits above and behind the ship, like the galaxy shot:
        // the wings, spine and canopy are what the reader sees.
        camera={{ position: [0, 1.9, 3.6], fov: 32, near: 0.1, far: 20 }}
        onCreated={(state) => {
          quietGL(state);
          state.camera.lookAt(0, 0, 0);
        }}
        style={{ background: "transparent", pointerEvents: "none" }}
      >
        <Pilot pointer={pointer} warp={warp} light={light} plan={plan} pathname={pathname} avoid={!narrow} />
        <WarmShaders onWarm={() => setWarm(true)} />
      </Canvas>
    </div>
  );
}
