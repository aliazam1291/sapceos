"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Visitor.module.scss";

/*
 * The visitor.
 *
 * A saucer that arrives when the open-channel section comes into view,
 * hovers over the primary button, drops a tractor beam on it, and a small
 * green reader waves before leaving. It has read the whole page; that is
 * the joke, and it is also the point — the page ends on an invitation and
 * the visitor is the first one to take it.
 *
 * Pure CSS motion, triggered once per approach with a cooldown so it never
 * loops. Honours reduced motion by simply parking above the button.
 */
export default function Visitor({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visit, setVisit] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = -Infinity;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const now = performance.now();
        if (now - last < 25_000) return;
        last = now;
        setVisit((v) => v + 1);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.host}>
      {children}
      {visit > 0 && (
        <div key={visit} className={styles.craft} aria-hidden="true">
          <svg className={styles.beam} viewBox="0 0 140 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="visitor-beam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#8af0c8" stopOpacity="0.55" />
                <stop offset="1" stopColor="#3cdd9e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M58 0 L82 0 L130 60 L10 60 Z" fill="url(#visitor-beam)" />
          </svg>

          <svg className={styles.saucer} viewBox="0 0 240 120">
            <defs>
              {/* Light from upper-left, like everything else on the site. */}
              <linearGradient id="v-hullTop" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f0f2f5" />
                <stop offset="0.45" stopColor="#b6bbc3" />
                <stop offset="1" stopColor="#5c626b" />
              </linearGradient>
              <linearGradient id="v-hullRim" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#9aa0a8" />
                <stop offset="0.5" stopColor="#3a3f46" />
                <stop offset="1" stopColor="#1c1f24" />
              </linearGradient>
              <linearGradient id="v-under" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#23272d" />
                <stop offset="1" stopColor="#0b0d10" />
              </linearGradient>
              <radialGradient id="v-dome" cx="0.35" cy="0.25" r="0.85">
                <stop offset="0" stopColor="#d8fff0" stopOpacity="0.55" />
                <stop offset="0.5" stopColor="#3cdd9e" stopOpacity="0.18" />
                <stop offset="1" stopColor="#062018" stopOpacity="0.85" />
              </radialGradient>
              <radialGradient id="v-ring" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0.6" stopColor="#3cdd9e" stopOpacity="0" />
                <stop offset="0.85" stopColor="#3cdd9e" stopOpacity="0.7" />
                <stop offset="1" stopColor="#3cdd9e" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="v-skin" cx="0.35" cy="0.3" r="0.8">
                <stop offset="0" stopColor="#9ff0bd" />
                <stop offset="1" stopColor="#2f8f5a" />
              </radialGradient>
              <clipPath id="v-domeClip">
                <path d="M78 66 a42 36 0 0 1 84 0 z" />
              </clipPath>
            </defs>

            {/* Glass, back face: dark interior the reader sits in front of. */}
            <path d="M78 66 a42 36 0 0 1 84 0 z" fill="#08201a" opacity="0.9" />

            {/* The reader, under the dome; clipped so nothing pokes out. The
                clip is on the outer group so the peek animation moves the
                figure inside a fixed window. */}
            <g clipPath="url(#v-domeClip)">
            <g className={styles.alien}>
              <ellipse cx="120" cy="50" rx="14" ry="17" fill="url(#v-skin)" />
              <ellipse cx="113" cy="48" rx="4.6" ry="6.5" fill="#07110c" transform="rotate(-8 113 48)" />
              <ellipse cx="127" cy="48" rx="4.6" ry="6.5" fill="#07110c" transform="rotate(8 127 48)" />
              <circle cx="114.5" cy="45.5" r="1.4" fill="#eafff5" />
              <circle cx="128.5" cy="45.5" r="1.4" fill="#eafff5" />
              <path d="M115 58 q5 2.5 10 0" stroke="#07110c" strokeWidth="1.1" fill="none" strokeLinecap="round" />
              <path d="M108 66 q12 -6 24 0 v6 h-24 z" fill="#2a7a4e" />
              <g className={styles.arm}>
                <path d="M131 64 q9 -3 11 -14" stroke="#6fd394" strokeWidth="4.2" strokeLinecap="round" fill="none" />
                <circle cx="142" cy="49" r="3" fill="#8fe6ad" />
              </g>
            </g>
            </g>

            {/* Glass, front face: a thin tint, a hard specular, a rim. */}
            <path d="M78 66 a42 36 0 0 1 84 0 z" fill="url(#v-dome)" opacity="0.45" />
            <path d="M84 62 a36 30 0 0 1 30 -28" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M78 66 a42 36 0 0 1 84 0" stroke="#bff5df" strokeOpacity="0.35" strokeWidth="0.8" fill="none" />

            {/* Hull: a lit upper disc, a dark rim band, a darker underside. */}
            <ellipse cx="120" cy="76" rx="112" ry="22" fill="url(#v-hullRim)" />
            <ellipse cx="120" cy="70" rx="110" ry="18" fill="url(#v-hullTop)" />
            {/* Panel seams on the upper disc. */}
            <ellipse cx="120" cy="70" rx="78" ry="11" fill="none" stroke="#2a2e34" strokeOpacity="0.45" strokeWidth="0.8" />
            <ellipse cx="120" cy="70" rx="46" ry="6" fill="none" stroke="#2a2e34" strokeOpacity="0.45" strokeWidth="0.8" />
            {/* Specular sweep across the top. */}
            <path d="M22 66 q50 -14 120 -10 q-40 4 -100 16 z" fill="#ffffff" opacity="0.32" />
            {/* Underside and its glowing ring. */}
            <path d="M10 78 a110 22 0 0 0 220 0 a100 14 0 0 1 -220 0 z" fill="url(#v-under)" />
            <ellipse cx="120" cy="92" rx="64" ry="9" fill="url(#v-ring)" />
            {/* Running lights along the rim, each in its own phase. */}
            <g className={styles.lights}>
              {[36, 68, 100, 140, 172, 204].map((x, i) => (
                <g key={x} style={{ animationDelay: `${i * 0.12}s` }}>
                  <circle cx={x} cy="86" r="4" fill="#3cdd9e" opacity="0.35" />
                  <circle cx={x} cy="86" r="1.8" fill="#bff5df" />
                </g>
              ))}
            </g>
          </svg>

          <p className={styles.caption}>
            <span>Unidentified contact.</span> Read the whole page. Wants to talk.
          </p>
        </div>
      )}
    </div>
  );
}
