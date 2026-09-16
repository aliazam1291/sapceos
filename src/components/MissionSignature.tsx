/**
 * A deterministic "signature" trace for each mission — a route-like polyline
 * generated from the slug. Same slug always yields the same figure, so each
 * mission gets a stable visual identity without inventing screenshots of work
 * that cannot be shown.
 *
 * Pure SVG and fully server-rendered: no canvas, no client JS.
 */

import { hash, signatureFigure, SIGNATURE_PAD } from "@/lib/signature";

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
  // Shared with the 3D card texture — see src/lib/signature.ts. The walk and
  // the live node are computed there so the SVG and the texture can never
  // describe different figures for the same mission.
  const pad = SIGNATURE_PAD;
  const { points, liveIndex } = signatureFigure(seed, width, height);

  const path = points.map(([x, p], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${p.toFixed(1)}`).join(" ");

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
          <stop offset="0%" stopColor="#2fbf8a" stopOpacity="0.15" />
          <stop offset="55%" stopColor="#2fbf8a" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#9df2d3" stopOpacity="1" />
        </linearGradient>

        {/* Area wash under the trace, dying out before the baseline so the
            panel underneath is never hard-edged. */}
        <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2fbf8a" stopOpacity="0.28" />
          <stop offset="60%" stopColor="#2fbf8a" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#2fbf8a" stopOpacity="0" />
        </linearGradient>

        {/* Soft bloom for the live node. */}
        <radialGradient id={`${uid}-node`}>
          <stop offset="0%" stopColor="#d2f7e8" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#2fbf8a" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#2fbf8a" stopOpacity="0" />
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
          fill={i === liveIndex ? "#ecfdf5" : "currentColor"}
          fillOpacity={i === liveIndex ? 1 : 0.3}
        />
      ))}
    </svg>
  );
}
