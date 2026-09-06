/**
 * The deterministic figure behind every mission's "signature" trace.
 *
 * This geometry used to live inside `MissionSignature.tsx`, which renders it as
 * SVG. It was lifted out so the 3D card gallery can draw the SAME figure into a
 * canvas texture without going anywhere near React.
 *
 * The tempting alternative — render `<MissionSignature />` with
 * `renderToStaticMarkup`, serialise it to a `data:image/svg+xml` URL and
 * `drawImage` it — is wrong twice over: it pulls `react-dom/server` into the
 * CLIENT bundle, and it introduces an async image decode that then has to be
 * sequenced against first render. Sharing the maths instead means the SVG and
 * the texture cannot drift, and costs nothing at runtime.
 *
 * NOTHING HERE MAY CHANGE THE FIGURE.
 *
 * `rand()` is consumed in a specific order — once for the opening y, once per
 * step, then once for the live node — and every mission's identity across the
 * whole site is a function of that order. Reordering or adding a call silently
 * reshapes every trace on /lab, /field-notes, /missions and every MissionRow.
 * Verified byte-for-byte against the pre-extraction render with tools/imgdiff.mjs.
 */

/** mulberry32 — small, fast, deterministic. */
export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** How many points the walk visits. */
export const SIGNATURE_STEPS = 11;

/** Inset from the edges, in the same units as `width`/`height`. */
export const SIGNATURE_PAD = 6;

export type SignatureFigure = {
  /** The trace, in [x, y] pairs sized to the width/height passed in. */
  points: [number, number][];
  /** Which point along the trace is the live one. */
  liveIndex: number;
};

/**
 * The figure for one seed, scaled to an arbitrary box.
 *
 * Scale-independent by construction: every coordinate is derived from `width`
 * and `height`, so a 200x84 SVG and a 384x512 texture describe the same walk at
 * different sizes rather than two different walks.
 */
export function signatureFigure(
  seed: string,
  width: number,
  height: number,
): SignatureFigure {
  const rand = rng(hash(seed));
  const steps = SIGNATURE_STEPS;
  const pad = SIGNATURE_PAD;

  // A monotonic-x walk with bounded vertical jitter — reads as a trace, not noise.
  const points: [number, number][] = [];
  let y = height * (0.3 + rand() * 0.4);
  for (let i = 0; i < steps; i++) {
    const x = pad + ((width - pad * 2) * i) / (steps - 1);
    y += (rand() - 0.5) * height * 0.42;
    y = Math.max(pad, Math.min(height - pad, y));
    points.push([x, y]);
  }

  // One node on the trace is live. Must stay the LAST draw from `rand()`.
  const liveIndex = 2 + Math.floor(rand() * (steps - 3));

  return { points, liveIndex };
}
