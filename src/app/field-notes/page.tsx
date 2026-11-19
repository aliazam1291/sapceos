import Crumbs from "@/components/Crumbs";
import type { Metadata } from "next";
import NoteFlight from "@/components/NoteFlight";
import Drone from "@/components/Drone";
import CaseStudyIndex from "@/components/CaseStudyIndex";
import { NextStep, PageHeader, Section, SectionHead, ui } from "@/components/ui";
import { fieldNotes } from "@/content/field-notes";
import { missions } from "@/content/missions";
import { contentKeywords, identityKeywords, keywordsFor, roleKeywords } from "@/lib/keywords";
import { jsonLd, personId, siteId } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import Comms from "@/components/Comms";
import { plainName } from "@/content/pages";

/*
 * "Case Studies" in the nav (2026-11-19). Ali: "case studies not seen on my
 * website". This page used to hold only the six teardowns of other
 * companies' products, and said so ("not case studies for hire"); his own
 * product case studies were under Projects and nowhere a reader looking for
 * case studies would land. Now his own work comes first — products he owns,
 * then client builds — and the teardowns follow as their own section.
 */
const own = [
  ...missions.filter((m) => m.group === "owned"),
  ...missions.filter((m) => m.group === "client"),
];

export const metadata: Metadata = {
  title: { absolute: "Case Studies — Product & UX Work · Ali Azam Kazmi" },
  description:
    "Product case studies by Ali Azam Kazmi: Mappls Intouch, Indane Yatra Mitra, Mappls Shop, Driver Safety and a Tata Power dashboard, plus six product teardowns.",
  keywords: keywordsFor(
    ["product case studies", "product manager case study", "product owner portfolio", "UX case study", "fleet management case study", "B2B SaaS case study"],
    own.map((m) => `${m.title} case study`),
    identityKeywords,
    contentKeywords,
    roleKeywords,
  ),
  alternates: { canonical: "/field-notes" },
  openGraph: {
    title: "Case Studies — Ali Azam Kazmi",
    description: "Products I own and build at MapMyIndia, then teardowns of products I don't.",
    url: "/field-notes",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ali Azam Kazmi — case studies" }],
  },
};

function collectionJsonLd() {
  const items = [
    ...own.map((m) => ({ url: `${siteUrl}/missions/${m.slug}`, name: `${m.title} — Case Study` })),
    ...fieldNotes.map((n) => ({ url: `${siteUrl}/field-notes/${n.slug}`, name: n.title })),
  ];
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteUrl}/field-notes`,
    url: `${siteUrl}/field-notes`,
    name: "Case Studies — Ali Azam Kazmi",
    about: { "@id": personId },
    author: { "@id": personId },
    isPartOf: { "@id": siteId },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, url: it.url, name: it.name })),
    },
  };
}

export default function FieldNotesPage() {
  return (
    <>
      <Crumbs name="Case studies" path="/field-notes" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(collectionJsonLd()) }} />
      <PageHeader
        label="Field Notes"
        plain={plainName["/field-notes"]}
        title="Case studies: my products first, then other people's"
        lede="Products I own and build at MapMyIndia, written up as problem, approach, ownership and results. Then six independent teardowns of products I don't work on."
        figure={<Drone src={fieldNotes[0].cover} seed={fieldNotes[0].slug} tag="FN-01" sub="case study" label={fieldNotes[0].title} priority />}
      />
      <div className={ui.pageComms}>
        <Comms at="fieldNotes" />
      </div>

      <Section id="product-case-studies" data-section="My work">
        <SectionHead label="01 / My work" title="Product case studies" />
        <CaseStudyIndex missions={own} />
      </Section>

      <Section id="teardowns" data-section="Teardowns">
        <SectionHead label="02 / Teardowns" title="Products I don't work on, read closely" />
        <NoteFlight notes={fieldNotes} />
      </Section>
      <NextStep
        href="/missions"
        label="Next · Projects"
        title="Every project, with results"
        premise="The full list of platforms and products shipped, sorted by what was measured."
      />
    </>
  );
}
