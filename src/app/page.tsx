import type { Metadata } from "next";
import MagneticButton from "@/components/MagneticButton";
import MissionFlight from "@/components/MissionFlight";
import PortfolioHero from "@/components/PortfolioHero";
import Toolkit from "@/components/Toolkit";
import Building from "@/components/Building";
import { dossier } from "@/content/portfolio";
import LogLeg from "@/components/LogLeg";
import StudioLeg from "@/components/StudioLeg";
import DroneBay from "@/components/DroneBay";
import Singularity from "@/components/Singularity";
import Visitor from "@/components/Visitor";
import Landing from "@/components/Landing";
import { ui } from "@/components/ui";
import { profile } from "@/content/profile";
import { featuredMissions } from "@/content/missions";
import { fieldNotes } from "@/content/field-notes";
import { results } from "@/content/results";
import { allKeywords } from "@/lib/keywords";

export const metadata: Metadata = {
  // Title and description match the H1 (profile.title, one line everywhere)
  // and lead with what was built — the external SEO audit's one fair point
  // (2026-09-20). This page's metadata overrides the layout's, so it is set
  // here too.
  // The title carries what a recruiter types (product manager portfolio,
  // New Delhi); the H1 carries who he is; the description proves the first
  // with the second (2026-09-21 meta strategy).
  title: { absolute: `${profile.name} — Product Engineer moving into PM · New Delhi` },
  description:
    "Product engineer for fleet and geospatial products, moving into product management: PRDs, roadmaps and shipped platforms for 200,000+ users.",
  keywords: allKeywords,
  alternates: { canonical: "/" },
};

/*
 * The front door, as a flow (2026-10-31). Ali: "think about the flow of the
 * entire website, make it easy for users — it's too complex", then "think
 * like a pro for user flow".
 *
 * Who comes, and what they came to do: a recruiter (30–90 s: who, what
 * role, the résumé, how to reach him), a hiring manager (minutes: the work,
 * whether it worked, the experience, how he thinks), a client of the
 * studio (the design). So the page answers their questions in the order
 * they ask them — one section per question, a summary here and the depth
 * one link away — and every section ends on its door:
 *
 *   01 Intro        who, what role, the counts, the résumé   PortfolioHero
 *                   + now: the toolkit (and the ace), what he is building
 *   02 Work         five projects, one world at a time       → all projects
 *   03 Results      the measured numbers                     → the full ledger
 *   04 Experience   the roles on a route                     → the full history
 *   05 Design       the work in the dome                     → the studio
 *   06 Case studies three, carried in by drone               → essays, decisions
 *   07 Contact      the ship lands; the CTA is on the pad
 *
 * Measured before (1440×900): 24 screens, 14 sections, contact at screen
 * 22, the flight alone 7 screens. Operator, Hangar, the Impact ledger,
 * Flight rules and Dispatches left this page for the pages they summarise
 * (/about, /missions, /about#impact, /decisions, /writing) — moved, not
 * deleted. Labels in the rail and the section heads are plain words.
 * Re-plot HOME_PLAN (Companion.tsx) from tools/sections-uat.mjs when a
 * section moves.
 */
export default function Home() {
  return (
    <>
      {/* 01 — Intro: whose portfolio this is, before anything flies. */}
      <PortfolioHero data={dossier()} />

      {/* Still the intro — what he builds with, and what he is building now. */}
      <Toolkit />
      <Building />

      {/* 02 — Work: the galaxy pins, and scrolling flies you from world to
          world; the opener offers all ten projects instead. */}
      <MissionFlight missions={featuredMissions} />

      {/* 03 — Results: the measured numbers orbit the black hole. The
          page's one showreel moment: it arrives framed and opens to full
          bleed. The full ledger is on /about. */}
      <Singularity
        label="03 / Results"
        title="Every result has mass."
        lede="What was measured, in orbit. Everything else curves toward it."
        more={{ href: "/about#impact", label: "The full ledger" }}
        masses={results
          .filter((r) => r.kind === "scale")
          .slice(0, 5)
          .map((r) => ({
            label: r.label,
            value: r.value,
            weight: Math.log10(r.magnitude) / Math.log10(600000),
          }))}
      />

      {/* 04 — Experience: the résumé as a route. */}
      <LogLeg />

      {/* 05 — Design: the work, hung in the dome. */}
      <StudioLeg />

      {/* 06 — Case studies: how he thinks, carried in; the essays and the
          decisions one link away. */}
      <DroneBay notes={fieldNotes.slice(0, 3)} />

      {/* 07 — Contact: the ship lands, and the door out is on the pad. */}
      <Landing label="07 / Contact" section="Contact" statement="I learn whatever I need to build the thing I think should exist.">
        <div className={ui.buttonRow}>
          <Visitor>
            <MagneticButton href="/contact" primary>
              Get in touch
            </MagneticButton>
          </Visitor>
          <MagneticButton href="/Ali_Azam_Kazmi_.pdf" external>
            Résumé (PDF)
          </MagneticButton>
          <MagneticButton href="/mission-history">Experience</MagneticButton>
        </div>
      </Landing>
    </>
  );
}
