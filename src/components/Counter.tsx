"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts a number up when it scrolls into view. The full value is rendered
 * server-side and only replaced once the animation actually starts, so
 * crawlers and no-JS readers always see the real figure.
 */
export default function Counter({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const duration = 1100;
        const start = performance.now();
        const step = (now: number) => {
          // Clamped at 0 too (see ScanReadout): a rAF timestamp can precede
          // the performance.now() taken when the observer fired.
          const t = Math.min(Math.max((now - start) / duration, 0), 1);
          // easeOutExpo — fast commit, long settle.
          const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
          setDisplay(Math.round(value * eased));
          if (t < 1) raf = requestAnimationFrame(step);
        };
        setDisplay(0);
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  // The final value holds the width while the count runs (2026-09-20): a
  // number growing from "0" to "6,00,000+" reflowed its cell — on the
  // two-column phone readout it wrapped mid-count and moved the row below.
  // Both spans share one grid cell; the hidden one sizes it.
  return (
    <span ref={ref} style={{ display: "inline-grid", whiteSpace: "nowrap" }}>
      <span aria-hidden="true" style={{ gridArea: "1 / 1", visibility: "hidden" }}>
        {prefix}
        {value.toLocaleString("en-IN")}
        {suffix}
      </span>
      <span style={{ gridArea: "1 / 1" }}>
        {prefix}
        {display.toLocaleString("en-IN")}
        {suffix}
      </span>
    </span>
  );
}
