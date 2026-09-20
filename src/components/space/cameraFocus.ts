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
  /**
   * 1 while the galaxy's own ship (Starship) has the frame — boarding,
   * flight — and 0 once it has climbed out or the canvas is off screen.
   * The companion yields on this, not on `on`: boarding is not a beat.
   */
  ship: 0,
  /** performance.now() of the galaxy's last frame; stale means it is off-screen. */
  tick: 0,
  /** Smoothed ms between galaxy frames, so "stale" scales with the GPU. */
  frameMs: 16,
  /** The subject's world position while a beat holds. */
  target: { x: 0, y: 0, z: 0 },
};

// Readable from the console and the tools/ harnesses: which ship has the
// frame, and whether the galaxy is actually ticking.
if (typeof window !== "undefined") {
  (window as unknown as { __cameraFocus: typeof cameraFocus }).__cameraFocus = cameraFocus;
}
