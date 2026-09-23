import type { Metadata } from "next";
import Link from "next/link";
import PageForm from "@/components/space/PageForm";
import Comms from "@/components/Comms";
import { NextStep, PageHeader, Section, SectionHead, ui } from "@/components/ui";
import { plainName } from "@/content/pages";
import { listedWriting } from "@/content/writing";
import { links } from "@/content/profile";
import { breadcrumbJsonLd, jsonLd, personId } from "@/lib/seo";
import { aiKeywords, contentKeywords, identityKeywords, keywordsFor, roleKeywords } from "@/lib/keywords";
import { siteUrl } from "@/lib/site";
import styles from "./writing.module.scss";

/*
 * Writing (2026-09-20): everything Ali has published, one log. The pieces
 * were scattered across Medium and dumbmoney.in; a recruiter judging product
 * thinking wants them in one place, newest first, with the outlet and one
 * line each. Text-only content, so a panel of rows is the right instrument;
 * the header object is the wireframe truss — a transmitter.
 */
export const metadata: Metadata = {
  title: { absolute: "Writing — AI & Product Management Essays · Ali Azam Kazmi" },
  description:
    "Essays by Ali Azam Kazmi on AI product management: PRDs for non-deterministic features, agents in production, and AI inside fleet software.",
  keywords: keywordsFor(aiKeywords, contentKeywords, identityKeywords, roleKeywords.slice(0, 8)),
  alternates: { canonical: "/writing" },
};

const medium = links.find((l) => l.label === "Medium")?.href ?? "https://medium.com/@aliazamkazmi1291";
const fmt = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

export default function WritingPage() {
  const sorted = [...listedWriting].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "@id": `${siteUrl}/writing`,
              url: `${siteUrl}/writing`,
              name: "Writing — Ali Azam Kazmi",
              author: { "@id": personId },
              hasPart: sorted.map((p) => ({ "@type": "Article", headline: p.title, url: p.href, datePublished: p.date, author: { "@id": personId }, publisher: { "@type": "Organization", name: p.outlet } })),
            },
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Writing", path: "/writing" },
            ]),
          ),
        }}
      />
      <PageHeader
        label="Writing"
        plain={plainName["/writing"]}
        title="Transmissions, in writing"
        lede="Essays, guides and one case study — on product strategy, UX and the software underneath. Newest first."
        figure={<PageForm form="truss" label="A slowly turning wireframe transmitter truss." size={240} />}
      />
      <div className={ui.pageComms}>
        <Comms at="writing" />
      </div>

      <Section id="log" data-section="Log">
        <SectionHead label={`Log · ${sorted.length} pieces`} title="What went out" />
        <ol className={styles.log} aria-label="Published writing, newest first">
          {sorted.map((p, i) => (
            <li key={p.href} className={styles.entry} data-reveal>
              <span className={styles.index}>{String(sorted.length - i).padStart(2, "0")}</span>
              <div className={styles.body}>
                <p className={styles.meta}>
                  <span className={styles.outlet} data-outlet={p.outlet}>
                    {p.outlet}
                  </span>
                  <span>{p.kind}</span>
                  <time dateTime={p.date}>{fmt(p.date)}</time>
                </p>
                <h3 className={styles.title}>
                  {p.outlet === "Space OS" ? (
                    <Link href={p.href} className={styles.link}>
                      {p.title}
                      {p.status === "draft" ? <span className={styles.draft}> · draft</span> : null}
                      <span className={styles.arrow} aria-hidden="true">
                        →
                      </span>
                    </Link>
                  ) : (
                    <a href={p.href} target="_blank" rel="noreferrer noopener" className={styles.link}>
                      {p.title}
                      <span className={styles.arrow} aria-hidden="true">
                        ↗
                      </span>
                    </a>
                  )}
                </h3>
                <p className={styles.line}>{p.line}</p>
                {p.related ? (
                  <p className={styles.related}>
                    <Link href={p.related.href}>{p.related.label} →</Link>
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        <p className={styles.foot}>
          Everything on Medium is at{" "}
          <a href={medium} target="_blank" rel="noreferrer noopener">
            medium.com/@aliazamkazmi1291
          </a>
          ; the DumbMoney pieces live on its blog.
        </p>
      </Section>

      <NextStep href="/field-notes" label="Next · Field notes" title="The case studies, carried in" premise="Teardowns of products I don't work on — drones inbound." />
    </>
  );
}
