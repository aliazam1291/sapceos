import type { ReportSection } from "./types";

/*
 * The venture: DumbMoney (2026-09-20). Ali is founder & CPO — confirmed by
 * him, recorded in PROFILE.md "Venture". Every fact below is either his
 * statement or a line read off dumbmoney.in; where a number belongs,
 * `measure` says what will be measured instead.
 *
 * On the one number here (2026-09-23): the two public counters that used to
 * contradict each other no longer do — the home page's is gone and the
 * about page reads "10,000+ Active Deals". That is catalogue SIZE, the
 * platform's own claim about itself, and it is carried as a dated,
 * attributed manifest fact. It is not an outcome: the outcome this product
 * is judged on is whether a copied code works at checkout, and that is in
 * `measure` until it is counted.
 */
export type Venture = {
  slug: string;
  title: string;
  role: string;
  url: string;
  urlLabel: string;
  status: "live";
  /** One line: the problem, not the tech. */
  premise: string;
  tagline: { text: string; source: string };
  cofounder: { name: string; role: string };
  market: string;
  /**
   * The platform's own public figure for how big the catalogue is, with the
   * page and date it was read off. NOT a result — it says nothing about
   * whether a code works, which is what this product is for — so it sits in
   * the manifest, attributed, while the Results strip stays pending.
   */
  catalogue: { value: string; label: string; source: string };
  cover: string;
  coverPhone: string;
  /** What WILL be measured; nothing is claimed until it is. */
  measure: string[];
  ownership: { decided?: string[]; built?: string[]; withTeam?: string[] };
  report: ReportSection[];
  writing: { title: string; date: string; href: string }[];
  lineage: { label: string; href: string };
};

export const venture: Venture = {
  slug: "dumbmoney",
  title: "DumbMoney",
  role: "Founder & CPO",
  url: "https://dumbmoney.in",
  urlLabel: "dumbmoney.in",
  status: "live",
  premise: "A coupon and deals platform for Indian online shoppers — every code checked by a person before it goes live, so the one you copy at checkout works.",
  tagline: { text: "India's most trusted coupon platform. We verify every deal so you save more, every day.", source: "dumbmoney.in" },
  cofounder: { name: "Akshat Somani", role: "Co-founder" },
  market: "India · consumer · e-commerce",
  catalogue: { value: "10,000+", label: "Active deals", source: "dumbmoney.in, read 23 Sep 2026" },
  cover: "/ventures/dumbmoney.png",
  coverPhone: "/ventures/dumbmoney-phone.png",
  measure: [
    "Verified-code success rate at checkout — the number the product exists for",
    "Deals live and brands covered, counted the same way every month",
    "Repeat visitors: does a shopper come back before the next sale?",
    "Time from a code expiring to it leaving the catalogue",
  ],
  ownership: {
    decided: [
      "What DumbMoney is for: a code that works, not the longest list — the product standard, as CPO",
      "That verification is the feature: automated expiry and duplicate checks, then a person, before a code goes live",
    ],
    withTeam: [
      "Run with co-founder Akshat Somani",
      "Every coupon on the site is attributed to whichever of us checked it",
      "The catalogue is updated daily; the site says openly that not every code is yet tested at checkout",
    ],
  },
  report: [
    {
      label: "The problem",
      body: [
        "Coupon sites in India are long lists of codes that have mostly expired. A shopper tries three at checkout, none work, and the site has still earned its click. The incentive is the list, not the shopper.",
        "DumbMoney is built on the opposite bet: fewer codes, each one checked, and a name next to it saying who checked it.",
      ],
    },
    {
      label: "What it is",
      body: [
        "A catalogue of coupon codes, promo codes and cashback offers from Indian retailers — Amazon, Flipkart, Myntra, Zomato, MakeMyTrip and the other stores Indian shoppers actually use — organised by store and by category (beauty, electronics, fashion, food, travel, pharmacy, gifting…). Browse, copy the code, use it at checkout. No account.",
        "A hot-deals section that updates through the day, and a blog that teaches the mechanics: how sale-day coupons stack, why codes stop working.",
      ],
    },
    {
      label: "How a code gets in",
      body: [
        "Automated checks first — expiry, duplicates — then a person reads it before it goes live. Every published coupon carries the name of the founder who checked it. The about page says the rest plainly: not every code is yet tested at checkout. That sentence is the standard we are working toward, written down where users can see it.",
      ],
    },
    {
      label: "My role",
      body: [
        "Founder and Chief Product Officer. The product — what DumbMoney is for, what ships, what the site promises and refuses to promise — is mine. I also write for it: the two pieces below are the kind of thing a shopper actually needs the week before a sale.",
        "An earlier design concept for the brand is on Behance, linked at the foot of this page.",
      ],
    },
    {
      label: "What I would measure",
      body: [
        "The list in the results strip above. The one that matters is the first: of the codes people copy, how many work. Everything else on a coupon site is a proxy for that.",
      ],
    },
  ],
  writing: [
    { title: "How to Use Coupons During Big Billion Days & Great Indian Festival", date: "15 Sep 2026", href: "https://dumbmoney.in/blog/how-to-use-coupons-big-billion-days-great-indian-festival" },
    { title: "Why Coupon Codes Stop Working (And How to Avoid Expired Ones)", date: "10 Sep 2026", href: "https://dumbmoney.in/blog/why-coupon-codes-stop-working" },
  ],
  lineage: { label: "Dumb Money — the earlier concept, on Behance", href: "https://www.behance.net/gallery/217772229/Dumb-Money" },
};
