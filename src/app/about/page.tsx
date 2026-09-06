import type { Metadata } from "next";
import { ButtonLink, PageHeader, Row, Section, SectionHead, TagRow, ui } from "@/components/ui";
import { education, leadership, profile, skills } from "@/content/profile";
import PageForm from "@/components/space/PageForm";

export const metadata: Metadata = {
  title: "About the Operator",
  description:
    "Ali Azam Kazmi — product engineer and UX strategist working on fleet and telematics platforms in New Delhi.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        label="About the Operator"
        title={profile.name}
        lede={`${profile.title} · ${profile.location}`}
      />

      <Section>
        <PageForm
          form="crystal"
          label="A slowly turning faceted wireframe solid, generated from this site’s own identity."
          size={280}
        />

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

      <Section>
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

      <Section>
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

      <Section>
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

      <Section>
        <div className={ui.buttonRow} data-reveal>
          <ButtonLink href="/mission-history" primary>
            Full mission history
          </ButtonLink>
          <ButtonLink href="/contact">Open a channel</ButtonLink>
        </div>
      </Section>
    </>
  );
}
