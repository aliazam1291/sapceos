import { plottable, type Figure } from "@/lib/figures";
import styles from "./ScaleRail.module.scss";

/*
 * The scale rail (2026-09-24). Ali: "add success metrics and stats … with
 * data visualisation charts and space elements in charts."
 *
 * A log axis drawn as a flight path: decade ticks along a trajectory, and
 * each measured figure as a body on it — a lit core, an orbital ring, a
 * halo. The point it makes is the one a number alone cannot: 200,000 users
 * and 20,000 vehicles are not neighbours, they are a decade apart, and a
 * linear bar would have flattened that.
 *
 * Every plotted point comes from a figure PROFILE.md already states; the
 * position is parsed out of that string (lib/figures.ts) and the string
 * itself is what gets printed. Nothing is smoothed, projected or filled in.
 * A figure with no quantity in it ("Live on Play Store") is not plotted.
 *
 * `context` is the rest of the portfolio's measured numbers, drawn faint:
 * it is what makes a single mission's figure legible as a position rather
 * than a boast. Wireframe emerald — this is an instrument, not a world.
 */

const W = 720;
const H = 132;
const PAD_L = 26;
const PAD_R = 26;
const AXIS_Y = 84;

/** Decade ticks that span the data, at least 10 → 1M. */
function decades(min: number, max: number) {
  const lo = Math.floor(Math.log10(Math.max(min, 1)));
  const hi = Math.ceil(Math.log10(Math.max(max, 10)));
  const out: number[] = [];
  for (let e = lo; e <= hi; e++) out.push(10 ** e);
  return out;
}

const short = (n: number) =>
  n >= 1e6 ? `${n / 1e6}M` : n >= 1e3 ? `${n / 1e3}K` : String(n);

export default function ScaleRail({
  figures,
  context = [],
  caption,
}: {
  figures: Figure[] | undefined;
  /** Other measured magnitudes on the site, drawn as faint markers. */
  context?: number[];
  caption?: string;
}) {
  const points = plottable(figures).filter((p) => p.kind === "scale");
  if (points.length === 0) return null;

  const all = [...points.map((p) => p.magnitude), ...context];
  const ticks = decades(Math.min(...all), Math.max(...all));
  const lo = Math.log10(ticks[0]);
  const hi = Math.log10(ticks[ticks.length - 1]);
  const x = (n: number) => PAD_L + ((Math.log10(n) - lo) / (hi - lo || 1)) * (W - PAD_L - PAD_R);

  // Alternate above and below the rail so two close figures never collide.
  const placed = [...points]
    .sort((a, b) => a.magnitude - b.magnitude)
    .map((p, i) => ({ ...p, up: i % 2 === 0 }));

  const summary = `Measured figures on a logarithmic scale: ${points
    .map((p) => `${p.value} ${p.label.toLowerCase()}`)
    .join(", ")}.`;

  return (
    <figure className={styles.rail} data-reveal>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={summary} preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="rail-halo">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* The trajectory. */}
        <line x1={PAD_L} y1={AXIS_Y} x2={W - PAD_R} y2={AXIS_Y} className={styles.axis} />

        {/* Decade markers. */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} y1={AXIS_Y - 5} x2={x(t)} y2={AXIS_Y + 5} className={styles.tick} />
            <text x={x(t)} y={AXIS_Y + 20} className={styles.tickLabel} textAnchor="middle">
              {short(t)}
            </text>
          </g>
        ))}

        {/* The rest of the portfolio, faint: this figure in its company. */}
        {context.map((c, i) => (
          <circle key={`${c}-${i}`} cx={x(c)} cy={AXIS_Y} r="3" className={styles.ghost} />
        ))}

        {/* The figures themselves: halo, ring, core. */}
        {placed.map((p) => {
          const cx = x(p.magnitude);
          const cy = p.up ? AXIS_Y - 30 : AXIS_Y + 34;
          return (
            <g key={p.label} className={styles.body}>
              <line x1={cx} y1={AXIS_Y} x2={cx} y2={cy} className={styles.stem} />
              <circle cx={cx} cy={cy} r="16" fill="url(#rail-halo)" />
              <ellipse cx={cx} cy={cy} rx="11" ry="4" className={styles.ring} />
              <circle cx={cx} cy={cy} r="5" className={styles.core} />
            </g>
          );
        })}
      </svg>

      {/* The values as text, always, in source order — the chart is the
          second way to read them, never the only one. */}
      <figcaption className={styles.caption}>
        <ul className={styles.legend}>
          {points.map((p) => (
            <li key={p.label}>
              <span className={styles.legendValue}>{p.value}</span> {p.label.toLowerCase()}
            </li>
          ))}
        </ul>
        <span className={styles.note}>{caption ?? "Log scale · faint markers are this site’s other measured figures"}</span>
      </figcaption>
    </figure>
  );
}
