/**
 * Where the companion ship is and what it is doing, shared per frame.
 *
 * Written by Companion, read by DeepSpace so the star field answers the
 * ship: stars slide against its lateral motion, and a burn pulls streaks
 * toward it. Normalised to the viewport (−1…1), not world units, because
 * the two live in different canvases with different cameras.
 */
export const shipState = {
  /** Screen position, −1…1 (x right, y up). */
  x: 0.65,
  y: -0.55,
  /** Screen velocity, per second, same units. */
  vx: 0,
  vy: 0,
  /** 0 idle … 1 full burn. */
  thrust: 0,
  /** 1 while the ship is on screen, 0 when it has yielded. */
  on: 0,
  /** 1 while the Touchdown section is in view: the ship is on the pad, so
   *  the companion hides (written by Landing, read by Companion). */
  landed: 0,
  /** 1 while the black hole has the ship (Singularity in view): the
   *  companion hides and the ship in the scene takes over. */
  captured: 0,
};

if (typeof window !== "undefined") {
  (window as unknown as { __shipState: typeof shipState }).__shipState = shipState;
}
