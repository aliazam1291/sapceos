import Drone from "@/components/Drone";
import ArrivalGate from "@/components/ArrivalGate";
import Link from "next/link";
import type { FieldNote } from "@/content/types";
import { DRAFT } from "@/content/types";
import styles from "./NoteFlight.module.scss";

/**
 * The field notes as a flight, not a grid.
 *
 * Six cards in a four-column grid left two orphans and a lot of dead space
 * where short titles sat under tall ones. This is one note per row, full
 * width, alternating sides, and driven by the scroll itself: each dossier
 * slides in as it enters the viewport and slides out as it leaves, its cover
 * drifting at a different rate to the text. All of it is CSS scroll-driven
 * animation (`animation-timeline: view()`), so it costs no JS and degrades to
 * a plain stack where unsupported.
 */
export default function NoteFlight({ notes }: { notes: FieldNote[] }) {
  return (
    <div className={styles.flight}>
      <aside className={styles.rail} aria-hidden="true">
        <span className={styles.railLabel}>Field notes</span>
        <span className={styles.railCount}>{String(notes.length).padStart(2, "0")}</span>
        <span className={styles.railNote}>Independent · not client work</span>
        <span className={styles.railLine} />
      </aside>

      <ol className={styles.rows}>
        {notes.map((note, i) => {
          const draft = note.body.every((p) => p.startsWith(DRAFT));
          return (
            <li key={note.slug} className={`${styles.row} flies`} data-flight={i % 2 === 0 ? "left" : "right"} data-side={i % 2 === 0 ? "left" : "right"}>
              {/* The drone descends onto this row when the reader reaches it. */}
              <ArrivalGate host="parent" threshold={0.45} />
              {/* The case study, carried in: a drone with the cover slung
                  beneath it. The link is the whole cover, as before. */}
              <Link href={`/field-notes/${note.slug}`} className={styles.cover} tabIndex={-1} aria-hidden="true">
                <Drone src={note.cover} seed={note.slug} tag={`FN-${String(i + 1).padStart(2, "0")}`} />
              </Link>

              <div className={styles.body}>
                <div className={styles.meta}>
                  <span className={styles.kind}>{note.kind.replace(/-/g, " ")}</span>
                  {draft ? <span className={styles.draft}>Draft · write-up pending</span> : null}
                </div>
                <h2 className={styles.title}>
                  <Link href={`/field-notes/${note.slug}`} className={styles.titleLink}>
                    {note.title}
                  </Link>
                </h2>
                <p className={styles.premise}>{note.premise}</p>
                <Link href={`/field-notes/${note.slug}`} className={styles.read}>
                  Read the note <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
