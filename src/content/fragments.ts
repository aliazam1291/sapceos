import { missions } from "./missions";
import { fieldNotes } from "./field-notes";
import { labEntries } from "./lab";
import { DRAFT } from "./types";

/**
 * Everything that exists, in one list.
 *
 * The work is spread across three routes and a visitor has to go looking for
 * all of it — the home page shows three featured missions and the rest is a
 * click away, so the site reads as much smaller than it is. This is the single
 * flat inventory: every mission, every experiment, every note.
 *
 * THE COUNT IS DERIVED, NEVER WRITTEN DOWN. It is the length of this array, so
 * it cannot drift from reality and cannot be inflated by adding a number to a
 * template. Certifications and employment are deliberately NOT in here: they
 * are credentials and history, not made things, and folding them in would pad
 * the total with a different kind of item.
 */

export type FragmentKind = "mission" | "lab" | "note";

export type Fragment = {
  id: string;
  kind: FragmentKind;
  title: string;
  /** One line of context — who it was for, or what state it is in. */
  meta: string;
  href: string;
  /** True when the write-up does not exist yet. Shown, never hidden. */
  draft?: boolean;
};

const missionFragments: Fragment[] = missions.map((m) => ({
  id: m.slug,
  kind: "mission",
  title: m.title,
  meta: m.org,
  href: `/missions/${m.slug}`,
}));

const labFragments: Fragment[] = labEntries.map((l) => ({
  id: l.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  kind: "lab",
  title: l.title,
  meta: l.status.replace(/-/g, " "),
  // Lab entries have no slug of their own, so they point at the index.
  href: "/lab",
}));

const noteFragments: Fragment[] = fieldNotes.map((n) => ({
  id: n.slug,
  kind: "note",
  title: n.title,
  meta: n.kind.replace(/-/g, " "),
  href: `/field-notes/${n.slug}`,
  // Every field note currently ships with a DRAFT body. Marking them is the
  // honest thing to do: an unwritten piece should not sit in a strip of
  // finished work pretending otherwise.
  draft: n.body.every((p) => p.startsWith(DRAFT)),
}));

export const fragments: Fragment[] = [
  ...missionFragments,
  ...labFragments,
  ...noteFragments,
];

export const fragmentCount = fragments.length;
