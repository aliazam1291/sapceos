import Link from "next/link";
import Comms from "./Comms";
import PageForm from "./space/PageForm";
import { Section, SectionHead } from "./ui";
import { hostedWriting, isLive, listedWriting } from "@/content/writing";
import styles from "./DispatchLeg.module.scss";

/*
 * Leg 10 — the dispatches (2026-09-23).
 *
 * Ali, looking at a week of analytics: five essays published, `/writing`
 * not in the top pages at all. Nineteen visits to the home page and no
 * route from it to any of them — the front door listed the missions, the
 * studio, the rules, the log and the case studies, and never mentioned
 * that the operator writes.
 *
 * Shape: the transmitter truss on the left (the same object `/writing`
 * opens on — an essay is a transmission, not a project, so it gets no
 * hologram), the three most recent pieces as hairline rows on the right.
 * Rows, because this is text-only content and panels are for text.
 */
export default function DispatchLeg() {
  const recent = [...listedWriting].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3);
  const here = hostedWriting.filter(isLive).length;

  return (
    <Section id="writing" data-section="Dispatches">
      <SectionHead
        label={`10 / Dispatches · ${listedWriting.length} on record`}
        title="What I think, written down"
        action={
          <Link href="/writing" className={styles.all}>
            Every transmission &rarr;
          </Link>
        }
      />
      <Comms at="writing" className={styles.comms} />

      <div className={styles.body}>
        <figure className={styles.form}>
          <PageForm form="truss" label="A slowly turning wireframe transmitter truss." size={220} className={styles.truss} />
          <figcaption className={styles.formCaption}>
            {here} written here · the rest on Medium and dumbmoney.in
          </figcaption>
        </figure>

        <ol className={styles.list}>
          {recent.map((p, i) => {
            const hosted = p.outlet === "Space OS";
            const Row = (
              <>
                <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.rowBody}>
                  <span className={styles.title}>{p.title}</span>
                  <span className={styles.line}>{p.line}</span>
                  <span className={styles.meta}>
                    {p.outlet}
                    <span className={styles.dot} aria-hidden="true">
                      ·
                    </span>
                    <time dateTime={p.date}>
                      {new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </time>
                  </span>
                </span>
                <span className={styles.go} aria-hidden="true">
                  {hosted ? "›" : "↗"}
                </span>
              </>
            );
            return (
              <li key={p.href} className={styles.row}>
                {hosted ? (
                  <Link href={p.href} className={styles.link}>
                    {Row}
                  </Link>
                ) : (
                  <a href={p.href} target="_blank" rel="noreferrer noopener" className={styles.link}>
                    {Row}
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}
