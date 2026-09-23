import type { Metadata } from "next";
import MagneticButton from "@/components/MagneticButton";
import MissionFlight from "@/components/MissionFlight";
import OperatorLeg from "@/components/OperatorLeg";
import Hangar from "@/components/Hangar";
import Impact from "@/components/Impact";
import LogLeg from "@/components/LogLeg";
import StudioLeg from "@/components/StudioLeg";
import DispatchLeg from "@/components/DispatchLeg";
import DroneBay from "@/components/DroneBay";
import RulesLeg from "@/components/RulesLeg";
import Singularity from "@/components/Singularity";
import Visitor from "@/components/Visitor";
import Landing from "@/components/Landing";
import { Section, SectionHead, ui } from "@/components/ui";
import { profile } from "@/content/profile";
import { featuredMissions, missions } from "@/content/missions";
import { fieldNotes } from "@/content/field-notes";
import { results } from "@/content/results";
import { allKeywords } from "@/lib/keywords";

export const metadata: Metadata = {
  // Title and description match the H1 (Product Engineer & UX Strategist)
  // and lead with what was built — the external SEO audit's one fair point
  // (2026-09-20). This page's metadata overrides the layout's, so it is set
  // here too.
  // The title carries what a recruiter types (product manager portfolio,
  // New Delhi); the H1 carries who he is; the description proves the first
  // with the second (2026-09-21 meta strategy).
  title: { absolute: `${profile.name} — Product Manager Portfolio · New Delhi` },
  description:
    "Product engineer, UX strategist and founder (DumbMoney) moving into product management: PRDs, roadmaps and shipped fleet platforms for 200,000+ users.",
  keywords: allKeywords,
  alternates: { canonical: "/" },
};

/*
 * One mission, told in the order a PM would brief it — ten legs now
 * (2026-09-19, Ali: "home page content is too less — sections"). The
 * six-leg cut of 2026-09-18 left the front door with no person, no
 * ledger, no résumé and no studio; those were three pages away. Each new
 * leg is a place with an object, not a room of text, and every line on it
 * is PROFILE.md's.
 *
 *   00 Board      the launch screen and the opener — who, what for, one number
 *   01 Flight     the five featured worlds; the ship flies lead
 *   02 Operator   who is flying — the matrix, the core story, the loop, the facts
 *   03 Deck       the hangar — everything else that shipped, as holograms
 *   04 Debrief    the measured numbers orbit the black hole
 *   05 Impact     the results ledger and the ownership matrix — what moved, what I owned
 *   06 Rules      how the operator decides — three beacons, the rest a link
 *   07 Log        where the time went — four roles on a route
 *   08 Studio     Smaak.ux — four projectors, the door to the deck
 *   09 Notes      the case studies, carried in by drone
 *   10 Touchdown  the ship lands; its parts introduce the operator; the door
 *
 * The rail on the right is the route — leg N of 11. Re-plot HOME_PLAN
 * (Companion.tsx) from tools/sections-uat.mjs when a leg moves.
 */
export default function Home() {
  return (
    <>
      {/* 01 — The landing screen and the selected work are one thing: the
          galaxy pins, and scrolling flies you from system to system. */}
      <MissionFlight missions={featuredMissions} />

      {/* 02 — Who is flying: the person, before the deck. */}
      <OperatorLeg />

      {/* 03 — Everything the flight did not visit, each on its own projector. */}
      <Hangar missions={missions.filter((m) => !m.featured)} />

      {/* 04 — The debrief. The measured numbers orbit the black hole as
          bodies; the ship passes through them. This is the page's showreel
          moment: it arrives framed and opens to full bleed. */}
      <Singularity
        label="04 / Debrief"
        title="Every result has mass."
        lede="What was measured, in orbit. Everything else curves toward it."
        masses={results
          .filter((r) => r.kind === "scale")
          .slice(0, 5)
          .map((r) => ({
            label: r.label,
            value: r.value,
            weight: Math.log10(r.magnitude) / Math.log10(600000),
          }))}
      />

      {/* 05 — What moved, and what I owned: every verified number as a
          ledger, and the ownership matrix derived from each mission's role. */}
      <Section id="impact" data-section="Impact">
        <SectionHead label="05 / Impact" title="What moved, and what I owned" />
        <Impact />
      </Section>

      {/* 06 — How the operator decides: three of the seven flight rules,
          each with its evidence. The ship's hero beat is here, in the air
          to the right of the beacons. */}
      <RulesLeg />

      {/* 07 — Where the time went: the résumé as a route. */}
      <LogLeg />

      {/* 08 — The studio on the side: four projectors from Smaak.ux. */}
      <StudioLeg />

      {/* 09 — The case studies, carried in. */}
      <DroneBay notes={fieldNotes.slice(0, 3)} />

      {/* 10 — The dispatches. Added 2026-09-23: a week of analytics showed
          /writing absent from the top pages, because the front door never
          mentioned it existed. */}
      <DispatchLeg />

      {/* 11 — The end of the journey: the ship lands, and its parts
          introduce the operator. The door out is on the pad. */}
      <Landing label="11 / Touchdown" statement="I learn whatever I need to build the thing I think should exist.">
        <div className={ui.buttonRow}>
          <Visitor>
            <MagneticButton href="/contact" primary>
              Open a channel
            </MagneticButton>
          </Visitor>
          <MagneticButton href="/Ali_Azam_Kazmi_.pdf" external>
            Résumé (PDF)
          </MagneticButton>
          <MagneticButton href="/mission-history">Mission history</MagneticButton>
        </div>
      </Landing>
    </>
  );
}
