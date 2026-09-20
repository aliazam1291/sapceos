/*
 * The site's absolute origin — every canonical, OG image, sitemap entry and
 * robots line is built from it, so it must match the host the page is served
 * from (Search Console rejects a sitemap whose URLs are on another host:
 * "URL not allowed for a Sitemap at this location", 2026-09-20).
 *
 * Order: an explicit NEXT_PUBLIC_SITE_URL (set this in Vercel once the custom
 * domain is live), else Vercel's own production host, else the custom domain.
 */
const explicit = process.env.NEXT_PUBLIC_SITE_URL;
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

export const siteUrl = (explicit ?? (vercel ? `https://${vercel}` : "https://aliazamkazmi.com")).replace(/\/$/, "");
