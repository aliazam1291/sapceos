import type { Metadata } from "next";
import OrbitStage from "./OrbitStage";
import { DraftFlag, NextStep, PageHeader, Row, Section, ui } from "@/components/ui";
import styles from "./orbit.module.scss";

export const metadata: Metadata = {
  title: "Orbit",
  description: "What currently holds attention — reading, tools, questions being chewed on.",
  alternates: { canonical: "/orbit" },
};

// PROFILE.md: "Orbit topics / reading list / music — no verified data.
// Must come from Ali directly." Nothing is invented here.
const slots = [
  { label: "Reading", note: "books, papers, long-form", radius: 0.95, period: 26, offset: 0, tilt: 0.05 },
  { label: "Tools", note: "what's actually open every day", radius: 1.35, period: 38, offset: 9, tilt: -0.16 },
  { label: "Questions", note: "problems being chewed on", radius: 1.78, period: 52, offset: 20, tilt: 0.22 },
  { label: "Signal", note: "music / focus", radius: 2.2, period: 68, offset: 34, tilt: -0.09 },
];

export default function OrbitPage() {
  return (
    <>
      <PageHeader
        label="Orbit"
        title="Currently in orbit"
        lede="The things circling close enough to keep pulling attention. This page changes more often than the rest of the site."
      />

      <Section>
        <div className={styles.layout}>
          <OrbitStage bodies={slots} />

          <div className={ui.rows}>
            {slots.map((slot) => (
              <Row key={slot.label} label={slot.label}>
                <div className={ui.rowBody}>
                  <p>
                    <DraftFlag note={slot.note} />
                  </p>
                </div>
              </Row>
            ))}
          </div>
        </div>
      </Section>
    <NextStep
      href="/contact"
      label="Next · Open channel"
      title="The channel is open"
      premise="Product roles, platform work, or an argument about something on this site."
    />
  </>
  );
}
