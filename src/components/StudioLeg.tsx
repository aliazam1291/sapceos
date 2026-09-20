import Link from "next/link";
import Hologram from "./Hologram";
import RobotGuide from "./RobotGuide";
import Comms from "./Comms";
import { Section, SectionHead, Status } from "./ui";
import { studio, studioKindLabel, studioPieces } from "@/content/studio";
import styles from "./StudioLeg.module.scss";

/** The four the home page projects; the rest are on /studio. */
const HOME_PIECES = ["lean-multiverse", "talent-connect", "tedx-srmist", "web3-nft-marketplace"];

/*
 * Leg 08 — the studio, on the home page.
 *
 * Smaak.ux was invisible from the front door. Four projectors here — the
 * client brand with the largest audience and three of the founder's own
 * pieces — each with the brief as PROFILE.md/Behance state it, and the
 * door to the full deck. Projects are holograms; a brand identity is a
 * project.
 */
export default function StudioLeg() {
  const pieces = HOME_PIECES.map((slug) => studioPieces.find((p) => p.slug === slug)!).filter(Boolean);
  return (
    <Section id="studio" data-section="Studio">
      <SectionHead
        label={`08 / Studio · ${studio.name} · since ${studio.since}`}
        title="The studio on the side"
        action={
          <Link href="/studio" className={styles.all}>
            The whole deck &rarr;
          </Link>
        }
      />
      <Comms at="studioLeg" className={styles.comms} />
      <RobotGuide
        name="K-7"
        idle={`Studio annex. Four of the ${studioPieces.length} pieces, ${studio.clients}+ clients behind them. Hover one.`}
        lines={Object.fromEntries(pieces.map((p, i) => [p.slug, `S-${String(i + 1).padStart(2, "0")} · ${p.title} · ${studioKindLabel[p.kind].toLowerCase()} · ${p.status}`]))}
      />
      <ol className={styles.bays}>
        {pieces.map((p, i) => (
          <li key={p.slug} className={`${styles.bay} objectRow`} data-bay={p.slug} style={{ "--lag": `${i * 8}%` } as React.CSSProperties}>
            <article className={styles.cell}>
              <Hologram src={p.cover ?? p.logo} seed={p.slug} tag={`S-${String(i + 1).padStart(2, "0")}`} fit={p.cover ? "cover" : "contain"} className={styles.holo} />
              <div className={styles.meta}>
                <div className={styles.titleLine}>
                  <h3 className={styles.title}>
                    <Link href="/studio" className={styles.link}>
                      {p.title}
                    </Link>
                  </h3>
                  <Status idle={p.status !== "client"}>{p.status === "client" ? "Client" : "Independent"}</Status>
                </div>
                <p className={styles.premise}>
                  {p.brief}
                  {p.note ? <span className={styles.note}> · {p.note}</span> : null}
                </p>
                <p className={styles.kind}>{studioKindLabel[p.kind]}</p>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </Section>
  );
}
