"use client";

import { useEffect, useRef } from "react";

/**
 * Staggers a container's direct-descendant matches in on first scroll into
 * view, once, then leaves them alone — including under a horizontal drag.
 *
 * Follows the UI Pro Max GSAP reference for a list/grid entrance: per-item
 * delay capped at 0.03–0.04s so a run of twenty-plus items doesn't take a full
 * second to finish arriving, `power1.out`, and a plain opacity/y fade rather
 * than anything that would fight the drag interaction already on this element.
 *
 * GSAP is already a dependency and every other reveal on the site loads it
 * dynamically rather than importing it at module scope, so this does the same
 * — the entrance is progressive enhancement, not a requirement to see the
 * content, which matters here specifically because the strip is horizontally
 * scrollable before any JS runs at all.
 */
export function useEntranceStagger<T extends HTMLElement>(itemSelector: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let io: IntersectionObserver | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      if (cancelled || !ref.current) return;

      const items = ref.current.querySelectorAll<HTMLElement>(itemSelector);
      if (!items.length) return;

      gsap.set(items, { opacity: 0, y: 10 });

      io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          io?.disconnect();
          gsap.to(items, {
            opacity: 1,
            y: 0,
            duration: 0.32,
            ease: "power1.out",
            stagger: Math.min(0.03, 0.6 / items.length),
          });
        },
        { threshold: 0.15 },
      );
      io.observe(ref.current);
    })();

    return () => {
      cancelled = true;
      io?.disconnect();
    };
  }, [itemSelector]);

  return ref;
}
