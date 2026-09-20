import type { CSSProperties } from "react";
import type { Decision } from "@/content/decisions";
import styles from "./Beacons.module.scss";

/**
 * Beacons — navigation markers along a route. One per flight rule: a
 * wireframe mast with a lamp that blinks in sequence, the rule beside it,
 * the fact beneath. The route is a dashed line down the left, the same
 * language as the flight log. No cards; hairline cells on the ground.
 */
export default function Beacons({
  items,
  compact,
  // /decisions puts the beacons straight under the page h1, so each call is
  // an h2 there; on the home page they sit under the leg's h2 and stay h3.
  headingLevel: Heading = "h3",
}: {
  items: Decision[];
  compact?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  return (
    <ol className={`${styles.route} ${compact ? styles.compact : ""}`} aria-label="Flight rules">
      {items.map((d, i) => (
        <li
          key={d.id}
          id={d.id}
          className={`${styles.beacon} flies`}
          data-flight={i % 2 ? "right" : "left"}
          style={{ "--lag": `${i * 8}%`, "--blink": `${i * 0.35}s` } as CSSProperties}
        >
          <span className={styles.mast} aria-hidden="true">
            <svg viewBox="0 0 40 72" width="40" height="72">
              <path d="M20 66V18" />
              <path d="M8 66h24" />
              <path d="M12 30l8-6 8 6" />
              <path d="M13 44l7-5 7 5" />
              <circle className={styles.lamp} cx="20" cy="12" r="4" />
              <circle className={styles.halo} cx="20" cy="12" r="8" />
            </svg>
          </span>

          <div className={styles.body}>
            <p className={styles.index}>
              <span>Rule {String(i + 1).padStart(2, "0")}</span>
              <span className={styles.where}>{d.where}</span>
              {d.measured ? <span className={styles.measured}>{d.measured} measured</span> : null}
              {d.site ? <span className={styles.measured}>verifiable in the source</span> : null}
            </p>
            <Heading className={styles.call}>{d.call}</Heading>
            <p className={styles.fact}>{d.fact}</p>
            <p className={styles.evidence}>
              <span>Evidence</span> {d.evidence}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
