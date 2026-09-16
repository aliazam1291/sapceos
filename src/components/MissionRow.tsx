"use client";

import Link from "next/link";
import type { Mission } from "@/content/types";
import { DRAFT } from "@/content/types";
import Hologram from "./Hologram";
import { Status } from "./ui";
import styles from "./MissionRow.module.scss";

/*
 * Which parts of a mission report are worth showing on the index.
 *
 * Every mission carries a fourteen-section report — Problem, Users, Strategy,
 * UX, Outcome and the rest — and until now every word of it sat behind a page
 * navigation. The card showed a one-line premise and a decorative trace while
 * the actual product thinking, the only thing a hiring manager is reading for,
 * went unused.
 *
 * The order here is the order those questions get asked in a real conversation:
 * what was wrong, who felt it, what you did, what happened. Whichever of them
 * this particular mission has written, in that order.
 */
const BRIEF_ORDER = ["Problem", "Context", "Users", "UX", "Strategy", "Outcome", "Learnings"];

function briefFor(mission: Mission) {
  const written = new Map(
    mission.report
      // DRAFT bodies are placeholders for work not yet verified. They are meant
      // to be visible in the full report, where the gap is the honest answer —
      // but a teaser built out of "[DRAFT — needs input]" would be worse than
      // no teaser, so they are skipped here rather than rendered as content.
      .filter((s) => s.body && s.body !== DRAFT)
      .map((s) => [s.label, s.body] as const),
  );
  return BRIEF_ORDER.filter((label) => written.has(label))
    .slice(0, 3)
    .map((label) => ({ label, body: written.get(label)! }));
}

export function MissionList({ children }: { children: React.ReactNode }) {
  return <div className={styles.list}>{children}</div>;
}

export default function MissionRow({
  mission,
  index,
}: {
  mission: Mission;
  index: number;
}) {
  const brief = briefFor(mission);

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <article className={styles.row} onPointerMove={onMove} data-reveal>
      <div className={styles.index}>{String(index + 1).padStart(2, "0")}</div>

      <div className={styles.body}>
        <div className={styles.titleLine}>
          <h3 className={styles.title}>
            <Link href={`/missions/${mission.slug}`} className={styles.link}>
              {mission.title}
            </Link>
          </h3>
          <Status idle={mission.status !== "active"}>
            {mission.status === "active" ? "Active" : "Shipped"}
          </Status>
        </div>

        <p className={styles.premise}>{mission.premise}</p>

        <dl className={styles.stats} aria-label={`${mission.title} project scale`}>
          {mission.signals.map((signal) => (
            <div key={signal.label}>
              <dt>{signal.label}</dt>
              <dd>{signal.value}</dd>
            </div>
          ))}
        </dl>

        <div className={styles.meta}>
          <span className={styles.metaValue}>{mission.org}</span>
          <span className={styles.metaValue}>{mission.stack.join(" · ")}</span>
        </div>

        {/*
         * Native <details>, not a JS disclosure.
         *
         * The content is in the served HTML either way, so it is readable and
         * searchable with scripting off; the toggle is keyboard-operable and
         * announced correctly without a line of ARIA; and there is no state to
         * hydrate, so nothing can mismatch. The animation is the progressive
         * part, added in CSS, and its absence costs nothing.
         *
         * It renders only when the mission actually has written sections —
         * an empty disclosure that opens onto nothing is worse than no control.
         */}
        {brief.length > 0 && (
          <details className={styles.brief}>
            <summary className={styles.briefToggle}>
              <span className={styles.briefToggleLabel}>Read the brief</span>
              <span className={styles.briefCount} aria-hidden="true">
                {brief.length}
              </span>
            </summary>

            {/* The grid wrapper is what animates: 0fr -> 1fr transitions to the
                content's real height without anyone having to measure it. */}
            <div className={styles.briefBody}>
              <dl className={styles.briefList}>
                {brief.map((s) => (
                  <div key={s.label}>
                    <dt>{s.label}</dt>
                    <dd>{s.body}</dd>
                  </div>
                ))}
              </dl>
              <Link href={`/missions/${mission.slug}`} className={styles.briefLink}>
                Full mission report ↗
              </Link>
            </div>
          </details>
        )}
      </div>

      {/* The project, projected: a hologram of its interface (or of its
          trace, when no interface shipped to show). */}
      <Hologram
        src={mission.cover}
        seed={mission.slug}
        tag={`M-${String(index + 1).padStart(2, "0")}`}
        className={styles.holo}
      />

      <div className={styles.arrow} aria-hidden="true">
        ↗
      </div>
    </article>
  );
}
