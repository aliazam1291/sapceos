"use client";

import { useState } from "react";
import styles from "./CareerLoop.module.scss";

/**
 * The loop, as an instrument you can step around.
 *
 * PROFILE.md states the career loop as one line —
 * PROBLEM → UNDERSTAND → STRATEGY → UX → TECHNOLOGY → BUILD → SHIP → LEARN →
 * NEXT PROBLEM — and calls the thing it describes "the differentiator, and it
 * is verifiable — it is literally the job he is doing right now." It was the
 * single most useful piece of material in that file and appeared nowhere on
 * the site.
 *
 * A ring rather than a row, because the last stage feeds the first and a row
 * with an arrow bending back on itself is a diagram of a loop rather than a
 * loop. Eight nodes on a circle, one lit at a time.
 *
 * PROGRESSIVE ENHANCEMENT. Every stage's copy is in the server-rendered DOM
 * at all times; JS only collapses it to one at a time. With scripting off the
 * whole loop reads as a plain ordered list — see `.detail` in the stylesheet,
 * where the collapsing is applied under `[data-enhanced]` only. That is the
 * same shape the reduced-motion and no-JS paths take everywhere else here.
 *
 * The SVG ring itself is `aria-hidden`: it carries no information the list of
 * stages does not already carry, and describing it as well would announce the
 * same thing twice.
 */

type Stage = {
  key: string;
  /** What the stage is called in PROFILE.md's own line. */
  label: string;
  /** One line on what actually happens there. */
  body: string;
};

/*
 * COPY OWNERSHIP NOTE.
 *
 * The stage NAMES are Ali's, verbatim from PROFILE.md. The one-line
 * descriptions under them are written copy, grounded in the role PROFILE.md
 * verifies — "frontend implementation + UI/UX ownership + cross-functional
 * team collaboration + acting as de facto product/project manager — writing
 * PRDs, not just executing someone else's spec". They deliberately describe
 * HOW the work goes and claim no outcomes, because outcome metrics for the
 * active missions are marked unverified in PROFILE.md and must not be
 * estimated. Worth replacing with Ali's own words when he has a moment;
 * nothing here is a fact that would be wrong, but they are my sentences.
 */
const STAGES: Stage[] = [
  {
    key: "problem",
    label: "Problem",
    body: "Someone describes what is going wrong, in their own words and rarely in product terms. The job starts by taking that seriously rather than translating it too early.",
  },
  {
    key: "understand",
    label: "Understand",
    body: "Sit with the actual workflow — who touches it, where it breaks, and which parts are a person quietly compensating for the software.",
  },
  {
    key: "strategy",
    label: "Strategy",
    body: "Decide what is worth building and, more importantly, what is not. This is where the PRD gets written, and writing it is part of the role rather than someone else's handoff.",
  },
  {
    key: "ux",
    label: "UX",
    body: "Design the thing against the real constraints: who is using it, on what, and under what pressure. Field tools and dashboards fail differently.",
  },
  {
    key: "technology",
    label: "Technology",
    body: "Choose the stack for the problem rather than for the CV — and stay close enough to it to know when a design decision has quietly become an engineering one.",
  },
  {
    key: "build",
    label: "Build",
    body: "Implement the frontend. Owning both the design and the code means the compromises get made deliberately instead of discovered at integration.",
  },
  {
    key: "ship",
    label: "Ship",
    body: "Get it in front of the people who described the problem, across whatever teams have to move for that to happen.",
  },
  {
    key: "learn",
    label: "Learn",
    body: "Find out what it actually changed, which is usually not the thing that was predicted — and that answer becomes the next problem.",
  },
];

/** Node coordinates on a unit circle, starting at twelve o'clock. */
function nodeAt(index: number, count: number, radius: number) {
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
  return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius };
}

export default function CareerLoop() {
  const [active, setActive] = useState(0);

  return (
    <div className={styles.loop} data-enhanced>
      <div className={styles.ringWrap}>
        <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true">
          <circle className={styles.orbit} cx="50" cy="50" r="38" />
          {STAGES.map((stage, i) => {
            const p = nodeAt(i, STAGES.length, 38);
            return (
              <g key={stage.key}>
                <circle
                  className={styles.node}
                  cx={p.x}
                  cy={p.y}
                  r={i === active ? 3.4 : 1.9}
                  data-on={i === active || undefined}
                />
              </g>
            );
          })}
        </svg>

        {/* The lit stage, named in the middle of its own ring. */}
        <p className={styles.ringLabel} aria-hidden="true">
          <span className={styles.ringIndex}>
            {String(active + 1).padStart(2, "0")}
          </span>
          {STAGES[active].label}
        </p>
      </div>

      <ol className={styles.stages}>
        {STAGES.map((stage, i) => (
          <li key={stage.key} className={styles.stage} data-on={i === active || undefined}>
            <button
              type="button"
              className={styles.stageButton}
              aria-expanded={i === active}
              aria-controls={`loop-${stage.key}`}
              // Focus selects too, so tabbing through the loop walks it
              // rather than requiring a separate activation at every stop.
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
            >
              <span className={styles.stageIndex}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.stageLabel}>{stage.label}</span>
            </button>
            <p id={`loop-${stage.key}`} className={styles.detail}>
              {stage.body}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
