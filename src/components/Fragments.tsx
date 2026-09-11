"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { fragments, type Fragment, type FragmentKind } from "@/content/fragments";
import styles from "./Fragments.module.scss";

const KIND_LABEL: Record<FragmentKind, string> = {
  mission: "Mission",
  lab: "Experiment",
  note: "Field note",
};

/**
 * Procedural Kinetic SVG Graphic for each card kind.
 * Equipped with live orbital rotation, sonar radar pulses,
 * oscilloscope frequency shifts, and laser blueprint scanlines.
 */
function FragmentGraphic({
  kind,
  index,
}: {
  kind: FragmentKind;
  id: string;
  index: number;
}) {
  const seed = (index * 17) % 100;

  if (kind === "mission") {
    const r1 = 36 + (seed % 14);
    const r2 = 56 + (seed % 18);
    const orbitPeriod = 11 + (index % 4) * 3;

    return (
      <div className={styles.cardGraphic} aria-hidden="true">
        <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Static reference orbital paths */}
          <ellipse
            cx="140"
            cy="70"
            rx="110"
            ry="46"
            stroke="rgba(34, 208, 178, 0.12)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          <ellipse
            cx="140"
            cy="70"
            rx={r2}
            ry={r2 * 0.44}
            stroke="rgba(34, 208, 178, 0.25)"
            strokeWidth="1.2"
          />
          <circle
            cx="140"
            cy="70"
            r={r1}
            stroke="rgba(245, 245, 245, 0.08)"
            strokeWidth="1"
          />

          {/* Telemetry crosshair grid */}
          <line
            x1="140"
            y1="22"
            x2="140"
            y2="118"
            stroke="rgba(245, 245, 245, 0.05)"
            strokeWidth="1"
          />
          <line
            x1="40"
            y1="70"
            x2="240"
            y2="70"
            stroke="rgba(245, 245, 245, 0.05)"
            strokeWidth="1"
          />

          {/* Expanding Sonar Ping Radar Wave */}
          <circle
            cx="140"
            cy="70"
            r="10"
            className={styles.sonarPulse}
            stroke="rgba(34, 208, 178, 0.8)"
            fill="none"
          />

          {/* Rotating Radar Sweep Hand */}
          <line
            x1="140"
            y1="70"
            x2={140 + r2}
            y2="70"
            className={styles.radarSweepHand}
            stroke="rgba(34, 208, 178, 0.35)"
            strokeWidth="1.5"
          />

          {/* Orbiting Satellite Node Group */}
          <g
            className={styles.orbitGroup}
            style={{ animationDuration: `${orbitPeriod}s` }}
          >
            <circle
              cx={140 + r2}
              cy="70"
              r="4.5"
              fill="#3bf1cd"
            />
            <circle
              cx={140 + r2}
              cy="70"
              r="10"
              stroke="rgba(34, 208, 178, 0.4)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          </g>

          {/* Core planetarium beacon point */}
          <circle
            cx="140"
            cy="70"
            r="5"
            fill="#22d0b2"
            className={styles.beaconCore}
          />
        </svg>
      </div>
    );
  }

  if (kind === "lab") {
    return (
      <div className={styles.cardGraphic} aria-hidden="true">
        <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Frequency oscilloscope grid */}
          <line x1="20" y1="70" x2="260" y2="70" stroke="rgba(94, 234, 212, 0.18)" strokeWidth="1" strokeDasharray="2 3" />
          <line x1="20" y1="40" x2="260" y2="40" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
          <line x1="20" y1="100" x2="260" y2="100" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />

          {/* Flowing Kinetic Oscilloscope Wave */}
          <path
            className={styles.kineticWave}
            d={`M 20 70 Q 55 ${38 - (seed % 15)}, 90 70 T 160 70 T 230 ${70 + ((index % 3) * 16 - 16)} T 260 70`}
            stroke="#5eead4"
            strokeWidth="1.8"
            fill="none"
          />

          {/* Rotating Quantum Gyro Core */}
          <g className={styles.quantumGyro}>
            <rect
              x="128"
              y="58"
              width="24"
              height="24"
              rx="4"
              stroke="#5eead4"
              strokeWidth="1.4"
              fill="rgba(94, 234, 212, 0.08)"
            />
            <circle cx="140" cy="70" r="3.5" fill="#5eead4" />
          </g>

          {/* Frequency Node Indicators */}
          <circle
            cx="90"
            cy="70"
            r="3"
            fill="rgba(94, 234, 212, 0.6)"
            className={styles.frequencyNode}
          />
          <circle
            cx="190"
            cy="70"
            r="3"
            fill="rgba(94, 234, 212, 0.6)"
            className={styles.frequencyNode}
            style={{ animationDelay: "1.3s" }}
          />
        </svg>
      </div>
    );
  }

  // Field note: Blueprint Matrix with Laser Scanner
  return (
    <div className={styles.cardGraphic} aria-hidden="true">
      <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Technical drafting frame */}
        <rect
          x="36"
          y="25"
          width="208"
          height="90"
          stroke="rgba(196, 181, 253, 0.16)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <line x1="36" y1="48" x2="244" y2="48" stroke="rgba(196, 181, 253, 0.08)" strokeWidth="1" />
        <line x1="36" y1="92" x2="244" y2="92" stroke="rgba(196, 181, 253, 0.08)" strokeWidth="1" />

        {/* Measurement ticks */}
        <line x1="70" y1="20" x2="70" y2="30" stroke="#c4b5fd" strokeWidth="1.5" />
        <line x1="210" y1="20" x2="210" y2="30" stroke="#c4b5fd" strokeWidth="1.5" />

        {/* Schematic line with coordinate points */}
        <polyline
          points={`60,95 100,${65 + (seed % 15)} 160,${45 + (seed % 20)} 220,75`}
          stroke="rgba(196, 181, 253, 0.45)"
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="100" cy={65 + (seed % 15)} r="3" fill="#c4b5fd" className={styles.blueprintPing} />
        <circle cx="160" cy={45 + (seed % 20)} r="3" fill="#c4b5fd" className={styles.blueprintPing} style={{ animationDelay: "0.9s" }} />

        {/* Sweeping Cyber Laser Scanline */}
        <line
          x1="36"
          y1="32"
          x2="244"
          y2="32"
          className={styles.laserScanner}
          stroke="#c4b5fd"
          strokeWidth="1.6"
          strokeDasharray="6 3"
        />
      </svg>
    </div>
  );
}

/**
 * Individual Fragment Card with physics-based 3D tilt,
 * multi-layer parallax depth, and cursor spotlight.
 */
function FragmentCard({ fragment, index }: { fragment: Fragment; index: number }) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLAnchorElement>) => {
    const el = cardRef.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = x / rect.width;
    const py = y / rect.height;

    // Set cursor spotlight coordinates
    el.style.setProperty("--card-x", `${x}px`);
    el.style.setProperty("--card-y", `${y}px`);

    // 3D Tilt angles (-10deg to +10deg)
    const rx = (0.5 - py) * 14;
    const ry = (px - 0.5) * 16;
    el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
    el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
    el.style.setProperty("--card-lift", "-8px");
  }, []);

  const handlePointerLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--card-lift", "0px");
  }, []);

  const actionText =
    fragment.kind === "mission"
      ? "Open mission"
      : fragment.kind === "lab"
      ? "Inspect lab"
      : "Read note";

  return (
    <Link
      ref={cardRef}
      href={fragment.href}
      className={styles.tile}
      data-kind={fragment.kind}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      id={`fragment-card-${fragment.id}`}
      aria-label={`${KIND_LABEL[fragment.kind]}: ${fragment.title}`}
    >
      {/* Dynamic diagonal glass sheen sweep on hover */}
      <div className={styles.cardSheen} aria-hidden="true" />

      {/* Top Header Row (Parallax Layer Z=32px) */}
      <div className={styles.cardHeader}>
        <div className={styles.indexBlock}>
          <span className={styles.index}>
            FR&#8209;{String(index + 1).padStart(2, "0")}
          </span>
          <span className={styles.kindBadge}>
            <span className={styles.kindDot} />
            {KIND_LABEL[fragment.kind]}
          </span>
        </div>

        {fragment.draft ? (
          <span className={styles.draftBadge}>DRAFT</span>
        ) : (
          <span className={styles.index} style={{ opacity: 0.5 }}>
            ACT&#8209;{(index % 4) + 1}
          </span>
        )}
      </div>

      {/* Kinetic Visual Graphic (Parallax Layer Z=24px) */}
      <FragmentGraphic kind={fragment.kind} id={fragment.id} index={index} />

      {/* Card Body & Action (Parallax Layer Z=34px / Z=48px) */}
      <div className={styles.cardBody}>
        <h3 className={styles.tileTitle}>{fragment.title}</h3>

        <div className={styles.cardFooter}>
          <div className={styles.metaInfo}>
            <span className={styles.metaLabel}>CONSTELLATION</span>
            <span className={styles.metaValue}>{fragment.meta}</span>
          </div>

          <div
            className={styles.actionArrow}
            title={actionText}
            aria-hidden="true"
          >
            &#8599;
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Pinned Horizontal Scroll Section driven by Vertical Scroll.
 * Features GSAP ScrollTrigger pinning and physical velocity skew inertia.
 */
export default function Fragments() {
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLUListElement>(null);

  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(1);

  // GSAP ScrollTrigger setup for desktop + touch scroll listener for mobile
  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (cancelled || !sectionRef.current || !stripRef.current) return;

      gsap.registerPlugin(ScrollTrigger);

      const mm = gsap.matchMedia();

      // Desktop & large screens: Pinned horizontal scrub with velocity skew
      mm.add("(min-width: 769px) and (prefers-reduced-motion: no-preference)", () => {
        const strip = stripRef.current;
        const section = sectionRef.current;
        if (!strip || !section) return;

        // Calculate travel distance so the last card aligns with edge padding
        const getScrollDistance = () => {
          const totalWidth = strip.scrollWidth;
          const viewportWidth = window.innerWidth;
          return Math.max(totalWidth - viewportWidth + 96, 0);
        };

        const skewClamp = gsap.utils.clamp(-2.5, 2.5);
        const skewProxy = { skew: 0 };
        const setSkew = gsap.quickSetter(strip, "skewX", "deg");

        const tween = gsap.to(strip, {
          x: () => -getScrollDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${Math.max(getScrollDistance(), 1000)}`,
            pin: true,
            scrub: 0.9,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate: (self) => {
              const p = self.progress;
              setProgress(p);
              const idx = Math.min(
                fragments.length,
                Math.max(1, Math.round(p * (fragments.length - 1)) + 1)
              );
              setActiveIndex(idx);

              // Scroll velocity skew inertia
              const v = self.getVelocity();
              const skewTarget = skewClamp(v / -400);
              if (Math.abs(skewTarget) > 0.08) {
                skewProxy.skew = skewTarget;
                gsap.to(skewProxy, {
                  skew: 0,
                  duration: 0.55,
                  ease: "power3.out",
                  overwrite: true,
                  onUpdate: () => setSkew(skewProxy.skew),
                });
              }
            },
          },
        });

        return () => {
          tween.kill();
        };
      });

      ctx = mm;
    })();

    // Mobile fallback: monitor native scroll on the rail
    const rail = railRef.current;
    const handleMobileScroll = () => {
      if (!rail) return;
      const max = rail.scrollWidth - rail.clientWidth;
      if (max <= 0) return;
      const p = Math.max(0, Math.min(1, rail.scrollLeft / max));
      setProgress(p);
      const idx = Math.min(
        fragments.length,
        Math.max(1, Math.round(p * (fragments.length - 1)) + 1)
      );
      setActiveIndex(idx);
    };

    rail?.addEventListener("scroll", handleMobileScroll, { passive: true });

    return () => {
      cancelled = true;
      ctx?.revert();
      rail?.removeEventListener("scroll", handleMobileScroll);
    };
  }, []);

  return (
    <section
      id="fragments"
      data-section="Fragments"
      className={styles.band}
      ref={sectionRef}
    >
      <div className={styles.ambientBackdrop} aria-hidden="true" />

      <div className={styles.pinnedStage}>
        {/* Section Header */}
        <div className={styles.head}>
          <div className={styles.headLeft}>
            <div className={styles.labelRow}>
              <span className={styles.beaconDot} aria-hidden="true" />
              <p className={styles.label}>02 / ARCHIVE</p>
            </div>
            <h2 className={styles.title}>Everything that exists</h2>
            <p className={styles.lede}>
              Explore every mission, lab experiment, and field note. Scroll vertically to navigate through the archive.
            </p>
          </div>

          <div className={styles.headRight}>
            <div className={styles.telemetryCounter}>
              <span className={styles.currentNum}>
                {String(activeIndex).padStart(2, "0")}
              </span>
              <span className={styles.divider}>/</span>
              <span className={styles.totalNum}>
                {String(fragments.length).padStart(2, "0")}
              </span>
            </div>
            <div className={styles.scrollHint}>
              <span>&#8595;</span> SCROLL DOWN TO EXPLORE
            </div>
          </div>
        </div>

        {/* The Track with 3D Tilt Cards */}
        <div className={styles.rail} ref={railRef} tabIndex={-1}>
          <ul className={styles.strip} ref={stripRef}>
            {fragments.map((fragment, i) => (
              <li key={`${fragment.kind}-${fragment.id}`} className={styles.cell}>
                <FragmentCard fragment={fragment} index={i} />
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom Control Bar & Progress */}
        <div className={styles.progressWrapper}>
          <div className={styles.progressBar} aria-hidden="true">
            <span
              className={styles.progressFill}
              style={{
                transform: `scaleX(${Math.max(0.02, progress)})`,
              }}
            />
          </div>

          <div className={styles.progressFooter}>
            <ul className={styles.legendList} aria-hidden="true">
              <li className={styles.legendItem} data-kind="mission">
                <span /> Missions ({fragments.filter((f) => f.kind === "mission").length})
              </li>
              <li className={styles.legendItem} data-kind="lab">
                <span /> Experiments ({fragments.filter((f) => f.kind === "lab").length})
              </li>
              <li className={styles.legendItem} data-kind="note">
                <span /> Field notes ({fragments.filter((f) => f.kind === "note").length})
              </li>
            </ul>

            <span className={styles.scrubInstruction}>
              SCRUB <strong>{Math.round(progress * 100)}%</strong> COMPLETE
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
