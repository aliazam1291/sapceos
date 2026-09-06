"use client";

import Counter from "./Counter";
import PageForm from "@/components/space/PageForm";
import styles from "./Bento.module.scss";

const loop = [
  "Problem", "Understand", "Strategy", "UX", "Technology", "Build", "Ship", "Learn",
];

/**
 * The operating-loop section, as an asymmetric grid rather than another
 * full-width text block. Every number here comes from PROFILE.md.
 */
export default function Bento() {
  return (
    <div className={styles.grid}>
      <div className={`${styles.tile} ${styles.loop}`} data-reveal>
        <span className={styles.tileLabel}>Operating loop</span>
        <ul className={styles.loopChain}>
          {loop.map((step, i) => (
            <li
              key={step}
              className={`${styles.loopStep} ${i === 0 ? styles.loopStepLead : ""}`}
            >
              {step}
            </li>
          ))}
        </ul>
      </div>

      <div className={`${styles.tile} ${styles.object}`} data-reveal>
        <PageForm
          form="probe"
          seed="space-os"
          label="A slowly tumbling wireframe probe: an octahedral core on four struts, each ending in a small instrument cross."
          className={styles.canvasHost}
        />
        <span className={styles.objectCaption}>Fig. 01 — system form</span>
      </div>

      <div className={`${styles.tile} ${styles.note}`} data-reveal>
        <span className={styles.tileLabel}>What the role actually is</span>
        <div className={styles.noteText}>
          <p>
            Across every project the shape is the same: I own the frontend, I own the UI/UX, I
            work across teams, and I end up writing the PRD — problem statement, user stories,
            acceptance criteria, the edge cases nobody wants to think about.
          </p>
          <p>
            Not because the title says so. Because someone has to decide what matters first,
            and that decision is usually the one holding everything else up.
          </p>
        </div>
      </div>

      <div className={`${styles.tile} ${styles.stat1}`} data-reveal>
        <span className={styles.tileLabel}>Live projects</span>
        <span className={styles.tileValue}>
          <Counter value={5} suffix="+" />
        </span>
        <span className={styles.tileNote}>In production at MapMyIndia</span>
      </div>

      <div className={`${styles.tile} ${styles.stat2}`} data-reveal>
        <span className={styles.tileLabel}>Dashboard speed-up</span>
        <span className={styles.tileValue}>
          ~<Counter value={40} suffix="%" />
        </span>
        <span className={styles.tileNote}>Caching · RxJS · API optimisation</span>
      </div>

      <div className={`${styles.tile} ${styles.stat3}`} data-reveal>
        <span className={styles.tileLabel}>Studio clients</span>
        <span className={styles.tileValue}>
          <Counter value={10} suffix="+" />
        </span>
        <span className={styles.tileNote}>Smaak.ux, since 2023</span>
      </div>

      <div className={`${styles.tile} ${styles.scale}`} data-reveal>
        <span className={styles.tileLabel}>Vehicles tracked</span>
        <span className={styles.tileValue}>
          <Counter value={20000} suffix="+" />
        </span>
        <span className={styles.tileNote}>Across Maharashtra</span>
      </div>
    </div>
  );
}
