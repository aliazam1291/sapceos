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
            {/* Shell: a hard top highlight, a mid tone, a dark underside. */}
            <linearGradient id="d-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d5dae1" />
              <stop offset="0.22" stopColor="#8b939d" />
              <stop offset="0.55" stopColor="#3f454d" />
              <stop offset="1" stopColor="#121417" />
            </linearGradient>
            <linearGradient id="d-side" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#2a2f36" />
              <stop offset="0.5" stopColor="#4f565f" />
              <stop offset="1" stopColor="#23272d" />
            </linearGradient>
            {/* Carbon arms: a specular line along the top edge. */}
            <linearGradient id="d-arm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7c848e" />
              <stop offset="0.3" stopColor="#3b4047" />
              <stop offset="1" stopColor="#15181c" />
            </linearGradient>
            {/* Motor cans: cylindrical shading across. */}
            <linearGradient id="d-motor" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#1a1d22" />
              <stop offset="0.35" stopColor="#5a616a" />
              <stop offset="0.55" stopColor="#9aa2ab" />
              <stop offset="0.8" stopColor="#3a3f46" />
              <stop offset="1" stopColor="#15181c" />
            </linearGradient>
            {/* Rotor disc: a translucent blur ring with a brighter rim. */}
            <radialGradient id="d-rotor" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#c9ced5" stopOpacity="0.02" />
              <stop offset="0.55" stopColor="#c9ced5" stopOpacity="0.08" />
              <stop offset="0.86" stopColor="#dfe3e8" stopOpacity="0.2" />
              <stop offset="0.95" stopColor="#f2f5f8" stopOpacity="0.38" />
              <stop offset="1" stopColor="#f2f5f8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="d-lens" cx="0.35" cy="0.32" r="0.72">
              <stop offset="0" stopColor="#bfe6ff" />
              <stop offset="0.35" stopColor="#2a5a72" />
              <stop offset="0.7" stopColor="#0b1a22" />
              <stop offset="1" stopColor="#03070a" />
            </radialGradient>
            <radialGradient id="d-glowR" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#ff5a4a" stopOpacity="0.9" />
              <stop offset="1" stopColor="#ff5a4a" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="d-glowG" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#3cdd9e" stopOpacity="0.9" />
              <stop offset="1" stopColor="#3cdd9e" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="d-strip" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#3cdd9e" stopOpacity="0" />
              <stop offset="0.2" stopColor="#3cdd9e" stopOpacity="0.9" />
              <stop offset="0.8" stopColor="#3cdd9e" stopOpacity="0.9" />
              <stop offset="1" stopColor="#3cdd9e" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Rear arms + motors + rotors (behind the body). */}
          <g className={styles.rear}>
            <path d="M124 56 L64 41 L66 36 L128 51 z" fill="url(#d-arm)" />
            <path d="M196 56 L256 41 L254 36 L192 51 z" fill="url(#d-arm)" />
            <rect x="55" y="33" width="14" height="10" rx="2" fill="url(#d-motor)" />
            <rect x="251" y="33" width="14" height="10" rx="2" fill="url(#d-motor)" />
            <ellipse cx="62" cy="33" rx="7" ry="1.6" fill="#8e969f" />
            <ellipse cx="258" cy="33" rx="7" ry="1.6" fill="#8e969f" />
            <ellipse cx="62" cy="32" rx="46" ry="8.5" fill="url(#d-rotor)" className={styles.rotor} />
            <ellipse cx="258" cy="32" rx="46" ry="8.5" fill="url(#d-rotor)" className={styles.rotor} />
            <ellipse cx="62" cy="32" rx="30" ry="5.4" fill="none" stroke="#e8ebef" strokeOpacity="0.12" strokeWidth="0.8" />
            <ellipse cx="258" cy="32" rx="30" ry="5.4" fill="none" stroke="#e8ebef" strokeOpacity="0.12" strokeWidth="0.8" />
            <circle cx="62" cy="32" r="1.6" fill="#c9ced5" />
            <circle cx="258" cy="32" r="1.6" fill="#c9ced5" />
          </g>

          {/* Body: a sculpted shell — side panels, top deck, dark belly, a seam of light. */}
          <path d="M106 66 q54 -34 108 0 l8 14 q-62 18 -124 0 z" fill="url(#d-side)" />
          <path d="M112 62 q48 -28 96 0 l4 9 q-52 12 -104 0 z" fill="url(#d-body)" />
          <path d="M126 56 q34 -14 68 0 l-2 4 q-32 -10 -64 0 z" fill="#e6e9ee" fillOpacity="0.55" />
          <path d="M118 76 q42 12 84 0 l-4 10 q-38 8 -76 0 z" fill="#0b0d10" />
          <path d="M122 72 q38 9 76 0" stroke="url(#d-strip)" strokeWidth="1.4" fill="none" className={styles.strip} />
          {/* Vents and a sensor bar. */}
          <rect x="146" y="47" width="28" height="3.5" rx="1" fill="#0f1114" />
          <rect x="149" y="48" width="4" height="1.6" fill="#3a3f46" />
          <rect x="156" y="48" width="4" height="1.6" fill="#3a3f46" />
          <rect x="163" y="48" width="4" height="1.6" fill="#3a3f46" />
          <path d="M134 66 h-10 M186 66 h10" stroke="#9aa2ab" strokeOpacity="0.5" strokeWidth="0.8" />

          {/* Gimbal: a two-axis yoke under the nose, lens toward the payload. */}
          <path d="M152 80 v6 h16 v-6" stroke="#3a3f46" strokeWidth="2" fill="none" />
          <circle cx="160" cy="89" r="9.5" fill="#15181c" stroke="#4a5058" strokeWidth="1" />
          <circle cx="160" cy="89" r="7" fill="#0a0c0f" />
          <circle cx="160" cy="89" r="5" fill="url(#d-lens)" />
          <circle cx="157.8" cy="86.8" r="1.4" fill="#eaf7ff" />
          <circle cx="162.5" cy="91.5" r="0.7" fill="#9fd9ff" fillOpacity="0.7" />

          {/* Front arms + motors + rotors (over the body). */}
          <g className={styles.front}>
            <path d="M128 70 L50 84 L48 78 L124 64 z" fill="url(#d-arm)" />
            <path d="M192 70 L270 84 L272 78 L196 64 z" fill="url(#d-arm)" />
            <rect x="40" y="76" width="16" height="12" rx="2.5" fill="url(#d-motor)" />
            <rect x="264" y="76" width="16" height="12" rx="2.5" fill="url(#d-motor)" />
            <ellipse cx="48" cy="76" rx="8" ry="1.8" fill="#9aa2ab" />
            <ellipse cx="272" cy="76" rx="8" ry="1.8" fill="#9aa2ab" />
            <ellipse cx="48" cy="75" rx="52" ry="10" fill="url(#d-rotor)" className={styles.rotor} />
            <ellipse cx="272" cy="75" rx="52" ry="10" fill="url(#d-rotor)" className={styles.rotor} />
            <ellipse cx="48" cy="75" rx="34" ry="6.4" fill="none" stroke="#e8ebef" strokeOpacity="0.14" strokeWidth="0.8" />
            <ellipse cx="272" cy="75" rx="34" ry="6.4" fill="none" stroke="#e8ebef" strokeOpacity="0.14" strokeWidth="0.8" />
            <circle cx="48" cy="75" r="1.8" fill="#d5dae1" />
            <circle cx="272" cy="75" r="1.8" fill="#d5dae1" />
            {/* Nav lights with their glow: red port, green starboard, white tail strobe. */}
            <circle cx="46" cy="91" r="7" fill="url(#d-glowR)" className={styles.navL} />
            <circle cx="46" cy="91" r="1.9" fill="#ff8a7d" className={styles.navL} />
            <circle cx="274" cy="91" r="7" fill="url(#d-glowG)" className={styles.navR} />
            <circle cx="274" cy="91" r="1.9" fill="#8af0c8" className={styles.navR} />
            <circle cx="160" cy="58" r="1.6" fill="#ffffff" className={styles.strobe} />
          </g>

          {/* Landing gear: two tubular struts with pads. */}
          <path d="M138 86 l-7 18" stroke="#4a5058" strokeWidth="3" strokeLinecap="round" />
          <path d="M138 86 l-7 18" stroke="#9aa2ab" strokeOpacity="0.35" strokeWidth="1" strokeLinecap="round" />
          <path d="M182 86 l7 18" stroke="#4a5058" strokeWidth="3" strokeLinecap="round" />
          <path d="M182 86 l7 18" stroke="#9aa2ab" strokeOpacity="0.35" strokeWidth="1" strokeLinecap="round" />
          <path d="M124 104 h16 M180 104 h16" stroke="#2a2e34" strokeWidth="3" strokeLinecap="round" />
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
