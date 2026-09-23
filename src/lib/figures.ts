/*
 * Reading a magnitude back out of a figure that was transcribed as text
 * (2026-09-24).
 *
 * Every number on this site is stored the way PROFILE.md words it —
 * "200,000+", "~40%", "600K+", "Live on Play Store" — because the string is
 * the fact and a chart must never be the reason a number gets rounded,
 * restated or invented. This parses the magnitude out of that string so a
 * figure can be *positioned* on an axis; it never changes what is printed.
 *
 * Anything that is not a quantity (a distribution note, a sector) returns
 * null and is simply not plotted.
 */

export type Figure = { value: string; label: string; source?: string };
export type PlottedFigure = Figure & { magnitude: number; kind: "scale" | "delta" };

const SUFFIX: Record<string, number> = { k: 1e3, m: 1e6, cr: 1e7, lakh: 1e5, l: 1e5 };

/** The number inside a written figure, or null when there is not one. */
export function magnitudeOf(value: string): { magnitude: number; kind: "scale" | "delta" } | null {
  const text = value.trim().toLowerCase();
  const match = text.match(/([~+±]?)\s*([\d,.]+)\s*(k|m|cr|lakh|l)?\s*(%?)/);
  if (!match) return null;
  const digits = match[2].replace(/,/g, "");
  if (!digits || Number.isNaN(Number(digits))) return null;
  const n = Number(digits) * (match[3] ? (SUFFIX[match[3]] ?? 1) : 1);
  if (!Number.isFinite(n) || n <= 0) return null;
  return { magnitude: n, kind: match[4] === "%" ? "delta" : "scale" };
}

/** Keeps only the figures that carry a quantity, with it attached. */
export function plottable(figures: Figure[] | undefined): PlottedFigure[] {
  if (!figures) return [];
  return figures.flatMap((f) => {
    const m = magnitudeOf(f.value);
    return m ? [{ ...f, ...m }] : [];
  });
}
