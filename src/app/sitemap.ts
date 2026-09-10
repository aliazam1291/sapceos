import type { MetadataRoute } from "next";
import { missions } from "@/content/missions";
import { fieldNotes } from "@/content/field-notes";
import { orbitHasContent } from "@/content/orbit";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/missions", priority: 0.9 },
    { path: "/lab", priority: 0.7 },
    // Submitted only once it has content — same gate as the Nav and Footer
    // links (src/content/orbit.ts). A page whose four rows all read "needs
    // input" should not be handed to a search engine either; the route stays
    // reachable by URL, it just is not advertised anywhere while it is empty.
    ...(orbitHasContent ? [{ path: "/orbit", priority: 0.5 }] : []),
    { path: "/field-notes", priority: 0.7 },
    { path: "/about", priority: 0.8 },
    { path: "/mission-history", priority: 0.8 },
    { path: "/contact", priority: 0.6 },
  ].map((r) => ({
    url: `${siteUrl}${r.path}`,
    lastModified: now,
    priority: r.priority,
  }));

  return [
    ...staticRoutes,
    ...missions.map((m) => ({
      url: `${siteUrl}/missions/${m.slug}`,
      lastModified: now,
      priority: 0.8,
    })),
    ...fieldNotes.map((n) => ({
      url: `${siteUrl}/field-notes/${n.slug}`,
      lastModified: now,
      priority: 0.6,
    })),
  ];
}
