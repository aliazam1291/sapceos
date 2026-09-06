"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { missions } from "@/content/missions";
import { links, profile } from "@/content/profile";
import styles from "./NavOverview.module.scss";

export type Route = { href: string; label: string; plain: string };

/**
 * The system manifest — a centred panel over a dimmed page.
 *
 * A portfolio with eight top-level routes plus ten missions cannot be navigated
 * from a horizontal strip; the strip just truncates and the work stays hidden a
 * click deep. Opening the whole map at once means a visitor can see everything
 * that exists in one read and jump straight to it.
 *
 * Two columns, both numbered: pages on the left, the actual work on the right,
 * and a bar across the foot carrying where you are and the way out.
 *
 * It used to be a full-bleed takeover, which put it in a fight with the command
 * dock over which one was on top — a fight it won, covering the only control
 * that closed it. A panel that carries its OWN close button does not need to
 * win that fight: the page dims behind it, the dock dims with everything else,
 * and the way out is inside the thing you opened.
 */
export default function NavOverview({
  routes,
  isActive,
  onClose,
  here,
}: {
  routes: Route[];
  isActive: (href: string) => boolean;
  onClose: () => void;
  /** Where the reader currently is, echoed in the panel's foot. */
  here: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreTo.current = document.activeElement as HTMLElement | null;

    // Move focus into the panel so the first Tab lands inside it, not on the
    // page behind. Without this a keyboard user tabs through hidden content.
    const first = panel.current?.querySelector<HTMLElement>("a, button");
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      // Focus trap: the overlay covers the page, so tabbing out of it would
      // silently move focus to links the user cannot see.
      const focusable = panel.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusable || focusable.length === 0) return;

      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      restoreTo.current?.focus?.();
    };
  }, [onClose]);

  const active = missions.filter((m) => m.status === "active");
  const shipped = missions.filter((m) => m.status !== "active");

  return (
    <div
      className={styles.backdrop}
      id="nav-overview"
      // Clicking the dimmed page behind the panel is the other way out, and the
      // one people reach for first.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="System overview"
        ref={panel}
      >
      <div className={styles.grid}>
        {/* ── Left: identity + pages ───────────────────────────────────── */}
        <div className={styles.pages}>
          <div className={styles.identity}>
            <p className={styles.kicker}>{profile.currentOrg} · {profile.location}</p>
            <p className={styles.wordmark}>
              Space
              <br />
              OS
            </p>
          </div>

          <ul className={styles.pageList}>
            {routes.map((r, i) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  className={styles.pageLink}
                  data-current={isActive(r.href) || undefined}
                  aria-current={isActive(r.href) ? "page" : undefined}
                  onClick={onClose}
                >
                  <span className={styles.pageIndex}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.pageLabel}>{r.label}</span>
                  <span className={styles.pageMeta}>
                    {isActive(r.href) ? "Current" : r.plain}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <ul className={styles.social}>
            {links.slice(0, 4).map((l) => (
              <li key={l.label}>
                <a href={l.href} target="_blank" rel="noreferrer noopener">
                  {l.label}
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right: the actual work ───────────────────────────────────── */}
        <div className={styles.manifest}>
          <p className={styles.manifestHead}>
            Inside this system
            <span>Jump straight to a mission, or open a channel.</span>
          </p>

          <p className={styles.groupLabel}>
            Active <span>{active.length}</span>
          </p>
          <ul className={styles.missionGrid}>
            {active.map((m, i) => (
              <li key={m.slug}>
                <Link href={`/missions/${m.slug}`} className={styles.mission} onClick={onClose}>
                  <span className={styles.missionIndex}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.missionTitle}>{m.title}</span>
                  <span className={styles.missionMeta}>{m.org}</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className={styles.groupLabel}>
            Shipped <span>{shipped.length}</span>
          </p>
          <ul className={styles.missionGrid}>
            {shipped.map((m, i) => (
              <li key={m.slug}>
                <Link href={`/missions/${m.slug}`} className={styles.mission} onClick={onClose}>
                  <span className={styles.missionIndex}>
                    {String(active.length + i + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.missionTitle}>{m.title}</span>
                  <span className={styles.missionMeta}>{m.org}</span>
                </Link>
              </li>
            ))}
          </ul>

          <ul className={styles.actions}>
            <li>
              <Link href="/contact" className={styles.action} onClick={onClose}>
                <span className={styles.actionIndex}>01</span>
                <span>Open a channel</span>
                <span className={styles.actionMeta}>Email → reply</span>
              </Link>
            </li>
            <li>
              <a
                className={styles.action}
                href={profile.calendly}
                target="_blank"
                rel="noreferrer noopener"
              >
                <span className={styles.actionIndex}>02</span>
                <span>Book a call</span>
                <span className={styles.actionMeta}>Calendly → confirmation</span>
              </a>
            </li>
            <li>
              <a
                className={styles.action}
                href="/Ali_Azam_Kazmi_.pdf"
                target="_blank"
                rel="noreferrer noopener"
              >
                <span className={styles.actionIndex}>03</span>
                <span>Resume</span>
                <span className={styles.actionMeta}>PDF → new tab</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Foot: identity, where you are, and the way out — all inside the panel
          so none of them depend on the chrome behind it. */}
      <div className={styles.foot}>
        <span className={styles.footMark} aria-hidden="true">
          AAK
        </span>
        <span className={styles.footHere}>{here}</span>
        <button type="button" className={styles.footClose} onClick={onClose}>
          <span aria-hidden="true">&#10005;</span>
          <span className={styles.footCloseLabel}>Close</span>
        </button>
      </div>
      </div>
    </div>
  );
}
