"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import styles from "./Transition.module.scss";

/**
 * Level 03 — the veil. On every route change it wipes up and off, so arriving
 * at a Mission Report feels like a cut rather than a repaint.
 *
 * Purely decorative: it never blocks pointer events, and it is removed
 * entirely under reduced motion.
 */
export default function Transition() {
  const pathname = usePathname();
  const veil = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    // The boot sequence already covers the first paint.
    if (first.current) {
      first.current = false;
      return;
    }
    const el = veil.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;

    (async () => {
      const { gsap } = await import("gsap");
      if (cancelled || !veil.current) return;

      gsap
        .timeline()
        .set(veil.current, { transformOrigin: "50% 100%", scaleY: 1 })
        .set(mark.current, { opacity: 1 })
        .to(mark.current, { opacity: 0, duration: 0.22, ease: "power2.in" })
        .to(
          veil.current,
          { scaleY: 0, duration: 0.62, ease: "power3.inOut" },
          "-=0.1",
        );
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div ref={veil} className={styles.veil} aria-hidden="true" style={{ transform: "scaleY(0)" }}>
      <div ref={mark} className={styles.mark}>
        ◉ RE-ENTRY
      </div>
    </div>
  );
}
