"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { missions } from "@/content/missions";
import type { MissionGroup } from "@/content/types";
import styles from "./ProjectsMenu.module.scss";

/*
 * Every project, one click from the dock (2026-11-19).
 *
 * Ali: "Mappls Intouch and Indane Yatra Mitra are not there in the navbar,
 * and many projects too." They were on the site (/missions, the Overview
 * panel), but the dock itself named no project, so a visitor scanning the
 * bar never saw them. This is a disclosure button in the dock that opens a
 * panel of every mission, grouped by what Ali's part was: products he owns,
 * builds for named clients, platforms he shipped on.
 *
 * A disclosure, not an ARIA menu: the items are links, Tab moves through
 * them, Escape and an outside click close it, and focus returns to the
 * button. Phones don't have the dock; the tab bar's Projects tab and the
 * overview panel carry the same list there.
 */
const GROUPS: { key: MissionGroup; label: string; note: string }[] = [
  { key: "owned", label: "Products I own", note: "Product owner" },
  { key: "client", label: "Client builds", note: "For named clients" },
  { key: "platform", label: "Platforms shipped", note: "Built and shipped" },
];

export default function ProjectsMenu({ className }: { className?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = pathname.startsWith("/missions");

  return (
    <div ref={wrap} className={styles.wrap}>
      <button
        ref={button}
        type="button"
        className={className}
        aria-expanded={open}
        aria-controls={id}
        data-active={active || undefined}
        onClick={() => setOpen((v) => !v)}
      >
        Projects
        <span className={styles.count} aria-hidden="true">
          {missions.length}
        </span>
        <span className={styles.caret} data-open={open || undefined} aria-hidden="true" />
      </button>

      <div id={id} className={styles.panel} hidden={!open}>
        <div className={styles.groups}>
          {GROUPS.map((g) => {
            const items = missions.filter((m) => (m.group ?? "platform") === g.key);
            if (!items.length) return null;
            return (
              <section key={g.key} className={styles.group} aria-label={g.label}>
                <p className={styles.groupLabel}>
                  {g.label} <span>· {items.length}</span>
                </p>
                <ul className={styles.list}>
                  {items.map((m) => (
                    <li key={m.slug}>
                      <Link
                        href={`/missions/${m.slug}`}
                        className={styles.item}
                        aria-current={pathname === `/missions/${m.slug}` ? "page" : undefined}
                        onClick={() => setOpen(false)}
                      >
                        <span className={styles.itemTitle}>{m.title}</span>
                        <span className={styles.itemOrg}>{orgLine(m.org)}</span>
                        <span className={styles.itemState} data-active={m.status === "active" || undefined}>
                          {m.status === "active" ? "Active" : "Shipped"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
        <Link href="/missions" className={styles.all} onClick={() => setOpen(false)}>
          All projects, with results <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

/** "MapMyIndia [Gtropy] · InTouch, for VinFast & SM Green" → "InTouch, for VinFast & SM Green". */
function orgLine(org: string) {
  const parts = org.split(" · ");
  return parts.length > 1 ? parts.slice(1).join(" · ") : org.replace(/\s*\[[^\]]*\]/, "");
}
