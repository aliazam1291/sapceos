import Link from "next/link";
import type { ReactNode } from "react";
import { DRAFT } from "@/content/types";
import TextReveal from "./TextReveal";
import Decode from "./Decode";
import styles from "./ui.module.scss";

export function Section({
  children,
  id,
  // Forwarded so a section can register itself with the right-edge rail
  // (see SectionGuide) without Section needing to know that rail exists.
  "data-section": dataSection,
}: {
  children: ReactNode;
  id?: string;
  "data-section"?: string;
}) {
  return (
    <section className={styles.section} id={id} data-section={dataSection}>
      {children}
    </section>
  );
}

export function SectionHead({
  label,
  title,
  action,
}: {
  label: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.sectionHead} data-reveal>
      <div>
        <p className={styles.labelRule}>
          <Decode>{label}</Decode>
        </p>
        <TextReveal as="h2" className={styles.sectionTitle}>
          {title}
        </TextReveal>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  label,
  title,
  lede,
  figure,
}: {
  label: string;
  title: string;
  lede?: string;
  /** The route's signature object — sits in the right column above the lede. */
  figure?: ReactNode;
}) {
  return (
    <div className={styles.pageHeader} data-figure={figure ? "" : undefined}>
      <p className={styles.labelRule}>
        <Decode>{label}</Decode>
      </p>
      {/* The page title is the one piece of type per route that earns a
          line-by-line reveal; everything below it uses the cheaper fade. */}
      <TextReveal as="h1" className={styles.pageTitle} start="top 92%">
        {title}
      </TextReveal>
      {/* No `data-reveal` on the lede. The page header is, by definition, the
          first thing on the route — it is never scrolled to, so a scroll reveal
          only held the opening sentence back until hydration. It was the LCP
          element on several routes because of it. */}
      {figure ? (
        <div className={styles.pageAside}>
          <div className={styles.pageFigure}>{figure}</div>
          {lede ? <p className={styles.lede}>{lede}</p> : null}
        </div>
      ) : lede ? (
        <p className={styles.lede}>{lede}</p>
      ) : null}
    </div>
  );
}

export function Status({ children, idle }: { children: ReactNode; idle?: boolean }) {
  return (
    <span className={`${styles.status} ${idle ? styles.statusIdle : ""}`}>
      <span className={styles.dot} aria-hidden="true" />
      {children}
    </span>
  );
}

export function DraftFlag({ note }: { note?: string }) {
  return (
    <span className={styles.draft}>
      ⚠ Needs input{note ? ` — ${note}` : ""}
    </span>
  );
}

/** Renders report/note copy, swapping the DRAFT sentinel for a visible flag. */
export function Body({ value }: { value: string | string[] }) {
  const parts = Array.isArray(value) ? value : [value];
  return (
    <div className={styles.rowBody}>
      {parts.map((part, i) =>
        part.startsWith(DRAFT) ? (
          <p key={i}>
            <DraftFlag note={part.slice(DRAFT.length).replace(/^\s*—\s*/, "")} />
          </p>
        ) : part.startsWith("## ") ? (
          // A long note needs structure; a "## " prefix is the one bit of
          // markup content is allowed, and it becomes a real subheading.
          <h3 key={i} className={styles.rowSubhead}>
            {part.slice(3)}
          </h3>
        ) : (
          <p key={i}>{part}</p>
        ),
      )}
    </div>
  );
}

/*
 * Re-exported from its own client module — see Row.tsx for why it is not
 * defined inline here. Callers keep importing `{ Row } from "@/components/ui"`,
 * so nothing at the eight call sites had to change.
 */
export { default as Row } from "./Row";

export function TagRow({ items }: { items: string[] }) {
  return (
    <ul className={styles.tagRow}>
      {items.map((item) => (
        <li key={item} className={styles.tag}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ButtonLink({
  href,
  children,
  primary,
  external,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
  external?: boolean;
}) {
  const className = `${styles.button} ${primary ? styles.buttonPrimary : ""}`;
  if (external) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    );
  }
  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

/**
 * The end-of-page handoff.
 *
 * This treatment already existed — a full-bleed panel with large type and a
 * glow that lifts on hover — but it was written inline on the mission report
 * page and used on exactly that one route. Every index page (missions, field
 * notes, lab, orbit, and the resume) simply ran out of content and stopped, so
 * a reader who finished the thing they came for was handed nothing to do next.
 * On the resume in particular, which is the highest-intent page on the site,
 * the last thing on screen was a certificate grid.
 *
 * Lifting it here makes the handoff a component every page can end with,
 * instead of a one-off.
 */
export function NextStep({
  href,
  label,
  title,
  premise,
}: {
  href: string;
  label: string;
  title: string;
  premise?: string;
}) {
  return (
    <Link href={href} className={styles.next}>
      <div className={styles.nextInner}>
        <span className={styles.labelRule}>{label}</span>
        <span className={styles.nextTitle}>{title}</span>
        {premise ? <span className={styles.nextPremise}>{premise}</span> : null}
      </div>
    </Link>
  );
}

export { styles as ui };
