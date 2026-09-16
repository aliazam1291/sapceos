/**
 * Shared scene load. The heavy WebGL scenes register while they are mounted
 * and on screen, so the always-on background layers (the 2D star field, the
 * cursor trail) can back off rather than compete for the same frame.
 */
let heavy = 0;

export function registerHeavyScene() {
  heavy += 1;
  return () => {
    heavy = Math.max(0, heavy - 1);
  };
}

export function heavySceneLive() {
  return heavy > 0;
}
