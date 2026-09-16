"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./RobotGuide.module.scss";
import { confirmInView } from "./ArrivalGate";

interface RobotGuideProps {
  /** What the robot says when nothing is hovered. */
  idle: string;
  /** Lines keyed by the `data-bay` value of the elements it watches. */
  lines: Record<string, string>;
  /** Its name tag. */
  name?: string;
}

/*
 * The hangar chief.
 *
 * A small maintenance robot that hovers beside a row of projectors and
 * watches what you look at. Hover a bay and it turns its head that way and
 * reads the tag; leave and it goes back to idling. Eyes on a visor, one
 * antenna light, two thruster pods, a slow bob — enough character to be
 * company, not enough to be a mascot.
 *
 * It listens by delegation on the nearest section, so the bays it reads
 * stay ordinary server-rendered markup with a `data-bay` attribute.
 */
export default function RobotGuide({ idle, lines, name = "K-7" }: RobotGuideProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [line, setLine] = useState(idle);
  const [look, setLook] = useState(0); // -1 left … 1 right
  const [busy, setBusy] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [typed, setTyped] = useState(0);

  // Arrive when the section does — the robot flies in, then speaks.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Confirmed a beat later — see ArrivalGate for why a single
    // intersection is not proof the reader is here.
    let timer = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(timer);
        if (!entry.isIntersecting) return;
        timer = window.setTimeout(() => {
          if (!confirmInView(el, 0.6)) return;
          setArrived(true);
          io.disconnect();
        }, 350);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      window.clearTimeout(timer);
      io.disconnect();
    };
  }, []);

  // The line types out, a few characters a frame, restarting on change.
  useEffect(() => {
    if (!arrived) return;
    setTyped(0);
    let n = 0;
    const id = window.setInterval(() => {
      n += 2;
      setTyped(n);
      if (n >= line.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [line, arrived]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const host = el.closest("section") ?? el.parentElement;
    if (!host) return;
    const onOver = (e: Event) => {
      const bay = (e.target as Element).closest?.("[data-bay]") as HTMLElement | null;
      if (!bay) return;
      const key = bay.dataset.bay ?? "";
      if (lines[key]) {
        setLine(lines[key]);
        setBusy(true);
        // Where is the bay relative to the robot? Turn that way.
        const r = bay.getBoundingClientRect();
        const me = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const mx = me.left + me.width / 2;
        setLook(Math.max(-1, Math.min(1, (cx - mx) / (window.innerWidth * 0.4))));
      }
    };
    const onOut = (e: Event) => {
      const bay = (e.target as Element).closest?.("[data-bay]");
      if (!bay) return;
      setLine(idle);
      setBusy(false);
      setLook(0);
    };
    host.addEventListener("pointerover", onOver);
    host.addEventListener("pointerout", onOut);
    host.addEventListener("focusin", onOver);
    host.addEventListener("focusout", onOut);
    return () => {
      host.removeEventListener("pointerover", onOver);
      host.removeEventListener("pointerout", onOut);
      host.removeEventListener("focusin", onOver);
      host.removeEventListener("focusout", onOut);
    };
  }, [idle, lines]);

  return (
    <div ref={ref} className={styles.guide} data-busy={busy || undefined} data-arrived={arrived || undefined} style={{ "--look": look } as React.CSSProperties}>
      <svg viewBox="0 0 120 140" className={styles.bot} aria-hidden="true">
        <defs>
          <linearGradient id="rg-shell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e6e9ee" />
            <stop offset="0.55" stopColor="#9aa0a8" />
            <stop offset="1" stopColor="#3a3f46" />
          </linearGradient>
          <linearGradient id="rg-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a3f46" />
            <stop offset="1" stopColor="#15181c" />
          </linearGradient>
          <radialGradient id="rg-visor" cx="0.4" cy="0.35" r="0.8">
            <stop offset="0" stopColor="#123a2e" />
            <stop offset="1" stopColor="#04110c" />
          </radialGradient>
        </defs>

        {/* Thruster pods + glow */}
        <g className={styles.pods}>
          <ellipse cx="38" cy="122" rx="9" ry="5" fill="url(#rg-dark)" />
          <ellipse cx="82" cy="122" rx="9" ry="5" fill="url(#rg-dark)" />
          <ellipse cx="38" cy="130" rx="7" ry="4" fill="#3cdd9e" opacity="0.55" className={styles.jet} />
          <ellipse cx="82" cy="130" rx="7" ry="4" fill="#3cdd9e" opacity="0.55" className={styles.jet} />
        </g>

        {/* Body */}
        <path d="M34 70 q26 -10 52 0 l6 40 q-32 10 -64 0 z" fill="url(#rg-shell)" />
        <path d="M40 78 h40" stroke="#2a2e34" strokeOpacity="0.4" strokeWidth="1" />
        <rect x="50" y="86" width="20" height="8" rx="2" fill="#1b1e23" />
        <rect x="53" y="88" width="5" height="4" rx="1" fill="#3cdd9e" className={styles.lamp} />
        <rect x="62" y="88" width="5" height="4" rx="1" fill="#ffb35a" className={styles.lamp} style={{ animationDelay: "0.4s" }} />

        {/* Arms */}
        <path d="M36 82 q-14 8 -10 26" stroke="#5f656d" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M84 82 q14 8 10 26" stroke="#5f656d" strokeWidth="5" strokeLinecap="round" fill="none" className={styles.arm} />
        <circle cx="26" cy="108" r="4.5" fill="#2a2e34" />
        <circle cx="94" cy="108" r="4.5" fill="#2a2e34" />

        {/* Head: turns with --look */}
        <g className={styles.head}>
          <path d="M60 8 v10" stroke="#5f656d" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="60" cy="7" r="3.5" fill="#3cdd9e" className={styles.antenna} />
          <rect x="30" y="18" width="60" height="48" rx="16" fill="url(#rg-shell)" />
          <rect x="36" y="28" width="48" height="26" rx="12" fill="url(#rg-visor)" stroke="#3cdd9e" strokeOpacity="0.35" strokeWidth="1" />
          {/* Eyes */}
          <g className={styles.eyes}>
            <rect x="46" y="37" width="9" height="8" rx="3" fill="#8af0c8" />
            <rect x="65" y="37" width="9" height="8" rx="3" fill="#8af0c8" />
          </g>
          <path d="M40 30 q20 -6 40 0" stroke="#e8fff4" strokeOpacity="0.35" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="30" cy="42" r="4" fill="#2a2e34" />
          <circle cx="90" cy="42" r="4" fill="#2a2e34" />
        </g>
      </svg>

      <div className={styles.speech} role="status" aria-live="polite">
        <span className={styles.name}>{name}</span>
        <span className={styles.line}>
          {line.slice(0, typed)}
          <span className={styles.caret} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
