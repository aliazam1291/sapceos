import type { Metadata } from "next";
import MissionFilter from "@/components/MissionFilter";
import { NextStep, PageHeader, Section, SectionHead } from "@/components/ui";
import { missions } from "@/content/missions";

export const metadata: Metadata = {
  title: "Missions",
  description:
    "Fleet, telematics and platform products — what the problem was, and what shipped.",
  alternates: { canonical: "/missions" },
};

export default function MissionsPage() {
  return (
    <>
      <PageHeader
        label="Missions"
        title="Every one started as somebody's bad afternoon"
        lede="Enterprise fleet and telematics platforms, mostly. The interesting part is rarely the technology — it is deciding what the system should insist on."
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
