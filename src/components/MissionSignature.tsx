/**
 * A deterministic "signature" trace for each mission — a route-like polyline
 * generated from the slug. Same slug always yields the same figure, so each
 * mission gets a stable visual identity without inventing screenshots of work
 * that cannot be shown.
 *
 * Pure SVG and fully server-rendered: no canvas, no client JS.
 */

/** mulberry32 — small, fast, deterministic. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export default function MissionSignature({
  seed,
  width = 200,
  height = 84,
  className,
}: {
  seed: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const rand = rng(hash(seed));
  const steps = 11;
  const pad = 6;

  // A monotonic-x walk with bounded vertical jitter — reads as a trace, not noise.
  const points: [number, number][] = [];
  let y = height * (0.3 + rand() * 0.4);
  for (let i = 0; i < steps; i++) {
    const x = pad + ((width - pad * 2) * i) / (steps - 1);
    y += (rand() - 0.5) * height * 0.42;
    y = Math.max(pad, Math.min(height - pad, y));
    points.push([x, y]);
  }

  const path = points.map(([x, p], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${p.toFixed(1)}`).join(" ");

  // One node on the trace is live.
  const liveIndex = 2 + Math.floor(rand() * (steps - 3));

  // Closed path for the area fill: the trace, then down and back along the
  // baseline. Kept separate from the stroke path so the line stays open.
  const area = `${path} L${(width - pad).toFixed(1)} ${height} L${pad.toFixed(1)} ${height} Z`;

  // SVG ids are document-global. Several traces render per page, so without a
  // per-instance suffix every trace after the first would reference the first
  // one's gradients.
  const uid = `sig-${hash(seed).toString(36)}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Stroke fades in from the left, so the trace reads as arriving
            rather than as a line that simply stops at the edge. */}
        <linearGradient id={`${uid}-stroke`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d0b2" stopOpacity="0.15" />
          <stop offset="55%" stopColor="#22d0b2" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#7fe9d5" stopOpacity="1" />
        </linearGradient>

        {/* Area wash under the trace, dying out before the baseline so the
            panel underneath is never hard-edged. */}
        <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d0b2" stopOpacity="0.28" />
          <stop offset="60%" stopColor="#22d0b2" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#22d0b2" stopOpacity="0" />
        </linearGradient>

        {/* Soft bloom for the live node. */}
        <radialGradient id={`${uid}-node`}>
          <stop offset="0%" stopColor="#9ffbe8" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#22d0b2" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#22d0b2" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Baseline grid — three rules, not a graph-paper mess. */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={0}
          y1={height * f}
          x2={width}
          y2={height * f}
          stroke="currentColor"
          strokeOpacity={0.09}
          strokeWidth={1}
        />
      ))}

      <path d={area} fill={`url(#${uid}-area)`} stroke="none" />

      <path
        d={path}
        fill="none"
        stroke={`url(#${uid}-stroke)`}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Bloom sits under the node itself, so the core stays crisp. */}
      <circle
        cx={points[liveIndex][0]}
        cy={points[liveIndex][1]}
        r={9}
        fill={`url(#${uid}-node)`}
      />

      {points.map(([x, p], i) => (
        <circle
          key={i}
          cx={x}
          cy={p}
          r={i === liveIndex ? 2.6 : 1.3}
          fill={i === liveIndex ? "#c7fff2" : "currentColor"}
          fillOpacity={i === liveIndex ? 1 : 0.3}
        />
      ))}
    </svg>
  );
}
