import type { Metadata } from "next";
import Link from "next/link";
import TiltCard, { tilt } from "@/components/TiltCard";
import MissionSignature from "@/components/MissionSignature";
import { NextStep, PageHeader, Section, ui } from "@/components/ui";
import { fieldNotes } from "@/content/field-notes";
import PageForm from "@/components/space/PageForm";

export const metadata: Metadata = {
  title: "Field Notes",
  description:
    "Independent product and UX analyses — teardowns of products Ali does not work on.",
  alternates: { canonical: "/field-notes" },
};

export default function FieldNotesPage() {
  return (
    <>
      <PageHeader
        label="Field Notes"
        title="Teardowns of products I don't work on"
        lede="Independent product and UX analyses. Not client work, not case studies for hire — just reading other people's decisions closely enough to disagree with them."
      />

      <Section>
        <PageForm
          form="probe"
          label="A slowly tumbling wireframe probe: an octahedral core on four struts, each ending in a small instrument cross."
          size={280}
        />

        <div className={ui.grid}>
          {fieldNotes.map((note, i) => (
            <TiltCard key={note.slug}>
              <div className={ui.cardTop}>
                <span className={ui.entryIndex}>FN-{String(i + 1).padStart(2, "0")}</span>
                <span className={ui.entryIndex}>Independent analysis</span>
              </div>

              <MissionSignature seed={note.slug} className={ui.cardTrace} />

              <h2 className={ui.cardTitle}>
                <Link href={`/field-notes/${note.slug}`} className={tilt.cardLink}>
                  {note.title}
                </Link>
              </h2>
              <p className={ui.cardPremise}>{note.premise}</p>
              <span className={ui.entryIndex}>Read →</span>
            </TiltCard>
          ))}
        </div>
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
