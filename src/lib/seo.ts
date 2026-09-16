import { links, profile } from "@/content/profile";
import type { FieldNote, Mission } from "@/content/types";
import { siteUrl } from "./site";
import { contentKeywords, domainKeywords, skillKeywords } from "./keywords";

/*
 * Structured data, in one place.
 *
 * Search engines read JSON-LD for entity understanding — who this person is,
 * what this page is a report of, how the site is organised. Every builder
 * here draws only on PROFILE-sourced content, so the schema never claims
 * more than the page does.
 */

export const personId = `${siteUrl}/#person`;
export const siteId = `${siteUrl}/#website`;

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": personId,
    name: profile.name,
    url: siteUrl,
    image: `${siteUrl}/images/ali.jpg`,
    jobTitle: profile.title,
    description:
      "Product engineer and UX strategist building enterprise fleet and telematics platforms; targeting product management roles.",
    worksFor: {
      "@type": "Organization",
      name: "MapMyIndia",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "New Delhi",
      addressCountry: "IN",
    },
    email: `mailto:${profile.email}`,
    knowsAbout: ["Product management", "UX strategy", "Frontend engineering", ...domainKeywords, ...skillKeywords],
    alumniOf: { "@type": "CollegeOrUniversity", name: "SRM Institute of Science and Technology" },
    nationality: "IN",
    sameAs: links.map((l) => l.href),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": siteId,
    url: siteUrl,
    name: `${profile.name} — Space OS`,
    description: "Product engineering, UX strategy and product case studies by Ali Azam Kazmi.",
    keywords: [...domainKeywords, ...contentKeywords].join(", "),
    inLanguage: "en",
    author: { "@id": personId },
    publisher: { "@id": personId },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${siteUrl}${it.path}`,
    })),
  };
}

export function missionJsonLd(mission: Mission) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${siteUrl}/missions/${mission.slug}`,
    url: `${siteUrl}/missions/${mission.slug}`,
    name: mission.title,
    headline: `${mission.title} — Mission Report`,
    description: mission.premise,
    image: mission.cover ? `${siteUrl}${mission.cover}` : undefined,
    author: { "@id": personId },
    creator: { "@id": personId },
    sourceOrganization: { "@type": "Organization", name: mission.org },
    keywords: [mission.org, ...mission.stack].join(", "),
    inLanguage: "en",
    isPartOf: { "@id": siteId },
  };
}

export function noteJsonLd(note: FieldNote) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${siteUrl}/field-notes/${note.slug}`,
    url: `${siteUrl}/field-notes/${note.slug}`,
    headline: note.title,
    description: note.premise,
    image: note.cover ? `${siteUrl}${note.cover}` : undefined,
    author: { "@id": personId },
    publisher: { "@id": personId },
    datePublished: note.published,
    articleSection: note.kind === "case-study" ? "Product case study" : "Note",
    inLanguage: "en",
    isPartOf: { "@id": siteId },
    // Wordcount helps the crawler weigh it as a real article, not a stub.
    wordCount: note.body.join(" ").split(/\s+/).length,
  };
}

/** Renders one or more JSON-LD graphs as a script tag's text. */
export function jsonLd(...graphs: object[]) {
  return JSON.stringify(graphs.length === 1 ? graphs[0] : graphs);
}
