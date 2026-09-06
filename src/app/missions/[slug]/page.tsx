import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Body,
  ButtonLink,
  PageHeader,
  Row,
  Section,
  Status,
  TagRow,
  ui,
} from "@/components/ui";
import ReportNav, { ReportLayout } from "@/components/ReportNav";
import MissionSignature from "@/components/MissionSignature";
import ReportHero from "@/components/ReportHero";
import { sectionSlug } from "@/lib/slug";
import { getMission, missions } from "@/content/missions";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return missions.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const mission = getMission(slug);
  if (!mission) return {};
  return {
    title: `${mission.title} — Mission Report`,
    description: mission.premise,
    alternates: { canonical: `/missions/${mission.slug}` },
  };
}

export default async function MissionReport({ params }: Params) {
  const { slug } = await params;
  const mission = getMission(slug);
  if (!mission) notFound();

  const index = missions.findIndex((m) => m.slug === mission.slug);
  const next = missions[(index + 1) % missions.length];

  return (
    <>
      <PageHeader
        label={`Mission Report · ${mission.org}`}
        title={mission.title}
        lede={mission.premise}
      />

      <Section>
        <div className={ui.metaRow} data-reveal>
          <Status idle={mission.status !== "active"}>
            {mission.status === "active" ? "Active" : "Shipped"}
          </Status>
          <span>{mission.role}</span>
          {/* `period` is always literally "Active"/"Shipped" in the content
              data — never a real date range — so showing it here just
              repeats the Status pill next to it. */}
        </div>

        <ReportHero seed={mission.slug} title={mission.title} />

        <MissionSignature
          seed={mission.slug}
          width={640}
          height={130}
          className={ui.reportTrace}
        />

        {mission.signals.length ? (
          <div className={ui.rows} style={{ marginTop: "var(--space-8)" }}>
            {mission.signals.map((s) => (
              <Row key={s.label} label={s.label}>
                <div className={ui.rowBody}>{s.value}</div>
              </Row>
            ))}
          </div>
        ) : null}

        <div style={{ marginTop: "var(--space-8)" }} data-reveal>
          <TagRow items={mission.stack} />
        </div>
      </Section>

      <ReportLayout>
        <ReportNav labels={mission.report.map((s) => s.label)} />
        <div className={ui.rows}>
          {mission.report.map((section) => (
            <div key={section.label} id={sectionSlug(section.label)} data-section={section.label}>
              <Row label={section.label}>
                <Body value={section.body} />
              </Row>
            </div>
          ))}
        </div>
      </ReportLayout>

      <Section>
        <div className={ui.buttonRow} data-reveal>
          <ButtonLink href="/missions">← All missions</ButtonLink>
        </div>
      </Section>

      <Link href={`/missions/${next.slug}`} className={ui.next}>
        <div className={ui.nextInner}>
          <span className={ui.labelRule}>Next mission</span>
          <span className={ui.nextTitle}>{next.title}</span>
          <span className={ui.nextPremise}>{next.premise}</span>
        </div>
      </Link>
    </>
  );
}
