"use client";

import type { ReactNode } from "react";
import styles from "./ui.module.scss";

/**
 * The label/content row that eight text-only routes are built from.
 *
 * Split out of `ui.tsx` into its own client module rather than marking that
 * whole file `"use client"`. `ui.tsx` also exports `Section`, `TagRow`,
 * `NextStep` and `Body`, none of which need a client boundary, and a
 * directive at the top of that file would have pulled all of them across it
 * for the sake of one pointer handler.
 *
 * `children` stays server-rendered: a client component receiving server
 * children as props does not drag them onto the client, so the actual page
 * content in every row is unaffected.
 *
 * WHY THIS EXISTS AT ALL
 *
 * /about, /contact, /mission-history, /field-notes/[slug] and the rest had no
 * pointer-responsive element anywhere on them — a one-shot opacity fade on
 * scroll was the entire interaction budget for over half the site. This is
 * the cheapest place to fix that, because it is the atom all of those pages
 * are assembled from: one component, eight routes.
 *
 * The technique is lifted from `MissionRow.tsx`, which already does this for
 * the mission list — cursor position written to `--mx`/`--my` as custom
 * properties, and CSS does the rest. Nothing re-renders: the handler sets
 * properties on the element directly rather than going through React state,
 * which is what keeps a pointer-frequency event off the render path.
 */
export default function Row({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div className={styles.row} onPointerMove={onMove} data-reveal>
      <div className={styles.rowLabel}>{label}</div>
      {children}
    </div>
  );
}
