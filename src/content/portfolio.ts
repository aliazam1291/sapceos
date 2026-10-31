import { missions } from "./missions";
import { labEntries } from "./lab";
import { studio, studioKindLabel, studioPieces, type StudioKind } from "./studio";
import { venture } from "./venture";
import { education, profile } from "./profile";
import { ownershipColumns, results } from "./results";

/*
 * The portfolio, in one dossier (2026-10-31). Ali: "when someone lands …
 * no one can say it's my portfolio before we start at space … add skills
 * according to my projects, my education; my number of projects seems
 * less."
 *
 * Every number here is COUNTED from the content the site already renders:
 * a project is a mission, a lab build, a studio piece or the venture; a
 * skill's number is how many of those projects used it. Nothing is typed
 * in, so nothing can drift from the pages it summarises.
 *
 * Server-only by use: it imports every content module, so it is computed in
 * the layout and the home page and handed to the launch screen and the
 * galaxy opener as plain props — never imported into a client bundle.
 */

export type SkillCount = { name: string; count: number };
export type SkillGroup = { group: "Engineering" | "Product" | "Design"; items: SkillCount[]; more: number };

export type Dossier = {
  name: string;
  role: string;
  location: string;
  now: string;
  /** Where he works now, on its own (the landing's one-line meta). */
  org: string;
  counts: {
    /** Products, design projects and the venture together. */
    total: number;
    /** Platform missions plus lab builds. */
    products: number;
    platform: number;
    lab: number;
    design: number;
    clients: number;
    ventures: number;
  };
  proof: { value: string; label: string } | null;
  skills: SkillGroup[];
  education: { degree: string; degreeShort: string; school: string; short: string; detail: string; period: string };
};

/** Tally names, keeping first-seen order to break ties. */
function tally(names: string[]): SkillCount[] {
  const counts = new Map<string, number>();
  names.forEach((n) => counts.set(n, (counts.get(n) ?? 0) + 1));
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

const ENGINEERING_SHOWN = 8;

export function dossier(): Dossier {
  const engineering = tally([...missions.flatMap((m) => m.stack), ...labEntries.flatMap((l) => l.stack)]);

  // Product craft, counted the way the ownership matrix counts it: a literal
  // match on each mission's role line.
  const PRODUCT_LABEL: Record<string, string> = { ux: "UI/UX", prd: "PRDs", xfn: "Cross-team lead", frontend: "Frontend" };
  const product = ownershipColumns
    .filter((c) => c.key !== "frontend")
    .map((c) => ({ name: PRODUCT_LABEL[c.key] ?? c.label, count: missions.filter((m) => c.test.test(m.role)).length }))
    // The matrix's own column order (UI/UX, PRDs, cross-team): the PM
    // crafts read first, not re-sorted by count.
    .filter((s) => s.count > 0);

  const design = tally(studioPieces.map((p) => studioKindLabel[p.kind as StudioKind]));

  const platform = missions.length;
  const lab = labEntries.length;
  const products = platform + lab;
  const designCount = studioPieces.length;
  const ventures = venture ? 1 : 0;

  const largest = results.find((r) => r.kind === "scale" && r.source === "Vahan Shakti");

  return {
    name: profile.name,
    role: profile.title,
    location: profile.location,
    now: `${profile.currentRole} · ${profile.currentOrg}`,
    org: profile.currentOrg,
    counts: {
      total: products + designCount + ventures,
      products,
      platform,
      lab,
      design: designCount,
      clients: studio.clients,
      ventures,
    },
    proof: largest ? { value: largest.value, label: "users on the largest platform" } : null,
    skills: [
      { group: "Engineering", items: engineering.slice(0, ENGINEERING_SHOWN), more: Math.max(0, engineering.length - ENGINEERING_SHOWN) },
      { group: "Product", items: product, more: 0 },
      { group: "Design", items: design, more: 0 },
    ],
    education: { ...education },
  };
}
