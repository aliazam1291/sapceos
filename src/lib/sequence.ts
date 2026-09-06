/**
 * Bridge between GSAP ScrollTrigger and the R3F render loop.
 *
 * GSAP scrubs a plain object; the scene reads it inside useFrame and damps
 * toward it. Keeping GSAP off the Object3D transforms matters — if both GSAP
 * and useFrame write the same property they fight, and the result stutters.
 */
export const sequence = { p: 0 };

/**
 * How many beats the sequence is cut into — one per mission the flight visits.
 *
 * Keep in step with `featuredMissions` and with the pinned track height in
 * MissionSequence.module.scss: (BEATS * BEAT_SCROLL) + 100 vh.
 */
export const BEATS = 5;

/**
 * Viewport-heights of scroll per beat.
 *
 * At 100 the sequence cost five full screens of scrolling, which is a lot to
 * ask before the page continues. 60 keeps each beat legible while cutting the
 * whole section from 500vh to 340vh.
 *
 * The pinned track in MissionSequence.module.scss must stay in sync:
 *   height = (BEATS * BEAT_SCROLL) + 100  vh
 */
export const BEAT_SCROLL = 60;

/** Progress 0-1 remapped to a 0-1 ramp inside one beat. */
export function beatRange(p: number, index: number) {
  const span = 1 / BEATS;
  return Math.min(Math.max((p - index * span) / span, 0), 1);
}

/** Which beat is currently on screen. */
export function activeBeat(p: number) {
  return Math.min(Math.floor(p * BEATS), BEATS - 1);
}
