"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gallery, type GalleryItem } from "@/content/gallery";
import type { DomeTone } from "./DomeGalleryScene";
import InspectionBay, { inspect, type InspectItem } from "@/components/InspectionBay";
import styles from "./DomeGallery.module.scss";

/*
 * The vortex replaced the dome as the scene (2026-11-23, Ali: "like a vortex
 * — going through a circle, things rotating, and once the user clicks he can
 * see the design"). DomeGalleryScene stays: its hologram plate (Frame) is
 * what the vortex draws. A click now opens the piece full size in the
 * inspection bay rather than in a new tab; the bay links out to Behance or
 * the live site from there.
 */
const VortexGalleryScene = dynamic(() => import("./VortexGalleryScene"), { ssr: false, loading: () => null });

/** Gallery slugs are prefixed so they never collide with a studio bay's. */
const slugOf = (g: GalleryItem) => "g-" + g.texture.split("/").pop()!.replace(/\.\w+$/, "");

function inspectItem(g: GalleryItem): InspectItem {
  return {
    slug: slugOf(g),
    title: g.title,
    src: g.full,
    fit: /logo|template|poster/i.test(g.kind) ? "contain" : "cover",
    kind: g.kind,
    status: g.client ? "Client work" : "Independent",
    brief: g.client ? `${g.kind} for ${g.client}.` : `${g.kind}.`,
    links: g.href ? [{ label: g.href.includes("behance.net") ? "Open on Behance" : "Visit the live site", href: g.href }] : [],
  };
}

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
  /** The piece the flight is about to pass — the readout's line. */
  const [passing, setPassing] = useState(0);

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
      // Mount well before arrival (a viewport and a half below): the
      // textures take seconds to decode, and the reader should meet a dome,
      // not a loading line.
      { rootMargin: "150% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /*
   * How far through the pin the reader has scrolled, 0..1 (see `.pin` in
   * the module). Read on scroll and resize only, written to a ref the scene
   * reads each frame — no React state per scroll event.
   */
  const pin = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  useEffect(() => {
    const wrap = pin.current;
    const stage = host.current;
    if (!wrap || !stage) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const r = wrap.getBoundingClientRect();
      const stickTop = parseFloat(getComputedStyle(stage).top) || 0;
      const run = r.height - stage.offsetHeight;
      // Below zero on the approach (down to -0.3), so the flight is already
      // moving as the stage rises into place and arrives on piece 01.
      progress.current = run > 0 ? Math.min(1, Math.max(-0.3, (stickTop - r.top) / run)) : 0;
      // The readout's track: a compositor scaleX, no layout.
      stage.style.setProperty("--p", Math.max(0, progress.current).toFixed(4));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
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
    inspect(slugOf(items[i]));
  };
  const bay = items.map(inspectItem);

  return (
    <div className={styles.wrap}>
      <div ref={pin} className={styles.pin}>
      <div ref={host} className={styles.dome} data-live={mounted || undefined} data-ready={ready || undefined} data-tone={tone}>
        {mounted ? (
          <VortexGalleryScene
            items={items}
            progress={progress}
            paused={!visible}
            focus={focus}
            onActive={setActive}
            onPick={pick}
            onPassing={setPassing}
            onReady={() => setReady(true)}
            onLost={() => setReady(false)}
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

        {/* The flight's instrument: what is coming up, and how far through
            the run the reader is. It says when the pin will let go. */}
        {ready ? (
          <div className={styles.flight} aria-hidden="true">
            <span className={styles.flightLabel}>
              Passing <b>{String(passing + 1).padStart(2, "0")}</b> / {String(items.length).padStart(2, "0")}
            </span>
            <span className={styles.flightTitle}>{items[passing]?.title}</span>
            <span className={styles.track}>
              <span className={styles.fill} />
            </span>
          </div>
        ) : null}

        {/* On the pinned stage, so it travels with it through the run. */}
        <p className={styles.hint} data-on={ready || undefined} aria-hidden="true">
          <span className={styles.hintFine}>Scroll to fly through · drag to spin · point at a piece for colour, click to open it</span>
          <span className={styles.hintTouch}>Scroll to fly through · tap a piece for colour, again to open it</span>
        </p>
      </div>
      </div>

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

      {/* Where a click in the vortex lands: the piece, full size, in its
          true colours, with its link out. */}
      <InspectionBay items={bay} />
    </div>
  );
}
