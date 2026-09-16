"use client";

import { useEffect, useRef, useState } from "react";
import PageForm from "@/components/space/PageForm";
import Decode from "@/components/Decode";
import { operatingLoop } from "@/content/profile";
import styles from "./LoopSequence.module.scss";

/**
 * 05 / Operating loop — as a pinned horizontal sequence.
 *
 * The section pins for the length of the loop and vertical scroll drives the
 * eight steps sideways, one per beat, along an orbit line with a marker that
 * travels it. Each beat is the step, what it means, and the fact that shows
 * it happening. The role statement opens the run; the numbers close it.
 *
 * Same GSAP ScrollTrigger pattern as the mission strip. On touch the rail
 * scrolls natively sideways instead of pinning.
 */
export default function LoopSequence() {
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const beats = operatingLoop.length;
  const current = Math.min(beats - 1, Math.max(0, Math.round(progress * (beats - 1))));

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled || !sectionRef.current || !stripRef.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();

      mm.add("(min-width: 769px) and (prefers-reduced-motion: no-preference)", () => {
        const strip = stripRef.current;
        const section = sectionRef.current;
        if (!strip || !section) return;
        const distance = () => Math.max(strip.scrollWidth - window.innerWidth + 120, 0);

        // Pin the inner stage, not the section — the section itself must stay React-owned or client navigation throws removeChild
        // (React removeChild vs GSAP's pin-spacer on route change).
        const stage = section.querySelector<HTMLElement>("[data-pin]") ?? section;
        const tween = gsap.to(strip, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${Math.max(distance(), 1200)}`,
            pin: stage,
            scrub: 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate: (self) => setProgress(self.progress),
          },
        });
        return () => tween.kill();
      });
      ctx = mm;
    })();

    const rail = railRef.current;
    const onNative = () => {
      if (!rail) return;
      const max = rail.scrollWidth - rail.clientWidth;
      if (max > 0) setProgress(rail.scrollLeft / max);
    };
    rail?.addEventListener("scroll", onNative, { passive: true });

    return () => {
      cancelled = true;
      ctx?.revert();
      rail?.removeEventListener("scroll", onNative);
    };
  }, []);

  return (
    <section id="approach" data-section="Operating loop" className={styles.section} ref={sectionRef}>
      <div className={styles.stage} data-pin>
        <header className={styles.head}>
          <div>
            <p className={styles.label}>
              <Decode>05 / Operating loop</Decode>
            </p>
            <h2 className={styles.title}>How the work actually runs</h2>
          </div>
          <div className={styles.hud}>
            <span className={styles.hudStep}>
              <i /> {String(current + 1).padStart(2, "0")} / {String(beats).padStart(2, "0")} · {operatingLoop[current].step}
            </span>
            <span className={styles.hudTrack} aria-hidden="true">
              {operatingLoop.map((b, i) => (
                <b key={b.step} data-on={i <= current || undefined} />
              ))}
            </span>
            <span className={styles.hudHint}>Scroll to run the loop</span>
          </div>
        </header>

        <div className={styles.rail} ref={railRef}>
          <div className={styles.strip} ref={stripRef}>
            {/* The orbit line the beats sit on, with the travelling marker. */}
            <span className={styles.orbit} aria-hidden="true">
              <i style={{ left: `${progress * 100}%` }} />
            </span>

            <article className={`${styles.beat} ${styles.beatIntro}`}>
              <p className={styles.beatLabel}>What the role actually is</p>
              <p className={styles.introText}>
                Across every project the shape is the same: I own the frontend, I own the UI/UX, I work
                across teams, and I end up writing the PRD — problem statement, user stories, acceptance
                criteria, the edge cases nobody wants to think about.
              </p>
              <p className={styles.introDim}>
                Not because the title says so. Because someone has to decide what matters first, and that
                decision is usually the one holding everything else up.
              </p>
            </article>

            {operatingLoop.map((b, i) => (
              <article key={b.step} className={styles.beat} data-on={i === current || undefined} data-done={i < current || undefined}>
                <span className={styles.beatIndex}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.beatNode} aria-hidden="true" />
                <h3 className={styles.beatStep}>{b.step}</h3>
                <p className={styles.beatLine}>{b.line}</p>
                <p className={styles.beatEvidence}>
                  <span className={styles.evidenceLabel}>Evidence</span>
                  {b.evidence}
                </p>
              </article>
            ))}

            <article className={`${styles.beat} ${styles.beatEnd}`}>
              <p className={styles.beatLabel}>Then the next problem</p>
              <div className={styles.endForm}>
                <PageForm
                  form="probe"
                  seed="space-os"
                  label="A slowly tumbling wireframe probe: an octahedral core on four struts, each ending in a small instrument cross."
                  size={220}
                />
              </div>
              <dl className={styles.endStats}>
                <div><dt>Live projects</dt><dd>5+</dd></div>
                <div><dt>Dashboard speed-up</dt><dd>~40%</dd></div>
                <div><dt>Studio clients</dt><dd>10+</dd></div>
                <div><dt>Vehicles tracked</dt><dd>20,000+</dd></div>
              </dl>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
