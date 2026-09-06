"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useEntranceStagger } from "@/lib/use-entrance-stagger";
import { fragments } from "@/content/fragments";
import styles from "./Fragments.module.scss";

const KIND_LABEL: Record<string, string> = {
  mission: "Mission",
  lab: "Experiment",
  note: "Field note",
};

/**
 * The whole inventory as one draggable band.
 *
 * A count on its own is a claim. A count you can drag through is evidence — so
 * the number and the things it counts sit in the same element, and scrubbing
 * the strip is what makes the total feel true.
 *
 * DRAG IS AN ADDITION, NOT THE MECHANISM. The strip is an ordinary
 * `overflow-x` scroller, so the wheel, a trackpad, touch, and Tab all work
 * before any of this component's JavaScript runs. Pointer-drag is layered on
 * top for mouse users, who otherwise have no way to move a horizontal scroller
 * without finding its scrollbar.
 */
export default function Fragments() {
  const rail = useRef<HTMLDivElement>(null);
  /*
   * The one place on the site meant to read as "a lot of work" had no entrance
   * at all — every other list on the site (missions, field notes) reveals on
   * scroll and this one just appeared. Staggered per the UI Pro Max GSAP
   * reference for a grid/list of this length: 30ms per item, power1.out,
   * capped so twenty tiles don't take a full second to finish arriving.
   */
  const stripRef = useEntranceStagger<HTMLUListElement>("li");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;

    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let down = false;
    let startX = 0;
    let startLeft = 0;
    let moved = 0;

    /*
     * NATIVE LINK DRAG HAS TO BE SUPPRESSED, or none of this works.
     *
     * Every tile is an <a>, and anchors are draggable by default. Pressing on
     * one and moving starts an HTML drag-and-drop, and the browser then stops
     * emitting pointermove for the rest of the gesture. Traced move by move,
     * `scrollLeft` advanced once and froze: a 270px drag scrolled 45px, every
     * time, regardless of what the handler did afterwards. `dragstart` is
     * cancelled below and the tiles carry `draggable={false}`.
     *
     * Pointer capture is deliberately NOT used — this listener is on `window`,
     * which already receives moves anywhere on the page, and capture only
     * retargets the stream for no gain.
     */

    const onDown = (e: PointerEvent) => {
      // Left button only, and never start a drag on a control the reader is
      // actually trying to click.
      if (e.button !== 0) return;
      down = true;
      moved = 0;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    };

    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) el.dataset.dragging = "";
      el.scrollLeft = startLeft - dx;
    };

    const onUp = () => {
      if (!down) return;
      down = false;
      delete el.dataset.dragging;
      // A drag that ended over a tile must not also open it. Anything under
      // ~5px is a click that wobbled, and still counts as a click.
      if (moved > 5) {
        const swallow = (ev: Event) => {
          ev.preventDefault();
          ev.stopPropagation();
        };
        el.addEventListener("click", swallow, { capture: true, once: true });
        // If no click follows, the listener would sit there waiting for the
        // next real one and eat it.
        setTimeout(() => el.removeEventListener("click", swallow, true), 0);
      }
    };

    // Cancelling this is what keeps pointermove flowing across the gesture.
    const onDragStart = (e: Event) => e.preventDefault();

    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("dragstart", onDragStart);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <section id="fragments" data-section="Fragments" className={styles.band}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <p className={styles.label}>02 / Fragments</p>
          <h2 className={styles.title}>Everything that exists</h2>
          <p className={styles.lede}>
            Every mission, experiment and note in one strip. Drag it.
          </p>
        </div>
        {/* Derived from the array, so it can never overstate what is there. */}
        <p className={styles.count} aria-hidden="true">
          {fragments.length}
        </p>
      </div>

      <div className={styles.rail} ref={rail} tabIndex={-1}>
        <ul className={styles.strip} ref={stripRef}>
          {fragments.map((f, i) => (
            <li key={`${f.kind}-${f.id}`} className={styles.cell}>
              <Link
                href={f.href}
                className={styles.tile}
                data-kind={f.kind}
                draggable={false}
              >
                <span className={styles.index}>
                  FR&#8209;{String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.kind}>{KIND_LABEL[f.kind]}</span>
                <span className={styles.tileTitle}>{f.title}</span>
                <span className={styles.meta}>
                  {f.meta}
                  {f.draft ? <em className={styles.draft}>Unwritten</em> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.progress} aria-hidden="true">
        <span style={{ transform: `scaleX(${Math.max(progress, 0.02)})` }} />
      </div>
    </section>
  );
}
