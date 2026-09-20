"use client";

import { useEffect, useRef, useState } from "react";
import Decode from "./Decode";
import { comms, type CommsAt, type CommsLine } from "@/content/voice";
import styles from "./Comms.module.scss";

/**
 * The comms log — mission control talking over the reader's shoulder.
 *
 * A two-line mono transcript with callsigns and T+ stamps, the same
 * instrument as the boot log and the 404 log, now on every leg. The
 * lines arrive one at a time on a clock from the moment the reader is
 * actually here (an intersection, confirmed 350ms later — the same
 * arrival rule as the drones), typed out, never all at once. It is the
 * site's voice: dry, one beat, never about a fact. Lines live in
 * `content/voice.ts`; a `lines` prop overrides them where the copy
 * depends on state (Touchdown).
 */
export default function Comms({
  at,
  lines,
  className,
  delay = 120,
  gap = 1100,
}: {
  at?: CommsAt;
  lines?: readonly CommsLine[];
  className?: string;
  /** ms after arrival before the first line. */
  delay?: number;
  /** ms between lines. */
  gap?: number;
}) {
  const list = lines ?? (at ? comms[at] : []);
  const ref = useRef<HTMLOListElement>(null);
  const [shown, setShown] = useState(0);
  const key = list.map((l) => l.line).join("|");

  useEffect(() => {
    const el = ref.current;
    if (!el || !list.length) return;
    setShown(0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(list.length);
      return;
    }
    let timers: number[] = [];
    let confirm = 0;
    let done = false;
    const start = () => {
      if (done) return;
      done = true;
      io.disconnect();
      list.forEach((_, i) => {
        timers.push(window.setTimeout(() => setShown(i + 1), delay + i * gap));
      });
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(confirm);
        if (!entry.isIntersecting) return;
        // Confirmed on a second look: pinned sections above insert their
        // spacers a beat after load and the first frame can lie.
        confirm = window.setTimeout(() => {
          const r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) start();
        }, 350);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(confirm);
      timers.forEach((t) => window.clearTimeout(t));
      timers = [];
    };
    // Re-arm when the lines change (Touchdown swaps them by state).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, delay, gap]);

  if (!list.length) return null;

  return (
    <ol ref={ref} className={`${styles.log} ${className ?? ""}`} aria-label="Comms">
      {/* Every line is in the layout from the start (hidden, same text, same
          wrap) and only becomes visible on its cue — so the transcript never
          grows under the reader. Mounting lines one at a time was a layout
          shift on every page that has one. */}
      {list.map((l, i) => {
        const on = i < shown;
        return (
          <li key={l.line} className={styles.line} data-shown={on || undefined} aria-hidden={!on || undefined}>
            <span className={styles.stamp}>T+{(i * (gap / 1000)).toFixed(1)}s</span>
            <span className={styles.who} data-who={l.who}>
              {l.who}
            </span>
            <span className={styles.text}>
              {on ? <Decode duration={Math.min(900, 220 + l.line.length * 14)}>{l.line}</Decode> : l.line}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
