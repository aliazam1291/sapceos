"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Comms from "./Comms";
import { comms } from "@/content/voice";
import { shipParts } from "@/components/space/shipParts";
import { skills } from "@/content/profile";
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
 * DISMANTLE pulls the airframe apart (an exploded view) with every part
 * labelled at once; clicking the ship does the same. ASSEMBLE puts it
 * back.
 *
 * Hand-off: while this section is in view `shipState.landed` is raised
 * and the fixed Companion hides — one ship, now on the ground.
 */
const CYCLE_MS = 4600;

export default function Landing({
  children,
  label = "10 / Touchdown",
  section = "Touchdown",
  statement,
}: {
  children?: ReactNode;
  label?: string;
  section?: string;
  /** The operator's one sentence, said by the ship once it is on the pad. */
  statement?: string;
}) {
  const host = useRef<HTMLElement>(null);
  const markers = useRef<(HTMLElement | null)[]>([]);
  const [arrived, setArrived] = useState(false);
  const [landed, setLanded] = useState(false);
  const [active, setActive] = useState(1);
  const [exploded, setExploded] = useState(false);
  const [gearDown, setGearDown] = useState(false);
  const manualAt = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });

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

  // The phase readout: the gear comes down through the middle of the descent.
  useEffect(() => {
    if (!arrived) return;
    const id = window.setTimeout(() => setGearDown(true), 1300);
    return () => window.clearTimeout(id);
  }, [arrived]);

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

  // The pointer, −1…1 over the stage, for the camera's glance.
  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.current.y = ((e.clientY - r.top) / r.height) * -2 + 1;
  }, []);
  const onLeave = useCallback(() => {
    pointer.current.x = 0;
    pointer.current.y = 0;
  }, []);
  const toggle = useCallback(() => {
    manualAt.current = performance.now();
    setExploded((v) => !v);
  }, []);

  const phase = !arrived ? "Holding · on approach" : !landed ? gearDown ? "Gear down · final" : "Descending · gear up" : exploded ? "Dismantled · " + shipParts.length + " parts" : "On the pad · engines cold";

  return (
    <section
      id="landing"
      ref={host}
      data-section={section}
      className={styles.landing}
      data-arrived={arrived || undefined}
      data-landed={landed || undefined}
      data-exploded={exploded || undefined}
      aria-label="Touchdown — the ship lands and its parts introduce the operator"
    >
      <div
        className={styles.stage}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onClick={landed ? toggle : undefined}
        title={landed ? (exploded ? "Assemble" : "Dismantle") : undefined}
      >
        <LandingScene
          arrived={arrived}
          active={active}
          exploded={exploded}
          markers={markers}
          pointer={pointer}
          onLanded={() => setLanded(true)}
          host={host}
        />

        {/* Corner brackets: the stage is an instrument's field of view. */}
        <span className={styles.corner} data-at="tl" aria-hidden="true" />
        <span className={styles.corner} data-at="tr" aria-hidden="true" />
        <span className={styles.corner} data-at="bl" aria-hidden="true" />
        <span className={styles.corner} data-at="br" aria-hidden="true" />

        {/* Caption, top-left: the place, the state. */}
        <div className={styles.caption}>
          <p className={ui.labelRule}>{label}</p>
          <h2 className={styles.title}>
            {!landed ? "Coming in to land." : exploded ? "Dismantled. Every part, and what it stands for." : (statement ?? "The airframe introduces the operator.")}
          </h2>
          <p className={styles.phase} aria-live="polite">
            <span className={styles.phaseDot} data-live={landed || undefined} />
            {phase}
          </p>
          {/* Mission control, once the ship is down; a different line once it is in pieces. */}
          {landed ? <Comms lines={exploded ? comms.dismantled : comms.landed} className={styles.comms} delay={900} /> : null}
        </div>

        {/* The part index, right: the whole walkaround at a glance. */}
        <ol className={styles.index} aria-label="Parts">
          {shipParts.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                className={styles.indexItem}
                data-on={active === i || undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  pick(i);
                }}
                onPointerEnter={() => pick(i)}
                disabled={!landed}
              >
                <span className={styles.indexNo}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.indexName}>{p.system}</span>
              </button>
            </li>
          ))}
        </ol>

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
            onClick={(e) => {
              e.stopPropagation();
              pick(i);
            }}
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

        {/* The HUD strip along the bottom of the stage. */}
        <div className={styles.hud} onClick={(e) => e.stopPropagation()}>
          <p className={styles.readout}>
            <span className={styles.readoutIndex}>
              {String(active + 1).padStart(2, "0")} / {String(shipParts.length).padStart(2, "0")}
            </span>
            <span className={styles.readoutSystem}>{part.title}</span>
            <span className={styles.ticks} aria-hidden="true">
              {shipParts.map((p, i) => (
                <i key={p.id} data-on={i <= active || undefined} />
              ))}
            </span>
          </p>
          <button type="button" className={styles.dismantle} onClick={toggle} disabled={!landed} aria-pressed={exploded}>
            {exploded ? "Assemble" : "Dismantle"}
          </button>
        </div>
      </div>

      {/* The loadout: what the operator actually works with. The group the
          speaking part stands for is lit. */}
      <div className={styles.loadout} aria-label="Tools">
        {skills.map((g) => (
          <div key={g.group} className={styles.loadoutGroup} data-on={part.loadout === g.group || undefined}>
            <p className={styles.loadoutLabel}>
              <span className={styles.loadoutKey}>Loadout</span> {g.group}
              <span className={styles.loadoutCount}>{String(g.items.length).padStart(2, "0")}</span>
            </p>
            <ul className={styles.chips}>
              {g.items.map((it) => (
                <li key={it} className={styles.chip}>
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {children ? <div className={styles.foot}>{children}</div> : null}
    </section>
  );
}
