"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import ProjectCard from "./ProjectCard";
import GalaxyParticles from "./GalaxyParticles";
import { getCardTexture, getPlaceholderTexture, type CardFace } from "./cardTexture";
import { arrive, cameraPosition, cameraTarget, cardPosition } from "./spiral";
import { sequence, stopCoord } from "@/lib/sequence";
import { useSceneFrameloop } from "@/lib/use-scene-frameloop";

/**
 * The pinned home flight, replacing MissionFlight.
 *
 * THE CAMERA MOVES HERE, and that is a deliberate break from MissionFlight's
 * "the camera does not move, the galaxy does" — see spiral.ts for why that is
 * safe: the helix is generated, not hand-placed, so clearance between cards is
 * a function of two constants and was solved for (tools/spiralsolve.mjs) and
 * is checked (tools/spiralfit.mjs), rather than being an unstable composition
 * discovered by eye.
 */

const HOVER_PULL = 0.16;

/** Hysteresis: how far scroll must drift from where a card was selected before
 *  the selection clears itself. No ScrollTrigger.disable, no scroll lock — the
 *  reader who keeps scrolling simply leaves, which is what
 *  DESIGN_DIRECTION.md's ban on scroll hijacking asks for. */
const SELECT_DRIFT = 0.06;

const _camPos = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _cardPos = new THREE.Vector3();
const _lookAt = new THREE.Vector3();
const _presentPos = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();

function Rig({
  faces,
  coarse,
  hoveredIndex,
  selectedIndex,
  setHoveredIndex,
  setSelectedIndex,
}: {
  faces: CardFace[];
  coarse: boolean;
  hoveredIndex: number | null;
  selectedIndex: number | null;
  setHoveredIndex: (i: number | null) => void;
  setSelectedIndex: (i: number | null) => void;
}) {
  const { camera } = useThree();
  const [textures, setTextures] = useState<(THREE.Texture | null)[]>(() =>
    faces.map(() => null),
  );
  const pAtSelect = useRef<number | null>(null);

  // Textures built once, chunked across idle callbacks — ten Canvas2D draws in
  // one tick is enough to drop a frame, and this runs right as the reader
  // arrives at the section. Same idea as GalaxyNavigator's idle gate, applied
  // per-card instead of per-scene.
  useEffect(() => {
    let cancelled = false;
    let handle: number | ReturnType<typeof setTimeout>;
    const idle = typeof window.requestIdleCallback === "function";

    const step = (i: number) => {
      if (cancelled || i >= faces.length) return;
      const tex = getCardTexture(faces[i], coarse);
      if (tex) {
        setTextures((prev) => {
          const next = prev.slice();
          next[i] = tex;
          return next;
        });
      }
      schedule(i + 1);
    };
    const schedule = (i: number) => {
      if (i >= faces.length) return;
      handle = idle
        ? window.requestIdleCallback(() => step(i), { timeout: 800 })
        : setTimeout(() => step(i), 0);
    };
    schedule(0);

    return () => {
      cancelled = true;
      if (idle) window.cancelIdleCallback(handle as number);
      else clearTimeout(handle as ReturnType<typeof setTimeout>);
    };
    // faces identity is stable for the section's lifetime (built from content).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coarse]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = 1 - Math.exp(-4.2 * dt);
    const p = Math.min(Math.max(sequence.p, 0), 1);
    const n = faces.length;

    // Auto-clear a stale selection: the reader scrolled on without closing it.
    if (selectedIndex !== null && pAtSelect.current !== null) {
      if (Math.abs(p - pAtSelect.current) > SELECT_DRIFT) {
        setSelectedIndex(null);
        pAtSelect.current = null;
      }
    }

    let targetPos: THREE.Vector3;
    let targetLook: THREE.Vector3;

    if (selectedIndex !== null) {
      /*
       * Presentation pose = exactly the pose this card already gets when the
       * flight naturally arrives on it — `cameraPosition`/`cameraTarget` at an
       * INTEGER stop, rather than a new hand-picked distance.
       *
       * The first version offset the camera by a flat +1.5 units, which put it
       * roughly 2.4 units closer than the flight's normal viewing distance
       * (CAM_Z = 3.9 in spiral.ts). The card filled most of the viewport and
       * visually collided with the DOM text band underneath it — the same
       * title and org appeared twice, once enormous from the 3D card and once
       * from the band. Reusing the normal arrival pose keeps the card at the
       * size spiralfit.mjs already verified fits at every aspect ratio (an
       * integer stop is literally one of the points that harness samples),
       * with zero new magic numbers to keep in sync.
       */
      targetPos = cameraPosition(selectedIndex, _presentPos);
      targetLook = cameraTarget(selectedIndex, _cardPos);
    } else {
      // Continuous stop coordinate: -1 offset matches MissionFlight's own
      // arrive() convention, where index i is "arrived" once s reaches i.
      const raw = stopCoord(p, n);
      const i = Math.min(Math.floor(raw), n - 1);
      const t = raw - i;
      const s = i - 1 + arrive(t);

      cameraPosition(s, _camPos);
      cameraTarget(s, _camTarget);

      // Fractional pull toward the hovered card, same constants InteractiveGalaxy
      // uses for its hero hover response — one feel across the site.
      if (hoveredIndex !== null && !coarse) {
        cardPosition(hoveredIndex, _cardPos);
        _camPos.x += (_cardPos.x - _camPos.x) * HOVER_PULL * 0.3;
        _camTarget.x += (_cardPos.x - _camTarget.x) * HOVER_PULL;
        _camTarget.y += (_cardPos.y - _camTarget.y) * HOVER_PULL;
      }

      targetPos = _camPos;
      targetLook = _camTarget;
    }

    camera.position.lerp(targetPos, k);
    _lookAt.copy(camera.position).add(
      _up.clone().set(0, 0, -1).applyQuaternion(camera.quaternion),
    );
    _lookAt.lerp(targetLook, k * 1.4);
    camera.lookAt(_lookAt);
  });

  return (
    <>
      {faces.map((face, i) => (
        <CardWithOrientation
          key={face.slug}
          index={i}
          texture={textures[i] ?? getPlaceholderTexture()}
          hovered={hoveredIndex === i}
          selected={selectedIndex === i}
          dimmed={selectedIndex !== null && selectedIndex !== i}
          coarse={coarse}
          onHoverChange={(h) => setHoveredIndex(h ? i : null)}
          onSelect={() => {
            setSelectedIndex(selectedIndex === i ? null : i);
            pAtSelect.current = sequence.p;
          }}
        />
      ))}
    </>
  );
}

/** Wraps ProjectCard so it can orient its group toward the camera each frame
 *  without every card re-subscribing its own useThree(). */
function CardWithOrientation(props: {
  index: number;
  texture: THREE.Texture | null;
  hovered: boolean;
  selected: boolean;
  dimmed: boolean;
  coarse: boolean;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
}) {
  const { camera } = useThree();
  const ref = useRef<THREE.Group>(null);
  const pos = useMemo(() => cardPosition(props.index), [props.index]);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    /*
     * `lookAt(camera.position, g.position, up)` — CAMERA first.
     *
     * Object3D's own lookAt() convention orients an object so its local -Z
     * axis points AT the target; that is the right convention for a camera
     * (which looks down -Z) but the WRONG one to hand a PlaneGeometry, whose
     * front-face normal is +Z. Building the matrix with `lookAt(g.position,
     * camera.position, up)` — object first — pointed the plane's local -Z at
     * the camera, which put its +Z front face pointing AWAY from it: the face
     * was backface-culled every frame, and only the sprite (camera-facing
     * regardless of object rotation) and the line border (never culled)
     * reached the screen. Turning on `DoubleSide` as a first attempt only
     * proved the diagnosis — it revealed the BACK of the plane, which three.js
     * renders with reversed winding, so the text came back mirrored.
     * Swapping the two arguments points local -Z away from the camera
     * instead, so the front face is what actually faces it — no DoubleSide
     * needed, and no reversed text.
     */
    _m.lookAt(camera.position, g.position, _up);
    _q.setFromRotationMatrix(_m);
    g.quaternion.slerp(_q, Math.min(1, (1 - Math.exp(-6 * Math.min(delta, 0.05))) * 1.3));
  });

  if (!props.texture) return null;

  return (
    <group ref={ref} position={pos}>
      <ProjectCard
        position={new THREE.Vector3(0, 0, 0)}
        texture={props.texture}
        hovered={props.hovered}
        selected={props.selected}
        dimmed={props.dimmed}
        coarse={props.coarse}
        onHoverChange={props.onHoverChange}
        onSelect={props.onSelect}
      />
    </group>
  );
}

export default function CardGallery({
  faces,
  onFocusChange,
}: {
  faces: CardFace[];
  /** Reports the selected mission slug up to MissionSequence, which owns the
   *  detail panel — the gallery only decides WHICH mission, never how it is
   *  presented in text. */
  onFocusChange?: (slug: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameloop = useSceneFrameloop(canvasRef);
  const [coarse, setCoarse] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    onFocusChange?.(selectedIndex !== null ? faces[selectedIndex]?.slug ?? null : null);
  }, [selectedIndex, faces, onFocusChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // On coarse pointers, render fewer cards and drop the two priciest passes
  // (the glow sprite and the probe) — the mobile budget from
  // DESIGN_DIRECTION.md, applied here rather than a second geometry.
  const visibleFaces = coarse
    ? faces.filter((_, i) => Math.abs(i - stopCoord(sequence.p, faces.length)) < 3.2)
    : faces;

  return (
    <Canvas
      ref={canvasRef}
      aria-hidden="true"
      frameloop={frameloop}
      camera={{ position: [0, 0.3, 3.9], fov: 42, near: 0.05, far: 40 }}
      dpr={coarse ? 1 : [1, 1.6]}
      gl={{ antialias: !coarse, alpha: true, powerPreference: "low-power" }}
      style={{ position: "absolute", inset: 0 }}
      onPointerMissed={() => setSelectedIndex(null)}
    >
      <GalaxyParticles count={coarse ? 900 : 2200} />
      <Rig
        faces={faces}
        coarse={coarse}
        hoveredIndex={hoveredIndex}
        selectedIndex={selectedIndex}
        setHoveredIndex={setHoveredIndex}
        setSelectedIndex={setSelectedIndex}
      />
      {/*
        No Probe here. It was built for MissionFlight's FIXED camera — a craft
        held in frame while the map slides past it. This rig's camera moves
        continuously through world Z instead, so a probe at a fixed world
        position drifts through wildly different apparent sizes and positions
        as the camera approaches and passes it, which is what put an oversized
        ship dead-centre of an early screenshot of this section. Giving the
        probe a camera-relative transform is a real fix, not a quick one, and
        the composition risk here (see spiralfit.mjs) was the priority; cutting
        it is the honest call rather than shipping the wrong motion.
      */}
    </Canvas>
  );
}

export function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => setCoarse(window.matchMedia("(pointer: coarse)").matches), []);
  return coarse;
}
