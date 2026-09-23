import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageForm from "@/components/space/PageForm";
import { Body, ButtonLink, DraftFlag, NextStep, PageHeader, Section, ui } from "@/components/ui";
import { hostedWriting, isLive, writing } from "@/content/writing";
import { breadcrumbJsonLd, clipDescription, jsonLd, pieceJsonLd } from "@/lib/seo";
import { contentKeywords, identityKeywords, keywordsFor, roleKeywords, aiKeywords } from "@/lib/keywords";
import styles from "../writing.module.scss";

/*
 * A piece written and hosted here (2026-09-21). Same shape as a field note
 * — header, prose, the hand-off — with the transmitter truss as its object.
 * A draft (status "draft") builds and renders in development so Ali can read
 * it at /writing/<slug> on his own server; in production it is a 404, off
 * the index and out of the sitemap until he flips it to "published".
 */
type Params = { params: Promise<{ slug: string }> };

const fmt = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

export function generateStaticParams() {
  return hostedWriting.filter(isLive).map((p) => ({ slug: p.slug! }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const piece = hostedWriting.find((p) => p.slug === slug);
  if (!piece || !isLive(piece)) return {};
  const description = clipDescription(`${piece.line} By Ali Azam Kazmi.`);
  return {
    title: { absolute: clipDescription(`${piece.title} — Ali Azam Kazmi`, 62) },
    description,
    // The AI set only on the pieces that are about AI — a keyword with no
    // page behind it is what engines score as spam (2026-09-23).
    keywords: keywordsFor(
      [piece.title],
      /\bAI\b|agent|PRD|model/i.test(`${piece.title} ${piece.line}`) ? aiKeywords : [],
      contentKeywords,
      identityKeywords,
      roleKeywords.slice(0, 6),
    ),
    alternates: { canonical: `/writing/${piece.slug}` },
    openGraph: {
      type: "article",
      title: piece.title,
      description,
      url: `/writing/${piece.slug}`,
      publishedTime: piece.date,
      authors: ["Ali Azam Kazmi"],
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ali Azam Kazmi — Space OS" }],
    },
    twitter: { card: "summary_large_image", title: piece.title, description },
  };
}

export default async function WritingPiece({ params }: Params) {
  const { slug } = await params;
  const piece = hostedWriting.find((p) => p.slug === slug);
  if (!piece || !piece.body || !isLive(piece)) notFound();

  // Next: the newest other piece anywhere (hosted or not), so a reader keeps going.
  const others = [...writing].filter((p) => p !== piece && (p.outlet !== "Space OS" || isLive(p))).sort((a, b) => (a.date < b.date ? 1 : -1));
  const next = others[0];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            pieceJsonLd(piece),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Writing", path: "/writing" },
              { name: piece.title, path: `/writing/${piece.slug}` },
            ]),
          ),
        }}
      />
      <PageHeader
        label={`Writing · ${piece.kind} · ${fmt(piece.date)}`}
        title={piece.title}
        lede={piece.line}
        figure={<PageForm form="truss" label="A slowly turning wireframe transmitter truss." size={240} />}
      />

      <Section>
        {piece.status === "draft" ? (
          <div className={ui.notice} data-reveal>
            <DraftFlag note="draft — development only" />
            <p className={ui.noticeText}>This piece is a draft. It renders here for review and is not published, indexed or in the sitemap.</p>
          </div>
        ) : null}
        <div className={ui.prose} data-reveal>
          <Body value={piece.body} subheadLevel="h2" />
        </div>
        {piece.related ? (
          <p className={styles.related} style={{ marginTop: "var(--space-8)" }}>
            <Link href={piece.related.href}>{piece.related.label} →</Link>
          </p>
        ) : null}
        <div className={ui.buttonRow} style={{ marginTop: "var(--space-12)" }}>
          <ButtonLink href="/writing">← All writing</ButtonLink>
          <ButtonLink href="/contact">Open a channel</ButtonLink>
        </div>
      </Section>

      {next ? <NextStep href={next.href} label={`Next · ${next.outlet}`} title={next.title} premise={next.line} /> : null}
    </>
  );
}
