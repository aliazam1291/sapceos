import { missions } from "@/content/missions";
import { fieldNotes } from "@/content/field-notes";
import { listedWriting } from "@/content/writing";
import { aiTools, education, experience, lookingFor, openTo, profile } from "@/content/profile";
import { results } from "@/content/results";
import { building } from "@/content/building";
import { faqs } from "@/content/faq";
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

## Key facts

- Name: ${profile.name}
- Current role: ${profile.currentRole}, ${profile.currentOrg}
- Location: ${openTo} (${profile.location})
- Looking for: ${lookingFor}
- Education: ${education.degree}, ${education.school} (${education.period}; ${education.detail})
- Works with AI tools: ${aiTools.join(", ")}
- Résumé (PDF): ${siteUrl}/Ali_Azam_Kazmi_.pdf
- Email: ${profile.email}

## Measured results

Every figure is one already published on a page of this site, with its source. Nothing here is an estimate.

${results.map((r) => `- ${r.value} ${r.label} (${r.source})`).join("\n")}

## Experience

${experience.map((e) => `- ${e.role}, ${e.org} (${e.period})`).join("\n")}

## Building now

${building.map((b) => `- [${b.name}](${b.url}): ${b.role}. ${b.line}`).join("\n")}

## Core pages

- [Recruiter brief](${siteUrl}/hire): the thirty-second case, the measured numbers, the CV and a call link
- [About](${siteUrl}/about): who Ali is, how he works and what he has shipped
- [Projects](${siteUrl}/missions): ten product platforms, each with a report on the problem, his role and the stack
- [How I decide](${siteUrl}/decisions): the product calls he has made, with the evidence for each
- [Experience](${siteUrl}/mission-history): work history, education and certifications
- [Case studies](${siteUrl}/field-notes): teardowns of products he does not work on
- [Writing](${siteUrl}/writing): essays and guides on product management and AI
- [Studio](${siteUrl}/studio): freelance client work under Smaak.ux
- [Smaak.ux](${siteUrl}/smaak): the design studio's own page
- [DumbMoney](${siteUrl}/dumbmoney): the venture he co-founded
- [Lab](${siteUrl}/lab): independent builds and open source
- [Portfolio analytics](${siteUrl}/flight-data): the portfolio counted from its own content
- [Questions](${siteUrl}/faq): recruiter questions answered
- [Contact](${siteUrl}/contact): ${profile.email}

## Questions and answers

${faqs.map((f) => `### ${f.q}\n\n${f.a.join("\n\n")}`).join("\n\n")}

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
