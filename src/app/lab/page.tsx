import type { Metadata } from "next";
import MissionSignature from "@/components/MissionSignature";
import PageForm from "@/components/space/PageForm";
import { NextStep, PageHeader, Section, Status, TagRow, ui } from "@/components/ui";
import { labEntries } from "@/content/lab";

export const metadata: Metadata = {
  title: "Lab",
  description: "Experiments and independent builds — OCR pipelines, data visualisation, ML prototypes.",
  alternates: { canonical: "/lab" },
};

export default function LabPage() {
  return (
    <>
      <PageHeader
        label="Lab"
        title="Things built to find out whether they'd work"
        lede="No client, no deadline, no requirement to be useful. Some of these answered the question and stopped there — which was the point."
      />

      <Section>
        <PageForm
          form="truss"
          label="A slowly turning octahedral lattice beam, drawn as a wireframe, with a band of light sweeping along its length."
          size={300}
        />

        <div className={ui.instrumentGrid}>
          {labEntries.map((entry, i) => (
            <article key={entry.title} className={ui.instrumentCell}>
              <div className={ui.cardTop}>
                <span className={ui.entryIndex}>EXP-{String(i + 1).padStart(2, "0")}</span>
                <Status idle={entry.status !== "live"}>{entry.status.replace("-", " ")}</Status>
              </div>

              <MissionSignature seed={entry.title} className={ui.cardTrace} />

              <h2 className={ui.cardTitle}>{entry.title}</h2>
              <p className={ui.cardPremise}>{entry.premise}</p>
              <TagRow items={entry.stack} />
            </article>
          ))}
        </div>
      </Section>
    <NextStep
      href="/missions"
      label="Next · Missions"
      title="Every one started as somebody's bad afternoon"
      premise="The experiments above answered a question. These ones had to survive contact with users."
    />
  </>
  );
}
