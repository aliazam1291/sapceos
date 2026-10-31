"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motto } from "@/content/building";
import { useOnScreen } from "@/lib/use-on-screen";
import styles from "./AceCard.module.scss";

/**
 * The ace (2026-10-31). Ali: "a quote I follow — jack of all trades, master
 * of none, oftentimes better than the master of one — I need a 3D ace deck
 * card for this", then "make the card cooler".
 *
 * CSS 3D, no canvas. The ace of spades on obsidian stock with a foil edge a
 * light runs round; the spade is a window into space — stars, an emerald
 * nebula, a small amber world with a ring — under a foil outline that
 * floats above it. Pointing at the card tilts it and the layers move at
 * different depths (the stars least, the outline most), with foil sheen
 * and glare following; a sheen sweeps across it every few seconds. A click,
 * a tap or Enter/Space turns it over to the proverb. It is dealt onto a
 * small deck when the reader first arrives. The quote is also the
 * caption, as text, for anyone who never turns the card.
 */

// One spade, drawn once (viewBox 0 0 100 100); the stylesheet masks the
// space window with the same path.
const SPADE =
  "M50 3C40 20 8 36 8 61c0 14 11 25 24 25 8 0 14-4 17-9-1 9-5 16-14 20h30c-9-4-13-11-14-20 3 5 9 9 17 9 13 0 24-11 24-25C92 36 60 20 50 3Z";

function Spade({ fill, stroke, className }: { fill?: string; stroke?: string; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <path d={SPADE} fill={fill ?? "none"} stroke={stroke} strokeWidth={stroke ? 2.6 : undefined} strokeLinejoin="round" />
    </svg>
  );
}

export default function AceCard() {
  const ref = useRef<HTMLElement>(null);
  const on = useOnScreen(ref, "0px");
  const [turned, setTurned] = useState(false);
  const [deal, setDeal] = useState<"pending" | "dealt" | undefined>(undefined);
  const foilId = `ace-foil-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const foil = `url(#${foilId})`;

  // The deal: off screen at load, the card waits above the deck and is
  // dealt onto it once the reader is here (half of it on screen, confirmed
  // 350 ms later). Already on screen, or reduced motion: it is simply there.
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;
    setDeal("pending");
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        window.clearTimeout(timer);
        if (!e.isIntersecting) return;
        timer = window.setTimeout(() => {
          setDeal("dealt");
          io.disconnect();
        }, 350);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  const tilt = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    const s = e.currentTarget.style;
    s.setProperty("--ry", `${(x * 22).toFixed(2)}deg`);
    s.setProperty("--rx", `${(-y * 16).toFixed(2)}deg`);
    s.setProperty("--sx", x.toFixed(3));
    s.setProperty("--sy", y.toFixed(3));
    s.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
    s.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const settle = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = e.currentTarget.style;
    for (const k of ["--rx", "--ry"]) s.setProperty(k, "0deg");
    for (const k of ["--sx", "--sy"]) s.setProperty(k, "0");
  };

  return (
    <figure ref={ref} className={styles.ace} data-off={on ? undefined : ""}>
      <svg className={styles.defs} aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={foilId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1a8f68" />
            <stop offset="0.32" stopColor="#8af0c8" />
            <stop offset="0.5" stopColor="#3cdd9e" />
            <stop offset="0.64" stopColor="#e8fff6" />
            <stop offset="1" stopColor="#1a8f68" />
          </linearGradient>
        </defs>
      </svg>

      <div className={styles.float}>
        {/* The deck it was dealt from: two cards face down, fanned. */}
        <span className={styles.under} data-n="1" aria-hidden="true">
          <span className={styles.base} />
          <Spade stroke={foil} className={styles.emblem} />
        </span>
        <span className={styles.under} data-n="2" aria-hidden="true">
          <span className={styles.base} />
          <Spade stroke={foil} className={styles.emblem} />
        </span>

        <div className={styles.deal} data-deal={deal}>
          <button
            type="button"
            className={styles.card}
            data-turned={turned || undefined}
            aria-pressed={turned}
            onClick={() => setTurned((t) => !t)}
            onPointerMove={tilt}
            onPointerLeave={settle}
          >
            {/* The name comes from this, not an aria-label: the faces carry
                visible text an aria-label would have to repeat (WCAG 2.5.3,
                axe label-content-name-mismatch). */}
            <span className="visually-hidden">The ace of spades, Jack of all trades: turn it over to read the proverb</span>
            <span className={styles.flip}>
              <span className={styles.face} data-side="front" aria-hidden="true">
                <span className={styles.run} />
                <span className={styles.base} />
                <span className={styles.window}>
                  <span className={styles.ring} />
                  <span className={styles.planet} />
                </span>
                <Spade stroke={foil} className={styles.outline} />
                <span className={styles.index} data-at="tl">
                  <b>A</b>
                  <Spade fill={foil} />
                </span>
                <span className={styles.index} data-at="br">
                  <b>A</b>
                  <Spade fill={foil} />
                </span>
                <span className={styles.mark}>Jack of all trades</span>
                <span className={styles.holo} />
                <span className={styles.sweep} />
                <span className={styles.glare} />
              </span>

              <span className={styles.face} data-side="back" aria-hidden="true">
                <span className={styles.run} />
                <span className={styles.base} />
                <Spade fill={foil} className={styles.watermark} />
                <span className={styles.backLabel}>
                  <Spade fill={foil} />
                  Jack of all trades
                </span>
                <span className={styles.quoteMark}>&ldquo;</span>
                <span className={styles.quote}>
                  <span>{motto.lead}</span> <em>{motto.turn}</em>
                </span>
                <span className={styles.backIndex}>
                  <b>A</b>
                  <Spade fill={foil} />
                </span>
                <span className={styles.holo} />
                <span className={styles.glare} />
              </span>
            </span>
          </button>
        </div>
      </div>

      <figcaption className={styles.caption}>
        <span className={styles.captionLabel}>The proverb I work by</span>
        <q className={styles.captionQuote}>
          {motto.lead} {motto.turn}
        </q>
        <span className={styles.hint} aria-hidden="true">
          <span className={styles.hintHover}>Click the ace to turn it</span>
          <span className={styles.hintTouch}>Tap the ace to turn it</span>
        </span>
      </figcaption>
    </figure>
  );
}
