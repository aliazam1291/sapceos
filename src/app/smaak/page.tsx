import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import SmaakPlanet from "@/components/smaak/SmaakPlanet";
import DomeGallery from "@/components/smaak/DomeGallery";
import Hologram from "@/components/Hologram";
import Bars from "@/components/Bars";
import { gallery } from "@/content/gallery";
import Comms from "@/components/Comms";
import { ButtonLink, NextStep, PageHeader, Readout, Section, SectionHead, ui } from "@/components/ui";
import { studio, studioAlso, studioKindLabel, studioPieces, type StudioKind } from "@/content/studio";
import { results } from "@/content/results";
import { plainName } from "@/content/pages";
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
 * ONE DOCUMENTED EXCEPTION TO THE SITE'S RULES LIVES ON THIS ROUTE, and it
 * is not an oversight; do not "fix" it without asking Ali.
 *
 *  VOICE. CLAUDE.md says the humour is mission control's, dry, one beat,
 *  never in a fact, and warns against a second kind. That rule governs
 *  Space OS. A designer's portfolio has its own mouth, and Ali asked for
 *  this one specifically. The joke is never on a client and never on a
 *  number — same floor as everywhere else.
 *
 * There used to be a second, COLOUR: this page was Smaak blue. Ali withdrew
 * it on 2026-09-28 ("better UI with our space theme"), and on 2026-09-30 the
 * last of the page that did not speak the site's language — the dome's
 * full-colour frames and thumbnail grid, the logos in brand colour — went
 * too. The furniture is Space OS; only the writing is Smaak's.
 *
 * What does NOT bend: every client, deliverable and industry here is from
 * PROFILE.md, and no outcome is claimed anywhere, because none is on file.
 * The clients' own numbers (a 1975 founding, a 100,000 sq ft showroom) are
 * theirs and are labelled as theirs.
 */

const clients = studioPieces.filter((p) => p.status === "client");
const withIndustry = clients.filter((c) => c.industry);
/*
 * Clients with work on file to show are projected; the rest are a roster
 * (2026-10-01). Ten identical full-width text rows read as a spreadsheet,
 * and the three with real covers are the three a visitor most wants to see.
 */
const featured = clients.filter((c) => c.cover);
const roster = clients.filter((c) => !c.cover);
const pad = (n: number) => String(n).padStart(2, "0");
const followers = results.find((r) => r.source.startsWith("Lean Multiverse"));
const years = new Date().getFullYear() - studio.since;
const KINDS: StudioKind[] = ["web", "brand", "print", "deck", "product"];
const delivered = KINDS.map((k) => ({ label: studioKindLabel[k], value: clients.filter((c) => c.kind === k).length }))
  .filter((d) => d.value > 0)
  .sort((a, b) => b.value - a.value);

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

      {/*
       * The site's own masthead (2026-09-28). This route used to carry a
       * bespoke hero in Smaak blue; Ali asked for the space theme, so it now
       * uses the same PageHeader as every other page — label, plain name,
       * title, lede, and the route's signature object in the right column.
       * The copy keeps its mouth; only the furniture changed.
       */}
      <PageHeader
        label={`${studio.name} · freelance design, since ${studio.since}`}
        plain={plainName["/smaak"]}
        title="Brands that look like they know what they're doing"
        lede="Usually because, by the end, they do. Logos, websites, product UI and the deck you raise on — for a seventy-year-old spice house, an interiors showroom, a web3 node platform and whoever emails next."
        figure={
          <SmaakPlanet
            label="An ochre world inside a faint emerald shell, circled by a thin data ring with points of light orbiting it. It tips and spins as the page scrolls."
          />
        }
        figureWidth={320}
      />
      <div className={ui.pageComms}>
        <Comms at="studio" />
      </div>

      <Section id="intro" data-section="The studio">
        <p className={styles.sub}>
          Run by {profile.name} alongside a full-time job building fleet software, which is either a red flag or the
          whole pitch, depending on how you feel about people who cannot sit still.
        </p>
        <div className={ui.buttonRow}>
          <ButtonLink href="/contact" primary>
            Start something
          </ButtonLink>
          <ButtonLink href={studio.behance} external>
            Behance
          </ButtonLink>
          <ButtonLink href={studio.figma} external>
            Figma
          </ButtonLink>
        </div>
        <div className={styles.status}>
          <Readout
            label="Studio status"
            items={[
              { value: studio.clients, suffix: "+", label: "Clients" },
              { value: years, label: "Years running", note: `since ${studio.since}` },
              { value: studio.sectors.length, label: "Sectors" },
              ...(followers ? [{ value: followers.magnitude, suffix: "+", label: "Audience of the largest brand", note: "Lean Multiverse" }] : []),
            ]}
          />
        </div>
      </Section>

      {/* ── The work, hung in a dome. ────────────────────────────────────── */}
      <Section id="work" data-section="The work">
        <SectionHead
          label={`Gallery · ${gallery.length}`}
          title="Stand in the middle of it"
          action={
            <p className={ui.sectionNote}>
              Drag to look around. Point at a piece and it drops the hologram act and shows you its real colours; click
              to open it where it lives. All {gallery.length} are listed underneath too — no work is hiding behind the
              WebGL.
            </p>
          }
        />
        <DomeGallery />
      </Section>

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

        {/* The three with work on file, projected — a client project is a
            project, and on this site a project is a hologram. */}
        <ol className={styles.featured}>
          {featured.map((c, i) => (
            <li key={c.slug} className={`${styles.bay} flies`} data-flight={i % 2 ? "right" : "left"} data-bay={c.slug}>
              <Hologram src={c.cover} seed={c.slug} tag={`C-${pad(i + 1)}`} alt={`${c.title} — ${studioKindLabel[c.kind]}`} />
              <div className={styles.bayBody}>
                <div className={styles.bayHead}>
                  <h3 className={styles.bayName}>
                    {c.site ? (
                      <a href={c.site} target="_blank" rel="noreferrer noopener" className={styles.clientLink}>
                        {c.title} <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      c.title
                    )}
                  </h3>
                  <span className={styles.kind}>{studioKindLabel[c.kind]}</span>
                </div>
                <p className={styles.clientBrief}>{c.brief}</p>
                {c.note ? <p className={styles.clientNote}>{c.note}</p> : null}
                {c.industry ? <span className={styles.industry}>{c.industry}</span> : null}
              </div>
            </li>
          ))}
        </ol>

        <p className={styles.rosterLabel}>
          Also on the list · {roster.length}
        </p>
        <ol className={styles.roster} start={featured.length + 1}>
          {roster.map((c, i) => (
            <li key={c.slug} className={styles.client}>
              <span className={styles.clientIndex}>{pad(featured.length + i + 1)}</span>

              <div className={styles.clientBody}>
                <div className={styles.clientHead}>
                  {c.logo ? (
                    <span className={styles.clientLogo}>
                      <Image src={c.logo} alt={`${c.title} logo`} width={96} height={28} />
                    </span>
                  ) : null}
                  <h3 className={styles.clientName}>
                    {c.site ? (
                      <a href={c.site} target="_blank" rel="noreferrer noopener" className={styles.clientLink}>
                        {c.title} <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      c.title
                    )}
                  </h3>
                </div>
                <p className={styles.clientBrief}>
                  {c.brief}
                  {c.note ? <span className={styles.clientNote}> · {c.note}</span> : null}
                </p>
                <div className={styles.clientMeta}>
                  <span className={styles.kind}>{studioKindLabel[c.kind]}</span>
                  {c.industry ? <span className={styles.industry}>{c.industry}</span> : null}
                </div>
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
        {/* The /flight-data instrument (2026-10-01): four boxed counters read
            as a SaaS stats strip; a bar per deliverable, out of the whole
            list, says the same thing in the site's own language. */}
        <Bars label="Deliverables across the client list" items={delivered} max={clients.length} unit={`of ${clients.length}`} />
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
