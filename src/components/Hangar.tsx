import Link from "next/link";
import Hologram from "./Hologram";
import RobotGuide from "./RobotGuide";
import { Section, SectionHead, Status } from "./ui";
import type { Mission } from "@/content/types";
import styles from "./Hangar.module.scss";

/*
 * The hangar: every project the flight did not visit, on its own projector.
 *
 * The featured five are places the hero flies you to. The rest used to be
 * berths on a radar — an instrument, and one that showed the work as blips.
 * Here each is projected, the same way it is on the missions index, so the
 * vocabulary holds: a project is a hologram, wherever it appears.
 */
export default function Hangar({ missions }: { missions: Mission[] }) {
  return (
    <Section id="hangar" data-section="Hangar">
      <SectionHead label="03 / Hangar" title="Also shipped. Less photogenic, equally real." />
      <RobotGuide
        idle="Hangar chief. Five projectors online. Hover one and I'll read its tag — it's most of what I do."
        lines={Object.fromEntries(
          missions.map((m, i) => {
            const num = m.signals.find((sig) => /\d/.test(sig.value));
            const tag = `H-${String(i + 1).padStart(2, "0")} · ${m.title} · ${m.org} · ${m.status === "active" ? "active" : "shipped"}`;
            return [m.slug, num ? `${tag} · ${num.value} ${num.label.toLowerCase()}` : tag];
          }),
        )}
      />
      <ol className={styles.bays}>
        {missions.map((m, i) => {
          const numeric = m.signals.find((sig) => /\d/.test(sig.value));
          return (
          <li key={m.slug} className={`${styles.bay} objectRow`} data-bay={m.slug}>
            <article className={styles.cell}>
              <Hologram src={m.cover} seed={m.slug} tag={`H-${String(i + 1).padStart(2, "0")}`} alt={`${m.title} — interface`} className={styles.holo} />
              <div className={styles.meta}>
                <div className={styles.titleLine}>
                  <h3 className={styles.title}>
                    <Link href={`/missions/${m.slug}`} className={styles.link}>
                      {m.title}
                    </Link>
                  </h3>
                  <Status idle={m.status !== "active"}>{m.status === "active" ? "Active" : "Shipped"}</Status>
                </div>
                <p className={styles.premise}>{m.premise}</p>
                {/* A number if the mission has one; a label like "Full stack" is
                    not a signal, it is a caption, so the org stands in. */}
                {numeric ? (
                  <p className={styles.signal}>
                    <span className={styles.signalValue}>{numeric.value}</span>
                    <span className={styles.signalLabel}>{numeric.label}</span>
                  </p>
                ) : (
                  <p className={styles.signal}>
                    <span className={styles.signalLabel}>{m.org}</span>
                  </p>
                )}
              </div>
            </article>
          </li>
          );
        })}
      </ol>
      <p className={styles.more}>
        <Link href="/missions">Every mission, with the brief &rarr;</Link>
      </p>
    </Section>
  );
}
