import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Body,
  ButtonLink,
  PageHeader,
  Pager,
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
import { breadcrumbJsonLd, clipDescription, jsonLd, missionJsonLd } from "@/lib/seo";
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
  const description = clipDescription(`${mission.premise}${facts ? ` ${facts}.` : ""} ${mission.title} at ${mission.org} — role: ${mission.role}.`);
  // Absolute: the layout's "— Ali Azam Kazmi" template pushed long mission
  // titles past 75 characters; Google truncates at ~60.
  // Long product names drop the byline rather than truncate mid-name.
  const full = `${mission.title} — Case Study · Ali Azam Kazmi`;
  const title = full.length <= 62 ? full : `${mission.title} — Case Study`;
  return {
    title: { absolute: title },
    description,
    keywords: keywordsFor([mission.title, `${mission.title} case study`, mission.org, ...mission.stack], identityKeywords, domainKeywords, ["mission report", "product engineering case study"]),
    alternates: { canonical: `/missions/${mission.slug}` },
    openGraph: {
      type: "article",
      title: `${mission.title} — Mission Report`,
      description,
      url: `/missions/${mission.slug}`,
      // Only when there is a cover: an explicit `images: undefined` removed
      // the root opengraph-image from the four missions without one.
      // The root opengraph-image is not inherited once a route sets its own
      // openGraph object, so the missions without a cover name it explicitly.
      images: mission.cover
        ? [{ url: mission.cover, width: 1200, height: 675, alt: `${mission.title} interface` }]
        : [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ali Azam Kazmi — Space OS" }],
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
  const prev = missions[(index - 1 + missions.length) % missions.length];

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
        figure={<Hologram src={mission.cover} seed={mission.slug} tag="REPORT" alt={`${mission.title} — interface`} priority />}
      />
      {/* Where this bay sits on the deck, and the two beside it. */}
      <Pager
        index={index}
        total={missions.length}
        prev={{ href: `/missions/${prev.slug}`, title: prev.title }}
        next={{ href: `/missions/${next.slug}`, title: next.title }}
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
          {mission.links?.length ? (
            <div className={ui.manifestCell}>
              <dt>Open it</dt>
              <dd>
                {mission.links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener" className={ui.manifestLink}>
                    {l.label}
                    <span aria-hidden="true"> ↗</span>
                  </a>
                ))}
              </dd>
            </div>
          ) : null}
          <div className={`${ui.manifestCell} ${ui.manifestWide}`}>
            <dt>Stack</dt>
            <dd>
              <TagRow items={mission.stack} />
            </dd>
          </div>
        </dl>
        <MissionSignature seed={mission.slug} width={640} height={90} className={ui.reportTrace} />

        {/* Success data. Measured numbers are big; where nothing is measured
            yet, the strip says so and lists what will be — a DRAFT, not a
            guess. */}
        <section className={ui.results} aria-label="Results" data-state={mission.results?.length ? "measured" : "pending"}>
          <p className={ui.resultsLabel}>
            <span>Results</span>
            <span className={ui.resultsState}>{mission.results?.length ? "Measured" : "Not yet measured"}</span>
          </p>
          {mission.results?.length ? (
            <dl className={ui.resultsGrid}>
              {mission.results.map((r) => (
                <div key={r.label} className={ui.resultCell}>
                  <dd className={ui.resultValue}>{r.value}</dd>
                  <dt className={ui.resultLabel}>
                    {r.label}
                    {r.source ? <span className={ui.resultSource}> · {r.source}</span> : null}
                  </dt>
                </div>
              ))}
            </dl>
          ) : null}
          {mission.measure?.length ? (
            <ul className={ui.measureList}>
              {mission.measure.map((it) => (
                <li key={it} className={ui.measureItem}>
                  <span className={ui.measureTick} aria-hidden="true" />
                  {it}
                </li>
              ))}
            </ul>
          ) : null}
          {!mission.results?.length && !mission.measure?.length ? (
            <p className={ui.measureNote}>Shipped. No public number attached — and none invented.</p>
          ) : null}
        </section>

        {/* Ownership. Three columns so the split is visible: what I
            decided, what I built, what was carried with the team. */}
        {mission.ownership ? (
          <section className={ui.ownership} aria-label="Ownership">
            {(
              [
                ["decided", "I decided"],
                ["built", "I built"],
                ["withTeam", "With the team"],
              ] as const
            ).map(([key, label]) =>
              mission.ownership?.[key]?.length ? (
                <div key={key} className={ui.ownCell}>
                  <p className={ui.ownLabel}>{label}</p>
                  <ul className={ui.ownList}>
                    {mission.ownership[key]!.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )}
          </section>
        ) : null}
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
        {/* The handoff: every report ends with the same three doors. */}
        <div className={ui.buttonRow} data-reveal>
          <ButtonLink href="/contact" primary>
            Open a channel
          </ButtonLink>
          <ButtonLink href="/Ali_Azam_Kazmi_.pdf" external>
            Résumé (PDF)
          </ButtonLink>
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
