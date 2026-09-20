"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { bootLine } from "@/content/voice";
import { sfx, spaceSound } from "@/lib/spaceSound";
import SoundToggle from "./SoundToggle";
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
 *
 * 2026-09-19 — a great loading screen, and not a gate. Progress is REAL:
 * four milestones (fonts, the star field's first draw, the ship on the
 * pad, the galaxy's first frame or the floor on other routes) drive a
 * percentage that counts up on screen and never lies about being done.
 * Once ready, a launch window opens: T−5 counts down in the corner and
 * the ship launches itself at T−0. The hold still launches it sooner and
 * Skip still cuts straight through — but a recruiter who does nothing
 * for five seconds still reaches the site. A scan line sweeps the pad
 * while it waits, and every beat has a sound if sound is on.
 */

const LOG = [
  "Reticle online",
  "Star field seeded",
  "Ship on the pad",
  "Engines warm",
  bootLine,
  "Galaxy loading",
];

const KEY = "space-os:booted";

export default function BootScreen() {
  const [show, setShow] = useState(false);
  const [lines, setLines] = useState(0);
  const [ready, setReady] = useState(false);
  const [fill, setFill] = useState(0);
  const [leaving, setLeaving] = useState(false);
  // Real readiness, 0..1, and the number shown (eased toward it).
  const [progress, setProgress] = useState(0);
  const milestones = useRef({ fonts: false, stars: false, pad: false, galaxy: false });
  // T−minus seconds left in the launch window; null before ready.
  const [count, setCount] = useState<number | null>(null);
  const holding = useRef(false);
  const holdStart = useRef(0);
  const drainFrom = useRef(0);
  const raf = useRef(0);
  const reduced = useRef(false);

  // Show once per session, and only after hydration so SSR never paints it.
  // `?launch` on any URL (or the palette's "Replay the launch sequence")
  // forces it — Ali reloaded the same tab and could not find the launch
  // screen (2026-09-20), because the session flag lives per tab.
  useEffect(() => {
    let force = false;
    try {
      force = new URLSearchParams(location.search).has("launch") || location.hash === "#launch";
      if (!force && sessionStorage.getItem(KEY)) return;
      if (force) sessionStorage.removeItem(KEY);
    } catch {}
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setShow(true);
    document.documentElement.classList.add("booting");
    // While this is up it covers the galaxy completely; the galaxy reads
    // the attribute and draws only its first frame (InteractiveGalaxy).
    // Cleared the moment the launch starts, so the scene is moving by the
    // time the overlay has lifted.
    document.documentElement.setAttribute("data-booting", "");
    return () => document.documentElement.removeAttribute("data-booting");
  }, []);

  // The log types in on a clock; readiness is real — four milestones, each
  // a scene's first frame or the fonts — and the last line waits for it.
  useEffect(() => {
    if (!show) return;
    let n = 0;
    const id = window.setInterval(() => {
      n++;
      // Never lowers the count: readiness may have revealed every line already.
      setLines((l) => Math.max(l, Math.min(n, LOG.length - 1)));
      sfx("log");
      if (n >= LOG.length - 1) window.clearInterval(id);
    }, 260);
    let done = false;
    const arm = () => {
      if (done) return;
      done = true;
      window.clearInterval(id);
      const m = milestones.current;
      m.fonts = m.stars = m.pad = m.galaxy = true;
      setLines(LOG.length);
      setReady(true);
    };
    const m = milestones.current;
    const hit = (k: keyof typeof m) => {
      m[k] = true;
      if (m.fonts && m.stars && m.pad && m.galaxy) arm();
    };
    const onReady = () => hit("galaxy");
    const onStars = () => hit("stars");
    const onPad = () => hit("pad");
    window.addEventListener("space:ready", onReady, { once: true });
    window.addEventListener("space:stars", onStars, { once: true });
    window.addEventListener("space:pad", onPad, { once: true });
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready ?? Promise.resolve();
    fonts.then(() => hit("fonts"));
    // Off the home page there is no galaxy to wait for: its slot is granted
    // after a beat. Ceiling of 4s so a slow chunk never traps the reader.
    const floor = window.setTimeout(() => {
      if (location.pathname !== "/") hit("galaxy");
    }, 1200);
    const ceiling = window.setTimeout(arm, 4000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(ceiling);
      window.clearTimeout(floor);
      window.removeEventListener("space:ready", onReady);
      window.removeEventListener("space:stars", onStars);
      window.removeEventListener("space:pad", onPad);
    };
  }, [show]);

  // The percentage: eases toward the milestone count, creeps while waiting
  // so it never looks stuck, and only reads 100 when everything is in.
  useEffect(() => {
    if (!show) return;
    let raf = 0;
    let shown = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const m = milestones.current;
      const n = +m.fonts + +m.stars + +m.pad + +m.galaxy;
      const target = ready ? 100 : Math.min(92, n * 23 + 6);
      shown += (target - shown) * Math.min(dt * (ready ? 6 : 2.2), 1);
      if (!ready && shown < target - 0.5) shown += dt * 3; // the creep
      setProgress((p) => (Math.abs(p - shown) < 0.5 ? p : shown));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [show, ready]);

  // The launch window: T−5 to T−0 once ready, then the ship goes on its
  // own. Holding pauses the count (the reader is launching it themselves).
  useEffect(() => {
    if (!show || !ready || leaving) return;
    if (reduced.current) {
      const id = window.setTimeout(launch, 2000);
      return () => window.clearTimeout(id);
    }
    let left = 5;
    setCount(left);
    const id = window.setInterval(() => {
      if (holding.current) return;
      left -= 1;
      setCount(left);
      if (left <= 0) {
        window.clearInterval(id);
        launch();
      } else sfx("tick");
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, ready, leaving]);

  const launch = () => {
    if (leaving) return;
    setLeaving(true);
    spaceSound.setHold(0);
    sfx("launch");
    document.documentElement.removeAttribute("data-booting");
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
          spaceSound.setHold(next);
          return next;
        }
        const next = Math.max(0, drainFrom.current - (now - releasedAt) / 600);
        spaceSound.setHold(next);
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
      <div className={styles.pad} aria-hidden="true">
        <BootShip fill={fill} leaving={leaving} ready={ready} />
      </div>
      <div className={styles.vignette} aria-hidden="true" />
      <span className={styles.corner} data-at="tl" aria-hidden="true" />
      <span className={styles.corner} data-at="tr" aria-hidden="true" />
      <span className={styles.corner} data-at="bl" aria-hidden="true" />
      <span className={styles.corner} data-at="br" aria-hidden="true" />

      <header className={styles.head}>
        <p className={styles.title}>SPACE OS</p>
        <p className={styles.sub}>Mission Control for a curious builder</p>
      </header>
      {/* Top-right readout: the pad, the state, the real percentage and,
          once ready, the launch window counting down. */}
      <div className={styles.readout} aria-live="polite">
        <p className={styles.padLabel}>
          Pad 01 · {ready ? "cleared for launch" : "pre-flight"}
        </p>
        <p className={styles.pct} data-ready={ready || undefined}>
          {ready && count !== null ? (
            <>
              <span className={styles.pctLabel}>T−</span>
              {String(Math.max(0, count)).padStart(2, "0")}
            </>
          ) : (
            <>
              {String(Math.round(progress)).padStart(3, "0")}
              <span className={styles.pctLabel}>%</span>
            </>
          )}
        </p>
        <span className={styles.bar} aria-hidden="true">
          <span className={styles.barFill} style={{ transform: `scaleX(${(ready ? 100 : progress) / 100})` }} />
        </span>
        <p className={styles.readoutSub}>
          {!ready ? "Loading the pad" : count !== null ? "Auto-launch · hold to go now" : "Launching"}
        </p>
      </div>
      {/* A scan line sweeping the pad while it waits. */}
      <span className={styles.scan} aria-hidden="true" />

      <div className={styles.inner}>

        <ol className={styles.log} aria-live="polite">
          {/* All lines are laid out up front and revealed one by one: a log
              that grows pushed this bottom-anchored block upward on every
              line — 0.026 CLS on every route's first visit. */}
          {LOG.map((l, i) => (
            <li key={l} className={styles.line} data-last={i === LOG.length - 1 || undefined} data-shown={i < lines || undefined} aria-hidden={i >= lines || undefined}>
              <span className={styles.tick}>{i === LOG.length - 1 && !ready ? "…" : "✓"}</span>
              {l}
              {i === LOG.length - 1 && ready ? <span className={styles.ok}> · online</span> : null}
            </li>
          ))}
        </ol>

        <div className={styles.control}>
        {/* Sound is off until asked, and this is the place to ask: the hold
            that launches is also the gesture that lets audio start. */}
        <SoundToggle className={styles.sound} />
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
    </div>
  );
}
