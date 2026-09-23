import type { Metadata } from "next";
import MissionFilter from "@/components/MissionFilter";
import { plainName } from "@/content/pages";
import RelatedWriting from "@/components/RelatedWriting";
import RobotGuide from "@/components/RobotGuide";
import Hologram from "@/components/Hologram";
import Link from "next/link";
import { NextStep, PageHeader, Readout, Section, SectionHead, ui } from "@/components/ui";
import { missions } from "@/content/missions";
import { results } from "@/content/results";
import { domainKeywords, identityKeywords, keywordsFor, roleKeywords, skillKeywords } from "@/lib/keywords";
import Comms from "@/components/Comms";

export const metadata: Metadata = {
  title: { absolute: "Missions — Product Case Studies · Ali Azam Kazmi" },
  description:
    "Ten product case studies — Vahan Shakti (200,000+ users), Intouch, Locate, FASTag: the problem, the PRD, the prioritisation calls, what shipped, what it measured.",
  keywords: keywordsFor(identityKeywords, roleKeywords, domainKeywords, skillKeywords),
  alternates: { canonical: "/missions" },
};

export default function MissionsPage() {
  return (
    <>
      <PageHeader
        label="Missions"
        plain={plainName["/missions"]}
        title="Every one started as somebody's bad afternoon"
        lede="Enterprise fleet and telematics platforms, mostly. The interesting part is rarely the technology — it is deciding what the system should insist on."
        figure={
          // The hangar's first projector: the featured interface, projected.
          <Hologram src={missions.find((m) => m.featured && m.cover)?.cover} seed="hangar" tag="HANGAR" alt={`${missions.find((m) => m.featured && m.cover)?.title ?? "Mission"} — interface`} priority />
        }
      />
      <div className={ui.pageComms}>
        <Comms at="missions" />
      </div>

      <Section>
        {/* Deck status: how much is on the deck, and the largest measured
            deployment on it. Every number is content, none is inferred. */}
        <Readout
          label="Deck status"
          items={[
            { value: missions.length, label: "Bays on the deck" },
            { value: missions.filter((m) => m.status === "active").length, label: "Active" },
            { value: missions.filter((m) => m.status !== "active").length, label: "Shipped" },
            ...(() => {
              const largest = results.find((r) => r.source === "Vahan Shakti");
              return largest ? [{ value: largest.magnitude, suffix: "+", label: "Users on the largest", note: largest.source }] : [];
            })(),
          ]}
        />
        <SectionHead
          label={`Index · ${missions.length}`}
          title="Filter the log"
          action={
            <Link href="/flight-data" className={ui.headLink}>
              The deck as data <span aria-hidden="true">&rarr;</span>
            </Link>
          }
        />
        {/* K-7 works the deck: hover a bay and it reads the manifest. */}
        <RobotGuide
          name="K-7"
          idle={`Deck officer. ${missions.length} bays on the deck, all accounted for. Hover one.`}
          lines={Object.fromEntries(missions.map((m, i) => [m.slug, `BAY ${String(i + 1).padStart(2, "0")} · ${m.title} · ${m.status === "active" ? "active" : "shipped"} · ${m.org}`]))}
        />
        <MissionFilter missions={missions} />
        <RelatedWriting href="/missions" />
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
