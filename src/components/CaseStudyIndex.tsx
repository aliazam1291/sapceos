import Link from "next/link";
import type { Mission } from "@/content/types";
import { headlineOf, proofLabel } from "@/lib/success";
import styles from "./CaseStudyIndex.module.scss";

/*
 * The product case studies, at the top of /field-notes (2026-11-19).
 *
 * Ali: "case studies not seen on my website". The nav says "Case Studies"
 * and the page it opened held only teardowns of other companies' products —
 * his own products sat under Projects. This is the index of the ones that
 * are his: products he owns first, then client builds. A text index (hairline
 * rows), because these are reports, not covers: the company products show no
 * UI in public (see PROFILE.md and the Behance rule).
 */
export default function CaseStudyIndex({ missions }: { missions: Mission[] }) {
  return (
    <ol className={styles.list}>
      {missions.map((m, i) => {
        const lead = headlineOf(m);
        return (
          <li key={m.slug} className={`${styles.row} flies`} style={{ ["--lag" as string]: `${(i % 3) * 5}%` }}>
            <span className={styles.index} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className={styles.body}>
              <p className={styles.meta}>
                <span className={styles.kind}>{m.group === "owned" ? "Product I own" : "Client build"}</span>
                <span>{["MapMyIndia", m.org.replace(/^MapMyIndia \[Gtropy\]\s*·?\s*/, "")].filter(Boolean).join(" · ")}</span>
              </p>
              <h3 className={styles.title}>
                <Link href={`/missions/${m.slug}`}>{m.title}</Link>
              </h3>
              <p className={styles.premise}>{m.premise}</p>
            </div>
            <div className={styles.proof}>
              {lead ? (
                <>
                  <strong>{lead.value}</strong>
                  <span>{lead.label}</span>
                </>
              ) : (
                <span className={styles.pending}>{proofLabel(m)}</span>
              )}
              <Link href={`/missions/${m.slug}`} className={styles.read}>
                Read the case study <span aria-hidden="true">→</span>
              </Link>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
