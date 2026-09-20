import type { Metadata } from "next";
import Image from "next/image";
import { Body, ButtonLink, NextStep, PageHeader, Row, Section, SectionHead, Status, ui } from "@/components/ui";
import ReportNav, { ReportLayout } from "@/components/ReportNav";
import Hologram from "@/components/Hologram";
import Comms from "@/components/Comms";
import { sectionSlug } from "@/lib/slug";
import { venture } from "@/content/venture";
import { profile } from "@/content/profile";
import { breadcrumbJsonLd, clipDescription, jsonLd, ventureJsonLd } from "@/lib/seo";
import { domainKeywords, identityKeywords, keywordsFor } from "@/lib/keywords";
import styles from "./dumbmoney.module.scss";

/*
 * The venture (2026-09-20). Ali: "you haven't mentioned DumbMoney — I am the
 * founder and CPO, there is a link, and I need a dedicated page." This is
 * that page. It is a mission report in shape — the interface projected
 * beside the title, a manifest, the results strip, ownership, the report
 * rows — because a company Ali founded is still a project, and projects
 * are holograms. What is different: the manifest carries the link and the
 * co-founder; the results strip is honestly pending (the site's own public
 * counters disagree with each other, so none is a result here); and the
 * page ends on the product, not on the résumé.
 */

const description = clipDescription(`${venture.premise} Founded by ${profile.name} (Founder & CPO) with ${venture.cofounder.name}. ${venture.urlLabel}.`);

export const metadata: Metadata = {
  title: { absolute: `DumbMoney — Founder & CPO · ${profile.name}` },
  description,
  keywords: keywordsFor(["DumbMoney", "dumbmoney.in", "coupon platform India", "founder", "chief product officer", "CPO", "startup founder product"], identityKeywords, domainKeywords),
  alternates: { canonical: "/dumbmoney" },
  openGraph: {
    type: "article",
    title: `DumbMoney — ${venture.role}`,
    description,
    url: "/dumbmoney",
    images: [{ url: venture.cover, width: 1440, height: 810, alt: "DumbMoney — the deals catalogue" }],
  },
  twitter: { card: "summary_large_image", title: `DumbMoney — ${venture.role}`, description },
};

export default function VenturePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            ventureJsonLd(venture),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "DumbMoney", path: "/dumbmoney" },
            ]),
          ),
        }}
      />
      <PageHeader
        label={`Venture · ${venture.role}`}
        title={venture.title}
        lede={venture.premise}
        figure={<Hologram src={venture.cover} seed={venture.slug} tag="VENTURE" priority />}
      />
      <div className={ui.pageComms}>
        <Comms at="venture" />
      </div>

      <Section id="manifest" data-section="Manifest">
        <dl className={ui.manifest} data-reveal>
          <div className={ui.manifestCell}>
            <dt>Status</dt>
            <dd>
              <Status>Live</Status>
            </dd>
          </div>
          <div className={ui.manifestCell}>
            <dt>Role</dt>
            <dd>{venture.role}</dd>
          </div>
          <div className={ui.manifestCell}>
            <dt>With</dt>
            <dd>
              {venture.cofounder.name}
              <span className={styles.dim}> · {venture.cofounder.role}</span>
            </dd>
          </div>
          <div className={ui.manifestCell}>
            <dt>Market</dt>
            <dd>{venture.market}</dd>
          </div>
          <div className={`${ui.manifestCell} ${ui.manifestWide}`}>
            <dt>Where</dt>
            <dd>
              <a className={styles.siteLink} href={venture.url} target="_blank" rel="noreferrer noopener">
                {venture.urlLabel}
                <span aria-hidden="true"> ↗</span>
              </a>
              <span className={styles.tagline}>
                “{venture.tagline.text}” <span className={styles.dim}>— {venture.tagline.source}</span>
              </span>
            </dd>
          </div>
        </dl>

        {/* Success data: pending, and said so. The site's public counters
            are not transcribed here — they disagree with each other, and
            PROFILE.md line 49 stands. */}
        <section className={ui.results} aria-label="Results" data-state="pending">
          <p className={ui.resultsLabel}>
            <span>Results</span>
            <span className={ui.resultsState}>Not yet measured</span>
          </p>
          <ul className={ui.measureList}>
            {venture.measure.map((it) => (
              <li key={it} className={ui.measureItem}>
                <span className={ui.measureTick} aria-hidden="true" />
                {it}
              </li>
            ))}
          </ul>
        </section>

        <section className={ui.ownership} aria-label="Ownership">
          {(
            [
              ["decided", "I decided"],
              ["built", "I built"],
              ["withTeam", "With the team"],
            ] as const
          ).map(([key, label]) =>
            venture.ownership[key]?.length ? (
              <div key={key} className={ui.ownCell}>
                <p className={ui.ownLabel}>{label}</p>
                <ul className={ui.ownList}>
                  {venture.ownership[key]!.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </section>
      </Section>

      <ReportLayout>
        <ReportNav labels={venture.report.map((s) => s.label)} />
        <div className={ui.rows}>
          {venture.report.map((section) => (
            <div key={section.label} id={sectionSlug(section.label)} data-section={section.label}>
              <Row label={section.label}>
                <Body value={section.body} />
              </Row>
            </div>
          ))}
        </div>
      </ReportLayout>

      {/* The product in the hand: the phone capture beside what I wrote for
          it. Objects, not cards — the phone stands on the floor line. */}
      <Section id="writing" data-section="Writing">
        <SectionHead label="From the blog" title="Written for the week before a sale" />
        <div className={styles.writing} data-reveal>
          <figure className={styles.phone}>
            <Image src={venture.coverPhone} alt="DumbMoney on a phone" width={390} height={844} sizes="(max-width: 767px) 60vw, 260px" />
            <figcaption className={styles.phoneCaption}>{venture.urlLabel} · phone</figcaption>
          </figure>
          <ol className={styles.posts}>
            {venture.writing.map((w, i) => (
              <li key={w.href} className={styles.post}>
                <span className={styles.postIndex}>{String(i + 1).padStart(2, "0")}</span>
                <a href={w.href} target="_blank" rel="noreferrer noopener" className={styles.postLink}>
                  {w.title}
                </a>
                <span className={styles.postMeta}>{w.date} · dumbmoney.in</span>
              </li>
            ))}
            <li className={`${styles.post} ${styles.postLineage}`}>
              <span className={styles.postIndex}>—</span>
              <a href={venture.lineage.href} target="_blank" rel="noreferrer noopener" className={styles.postLink}>
                {venture.lineage.label}
              </a>
              <span className={styles.postMeta}>behance.net</span>
            </li>
          </ol>
        </div>
      </Section>

      <Section>
        <div className={ui.buttonRow} data-reveal>
          <ButtonLink href={venture.url} external primary>
            Visit dumbmoney.in
          </ButtonLink>
          <ButtonLink href="/contact">Open a channel</ButtonLink>
          <ButtonLink href="/Ali_Azam_Kazmi_.pdf" external>
            Résumé (PDF)
          </ButtonLink>
        </div>
      </Section>

      <NextStep href="/missions" label="Next · Missions" title="The hangar deck" premise="The platform work: fleet and telematics products for two hundred thousand users, and what each one insisted on." />
    </>
  );
}
