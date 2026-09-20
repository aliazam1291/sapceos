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

/*
 * The scrollable height, cached (2026-09-20). `scrollHeight` and
 * `clientHeight` force a synchronous layout whenever style is dirty — and
 * with scroll-driven animations it is dirty on every frame — so reading them
 * on every scroll event cost 1.4 s of main thread across one reading-pace
 * scroll of the home page (tools/profile-uat.mjs SCROLL=1: this function was
 * the second-hottest on the page). It changes only when the document does:
 * a ResizeObserver on <body> and the resize event keep it current.
 */
let cachedMax = 0;
let maxDirty = true;
export function scrollMax() {
  if (maxDirty) {
    const doc = document.documentElement;
    cachedMax = Math.max(0, doc.scrollHeight - doc.clientHeight);
    maxDirty = false;
  }
  return cachedMax;
}
function invalidateMax() {
  maxDirty = true;
}

function sample() {
  const max = scrollMax();
  // window.scrollY does not force layout; documentElement.scrollTop can.
  const y = window.scrollY;

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

  last = window.scrollY;
  const onResize = () => {
    invalidateMax();
    sample();
  };
  // Content height changes (a lazy scene mounting, a pin spacer, a section
  // growing) — without this the progress would be measured against a stale
  // height until the next resize.
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(invalidateMax) : null;
  ro?.observe(document.body);
  sample();

  window.addEventListener("scroll", sample, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  return () => {
    window.removeEventListener("scroll", sample);
    window.removeEventListener("resize", onResize);
    ro?.disconnect();
    started = false;
  };
}

/** Frame-rate independent damping. */
export function damp(current: number, target: number, lambda: number, delta: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * delta));
}
