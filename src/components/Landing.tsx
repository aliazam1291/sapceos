"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { shipParts } from "@/components/space/shipParts";
import { shipState } from "@/components/space/shipState";
import { confirmInView } from "@/components/ArrivalGate";
import { ui } from "@/components/ui";
import styles from "./Landing.module.scss";

const LandingScene = dynamic(() => import("@/components/space/LandingScene"), { ssr: false });

/*
 * 06 / Touchdown — the end of the journey.
 *
 * The companion ship has flown the whole page; here it comes down onto a
 * pad and stops. Once it has settled, its parts speak in turn — nose,
 * canopy, canards, wing, engines, fins — each one a fact about the
 * operator, so the walkaround is the "about" the reader gets without
 * leaving the flight. Hover or tap a marker to hear that part; left
 * alone, the inspection runs itself every few seconds.
 *
 * Hand-off: while this section is in view `shipState.landed` is raised
 * and the fixed Companion hides — one ship, now on the ground.
 */
const CYCLE_MS = 4600;

export default function Landing({ children }: { children?: ReactNode }) {
  const host = useRef<HTMLElement>(null);
  const markers = useRef<(HTMLElement | null)[]>([]);
  const [arrived, setArrived] = useState(false);
  const [landed, setLanded] = useState(false);
  const [active, setActive] = useState(1);
  const manualAt = useRef(0);

  // Arrival, confirmed the way ArrivalGate does it; and a live in-view flag
  // for the hand-off with the companion.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let done = false;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        shipState.landed = e.intersectionRatio >= 0.3 ? 1 : 0;
        if (done || !e.isIntersecting) return;
        window.setTimeout(() => {
          if (done || !confirmInView(el, 0.4)) return;
          done = true;
          setArrived(true);
        }, 350);
      },
      { threshold: [0, 0.3, 0.4, 0.6] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      shipState.landed = 0;
    };
  }, []);

  // The walkaround runs itself unless the reader has just picked a part.
  useEffect(() => {
    if (!landed) return;
    const id = window.setInterval(() => {
      if (performance.now() - manualAt.current < 12000) return;
      setActive((a) => (a + 1) % shipParts.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [landed]);

  const pick = useCallback((i: number) => {
    manualAt.current = performance.now();
    setActive(i);
  }, []);

  const part = shipParts[active];

  return (
    <section
      id="landing"
      ref={host}
      data-section="Touchdown"
      className={styles.landing}
      data-arrived={arrived || undefined}
      data-landed={landed || undefined}
      aria-label="Touchdown — the ship lands and its parts introduce the operator"
    >
      <div className={styles.head}>
        <p className={ui.labelRule}>06 / Touchdown</p>
        <h2 className={styles.title}>{landed ? "Ship on the pad. The airframe introduces the operator." : "Coming in to land."}</h2>
      </div>

      <div className={styles.stage}>
        <LandingScene arrived={arrived} active={active} markers={markers} onLanded={() => setLanded(true)} host={host} />
        {shipParts.map((p, i) => (
          <button
            key={p.id}
            type="button"
            ref={(el) => {
              markers.current[i] = el;
            }}
            className={styles.marker}
            data-on={active === i || undefined}
            data-side={p.side}
            style={{ "--delay": `${i * 0.18}s` } as React.CSSProperties}
            onPointerEnter={() => pick(i)}
            onFocus={() => pick(i)}
            onClick={() => pick(i)}
            aria-pressed={active === i}
            aria-label={`${p.system}: ${p.title}`}
          >
            <span className={styles.ring} aria-hidden="true" />
            <span className={styles.callout} aria-hidden={active !== i}>
              <span className={styles.system}>{p.system}</span>
              <strong className={styles.partTitle}>{p.title}</strong>
              <span className={styles.line}>{p.line}</span>
            </span>
          </button>
        ))}
      </div>

      <div className={styles.foot}>
        <p className={styles.readout} aria-live="polite">
          <span className={styles.readoutIndex}>
            {String(active + 1).padStart(2, "0")} / {String(shipParts.length).padStart(2, "0")}
          </span>
          <span className={styles.readoutSystem}>{part.system}</span>
          <span className={styles.ticks} aria-hidden="true">
            {shipParts.map((p, i) => (
              <i key={p.id} data-on={i <= active || undefined} />
            ))}
          </span>
        </p>
        {children}
      </div>
    </section>
  );
}
