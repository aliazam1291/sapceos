"use client";

import { useEffect, useRef, useState } from "react";
import type { Series } from "@/content/analytics";
import styles from "./Bars.module.scss";

/*
 * A bar readout (2026-09-22). An instrument, not a chart library: hairline
 * rows, a mono label, an emerald bar that grows from the left, the number
 * on the right. Wireframe emerald — photoreal is for worlds and ships.
 *
 * The bars draw themselves when the reader arrives (intersection + the
 * same 350ms confirm the rest of the site's sequences use), on a clock, so
 * a fast scroller still sees them move rather than finding them finished.
 * Widths are a CSS custom property so the growth is one compositor
 * transform per row, not a layout per frame.
 */
export default function Bars({
  items,
  max,
  unit,
  label,
  scale = "linear",
}: {
  items: Series;
  /** Full-width value. Defaults to the largest in the series. */
  max?: number;
  /** Appended to each value, e.g. "of 10". */
  unit?: string;
  label: string;
  /** Word counts span an order of magnitude; a log scale keeps the small ones readable. */
  scale?: "linear" | "log";
}) {
  const ref = useRef<HTMLDListElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    let confirm = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) confirm = window.setTimeout(() => setOn(true), 350);
        else window.clearTimeout(confirm);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => {
      window.clearTimeout(confirm);
      io.disconnect();
    };
  }, []);

  const top = max ?? Math.max(...items.map((i) => i.value), 1);
  const width = (v: number) => {
    if (scale === "log") return Math.max(0.06, Math.log10(Math.max(v, 1)) / Math.log10(Math.max(top, 10)));
    return Math.max(0.02, v / top);
  };

  return (
    <dl ref={ref} className={styles.bars} aria-label={label} data-on={on || undefined}>
      {items.map((it, i) => (
        <div key={it.label} className={styles.row} style={{ "--lag": `${i * 70}ms` } as React.CSSProperties}>
          <dt className={styles.label}>
            {it.label}
            {it.note ? <span className={styles.note}>{it.note}</span> : null}
          </dt>
          <dd className={styles.value}>
            <span className={styles.track} aria-hidden="true">
              <i className={styles.fill} style={{ "--w": width(it.value) } as React.CSSProperties} />
            </span>
            <span className={styles.number}>
              {it.value.toLocaleString("en-IN")}
              {unit ? <span className={styles.unit}> {unit}</span> : null}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
