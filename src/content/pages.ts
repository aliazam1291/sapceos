/*
 * What each page is, in the words a visitor would use (2026-09-24).
 *
 * Ali: "we named everything like Space OS, but in the subheading we should
 * write what the page is about — missions might be projects — the language
 * people understand."
 *
 * The metaphor stays: the page is still the hangar deck, the drone bay, the
 * open channel. This is the translation that runs beside it, so a recruiter
 * who has thirty seconds and no interest in the conceit still knows they
 * are looking at projects, case studies and a résumé.
 *
 * One map, used by the nav, the overview panel and every page header, so
 * "Missions" can never mean Projects in one place and something else in
 * another.
 */
export const plainName: Record<string, string> = {
  "/": "Portfolio home",
  "/missions": "Projects",
  "/field-notes": "Case studies",
  "/lab": "Experiments",
  "/studio": "Freelance work",
  "/writing": "Essays",
  "/decisions": "How I decide",
  "/about": "About me",
  "/mission-history": "Résumé",
  "/contact": "Contact",
  "/dumbmoney": "My startup",
  "/flight-data": "Portfolio analytics",
  "/faq": "Common questions",
  "/galaxy": "Interactive map",
  "/orbit": "Interests",
};

/** Detail routes: what one entry of each kind is. */
export const plainKind = {
  mission: "Project case study",
  note: "Product teardown",
  essay: "Essay",
} as const;

/** The plain name for a path, falling back to its section's. */
export function plainFor(pathname: string): string | undefined {
  if (plainName[pathname]) return plainName[pathname];
  if (/^\/missions\/./.test(pathname)) return plainKind.mission;
  if (/^\/field-notes\/./.test(pathname)) return plainKind.note;
  if (/^\/writing\/./.test(pathname)) return plainKind.essay;
  return undefined;
}
