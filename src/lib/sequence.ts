/**
 * Bridge between GSAP ScrollTrigger and the R3F render loop.
 *
 * GSAP scrubs a plain object; the scene reads it inside useFrame and damps
 * toward it. Keeping GSAP off the Object3D transforms matters — if both GSAP
 * and useFrame write the same property they fight, and the result stutters.
 */
export const sequence = { p: 0 };

/**
 * How many stops the sequence visits — one per mission the card flight shows.
 *
 * Was `BEATS = 5`, one per FEATURED mission. The card gallery shows every
 * mission, not just the five featured ones, so this is now `missions.length`
 * wherever it is set (see MissionSequence.tsx) rather than a literal — the
 * constant here is the type/fallback, not the source of truth.
 */
export const STOPS = 10;

/**
 * Viewport-heights of scroll per stop.
 *
 * At the old BEATS=5, BEAT_SCROLL=60 gave 5*60+100 = 400vh. Doubling the stop
 * count while halving the per-stop scroll (30) keeps the same 400vh total —
 * 10*30+100 = 400vh — so the pinned track height in MissionSequence.module.scss
 * did not have to change when this file did.
 *
 * The pinned track must stay in sync:
 *   height = (STOPS * STOP_SCROLL) + 100  vh
 */
export const STOP_SCROLL = 30;

/** Progress 0-1 remapped to a 0-1 ramp inside one stop. */
export function stopRange(p: number, index: number, stops = STOPS) {
  const span = 1 / stops;
  return Math.min(Math.max((p - index * span) / span, 0), 1);
}

/** Which stop is currently on screen. */
export function activeStop(p: number, stops = STOPS) {
  return Math.min(Math.floor(p * stops), stops - 1);
}

/**
 * Continuous stop coordinate — for the camera, which needs to sit BETWEEN
 * stops while travelling rather than snapping from one integer to the next.
 */
export function stopCoord(p: number, stops = STOPS) {
  return Math.min(Math.max(p, 0), 1) * stops;
}
