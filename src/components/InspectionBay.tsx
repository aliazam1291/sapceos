"use client";

import { getImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { lockScroll } from "@/lib/lenis";
import { sfx } from "@/lib/spaceSound";
import styles from "./InspectionBay.module.scss";

/**
 * The inspection bay (2026-10-28, Ali: "use better components for my design
 * work with our theme … make it interactive").
 *
 * On the deck every piece is a hologram: emerald, scanlined, the same as a
 * mission. That is the site's language for "a project", and it is also why
 * a designer's work could not be judged on /studio — nobody saw a single
 * colour Ali chose. The bay is where a piece is brought down off the
 * projector and looked at properly:
 *
 *  - it opens on the hologram and a scan line RESOLVES it into its true
 *    colours, top to bottom (the dome gallery's `uLit` idea, in CSS);
 *  - a loupe follows a fine pointer at 2.4× so type and detail can be read;
 *  - ←/→, the edge arrows, a swipe or the filmstrip move between pieces;
 *    Esc, the close key or the backdrop put it back.
 *
 * It is a dialog with focus moved in and restored, the page scroll held
 * (Lenis too), and nothing animated under reduced motion. No canvas: two
 * stacked <img>s from the image optimiser and a clip-path.
 *
 * Triggers anywhere on the page dispatch `space:inspect` with a slug, so a
 * server-rendered grid only needs <InspectTrigger> around its holograms.
 */

export type InspectItem = {
  slug: string;
  title: string;
  src: string;
  /** "contain" for marks and logos, which must not be cropped. */
  fit?: "cover" | "contain";
  kind: string;
  status: string;
  brief: string;
  note?: string;
  industry?: string;
  links?: { label: string; href: string }[];
};

const EVENT = "space:inspect";

export function inspect(slug: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: slug }));
}

/** Wraps a hologram so clicking it (or Enter on it) opens the bay. */
export function InspectTrigger({ slug, title, children }: { slug: string; title: string; children: ReactNode }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={styles.trigger}
      aria-label={`Inspect ${title} in full colour`}
      onClick={() => inspect(slug)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inspect(slug);
        }
      }}
    >
      {children}
      <span className={styles.triggerHint} aria-hidden="true">
        Inspect <span>⤢</span>
      </span>
    </div>
  );
}

/** A plain button that opens the bay at a given piece (default: the first). */
export function InspectButton({ slug, children }: { slug: string; children: ReactNode }) {
  return (
    <button type="button" className={styles.openButton} onClick={() => inspect(slug)}>
      {children}
    </button>
  );
}

// Eager for the stage: a lazy <img> with no intrinsic size lays out at 0×0
// and Chrome never starts it. Thumbnails stay lazy (they have a box).
function optimised(src: string, width: number, eager = false) {
  return getImageProps({ src, alt: "", width, height: Math.round(width * 0.625), loading: eager ? "eager" : "lazy" }).props;
}

export default function InspectionBay({ items }: { items: InspectItem[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const [lens, setLens] = useState<{ x: number; y: number; bx: number; by: number } | null>(null);
  const [loupeOn, setLoupeOn] = useState(true);
  // The slug whose true-colour image has decoded. The resolve scan waits for
  // it: on a slow line a scan over an empty frame reveals nothing.
  const [ready, setReady] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const stripRef = useRef<HTMLOListElement>(null);

  const open = index !== null;
  const item = open ? items[index] : null;

  const go = useCallback(
    (d: number) => {
      setIndex((i) => (i === null ? i : (i + d + items.length) % items.length));
      setLens(null);
      sfx("tick");
    },
    [items.length],
  );

  const close = useCallback(() => {
    setIndex(null);
    setLens(null);
    sfx("close");
  }, []);

  // Open from anywhere on the page.
  useEffect(() => {
    const onInspect = (e: Event) => {
      const slug = (e as CustomEvent<string>).detail;
      const i = items.findIndex((it) => it.slug === slug);
      if (i < 0) return;
      returnTo.current = document.activeElement as HTMLElement | null;
      setIndex(i);
      sfx("open");
    };
    window.addEventListener(EVENT, onInspect);
    return () => window.removeEventListener(EVENT, onInspect);
  }, [items]);

  // While open: keys, scroll lock, focus in and back out.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    lockScroll(true);
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prev;
      lockScroll(false);
      returnTo.current?.focus({ preventScroll: true });
    };
  }, [open, close, go]);

  // Keep the current thumbnail in view.
  useEffect(() => {
    if (index === null) return;
    const el = stripRef.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index]);

  // Fine pointers get the loupe on by default; touch has nothing to hover.
  useEffect(() => {
    setLoupeOn(window.matchMedia("(pointer: fine)").matches);
  }, []);

  if (!open || !item || typeof document === "undefined") return null;

  // 1200 CSS px: the 2x candidate (the loupe's source) stays near 2400px, not 3840.
  const big = optimised(item.src, 1200, true);
  const n = String(index + 1).padStart(2, "0");
  const total = String(items.length).padStart(2, "0");

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!loupeOn || e.pointerType !== "mouse") return;
    const img = e.currentTarget.querySelector("img");
    if (!img) return;
    const r = img.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    if (px < 0 || px > 1 || py < 0 || py > 1) {
      setLens(null);
      return;
    }
    const host = e.currentTarget.getBoundingClientRect();
    setLens({ x: e.clientX - host.left, y: e.clientY - host.top, bx: px * 100, by: py * 100 });
  };

  return createPortal(
    <div
      className={styles.bay}
      role="dialog"
      aria-modal="true"
      aria-label={`Inspection bay: ${item.title}`}
      onPointerDown={(e) => {
        swipe.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const s = swipe.current;
        swipe.current = null;
        if (!s || e.pointerType === "mouse") return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) go(dx < 0 ? 1 : -1);
      }}
    >
      <button type="button" className={styles.backdrop} aria-label="Close the inspection bay" tabIndex={-1} onClick={close} />

      <header className={styles.bar}>
        <span className={styles.barLabel}>
          <span className={styles.barPrefix}>Inspection bay · </span>
          <b>Bay {n} / {total}</b>
        </span>
        <span className={styles.barTools}>
          <button
            type="button"
            className={styles.tool}
            aria-pressed={loupeOn}
            onClick={() => {
              setLoupeOn((v) => !v);
              setLens(null);
            }}
          >
            Loupe {loupeOn ? "on" : "off"}
          </button>
          <button ref={closeRef} type="button" className={styles.tool} onClick={close}>
            Close <span aria-hidden="true">✕</span>
          </button>
        </span>
      </header>

      <div className={styles.body}>
        <div className={styles.stage} onPointerMove={onMove} onPointerLeave={() => setLens(null)}>
          {/* key: a new piece remounts the frame, so the resolve scan runs again. */}
          <figure key={item.slug} className={styles.frame} data-fit={item.fit ?? "cover"} data-ready={ready === item.slug || undefined}>
            <i className={styles.bracket} data-c="tl" />
            <i className={styles.bracket} data-c="tr" />
            <i className={styles.bracket} data-c="bl" />
            <i className={styles.bracket} data-c="br" />
            {/* eslint-disable-next-line @next/next/no-img-element -- optimiser URL from getImageProps */}
            <img {...big} alt={`${item.title}: ${item.kind}`} className={styles.true} onLoad={() => setReady(item.slug)} />
            {/* The projection, wiped away by the scan to leave the real thing. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img {...big} alt="" aria-hidden="true" className={styles.holo} />
            <span className={styles.scan} aria-hidden="true" />
            <span className={styles.receiving} aria-hidden="true">
              Receiving…
            </span>
          </figure>

          {lens ? (
            <span
              className={styles.loupe}
              aria-hidden="true"
              style={{
                left: lens.x,
                top: lens.y,
                backgroundImage: `url("${big.src}")`,
                backgroundPosition: `${lens.bx}% ${lens.by}%`,
              }}
            />
          ) : null}

          <button type="button" className={styles.nav} data-side="prev" onClick={() => go(-1)} aria-label="Previous piece">
            <span aria-hidden="true">‹</span>
          </button>
          <button type="button" className={styles.nav} data-side="next" onClick={() => go(1)} aria-label="Next piece">
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <aside className={styles.info} aria-live="polite">
          <p className={styles.meta}>
            <span>{item.kind}</span>
            <span>{item.status}</span>
            {item.industry ? <span>{item.industry}</span> : null}
          </p>
          <h2 className={styles.title}>{item.title}</h2>
          <p className={styles.brief}>{item.brief}</p>
          {item.note ? <p className={styles.note}>{item.note}</p> : null}
          {item.links?.length ? (
            <p className={styles.links}>
              {item.links.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener">
                  {l.label} <span aria-hidden="true">↗</span>
                </a>
              ))}
            </p>
          ) : null}
          <p className={styles.keys} aria-hidden="true">
            ← → to move · Esc to close{loupeOn ? " · point to magnify" : ""}
          </p>
        </aside>
      </div>

      <ol ref={stripRef} className={styles.strip} aria-label="All pieces">
        {items.map((it, i) => {
          const t = optimised(it.src, 256);
          return (
            <li key={it.slug}>
              <button
                type="button"
                className={styles.thumb}
                aria-current={i === index ? "true" : undefined}
                aria-label={`${it.title} (${i + 1} of ${items.length})`}
                onClick={() => {
                  setIndex(i);
                  setLens(null);
                  sfx("tick");
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.src} alt="" loading="lazy" data-fit={it.fit ?? "cover"} />
              </button>
            </li>
          );
        })}
      </ol>
    </div>,
    document.body,
  );
}
