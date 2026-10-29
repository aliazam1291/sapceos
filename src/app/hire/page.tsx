import type { Metadata } from "next";
import Link from "next/link";
import Comms from "@/components/Comms";
import Crumbs from "@/components/Crumbs";
import FaxTerminal from "@/components/FaxTerminal";
import RecruiterManifest from "@/components/RecruiterManifest";
import PageForm from "@/components/space/PageForm";
import { ButtonLink, NextStep, PageHeader, Readout, Section, SectionHead, ui } from "@/components/ui";
import { plainName } from "@/content/pages";
import { aiTools, lookingFor, openTo, profile } from "@/content/profile";
import { identityKeywords, keywordsFor, roleKeywords } from "@/lib/keywords";
import styles from "./hire.module.scss";

/*
 * The recruiter brief (2026-10-24). Ali: "think how to increase seo in
 * delhi pm … ask me questions to get people hrs on my website".
 *
 * Two jobs. First, the page an HR person should land on: everything a first
 * screening call asks — the roles, the location, the proof, the CV, a way to
 * book a call — in thirty seconds of reading, with every line a PROFILE.md
 * fact. Second, a page whose title, h1 and copy are about the search a
 * recruiter actually types ("technical product manager New Delhi", "product
 * manager who can code"), so the site has one URL that answers it, rather
 * than the query landing on the galaxy.
 *
 * What it does not say, on purpose: he is not a Product Manager by title yet
 * (PROFILE.md, "The job search": "Not yet, keep as is"), so the copy says
 * what he does — the PRDs, the product decisions, the builds — and what he is
 * looking for, never a title he does not hold. Notice period and salary are
 * still not on file and are not guessed.
 */

const title = "Hiring a Technical PM in New Delhi? · Ali Azam Kazmi";
const description =
  "The 30-second brief on Ali Azam Kazmi for recruiters: product engineer and de-facto PM at MapMyIndia, Founder & CPO of DumbMoney, open to PM roles anywhere.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: keywordsFor(
    [
      "technical product manager New Delhi",
      "product manager New Delhi",
      "product manager Delhi",
      "hire product manager",
      "AI product manager",
      "product manager who can code",
      "vibe coding product manager",
      "fleet telematics product manager",
    ],
    identityKeywords.slice(0, 12),
    roleKeywords,
  ),
  alternates: { canonical: "/hire" },
  openGraph: {
    type: "profile",
    title: "Hiring a Technical PM? The 30-second brief — Ali Azam Kazmi",
    description,
    url: "/hire",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ali Azam Kazmi — Space OS" }],
  },
};

// The case, in four claims a recruiter screens for, each with its proof.
const brief = [
  {
    claim: "Writes the PRD",
    evidence: [
      "On every MapMyIndia project the product half has been his: problem statements, user stories, acceptance criteria, the edge cases nobody wants to think about. Vehicle status logic, the alarm, geofence and ticketing workflows were decided before they were built.",
    ],
    more: { label: "How he decides", href: "/decisions" },
  },
  {
    claim: "Builds what it says",
    evidence: [
      "Frontend and UI/UX on enterprise fleet and telematics platforms: Vahan Shakti (200,000+ users), Locate (20,000+ vehicles), Intouch (10,000+ active vehicles), and Mappls Shop, the subscription billing system that replaced a manual process: 4× the collections, with 80% less manual operations work.",
    ],
    more: { label: "Ten mission reports", href: "/missions" },
  },
  {
    claim: "Runs a product of his own",
    evidence: [
      "Founder & CPO of DumbMoney, a coupon platform for Indian shoppers, and founder of Smaak.ux, a product and design studio with 10+ clients since 2023.",
    ],
    more: { label: "The venture", href: "/dumbmoney" },
  },
  {
    claim: "AI-native",
    evidence: [
      `He prototypes and ships with AI coding assistants (vibe coding) and uses ${aiTools.join(", ")} for research and generative AI work.`,
      "This site is the exhibit: specified and designed by him, built with Claude as the coding pair.",
    ],
    more: { label: "Why the bottleneck moved", href: "/writing/the-bottleneck-moved" },
  },
];

export default function HirePage() {
  return (
    <>
      <Crumbs name="Recruiter brief" path="/hire" />
      <PageHeader
        label="Recruiter brief"
        plain={plainName["/hire"]}
        title="The PM who builds the product"
        lede={`${lookingFor}. ${openTo}. Here is the whole case in thirty seconds, then the CV.`}
        figure={<PageForm form="probe" label="A slowly turning wireframe probe." size={240} />}
      />
      <div className={ui.pageComms}>
        <Comms at="hire" />
      </div>

      <Section id="glance" data-section="At a glance">
        <SectionHead label="01 / At a glance" title="What a first call asks" />
        <RecruiterManifest />
      </Section>

      <Section id="proof" data-section="Proof">
        <SectionHead
          label="02 / Proof"
          title="Measured, not estimated"
          action={<p className={ui.sectionNote}>Every number links back to a report that names its source. What was not measured says so.</p>}
        />
        <Readout
          label="Measured results"
          items={[
            { value: 200000, suffix: "+", label: "Users", note: "Vahan Shakti" },
            { value: 4, suffix: "×", label: "Collections", note: "Mappls Shop" },
            { value: 80, suffix: "%", label: "Less manual ops work", note: "Mappls Shop" },
            { value: 30000, suffix: "+", label: "Routes injected", note: "IOCL GeoRTD" },
          ]}
        />
      </Section>

      <Section id="case" data-section="The case">
        <SectionHead label="03 / The case" title="Four claims, with the evidence" />
        <dl className={styles.list}>
          {brief.map((b) => (
            <div key={b.claim} className={styles.row} data-reveal>
              <dt>
                <h3 className={styles.claim}>{b.claim}</h3>
              </dt>
              <dd className={styles.evidence}>
                {b.evidence.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                <Link href={b.more.href} className={styles.more}>
                  {b.more.label} <span aria-hidden="true">&rarr;</span>
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="next" data-section="Next step">
        <SectionHead label="04 / Next step" title="The CV, or a call" />
        <div className={ui.buttonRow} data-reveal>
          <ButtonLink href="/Ali_Azam_Kazmi_.pdf" external primary>
            Résumé (PDF)
          </ButtonLink>
          <ButtonLink href={profile.calendly} external>
            Book a call
          </ButtonLink>
          <ButtonLink href={`mailto:${profile.email}`} external>
            {profile.email}
          </ButtonLink>
        </div>
        {/* The same PDF, the fun way: swipe a pass, the relay prints it. The
            plain button above stays first (2026-10-28 review: no résumé
            behind a game). */}
        <FaxTerminal />
      </Section>

      <NextStep
        href="/faq"
        label="Next · Questions"
        title="The rest of a screening call"
        premise="Why an engineer is moving into product, what he owned, and what was measured."
      />
    </>
  );
}
