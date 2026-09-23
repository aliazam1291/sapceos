import type { Metadata } from "next";
import NoteFlight from "@/components/NoteFlight";
import Drone from "@/components/Drone";
import { NextStep, PageHeader, Section, ui } from "@/components/ui";
import { fieldNotes } from "@/content/field-notes";
import { contentKeywords, identityKeywords, keywordsFor, roleKeywords } from "@/lib/keywords";
import Comms from "@/components/Comms";
import { plainName } from "@/content/pages";

export const metadata: Metadata = {
  title: { absolute: "Field Notes — Product Teardowns · Ali Azam Kazmi" },
  description:
    "Six PM-style product teardowns by Ali Azam Kazmi — Linear vs Jira, AI coding assistants, Apple, Flipkart, Uber retention, logistics — each ending in what to measure.",
  keywords: keywordsFor(identityKeywords, contentKeywords, roleKeywords),
  alternates: { canonical: "/field-notes" },
};

export default function FieldNotesPage() {
  return (
    <>
      <PageHeader
        label="Field Notes"
        plain={plainName["/field-notes"]}
        title="Teardowns of products I don't work on"
        lede="Independent product and UX analyses. Not client work, not case studies for hire — just reading other people's decisions closely enough to disagree with them."
        figure={<Drone src={fieldNotes[0].cover} seed={fieldNotes[0].slug} tag="FN-01" sub="case study" label={fieldNotes[0].title} priority />}
      />
      <div className={ui.pageComms}>
        <Comms at="fieldNotes" />
      </div>

      <Section>
        <NoteFlight notes={fieldNotes} />
      </Section>
    <NextStep
      href="/missions"
      label="Next · Missions"
      title="Every one started as somebody's bad afternoon"
      premise="Enterprise fleet and telematics platforms, mostly. The interesting part is rarely the technology."
    />
  </>
  );
}
