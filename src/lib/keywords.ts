/*
 * Keyword sets for meta tags and structured data.
 *
 * Grouped so pages can take the slice that fits them and the root can take
 * everything. Deliberately broad — the person, the roles he is after, the
 * domains he works in, the tools, the places, the kinds of content on the
 * site, and the site's own genre (a 3D, space-themed portfolio) — but never
 * random: engines score unrelated terms as spam, and a hiring manager who
 * lands here from "product manager portfolio India" should find exactly
 * that.
 */

export const identityKeywords = [
  // Every form of the name a person might type, plus the handles he uses.
  // Expanded 2026-09-24 at Ali's request: name search is the one query set
  // where a personal site can genuinely win, because the competition for
  // "Ali Azam Kazmi" is only other Ali Azam Kazmis. A bare "Ali" is not
  // winnable by anyone and is left out on purpose - see the note in seo.ts.
  "Ali Azam Kazmi",
  "Ali Kazmi",
  "Ali Azam",
  "Azam Kazmi",
  "A A Kazmi",
  "Kazmi Ali Azam",
  "aliazamkazmi",
  "aliazam1291",
  "aliazamkazmi1291",
  "Ali Azam Kazmi portfolio",
  "Ali Azam Kazmi website",
  "Ali Azam Kazmi resume",
  "Ali Azam Kazmi CV",
  "Ali Azam Kazmi contact",
  "Ali Azam Kazmi product manager",
  "Ali Azam Kazmi product engineer",
  "Ali Azam Kazmi UX",
  "Ali Azam Kazmi New Delhi",
  "Ali Azam Kazmi India",
  "Ali Azam Kazmi MapMyIndia",
  "Ali Azam Kazmi Gtropy",
  "Ali Azam Kazmi Mappls",
  "Ali Azam Kazmi SRM",
  "Ali Azam Kazmi SRMIST",
  "Ali Azam Kazmi Smaak.ux",
  "Ali Azam Kazmi DumbMoney",
  "Ali Kazmi product manager",
  "Ali Kazmi DumbMoney",
  "Ali Kazmi MapMyIndia",
  "Ali Kazmi New Delhi",
  "Kazmi product manager",
  "Smaak.ux",
  "Smaak ux",
  "DumbMoney founder",
  "DumbMoney CPO",
  "DumbMoney Ali Kazmi",
  "Chief Product Officer",
];

export const roleKeywords = [
  "product manager portfolio",
  "product manager portfolio India",
  "associate product manager portfolio",
  "APM portfolio",
  "product engineer portfolio",
  "product engineer",
  "UX strategist",
  "UX strategist portfolio",
  "product designer portfolio",
  "frontend engineer portfolio",
  "technical product manager",
  "product-minded engineer",
  "PRD writer",
  "product owner",
  "hire product manager New Delhi",
  "product manager Delhi NCR",
  "product manager Gurgaon",
  "product manager Bangalore remote",
  "product management jobs India",
];

export const domainKeywords = [
  "fleet telematics",
  "fleet management platform",
  "vehicle tracking software",
  "telematics dashboard",
  "GPS tracking platform",
  "logistics platform product",
  "geospatial products",
  "map SDK integration",
  "Mappls SDK",
  "MapmyIndia",
  "MapMyIndia Gtropy",
  "government fleet tracking India",
  "LPG tanker tracking",
  "IOCL fleet tracking",
  "FASTag registration platform",
  "OEM vehicle monitoring",
  "driver behaviour analytics",
  "route playback",
  "geofencing",
  "real-time alerts and ticketing",
  "enterprise SaaS dashboards",
  "B2B product management",
];

export const skillKeywords = [
  "React",
  "Next.js",
  "Angular",
  "Ionic",
  "TypeScript",
  "RxJS",
  "D3.js",
  "Three.js",
  "React Three Fiber",
  "WebGL",
  "Node.js",
  "MongoDB",
  "REST APIs",
  "Tailwind CSS",
  "Figma",
  "Spline",
  "OpenCV",
  "Tesseract OCR",
  "TensorFlow",
  "AWS S3",
  "Vite",
  "performance optimisation",
  "data visualisation",
  "design systems",
  "UX research",
  "usability testing",
  "wireframing and prototyping",
  "user story mapping",
  "roadmapping",
  "A/B testing",
  "competitive analysis",
  "stakeholder management",
  "Agile Scrum",
];

export const contentKeywords = [
  "product case studies",
  "product management case study",
  "UX case study",
  "product teardown",
  "UX teardown",
  "Linear vs Jira",
  "Linear vs Jira case study",
  "AI code assistant adoption",
  "GitHub Copilot adoption",
  "Apple ecosystem fragmentation",
  "Flipkart product discovery",
  "e-commerce discovery UX",
  "Uber driver retention",
  "gig economy driver experience",
  "logistics visibility",
  "supply chain visibility",
  "mission reports",
  "PRD examples",
  "product thinking",
  "product strategy",
];

/*
 * AI (2026-09-23). The site now carries five essays on AI product work and
 * the keyword sets had two AI terms between them. Every phrase here maps to
 * something actually written — the four jobs an "AI PM" posting means, the
 * PRD for a non-deterministic feature, agents that act, AI inside an
 * operational product, and the review bottleneck. Nothing aspirational:
 * a term with no page behind it is the kind of thing engines score as spam.
 */
export const aiKeywords = [
  "AI product manager",
  "AI product management",
  "AI product manager India",
  "AI PM",
  "AI PM roles",
  "AI product manager portfolio",
  "PRD for AI features",
  "AI feature requirements",
  "writing a PRD for an AI feature",
  "LLM evals",
  "evals for product managers",
  "acceptance criteria for AI",
  "non-deterministic software requirements",
  "AI agents in production",
  "agentic AI product management",
  "enterprise AI agents",
  "agent autonomy levels",
  "human in the loop AI",
  "AI in fleet software",
  "AI in telematics",
  "AI ranking alerts",
  "AI code review bottleneck",
  "AI assisted development",
  "AI coding assistants",
  "model powered features",
  "AI product strategy",
  "generative AI product",
];

export const genreKeywords = [
  "space themed portfolio",
  "3D portfolio website",
  "WebGL portfolio",
  "interactive portfolio",
  "creative developer portfolio",
  "Three.js portfolio",
  "React Three Fiber portfolio",
  "black hole shader",
  "procedural planets WebGL",
  "galaxy visualisation",
  "mission control UI",
  "sci-fi UI design",
  "HUD interface design",
  "hologram UI",
  "futuristic website design",
  "cinematic scroll website",
  "scroll-driven 3D",
  "Space OS",
  "Mission Control portfolio",
];

export const placeKeywords = ["New Delhi", "Delhi", "India", "Delhi NCR", "SRM Institute of Science and Technology", "SRMIST Chennai"];

export const allKeywords = [
  ...identityKeywords,
  ...roleKeywords,
  ...domainKeywords,
  ...skillKeywords,
  ...contentKeywords,
  ...aiKeywords,
  ...genreKeywords,
  ...placeKeywords,
];

/** De-duplicated merge, preserving order, for per-page keyword lists. */
export function keywordsFor(...groups: string[][]) {
  return [...new Set(groups.flat())];
}
