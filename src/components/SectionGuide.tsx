"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { scrollToId } from "@/lib/lenis";
import styles from "./SectionGuide.module.scss";

type Entry = { id: string; label: string };

/**
 * Right-edge section rail: where you are in the page, and how much is left.
 *
 * Sections declare themselves in the markup with `data-section="Label"` and an
 * `id`, so the rail is never a hand-maintained list that drifts out of sync
 * with the page it describes. Discovery re-runs per route.
 *
 * Hidden entirely when a page has fewer than two sections — a progress rail
 * with one tick on it is noise.
 */
export default function SectionGuide() {
  const pathname = usePathname();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  // ── Discover the page's sections ──────────────────────────────────────────
  useEffect(() => {
    const discover = () => {
      const found = [...document.querySelectorAll<HTMLElement>("[data-section]")]
        .filter((el) => el.id)
        .map((el) => ({ id: el.id, label: el.dataset.section ?? el.id }));
      setEntries((prev) => (prev.length === found.length && prev.every((p, i) => p.id === found[i].id) ? prev : found));
    };
    discover();
    setActive(0);
    activeRef.current = 0;
    // The HTML streams: this effect can run while the tail of the page is
    // still arriving, and the rail then read "Leg 01 / 06" on a ten-leg page
    // (2026-09-20). Look again when the document has fully loaded and
    // whenever a section is added later.
    window.addEventListener("load", discover);
    const mo = new MutationObserver((muts) => {
      if (muts.some((m) => [...m.addedNodes].some((n) => n instanceof HTMLElement && (n.hasAttribute("data-section") || n.querySelector("[data-section]"))))) discover();
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener("load", discover);
      mo.disconnect();
    };
  }, [pathname]);

  // ── Track which one is on screen ──────────────────────────────────────────
  useEffect(() => {
    if (entries.length < 2) return;

    const els = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;

    /*
     * IntersectionObserver reports entries in arbitrary order and several can
     * be intersecting at once, so "the last one that fired" is not the answer.
     * Each callback re-reads which sections are currently intersecting and
     * picks the topmost, which is stable regardless of firing order.
     */
    const visible = new Set<Element>();

    const io = new IntersectionObserver(
      (records) => {
        for (const r of records) {
          if (r.isIntersecting) visible.add(r.target);
          else visible.delete(r.target);
        }

        let best = -1;
        for (let i = 0; i < els.length; i++) {
          if (visible.has(els[i])) {
            best = i;
            break;
          }
        }

        // Nothing intersecting mid-scroll between two sections: hold the last
        // known position rather than flickering back to the first.
        if (best === -1 || best === activeRef.current) return;
        activeRef.current = best;
        setActive(best);
      },
      // A band across the middle of the viewport, so a section counts as
      // "current" when it is being read, not when it first peeks in.
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [entries]);

  if (entries.length < 2) return null;

  return (
    <nav className={styles.guide} aria-label="Page sections">
      <p className={styles.current} aria-hidden="true">
        <span className={styles.dash} />
        {entries[active]?.label}
      </p>
      {/* The leg counter: where on the route, out of how many. */}
      <p className={styles.leg} aria-hidden="true">
        Leg {String(active + 1).padStart(2, "0")} / {String(entries.length).padStart(2, "0")}
      </p>

      <div className={styles.route} style={{ "--i": active } as React.CSSProperties}>
        {/* The ship marker rides the route between ticks. */}
        <span className={styles.marker} aria-hidden="true" />
      <ol className={styles.ticks}>
        {entries.map((e, i) => (
          <li key={e.id}>
            <button
              type="button"
              className={styles.tick}
              data-on={i === active || undefined}
              data-passed={i < active || undefined}
              onClick={() => scrollToId(e.id)}
              aria-current={i === active ? "true" : undefined}
            >
              <span className={styles.tickLabel}>{e.label}</span>
              <span className={styles.tickMark} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
      </div>
    </nav>
  );
}
