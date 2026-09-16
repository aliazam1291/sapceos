"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import styles from "./BootScreen.module.scss";

const BootShip = dynamic(() => import("@/components/space/BootShip"), { ssr: false });

/*
 * The launch sequence.
 *
 * First visit of a session only. A black screen, the mark, a boot log that
 * types in as the site actually loads — fonts, then the galaxy's first
 * frame (`space:ready`) — and then a control: HOLD TO LAUNCH. Holding
 * fills a ring and throttles the ship's engines; releasing early lets
 * both drain back. At full, the ship lifts off the pad, the warp fires,
 * the screen opens, and the site is there with the same ship lunging.
 * Space or Enter hold it too. Reduced motion gets a plain button.
 *
 * Why hold rather than click: a click is a dismissal; a hold is a decision.
 * It is the one moment the reader is asked to do something before the
 * site does something for them, and it sets the tone for the flight.
 */

const LOG = [
  "Reticle online",
  "Star field seeded",
  "Ship on the pad",
  "Engines warm",
  "Galaxy loading",
];

const KEY = "space-os:booted";

export default function BootScreen() {
  const [show, setShow] = useState(false);
  const [lines, setLines] = useState(0);
  const [ready, setReady] = useState(false);
  const [fill, setFill] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const holding = useRef(false);
  const holdStart = useRef(0);
  const drainFrom = useRef(0);
  const raf = useRef(0);
  const reduced = useRef(false);

  // Show once per session, and only after hydration so SSR never paints it.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return;
    } catch {}
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setShow(true);
    document.documentElement.classList.add("booting");
  }, []);

  // The log types in on a clock; readiness is real (fonts + galaxy frame or
  // a ceiling), and the last line waits for it.
  useEffect(() => {
    if (!show) return;
    let n = 0;
    const id = window.setInterval(() => {
      n++;
      setLines(Math.min(n, LOG.length - 1));
      if (n >= LOG.length - 1) window.clearInterval(id);
    }, 260);
    let done = false;
    const arm = () => {
      if (done) return;
      done = true;
      setLines(LOG.length);
      setReady(true);
    };
    const onReady = () => arm();
    window.addEventListener("space:ready", onReady, { once: true });
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready ?? Promise.resolve();
    // Whichever is later: the galaxy frame, or 1.6s of fonts-ready. Ceiling
    // of 4s so a slow chunk never traps the reader on a black screen.
    const ceiling = window.setTimeout(arm, 4000);
    const floor = window.setTimeout(() => {
      if (location.pathname !== "/") arm();
    }, 1600);
    void fonts;
    return () => {
      window.clearInterval(id);
      window.clearTimeout(ceiling);
      window.clearTimeout(floor);
      window.removeEventListener("space:ready", onReady);
    };
  }, [show]);

  const launch = () => {
    if (leaving) return;
    setLeaving(true);
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
    window.dispatchEvent(new Event("space:warp"));
    window.setTimeout(() => {
      document.documentElement.classList.remove("booting");
      setShow(false);
    }, 900);
  };

  // The hold: fills at ~1.2s to full, drains at twice the speed.
  useEffect(() => {
    if (!show || !ready) return;
    // Wall-clock, not per-frame: a slow frame must not slow the hold.
    let wasHolding = false;
    let releasedAt = 0;
    const tick = (now: number) => {
      raf.current = requestAnimationFrame(tick);
      if (holding.current && !wasHolding) {
        // Resume from wherever the drain had got to.
        holdStart.current = now - drainFrom.current * 1200;
      }
      if (!holding.current && wasHolding) releasedAt = now;
      wasHolding = holding.current;
      setFill((f) => {
        if (holding.current) {
          const next = Math.min(1, (now - holdStart.current) / 1200);
          drainFrom.current = next;
          return next;
        }
        const next = Math.max(0, drainFrom.current - (now - releasedAt) / 600);
        return next === f ? f : next;
      });
    };
    raf.current = requestAnimationFrame(tick);
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        holding.current = true;
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") holding.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [show, ready]);

  useEffect(() => {
    if (fill >= 1 && !leaving) launch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fill]);

  if (!show) return null;

  const deg = Math.round(fill * 360);

  return (
    <div className={styles.screen} data-leaving={leaving || undefined} role="dialog" aria-label="Space OS launch sequence">
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.pad} aria-hidden="true">
          <BootShip fill={fill} leaving={leaving} ready={ready} />
        </div>
        <p className={styles.title}>SPACE OS</p>
        <p className={styles.sub}>Mission Control for a curious builder</p>

        <ol className={styles.log} aria-live="polite">
          {LOG.slice(0, lines).map((l, i) => (
            <li key={l} className={styles.line} data-last={i === LOG.length - 1 || undefined}>
              <span className={styles.tick}>{i === LOG.length - 1 && !ready ? "…" : "✓"}</span>
              {l}
              {i === LOG.length - 1 && ready ? <span className={styles.ok}> · online</span> : null}
            </li>
          ))}
        </ol>

        {reduced.current ? (
          <button type="button" className={styles.launchPlain} onClick={launch} disabled={!ready}>
            {ready ? "Launch" : "Loading…"}
          </button>
        ) : (
          <button
            type="button"
            className={styles.launch}
            data-ready={ready || undefined}
            disabled={!ready}
            style={{ "--fill": `${deg}deg` } as React.CSSProperties}
            onPointerDown={() => (holding.current = true)}
            onPointerUp={() => (holding.current = false)}
            onPointerLeave={() => (holding.current = false)}
            onPointerCancel={() => (holding.current = false)}
            aria-label="Hold to launch"
          >
            <span className={styles.ring} aria-hidden="true" />
            <span className={styles.launchLabel}>{ready ? "Hold to launch" : "Standing by"}</span>
          </button>
        )}

        <button type="button" className={styles.skip} onClick={launch}>
          Skip
        </button>
      </div>
    </div>
  );
}
