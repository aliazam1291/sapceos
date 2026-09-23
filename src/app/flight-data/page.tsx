import type { Metadata } from "next";
import Link from "next/link";
import Bars from "@/components/Bars";
import Comms from "@/components/Comms";
import PageForm from "@/components/space/PageForm";
import { ButtonLink, NextStep, PageHeader, Readout, Section, SectionHead, ui } from "@/components/ui";
import { plainName } from "@/content/pages";
import {
  counters,
  coverage,
  evidence,
  evidenceSeries,
  largestReach,
  ownership,
  reportSections,
  skillsNamed,
  stackProven,
  stackUse,
  verifiedResults,
  written,
} from "@/content/analytics";
import { missions } from "@/content/missions";
import { breadcrumbJsonLd, jsonLd } from "@/lib/seo";
import { domainKeywords, identityKeywords, keywordsFor, roleKeywords } from "@/lib/keywords";
import styles from "./flight-data.module.scss";

/*
 * Flight data (2026-09-22). Ali: "create stats and data analytics on my
 * projects."
 *
 * The portfolio, measured. Every series on this page is computed at build
 * time from the same content objects the rest of the site renders
 * (src/content/analytics.ts) — counts of work, never claims about its
 * effect. The measured OUTCOMES stay where they were: the results ledger
 * on /about and the home Debrief, each number transcribed from PROFILE.md.
 *
 * Why it belongs on a PM's site: it is the argument for how he works, made
 * in the form of the work. A portfolio that reports its own evidence
 * coverage — including the six missions with nothing measured yet — is
 * doing the thing the flight rules say to do.
 */

const description =
  "The portfolio, measured: what Ali Azam Kazmi's ten missions were built with, what he owned on each, and how much has a number on file. Counted from content.";

export const metadata: Metadata = {
  title: { absolute: "Flight Data — Portfolio Analytics · Ali Azam Kazmi" },
  description,
  keywords: keywordsFor(
    ["portfolio analytics", "product metrics", "evidence coverage", "product manager data", "project statistics"],
    identityKeywords,
    roleKeywords.slice(0, 6),
    domainKeywords,
  ),
  alternates: { canonical: "/flight-data" },
  // A route that sets its own openGraph does NOT inherit the root
  // opengraph-image (2026-09-20 audit), so the fallback is named.
  openGraph: {
    type: "website",
    title: "Flight Data — Portfolio Analytics",
    description,
    url: "/flight-data",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ali Azam Kazmi — Space OS" }],
  },
};

export default function FlightDataPage() {
  const states = { measured: "Measured", pending: "Named, not measured", unmeasured: "No public metric" } as const;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Flight data", path: "/flight-data" },
            ]),
          ),
        }}
      />
      <PageHeader
        label="Flight data"
        plain={plainName["/flight-data"]}
        title="The portfolio, measured"
        lede="Every number on this page is counted from the site's own content at build time. Counts of work — not claims about its effect."
        figure={<PageForm form="crystal" label="A slowly turning wireframe lattice." size={240} />}
      />
      <div className={ui.pageComms}>
        <Comms at="flightData" />
      </div>

      <Section id="counts" data-section="At a glance">
        <SectionHead label="01 / Inventory" title="What there is" />
        <Readout items={counters} label="Portfolio inventory" />
      </Section>

      <Section id="stack" data-section="Stack">
        <SectionHead
          label="02 / Built with"
          title="What shipped, and on what"
          action={
            <p className={ui.sectionNote}>
              {stackProven} technologies carried a shipped mission; {skillsNamed} are named on the capabilities list. The
              difference is the honest gap between what I have used in production and what I can reach for.
            </p>
          }
        />
        <Bars items={stackUse} max={missions.length} unit={`of ${missions.length}`} label="Technologies by number of missions" />
      </Section>

      <Section id="ownership" data-section="Ownership">
        <SectionHead
          label="03 / Ownership"
          title="What I actually held"
          action={
            <p className={ui.sectionNote}>
              Matched against each mission&rsquo;s own role line — the same test behind the{" "}
              <Link href="/about#impact">ownership matrix</Link>. Nothing is claimed here that a report does not say.
            </p>
          }
        />
        <Bars items={ownership} max={missions.length} unit={`of ${missions.length}`} label="Ownership by column" />
      </Section>

      <Section id="evidence" data-section="Evidence">
        <SectionHead
          label="04 / Evidence"
          title="How much of it can be checked"
          action={
            <p className={ui.sectionNote}>
              {verifiedResults} measured numbers are on file across all the work — the largest being{" "}
              {largestReach.value} ({largestReach.label.toLowerCase()}, {largestReach.source}). What follows is what
              is <em>not</em> measured, which is the part most portfolios leave out.
            </p>
          }
        />
        <Bars items={evidenceSeries} max={missions.length} unit={`of ${missions.length}`} label="Evidence coverage" />

        <ol className={styles.evidence} aria-label="Evidence state by mission">
          {evidence.map((e) => (
            <li key={e.slug} className={styles.evidenceRow} data-state={e.state}>
              <Link href={`/missions/${e.slug}`} className={styles.evidenceLink}>
                {e.title}
              </Link>
              <span className={styles.evidenceState}>{states[e.state]}</span>
              <span className={styles.evidenceTags}>
                <span className={styles.evidenceTag} data-on={e.status === "shipped" || undefined}>
                  {e.status === "shipped" ? "Shipped" : "Active"}
                </span>
                {e.openable ? <span className={styles.evidenceTag} data-on>Openable</span> : null}
              </span>
            </li>
          ))}
        </ol>
        <p className={styles.footnote}>
          An active mission has no outcome yet, so none is written — what will be measured is named on its report
          instead. A shipped mission with no public metric says so rather than borrowing one.
        </p>
      </Section>

      <Section id="written" data-section="Written">
        <SectionHead
          label="05 / Written down"
          title="The other half of the work"
          action={
            <p className={ui.sectionNote}>
              {reportSections} report sections across {missions.length} missions, plus the teardowns and the essays.
              Word counts — a PRD habit, visible.
            </p>
          }
        />
        <Bars items={written} label="Words written, by kind" unit="words" />
      </Section>

      <Section id="record" data-section="Record">
        <SectionHead label="06 / The record" title="How complete the file is" />
        <Bars items={coverage} max={missions.length} label="Coverage of the record" />
        <p className={styles.footnote}>
          Built from <code>src/content/</code> at compile time. If a mission gains a measured result, this page changes
          on the next deploy — nobody edits a number here, because there is no number here to edit.
        </p>
        <div className={ui.buttonRow}>
          <ButtonLink href="/missions" primary>
            The missions behind the data
          </ButtonLink>
          <ButtonLink href="/Ali_Azam_Kazmi_.pdf" external>
            Résumé (PDF)
          </ButtonLink>
        </div>
      </Section>

      <NextStep
        href="/decisions"
        label="Next · Flight rules"
        title="How the calls were made"
        premise="Seven decisions, each with the fact it came from — the judgement behind the numbers above."
      />
    </>
  );
}
