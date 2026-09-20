"use client";

import dynamic from "next/dynamic";
import Comms from "./Comms";
import { useEffect, useRef, useState } from "react";
import { useOnScreen } from "@/lib/use-on-screen";
import styles from "./Singularity.module.scss";

const SingularityScene = dynamic(() => import("@/components/space/SingularityScene"), {
  ssr: false,
  loading: () => null,
});

export interface Mass {
  label: string;
  value: string;
  /** 0–1, relative magnitude; sets the tag's weight in the strip. */
  weight: number;
}

interface SingularityProps {
  label: string;
  title: string;
  lede?: string;
  masses: Mass[];
}

/**
 * The results field as a black hole.
 *
 * The section this sits above is a ledger of numbers. The scene says what
 * the ledger cannot: the numbers have mass, and the largest bend everything
 * around them — the roadmap, the team, the argument. The masses ride down
 * the right edge as HUD tags, weighted by magnitude, so the biggest number
 * and the brightest thing on screen are the same thing.
 *
 * Mounted on approach (three.js is not in the first-paint bundle), stays
 * mounted, and stops rendering off-screen via the scene's own frameloop.
 */
export default function Singularity({ label, title, lede, masses }: SingularityProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState(false);
  // The orbit is an offset-path animation — main thread, five bodies, every
  // frame. Paused while the section is off screen (see use-on-screen.ts).
  const onScreen = useOnScreen(ref, "30% 0px");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMount(true);
          io.disconnect();
        }
      },
      { rootMargin: "60% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} id="debrief" className={styles.field} aria-label={label} data-section={label.replace(/^\d+\s*\/\s*/, "")} data-off={onScreen ? undefined : ""}>
      <div className={styles.scene} aria-hidden="true">
        {mount ? <SingularityScene hostRef={ref} /> : null}
      </div>

      <div className={styles.copy}>
        <p className={styles.label}>{label}</p>
        <h2 className={styles.title}>{title}</h2>
        {lede ? <p className={styles.lede}>{lede}</p> : null}
        <p className={styles.hint} aria-hidden="true">
          Drag to orbit · Hold to dive
        </p>
        <Comms at="debrief" className={styles.comms} />
      </div>

      {/* The measured numbers, for a screen reader: the orbit below is a
          presentation of them — bodies that dim on the far side of the hole —
          and a list that fades to 30% opacity is not how a fact is read. */}
      <ul className="visually-hidden">
        {masses.map((m) => (
          <li key={m.label}>
            {m.value} {m.label}
          </li>
        ))}
      </ul>
      <ol className={styles.masses} aria-hidden="true">
        {masses.map((m, i) => (
          <li
            key={m.label}
            className={styles.mass}
            style={{ "--w": m.weight, "--ph": (i / masses.length).toFixed(2) } as React.CSSProperties}
          >
            <span className={styles.massValue}>{m.value}</span>
            <span className={styles.massLabel}>{m.label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
