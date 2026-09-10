import type { Metadata } from "next";
import OrbitStage from "./OrbitStage";
import { DraftFlag, NextStep, PageHeader, Row, Section, ui } from "@/components/ui";
import { orbitSlots } from "@/content/orbit";
import styles from "./orbit.module.scss";

export const metadata: Metadata = {
  title: "Orbit",
  description: "What currently holds attention — reading, tools, questions being chewed on.",
  alternates: { canonical: "/orbit" },
};

// PROFILE.md: "Orbit topics / reading list / music — no verified data.
// Must come from Ali directly." Nothing is invented here. The slots now live
// in src/content/orbit.ts so the nav can gate its own link on whether this
// page has anything to say yet.
const slots = orbitSlots;

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
                  {slot.entries.length > 0 ? (
                    slot.entries.map((entry) => <p key={entry}>{entry}</p>)
                  ) : (
                    <p>
                      <DraftFlag note={slot.note} />
                    </p>
                  )}
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
