"use client";

import { useEffect, useState } from "react";

/**
 * A HUD number that is *read* on arrival: the first figure in the value
 * counts up from zero over ~900ms while the rest of the string holds, so
 * docking beside a world feels like the ship scanning it. The full value
 * is rendered server-side; only the number moves, and only after mount.
 *
 * "30,000+" → 0 … 30,000+ · "Scaling to 50,000" → Scaling to 0 … 50,000
 * A value with no number renders as-is.
 */
export default function ScanReadout({ value, duration = 900 }: { value: string; duration?: number }) {
  const m = value.match(/(\d[\d,]*)/);
  const target = m ? Number(m[1].replace(/,/g, "")) : NaN;
  const [n, setN] = useState<number | null>(null);

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      // Clamped at 0 too: a rAF timestamp can precede the performance.now()
      // taken when the effect ran (the frame time is set before our code
      // runs), and a negative t here counted a HUD number below zero.
      const t = Math.min(Math.max((now - start) / duration, 0), 1);
      // easeOutExpo — fast commit, long settle.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setN(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    setN(0);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  if (!m || n === null) return <>{value}</>;
  const i = m.index ?? 0;
  return (
    <>
      {value.slice(0, i)}
      {n.toLocaleString("en-IN")}
      {value.slice(i + m[1].length)}
    </>
  );
}
