"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gallery } from "@/content/gallery";
import type { DomeTone } from "./DomeGalleryScene";
import styles from "./DomeGallery.module.scss";

const DomeGalleryScene = dynamic(() => import("./DomeGalleryScene"), { ssr: false, loading: () => null });

/*
 * The dome, and its index.
 *
 * Same contract as every scene here: three.js stays out of the first-paint
 * bundle, the canvas mounts near the viewport and after idle, it never
 * mounts under reduced motion, and it pauses off screen.
 *
 * Underneath is the INDEX — every piece as a hairline row, always in the DOM.
 * It is how the gallery is crawled, how it reads without the canvas, and how
 * a keyboard reaches the work. It is also the dome's legend (2026-09-30):
 * pointing at a row, or tabbing to it, turns that piece to the front of the
 * dome and lights it in its true colours; pointing at a frame lights its row.
 * It replaced a grid of full-colour thumbnails, which was a card grid of
 * screenshots in a site whose projects are holograms — and on a phone the
 * longest thing on the home page.
 *
 * The caption is HTML rather than in-scene text: a label that has to be
 * legible is not a job for a texture.
 */
export default function DomeGallery({ tone = "emerald", items = gallery }: { tone?: DomeTone; items?: typeof gallery }) {
  const host = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  /** The frame under the pointer, reported by the scene. */
  const [active, setActive] = useState<number | null>(null);
  /** The row under the pointer or keyboard focus. */
  const [focus, setFocus] = useState<number | null>(null);
  /*
   * Mounted is not drawn. On the home page this is the seventh canvas and
   * its textures decode behind six other scenes — measured at ten to fifteen
   * seconds before the first frame. An empty stage for that long reads as
   * broken, so it says what it is doing until the scene reports its first
   * drawn frame.
   */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (!entry.isIntersecting) return;
        if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => setMounted(true), { timeout: 2000 });
        else window.setTimeout(() => setMounted(true), 600);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const shown = active ?? focus;
  const item = shown === null ? null : items[shown];

  /*
   * A pointer shows colour by hovering, so a click opens. A finger has no
   * hover: its first tap on a piece turns it to the front and lights it,
   * the second opens it, and a tap on empty sky lets the dome turn again.
   */
  const pick = (i: number | null, touch: boolean) => {
    if (i === null) {
      if (touch) setFocus(null);
      return;
    }
    if (touch && focus !== i) {
      setFocus(i);
      return;
    }
    const href = items[i].href;
    if (href) window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={styles.wrap}>
      <div ref={host} className={styles.dome} data-live={mounted || undefined} data-ready={ready || undefined} data-tone={tone}>
        {mounted ? (
          <DomeGalleryScene
            items={items}
            paused={!visible}
            focus={focus}
            onActive={setActive}
            onPick={pick}
            onReady={() => setReady(true)}
            tone={tone}
          />
        ) : null}

        {mounted && !ready ? (
          <p className={styles.loading} aria-hidden="true">
            Warming the projectors…
          </p>
        ) : null}

        {ready ? (
          <p className={styles.caption} data-on={item ? "" : undefined} aria-live="polite">
            {item ? (
              <>
                <span className={styles.captionKind}>
                  {String((shown ?? 0) + 1).padStart(2, "0")} · {item.kind}
                </span>
                <span className={styles.captionTitle}>{item.title}</span>
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      {/* Under the dome, not on it: laid over the stage it sat on the lower
          ring's frames. Its line is reserved from the first paint and only
          shown once the dome draws, so nothing below it moves. */}
      <p className={styles.hint} data-on={ready || undefined} aria-hidden="true">
        <span className={styles.hintFine}>Drag to look around · point at a piece to see it in colour</span>
        <span className={styles.hintTouch}>Swipe to turn · tap a piece for colour, again to open</span>
      </p>

      <ol className={styles.index} aria-label="Every piece in the gallery">
        {items.map((g, i) => {
          const body = (
            <>
              <span className={styles.entryIndex}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.entryTitle}>{g.title}</span>
              <span className={styles.entryKind}>{g.kind}</span>
              {g.href ? (
                <span className={styles.entryArrow} aria-hidden="true">
                  ↗
                </span>
              ) : null}
            </>
          );
          const handlers = {
            onPointerEnter: () => setFocus(i),
            onPointerLeave: () => setFocus((f) => (f === i ? null : f)),
            onFocus: () => setFocus(i),
            onBlur: () => setFocus((f) => (f === i ? null : f)),
          };
          return (
            <li key={g.texture}>
              {g.href ? (
                <a href={g.href} target="_blank" rel="noreferrer noopener" className={styles.entry} data-on={shown === i || undefined} {...handlers}>
                  {body}
                </a>
              ) : (
                <div className={styles.entry} data-on={shown === i || undefined} {...handlers}>
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
