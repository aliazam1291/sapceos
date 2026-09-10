import { DRAFT } from "./types";

/**
 * What is currently in orbit — reading, tools, questions, music.
 *
 * PROFILE.md is explicit that none of this exists yet: "Orbit topics /
 * reading list / music — no verified data. Must come from Ali directly."
 * Nothing here is invented, so every slot ships with the DRAFT sentinel until
 * Ali fills it in.
 *
 * Moved out of the page component so the NAVIGATION can read it too. A live
 * portfolio aimed at hiring managers should not advertise a route that opens
 * on four "needs input" warnings — but hard-removing it from the nav would be
 * a decision someone then has to remember to reverse. Instead the route lists
 * itself once it has something to say: fill in an `entries` array below and
 * `orbitHasContent` flips to true, restoring the link in Nav and Footer with
 * no other change.
 */

export type OrbitSlot = {
  label: string;
  /** What belongs here, shown as the draft hint until entries exist. */
  note: string;
  /** Real items. Empty means this slot is still awaiting content. */
  entries: string[];
  /* Orbital geometry for the stage — presentation only. */
  radius: number;
  period: number;
  offset: number;
  tilt: number;
};

export const orbitSlots: OrbitSlot[] = [
  {
    label: "Reading",
    note: "books, papers, long-form",
    entries: [],
    radius: 0.95,
    period: 26,
    offset: 0,
    tilt: 0.05,
  },
  {
    label: "Tools",
    note: "what's actually open every day",
    entries: [],
    radius: 1.35,
    period: 38,
    offset: 9,
    tilt: -0.16,
  },
  {
    label: "Questions",
    note: "problems being chewed on",
    entries: [],
    radius: 1.78,
    period: 52,
    offset: 20,
    tilt: 0.22,
  },
  {
    label: "Signal",
    note: "music / focus",
    entries: [],
    radius: 2.2,
    period: 68,
    offset: 34,
    tilt: -0.09,
  },
];

/**
 * True once any slot has a real entry.
 *
 * Nav and Footer both gate the /orbit link on this, so the route stops
 * advertising itself while it is empty and starts again the moment it is not.
 * The page itself always works — it is only the link that is conditional, so
 * the URL keeps resolving for anyone who has it.
 */
export const orbitHasContent = orbitSlots.some(
  (slot) => slot.entries.filter((e) => !e.startsWith(DRAFT)).length > 0,
);
