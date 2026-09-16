/**
 * A single shared read-model of the page's scroll, sampled once per frame by
 * whoever needs it (3D scenes, DOM effects) instead of each of them attaching
 * its own scroll listener.
 *
 * Scenes must never animate directly off the scroll event — that ties motion
 * to scroll-event frequency and janks. They read `signal` inside their frame
 * loop and damp toward it. This module only stores; it never animates.
 */
export type ScrollSignal = {
  /** 0 → 1 down the whole document. */
  progress: number;
  /** Pixels since the last sample. Signed: negative is scrolling up. */
  delta: number;
  /** Normalised, decaying speed — roughly 0 → 1 under a hard flick. */
  velocity: number;
};

export const signal: ScrollSignal = { progress: 0, delta: 0, velocity: 0 };

let last = 0;
let started = false;

function sample() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const y = doc.scrollTop;

  signal.progress = max > 0 ? y / max : 0;
  signal.delta = y - last;
  last = y;

  // Clamped so a fling doesn't blow the effect out; decays in `decay()`.
  const speed = Math.min(Math.abs(signal.delta) / 55, 1);
  signal.velocity = Math.max(signal.velocity, speed);
}

/**
 * Call from any render loop so velocity falls back to rest. Guarded per frame:
 * several loops can run at once (the galaxy, a page form, the horizon) and
 * each calling this would multiply the falloff, so only the first call in a
 * given frame does the work.
 */
let lastDecayFrame = -1;
export function decay(delta: number) {
  const frame = typeof performance !== "undefined" ? Math.floor(performance.now() / 8) : 0;
  if (frame === lastDecayFrame) return;
  lastDecayFrame = frame;
  signal.velocity *= Math.exp(-4.5 * delta);
  if (signal.velocity < 0.001) signal.velocity = 0;
}

export function startScrollSignal() {
  if (started || typeof window === "undefined") return () => {};
  started = true;

  last = document.documentElement.scrollTop;
  sample();

  window.addEventListener("scroll", sample, { passive: true });
  window.addEventListener("resize", sample, { passive: true });

  return () => {
    window.removeEventListener("scroll", sample);
    window.removeEventListener("resize", sample);
    started = false;
  };
}

/** Frame-rate independent damping. */
export function damp(current: number, target: number, lambda: number, delta: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * delta));
}
