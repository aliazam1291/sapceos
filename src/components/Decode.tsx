"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Text that decodes into place.
 *
 * The real text is server-rendered and stays in the DOM (an `aria-label` and
 * the final state are both the true string). When the element scrolls into
 * view, each character cycles through glyphs from a small mono set and locks
 * to its real value left to right — a signal resolving, in the same register
 * as the scan bands and the matrix portrait. Runs once per element, never
 * under reduced motion, and only on fine-grained text (labels, not body
 * copy), because a paragraph of churning glyphs is noise.
 *
 * Driven through React state rather than by writing `textContent`, so React
 * never finds a text node it did not put there.
 */

const GLYPHS = "01<>/\\|=+-·:#%&$@^~";

export default function Decode({
  children,
  as: Tag = "span",
  className,
  duration = 700,
  delay = 0,
}: {
  children: string;
  as?: ElementType;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const text = children;
  const [shown, setShown] = useState(text);

  useEffect(() => {
    setShown(text);
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let done = false;

    const run = () => {
      const start = performance.now() + delay;
      const chars = Array.from(text);
      const tick = (now: number) => {
        const p = Math.min(1, Math.max(0, (now - start) / duration));
        const locked = Math.floor(p * chars.length);
        let out = "";
        for (let i = 0; i < chars.length; i++) {
          const c = chars[i];
          if (c === " " || i < locked) out += c;
          else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        setShown(p < 1 ? out : text);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !done) {
          done = true;
          io.disconnect();
          run();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [text, duration, delay]);

  const T = Tag as unknown as React.ComponentType<{
    ref: React.Ref<HTMLElement>;
    className?: string;
    "aria-label": string;
    children: ReactNode;
  }>;
  return (
    <T ref={ref} className={className} aria-label={text}>
      {shown}
    </T>
  );
}
