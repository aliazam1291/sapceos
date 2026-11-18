import type { Metadata } from "next";
import Link from "next/link";
import Comms from "@/components/Comms";
import Crumbs from "@/components/Crumbs";
import FaxTerminal from "@/components/FaxTerminal";
import RecruiterManifest from "@/components/RecruiterManifest";
import PageForm from "@/components/space/PageForm";
import { ButtonLink, NextStep, PageHeader, Readout, Section, SectionHead, ui } from "@/components/ui";
import { plainName } from "@/content/pages";
import { aiTools, lookingFor, openTo, ownedProducts, profile } from "@/content/profile";
import { identityKeywords, keywordsFor, roleKeywords } from "@/lib/keywords";
import { siteUrl } from "@/lib/site";
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
 * What it does not say, on purpose: he is not a Product Manager by title
 * (Associate Project Owner since Jul 2026, PROFILE.md), so the copy says
 * what he does — the PRDs, the product decisions, the builds — and what he is
 * looking for, never a title he does not hold. Notice period and salary are
 * still not on file and are not guessed.
 */

const title = "Hiring a Technical PM in New Delhi? · Ali Azam Kazmi";
const description =
  "The 30-second brief on Ali Azam Kazmi: owns three products at MapMyIndia, designs and builds them, 4× collections on Mappls Shop. Open to PM roles anywhere.";

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
    // The image is this route's own card (./opengraph-image.tsx): the link a
    // recruiter is sent should unfurl as the brief, not the site's cover.
  },
};

// The case, in the order a PM screen asks it (2026-11-17, Ali: "a PM-focused
// portfolio … someone who's a PM and knows design and tech and UX and can
// ship products"): owns the product, designs it, builds it, ships and
// measures it. Every line a PROFILE.md fact.
const brief = [
  {
    claim: "Owns the product",
    evidence: [
      `As ${profile.currentRole} at MapMyIndia he owns three products: ${ownedProducts.join(", ")}. He writes the PRDs (Mappls Shop, the Admin Platform, Driver Safety for VinFast and SM Green): problem, user stories, acceptance criteria, the edge cases nobody wants to think about.`,
      "Outside work, Founder & CPO of DumbMoney: what it is for, what ships, and the quality bar every code passes.",
    ],
    more: { label: "How he decides", href: "/decisions" },
  },
  {
    claim: "Designs the experience",
    evidence: [
      "User flows and wireframes come first, before a line of code: vehicle states, map behaviour, the alarm, geofence and ticket workflow were designed before they were built. Founder of Smaak.ux, a product and design studio with 10+ clients since 2023; Google UX Design certified.",
    ],
    more: { label: "The design work", href: "/studio" },
  },
  {
    claim: "Builds it himself",
    evidence: [
      `Leads the React and Angular frontend on enterprise fleet platforms, and builds the Technician App in React Native. AI-native: prototypes with AI coding assistants and uses ${aiTools.join(", ")} for research. This site is the exhibit, specified and designed by him, built with Claude as the coding pair.`,
    ],
    more: { label: "The lab", href: "/lab" },
  },
  {
    claim: "Ships, and measures it",
    evidence: [
      "Mappls Shop replaced a manual billing process: 4× the collections, 80% less manual operations work, revenue-generating since its October 2026 launch. Mappls Intouch and Indane Yatra Mitra are live on Google Play; Vahan Shakti serves 200,000+ users.",
    ],
    more: { label: "Ten mission reports", href: "/missions" },
  },
];

// The measured results, once: the readout counts them, the fax prints the
// first three on its sheet.
const measured = [
  { value: 200000, suffix: "+", label: "Users", note: "Vahan Shakti" },
  { value: 4, suffix: "×", label: "Collections", note: "Mappls Shop" },
  { value: 80, suffix: "%", label: "Less manual ops work", note: "Mappls Shop" },
  { value: 30000, suffix: "+", label: "Routes injected", note: "IOCL GeoRTD" },
];

// The forwarding draft: who he is, what he wants, where the brief and the
// CV are. Facts from the profile; nothing a recruiter would have to correct.
const forward = `mailto:?subject=${encodeURIComponent(`Candidate: ${profile.name}, ${lookingFor}`)}&body=${encodeURIComponent(
  `${profile.name}: ${profile.title}. ${profile.currentRole} at ${profile.currentOrg}. ${openTo}.\n\nThe 30-second brief: ${siteUrl}/hire\nRésumé (PDF): ${siteUrl}/Ali_Azam_Kazmi_.pdf\nEmail: ${profile.email}`,
)}`;

export default function HirePage() {
  return (
    <>
      <Crumbs name="Recruiter brief" path="/hire" />
      <PageHeader
        label="Recruiter brief"
        plain={plainName["/hire"]}
        title="The PM who builds the product"
        lede={`${lookingFor}. ${openTo}. The CV is one click away; the whole case takes thirty seconds.`}
        figure={<PageForm form="probe" label="A slowly turning wireframe probe." size={240} />}
        actions={
          <>
            <ButtonLink href="/Ali_Azam_Kazmi_.pdf" external primary>
              Résumé (PDF)
            </ButtonLink>
            <ButtonLink href={profile.calendly} external>
              Book a call
            </ButtonLink>
            <ButtonLink href={`mailto:${profile.email}`} external>
              Email
            </ButtonLink>
          </>
        }
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
        <Readout label="Measured results" items={measured} />
      </Section>

      <Section id="case" data-section="The case">
        <SectionHead label="03 / The case" title="Product, design, engineering, shipped" />
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
          {/* A recruiter rarely decides alone: one click drafts the email
              that passes this page to the hiring manager. */}
          <ButtonLink href={forward} external>
            Forward this brief
          </ButtonLink>
        </div>
        {/* The same PDF, the fun way: swipe a pass, the relay prints it. The
            plain button above stays first (2026-10-28 review: no résumé
            behind a game). */}
        <FaxTerminal sheet={{ name: profile.name, role: profile.title, place: profile.location, numbers: measured.slice(0, 3) }} />
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
