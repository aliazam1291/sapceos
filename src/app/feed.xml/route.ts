import { listedWriting } from "@/content/writing";
import { fieldNotes } from "@/content/field-notes";
import { profile } from "@/content/profile";
import { siteUrl } from "@/lib/site";

/*
 * RSS (2026-09-23). The essays had no way out of this site: no feed, so no
 * reader app, no newsletter service, no aggregator could pick one up, and
 * anyone who wanted to follow the writing had to remember to come back.
 *
 * Carries the hosted essays and the field notes — everything written here.
 * External pieces (Medium, dumbmoney.in) have their own feeds and are left
 * to them. `description` is each piece's own one-liner, never an excerpt:
 * a feed that reprints the article gives a reader no reason to open it.
 */

export const dynamic = "force-static";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const items = [
    ...listedWriting
      .filter((p) => p.outlet === "Space OS")
      .map((p) => ({ title: p.title, path: p.href, date: p.date, line: p.line, kind: "Essay" })),
    ...fieldNotes.map((n) => ({
      title: n.title,
      path: `/field-notes/${n.slug}`,
      date: n.published ?? "2026-09-15",
      line: n.premise,
      kind: "Field note",
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(profile.name)} — Space OS</title>
    <link>${siteUrl}/writing</link>
    <description>Essays and product teardowns by ${esc(profile.name)}: PRDs, AI features, fleet platforms and the decisions behind them.</description>
    <language>en</language>
    <managingEditor>${esc(profile.email)} (${esc(profile.name)})</managingEditor>
    <lastBuildDate>${new Date(items[0]?.date ?? Date.now()).toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${items
  .map(
    (it) => `    <item>
      <title>${esc(it.title)}</title>
      <link>${siteUrl}${it.path}</link>
      <guid isPermaLink="true">${siteUrl}${it.path}</guid>
      <pubDate>${new Date(it.date).toUTCString()}</pubDate>
      <category>${it.kind}</category>
      <description>${esc(it.line)}</description>
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
