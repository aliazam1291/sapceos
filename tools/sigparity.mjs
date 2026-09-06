/*
 * Does the extracted signature module reproduce the ORIGINAL figure exactly?
 *
 * A pixel diff cannot answer this: MissionSignature renders over the animated
 * starfield, so every screenshot differs from every other screenshot no matter
 * what the SVG does. This reimplements the pre-extraction algorithm verbatim
 * and compares coordinates, which is deterministic and load-independent.
 */
import { signatureFigure } from '../src/lib/signature.ts';
// Slugs inlined rather than imported: missions.ts imports './types' without an
// extension, which node's type-stripping cannot resolve. The list is only a
// source of seeds here, so a drifted copy would weaken coverage, not soundness.
const missions = ['technician-app','mappls-shop-admin','iocl-geortd','vahan-shakti','intouch','locate','control-tower','indane-yatra-mitra','fastag-platform','hermes'].map((slug) => ({ slug }));

// ── The original, copied from MissionSignature.tsx before the extraction.
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function original(seed, width, height) {
  const rand = rng(hash(seed));
  const steps = 11;
  const pad = 6;
  const points = [];
  let y = height * (0.3 + rand() * 0.4);
  for (let i = 0; i < steps; i++) {
    const x = pad + ((width - pad * 2) * i) / (steps - 1);
    y += (rand() - 0.5) * height * 0.42;
    y = Math.max(pad, Math.min(height - pad, y));
    points.push([x, y]);
  }
  const liveIndex = 2 + Math.floor(rand() * (steps - 3));
  return { points, liveIndex };
}

let bad = 0;
const seeds = [...missions.map((m) => m.slug), 'field-note-a', 'lab-thing', ''];
// Both the SVG's own size and the texture size, to prove scale-independence.
for (const [w, h] of [[200, 84], [384, 512]]) {
  for (const s of seeds) {
    const a = original(s, w, h);
    const b = signatureFigure(s, w, h);
    const same =
      a.liveIndex === b.liveIndex &&
      a.points.length === b.points.length &&
      a.points.every((p, i) => p[0] === b.points[i][0] && p[1] === b.points[i][1]);
    if (!same) { bad++; console.log(`MISMATCH ${w}x${h} "${s}"`); }
  }
}
console.log(bad === 0
  ? `identical for ${seeds.length} seeds at both sizes (${seeds.length * 2} cases) — extraction is faithful`
  : `${bad} MISMATCHES`);
process.exit(bad === 0 ? 0 : 1);
