/**
 * The site's voice — every line of comms chatter, in one place.
 *
 * Rules for this file, so the humour stays the site's and not a mascot's:
 *   - Dry. One beat per line. If it needs an exclamation mark it is wrong.
 *   - Never about a fact. Numbers, roles, outcomes are PROFILE.md's and are
 *     never the punchline. The joke is about the ship, the reader, the
 *     process, the site itself.
 *   - Never undermines the operator. Deadpan about the journey, never
 *     "I probably can't". The 404 page set the register: "Checked under
 *     the couch cushions of the router."
 *   - Mission control talks in callsigns. CAPCOM is the ground. SHIP is
 *     the ship. PAD is the platform crew. K-7 is the robot (his lines live
 *     with him).
 */
export type CommsLine = { who: "CAPCOM" | "SHIP" | "PAD" | "K-7"; line: string };

export const comms = {
  // Home — beat 0, the empty right side where the idle panel used to be.
  boarding: [
    { who: "CAPCOM", line: "You are cleared to scroll." },
    { who: "SHIP", line: "Copy. Five worlds ahead. No cards on the manifest." },
  ],
  // Home — Debrief, under the black hole's hint.
  debrief: [
    { who: "CAPCOM", line: "Results have mass. Roadmaps, notably, do not." },
    { who: "SHIP", line: "Holding orbit. Not diving unless told." },
  ],
  // Home — Rules, under the section head.
  rules: [
    { who: "CAPCOM", line: "Seven rules on file. Three shown. The other four are also load-bearing." },
  ],
  // Home — Notes, under the section head.
  notes: [
    { who: "PAD", line: "Drones inbound with three case studies. Signature not required." },
  ],
  // Home — Touchdown, once the ship is on the pad.
  landed: [
    { who: "CAPCOM", line: "Touchdown. Please remain seated until the operator has been introduced." },
  ],
  dismantled: [
    { who: "PAD", line: "Airframe in six parts. We can put it back. Probably." },
  ],
  // Secondary pages — under the lede.
  missions: [
    { who: "CAPCOM", line: "Ten bays on the deck. Hover one and the chief will read its tag; he has been waiting." },
  ],
  lab: [
    { who: "CAPCOM", line: "Nothing on this bench had a deadline. Some of it still shipped, which surprised everyone." },
  ],
  fieldNotes: [
    { who: "CAPCOM", line: "Case studies of products the operator does not work on. Read closely enough to disagree with." },
  ],
  decisions: [
    { who: "CAPCOM", line: "Each rule comes with the fact it was learned from. Rule seven is about this file." },
  ],
  about: [
    { who: "CAPCOM", line: "The operator, in text. The airframe version is further down and says the same thing louder." },
  ],
  history: [
    { who: "CAPCOM", line: "The full log, in order. The PDF is the same log with worse typography." },
  ],
  contact: [
    { who: "CAPCOM", line: "Channel open. Replies arrive in Earth time." },
  ],
  studio: [
    { who: "CAPCOM", line: "Studio deck. Every piece here began as a brief and a founder who wanted it by Tuesday." },
  ],
  // /writing — the log of published pieces.
  writing: [
    { who: "CAPCOM", line: "Seven transmissions on record. All of them were proofread; one of them twice." },
  ],
  // /dumbmoney — the venture.
  venture: [
    { who: "CAPCOM", line: "Operator's own vessel. Copy the code before it expires; the ship has tried." },
  ],
  // Home — Operator, under the leg's head.
  operator: [
    { who: "CAPCOM", line: "Pilot on the flight deck. Writes the PRD, then builds the thing the PRD said." },
  ],
  // Home — Flight log.
  log: [
    { who: "CAPCOM", line: "Four entries in the log. The PDF version is the same log with worse typography." },
  ],
  // Home — Studio annex.
  studioLeg: [
    { who: "PAD", line: "Studio annex, four bays lit. The rest of the deck is one door down." },
  ],
} as const satisfies Record<string, readonly CommsLine[]>;

export type CommsAt = keyof typeof comms;

/** The footer's one line. No cookies on board — the site keeps one session in sessionStorage and a perf level in localStorage, nothing else. */
export const footerLine = "No cookies on board. The ship remembers you for one session, politely.";

/** The boot log — one dry beat among the real readiness checks. */
export const bootLine = "Buzzword filter armed";

/** Mission control, the ⌘K palette (CommandPalette). The prompt and the empty state. */
export const palette = {
  prompt: "Where to, operator?",
  nothing: "Nothing on the manifest by that name. Try a mission, a note, or a page.",
} as const;
