import type { Metadata } from "next";
import NoteFlight from "@/components/NoteFlight";
import Drone from "@/components/Drone";
import { NextStep, PageHeader, Section } from "@/components/ui";
import { fieldNotes } from "@/content/field-notes";
import { contentKeywords, identityKeywords, keywordsFor, roleKeywords } from "@/lib/keywords";

export const metadata: Metadata = {
  title: "Field Notes — Product Case Studies",
  description:
    "Six independent product case studies by Ali Azam Kazmi: Linear vs Jira, AI code assistant adoption, Apple ecosystem fragmentation, Flipkart discovery, Uber driver retention, the logistics visibility gap.",
  keywords: keywordsFor(identityKeywords, contentKeywords, roleKeywords),
  alternates: { canonical: "/field-notes" },
};

export default function FieldNotesPage() {
  return (
    <>
      <PageHeader
        label="Field Notes"
        title="Teardowns of products I don't work on"
        lede="Independent product and UX analyses. Not client work, not case studies for hire — just reading other people's decisions closely enough to disagree with them."
        figure={<Drone src={fieldNotes[0].cover} seed={fieldNotes[0].slug} tag="FN-01" sub="case study" label={fieldNotes[0].title} />}
      />

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
