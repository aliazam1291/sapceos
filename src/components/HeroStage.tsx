"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Level 03 — the boot sequence. Masked headline lines lift into place while the
 * telemetry prints beneath them. Runs once, on the home hero only.
 *
 * The markup is server-rendered and fully visible by default; this only takes
 * over when motion is allowed, so the headline is never hidden behind JS.
 */
export default function HeroStage({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const { gsap } = await import("gsap");
      if (cancelled || !root.current) return;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.from("[data-boot='mask'] > *", {
          yPercent: 115,
          duration: 1.05,
          stagger: 0.09,
        })
          .from(
            "[data-boot='status']",
            { opacity: 0, y: 8, duration: 0.5 },
            "-=0.75",
          )
          .from(
            "[data-boot='lede']",
            { opacity: 0, y: 14, duration: 0.6 },
            "-=0.45",
          )
          .from(
            "[data-boot='cta'] > *",
            { opacity: 0, y: 12, duration: 0.5, stagger: 0.08 },
            "-=0.35",
          )
          .from(
            "[data-boot='rule']",
            { scaleX: 0, transformOrigin: "0 50%", duration: 1.1 },
            "-=0.9",
          )
          // The galaxy stage powers on last, after the copy has settled —
          // reads as the system booting rather than everything landing at once.
          //
          // Deliberately NO `scale` here. R3F sizes its canvas from
          // getBoundingClientRect, which includes CSS transforms — animating
          // scale meant the canvas measured itself at 94% (555x600 inside a
          // 592x640 shell) and never re-measured, because a transform doesn't
          // change the border box that its ResizeObserver watches. The result
          // was a permanently undersized canvas with a hard dead edge on the
          // right. Translate + fade only: they don't corrupt the measurement.
          .from(
            "[data-boot='panel']",
            { opacity: 0, y: 18, duration: 0.9, ease: "power2.out" },
            "-=0.7",
          );
      }, root);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return <div ref={root}>{children}</div>;
}
