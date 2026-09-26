import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import SmaakPlanet from "@/components/smaak/SmaakPlanet";
import { ButtonLink, NextStep, Section, SectionHead, ui } from "@/components/ui";
import { studio, studioAlso, studioKindLabel, studioPieces } from "@/content/studio";
import { profile } from "@/content/profile";
import { breadcrumbJsonLd, jsonLd, personId } from "@/lib/seo";
import { identityKeywords, keywordsFor } from "@/lib/keywords";
import styles from "./smaak.module.scss";

/*
 * Smaak.ux, on its own page (2026-09-26). Ali: "I need a separate page for
 * smaak.ux, only my freelance work … it's gonna be my freelance portfolio
 * like a designer portfolio so be creative, sassy and have funny humour …
 * I need 3D scroll etc."
 *
 * TWO DOCUMENTED EXCEPTIONS TO THE SITE'S RULES LIVE ON THIS ROUTE. Neither
 * is an oversight; do not "fix" either without asking Ali.
 *
 *  1. COLOUR. Everything else is black + emerald, and a blue cast was tried
 *     and rejected on 2026-09-12. This page is Smaak blue, because Smaak.ux
 *     is a separate brand and this is its page inside the portfolio rather
 *     than another room of it. The blue lives in local custom properties on
 *     `.smaak` (see smaak.module.scss) — it never touches the tokens.
 *  2. VOICE. CLAUDE.md says the humour is mission control's, dry, one beat,
 *     never in a fact, and warns against a second kind. That rule governs
 *     Space OS. A designer's portfolio has its own mouth, and Ali asked for
 *     this one specifically. The joke is never on a client and never on a
 *     number — same floor as everywhere else.
 *
 * What does NOT bend: every client, deliverable and industry here is from
 * PROFILE.md, and no outcome is claimed anywhere, because none is on file.
 * The clients' own numbers (a 1975 founding, a 100,000 sq ft showroom) are
 * theirs and are labelled as theirs.
 */

const clients = studioPieces.filter((p) => p.status === "client");
const withIndustry = clients.filter((c) => c.industry);

const description = `Smaak.ux — the design studio Ali Azam Kazmi runs on the side: branding, website UI and pitch decks for ${clients.length} clients across spices, interiors and web3.`;

export const metadata: Metadata = {
  title: { absolute: "Smaak.ux — Freelance Design Studio · Ali Azam Kazmi" },
  description,
  keywords: keywordsFor(
    [
      "Smaak.ux",
      "Smaak ux studio",
      "freelance designer portfolio India",
      "freelance UI UX designer New Delhi",
      "brand identity designer India",
      "pitch deck designer",
      "web3 brand design",
      "packaging and FMCG branding",
    ],
    identityKeywords,
  ),
  alternates: { canonical: "/smaak" },
  openGraph: {
    type: "website",
    title: "Smaak.ux — Freelance Design Studio",
    description,
    url: "/smaak",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ali Azam Kazmi — Space OS" }],
  },
};

export default function SmaakPage() {
  return (
    <div className={styles.smaak}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: studio.name,
              description: `Freelance product and design studio founded by ${profile.name} in ${studio.since}. Branding, website UI, product design and pitch decks.`,
              foundingDate: String(studio.since),
              founder: { "@id": personId },
              url: "/smaak",
              sameAs: [studio.behance, studio.figma],
              knowsAbout: [...studio.sectors],
            },
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Smaak.ux", path: "/smaak" },
            ]),
          ),
        }}
      />

      {/* ── Hero. The object scrolls; the copy has a mouth. ───────────────── */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>
              {studio.name} <span className={styles.kickerPlain}>· freelance design, since {studio.since}</span>
            </p>
            <h1 className={styles.title}>
              I make brands that <span className={styles.em}>look</span> like they know what they&rsquo;re doing.
            </h1>
            <p className={styles.lede}>
              Usually because, by the end, they do. Logos, websites, product UI and the deck you raise on — for a
              seventy-year-old spice house, an interiors showroom, a web3 node platform and whoever emails next.
            </p>
            <p className={styles.sub}>
              Run by {profile.name} alongside a full-time job building fleet software, which is either a red flag or
              the whole pitch, depending on how you feel about people who cannot sit still.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primary} href="/contact">
                Start something
              </Link>
              <a className={styles.secondary} href={studio.behance} target="_blank" rel="noreferrer noopener">
                Behance <span aria-hidden="true">↗</span>
              </a>
              <a className={styles.secondary} href={studio.figma} target="_blank" rel="noreferrer noopener">
                Figma <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <SmaakPlanet
            className={styles.planet}
            label="A dark metallic planet inside a blue glass shell, circled by a thin data ring with points of light orbiting it. It tips and spins as the page scrolls."
          />
        </div>

        <p className={styles.scrollHint} aria-hidden="true">
          Scroll — the planet is load-bearing
        </p>
      </header>

      {/* ── The clients. ─────────────────────────────────────────────────── */}
      <Section id="clients" data-section="Clients">
        <SectionHead
          label={`Clients · ${clients.length}`}
          title="Who paid, and for what"
          action={
            <p className={ui.sectionNote}>
              The deliverable is what I was hired to make. The industry is what the client says they do, taken off their
              own site. Four of {clients.length} are documented that way so far — the rest are blank, because inventing a
              client&rsquo;s sector to fill a column is how you end up describing a spice brand as a SaaS.
            </p>
          }
        />

        <ol className={styles.clients}>
          {clients.map((c, i) => (
            <li key={c.slug} className={styles.client}>
              <span className={styles.clientIndex}>{String(i + 1).padStart(2, "0")}</span>

              <div className={styles.clientBody}>
                <div className={styles.clientHead}>
                  {c.logo ? (
                    <span className={styles.clientLogo}>
                      <Image src={c.logo} alt={`${c.title} logo`} width={96} height={28} />
                    </span>
                  ) : null}
                  <h2 className={styles.clientName}>
                    {c.site ? (
                      <a href={c.site} target="_blank" rel="noreferrer noopener" className={styles.clientLink}>
                        {c.title} <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      c.title
                    )}
                  </h2>
                </div>
                <p className={styles.clientBrief}>{c.brief}</p>
                {c.note ? <p className={styles.clientNote}>{c.note}</p> : null}
              </div>

              <div className={styles.clientMeta}>
                <span className={styles.kind}>{studioKindLabel[c.kind]}</span>
                {c.industry ? <span className={styles.industry}>{c.industry}</span> : null}
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Services, counted rather than claimed. ───────────────────────── */}
      <Section id="services" data-section="Services">
        <SectionHead
          label="What I actually do"
          title="Four things, and a lot of opinions"
          action={
            <p className={ui.sectionNote}>
              Counted from the client list above, not from a services page I wrote to look busy.
            </p>
          }
        />
        <ul className={styles.services}>
          {(["brand", "web", "deck", "print", "product"] as const).map((k) => {
            const n = clients.filter((c) => c.kind === k).length;
            if (n === 0) return null;
            return (
              <li key={k} className={styles.service}>
                <span className={styles.serviceCount}>{String(n).padStart(2, "0")}</span>
                <span className={styles.serviceLabel}>{studioKindLabel[k]}</span>
              </li>
            );
          })}
        </ul>
        <p className={styles.sectors}>
          Sectors so far: {studio.sectors.join(" · ")}. {withIndustry.length} of them documented client by client.
        </p>
      </Section>

      {/* ── The odds and ends. ───────────────────────────────────────────── */}
      <Section id="elsewhere" data-section="Elsewhere">
        <SectionHead
          label="Loose ends"
          title="Posters, templates, a mood board"
          action={<p className={ui.sectionNote}>Not everything is a case study. Some of it is just a nice poster.</p>}
        />
        <ul className={styles.also}>
          {studioAlso.map((a) => (
            <li key={a.href}>
              <a href={a.href} target="_blank" rel="noreferrer noopener" className={styles.alsoLink}>
                {a.title} <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
        <div className={ui.buttonRow}>
          <ButtonLink href="/studio" primary>
            The same work, with the covers
          </ButtonLink>
          <ButtonLink href="/contact">Hire the studio</ButtonLink>
        </div>
      </Section>

      <NextStep
        href="/missions"
        label="Next · Missions"
        title="The day job, which is also good"
        premise="Fleet and telematics platforms for two hundred thousand users. Fewer logos, more edge cases."
      />
    </div>
  );
}
