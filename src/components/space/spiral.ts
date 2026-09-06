import * as THREE from "three";

/**
 * Where the mission cards sit, and where the camera is at a given scroll.
 *
 * Deliberately pure — no React, no scene objects. The composition is the risky
 * part of this section, so it should be arguable, and testable, without
 * mounting a canvas. `tools/spiralfit.mjs` projects every card corner through a
 * real camera at four aspect ratios and reports the worst overflow;
 * `tools/spiralsolve.mjs` searched this parameter space in the first place.
 *
 * WHY A GENERATED HELIX AND NOT THE EXISTING GALAXY SCATTER
 *
 * MissionFlight carries a hard-won decision in capitals: THE CAMERA DOES NOT
 * MOVE, THE GALAXY DOES. A moving camera was built first and reverted, because
 * threading a lens between fifteen hand-placed bodies put neighbours and their
 * orbits permanently across the frame edges — and the attempts to fix that as a
 * padding problem could never work, since nothing was overflowing a box. The
 * composition itself was unstable.
 *
 * That finding is about the SCATTER, not about moving cameras. Here the layout
 * is generated, so clearance is a function of the constants below and can be
 * asserted rather than eyeballed. A camera may move through a corridor whose
 * width is known.
 *
 * THESE NUMBERS WERE SOLVED FOR, NOT CHOSEN
 *
 * The first guess (r 2.55, dz 1.55, camZ 1.75, look 0.35) clipped cards at
 * every aspect ratio — 82% overflow on a square stage, 127% at 4:5 — and spaced
 * cards 1.60 apart when their own diagonal is 1.72, so they could intersect.
 * Both faults were invisible in the source and obvious in the projection.
 * Changing any constant below means re-running spiralfit.
 */

/** Ring radius. The camera rides inside this, not on it. */
export const R = 1.9;

/** Angle between consecutive cards, in radians (~35.5 degrees). */
export const DTHETA = 0.62;

/** Depth between consecutive cards, in world units. */
export const DZ = 2.4;

/**
 * Vertical wobble. Without it the cards sit on a flat drum and the section
 * reads as a carousel; with it the path is legibly a helix.
 */
export const YAMP = 0.34;

/**
 * Lift, so the subject clears the copy column beneath it. Same reasoning as
 * MissionFlight's MARK, which holds its subject at y = 0.45.
 */
export const Y_LIFT = 0.22;

/** How far inside the ring the camera rides, as a fraction of R. */
const CAM_R = 0.42;

/** How far behind the subject the camera sits, in world units. */
const CAM_Z = 3.9;

/** How far the aim leans from the card toward a point further down the axis. */
const LOOK_AHEAD = 0.2;

/** Card face size in world units. Anything that changes these re-runs spiralfit. */
export const CARD_W = 1.0;
export const CARD_H = 1.4;

/**
 * One geometry for every device.
 *
 * The solved constants clear a 4:5 portrait stage with 15% headroom, so the
 * tighter "mobile helix" the first draft called for is unnecessary — and a
 * second set of constants is a second thing that can silently stop matching
 * spiralfit. Coarse pointers differ in how MANY cards are drawn and in which
 * effects run, not in where the cards are.
 */

/** World position of card `i`. Accepts fractional `i` for the camera's use. */
export function cardPosition(i: number, out = new THREE.Vector3()) {
  const theta = i * DTHETA;
  return out.set(
    R * Math.cos(theta),
    YAMP * Math.sin(theta * 0.5) + Y_LIFT,
    -i * DZ,
  );
}

/**
 * Camera position at continuous stop coordinate `s`.
 *
 * Inside the helix looking outward, so the active card fills the frame while
 * its neighbours fall away to the sides instead of crowding the edges.
 */
export function cameraPosition(s: number, out = new THREE.Vector3()) {
  const theta = s * DTHETA;
  return out.set(
    CAM_R * R * Math.cos(theta),
    0.30 + 0.5 * YAMP * Math.sin(theta * 0.5),
    CAM_Z - s * DZ,
  );
}

/**
 * What the camera looks at.
 *
 * Not the active card itself: aiming straight at it makes the next card cut in
 * from the edge. Leaning toward a point further along the axis means the card
 * after this one is already entering frame as the current one settles, so
 * arrivals read as arrivals.
 */
const _ahead = new THREE.Vector3();
export function cameraTarget(s: number, out = new THREE.Vector3()) {
  cardPosition(s, out);
  _ahead.set(0, Y_LIFT, -(s + 1.15) * DZ);
  return out.lerp(_ahead, LOOK_AHEAD);
}

/**
 * Arrives early and settles, so each stop reads as a hold rather than a pass.
 *
 * Lifted verbatim from MissionFlight, where it is the reason the beats feel
 * like stops at all. Reused rather than reinvented so the two rigs cannot
 * develop different senses of timing.
 */
export function arrive(t: number) {
  const k = Math.min(t / 0.6, 1);
  return 1 - Math.pow(1 - k, 3);
}

/**
 * Smallest distance between any two cards.
 *
 * This is the number that makes a moving camera defensible here, so it is worth
 * computing rather than asserting. Must stay comfortably above the card
 * diagonal (1.72) or cards can intersect.
 */
export function minCardSeparation(count: number) {
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  let min = Infinity;
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const d = cardPosition(i, a).distanceTo(cardPosition(j, b));
      if (d < min) min = d;
    }
  }
  return min;
}
