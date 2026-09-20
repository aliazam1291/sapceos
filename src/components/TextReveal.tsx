"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Line-masked text reveal, built on GSAP SplitText.
 *
 * The element renders as ordinary text server-side and is fully visible with
 * no JS — SplitText only takes over once motion is allowed, so this can never
 * leave a heading invisible the way an opacity-0-until-JS approach can.
 *
 * `autoSplit` re-splits on resize and after webfonts load, which matters: a
 * split measured against the fallback font produces line breaks that are wrong
 * the moment Geist swaps in. `aria: "auto"` keeps the original string exposed
 * to screen readers rather than a pile of per-line divs.
 */
export default function TextReveal({
  as: Tag = "span",
  children,
  className,
  delay = 0,
  stagger = 0.08,
  start = "top 88%",
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  start?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let split: { revert: () => void } | undefined;
    let cancelled = false;

    /*
     * Arrival is an IntersectionObserver, not a ScrollTrigger (2026-09-20).
     * A ScrollTrigger per title — ten on the home page — re-measured layout
     * on every scroll event; GSAP's scroll handler showed 1.4 s of main
     * thread across one reading-pace scroll of the page. The observer
     * fires once, at the same place `start` used to ("top 88%" ≈ the
     * element's top crossing 88% of the viewport), and costs nothing between.
     */
    const pct = Number((start.match(/(\d+)%/) ?? [])[1] ?? 88);
    let io: IntersectionObserver | undefined;
    let armed = false;
    (async () => {
      const [{ gsap }, { SplitText }] = await Promise.all([import("gsap"), import("gsap/SplitText")]);
      if (cancelled || !ref.current) return;
      gsap.registerPlugin(SplitText);

      split = SplitText.create(ref.current, {
        type: "lines",
        // Wraps every line in its own overflow-hidden element, so lines rise
        // out from behind a clean edge instead of just fading.
        mask: "lines",
        autoSplit: true,
        aria: "auto",
        // Returning the tween lets GSAP swap it out cleanly on each re-split.
        onSplit: (self: { lines: Element[] }) => {
          const tween = gsap.from(self.lines, { yPercent: 115, duration: 0.95, ease: "power3.out", stagger, delay, paused: !armed });
          if (!io) {
            io = new IntersectionObserver(
              ([e]) => {
                if (!e.isIntersecting) return;
                armed = true;
                tween.play();
                io?.disconnect();
              },
              { rootMargin: `0px 0px -${100 - pct}% 0px`, threshold: 0 },
            );
            io.observe(ref.current as Element);
          }
          return tween;
        },
      });
    })();

    return () => {
      cancelled = true;
      io?.disconnect();
      split?.revert();
    };
  }, [delay, stagger, start]);

  // TypeScript can't resolve JSX props through a generic `ElementType` (they
  // collapse to `never`), so pin it to one concrete intrinsic tag for type
  // purposes. `ref`/`className`/`children` are identical across every tag this
  // accepts, and the real tag name is still whatever the caller passed.
  const Component = Tag as "h1";

  return (
    <Component ref={ref as React.RefObject<HTMLHeadingElement>} className={className}>
      {children}
    </Component>
  );
}
