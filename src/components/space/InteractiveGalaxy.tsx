"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import GalaxyParticles from "./GalaxyParticles";
import { getGlowTexture } from "./glowTexture";
import StarSystemNode from "./StarSystemNode";
import StarDetailDrawer from "./StarDetailDrawer";
import GalaxyHUD from "./GalaxyHUD";
import { GALAXY_NODES, type GalaxyNode, type StarCategory } from "./galaxyData";
import styles from "./InteractiveGalaxy.module.scss";
import { useSceneFrameloop } from "@/lib/use-scene-frameloop";
import GalaxyShip from "./GalaxyShip";
import { spaceSound } from "@/lib/spaceSound";
import { signal, decay } from "@/lib/scroll-signal";

// Pulled back from (0, 5, 7.5). The outermost hub nodes sit at ~3.8 units and
// their HTML labels extend further still, so the tighter framing clipped
// "Field Notes" against the panel's right edge.
const DEFAULT_CAM_POS = new THREE.Vector3(0, 5.2, 7.8);
const DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, 0);
const DEFAULT_DIST = DEFAULT_CAM_POS.length();

/** Module-scope scratch, reused by the camera rig every frame. */
const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();

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
}: {
  focusedNode: GalaxyNode | null;
  hoveredNode: GalaxyNode | null;
  zoomScale: number;
}) {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  // Scroll is damped through its own state rather than read raw, so a trackpad
  // flick cannot snap the camera a quarter-turn in a single frame.
  const scrollT = useRef(0);

  useFrame((_, delta) => {
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
      const offset = Math.max(3.4 / zoomScale, MIN_FOCUS_DIST);
      targetPos.set(nx, ny + 0.7, nz + offset);
      targetLookAt.set(nx, ny, nz);
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
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.isPerspectiveCamera) {
      const wanted = BASE_FOV + signal.velocity * 4;
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
function CoreGlow() {
  const glowMap = getGlowTexture();
  const inner = useRef<THREE.Sprite>(null);

  useFrame((state) => {
    if (!inner.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
    inner.current.scale.set(1.1 * pulse, 1.1 * pulse, 1);
  });

  if (!glowMap) return null;

  return (
    <group>
      {/* Pulled in from 3.4 / 0.32. The wide teal bloom was reaching most of
          the way across the panel and washing the nodes it sat behind, so the
          map lost its blacks and every planet picked up a green cast. */}
      <sprite scale={[2.6, 2.6, 1]}>
        <spriteMaterial
          map={glowMap}
          color="#22d0b2"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.2}
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
}

export default function InteractiveGalaxy({
  className,
  allowFullscreen = true,
  embedded = false,
}: InteractiveGalaxyProps) {
  const [category, setCategory] = useState<StarCategory>("all");
  const [focusedNode, setFocusedNode] = useState<GalaxyNode | null>(null);
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
  const [zoomScale, setZoomScale] = useState<number>(embedded ? 1.38 : 1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isMuted, setIsMuted] = useState(true);
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
    setIsMuted(nextMute);
    spaceSound.toggleMute(nextMute);
    addTelemetryLog(nextMute ? "[SYS] AUDIO TRANSCEIVER DEACTIVATED." : "[SYS] AUDIO COMM-LINK OPERATIONAL.");
  };

  useEffect(() => {
    return () => {
      // Auto-mute audio context on route change
      spaceSound.toggleMute(true);
    };
  }, []);

  // Device capabilities — resolved client-side only to avoid hydration mismatch
  // Reduced motion is no longer read here — useSceneFrameloop folds it into the
  // one `frameloop` value, so there is a single decision point for this canvas.
  const [isCoarse, setIsCoarse] = useState(false);
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
  const frameloop = useSceneFrameloop(canvasRef);

  const starCount = isCoarse ? 2600 : 7200;
  const dpr: [number, number] = isCoarse ? [1, 1.25] : [1, 1.75];

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
        gl={{ antialias: true, powerPreference: "low-power" }}
      >
        <CameraController
          focusedNode={focusedNode}
          hoveredNode={hoveredNode}
          zoomScale={zoomScale}
        />

        {/* Detailed 3D Spaceship */}
        {!isCoarse && (
          <GalaxyShip focusedNode={focusedNode} onTelemetry={addTelemetryLog} />
        )}

        <ambientLight intensity={0.6} />
        <pointLight position={[0, 0, 0]} intensity={3.0} color="#22d0b2" distance={10} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#e6ffff" />

        <GalaxyParticles count={starCount} dpr={isCoarse ? 1.25 : 1.75} />

        {/* Galactic core. Two additive sprites — a warm inner point and a wide
            teal bloom — instead of the old emissive sphere, which rendered as
            a hard-edged white blob sitting on top of the star field. */}
        <CoreGlow />

        {filteredNodes.map((node) => (
          <StarSystemNode
            key={node.id}
            node={node}
            isFocused={focusedNode?.id === node.id}
            anyFocused={Boolean(focusedNode)}
            compact={isCoarse}
            showLabels={!embedded}
            onHover={setHoveredNode}
            onSelect={(selected) => {
              setFocusedNode(selected);
              setZoomScale(1.8);
            }}
          />
        ))}
      </Canvas>

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

      {focusedNode && (
        <div onClick={(e) => e.stopPropagation()}>
          <StarDetailDrawer node={focusedNode} onClose={() => setFocusedNode(null)} />
        </div>
      )}
    </div>
  );
}
