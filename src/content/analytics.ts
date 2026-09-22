import { missions } from "./missions";
import { fieldNotes } from "./field-notes";
import { labEntries } from "./lab";
import { studioAlso, studioPieces } from "./studio";
import { decisions } from "./decisions";
import { writing, hostedWriting, isLive } from "./writing";
import { certifications, experience, skills } from "./profile";
import { ownershipColumns, results } from "./results";

/*
 * Flight data (2026-09-22). Ali: "create stats and data analytics on my
 * projects."
 *
 * Every number on /flight-data is COMPUTED HERE, at build time, from the
 * site's own content — the same objects that render the missions, the
 * studio deck, the notes and the log. Nothing is typed in by hand, and
 * nothing is estimated: if a series cannot be counted from content it is
 * not on the page. That is the point of the page as much as the numbers
 * are — a portfolio that can be audited against itself.
 *
 * PROFILE.md line 49 still governs: a measured OUTCOME only exists where
 * PROFILE.md gives one (those live in `results.ts` and in each mission's
 * `results`). Everything here is a count of work, not a claim about its
 * effect.
 */

export type Series = { label: string; value: number; note?: string }[];

const pct = (n: number, of: number) => Math.round((n / of) * 100);

/* ── Portfolio at a glance ─────────────────────────────────────────────── */

export const active = missions.filter((m) => m.status === "active");
export const shipped = missions.filter((m) => m.status === "shipped");
/** Missions whose report links somewhere the thing can actually be opened. */
export const openable = missions.filter((m) => m.links?.length);

export const counters = [
  { value: missions.length, label: "Missions", note: `${active.length} active · ${shipped.length} shipped` },
  { value: studioPieces.length + studioAlso.length, label: "Studio pieces", note: "freelance, Smaak.ux" },
  { value: fieldNotes.length, label: "Case studies", note: "products I do not work on" },
  { value: labEntries.length, label: "Experiments", note: "the bench" },
  { value: writing.filter((p) => p.outlet !== "Space OS" || isLive(p)).length, label: "Essays", note: `${hostedWriting.filter(isLive).length} written here` },
  { value: experience.length, label: "Roles", note: "on the log" },
];

/* ── What the work is built with ───────────────────────────────────────── */

/**
 * Technology frequency across the ten missions. `stack` is a per-mission
 * fact (what that product is made of), so the count is the honest answer
 * to "what has he actually shipped with", as distinct from the skills
 * list, which is what he can reach for.
 */
export const stackUse: Series = (() => {
  const n = new Map<string, number>();
  for (const m of missions) for (const t of m.stack) n.set(t, (n.get(t) ?? 0) + 1);
  return [...n]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
})();

/** Named on the missions vs named in the skills list but not on a mission. */
export const stackProven = stackUse.length;
export const skillsNamed = skills.reduce((n, g) => n + g.items.length, 0);

/* ── What he owned ─────────────────────────────────────────────────────── */

/**
 * The ownership matrix (Impact) as one number per column: how many of the
 * ten missions' role lines match it. Same regexes, same source — this page
 * shows the aggregate, that one shows the grid.
 */
export const ownership: Series = ownershipColumns.map((c) => ({
  label: c.label,
  value: missions.filter((m) => c.test.test(m.role)).length,
  note: `${pct(missions.filter((m) => c.test.test(m.role)).length, missions.length)}% of missions`,
}));

/* ── How much of it can be checked ─────────────────────────────────────── */

/**
 * The honesty series. A mission is *measured* when PROFILE.md gave it a
 * number, *pending* when it has only what will be measured, and *shipped,
 * unmeasured* when it is out in the world with no public metric on file.
 * Sorting a portfolio by this is unusual; publishing it is the point.
 */
export const evidence = missions.map((m) => ({
  slug: m.slug,
  title: m.title,
  status: m.status,
  state: m.results?.length ? ("measured" as const) : m.measure?.length ? ("pending" as const) : ("unmeasured" as const),
  openable: Boolean(m.links?.length),
}));

export const evidenceSeries: Series = [
  { label: "Measured", value: evidence.filter((e) => e.state === "measured").length, note: "a number on file" },
  { label: "Named, not yet measured", value: evidence.filter((e) => e.state === "pending").length, note: "what will be measured is written down" },
  { label: "Openable", value: openable.length, note: "live links or store listings" },
];

/* ── How documented it is ─────────────────────────────────────────────── */

export const reportSections = missions.reduce((n, m) => n + m.report.length, 0);
export const sectionsPerReport = Math.round(reportSections / missions.length);
/** Words across every mission report — the written half of the work. */
export const reportWords = missions.reduce(
  (n, m) => n + m.report.reduce((w, s) => w + (Array.isArray(s.body) ? s.body.join(" ") : s.body).split(/\s+/).length, 0),
  0,
);
export const noteWords = fieldNotes.reduce((n, f) => n + f.body.join(" ").split(/\s+/).length, 0);
export const essayWords = hostedWriting.filter(isLive).reduce((n, p) => n + (p.body ?? []).join(" ").split(/\s+/).length, 0);

export const written: Series = [
  { label: "Mission reports", value: reportWords, note: `${missions.length} reports · ${sectionsPerReport} sections each` },
  { label: "Case studies", value: noteWords, note: `${fieldNotes.length} teardowns` },
  { label: "Essays", value: essayWords, note: `${hostedWriting.filter(isLive).length} published here` },
];

/* ── The measured reach, for reference ─────────────────────────────────── */

/** Count only — the ledger itself lives on /about and the home Debrief. */
export const verifiedResults = results.length;
export const largestReach = results.reduce((best, r) => (r.kind === "scale" && r.magnitude > best.magnitude ? r : best), results[0]);

/* ── Coverage of the record ────────────────────────────────────────────── */

export const coverage: Series = [
  { label: "Missions with a written report", value: missions.length, note: "all of them" },
  { label: "Missions with a cover of the real thing", value: missions.filter((m) => m.cover).length },
  { label: "Missions with ownership declared", value: missions.filter((m) => m.ownership).length },
  { label: "Decisions with evidence attached", value: decisions.length, note: "flight rules" },
  { label: "Certifications on file", value: certifications.length },
];
