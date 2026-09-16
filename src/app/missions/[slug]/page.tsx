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
import Hologram from "@/components/Hologram";
import { sectionSlug } from "@/lib/slug";
import { getMission, missions } from "@/content/missions";
import { breadcrumbJsonLd, jsonLd, missionJsonLd } from "@/lib/seo";
import { domainKeywords, identityKeywords, keywordsFor } from "@/lib/keywords";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return missions.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const mission = getMission(slug);
  if (!mission) return {};
  const facts = mission.signals.map((sig) => `${sig.value} ${sig.label.toLowerCase()}`).join(", ");
  const description = `${mission.title} at ${mission.org} — ${mission.premise}${facts ? ` ${facts}.` : ""} Role: ${mission.role}.`;
  return {
    title: `${mission.title} — Mission Report`,
    description,
    keywords: keywordsFor([mission.title, `${mission.title} case study`, mission.org, ...mission.stack], identityKeywords, domainKeywords, ["mission report", "product engineering case study"]),
    alternates: { canonical: `/missions/${mission.slug}` },
    openGraph: {
      type: "article",
      title: `${mission.title} — Mission Report`,
      description,
      url: `/missions/${mission.slug}`,
      images: mission.cover ? [{ url: mission.cover, width: 1200, height: 675, alt: `${mission.title} interface` }] : undefined,
    },
    twitter: { card: "summary_large_image", title: mission.title, description },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            missionJsonLd(mission),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Missions", path: "/missions" },
              { name: mission.title, path: `/missions/${mission.slug}` },
            ]),
          ),
        }}
      />
      {/* The report opens the way every other page does: the object beside
          the title. Here the object is the interface, projected. */}
      <PageHeader
        label={`Mission Report · ${mission.org}`}
        title={mission.title}
        lede={mission.premise}
        figure={<Hologram src={mission.cover} seed={mission.slug} tag="REPORT" />}
      />

      {/* The manifest: everything that used to be spread down the page as a
          meta row, an object block, a signals list and a tag row, as one HUD
          strip — status, role, the verified numbers, the stack. */}
      <Section>
        <dl className={ui.manifest} data-reveal>
          <div className={ui.manifestCell}>
            <dt>Status</dt>
            <dd>
              <Status idle={mission.status !== "active"}>{mission.status === "active" ? "Active" : "Shipped"}</Status>
            </dd>
          </div>
          <div className={ui.manifestCell}>
            <dt>Owned</dt>
            <dd>{mission.role}</dd>
          </div>
          {mission.signals.map((sig) => (
            <div key={sig.label} className={ui.manifestCell} data-big={/\d/.test(sig.value) || undefined}>
              <dt>{sig.label}</dt>
              <dd>{sig.value}</dd>
            </div>
          ))}
          <div className={`${ui.manifestCell} ${ui.manifestWide}`}>
            <dt>Stack</dt>
            <dd>
              <TagRow items={mission.stack} />
            </dd>
          </div>
        </dl>
        <MissionSignature seed={mission.slug} width={640} height={90} className={ui.reportTrace} />
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
