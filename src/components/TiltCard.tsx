"use client";

import { useRef, type ReactNode } from "react";
import styles from "./TiltCard.module.scss";

/**
 * A card that tilts toward the pointer in 3D and carries a light that tracks
 * the cursor. Fine pointers only, and it goes flat under reduced motion — the
 * tilt is affordance, not the content.
 */
export default function TiltCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - py) * 7}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 9}deg`);
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div className={styles.scene} data-reveal>
      <div
        ref={ref}
        className={`${styles.card} ${className}`}
        onPointerMove={onMove}
        onPointerLeave={reset}
      >
        <div className={styles.glare} aria-hidden="true" />
        <div className={styles.inner}>{children}</div>
      </div>
    </div>
  );
}

export { styles as tilt };
