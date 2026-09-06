import styles from "./OrbitDiagram.module.scss";

type Body = { label: string; radius: number; period: number; offset: number; signal?: boolean };

/**
 * Four concentric orbits, one per Orbit slot. Pure CSS rotation on an SVG —
 * no WebGL for something this small. Decorative, so the whole figure carries a
 * single text alternative rather than per-node labels.
 */
export default function OrbitDiagram({ bodies }: { bodies: Body[] }) {
  return (
    <div className={styles.wrap}>
      <svg
        viewBox="0 0 100 100"
        className={styles.svg}
        role="img"
        aria-label={`A diagram of four concentric orbits, labelled ${bodies
          .map((b) => b.label)
          .join(", ")}.`}
      >
        <circle cx="50" cy="50" r="2" className={styles.core} />
        <circle cx="50" cy="50" r="5" className={styles.coreRing} />

        {bodies.map((body, i) => (
          <g key={body.label}>
            <circle
              cx="50"
              cy="50"
              r={body.radius}
              className={`${styles.ring} ${i === 0 ? styles.ringActive : ""}`}
            />
            <g
              className={styles.orbiter}
              style={{
                ["--period" as string]: `${body.period}s`,
                animationDelay: `-${body.offset}s`,
              }}
            >
              <circle
                cx={50 + body.radius}
                cy="50"
                r={i === 0 ? 1.5 : 1.1}
                className={i === 0 ? styles.bodySignal : styles.body}
              />
            </g>
            <text x="50" y={50 - body.radius - 1.6} textAnchor="middle" className={styles.label}>
              {body.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
