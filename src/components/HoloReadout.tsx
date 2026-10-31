"use client";

import { useEffect, useState } from "react";
import type { HoloInstall } from "./HoloFigure";
import styles from "./PortfolioHero.module.scss";

/**
 * The stage's corner readout, two lines at most (2026-10-31, "too
 * clustered"). While the hologram materialises it counts the skills
 * installing — "Downloading skills · 3/5 React" — then settles on "Skills
 * installed · 5/5"; the second line is always the way under the helmet,
 * worded for the device in hand.
 */
export default function HoloReadout({ skills }: { skills: string[] }) {
  const [state, setState] = useState<HoloInstall | null>(null);

  useEffect(() => {
    const on = (e: Event) => setState((e as CustomEvent<HoloInstall>).detail);
    window.addEventListener("holo:install", on);
    return () => window.removeEventListener("holo:install", on);
  }, []);

  const hint = (
    <span className={styles.hint}>
      <span className={styles.hintHover}>Hover to unmask</span>
      <span className={styles.hintTouch}>Tap him to unmask</span>
    </span>
  );

  if (!state) {
    return (
      <p className={styles.tag} aria-hidden="true">
        Subject 01
        <br />
        {hint}
      </p>
    );
  }

  const { installed, total, done } = state;
  return (
    <p className={styles.tag} data-done={done || undefined} aria-hidden="true">
      {done ? "Skills installed" : "Downloading skills"}
      <span className={styles.meter} style={{ "--k": installed / total } as React.CSSProperties} />
      <span className={styles.count}>
        {installed}/{total}
      </span>
      {!done && installed > 0 ? <span className={styles.installing}>{skills[installed - 1]}</span> : null}
      <br />
      {hint}
    </p>
  );
}
