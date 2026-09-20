/*
 * Writing (2026-09-20): every piece Ali has published, in one log. Titles,
 * outlets and dates are transcribed from the Medium RSS feed
 * (medium.com/feed/@aliazamkazmi1291, read 2026-09-20) and dumbmoney.in;
 * each `line` is a one-sentence description of what the piece is about,
 * taken from its own opening — no claims about reach or reception.
 */
export type Piece = {
  title: string;
  outlet: "Medium" | "DumbMoney";
  /** ISO date. */
  date: string;
  href: string;
  line: string;
  kind: "case study" | "essay" | "guide";
};

export const writing: Piece[] = [
  {
    title: "How to Use Coupons During Big Billion Days & Great Indian Festival",
    outlet: "DumbMoney",
    date: "2026-09-15",
    href: "https://dumbmoney.in/blog/how-to-use-coupons-big-billion-days-great-indian-festival",
    line: "A shopper's guide to the two biggest sale weeks of the Indian year, and how to use a coupon during them.",
    kind: "guide",
  },
  {
    title: "Why Coupon Codes Stop Working (And How to Avoid Expired Ones)",
    outlet: "DumbMoney",
    date: "2026-09-10",
    href: "https://dumbmoney.in/blog/why-coupon-codes-stop-working",
    line: "Why a code fails at checkout, and how to avoid the expired ones.",
    kind: "essay",
  },
  {
    title: "Cosmic Orange and the New “Pro”: A Case Study in Color-Led Strategy, Personas, and Accessible UX",
    outlet: "Medium",
    date: "2025-09-12",
    href: "https://medium.com/@aliazamkazmi1291/cosmic-orange-and-the-new-pro-a-case-study-in-color-led-strategy-personas-and-accessible-ux-54bfa3b86d6b",
    line: "A colour as product strategy: how one finish turns “Pro” into a visible signal, and what that asks of accessibility.",
    kind: "case study",
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
  },
  {
    title: "The Art of Balancing Aesthetics and Functionality: UI Design and Coding",
    outlet: "Medium",
    date: "2024-09-25",
    href: "https://medium.com/@aliazamkazmi1291/the-art-of-balancing-aesthetics-and-functionality-understanding-the-differences-between-ui-design-1ace225629d5",
    line: "Where UI and UX are not the same job, and what changes when the designer is also the one writing the code.",
    kind: "essay",
  },
];
