"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import GalaxyParticles from "./GalaxyParticles";
import { getGlowTexture } from "./glowTexture";
import StarSystemNode from "./StarSystemNode";
import StarDetailDrawer from "./StarDetailDrawer";
import GalaxyHUD from "./GalaxyHUD";
import { cameraFocus } from "./cameraFocus";
import { GALAXY_NODES, type GalaxyNode, type StarCategory } from "./galaxyData";
import styles from "./InteractiveGalaxy.module.scss";
import { useSceneFrameloop } from "@/lib/use-scene-frameloop";
import { decidePerfLevel, perf } from "@/lib/perf";
import { WarmShaders } from "./useWarmShaders";
import { registerHeavyScene } from "@/lib/scene-load";
import GalaxyShip from "./GalaxyShip";
import Starship from "./Starship";
import AsteroidField from "./AsteroidField";
import Nebula from "./Nebula";
import ShootingStars from "./ShootingStars";
import Cinematic from "./Cinematic";
import { spaceSound } from "@/lib/spaceSound";
import { signal, decay } from "@/lib/scroll-signal";
import { quietGL } from "@/lib/gl";

// Pulled back from (0, 5, 7.5). The outermost hub nodes sit at ~3.8 units and
// their HTML labels extend further still, so the tighter framing clipped
// "Field Notes" against the panel's right edge.
const DEFAULT_CAM_POS = new THREE.Vector3(0, 5.2, 7.8);
const DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, 0);
const DEFAULT_DIST = DEFAULT_CAM_POS.length();

/** Module-scope scratch, reused by the camera rig every frame. */
const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _arc = new THREE.Vector3();
const _side = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
/** Seconds a transit between systems takes; the camera eases along an arc. */
const TRANSIT = 1.6;

/*
 * Pointer position, -1..1 across the viewport, tracked at WINDOW level.
 *
 * R3F's own `state.pointer` only updates while the pointer is over the canvas
 * and the event actually reaches it — and the hero stacks the copy column, a
 * spotlight div and the HUD chrome above this canvas, so large parts of the
 * stage never report. Measured against the scene's idle drift, a lean driven by
 * `state.pointer` came out at 1.3x baseline: technically present, invisible in
 * practice. A window listener sees every move.
 */
const pointer = { x: 0, y: 0 };

/*
 * How far the hero itself has scrolled, 0 -> 1, independent of document length.
 *
 * The hero is the full-viewport block at the top of the page, so scroll
 * position over viewport height IS its own progress - no per-frame
 * getBoundingClientRect, no layout read inside the render loop. The shared
 * `signal` in scroll-signal.ts carries whole-document progress, which is the
 * wrong denominator here: on a long page the hero would be finished before
 * `signal.progress` reached 0.05.
 *
 * Written on a passive listener and only ever READ inside useFrame, damped -
 * the scene never animates off the scroll event itself.
 */
const heroScroll = { t: 0 };

function trackHeroScroll() {
  if (typeof window === "undefined") return () => {};
  /*
   * Normalised against 55% of the viewport, not all of it.
   *
   * Measured on a four-frame strip at 0 / 0.35 / 0.7 / 1: the galaxy has left
   * the frame by roughly half a viewport of scroll, so mapping the rake across
   * a full one spent more than half its angular range off-screen, where the
   * only thing it accomplished was burning GPU. Finishing the rake while the
   * map is still substantially in frame makes the visible part of the move the
   * whole of the move.
   */
  const onScroll = () => {
    const span = Math.max(window.innerHeight * 0.55, 1);
    heroScroll.t = Math.min(window.scrollY / span, 1);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}

function trackPointer() {
  if (typeof window === "undefined") return () => {};
  const onMove = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };
  const onLeave = () => {
    pointer.x = 0;
    pointer.y = 0;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  return () => {
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerleave", onLeave);
  };
}

// The spiral's particles reach out to maxRadius 6.5 (GalaxyParticles) and hub
// nodes sit as far out as ~3.8 units. A camera distance below this floor
// means the near clipping plane is effectively inside the star field: HTML
// labels (which scale with 1/distance) balloon into each other, and planet
// spheres blow past the frustum edges — which is what "zoom in, zoom out,
// nothing" turns out to mean when you actually try it. Distance is clamped
// to this floor regardless of how far zoomScale climbs, so a future change
// to the zoom bounds can't reintroduce the same break.
const MIN_ORBIT_DIST = 5.5;
// Far enough back that the focused star reads as a star with its system
// around it. At 1.4 the camera sat almost on the surface and the node filled
// a third of the viewport as a featureless pale disc.
const MIN_FOCUS_DIST = 2.9;

/*
 * Scroll rakes the camera down through the galactic plane.
 *
 * The rig used to normalise DEFAULT_CAM_POS and only scale it, which meant the
 * viewing ANGLE was a constant for the entire life of the page - every zoom was
 * a dolly along one fixed line, and scrolling did nothing to the hero at all.
 * Elevation and azimuth are now the things scroll drives: the map starts raked
 * well above the plane looking down onto the spiral, and as the hero scrolls
 * away the camera falls toward the plane and swings round, so the spiral turns
 * from a disc into a near-edge-on band on the way out.
 *
 * Angles in radians from the +Y axis: 0.62 is a high three-quarter look-down,
 * 1.24 is close to grazing the plane.
 */
const POLAR_TOP = 0.62;
const POLAR_OUT = 1.24;
const AZIMUTH_SWING = 0.5;

/** How much of the way toward a hovered node the camera drifts. */
const HOVER_PULL = 0.16;
const HOVER_LOOK = 0.3;

const BASE_FOV = 60;
// The flight uses a longer lens. A 60° field is a phone camera: it makes
// the subject small and the space between bodies exaggerated. ~38° is a
// portrait lens — the subject fills the frame and the galaxy behind it
// compresses into a backdrop, which is what a photograph of a planet
// looks like.
const FLIGHT_FOV = 38;

/**
 * Framerate-independent damping: the fraction of the remaining distance to
 * cover this frame, given a rate constant and a frame time. The old
 * `Math.min(delta * 4.5, 0.15)` was an approximation of this that quietly
 * changed behaviour with refresh rate - on a 144Hz panel it damped along a
 * different curve than on 60Hz. DESIGN_DIRECTION.md names this exact form.
 */
function damp(lambda: number, dt: number) {
  return 1 - Math.exp(-lambda * dt);
}

function CameraController({
  focusedNode,
  hoveredNode,
  zoomScale,
  flight = false,
  leaving = false,
}: {
  focusedNode: GalaxyNode | null;
  hoveredNode: GalaxyNode | null;
  zoomScale: number;
  /** Flight mode: approach a system, don't park on top of it. */
  flight?: boolean;
  /** The flight is ending: drop the flight flag so the companion can take over. */
  leaving?: boolean;
}) {
  const { camera, gl } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  // Where a transit started (camera and look-at), so the path between two
  // systems can be a curve on a clock rather than a straight damped slide.
  const transitFrom = useRef(new THREE.Vector3());
  const transitLookFrom = useRef(new THREE.Vector3());
  // Alternates each transit so the flight banks left, then right.
  const transitSide = useRef(1);
  // Is the canvas actually on screen? The frameloop keeps running a little
  // past the edge (its observer has a margin), and the last beat's focus
  // never clears — so without this the flight flag stayed raised into the
  // hangar and the companion ship stayed hidden there.
  const onScreen = useRef(true);
  useEffect(() => {
    const el = gl.domElement;
    const io = new IntersectionObserver(([e]) => { onScreen.current = e.isIntersecting && e.intersectionRatio > 0.2; }, { threshold: [0, 0.2, 0.5] });
    io.observe(el);
    return () => io.disconnect();
  }, [gl]);
  // Scroll is damped through its own state rather than read raw, so a trackpad
  // flick cannot snap the camera a quarter-turn in a single frame.
  const scrollT = useRef(0);
  // Time on the current system; resets on arrival so each shot starts fresh.
  const flightT = useRef(0);
  const lastFocusId = useRef<string | null>(null);

  useFrame((_, delta) => {
    if (focusedNode?.id !== lastFocusId.current) {
      lastFocusId.current = focusedNode?.id ?? null;
      flightT.current = 0;
      transitFrom.current.copy(camera.position);
      transitLookFrom.current.copy(currentLookAt.current);
      transitSide.current = -transitSide.current;
    }
    // Clamped so a backgrounded tab resuming does not hand us a one-second
    // delta and teleport the rig.
    const dt = Math.min(delta, 0.05);

    // Scratch vectors, not fresh ones. These two allocations ran on EVERY
    // frame of every visit - 120 throwaway Vector3s a second handed to the
    // collector, which the motion contract in DESIGN_DIRECTION.md rules out
    // by name ("No per-frame allocation. Reuse scratch vectors").
    const targetPos = _pos;
    const targetLookAt = _look;

    scrollT.current += (heroScroll.t - scrollT.current) * damp(3.2, dt);
    const st = scrollT.current;

    if (focusedNode) {
      const [nx, ny, nz] = focusedNode.position;
      if (flight) {
        /*
         * A shot, not a lock. The camera settles into a slow orbit around the
         * body at a low angle — the way an establishing shot circles a
         * planet — and eases in a little over the dwell, so a held beat is
         * never a still frame. The body sits left of centre, clear of the HUD.
         */
        flightT.current += dt;
        const t = flightT.current;
        const azimuth = 0.55 + Math.sin(t * 0.11) * 0.42;
        // Close, on a long lens: the subject is the shot, the galaxy is
        // its backdrop. Eases in a little over the dwell.
        const radius = 3.1 - Math.min(t * 0.05, 0.4);
        // Above the disc plane: from inside the dust the field is a wall of
        // discs; from ~20° up it is a galaxy with a planet in front of it.
        const elevation = 1.35 + Math.sin(t * 0.07) * 0.2;
        targetPos.set(
          nx + Math.sin(azimuth) * radius + 0.7,
          ny + elevation,
          nz + Math.cos(azimuth) * radius,
        );
        targetLookAt.set(nx + 0.5, ny + 0.05, nz);

        /*
         * The transit is a flight, not a slide (2026-09-18). For the first
         * TRANSIT seconds after a beat change the target itself travels from
         * where the camera was to the new system's orbit on a smoothstep —
         * real acceleration and deceleration — along an arc that swings
         * out to the side and climbs over the dust, alternating sides each
         * leg so the flight banks left, then right. The damped camera below
         * follows this moving target; after the transit the orbit above
         * takes over untouched.
         */
        if (t < TRANSIT) {
          const u = t / TRANSIT;
          const e = u * u * (3 - 2 * u);
          _arc.subVectors(targetPos, transitFrom.current);
          const len = _arc.length();
          _side.crossVectors(_arc.normalize(), UP).normalize().multiplyScalar(transitSide.current);
          const amp = Math.min(len * 0.22, 1.6);
          // sin² not sin: zero slope at both ends, so the path leaves toward
          // the destination and swings out mid-way — a sin bump starts the
          // camera moving sideways, and the ship (nose along its velocity)
          // turned broadside to the lens on every departure.
          const sb = Math.sin(u * Math.PI);
          const bump = sb * sb;
          targetPos.lerpVectors(transitFrom.current, targetPos, e).addScaledVector(_side, bump * amp);
          targetPos.y += bump * amp * 0.4;
          targetLookAt.lerpVectors(transitLookFrom.current, targetLookAt, e);
        }
      } else {
        const offset = Math.max(3.4 / zoomScale, MIN_FOCUS_DIST);
        targetPos.set(nx, ny + 0.7, nz + offset);
        targetLookAt.set(nx, ny, nz);
      }
    } else {
      const dist = Math.max(DEFAULT_DIST / zoomScale, MIN_ORBIT_DIST);

      /*
       * Spherical, so distance and angle are genuinely independent - the zoom
       * controls still own the radius while scroll owns where the camera sits
       * on the sphere around the core. Smoothstepping the angle rather than
       * taking scroll linearly keeps the first few pixels gentle, so the hero
       * does not lurch the instant the wheel moves.
       */
      const eased = st * st * (3 - 2 * st);
      const polar = POLAR_TOP + (POLAR_OUT - POLAR_TOP) * eased;
      const azimuth = AZIMUTH_SWING * eased;

      const sinP = Math.sin(polar);
      targetPos.set(
        Math.sin(azimuth) * sinP * dist,
        Math.cos(polar) * dist,
        Math.cos(azimuth) * sinP * dist,
      );
      targetLookAt.copy(DEFAULT_LOOK_AT);
    }

    /*
     * The map leans toward the cursor.
     *
     * Until now, moving the pointer anywhere except directly onto a node did
     * nothing at all - the hero's centrepiece was inert unless you happened to
     * find one of fifteen small targets. A slight camera offset makes the whole
     * stage answer the pointer, and because it moves the CAMERA rather than the
     * contents, the parallax between near and far nodes is real.
     *
     * Held back while a node is focused: the drawer is open and the framing is
     * doing a job, so the camera should stop wandering.
     */
    const lean = focusedNode ? 0.25 : 1;
    targetPos.x += pointer.x * 1.6 * lean;
    targetPos.y += pointer.y * 0.9 * lean;

    /*
     * Hover pulls the framing, it does not fly to it.
     *
     * Clicking a node already flies the camera, and doing anything close to
     * that on hover would make the map feel like it was grabbing at the
     * cursor. This is a fractional drift toward the hovered body plus a
     * slightly stronger bias on the look-at target, so the node you are
     * considering settles toward the centre of frame and the ones behind it
     * part around it. Off while a node is focused, for the same reason the
     * pointer lean is.
     */
    if (hoveredNode && !focusedNode) {
      const [hx, hy, hz] = hoveredNode.position;
      targetPos.x += (hx - targetPos.x) * HOVER_PULL;
      targetPos.y += (hy - targetPos.y) * HOVER_PULL;
      targetLookAt.x += (hx - targetLookAt.x) * HOVER_LOOK;
      targetLookAt.y += (hy - targetLookAt.y) * HOVER_LOOK;
      targetLookAt.z += (hz - targetLookAt.z) * HOVER_LOOK;
    }

    const k = damp(4.5, dt);
    camera.position.lerp(targetPos, k);
    currentLookAt.current.lerp(targetLookAt, k);
    camera.lookAt(currentLookAt.current);

    /*
     * Speed widens the lens a touch, so a flick reads as the field opening up
     * rather than the whole frame simply translating - the same lever a dolly
     * zoom pulls, at a small enough fraction that it registers as momentum
     * instead of as an effect. Driven off the shared scroll signal's decaying
     * velocity, and `decay` is called here because this is the render loop
     * consuming it.
     */
    // Focus follows the subject. Bodies and dust read this to go soft
    // when they are off the focal plane.
    const inFlight = flight && focusedNode && onScreen.current && !leaving ? 1 : 0;
    cameraFocus.on += (inFlight - cameraFocus.on) * damp(3, dt);
    // The galaxy's ship has the frame from boarding until the climb-out.
    const shipLive = flight && onScreen.current && !leaving ? 1 : 0;
    // Snapped on the first frame: the companion reads this to yield, and a
    // one-second ramp from 0 let it fly in and fade out again while the
    // galaxy was boarding (two ships at the right edge, 2026-09-19). The
    // damp is for the hand-off at the climb-out, where it should ease.
    if (!cameraFocus.tick) cameraFocus.ship = shipLive;
    else cameraFocus.ship += (shipLive - cameraFocus.ship) * damp(3, dt);
    const nowMs = performance.now();
    if (cameraFocus.tick) cameraFocus.frameMs += (Math.min(nowMs - cameraFocus.tick, 2000) - cameraFocus.frameMs) * 0.2;
    // (`space:ready` — the launch screen's galaxy milestone — now fires from
    // WarmRoot once the shaders have compiled, not on this first frame: the
    // first frame draws nothing while the compile is in flight.)
    cameraFocus.tick = nowMs;
    if (focusedNode) {
      const [fx, fy, fz] = focusedNode.position;
      const d = Math.hypot(camera.position.x - fx, camera.position.y - fy, camera.position.z - fz);
      cameraFocus.dist += (d - cameraFocus.dist) * damp(4, dt);
      cameraFocus.target.x = fx;
      cameraFocus.target.y = fy;
      cameraFocus.target.z = fz;
    }

    const cam = camera as THREE.PerspectiveCamera;
    if (cam.isPerspectiveCamera) {
      const base = BASE_FOV + (FLIGHT_FOV - BASE_FOV) * cameraFocus.on;
      const wanted = base + signal.velocity * 4;
      if (Math.abs(cam.fov - wanted) > 0.01) {
        cam.fov += (wanted - cam.fov) * damp(6, dt);
        cam.updateProjectionMatrix();
      }
    }
    decay(dt);
  });

  return null;
}

/** The bright nucleus, built from the shared radial-falloff sprite. */
/**
 * Hands the R3F `invalidate` out to the component that owns the frameloop
 * decision, so a "demand" canvas can be ticked from outside the Canvas.
 */
function InvalidateBridge({ target }: { target: React.MutableRefObject<(() => void) | null> }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    target.current = invalidate;
    return () => {
      target.current = null;
    };
  }, [invalidate, target]);
  return null;
}

function CoreGlow() {
  const glowMap = getGlowTexture();
  const inner = useRef<THREE.Sprite>(null);
  const hazeWide = useRef<THREE.MeshBasicMaterial>(null);
  const hazeWarm = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    if (!inner.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
    inner.current.scale.set(1.1 * pulse, 1.1 * pulse, 1);
    // The plane haze is a map-altitude effect. Seen edge-on from inside the
    // disc it is a fog over the whole lower frame, so it fades with the flight.
    const k = 1 - cameraFocus.on * 0.85;
    if (hazeWide.current) hazeWide.current.opacity = 0.22 * k;
    if (hazeWarm.current) hazeWarm.current.opacity = 0.3 * k;
  });

  if (!glowMap) return null;

  return (
    <group>
      {/* The disc itself as light: a flat warm haze in the galactic plane,
          brightest at the core, so the space between stars is not black —
          a galaxy is a glowing thing, not a scatter of dots. Two layers:
          a wide cool one and a tight warm one. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[13, 13]} />
        <meshBasicMaterial ref={hazeWide} map={glowMap} color="#3a8f7a" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[6.5, 6.5]} />
        <meshBasicMaterial ref={hazeWarm} map={glowMap} color="#ffc98a" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Pulled in from 3.4 / 0.32. The wide teal bloom was reaching most of
          the way across the panel and washing the nodes it sat behind, so the
          map lost its blacks and every planet picked up a green cast. */}
      <sprite scale={[2.6, 2.6, 1]}>
        <spriteMaterial
          map={glowMap}
          color="#ffe2b0"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.22}
        />
      </sprite>
      {/* Anamorphic streak: the same radial sprite squashed flat, which is
          what a bright point does in a lens. It is the cue that says "sun"
          rather than "glow". */}
      <sprite scale={[7.5, 0.16, 1]}>
        <spriteMaterial
          map={glowMap}
          color="#ffd9a0"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.55}
        />
      </sprite>
      <sprite scale={[0.14, 3.2, 1]}>
        <spriteMaterial
          map={glowMap}
          color="#ffe8c8"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.22}
        />
      </sprite>
      <sprite ref={inner} scale={[1.1, 1.1, 1]}>
        <spriteMaterial
          map={glowMap}
          color="#fff4dd"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.38}
        />
      </sprite>
    </group>
  );
}

interface InteractiveGalaxyProps {
  className?: string;
  allowFullscreen?: boolean;
  /** Home-hero context: fades at its own edges instead of sitting in a hard-bordered box. */
  embedded?: boolean;
  /** Node id to fly the camera to (flight mode); null flies back out. */
  flightTo?: string | null;
  /** When true, the page drives focus and the detail drawer stays closed. */
  flightControlled?: boolean;
  /** The flight is ending: the ship climbs out and the companion takes over. */
  flightLeaving?: boolean;
}

export default function InteractiveGalaxy({
  className,
  allowFullscreen = true,
  embedded = false,
  flightTo = null,
  flightControlled = false,
  flightLeaving = false,
}: InteractiveGalaxyProps) {
  const [category, setCategory] = useState<StarCategory>("all");
  const [focusedNode, setFocusedNode] = useState<GalaxyNode | null>(null);

  /*
   * Flight mode: the page drives the camera. The home page pins the hero
   * and maps scroll progress to a node id; when it changes the camera flies
   * there exactly as a click would, and clearing it flies back out. The
   * detail drawer stays closed — the page renders its own HUD beside the
   * body — and the map's own click-to-focus keeps working in between.
   */
  useEffect(() => {
    if (!flightControlled) return;
    if (flightTo === null) {
      setFocusedNode(null);
      setZoomScale(embedded ? 1.2 : 1.0);
      return;
    }
    const node = GALAXY_NODES.find((n) => n.id === flightTo) ?? null;
    setFocusedNode(node);
    // A modest approach, not a close-up. Up close the bodies are low-poly
    // props and the dust turns to discs; from here the system reads as a
    // place and the HUD carries the detail.
    if (node) setZoomScale(1.12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightTo, flightControlled]);
  /*
   * Hover is held here rather than only inside the node so the camera can read
   * it. It is a ref-like piece of state on purpose: it changes at most once per
   * node crossing, not per frame, so the re-render it triggers is cheap and the
   * camera reads a plain prop instead of subscribing to anything.
   */
  const [hoveredNode, setHoveredNode] = useState<GalaxyNode | null>(null);
  /*
   * The hero starts closer than the full-page map does.
   *
   * DEFAULT_CAM_POS was pulled back to (0, 5.2, 7.8) — distance 9.37 — so the
   * outermost hub nodes' HTML labels would not clip against the panel edge.
   * That was tuned when the embedded panel was roughly 587px wide. It is now
   * ~1152px at 2000px viewport, and at that size the same framing leaves the
   * galaxy as a small cluster adrift in a large dark rectangle: the canvas
   * fills its stage correctly, the SUBJECT inside it does not.
   *
   * `dist = DEFAULT_DIST / zoomScale`, floored at MIN_ORBIT_DIST (5.5), so
   * 1.38 puts the hero camera at 6.8 units — about 27% closer, which reads as
   * roughly a third larger — while leaving headroom before the floor. The
   * full-page /galaxy route keeps 1.0, where the wider viewport already gives
   * the map room and the labels have somewhere to go.
   */
  /*
   * 1.2, down from 1.38, now that the hero panel is the right half of the
   * shell (see home.module.scss .heroPanel) rather than 55vw. At ~720px wide
   * and nearly square, 1.38 pushed the outer nodes and their orbits past the
   * panel edge, where the section's overflow clipped them into a hard frame;
   * 1.0 fit but left the galaxy a small cluster in a large dark field.
   */
  // Full-frame hero: the camera sits back so the field reads as a galaxy
  // seen from a distance rather than a handful of large solids up close.
  const [zoomScale, setZoomScale] = useState<number>(embedded ? 1.2 : 1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mirrors the site-wide switch (lib/spaceSound.ts); the HUD's button is
  // one more place to flip it.
  const [isMuted, setIsMuted] = useState(true);
  useEffect(() => {
    setIsMuted(spaceSound.getMutedState());
    return spaceSound.subscribe((on) => setIsMuted(!on));
  }, []);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    "COGNITIVE INTERFACE INITIALIZED.",
    "SYSTEM OVERSEER CAPABILITY: ACTIVE.",
    "AWAITING SELECTION SIGNAL..."
  ]);

  const addTelemetryLog = (msg: string) => {
    setTelemetryLogs((prev) => {
      const next = [...prev, msg];
      if (next.length > 5) {
        return next.slice(next.length - 5);
      }
      return next;
    });
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    spaceSound.toggleMute(nextMute);
    addTelemetryLog(nextMute ? "[SYS] AUDIO TRANSCEIVER DEACTIVATED." : "[SYS] AUDIO COMM-LINK OPERATIONAL.");
  };

  // Device capabilities — resolved client-side only to avoid hydration mismatch
  // Reduced motion is no longer read here — useSceneFrameloop folds it into the
  // one `frameloop` value, so there is a single decision point for this canvas.
  // Decided BEFORE the first render, not in an effect (2026-09-22): this
  // component is `ssr: false` (GalaxyNavigator), so there is nothing to
  // mismatch — and an effect-time flip rebuilt the scene (the map ship
  // unmounted, particle count and dpr changed, every world went compact)
  // one frame after WarmShaders had compiled the mouse-pointer scene. The
  // real first draw then compiled 14 new programs synchronously: measured
  // with tools/tick-probe.cjs on a phone viewport, 16 → 30 programs at the
  // first frame and the hero black for 7 s after warm-up said go.
  const [isCoarse, setIsCoarse] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setIsCoarse(coarse);
    /*
     * The scroll trackers run on EVERY device, coarse pointer included - the
     * camera rake is the one hero interaction a touch user can actually
     * perform, so gating it behind a mouse would leave phones with a fully
     * static map. Only the cursor lean is mouse-only.
     */
    /*
     * The shared scroll sampler is no longer started here. `SmoothScroll` in
     * the root layout owns it for the whole site, so it is already running
     * before this scene mounts. Starting it twice was harmless only by
     * accident — `startScrollSignal` guards on a module flag and hands the
     * second caller a no-op cleanup — but it meant whichever component mounted
     * first silently owned teardown for everyone.
     */
    const stopHeroScroll = trackHeroScroll();
    const stopPointer = coarse ? undefined : trackPointer();
    return () => {
      stopHeroScroll();
      stopPointer?.();
    };
  }, []);

  const filteredNodes = useMemo(() => {
    if (category === "all") return GALAXY_NODES;
    return GALAXY_NODES.filter((node) => node.category === category);
  }, [category]);

  // 1.6 is where DEFAULT_DIST / zoomScale reaches MIN_ORBIT_DIST in
  // CameraController — capping here too means the "+" button stops moving
  // the camera and stops climbing the % readout at the same point, instead
  // of the readout ticking up to 320% while the view has visibly stopped
  // changing several clicks earlier.
  const handleZoomIn = () => {
    setZoomScale((p) => Math.min(p + 0.2, 1.6));
    spaceSound.playClick();
  };
  const handleZoomOut = () => {
    setZoomScale((p) => Math.max(p - 0.2, 0.7));
    spaceSound.playClick();
  };
  const handleReset = () => {
    setFocusedNode(null);
    setCategory("all");
    setZoomScale(1.0);
    spaceSound.playClick();
  };
  const toggleFullscreen = () => {
    setIsFullscreen((p) => !p);
    spaceSound.playClick();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocusedNode(null);
        if (isFullscreen) setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visibleLoop = useSceneFrameloop(canvasRef);
  // The quality level, decided once at mount (see lib/perf.ts). Point and
  // rock counts cannot change live; dpr and the frame cap can.
  const [level] = useState(() => (typeof window === "undefined" ? "high" : decidePerfLevel()));
  const low = level === "low";
  // The frame cap is for a software rasteriser only (Lighthouse, PageSpeed):
  // a real GPU at a low level keeps every vsync — a 20 fps hero scene made the
  // lead ship stutter on an Intel iGPU (Ali, 2026-09-19).
  // …and a power saver (battery low and not charging, or reduced data) caps
  // the hero at 30 fps: the one place the GPU burns, on a phone that is
  // trying not to (2026-09-21). Level is untouched; this is power, not speed.
  const [saver, setSaver] = useState(perf.saver);
  useEffect(() => {
    const on = (e: Event) => setSaver(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener("space:power", on);
    return () => window.removeEventListener("space:power", on);
  }, []);
  const throttle = perf.software || saver;
  /*
   * Two reasons to stop drawing every frame (2026-09-19):
   *  - the launch screen is up: it covers this canvas completely, and the
   *    galaxy only needs its FIRST frame drawn (that frame fires
   *    `space:ready`, which the boot log waits for). Rendering the whole
   *    scene at full rate behind an opaque overlay for the 3-8 s a reader
   *    spends there was the single largest cost of a first visit;
   *  - a low level: on a software rasteriser or a weak GPU the scene runs
   *    on demand at ~20 fps instead of on every vsync — a third of the work,
   *    and the flight still reads as motion.
   * Both go through R3F's "demand" mode and a ticker that decides when the
   * next frame is worth drawing, the same shape as the Companion's loop.
   */
  const [booting, setBooting] = useState(false);
  useEffect(() => {
    const read = () => setBooting(document.documentElement.hasAttribute("data-booting"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-booting"] });
    return () => mo.disconnect();
  }, []);
  // Nothing draws until the shaders have compiled in parallel (WarmShaders);
  // `space:ready` — the launch screen's galaxy milestone — fires then.
  const [warm, setWarm] = useState(false);
  const onWarm = useCallback(() => {
    setWarm(true);
    window.dispatchEvent(new Event("space:ready"));
  }, []);
  const frameloop = !warm ? "never" : visibleLoop === "always" && (booting || throttle) ? "demand" : visibleLoop;
  const invalidateRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (frameloop !== "demand" || !throttle || booting) return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last >= (perf.software ? 50 : 33)) {
        last = now;
        invalidateRef.current?.();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [frameloop, throttle, booting]);

  // While this scene is running, the always-on 2D layers back off (see
  // lib/scene-load.ts): they are mostly hidden behind it anyway.
  useEffect(() => {
    if (frameloop !== "always") return;
    return registerHeavyScene();
  }, [frameloop]);

  // Denser in the hero: at the pulled-back camera, more and finer points
  // read as dust and gas rather than as sparkles.
  // A galaxy is a haze of tens of thousands of pinpricks, not thousands of
  // discs. Points are near-free on the GPU; the cost was never count.
  const starCount = low ? 6000 : isCoarse ? 9000 : embedded ? 26000 : 20000;
  /*
   * Fill-rate is the whole cost of this scene — thousands of additive point
   * sprites — and it scales with the square of the pixel ratio. 1.75 was
   * ~2x the pixels of 1.25 for no visible gain on a field of sub-pixel
   * dust. The hero, which is full-frame, sits at the lower cap.
   */
  // 1.25 on every level (was 1.35 on high): the hero scrolled at 30 fps on
  // an Intel iGPU that reports "high" by cores and memory alone (2026-09-20).
  const dpr: [number, number] = low ? [0.75, 1] : [1, 1.25];

  return (
    <div
      className={`${styles.shell} ${embedded ? styles.embedded : ""} ${isFullscreen ? styles.fullscreen : ""} ${className ?? ""}`}
    >
      {/*
        * The canvas is hidden from assistive technology on purpose.
        *
        * A WebGL canvas announces nothing, and this one is not decoration — it
        * is fifteen navigable destinations. Rather than describe the picture,
        * the same systems are published as a real list below, which is what
        * screen readers and keyboards actually operate. Labelling the canvas
        * AND the list would just announce everything twice.
        */}
      <Canvas
        onCreated={quietGL}
        ref={canvasRef}
        aria-hidden="true"
        frameloop={frameloop}
        className={styles.canvas}
        // R3F sets its own inline `position: relative` on this container,
        // which silently wins over the stylesheet's `position: absolute`
        // (inline beats an external rule that isn't !important) and left the
        // canvas sized by a stale pre-layout measurement instead of filling
        // `.shell`. Passing position/inset explicitly here means OUR values
        // are what R3F merges in, so the fill is anchored directly to the
        // container's edges instead of depending on percentage-height
        // resolution timing.
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        // Deselect only when a click genuinely hits empty space. This used to
        // be an onClick on the wrapper <div>, which broke selection outright:
        // R3F's stopPropagation() only halts propagation between 3D objects,
        // so the native DOM click still bubbled out to the wrapper and cleared
        // focusedNode in the same tick it was set — the detail drawer could
        // never open at all.
        onPointerMissed={() => setFocusedNode(null)}
        camera={{ position: [0, 5, 7.5], fov: 60, near: 0.1, far: 100 }}
        dpr={dpr}
        // MSAA on: it does nothing for the dust but everything for planet
        // limbs and ring edges, which is where "pixelated" was coming from.
        // This is the one scene that earns the real GPU — "low-power" on a
        // dual-GPU laptop means the integrated chip.
        // MSAA moves into the composer (multisampling={4} in Cinematic).
        gl={{ antialias: false, powerPreference: embedded ? "high-performance" : "low-power" }}
      >
        {/* Clear to the page ground, so a masked edge is invisible. */}
        <color attach="background" args={["#060606"]} />
        <InvalidateBridge target={invalidateRef} />
        <CameraController
          focusedNode={focusedNode}
          hoveredNode={hoveredNode}
          zoomScale={zoomScale}
          flight={flightControlled}
          leaving={flightLeaving}
        />

        {/* The ship and its scan cone are a map-view prop; at flight
            distance the cone reads as a green wedge across the frame. */}
        {!isCoarse && !flightControlled && (
          <GalaxyShip focusedNode={focusedNode} onTelemetry={addTelemetryLog} />
        )}

        {/* One sun for everything with a standard material (rocks, the map
            ship): the core, warm, inverse-square. Ambient stays low so a rock
            has a dark side — that is the whole point of a rock. */}
        <ambientLight intensity={0.22} color="#7fa8b0" />
        <pointLight position={[0, 0, 0]} intensity={7} color="#ffe2b0" distance={16} decay={2} />

        {/* Far background: colour and structure behind the disc. */}
        <Nebula />
        <ShootingStars />

        <GalaxyParticles count={starCount} dpr={isCoarse ? 1.25 : 1.5} />

        {/* Galactic core. Two additive sprites — a warm inner point and a wide
            teal bloom — instead of the old emissive sphere, which rendered as
            a hard-edged white blob sitting on top of the star field. */}
        <CoreGlow />
        {/* The operator's ship flies lead through the mission flight. */}
        <Starship phase={!flightControlled ? "off" : flightLeaving ? "leaving" : focusedNode ? "flight" : "boarding"} />
        {/* Rocks: lit, opaque, tumbling — the occluders the field lacked. */}
        <AsteroidField count={low ? 90 : isCoarse ? 160 : 320} />

        {filteredNodes.map((node) => (
          <StarSystemNode
            key={node.id}
            node={node}
            isFocused={focusedNode?.id === node.id}
            anyFocused={Boolean(focusedNode)}
            compact={isCoarse}
            showLabels={!embedded}
            // Hero: bodies are worlds in a field, not the subject. About 30%
            // smaller than the map view, so the dust carries the picture.
            sizeScale={embedded ? 0.68 : 1}
            onHover={setHoveredNode}
            onSelect={(selected) => {
              setFocusedNode(selected);
              setZoomScale(1.8);
            }}
          />
        ))}

        {/* The lens: bloom, depth of field on the flight subject, a touch of
            chromatic fringing. See Cinematic.tsx. */}
        <Cinematic />
        <WarmShaders onWarm={onWarm} />
      </Canvas>

      {/* Vignette and grain over the render — see .lens in the module. */}
      <div className={styles.lens} aria-hidden="true" />

      {/*
       * The star map as operable navigation.
       *
       * Every node was a pointer-only target: tabbing through the home page
       * produced zero stops inside the hero, and a screen reader was told
       * nothing at all about the site's centrepiece. This list is the same set
       * of systems in the same order, visually hidden but fully focusable.
       *
       * Focus flies the camera and opens the detail panel — the identical
       * result as clicking the body — so the 3D is not a separate experience
       * that keyboard users get a text fallback for; it is the same one.
       */}
      <nav className={styles.srOnly} aria-label="Star map systems">
        <ul>
          {filteredNodes.map((node) => (
            <li key={node.id}>
              <button
                type="button"
                aria-current={focusedNode?.id === node.id ? "true" : undefined}
                onFocus={() => {
                  setFocusedNode(node);
                  setZoomScale(1.8);
                }}
                onClick={() => {
                  setFocusedNode(node);
                  setZoomScale(1.8);
                }}
              >
                {node.title}
                {node.role ? ` — ${node.role}` : ""}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <GalaxyHUD
        category={category}
        onSelectCategory={setCategory}
        zoomLevel={zoomScale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        focusedTitle={focusedNode?.title}
        isFullscreen={isFullscreen}
        onToggleFullscreen={allowFullscreen ? toggleFullscreen : undefined}
        compact={embedded}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        telemetryLogs={telemetryLogs}
      />

      {focusedNode && !flightControlled && (
        <div onClick={(e) => e.stopPropagation()}>
          <StarDetailDrawer node={focusedNode} onClose={() => setFocusedNode(null)} />
        </div>
      )}
    </div>
  );
}
