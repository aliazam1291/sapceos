import type { Metadata } from "next";
import Link from "next/link";
import MagneticButton from "@/components/MagneticButton";
import Counter from "@/components/Counter";
import LoopSequence from "@/components/LoopSequence";
import MissionFlight from "@/components/MissionFlight";
import Operator from "@/components/Operator";
import Ticker from "@/components/Ticker";
import Hangar from "@/components/Hangar";
import DroneBay from "@/components/DroneBay";
import Impact from "@/components/Impact";
import Singularity from "@/components/Singularity";
import Visitor from "@/components/Visitor";
import Landing from "@/components/Landing";
import Telemetry from "@/components/space/Telemetry";
import TextReveal from "@/components/TextReveal";
import { ui } from "@/components/ui";
import { profile } from "@/content/profile";
import { featuredMissions, missions } from "@/content/missions";
import { fieldNotes } from "@/content/field-notes";
import { results } from "@/content/results";
import styles from "./home.module.scss";
import { allKeywords } from "@/lib/keywords";

export const metadata: Metadata = {
  title: { absolute: `${profile.name} — ${profile.title} · Product Manager Portfolio` },
  description:
    "Ali Azam Kazmi — product engineer and UX strategist in New Delhi. Enterprise fleet and telematics platforms serving 200,000+ users, six product case studies, and the PRDs behind them. Open to product management roles.",
  keywords: allKeywords,
  alternates: { canonical: "/" },
};

/*
 * Section order is set by how a recruiter actually reads this page, not by how
 * the argument would flow in an essay.
 *
 * The method sequence used to sit between the proof numbers and the work. It is
 * pinned for four beats, which is five viewport-heights of scrolling — so
 * anyone scanning the page hit five screens of abstract product philosophy
 * before seeing a single thing that had been built. Someone giving the site
 * forty seconds left before the evidence.
 *
 * Now: claim (hero) -> proof (numbers) -> the work -> only then how the work
 * runs -> contact. The method section still earns its place; it just answers
 * "why should I believe this" after there is something to believe, rather than
 * asking for patience up front.
 */
export default function Home() {
  return (
    <>
      {/* The landing screen and the selected work are one thing: the galaxy
          pins, and scrolling flies you from system to system. */}
      <MissionFlight missions={featuredMissions} />

      {/* Everything the flight did not visit, each on its own projector. */}
      <Hangar missions={missions.filter((m) => !m.featured)} />

      {/* The results, as masses around a black hole. This is the page's
          showreel moment: it arrives framed and opens to full bleed. The
          numbers are the ledger — there is no second copy of them below. */}
      <Singularity
        label="03 / Results field"
        title="Every result has mass."
        lede="Roadmaps, teams, arguments — all of it curves toward the number that matters."
        masses={results
          .filter((r) => r.kind === "scale")
          .slice(0, 5)
          .map((r) => ({
            label: r.label,
            value: r.value,
            weight: Math.log10(r.magnitude) / Math.log10(600000),
          }))}
      />

      {/* The operator: one sentence, set huge, with the ship flying beside it.
          The identity card, ledger and operating loop moved to /about — the
          home page is the flight, not the file. */}
      <section id="operator" data-section="Operator" className={styles.statementBlock}>
        <p className={ui.labelRule}>04 / Operator</p>
        <TextReveal as="h2" className={styles.statementTitle}>
          I learn whatever I need to build the thing I think should exist.
        </TextReveal>
        <p className={styles.statementDim}>
          {profile.currentRole} · {profile.currentOrg}. Frontend one week, a PRD the next — usually on the same product.
        </p>
        <div className={styles.statementLinks}>
          <Link href="/about" className={styles.statementLink}>
            About the operator &rarr;
          </Link>
          <Link href="/mission-history" className={styles.statementLink}>
            Mission history &rarr;
          </Link>
        </div>
      </section>

      {/* The case studies, carried in. */}
      <DroneBay notes={fieldNotes.slice(0, 3)} />

      {/* The end of the journey: the ship lands, and its parts introduce the
          operator. The door out is on the pad. */}
      <Landing>
        <div className={ui.buttonRow}>
          <Visitor>
            <MagneticButton href="/contact" primary>
              Open a channel
            </MagneticButton>
          </Visitor>
          <MagneticButton href="/mission-history">Mission history</MagneticButton>
        </div>
      </Landing>
    </>
  );
}
