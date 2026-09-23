import Link from "next/link";
import { writingAbout } from "@/content/writing";
import styles from "./RelatedWriting.module.scss";

/*
 * "Also written about this" (2026-09-23).
 *
 * The essays declare what they relate to; until now nothing pointed the
 * other way, so a reader who arrived on a mission report — which is where
 * the traffic actually lands — had no route to the piece written about it.
 * Derived from `writingAbout`, so there is no second list to keep in sync,
 * and it renders nothing when no piece points here.
 */
export default function RelatedWriting({ href, label = "Also written about this" }: { href: string; label?: string }) {
  const pieces = writingAbout(href);
  if (pieces.length === 0) return null;

  return (
    <aside className={styles.related} aria-label="Related writing">
      <p className={styles.label}>{label}</p>
      <ul className={styles.list}>
        {pieces.map((p) => {
          const hosted = p.outlet === "Space OS";
          const inner = (
            <>
              <span className={styles.title}>{p.title}</span>
              <span className={styles.line}>{p.line}</span>
              <span className={styles.meta}>
                {p.outlet} · {new Date(p.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
              </span>
            </>
          );
          return (
            <li key={p.href}>
              {hosted ? (
                <Link href={p.href} className={styles.link}>
                  {inner}
                </Link>
              ) : (
                <a href={p.href} target="_blank" rel="noreferrer noopener" className={styles.link}>
                  {inner}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
