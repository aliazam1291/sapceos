"use client";

import { useState } from "react";
import { sfx } from "@/lib/spaceSound";
import { FILTER_EVENT } from "./InspectionBay";
import styles from "./WorkFilter.module.scss";

/**
 * Show one kind of work at a time (2026-10-28). /studio is sixteen
 * projectors in two shelves; a reader after brand identities should not
 * have to scroll past every website to find them.
 *
 * The grids stay server-rendered — every piece is in the HTML for crawlers
 * and no-JS readers — and this only hides what does not match, inside any
 * element carrying `data-work-scope={scope}`. Each piece carries
 * `data-group`; a shelf left empty shows the `data-empty-note` placed right
 * after it. The inspection bay hears the same choice (`space:inspect-filter`)
 * and pages through only the pieces on show.
 */

export type WorkGroup = { key: string; label: string; count: number };

export default function WorkFilter({ groups, total, scope }: { groups: WorkGroup[]; total: number; scope: string }) {
  const [on, setOn] = useState<string | null>(null);
  const [shown, setShown] = useState(total);

  const pick = (key: string | null, chip?: HTMLElement) => {
    // On a phone the row scrolls sideways: keep the chosen key in view.
    chip?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    if (key === on) return;
    setOn(key);
    sfx("tick");
    let count = 0;
    document.querySelectorAll<HTMLElement>(`[data-work-scope="${scope}"]`).forEach((shelf) => {
      let inShelf = 0;
      shelf.querySelectorAll<HTMLElement>("[data-group]").forEach((el) => {
        const show = key === null || el.dataset.group === key;
        // A module class sets `display`, which beats the `hidden` attribute.
        el.style.display = show ? "" : "none";
        if (show) inShelf++;
      });
      const note = shelf.nextElementSibling as HTMLElement | null;
      if (note && "emptyNote" in note.dataset) note.hidden = inShelf > 0;
      count += inShelf;
    });
    setShown(count);
    window.dispatchEvent(new CustomEvent(FILTER_EVENT, { detail: key }));
  };

  return (
    <div className={styles.filter} role="group" aria-label="Filter the work by kind">
      <span className={styles.label} aria-hidden="true">
        Show
      </span>
      <button type="button" className={styles.chip} aria-pressed={on === null} onClick={(e) => pick(null, e.currentTarget)}>
        All <b>{total}</b>
      </button>
      {groups.map((g) => (
        <button key={g.key} type="button" className={styles.chip} aria-pressed={on === g.key} onClick={(e) => pick(g.key, e.currentTarget)}>
          {g.label} <b>{g.count}</b>
        </button>
      ))}
      <span className={styles.status} aria-live="polite">
        {on === null ? "" : `${shown} of ${total} shown`}
      </span>
    </div>
  );
}
