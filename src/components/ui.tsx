import Link from "next/link";
import type { ReactNode } from "react";
import { DRAFT } from "@/content/types";
import TextReveal from "./TextReveal";
import Decode from "./Decode";
import Counter from "./Counter";
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
      {/* The page title rises at FIRST PAINT, in CSS (2026-09-19). It was a
          GSAP SplitText reveal: the server-rendered title painted, then GSAP
          arrived, hid it and raised it line by line — on a throttled phone
          that second paint landed 1-2 s later and was the route's LCP on
          every secondary page (Lighthouse: 5 s mobile). One masked rise from
          frame one keeps the entrance and costs nothing. Section titles are
          scrolled to, so TextReveal still suits them. */}
      <h1 className={styles.pageTitle}>
        <span className={styles.pageTitleInner}>{title}</span>
      </h1>
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
export function Body({
  value,
  // A note's copy sits straight under the page h1, so its "## " subheads
  // are h2 there; inside a report's rows they stay h3.
  subheadLevel: Sub = "h3",
}: {
  value: string | string[];
  subheadLevel?: "h2" | "h3";
}) {
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
          <Sub key={i} className={styles.rowSubhead}>
            {part.slice(3)}
          </Sub>
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

/**
 * The pager — where this entry sits in its sequence, and the two beside it.
 *
 * Reports and notes had a "next" door at the very end and nothing else: a
 * reader who opened the fourth mission could not tell there were ten, or
 * step back to the third without the index. One hairline strip under the
 * header: previous, the position as a bay number, next. Wraps at the ends
 * so the sequence is a loop, like the hangar it indexes.
 */
export function Pager({
  index,
  total,
  prev,
  next,
  unit = "Bay",
}: {
  index: number;
  total: number;
  prev: { href: string; title: string };
  next: { href: string; title: string };
  /** What one entry is called: "Bay" on the deck, "Note" in the drone bay. */
  unit?: string;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <nav className={styles.pager} aria-label={`${unit} sequence`}>
      <Link href={prev.href} className={styles.pagerLink} rel="prev">
        <span className={styles.pagerArrow} aria-hidden="true">
          ←
        </span>
        <span className={styles.pagerKicker}>Previous</span>
        <span className={styles.pagerTitle}>{prev.title}</span>
      </Link>
      <span className={styles.pagerPos} aria-label={`${unit} ${index + 1} of ${total}`}>
        <span className={styles.pagerUnit}>{unit}</span>
        <span className={styles.pagerNum}>
          {pad(index + 1)}
          <span className={styles.pagerOf}> / {pad(total)}</span>
        </span>
        <span className={styles.pagerTicks} aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <i key={i} data-on={i === index || undefined} />
          ))}
        </span>
      </span>
      <Link href={next.href} className={`${styles.pagerLink} ${styles.pagerNext}`} rel="next">
        <span className={styles.pagerKicker}>Next</span>
        <span className={styles.pagerTitle}>{next.title}</span>
        <span className={styles.pagerArrow} aria-hidden="true">
          →
        </span>
      </Link>
    </nav>
  );
}

/**
 * A readout — a strip of measured numbers, counted up on arrival.
 *
 * The index pages opened on a title and a filter and told the reader
 * nothing about the size of what they were looking at. This is the HUD
 * version of "ten missions, three active, two hundred thousand users":
 * hairline cells, mono labels, numbers big in the signal colour. Every
 * value comes from content transcribed from PROFILE.md; a cell with a
 * `note` says where the number is from.
 */
export function Readout({
  items,
  label,
}: {
  items: { value: number; label: string; prefix?: string; suffix?: string; note?: string }[];
  label?: string;
}) {
  return (
    <dl className={styles.readout} aria-label={label}>
      {items.map((it) => (
        <div key={it.label} className={styles.readoutCell}>
          <dd className={styles.readoutValue}>
            <Counter value={it.value} prefix={it.prefix} suffix={it.suffix} />
          </dd>
          <dt className={styles.readoutLabel}>
            {it.label}
            {it.note ? <span className={styles.readoutNote}> · {it.note}</span> : null}
          </dt>
        </div>
      ))}
    </dl>
  );
}

export { styles as ui };
