import { missions } from "@/content/missions";
import { fieldNotes } from "@/content/field-notes";
import { listedWriting } from "@/content/writing";
import { profile, lookingFor } from "@/content/profile";
import { siteUrl } from "@/lib/site";

/*
 * /llms.txt (2026-10-04): a plain-markdown map of the site for language
 * models and answer engines, per the llmstxt.org convention. It is a hint,
 * not a guarantee: no major engine has promised to read it. It costs nothing
 * and is built from the same content objects as the pages, so it cannot
 * drift or claim anything the site does not. Facts only; no outcome is
 * stated here that is not on a page.
 */

export const dynamic = "force-static";

export function GET() {
  const mission = (m: (typeof missions)[number]) =>
    `- [${m.title}](${siteUrl}/missions/${m.slug}): ${m.premise}`;
  const note = (n: (typeof fieldNotes)[number]) =>
    `- [${n.title}](${siteUrl}/field-notes/${n.slug}): ${n.premise}`;
  const piece = (p: (typeof listedWriting)[number]) =>
    `- [${p.title}](${p.href.startsWith("http") ? p.href : siteUrl + p.href}): ${p.line}`;

  const body = `# ${profile.name}

> ${profile.title} at ${profile.currentOrg} (${profile.currentRole}), based in ${profile.location}. Looking for: ${lookingFor}. This site is a portfolio built as an interactive "Space OS"; every page is also readable as plain text.

${profile.oneLine}

## Core pages

- [About](${siteUrl}/about): who Ali is, how he works and what he has shipped
- [Missions](${siteUrl}/missions): the projects, each with a report on the problem, his role and the stack
- [Flight rules](${siteUrl}/decisions): the product calls he has made, with the evidence for each
- [Flight log](${siteUrl}/mission-history): work history
- [Studio](${siteUrl}/studio): freelance client work under Smaak.ux
- [DumbMoney](${siteUrl}/dumbmoney): the venture he founded
- [FAQ](${siteUrl}/faq): recruiter questions answered
- [Contact](${siteUrl}/contact): ${profile.email}

## Projects

${missions.map(mission).join("\n")}

## Case studies

${fieldNotes.map(note).join("\n")}

## Writing

${listedWriting.map(piece).join("\n")}

## Optional

- [Sitemap](${siteUrl}/sitemap.xml)
- [RSS feed](${siteUrl}/feed.xml)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
