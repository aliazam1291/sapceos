import type { Metadata } from "next";
import Hologram from "@/components/Hologram";
import RobotGuide from "@/components/RobotGuide";
import Comms from "@/components/Comms";
import { ButtonLink, NextStep, PageHeader, Readout, Section, SectionHead, Status, ui } from "@/components/ui";
import { studio, studioAlso, studioKindLabel, studioPieces } from "@/content/studio";
import { results } from "@/content/results";
import { identityKeywords, keywordsFor, skillKeywords } from "@/lib/keywords";
import { breadcrumbJsonLd, jsonLd } from "@/lib/seo";
import styles from "./studio.module.scss";

export const metadata: Metadata = {
  title: "Studio — Smaak.ux, Brand & Product Design",
  description:
    "Smaak.ux, Ali Azam Kazmi's design studio since 2023: brand identities, pitch decks, websites and product UI for ten clients, Lean Multiverse among them.",
  keywords: keywordsFor(identityKeywords, skillKeywords, [
    "Smaak.ux",
    "freelance product designer",
    "brand identity designer New Delhi",
    "pitch deck design",
    "Figma UI design",
    ...studioPieces.map((p) => p.title),
  ]),
  alternates: { canonical: "/studio" },
};

/**
 * The studio — the freelance practice, as a deck of its own (2026-09-19).
 *
 * Ali: "you didn't add my freelancing experience". It was on the site as a
 * logo grid; a recruiter saw eight marks and none of the work. This page
 * projects the work: the eight Smaak.ux clients (deliverable as PROFILE.md
 * states it — nothing about outcomes, because nothing is on file) and the
 * brand and product pieces from Behance. Projects are holograms, so each
 * piece stands on its own projector; where a client has no cover on file,
 * the mark itself is projected.
 *
 * The voice is the PM's: every brief is a decision about what to say first
 * and a thing that shipped, not a list of tools.
 */
export default function StudioPage() {
  const clients = studioPieces.filter((p) => p.status === "client");
  const independent = studioPieces.filter((p) => p.status === "independent");
  const followers = results.find((r) => r.source.startsWith("Lean Multiverse"));
  const lead = studioPieces.find((p) => p.slug === "lean-multiverse")!;
  const years = new Date().getFullYear() - studio.since;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Studio", path: "/studio" },
            ]),
          ),
        }}
      />
      <PageHeader
        label={`${studio.name} · Studio · since ${studio.since}`}
        title="The studio"
        lede="A product and design practice on the side of the day job. Ten clients across SaaS, creator brands, e-commerce, home décor and services — each one a brief, a decision about what to say first, and a thing that shipped."
        figure={<Hologram src={lead.cover} seed={lead.slug} tag="STUDIO" alt={`${lead.title} — ${studioKindLabel[lead.kind]}`} priority />}
      />
      <div className={ui.pageComms}>
        <Comms at="studio" />
      </div>

      <Section id="clients" data-section="Clients">
        <Readout
          label="Studio status"
          items={[
            { value: studio.clients, suffix: "+", label: "Clients" },
            { value: years, label: "Years running", note: `since ${studio.since}` },
            { value: studio.sectors.length, label: "Sectors", note: studio.sectors.join(" · ") },
            ...(followers ? [{ value: followers.magnitude, suffix: "+", label: "Audience of the largest brand", note: "Lean Multiverse" }] : []),
          ]}
        />

        <SectionHead label={`Client work · ${clients.length}`} title="What was on the brief" />
        <RobotGuide
          name="K-7"
          idle={`Studio floor. ${clients.length} client bays and ${independent.length} of the founder's own. Hover one.`}
          lines={Object.fromEntries(studioPieces.map((p, i) => [p.slug, `BAY ${String(i + 1).padStart(2, "0")} · ${p.title} · ${studioKindLabel[p.kind].toLowerCase()} · ${p.status === "client" ? "client" : "independent"}`]))}
        />
        <div className={ui.projectorGrid}>
          {clients.map((p, i) => (
            <Piece key={p.slug} piece={p} index={i} />
          ))}
        </div>
      </Section>

      <Section id="independent" data-section="Independent">
        <SectionHead
          label={`Independent · ${independent.length}`}
          title="Briefs I wrote myself"
          action={
            <ButtonLink href={studio.behance} external>
              All of it on Behance
            </ButtonLink>
          }
        />
        <div className={ui.projectorGrid}>
          {independent.map((p, i) => (
            <Piece key={p.slug} piece={p} index={clients.length + i} />
          ))}
        </div>
        <p className={styles.also}>
          <span className={ui.labelRule}>Also on Behance</span>
          {studioAlso.map((a, i) => (
            <span key={a.href}>
              {i > 0 ? " · " : " "}
              <a href={a.href} target="_blank" rel="noreferrer noopener">
                {a.title}
              </a>
            </span>
          ))}
        </p>
      </Section>

      <NextStep
        href="/missions"
        label="Next · Missions"
        title="The day job: platforms for 200,000+ users"
        premise="Enterprise fleet and telematics products — the problem, the decisions and what shipped on each."
      />
    </>
  );
}

function Piece({ piece, index }: { piece: (typeof studioPieces)[number]; index: number }) {
  const src = piece.cover ?? piece.logo;
  return (
    <article className={`${ui.projectorCell} flies`} data-bay={piece.slug} data-flight={index % 2 ? "right" : "left"}>
      <div className={ui.cardTop}>
        <span className={ui.entryIndex}>BAY {String(index + 1).padStart(2, "0")}</span>
        <Status idle={piece.status !== "client"}>{piece.status === "client" ? "Client" : "Independent"}</Status>
      </div>

      <Hologram src={src} seed={piece.slug} tag={studioKindLabel[piece.kind].toUpperCase()} alt={`${piece.title} — ${studioKindLabel[piece.kind]}`} fit={piece.cover ? "cover" : "contain"} />

      <h3 className={ui.cardTitle}>{piece.title}</h3>
      <p className={ui.cardPremise}>
        {piece.brief}
        {piece.note ? <span className={styles.note}> · {piece.note}</span> : null}
      </p>
      <div className={styles.foot}>
        <span className={styles.kind}>{studioKindLabel[piece.kind]}</span>
        {piece.behance ? (
          <a className={styles.link} href={piece.behance} target="_blank" rel="noreferrer noopener">
            Open on Behance <span aria-hidden="true">↗</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}
