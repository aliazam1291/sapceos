import type { Metadata } from "next";
import Hologram from "@/components/Hologram";
import RobotGuide from "@/components/RobotGuide";
import { NextStep, PageHeader, Section, Status, TagRow, ui } from "@/components/ui";
import { plainName } from "@/content/pages";
import { labEntries } from "@/content/lab";
import { identityKeywords, keywordsFor, skillKeywords } from "@/lib/keywords";
import Comms from "@/components/Comms";

export const metadata: Metadata = {
  title: "Lab — Experiments & Open Source",
  description: "Independent builds by Ali Azam Kazmi: open-source D3 analytics, handwriting OCR with OpenCV and Tesseract, ultrasound detection, a carbon calculator.",
  keywords: keywordsFor(identityKeywords, skillKeywords, ["open source projects", "OCR pipeline", "medical imaging deep learning", "carbon footprint calculator", "D3 dashboards"]),
  alternates: { canonical: "/lab" },
};

export default function LabPage() {
  return (
    <>
      <PageHeader
        label="Lab"
        plain={plainName["/lab"]}
        title="Things built to find out whether they'd work"
        lede="No client, no deadline, no requirement to be useful. Some of these answered the question and stopped there — which was the point."
        figure={<Hologram src={labEntries[0].cover} seed={labEntries[0].title} tag="BENCH" alt={`${labEntries[0].title} — interface`} priority />}
      />
      <div className={ui.pageComms}>
        <Comms at="lab" />
      </div>

      <Section>
        <RobotGuide
          name="K-7"
          idle="Lab technician. Four experiments on the bench. Hover one; none of them bite."
          lines={Object.fromEntries(labEntries.map((e, i) => [e.title, `EXP-${String(i + 1).padStart(2, "0")} · ${e.title} · ${e.status.replace("-", " ")} · ${e.stack.slice(0, 3).join(", ")}`]))}
        />
        <div className={ui.projectorGrid}>
          {labEntries.map((entry, i) => (
            <article key={entry.title} className={`${ui.projectorCell} flies`} data-bay={entry.title}>
              <div className={ui.cardTop}>
                <span className={ui.entryIndex}>EXP-{String(i + 1).padStart(2, "0")}</span>
                <Status idle={entry.status !== "live"}>{entry.status.replace("-", " ")}</Status>
              </div>

              <Hologram src={entry.cover} seed={entry.title} tag={`EXP-${String(i + 1).padStart(2, "0")}`} alt={`${entry.title} — interface`} />

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
