"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import MissionSignature from "./MissionSignature";
import styles from "./Drone.module.scss";

interface DroneProps {
  /** The case study's cover, carried as the payload. */
  src?: string;
  seed: string;
  /** Mono tag stencilled on the payload, e.g. "FN-03". */
  tag?: string;
  /** The manifest: what the drone is carrying, printed on the crate. */
  label?: string;
  sub?: string;
  /** The route's header drone: its cover is fetched eagerly (it is the LCP). */
  priority?: boolean;
  className?: string;
}

/*
 * A case study as a drone.
 *
 * A quadcopter seen from a low three-quarter angle, holding station: rotors
 * spinning to a blur, nav lights blinking, a slow bob on two frequencies,
 * a spotlight on the payload. The payload is the study's cover, slung from
 * the gimbal on two cables, swaying a beat behind the airframe the way a
 * real slung load does. It tilts toward the pointer — a drone that notices
 * you.
 *
 * SVG for the airframe (shaded, not flat), CSS for every motion. The one
 * piece of JS writes two custom properties for the tilt.
 */
export default function Drone({ src, seed, tag, label, sub, className, priority }: DroneProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const host = (el.closest("li") ?? el) as HTMLElement;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--roll", `${(x * 10).toFixed(2)}deg`);
      el.style.setProperty("--pitch", `${(-y * 6).toFixed(2)}deg`);
      el.style.setProperty("--yaw", `${(x * 8).toFixed(2)}deg`);
    };
    const onLeave = () => {
      el.style.setProperty("--roll", "0deg");
      el.style.setProperty("--pitch", "0deg");
      el.style.setProperty("--yaw", "0deg");
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className={`${styles.drone} ${className ?? ""}`} aria-hidden="true">
      <div className={styles.airframe}>
        <svg viewBox="0 0 320 120" className={styles.svg}>
          <defs>
            <linearGradient id="d-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#b7bdc6" />
              <stop offset="0.5" stopColor="#4a5058" />
              <stop offset="1" stopColor="#15181c" />
            </linearGradient>
            <linearGradient id="d-arm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5f656d" />
              <stop offset="1" stopColor="#1d2025" />
            </linearGradient>
            <radialGradient id="d-rotor" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#c9ced5" stopOpacity="0.05" />
              <stop offset="0.75" stopColor="#c9ced5" stopOpacity="0.16" />
              <stop offset="0.9" stopColor="#e8ebef" stopOpacity="0.32" />
              <stop offset="1" stopColor="#e8ebef" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="d-lens" cx="0.35" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#9fd9ff" />
              <stop offset="0.5" stopColor="#1b3a4a" />
              <stop offset="1" stopColor="#050a0d" />
            </radialGradient>
          </defs>

          {/* Rear arms + rotors (behind the body). */}
          <g className={styles.rear}>
            <path d="M120 58 L60 40" stroke="url(#d-arm)" strokeWidth="6" strokeLinecap="round" />
            <path d="M200 58 L260 40" stroke="url(#d-arm)" strokeWidth="6" strokeLinecap="round" />
            <circle cx="60" cy="40" r="5" fill="#2a2e34" />
            <circle cx="260" cy="40" r="5" fill="#2a2e34" />
            <ellipse cx="60" cy="38" rx="44" ry="9" fill="url(#d-rotor)" className={styles.rotor} />
            <ellipse cx="260" cy="38" rx="44" ry="9" fill="url(#d-rotor)" className={styles.rotor} />
          </g>

          {/* Body: a shaded shell with a dark belly and a camera gimbal. */}
          <path d="M112 62 q48 -26 96 0 l6 14 q-54 14 -108 0 z" fill="url(#d-body)" />
          <path d="M118 76 q42 12 84 0 l-4 10 q-38 8 -76 0 z" fill="#0f1114" />
          <path d="M132 54 q28 -10 56 0" stroke="#dfe3e8" strokeOpacity="0.5" strokeWidth="1.2" fill="none" />
          <rect x="150" y="46" width="20" height="4" rx="1" fill="#1b1e23" />
          {/* Gimbal + lens */}
          <circle cx="160" cy="88" r="9" fill="#1a1d22" stroke="#3a3f46" strokeWidth="1" />
          <circle cx="160" cy="88" r="5" fill="url(#d-lens)" />
          <circle cx="158" cy="86" r="1.2" fill="#e8f6ff" />

          {/* Front arms + rotors (over the body). */}
          <g className={styles.front}>
            <path d="M126 70 L48 84" stroke="url(#d-arm)" strokeWidth="7" strokeLinecap="round" />
            <path d="M194 70 L272 84" stroke="url(#d-arm)" strokeWidth="7" strokeLinecap="round" />
            <circle cx="48" cy="84" r="6" fill="#2a2e34" />
            <circle cx="272" cy="84" r="6" fill="#2a2e34" />
            <ellipse cx="48" cy="82" rx="50" ry="10" fill="url(#d-rotor)" className={styles.rotor} />
            <ellipse cx="272" cy="82" rx="50" ry="10" fill="url(#d-rotor)" className={styles.rotor} />
            {/* Nav lights: red port, green starboard, white tail strobe. */}
            <circle cx="46" cy="90" r="2.4" fill="#ff5a4a" className={styles.navL} />
            <circle cx="274" cy="90" r="2.4" fill="#3cdd9e" className={styles.navR} />
            <circle cx="160" cy="60" r="1.8" fill="#ffffff" className={styles.strobe} />
          </g>

          {/* Landing skids */}
          <path d="M136 84 l-6 18 h16" stroke="#3a3f46" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M184 84 l6 18 h-16" stroke="#3a3f46" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {/* Spotlight from the gimbal onto the payload. */}
      <span className={styles.beam} />

      {/* The slung load: two cables and the cover in a frame. */}
      <div className={styles.load}>
        <span className={`${styles.cable} ${styles.cableL}`} />
        <span className={`${styles.cable} ${styles.cableR}`} />
        <div className={styles.payload}>
          {src ? (
            <Image src={src} alt="" fill sizes="(max-width: 900px) 100vw, 560px" className={styles.img} priority={priority} />
          ) : (
            <MissionSignature seed={seed} className={styles.trace} />
          )}
          <span className={styles.lit} />
          {tag ? <span className={styles.tag}>{tag}</span> : null}
          {label ? (
            <span className={styles.manifest}>
              {sub ? <span className={styles.manifestSub}>{sub}</span> : null}
              <span className={styles.manifestLabel}>{label}</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
