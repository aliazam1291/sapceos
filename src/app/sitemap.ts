import type { MetadataRoute } from "next";
import { missions } from "@/content/missions";
import { fieldNotes } from "@/content/field-notes";
import { hostedWriting } from "@/content/writing";
import { orbitHasContent } from "@/content/orbit";
import { siteUrl } from "@/lib/site";

/*
 * lastModified is a real date, never the build time (2026-10-15). Every page
 * used to carry `new Date()`, so all 31 changed on every deploy; Google
 * learns that a site's lastmod is noise and stops reading it, which is the
 * opposite of what a site waiting to be recrawled needs. Bump CONTENT_DATE
 * when page copy changes; a mission with its own `updated` overrides it.
 */
const CONTENT_DATE = new Date("2026-10-15");

export default function sitemap(): MetadataRoute.Sitemap {

  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/missions", priority: 0.9 },
    { path: "/lab", priority: 0.7 },
    { path: "/studio", priority: 0.8 },
    { path: "/dumbmoney", priority: 0.9 },
    { path: "/writing", priority: 0.7 },
    // Submitted only once it has content — same gate as the Nav and Footer
    // links (src/content/orbit.ts). A page whose four rows all read "needs
    // input" should not be handed to a search engine either; the route stays
    // reachable by URL, it just is not advertised anywhere while it is empty.
    ...(orbitHasContent ? [{ path: "/orbit", priority: 0.5 }] : []),
    { path: "/field-notes", priority: 0.8 },
    { path: "/galaxy", priority: 0.5 },
    { path: "/decisions", priority: 0.8 },
    { path: "/flight-data", priority: 0.7 },
    { path: "/faq", priority: 0.7 },
    // The recruiter brief: the page a "technical PM New Delhi" search should
    // land on (2026-10-24).
    { path: "/hire", priority: 0.9 },
    { path: "/smaak", priority: 0.8 },
    { path: "/about", priority: 0.8 },
    { path: "/mission-history", priority: 0.8 },
    { path: "/contact", priority: 0.6 },
  ].map((r) => ({
    url: `${siteUrl}${r.path}`,
    lastModified: CONTENT_DATE,
    priority: r.priority,
  }));

  return [
    ...staticRoutes,
    ...missions.map((m) => ({
      url: `${siteUrl}/missions/${m.slug}`,
      lastModified: m.updated ? new Date(m.updated) : CONTENT_DATE,
      priority: 0.8,
    })),
    ...fieldNotes.map((n) => ({
      url: `${siteUrl}/field-notes/${n.slug}`,
      lastModified: CONTENT_DATE,
      priority: 0.7,
    })),
    // Hosted writing: published pieces only — a draft is never advertised.
    ...hostedWriting
      .filter((p) => p.status === "published")
      .map((p) => ({
        url: `${siteUrl}/writing/${p.slug}`,
        lastModified: new Date(p.date),
        priority: 0.7,
      })),
  ];
}
