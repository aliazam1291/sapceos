/*
 * Writing (2026-09-20): every piece Ali has published, in one log. Titles,
 * outlets and dates are transcribed from the Medium RSS feed
 * (medium.com/feed/@aliazamkazmi1291, read 2026-09-20) and dumbmoney.in;
 * each `line` is a one-sentence description of what the piece is about,
 * taken from its own opening — no claims about reach or reception.
 */
export type Piece = {
  title: string;
  /** "Space OS" = written and hosted here (/writing/<slug>); the others link out. */
  outlet: "Medium" | "DumbMoney" | "Space OS";
  /** ISO date. */
  date: string;
  href: string;
  /** Hosted pieces only: the route, the paragraphs ("## " prefixes a subhead), and whether it is live. A draft renders in development only. */
  slug?: string;
  body?: string[];
  status?: "draft" | "published";
  line: string;
  kind: "case study" | "essay" | "guide";
  /** Where on this site the piece connects — the venture, a case study, the deck. Only real relations. */
  related?: { label: string; href: string };
};

export const writing: Piece[] = [
  {
    title: "How I approach PRDs as an engineer",
    outlet: "Space OS",
    date: "2026-09-21",
    slug: "prds-as-an-engineer",
    href: "/writing/prds-as-an-engineer",
    status: "draft",
    kind: "essay",
    line: "Writing the document and then building what it says: what changes in a PRD when the author is also the one who ships it.",
    related: { label: "The missions the PRDs were for", href: "/missions" },
    body: [
      "Most product requirement documents are written by someone who will not build the thing, for someone who will not decide what it is. I write mine from the other side of the table: at MapMyIndia I author the PRD and then I am one of the people who implements it. That changes what goes in the document, and what stays out.",
      "## Start with the problem, and write it down before the screens",
      "Every PRD I write opens with a problem statement, not a feature. The Mappls Shop Admin work is the clearest example: the problem was a fully manual billing process, and the document said so in one sentence before it said anything about an admin panel. A feature list without that sentence is a wish list; with it, every later argument about scope has something to argue against.",
      "## User stories are how you find the states you forgot",
      "I write user stories not because a template asks for them but because they force the states out. In fleet software, the interesting question is never the happy path — a vehicle is moving. It is what the product does when a vehicle is stopped, idle, delayed or offline, and who needs to know which. On the telematics platforms those five states became the vocabulary for the whole product: the map, the alerts, the compliance views. The stories surfaced them; the screens came after.",
      "## Acceptance criteria are a contract with your future self",
      "When the person writing the criteria will also be the person tested against them, the criteria get honest fast. Vague criteria do not survive contact with a Tuesday afternoon build. I write them as things a tester could check without asking me: what appears, what does not, within how long, and what happens on the failure path.",
      "## Edge cases are where the engineering knowledge earns its place",
      "This is the part an engineer can do that a pure spec-writer often cannot: knowing which edge cases are real. The kind of thing I mean — a route playback with a gap in the GPS data; an alarm that can fire twice; a dashboard that is fine at a hundred vehicles and unusable at ten thousand. Writing these into the PRD up front is cheaper than discovering them in a demo.",
      "## What stays out",
      "Implementation. The PRD says what the system must insist on and what it must never do; it does not say which library. That boundary is harder to hold when you are also the implementer, and holding it is most of the discipline. The document is for the people who have to agree on the problem — the operations team, the client, the other engineers — and the moment it starts describing the code, they stop reading.",
      "## Then ship, then look",
      "The loop I work in is problem → understand → strategy → UX → build → ship → learn → next problem. The PRD is the artefact of the first three steps. Its real test is the last one: after shipping, does the document still describe what the product does? When it does not, the gap is the next PRD.",
    ],
  },
  {
    title: "How to Use Coupons During Big Billion Days & Great Indian Festival",
    outlet: "DumbMoney",
    date: "2026-09-15",
    href: "https://dumbmoney.in/blog/how-to-use-coupons-big-billion-days-great-indian-festival",
    line: "A shopper's guide to the two biggest sale weeks of the Indian year, and how to use a coupon during them.",
    kind: "guide",
    related: { label: "DumbMoney, the venture", href: "/dumbmoney" },
  },
  {
    title: "Why Coupon Codes Stop Working (And How to Avoid Expired Ones)",
    outlet: "DumbMoney",
    date: "2026-09-10",
    href: "https://dumbmoney.in/blog/why-coupon-codes-stop-working",
    line: "Why a code fails at checkout, and how to avoid the expired ones.",
    kind: "essay",
    related: { label: "DumbMoney, the venture", href: "/dumbmoney" },
  },
  {
    title: "Cosmic Orange and the New “Pro”: A Case Study in Color-Led Strategy, Personas, and Accessible UX",
    outlet: "Medium",
    date: "2025-09-12",
    href: "https://medium.com/@aliazamkazmi1291/cosmic-orange-and-the-new-pro-a-case-study-in-color-led-strategy-personas-and-accessible-ux-54bfa3b86d6b",
    line: "A colour as product strategy: how one finish turns “Pro” into a visible signal, and what that asks of accessibility.",
    kind: "case study",
    related: { label: "More teardowns: the field notes", href: "/field-notes" },
  },
  {
    title: "No-Code vs. Custom Coding: What’s Best for Small Businesses in 2025?",
    outlet: "Medium",
    date: "2025-02-21",
    href: "https://medium.com/@aliazamkazmi1291/no-code-vs-custom-coding-whats-best-for-small-businesses-in-2025-7da9b8958d1c",
    line: "The build-or-buy call for a small business: when a no-code platform is the right product decision, and when it stops being one.",
    kind: "essay",
  },
  {
    title: "Understanding Middleware: The Backbone of Modern Software Systems",
    outlet: "Medium",
    date: "2024-11-25",
    href: "https://medium.com/@aliazamkazmi1291/understanding-middleware-the-backbone-of-modern-software-systems-854d5b677ceb",
    line: "The layer between systems that nobody sees and everything depends on, explained for people who ship on top of it.",
    kind: "essay",
  },
  {
    title: "Frontend Development Roadmap: A Comprehensive Guide",
    outlet: "Medium",
    date: "2024-09-30",
    href: "https://medium.com/@aliazamkazmi1291/frontend-development-roadmap-a-comprehensive-guide-8434644228d3",
    line: "A structured route through frontend engineering, from the fundamentals to the tooling that changes every year.",
    kind: "guide",
    related: { label: "The stack in use: the missions", href: "/missions" },
  },
  {
    title: "The Art of Balancing Aesthetics and Functionality: UI Design and Coding",
    outlet: "Medium",
    date: "2024-09-25",
    href: "https://medium.com/@aliazamkazmi1291/the-art-of-balancing-aesthetics-and-functionality-understanding-the-differences-between-ui-design-1ace225629d5",
    line: "Where UI and UX are not the same job, and what changes when the designer is also the one writing the code.",
    kind: "essay",
    related: { label: "The design work: Smaak.ux", href: "/studio" },
  },
];

/** Pieces written and hosted here. */
export const hostedWriting = writing.filter((p) => p.outlet === "Space OS" && p.slug && p.body);

/** Live means published, or any draft while developing (never a draft in production). */
export function isLive(p: Piece) {
  return p.status === "published" || (p.status === "draft" && process.env.NODE_ENV !== "production");
}

/** What the /writing log lists: everything external, plus hosted pieces that are live. */
export const listedWriting = writing.filter((p) => p.outlet !== "Space OS" || isLive(p));
