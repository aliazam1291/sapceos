import type { Mission } from "@/content/types";
import { ownershipColumns } from "@/content/results";
import { magnitudeOf } from "@/lib/figures";

/*
 * Success, per project — derived, never typed in (2026-10-29, Ali: "more
 * enhancement, each project stats success").
 *
 * Every figure here is read out of a mission's own `results`, `measure`,
 * `listing` and `role`, which are transcribed from PROFILE.md. Nothing is
 * scored, weighted or estimated: a project with no number on file says so,
 * and how much of the record is proven is itself one of the stats.
 */

/** A number read from a result string, keeping how it was written. */
export type Figure = {
  n: number;
  /** Text before the number ("~"). */
  prefix: string;
  /** The digits as written ("200,000"). */
  digits: string;
  /** Thousands/millions letter ("K" in "1K+"), multiplied into `n`. */
  unit: string;
  /** Text after the number ("+", "%", "+ users"). */
  suffix: string;
  /** A percentage or a multiple ("4×") is a change, not a size. */
  delta: boolean;
};

/**
 * The magnitude and kind come from lib/figures.ts, the same reader the
 * charts use, so a scoreboard and a ScaleRail can never disagree about
 * what is a size; this adds only how the figure was written, for display.
 */
export function parseFigure(value: string): Figure | null {
  const mag = magnitudeOf(value);
  const m = value.match(/^([^\d]*?)(\d[\d,]*(?:\.\d+)?)([KkMm]?)(\+|%|×)?(.*)$/);
  if (!mag || !m) return null;
  return {
    n: mag.magnitude,
    prefix: m[1],
    digits: m[2],
    unit: m[3],
    suffix: (m[4] ?? "") + m[5],
    delta: mag.kind === "delta",
  };
}

/**
 * How much of a project's success can be checked, strongest first:
 * a measured number on file; a live public listing; metrics named but not
 * yet measured; nothing public.
 */
export type Proof = "measured" | "listed" | "named" | "none";

export const proofRank: Record<Proof, number> = { measured: 0, listed: 1, named: 2, none: 3 };

export function proofOf(m: Mission): Proof {
  if ((m.results ?? []).some((r) => parseFigure(r.value))) return "measured";
  if (m.listing || m.links?.length) return "listed";
  if (m.measure?.length) return "named";
  return "none";
}

export function proofLabel(m: Mission, proof = proofOf(m)): string {
  switch (proof) {
    case "measured":
      return "Measured";
    case "listed":
      return "Public listing";
    case "named":
      // An active project is mid-measurement; a shipped one simply has its
      // metrics written down and no number yet. Different sentences.
      return m.status === "active" ? "Being measured" : "Metrics named";
    default:
      return "No public metric";
  }
}

/** The one figure a project leads with: its first measured number, else its listing's installs. */
export function headlineOf(m: Mission): { value: string; label: string } | null {
  const first = (m.results ?? []).find((r) => parseFigure(r.value));
  if (first) return { value: first.value, label: first.label };
  if (m.listing?.installs) return { value: m.listing.installs, label: `installs · ${m.listing.where}` };
  return null;
}

/**
 * Reach: the first measured SIZE on the report (not a percentage, not the
 * designed headroom that follows it), else the listing's installs. The
 * author's order decides which figure is the reach, so nothing is
 * cherry-picked by magnitude.
 */
export function reachOf(m: Mission): { n: number; value: string; label: string } | null {
  for (const r of m.results ?? []) {
    const f = parseFigure(r.value);
    if (f && !f.delta) return { n: f.n, value: r.value, label: r.label };
  }
  const installs = m.listing?.installs ? parseFigure(m.listing.installs) : null;
  if (installs && m.listing?.installs) return { n: installs.n, value: m.listing.installs, label: `installs · ${m.listing.where}` };
  return null;
}

export type BoardRow = {
  slug: string;
  title: string;
  status: Mission["status"];
  proof: Proof;
  proofLabel: string;
  headline: { value: string; label: string } | null;
  reach: { n: number; value: string; label: string } | null;
  /** Numbers on file / metrics named for later. */
  measured: number;
  toMeasure: number;
  owns: { key: string; label: string; on: boolean }[];
  live: { label: string; href: string } | null;
};

/** Plain rows for the scoreboard: computed on the server, sorted on the client. */
export function boardRows(missions: Mission[]): BoardRow[] {
  return missions.map((m) => {
    const proof = proofOf(m);
    return {
      slug: m.slug,
      title: m.title.split(" — ")[0],
      status: m.status,
      proof,
      proofLabel: proofLabel(m, proof),
      headline: headlineOf(m),
      reach: reachOf(m),
      measured: (m.results ?? []).filter((r) => parseFigure(r.value)).length,
      toMeasure: m.measure?.length ?? 0,
      owns: ownershipColumns.map((c) => ({ key: c.key, label: c.label, on: c.test.test(m.role) })),
      live: m.links?.[0] ?? null,
    };
  });
}
