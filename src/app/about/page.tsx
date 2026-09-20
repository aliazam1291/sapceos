import type { Metadata } from "next";
import { ButtonLink, PageHeader, Row, Section, SectionHead, TagRow, ui } from "@/components/ui";
import { education, leadership, profile, skills } from "@/content/profile";
import MatrixPortrait from "@/components/space/MatrixPortrait";
import CareerLoop from "@/components/CareerLoop";
import Impact from "@/components/Impact";
import LoopSequence from "@/components/LoopSequence";
import Landing from "@/components/Landing";
import ClientGrid from "@/components/ClientGrid";
import Transmissions from "@/components/Transmissions";
import { identityKeywords, keywordsFor, placeKeywords, roleKeywords } from "@/lib/keywords";
import { jsonLd, personId } from "@/lib/seo";
import Comms from "@/components/Comms";

export const metadata: Metadata = {
  title: "About — Product Engineer & UX Strategist",
  description:
    "Ali Azam Kazmi: product and platform developer at MapMyIndia, founder of Smaak.ux, B.Tech CSE (SRM). Frontend, UX and PRD ownership on fleet platforms.",
  keywords: keywordsFor(identityKeywords, roleKeywords, placeKeywords, ["about Ali Azam Kazmi", "product engineer bio", "Smaak.ux founder"]),
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      {/* This page is the person's profile; say so to the crawler. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            mainEntity: { "@id": personId },
          }),
        }}
      />
      <PageHeader
        label="About the Operator"
        title={profile.name}
        lede={`${profile.title} · Founder & CPO, DumbMoney · ${profile.location}`}
        figure={<MatrixPortrait src="/images/ali.jpg" alt={profile.name} size={220} cells={56} />}
      />
      <div className={ui.pageComms}>
        <Comms at="about" />
      </div>

      <Section>

        {/* Above the fold on load — see PageHeader. */}
        <p className={ui.statement}>
          I learn whatever I need to in order to build the thing I think should exist.{" "}
          <span className={ui.statementDim}>
            That has meant frontend one week and a PRD the next, usually on the same product.
          </span>
        </p>
      </Section>

      <Section>
        <div className={ui.prose} data-reveal>
          <p>
            At {profile.currentOrg} I work on enterprise fleet and telematics platforms — the
            software that tells someone where two hundred thousand vehicles are, and, more
            usefully, which four of them need attention right now. My role there has been
            consistent across every project: build the frontend, own the UI and the UX, work
            across teams, and write the document that says what we are actually solving.
          </p>
          <p>
            I also run Smaak.ux, a small product and design studio, which is where I learned
            that a brand and an interface are the same argument told at different resolutions.
          </p>
        </div>
      </Section>

      {/* The airframe: the ship lands and its parts introduce the operator,
          with the loadout underneath. The same walkaround as the end of the
          home page — this is the operator's page, so it belongs here too. */}
      <Landing label="The airframe" section="Airframe" />

      {/* The ledger and the ownership matrix, then the operating loop — both
          moved here when the home page was cut to the flight. */}
      <Section id="impact" data-section="Impact">
        <SectionHead label="Impact" title="What moved, and what I owned" />
        <Impact />
      </Section>

      <LoopSequence />

      <Section id="studio" data-section="Studio">
        <SectionHead
          label="Smaak.ux · since 2023 · freelance"
          title="Ten clients, eight of them here"
          action={
            <ButtonLink href="/studio" primary>
              Open the studio
            </ButtonLink>
          }
        />
        <ClientGrid />
      </Section>

      {/* The loop is the answer to "what does he actually do", and it is the
          one piece of PROFILE.md that states the differentiator outright.
          Placed straight after the prose, before the credentials — it belongs
          with the argument, not with the record. */}
      <Section id="loop" data-section="The loop">
        <SectionHead
          label="How the work goes"
          title="Problem in, problem out"
          action={undefined}
        />
        <CareerLoop />
      </Section>

      <Section id="education" data-section="Education">
        <SectionHead label="Education" title="Where the foundations came from" />
        <div className={ui.rows}>
          <Row label={education.period}>
            <div className={ui.rowBody}>
              <p>
                <strong style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                  {education.degree}
                </strong>
                <br />
                {education.school} · {education.detail}
              </p>
            </div>
          </Row>
        </div>
      </Section>

      <Section id="leadership" data-section="Leadership">
        <SectionHead label="Leadership" title="Running things that had to actually happen" />
        <div className={ui.rows}>
          {leadership.map((item) => (
            <Row key={item.role} label={item.period}>
              <div className={ui.rowBody}>
                <p>
                  <strong style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                    {item.role}
                  </strong>{" "}
                  · {item.org}
                </p>
                <p>{item.detail}</p>
              </div>
            </Row>
          ))}
        </div>
      </Section>

      <Section id="capabilities" data-section="Capabilities">
        <SectionHead label="Capabilities" title="What I reach for" />
        <div className={ui.rows}>
          {skills.map((group) => (
            <Row key={group.group} label={group.group}>
              <div className={ui.rowBody}>
                <TagRow items={group.items} />
              </div>
            </Row>
          ))}
        </div>
      </Section>

      <Transmissions />

      <Section>
        <div className={ui.buttonRow} data-reveal>
          <ButtonLink href="/mission-history" primary>
            Full mission history
          </ButtonLink>
          <ButtonLink href="/Ali_Azam_Kazmi_.pdf" external>
            Résumé (PDF)
          </ButtonLink>
          <ButtonLink href="/contact">Open a channel</ButtonLink>
        </div>
      </Section>
    </>
  );
}
