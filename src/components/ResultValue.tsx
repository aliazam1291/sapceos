"use client";

import { useEffect, useRef, useState } from "react";
import { parseFigure } from "@/lib/success";

/**
 * A measured result that counts up when it scrolls into view, written the
 * way the report writes it: "200,000+" counts in western thousands, "80%"
 * keeps its sign, "~40%" its tilde. (Counter and ScanReadout format with
 * en-IN grouping, which would print 2,00,000+ beside a "200,000+" in the
 * copy.) The real value is server-rendered and only replaced once the count
 * starts, so crawlers and no-JS readers get the figure; a value with no
 * number, or one too small to be worth animating, renders as written.
 */
export default function ResultValue({ value, duration = 1100 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<string>(value);

  useEffect(() => {
    const f = parseFigure(value);
    const el = ref.current;
    if (!f || !el || f.n < 10) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const base = Number(f.digits.replace(/,/g, ""));
    const grouped = f.digits.includes(",");
    const decimals = f.digits.includes(".") ? f.digits.split(".")[1].length : 0;
    const write = (x: number) =>
      `${f.prefix}${grouped ? x.toLocaleString("en-US", { maximumFractionDigits: decimals }) : x.toFixed(decimals)}${f.unit}${f.suffix}`;

    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          // Clamped at 0: a rAF timestamp can precede `start` (see ScanReadout).
          const t = Math.min(Math.max((now - start) / duration, 0), 1);
          const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
          setShown(write(decimals ? base * eased : Math.round(base * eased)));
          if (t < 1) raf = requestAnimationFrame(step);
          else setShown(value);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return <span ref={ref}>{shown}</span>;
}
