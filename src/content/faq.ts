import { education, lookingFor, profile } from "./profile";
import { missions } from "./missions";
import { venture } from "./venture";

/*
 * The questions a screening call opens with (2026-09-24). Ali: "we need a
 * FAQ page, I think that will help to get more SEO."
 *
 * One correction lives in the page's own copy and belongs here too: Google
 * **deprecated FAQ rich results on 7 May 2026**, so FAQPage schema no
 * longer wins a dropdown in the results list, and Search Console stopped
 * reporting them in June. This page is not built for that.
 *
 * It is built for two things that are real. First, a recruiter or hiring
 * manager arrives with a fixed set of questions — what is he looking for,
 * is he technical, what has he actually shipped, why is an engineer moving
 * into product — and answering them in writing beats making them ask.
 * Second, answer engines (Perplexity, ChatGPT, AI Overviews) ground their
 * summaries on Q&A content, and that is a live and growing surface.
 *
 * EVERY answer is a PROFILE.md fact or a link to a page built from one.
 * Questions the file cannot answer — notice period, relocation, whether he
 * will take a remote role — are NOT here, because a guess in an FAQ is a
 * guess a recruiter will hold him to. They are listed in `awaiting` below
 * and go in the moment Ali says.
 */

export type Faq = {
  q: string;
  /** Paragraphs. "## " is not supported here; keep answers to two at most. */
  a: string[];
  /** Where on this site the answer is evidenced. */
  more?: { label: string; href: string };
};

const shipped = missions.filter((m) => m.status !== "active").length;

export const faqs: Faq[] = [
  {
    q: "What kind of role are you looking for?",
    a: [
      `${lookingFor}. Product manager, associate product manager or technical PM — the versions of the job where writing the document and shipping the thing are the same job.`,
      `I am in New Delhi and currently ${profile.currentRole} at ${profile.currentOrg}.`,
    ],
    more: { label: "The open channel", href: "/contact" },
  },
  {
    q: "You are an engineer. Why move into product management?",
    a: [
      "Because I have been doing the product half for two years under an engineering title. On every project at MapMyIndia the role has been the same four things at once: build the frontend, own the UI and UX, work across the teams, and write the PRD that says what we are actually solving — problem statement, user stories, acceptance criteria, edge cases.",
      "The shorter answer is that the part of the week that got dramatically faster this year was the building, and the part that did not budge was deciding what to build. That is where the work is now.",
    ],
    more: { label: "The essay on it", href: "/writing/the-bottleneck-moved" },
  },
  {
    q: "What have you actually shipped?",
    a: [
      `${missions.length} products, ${shipped} of them shipped and three active. Enterprise fleet and telematics platforms, mostly: Vahan Shakti (a government programme, 200,000+ users), Intouch (10,000+ active vehicles, architected for 50,000), Locate (20,000+ vehicles across Maharashtra), an IOCL route pipeline carrying 30,000+ routes, plus FASTag registration and an alert and ticketing platform.`,
      "Two of them are on the Play Store and linked from their reports. Each report carries the problem, the decisions, what shipped, and whether anything was measured.",
    ],
    more: { label: "All ten missions", href: "/missions" },
  },
  {
    q: "Are you technical?",
    a: [
      "Yes, and still writing code. TypeScript and React across most of the fleet work, plus Angular, Ionic, Node, RxJS, D3 and the Mappls SDK; Python, OpenCV and TensorFlow on the earlier OCR work.",
      "The relevant part for a product role is not the list. It is that I know which edge cases are real — a route playback with a hole in the GPS data, an alarm that can fire twice, a dashboard that is fine at a hundred vehicles and unusable at ten thousand — and I can write them into a document before anyone builds the wrong thing.",
    ],
    more: { label: "What the work was built with", href: "/flight-data#stack" },
  },
  {
    q: "What did you own on those projects, exactly?",
    a: [
      "It varies by project and the site says which is which rather than blurring it. Frontend on nine of ten, UI and UX on six, cross-team delivery on six, the PRD on two. Every line is matched against that mission's own role description — nothing is claimed that the report does not say.",
      "There is a matrix showing it project by project, including the ones where I owned less.",
    ],
    more: { label: "The ownership matrix", href: "/flight-data#ownership" },
  },
  {
    q: "Do you have results to show for it?",
    a: [
      "Some, and the site is explicit about which. Five of the ten missions carry a measured number that I can point at a source for. The other five do not, and they say so rather than borrowing one — three are still active, so no outcome exists yet, and for those the reports name what will be measured.",
      "The largest verified figures: 200,000+ users on Vahan Shakti, 30,000+ routes injected on the IOCL pipeline, 20,000+ vehicles monitored on Locate, and a roughly 40% performance improvement on data-heavy dashboards through caching, RxJS state management and API work.",
    ],
    more: { label: "Evidence coverage, per mission", href: "/flight-data#evidence" },
  },
  {
    q: "Do you run anything of your own?",
    a: [
      `Two things. ${venture.title} (${venture.urlLabel}), where I am ${venture.role} with co-founder ${venture.cofounder.name} — a coupon platform for Indian shoppers built on one standard: a code that works, rather than the longest list.`,
      "And Smaak.ux, a product and design studio I founded in 2023 — ten or so clients across SaaS, creator brands, e-commerce and home décor.",
    ],
    more: { label: "The venture", href: "/dumbmoney" },
  },
  {
    q: "Where are you based, and what languages do you work in?",
    a: [
      `${profile.location}. I work in ${profile.languages.join(" and ")}.`,
    ],
  },
  {
    q: "What did you study?",
    a: [
      `${education.degree} at ${education.school}, ${education.period}, ${education.detail}.`,
      "Since then: Technical Product Management with Aha!, the four-course Google UX Design certificate, and two AWS Academy certificates in cloud and machine-learning foundations.",
    ],
    more: { label: "The full log", href: "/mission-history" },
  },
  {
    q: "Can I see your résumé?",
    a: [
      "Yes — there is a one-page PDF, and the same information is on this site in a form you can actually click through: roles with dates, what each involved, and a report behind every project named on it.",
    ],
    more: { label: "Résumé (PDF)", href: "/Ali_Azam_Kazmi_.pdf" },
  },
  {
    q: "How do you decide what to build?",
    a: [
      "There are seven rules I work by and each one comes with the project it was learned on — define the states before the screens, write the document early enough to be wrong cheaply, treat speed as a product decision, replace the manual process rather than decorating it.",
      "They are on the site with their evidence attached, which is the only way a claim like that means anything.",
    ],
    more: { label: "The flight rules", href: "/decisions" },
  },
  {
    q: "What is this site built with, and why does it look like this?",
    a: [
      "Next.js, TypeScript and React Three Fiber, with the 3D done in three.js. No page builder, no template — every scene, instrument and chart is written for this site.",
      "The reason it is a spaceship rather than a grid of cards is that a portfolio is a product, and I would rather show judgement by building something with a point of view than assert it in a paragraph. The content underneath is conventional: problem, decision, outcome, and what was not measured.",
    ],
    more: { label: "The portfolio, measured", href: "/flight-data" },
  },
];

/*
 * Questions a recruiter asks that PROFILE.md cannot answer. They stay off
 * the page until Ali gives the answers — an FAQ that guesses at a notice
 * period is worse than one that is silent about it.
 */
export const awaiting = [
  "Notice period and earliest start date",
  "Remote, hybrid or on-site — and whether he would relocate",
  "Salary expectation, if it should be public at all",
  "Whether references can be shared on request",
];
