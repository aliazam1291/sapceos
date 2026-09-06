import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Body, ButtonLink, DraftFlag, NextStep, PageHeader, Section, ui } from "@/components/ui";
import { fieldNotes, getFieldNote } from "@/content/field-notes";
import { DRAFT } from "@/content/types";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return fieldNotes.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const note = getFieldNote(slug);
  if (!note) return {};
  return {
    title: note.title,
    description: note.premise,
    alternates: { canonical: `/field-notes/${note.slug}` },
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

  return (
    <>
      <PageHeader
        label="Field Note · Independent analysis"
        title={note.title}
        lede={note.premise}
      />

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
            <Body value={note.body} />
          </div>
        )}

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
