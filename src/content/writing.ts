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
    title: "UX decisions in real-time vehicle tracking",
    outlet: "Space OS",
    date: "2026-09-22",
    slug: "ux-decisions-in-vehicle-tracking",
    href: "/writing/ux-decisions-in-vehicle-tracking",
    status: "draft",
    kind: "essay",
    line: "Five states, a map that turns, a route you can replay: the decisions that made a fleet product usable for the people watching ten thousand vehicles.",
    related: { label: "Vahan Shakti, the mission report", href: "/missions/vahan-shakti" },
    body: [
      "A vehicle-tracking product looks like a map with dots on it. The dots are the easy part. The product is every decision about what a dot means, when it changes, and what a person watching ten thousand of them is supposed to do next. These are the decisions I made on the fleet and telematics platforms at MapMyIndia, and why.",
      "## A vehicle is in one of five states, and the product says which",
      "Moving, stopped, idle, delayed, offline. Before those five were defined, a dot was just a position with a timestamp, and every screen interpreted it differently. Defining the states once — and drawing the line between “stopped” and “idle”, between “idle” and “offline” — gave the map, the alerts, the trip views and the compliance reports one vocabulary. An operator who learns it on the map recognises it in the alarm list. Most of the hard questions in the product were really questions about where those lines sit, and having them in one place means the question gets answered once.",
      "## The map turns with the vehicle, not the other way round",
      "Rotation, fit-to-route and route playback sound like map features. They are attention features. Rotating the map to the heading means the operator does not translate “north” into “left”; fit-to-route means one action shows the whole trip instead of a hunt across the screen; playback means a dispute about where a vehicle was at 14:20 is settled by watching, not by reading a table. Each one removes a step a human was doing in their head, and at fleet scale those steps are the whole day.",
      "## Alarms, geofences and tickets are one workflow, not three features",
      "An alarm nobody acts on is noise. The alarm, geofence and ticketing workflows were designed as one chain: a geofence defines the condition, an alarm says it happened, a ticket says who owns it now. Splitting them into three separate features — which is how they arrive in a requirements list — produces alerts that fire and go nowhere. Designing the hand-off between them is the product work.",
      "## Ten thousand dots is a rendering problem before it is a UX problem",
      "Vahan Shakti draws live positions for a very large fleet; Intouch is optimised for ten thousand active vehicles with headroom to fifty thousand. At those numbers the map cannot draw every marker every second. Clustering, heatmaps and custom markers are not visual flourishes — they are what makes the screen readable at all, and they change what an operator can see: patterns instead of pins. The same is true under the hood: the ~40% improvement on the data-heavy dashboards came from caching, RxJS state management and API optimisation, and a dashboard that renders in time is a UX decision as much as an engineering one.",
      "## What I would still measure",
      "How long an operator takes to find one vehicle in a fleet of thousands; how many alarms end as closed tickets rather than dismissed noise; how often route playback settles a dispute. The product exists to shorten the first and raise the second. Those are the numbers I would put in front of the next version.",
    ],
  },
  {
    title: "Fewer codes: the product standard behind DumbMoney",
    outlet: "Space OS",
    date: "2026-09-23",
    slug: "fewer-codes-dumbmoney",
    href: "/writing/fewer-codes-dumbmoney",
    status: "draft",
    kind: "essay",
    line: "Why a coupon site should carry fewer codes than its competitors, and what it costs to keep that promise.",
    related: { label: "DumbMoney, the venture", href: "/dumbmoney" },
    body: [
      "Every coupon site competes on the same number: how many codes it lists. DumbMoney is built on the opposite standard — a code that works — and this is the reasoning behind it, as its founder and CPO.",
      "## The incentive problem",
      "A coupon site earns when a shopper clicks through to a store. It does not earn less when the code fails at checkout. So the rational thing for a coupon site to do is list everything, forever, and let the shopper discover which codes are dead. The shopper pays for that with three failed attempts at checkout; the site pays nothing. The product decision at DumbMoney was to take that cost onto ourselves.",
      "## What “verified” has to mean",
      "It cannot mean “we scraped it recently”. On DumbMoney a code goes through automated checks first — expiry, duplicates — and then a person reads it before it goes live. Every published coupon carries the name of the founder who checked it. That last part matters more than it sounds: a name next to a code is a promise a specific person made, and it changes how carefully the checking is done.",
      "## Saying what you do not yet do",
      "The about page says plainly that not every code is yet manually tested at checkout. That sentence belongs on the site. A product that describes its own limit is easier to trust than one that claims perfection, and it gives the team a standard to work toward that users can hold us to.",
      "## Fewer, browsable, no signup",
      "The catalogue is organised by store and by category, the code is copied in one action, and nothing asks the shopper to create an account first. Each of those is a decision to remove a step between a person and a working discount. A signup wall would raise a number we could report; it would also make the product worse at the one thing it is for.",
      "## What I would measure",
      "Of the codes people copy, how many work at checkout. That is the whole product in one number. Deals live, brands covered and repeat visits are worth tracking, but each of them is a proxy for the first.",
    ],
  },
  {
    title: "How I approach PRDs as an engineer",
    outlet: "Space OS",
    date: "2026-09-21",
    slug: "prds-as-an-engineer",
    href: "/writing/prds-as-an-engineer",
    status: "published",
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
