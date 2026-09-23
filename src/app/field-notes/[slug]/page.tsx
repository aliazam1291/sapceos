import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Body, ButtonLink, DraftFlag, NextStep, PageHeader, Pager, Section, ui } from "@/components/ui";
import { plainKind } from "@/content/pages";
import RelatedWriting from "@/components/RelatedWriting";
import Drone from "@/components/Drone";
import { fieldNotes, getFieldNote } from "@/content/field-notes";
import { DRAFT } from "@/content/types";
import { breadcrumbJsonLd, clipDescription, jsonLd, noteJsonLd } from "@/lib/seo";
import { contentKeywords, identityKeywords, keywordsFor, roleKeywords } from "@/lib/keywords";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return fieldNotes.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const note = getFieldNote(slug);
  if (!note) return {};
  const description = clipDescription(`${note.premise} An independent product case study by Ali Azam Kazmi.`);
  const title = clipDescription(`${note.title} — Ali Azam Kazmi`, 62);
  return {
    title: { absolute: title },
    description,
    keywords: keywordsFor([note.title, `${note.title} case study`, `${note.title} analysis`], contentKeywords, identityKeywords, roleKeywords.slice(0, 6)),
    alternates: { canonical: `/field-notes/${note.slug}` },
    openGraph: {
      type: "article",
      title: note.title,
      description,
      url: `/field-notes/${note.slug}`,
      publishedTime: note.published,
      authors: ["Ali Azam Kazmi"],
      images: note.cover
        ? [{ url: note.cover, width: 1200, height: 675, alt: note.title }]
        : [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ali Azam Kazmi — Space OS" }],
    },
    twitter: { card: "summary_large_image", title: note.title, description },
  };
}

export default async function FieldNote({ params }: Params) {
  const { slug } = await params;
  const note = getFieldNote(slug);
  if (!note) notFound();

  const unpublished = note.body.every((p) => p.startsWith(DRAFT));

  // Mission reports already hand you the next one; field notes stopped dead at
  // a "back to index" button, which sends a reader who just finished one piece
  // back to a grid to re-choose rather than straight into the next piece.
  const index = fieldNotes.findIndex((n) => n.slug === note.slug);
  const next = fieldNotes[(index + 1) % fieldNotes.length];
  const prev = fieldNotes[(index - 1 + fieldNotes.length) % fieldNotes.length];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            noteJsonLd(note),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Field notes", path: "/field-notes" },
              { name: note.title, path: `/field-notes/${note.slug}` },
            ]),
          ),
        }}
      />
      <PageHeader
        label="Field Note · Independent analysis"
        plain={plainKind.note}
        title={note.title}
        lede={note.premise}
        figure={<Drone src={note.cover} seed={note.slug} tag={`FN-${String(index + 1).padStart(2, "0")}`} sub={note.kind.replace(/-/g, " ")} label={note.title} priority />}
      />
      {fieldNotes.length > 1 ? (
        <Pager
          unit="Note"
          index={index}
          total={fieldNotes.length}
          prev={{ href: `/field-notes/${prev.slug}`, title: prev.title }}
          next={{ href: `/field-notes/${next.slug}`, title: next.title }}
        />
      ) : null}

      <Section>
        {unpublished ? (
          <div className={ui.notice} data-reveal>
            <DraftFlag note="analysis not yet written" />
            <p className={ui.noticeText}>
              The premise is set; the argument is not written yet. This note stays unpublished
              until it says something worth disagreeing with.
            </p>
          </div>
        ) : (
          <div className={ui.prose} data-reveal>
            <Body value={note.body} subheadLevel="h2" />
          </div>
        )}

        <RelatedWriting href={`/field-notes/${note.slug}`} />

        <div className={ui.buttonRow} style={{ marginTop: "var(--space-12)" }}>
          <ButtonLink href="/field-notes">← All field notes</ButtonLink>
        </div>
      </Section>

      {next.slug !== note.slug ? (
        <NextStep
          href={`/field-notes/${next.slug}`}
          label="Next field note"
          title={next.title}
          premise={next.premise}
        />
      ) : null}
    </>
  );
}
