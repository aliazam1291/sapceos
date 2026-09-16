import type { Metadata } from "next";
import MissionFilter from "@/components/MissionFilter";
import Hologram from "@/components/Hologram";
import { NextStep, PageHeader, Section, SectionHead } from "@/components/ui";
import { missions } from "@/content/missions";
import { domainKeywords, identityKeywords, keywordsFor, roleKeywords, skillKeywords } from "@/lib/keywords";

export const metadata: Metadata = {
  title: "Missions — Product & Platform Projects",
  description:
    "Ten enterprise fleet, telematics and platform products by Ali Azam Kazmi — Vahan Shakti (200,000+ users), Intouch, Locate, Control Tower, FASTag — each with the problem, the decisions and what shipped.",
  keywords: keywordsFor(identityKeywords, roleKeywords, domainKeywords, skillKeywords),
  alternates: { canonical: "/missions" },
};

export default function MissionsPage() {
  return (
    <>
      <PageHeader
        label="Missions"
        title="Every one started as somebody's bad afternoon"
        lede="Enterprise fleet and telematics platforms, mostly. The interesting part is rarely the technology — it is deciding what the system should insist on."
        figure={
          // The hangar's first projector: the featured interface, projected.
          <Hologram src={missions.find((m) => m.featured && m.cover)?.cover} seed="hangar" tag="HANGAR" />
        }
      />

      <Section>
        <SectionHead label={`Index · ${missions.length}`} title="Filter the log" />
        <MissionFilter missions={missions} />
      </Section>
    <NextStep
      href="/mission-history"
      label="Next · Mission history"
      title="The log, in order"
      premise="Roles, dates, and what each one actually involved. The resume, without the resume formatting."
    />
  </>
  );
}
