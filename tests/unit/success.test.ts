import { describe, expect, it } from "vitest";
import { missions } from "@/content/missions";
import { boardRows, headlineOf, parseFigure, proofOf, reachOf } from "@/lib/success";

const bySlug = (slug: string) => {
  const m = missions.find((x) => x.slug === slug);
  if (!m) throw new Error(`no mission ${slug}`);
  return m;
};

describe("parseFigure", () => {
  it("reads sizes the way the reports write them", () => {
    expect(parseFigure("200,000+")).toMatchObject({ n: 200000, digits: "200,000", suffix: "+", delta: false });
    expect(parseFigure("30+")).toMatchObject({ n: 30, delta: false });
    expect(parseFigure("1K+")).toMatchObject({ n: 1000, unit: "K", suffix: "+" });
  });

  it("treats percentages and multiples as changes, keeping their prefix", () => {
    expect(parseFigure("80%")).toMatchObject({ n: 80, delta: true });
    expect(parseFigure("~40%")).toMatchObject({ n: 40, prefix: "~", delta: true });
    expect(parseFigure("4×")).toMatchObject({ n: 4, suffix: "×", delta: true });
  });

  it("returns null for words", () => {
    expect(parseFigure("Live")).toBeNull();
  });
});

describe("proof levels", () => {
  it("ranks each mission by what is on file, never by hand", () => {
    expect(proofOf(bySlug("vahan-shakti"))).toBe("measured");
    expect(proofOf(bySlug("mappls-shop-admin"))).toBe("measured");
    // "Live" is not a number: the listing carries it.
    expect(proofOf(bySlug("indane-yatra-mitra"))).toBe("listed");
    expect(proofOf(bySlug("technician-app"))).toBe("named");
    expect(proofOf(bySlug("control-tower"))).toBe("named");
  });
});

describe("headline and reach", () => {
  it("takes the first measured size, not the designed headroom after it", () => {
    expect(reachOf(bySlug("intouch"))?.n).toBe(10000);
  });

  it("leads with the report's first number but measures reach in sizes only", () => {
    const shop = bySlug("mappls-shop-admin");
    // 4× collections leads; it is a multiple, so reach is the 30+ users.
    expect(headlineOf(shop)?.value).toBe("4×");
    expect(reachOf(shop)?.n).toBe(30);
  });

  it("falls back to a listing's installs, labelled as installs", () => {
    const iym = bySlug("indane-yatra-mitra");
    expect(headlineOf(iym)).toEqual({ value: "1K+", label: "installs · Google Play" });
  });
});

describe("the scoreboard invents nothing", () => {
  const rows = boardRows(missions);

  it("has one row per mission", () => {
    expect(rows).toHaveLength(missions.length);
  });

  it("shows only figures that are already on the mission's record", () => {
    for (const row of rows) {
      const m = bySlug(row.slug);
      const onFile = [...(m.results ?? []).map((r) => r.value), m.listing?.installs].filter(Boolean);
      if (row.headline) expect(onFile).toContain(row.headline.value);
      if (row.reach) expect(onFile).toContain(row.reach.value);
    }
  });

  it("dates every public listing", () => {
    for (const m of missions.filter((x) => x.listing)) {
      expect(m.listing?.read).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
