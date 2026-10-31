import { describe, expect, it } from "vitest";
import { missions } from "@/content/missions";
import { labEntries } from "@/content/lab";
import { studioPieces } from "@/content/studio";
import { dossier } from "@/content/portfolio";

describe("the portfolio dossier is counted, not typed", () => {
  const d = dossier();

  it("counts every project the site shows", () => {
    expect(d.counts.platform).toBe(missions.length);
    expect(d.counts.lab).toBe(labEntries.length);
    expect(d.counts.products).toBe(missions.length + labEntries.length);
    expect(d.counts.design).toBe(studioPieces.length);
    expect(d.counts.total).toBe(d.counts.products + d.counts.design + d.counts.ventures);
  });

  it("gives each engineering skill the number of projects that used it", () => {
    const stacks = [...missions.map((m) => m.stack), ...labEntries.map((l) => l.stack)];
    for (const s of d.skills[0].items) {
      expect(s.count).toBe(stacks.filter((st) => st.includes(s.name)).length);
    }
    // Most-used first.
    const counts = d.skills[0].items.map((s) => s.count);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });

  it("never shows a skill no project used", () => {
    for (const g of d.skills) for (const s of g.items) expect(s.count).toBeGreaterThan(0);
  });

  it("carries the degree", () => {
    expect(d.education.degree).toMatch(/B\.Tech/);
    expect(d.education.detail).toMatch(/CGPA/);
  });
});
