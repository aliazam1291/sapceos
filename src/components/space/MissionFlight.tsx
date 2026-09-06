"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import GalaxyParticles from "./GalaxyParticles";
import Probe from "./Probe";
import StarSystemNode from "./StarSystemNode";
import { GALAXY_NODES } from "./galaxyData";
import { activeBeat, beatRange, sequence } from "@/lib/sequence";
import { useSceneFrameloop } from "@/lib/use-scene-frameloop";

/**
 * The scroll IS the journey — through the real map, stopping at real missions.
 *
 * This replaced an abstract icosahedron with four sentences of philosophy: the
 * single most expensive stretch of scroll on the site, spent saying nothing that
 * could be checked. Waypoints come from `galaxyData` by slug, so the section
 * visits the same systems the hero map does, in the same positions.
 *
 * THE CAMERA DOES NOT MOVE. THE GALAXY DOES.
 *
 * The first version flew a camera from system to system. It looked right in
 * isolation and was wrong in principle: threading a lens between fifteen bodies
 * at close range means neighbouring nodes and their orbits are permanently
 * crossing the frame edges. Every "something is getting cut" was a symptom of
 * that — and the several attempts to fix it by adjusting padding could never
 * have worked, because nothing was overflowing a box. The composition itself
 * was unstable.
 *
 * Now the whole map slides so the current mission arrives at a fixed mark. Every
 * beat gets identical framing: same distance, same clearance, subject centred and
 * high enough to clear the content band. Scroll changes which system is under the
 * mark, never where the mark is.
 */

const _from = new THREE.Vector3();
const _to = new THREE.Vector3();
const _at = new THREE.Vector3();

/** Where the subject sits, in world units. Held above the content band. */
const MARK = new THREE.Vector3(0, 0.45, 0);

/** Arrives early and settles, so each stop reads as a hold rather than a pass. */
function arrive(t: number) {
  const k = Math.min(t / 0.6, 1);
  return 1 - Math.pow(1 - k, 3);
}

/**
 * Reports the current stop, and only when it changes.
 *
 * The rig reads `sequence.p` every frame without React knowing. Which system is
 * the subject is the one thing the tree must re-render for, so it is gated to
 * the five transitions rather than fired at 60hz.
 */
function BeatWatcher({ onBeat }: { onBeat: (i: number) => void }) {
  const last = useRef(-1);
  useFrame(() => {
    const i = activeBeat(Math.min(Math.max(sequence.p, 0), 1));
    if (i !== last.current) {
      last.current = i;
      onBeat(i);
    }
  });
  return null;
}

function Map3D({
  points,
  slugs,
  beat,
  coarse,
}: {
  points: THREE.Vector3[];
  slugs: string[];
  beat: number;
  coarse: boolean;
}) {
  const world = useRef<THREE.Group>(null);
  const shown = useRef(new THREE.Vector3().copy(points[0]));

  useFrame((_, delta) => {
    const g = world.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const p = Math.min(Math.max(sequence.p, 0), 1);

    const i = activeBeat(p);
    const t = beatRange(p, i);

    // The map moves through the same buckets the copy switches on.
    _from.copy(points[Math.max(i - 1, 0)]);
    _to.copy(points[Math.min(i, points.length - 1)]);
    _at.lerpVectors(_from, _to, arrive(t));

    shown.current.lerp(_at, 1 - Math.exp(-4.2 * dt));

    // Slide the world so the subject lands on the mark.
    g.position.set(
      MARK.x - shown.current.x,
      MARK.y - shown.current.y,
      MARK.z - shown.current.z,
    );

    // A slow yaw across the section so a held beat still breathes, without the
    // framing ever changing.
    g.rotation.y = Math.sin(p * Math.PI * 2) * 0.07;
  });

  return (
    <group ref={world}>
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 0, 0]} intensity={2.4} color="#22d0b2" distance={12} />

      {/* The same spiral the hero map draws, so this happens inside the galaxy
          rather than in a separate void that merely resembles one. */}
      <GalaxyParticles count={coarse ? 2400 : 6200} dpr={coarse ? 1.25 : 1.6} />

      {/* Every system, not just the stops — the ones you pass are what make the
          map feel inhabited. With the subject on the mark everything else is
          further from the camera, so the distance fade in StarSystemNode pushes
          them back on its own. */}
      {GALAXY_NODES.map((node) => (
        <StarSystemNode
          key={node.id}
          node={node}
          isFocused={node.id === slugs[beat]}
          anyFocused
          compact={coarse}
          reticle={false}
          onSelect={() => {}}
        />
      ))}
    </group>
  );
}

export default function MissionFlight({ slugs }: { slugs: string[] }) {
  const coarse =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameloop = useSceneFrameloop(canvasRef);
  const [beat, setBeat] = useState(0);

  const points = useMemo(
    () =>
      slugs
        .map((slug) => GALAXY_NODES.find((n) => n.id === slug))
        .filter((n): n is (typeof GALAXY_NODES)[number] => Boolean(n))
        .map((n) => new THREE.Vector3(...n.position)),
    [slugs],
  );

  if (points.length === 0) return null;

  return (
    <Canvas
      ref={canvasRef}
      aria-hidden="true"
      frameloop={frameloop}
      /*
       * Fixed. Never moved, never re-aimed — the map is what travels.
       *
       * Distance is set by how big the SUBJECT reads, not by how much of the
       * map fits: at 6.2 units a mission body subtended under 4 degrees and
       * there was no discernible focus in frame, just a scatter. At 3.6 it is
       * unmistakably the thing being talked about.
       */
      camera={{ position: [0, 0.45, 3.6], fov: 42, near: 0.05, far: 90 }}
      dpr={coarse ? 1 : [1, 1.6]}
      gl={{ antialias: !coarse, alpha: true, powerPreference: "low-power" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <BeatWatcher onBeat={setBeat} />
      <Map3D points={points} slugs={slugs} beat={beat} coarse={coarse} />

      {/* Outside the map group on purpose: parented to the world it would slide
          with the galaxy, and the sense of travelling THROUGH it would invert.
          Skipped on coarse pointers, where the frame is too narrow to hold both
          the craft and the subject. */}
      {coarse ? null : <Probe />}
    </Canvas>
  );
}
