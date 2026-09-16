/**
 * The camera's focus, shared per frame.
 *
 * Written by the galaxy's CameraController, read by every body and by the
 * dust. A real lens has one focus distance; everything nearer or farther
 * goes soft. Nothing here is a React state — it changes every frame and
 * nothing needs to re-render because of it.
 */
export const cameraFocus = {
  /** Distance from the camera to the subject, world units. */
  dist: 6,
  /** 1 while a flight beat holds a subject, 0 on the free map. Eased. */
  on: 0,
  /** performance.now() of the galaxy's last frame; stale means it is off-screen. */
  tick: 0,
  /** Smoothed ms between galaxy frames, so "stale" scales with the GPU. */
  frameMs: 16,
  /** The subject's world position while a beat holds. */
  target: { x: 0, y: 0, z: 0 },
};
