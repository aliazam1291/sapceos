import { missions } from "./missions";
import { labEntries } from "./lab";

/**
 * The curated strip on the home page.
 *
 * This used to be the full inventory — every mission, experiment and note,
 * twenty cards including six unwritten drafts. A reader scrubbing through it
 * hit the same org name and the same orbit graphic twenty times and could not
 * tell the shipped, 200,000-user product from a one-line placeholder. The
 * strip now carries only work with something to show: featured missions and
 * released experiments. The full lists still live on /missions and /lab.
 *
 * Curation happens in the content files (`featured`, `status`), not here, so
 * promoting a piece is a one-flag change and this file never hardcodes a slug.
 */

export type FragmentKind = "mission" | "lab" | "note";

export type Fragment = {
  id: string;
  kind: FragmentKind;
  title: string;
  /** One line of context — who it was for, or what state it is in. */
  meta: string;
  href: string;
  /** Lifecycle state, shown as the card's status pill. */
  status: string;
  /** The problem in one line, shown under the title. */
  premise: string;
  /** The single strongest verified fact, shown as the card's readout. */
  signal?: { label: string; value: string };
  stack: string[];
  /** True when the write-up does not exist yet. Shown, never hidden. */
  draft?: boolean;
  cover?: string;
};

const missionFragments: Fragment[] = missions
  .filter((m) => m.featured)
  .map((m) => ({
    id: m.slug,
    kind: "mission",
    title: m.title,
    meta: m.org,
    href: `/missions/${m.slug}`,
    status: m.status,
    premise: m.premise,
    // Only a number earns the readout slot; a sentence set at 1.5rem mono
    // reads as a shout, not a fact.
    signal: m.signals.find((s) => /\d/.test(s.value)),
    stack: m.stack,
    cover: m.cover,
  }));

const labFragments: Fragment[] = labEntries
  .filter((l) => l.status !== "prototype")
  .map((l) => ({
    id: l.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    kind: "lab",
    title: l.title,
    meta: "Independent",
    // Lab entries have no slug of their own, so they point at the index.
    href: l.href ?? "/lab",
    status: l.status.replace(/-/g, " "),
    premise: l.premise,
    stack: l.stack,
    cover: l.cover,
  }));

export const fragments: Fragment[] = [...missionFragments, ...labFragments];

export const fragmentCount = fragments.length;
