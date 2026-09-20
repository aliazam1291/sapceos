import Link from "next/link";
import Drone from "./Drone";
import Comms from "./Comms";
import ArrivalGate from "./ArrivalGate";
import { Section, SectionHead } from "./ui";
import type { FieldNote } from "@/content/types";
import { DRAFT } from "@/content/types";
import styles from "./DroneBay.module.scss";

/*
 * The drone bay: case studies, carried in.
 *
 * A product portfolio with no case studies on its front page is a
 * portfolio of outputs. These are the teardowns — products Ali does not
 * work on, read closely enough to disagree with — and they are what a
 * hiring manager for a product role actually reads for. Three of them
 * arrive here by drone; the rest are a link away.
 */
export default function DroneBay({ notes }: { notes: FieldNote[] }) {
  return (
    <Section id="notes" data-section="Field notes">
      <SectionHead label="09 / Field notes" title="Case studies, in flight" />
      <Comms at="notes" className={styles.comms} />
      <ArrivalGate />
      <ol className={styles.bay}>
        {notes.map((note, i) => {
          const draft = note.body.every((p) => p.startsWith(DRAFT));
          return (
            <li key={note.slug} className={`${styles.slot} objectRow`}>
              <article className={styles.cell}>
                {/* The title rides on the crate: the drone is carrying the
                    study, not a picture of it. */}
                <div className={styles.carry}>
                <Drone
                  src={note.cover}
                  seed={note.slug}
                  tag={`FN-${String(i + 1).padStart(2, "0")}`}
                  sub={`${note.kind.replace(/-/g, " ")}${draft ? " · draft" : ""}`}
                  label={note.title}
                />
                </div>
                <div className={styles.meta}>
                  <h3 className={styles.title}>
                    <Link href={`/field-notes/${note.slug}`} className={styles.link}>
                      <span className={styles.srOnly}>{note.title}</span>
                    </Link>
                  </h3>
                  <p className={styles.premise}>{note.premise}</p>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
      <p className={styles.more}>
        <Link href="/field-notes">All field notes &rarr;</Link>
      </p>
    </Section>
  );
}
