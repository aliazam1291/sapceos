"use client";

import { useEffect, useState } from "react";
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
  // The loop runs. The active step advances on its own; hovering a step holds
  // it there. A static list of eight words said "process"; a cursor moving
  // through them says the thing actually cycles.
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState<number | null>(null);

  useEffect(() => {
    if (held !== null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % loop.length), 1400);
    return () => window.clearInterval(id);
  }, [held]);

  const current = held ?? active;

  return (
    <div className={styles.grid}>
      <div className={`${styles.tile} ${styles.loop}`} data-reveal>
        <div className={styles.loopHead}>
          <span className={styles.tileLabel}>Operating loop</span>
          <span className={styles.loopReadout} aria-live="polite">
            <i /> {String(current + 1).padStart(2, "0")} / {String(loop.length).padStart(2, "0")} · {loop[current]}
          </span>
        </div>
        <ul className={styles.loopChain} onPointerLeave={() => setHeld(null)}>
          {loop.map((step, i) => (
            <li
              key={step}
              className={styles.loopStep}
              data-active={i === current || undefined}
              data-done={i < current || undefined}
              onPointerEnter={() => setHeld(i)}
            >
              {step}
            </li>
          ))}
        </ul>
        <span className={styles.loopTrack} aria-hidden="true">
          <i style={{ width: `${((current + 1) / loop.length) * 100}%` }} />
        </span>
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
