import type { FieldNote } from "./types";

/*
 * The six independent case studies. Product/UX analyses of products Ali does
 * not work on — NOT client work, and labelled as such wherever they appear.
 *
 * Ported from the long-form write-ups on the previous site and rewritten in
 * this site's voice. One deliberate change from the originals: the survey
 * percentages and "impact projections" (35% conversion lift, 40% churn
 * reduction, and so on) are gone. They had no citable source, and a number
 * that cannot be sourced reads as invented to exactly the reader these are
 * for. Each note instead closes with what it would measure — which is the
 * more honest, and more PM-shaped, answer.
 *
 * A body line starting with "## " renders as a subheading (see ui.tsx Body).
 */

export const fieldNotes: FieldNote[] = [
  {
    slug: "linear-vs-jira",
    cover: "/notes/linear-vs-jira.jpg",
    title: "Linear vs Jira",
    kind: "case-study",
    premise: "Two tools for the same job, built on opposite beliefs about what a team is.",
    published: "2024",
    body: [
      "Jira won project management by being able to become anything. Twenty years of plugins, custom fields, workflow schemes and permission matrices mean a Jira instance can model any process a company has ever had — including the ones it should have abandoned. The cost of that flexibility is paid by the people who do not configure it: individual contributors, who open a ticket and wait for a server round-trip, learn a workflow that differs from the team next door, and spend a measurable slice of every day fighting the tool rather than the problem.",
      "Linear made the opposite bet. It decided what a good engineering workflow looks like, encoded it as the default, and refused most of the customisation that would let a team drift away from it. It is faster because it is local-first; it is simpler because it is opinionated; it spread because the first thirty seconds of using it make the contrast with the incumbent obvious. This note is about why that bet worked, and what it says about product management generally.",
      "## The problem Jira actually has",
      "Jira's problem is not that it is slow, though it is. It is that it optimises for the wrong user. The admin who configures a workflow is a different person from the engineer who lives inside it, and Jira's flexibility serves the first at the direct expense of the second. Every custom field is a small tax on every ticket. Every plugin is a small inconsistency between teams. Every week of setup before a team gets value is a week in which the tool is a cost and not yet a benefit.",
      "Two failure modes follow from that. Intake becomes chaos, because a backlog with no opinion about triage accepts everything. And scaling becomes political, because bottom-up adoption by engineers runs into top-down control by admins, and admins own the configuration.",
      "## What Linear did instead",
      "Local-first architecture. Every action — creating an issue, changing status, assigning — happens on the client immediately and syncs to the server afterwards. The perceived speed is not an optimisation of the same design; it is a different design, and it is the single largest reason the product feels the way it does.",
      "Encoded workflow. Cycles roll automatically. Triage is a native inbox, not a plugin. Projects have a shape. The eighty percent of what good engineering teams do by hand in Jira is simply how Linear works out of the box, which turns onboarding from weeks into an afternoon.",
      "Keyboard-first discovery. The command palette is not a power-user feature bolted on later; it is the primary interface, and it makes the product's value discoverable in the first session.",
      "Constraint as strategy. Linear rejects features that would compromise speed. That sounds like a slogan until you notice how many requested features it has publicly declined, and that it has shipped a product this coherent with a very small product team.",
      "Bottom-up scaling. It started as a tool engineers chose for themselves, and added SSO, audit logs and enterprise controls only after teams inside large companies had already adopted it. The enterprise sale was a formality by the time it happened.",
      "## Design principles I take from it",
      "Speed over flexibility: any feature that slows the core loop for the majority is not worth the edge case it serves. Encoded best practice: productise what the best teams do manually, as defaults. Build for the individual contributor, because they are the ones who bring the tool in. Treat a performance budget as a product decision, not an engineering one. And make the value visible in seconds — a product that needs a demo deck to explain itself has already lost to one that does not.",
      "## What I would measure",
      "Time from signup to a team's first real cycle. Median latency of the ten most common actions, measured on the client. Share of teams still using the default workflow after ninety days — the number that tells you whether the opinion held. And qualitative: how a new engineer describes the tool after one week, unprompted.",
      "## The learning",
      "Product managers do not win by saying yes to more. Linear is an argument that ruthless constraint scales faster than infinite flexibility, particularly when the users you constrain are the power users who evangelise inside their own companies. Saying no strategically is the job.",
    ],
  },
  {
    slug: "ai-code-assistant-adoption-paradox",
    cover: "/notes/ai-code-assistant-adoption-paradox.jpg",
    title: "The AI Code Assistant Adoption Paradox",
    kind: "case-study",
    premise: "Everyone has one. Fewer people can say what changed.",
    published: "2024",
    body: [
      "The published studies say AI code assistants make developers substantially faster. The developers I have watched use them tell a more complicated story: an initial burst of enthusiasm, then a quiet drift back to writing most things by hand, with the assistant demoted to autocomplete for boilerplate. The productivity is real and the resistance is also real, and the gap between them is a product design problem, not a model quality problem.",
      "## Why developers pull back",
      "Trust. Generated code arrives with no account of why it is shaped the way it is, and a developer who cannot see the reasoning cannot judge the risk. Control. A tool that inserts code faster than you can read it changes who is driving, and experienced engineers notice that immediately and dislike it. Workflow. Most assistants live in a chat window beside the editor rather than inside the flow of writing, reviewing and shipping. Ownership and security. Teams do not have settled answers for who owns generated code, or what leaves the building when a file is sent to a model. Quality anxiety. Every senior engineer has a story about plausible-looking code that was wrong, and each one raises the bar for the next suggestion.",
      "Senior developers resist more than juniors, which is the opposite of what a naive adoption model predicts, and it is the most useful signal in the whole problem: the people with the most judgment are the ones the current designs serve worst.",
      "## What the product should be",
      "Suggest, do not decide. Every suggestion is explicit and accepted deliberately; nothing lands in the file because the developer paused. Explain. Show why this code, what pattern it follows, and — where it matters — how confident the model is. Offer alternatives, not one answer, so the developer is choosing rather than approving. Integrate. The assistant belongs in the editor, in review, and in CI, and its output goes through the same review the rest of the code does. Learn the codebase. Suggestions that respect the team's conventions are the difference between a helpful colleague and a talented stranger. Build trust with evidence: security scanning on generated code, and a visible record of how suggestions performed over time.",
      "The metaphor that fits is pair programming, not autopilot. A good pair explains what they are doing, defers when you disagree, and gets better at working with you specifically. An autopilot asks you to look away.",
      "## Design principles",
      "Developer agency is non-negotiable. Transparency over magic. Verification should be easier than trust. Fit the existing workflow rather than replacing it. Start narrow and earn scope as trust accrues. And treat the assistant as something that teaches, not only something that types.",
      "## What I would measure",
      "Weekly active use at ninety days, split by seniority — the retention curve, not the trial. Acceptance rate of suggestions, and more importantly the edit distance between what was suggested and what shipped. Review time and defect rate on generated versus hand-written changes, from the same team over the same period. And the one that matters most: how often a developer reaches for the tool when the task is hard, not just when it is boring.",
      "## The learning",
      "Adoption is not a feature problem. It is a trust, control and integration problem, and the tools that win will be the ones designed around how expert developers actually work rather than around how impressive a demo can be made to look.",
    ],
  },
  {
    slug: "apple-ecosystem-fragmentation",
    cover: "/notes/apple-ecosystem-fragmentation.jpg",
    title: "Apple Ecosystem Fragmentation",
    kind: "case-study",
    premise: "The company most associated with coherence, examined at its seams.",
    published: "2024",
    body: [
      "Apple sells one idea above all others: it just works, and it works the same everywhere. That promise is why people buy the second and third device. It is also, in practice, where the ecosystem is weakest. The same task — sharing a file, managing a notification, finding a setting, moving a piece of work from one screen to another — feels different on iPhone, iPad and Mac, and the difference is not always because the device demands it.",
      "## Where the seams are",
      "Inconsistent mental models. A gesture, a menu location or a name that differs across platforms forces the user to relearn something they already know. Context-switching cost. Moving mid-task from Mac to iPhone means reconstructing where you were, not only reopening the app. Feature parity gaps. Capabilities that exist on one device and not another break the expectation the ecosystem has spent years building. Design language drift. Some divergence is right — a pointer is not a finger — but a good deal of it is historical accident, the residue of separate teams shipping on separate calendars.",
      "The people who notice most are power users, who develop private workarounds, and new users, who expected the promise and find the seams first. Both groups quietly discount the value of owning the whole set.",
      "## What I would build",
      "A unified interaction language: one set of gestures, animations and feedback patterns, defined once and adapted per input method, so that learned behaviour transfers. A context continuity layer that carries not just the open document but the working state — position, selection, intent — across the hand-off, so that the second device picks up rather than restarts. Adaptive parity: functional equivalence as the rule, with device-specific exceptions made deliberately and explained, not discovered. And progressive disclosure that is consistent across devices, so complexity is revealed on the same schedule whether the screen is six inches or twenty-seven.",
      "## Design principles",
      "Familiarity over novelty: reuse what the user already learned on their other device. Preserve context and intent, not just files. Adapt to the device's strengths without abandoning the shared pattern. And make behaviour predictable — a user who has used a feature on one device should be able to guess how it works on the next.",
      "## What I would measure",
      "Task completion when a task starts on one device and finishes on another, against the same task on a single device. Time to first productive action after a hand-off. Support and search queries of the form 'where is X on iPad' — the ecosystem's own confusion, written down by its users. And multi-device engagement over time, because that is the number the promise is supposed to move.",
      "## The learning",
      "Coherence is a product, not a by-product. It has to be owned by someone whose remit crosses the device teams, or it erodes one reasonable local decision at a time. The lesson generalises to any company with more than one surface.",
    ],
  },
  {
    slug: "flipkart-product-discovery",
    cover: "/notes/flipkart-product-discovery.jpg",
    title: "Flipkart Product Discovery",
    kind: "case-study",
    premise: "Discovery at catalogue scale, where the shelf is infinite and attention is not.",
    published: "2024",
    body: [
      "A catalogue of well over a hundred million products does not have a search problem; it has a discovery problem, and they are not the same thing. Search assumes the user can name what they want. Most of the interesting shopping — and most of the abandoned sessions — happens when they cannot: they know the job, the budget, the occasion, or a picture in their head, and the platform asks them for a keyword.",
      "## The specific failures",
      "Search overload: a generic query returns too much, and the ranking has to guess an intent the query never expressed. Category ambiguity: the same product lives in several places, so browsing by category is a coin toss. Personalisation gaps: recommendations that ignore region, price sensitivity and the context of the visit feel generic in a market where those three things decide almost everything. Mobile-first reality: patterns inherited from desktop, with its wide filters and long result lists, do not survive a five-inch screen and a patchy connection. Language: a large share of users do not think in English product names, and both text and voice search punish them for it.",
      "## What I would build",
      "An intent layer above search: semantic understanding of the query, visual search from a photo, voice tuned for Indian accents and product vocabulary, and parsing of compound queries that carry several constraints at once. A discovery engine that treats context as a first-class input — location, time, device, budget signals, what similar households nearby actually buy — so that the home surface is a shelf arranged for this person rather than a leaderboard. Progressive navigation: categories that adapt to behaviour, filters with visual previews, one-tap presets for the common jobs, and comparison that does not require opening five tabs. And discovery moments — trending, deals, inspiration, social proof — as editorial surfaces with a point of view, not a carousel of whatever converts.",
      "## Design principles",
      "Intent over keywords. Progressive disclosure: the right few options first, more on demand. Contextual intelligence: adapt to where the user is and what they are doing, not to who they were last month. And reduce the distance between finding and buying at every step, because each step is where the session dies.",
      "## What I would measure",
      "Share of sessions that end in a purchase when they began without a specific product in mind. Search abandonment after the second reformulation — the moment the user has told you the query is not working. Pages viewed before the first add-to-cart. Conversion by language and by region, because an average hides exactly the users this is for. And the lift, if any, from each discovery surface measured against a proper holdout rather than against last week.",
      "## The learning",
      "Scale creates its own problems. At this size, discovery is not a feature of the search box; it is the product, and it has to be designed as a system — models, information architecture and editorial judgment together — or the catalogue's size becomes the reason people leave.",
    ],
  },
  {
    slug: "uber-driver-retention",
    cover: "/notes/uber-driver-retention.jpg",
    title: "Uber Driver Retention",
    kind: "case-study",
    premise: "A two-sided marketplace where one side can leave on any given Tuesday.",
    published: "2024",
    body: [
      "Ride-hailing spends heavily to recruit drivers and then loses a large share of them within the first few months. The recruiting cost is visible; the cost of churn — service quality, surge volatility, the constant reset of a workforce that never becomes experienced — is spread across the whole business and easy to ignore. The driver app is where the relationship is actually conducted, and it is designed for the transaction rather than for the person doing the work.",
      "## What drivers are dealing with",
      "Earnings they cannot predict, which makes planning a week impossible. A sense of being managed by an algorithm they cannot see, with incentives and surge rules they do not understand. Support that is slow when it is needed most. No help managing time, so burnout is the default. No visibility into whether this work adds up over a year. And safety concerns that the product acknowledges without really addressing. New drivers, on top of all of that, meet an interface built for people who already know how it works.",
      "## What I would build",
      "Earnings transparency: predicted earnings by time and zone, live tracking with a breakdown by ride type, history that shows when and where the work pays, and goals a driver can set and be coached toward. Work management: suggested hours, preferred zones, break prompts, and an honest accommodation of the fact that many drivers run more than one app. Empowerment: more say over which rides to take, two-way ratings, a community that is not a subreddit, and material that actually improves earnings. Support that is in-app, fast, and routed by problem type, with experienced drivers as advocates for new ones. And financial wellness: forecasting, expense tracking so that net earnings are visible, tax help, and savings goals.",
      "## Design principles",
      "Transparency first: show how the system decides. Control and choice: give drivers levers that matter. Financial clarity: earnings should be predictable and legible. Respect: the product should treat drivers as partners because the business depends on them behaving like partners. And growth: help drivers succeed at the work, not only complete the next ride.",
      "## What I would measure",
      "Retention at ninety days and at six months, cohort by cohort, before and after each change. The gap between predicted and actual earnings — the trust metric. Support resolution time and ticket volume per active driver. Hours worked per retained driver, which tells you whether the ones who stay are also the ones who thrive. And churn reasons, collected at exit and coded, so the product hears what the drivers say rather than what the dashboard implies.",
      "## The learning",
      "A marketplace has to balance its own efficiency against the well-being of the people supplying it. Transparency, control and support are how a transactional relationship becomes a durable one — and the full journey of the supply side deserves the same design attention the demand side has always had.",
    ],
  },
  {
    slug: "the-logistics-visibility-gap",
    cover: "/notes/the-logistics-visibility-gap.jpg",
    title: "The Logistics Visibility Gap",
    kind: "case-study",
    premise: "Everything is tracked. Very little is actually visible.",
    published: "2024",
    body: [
      "Modern logistics generates an enormous amount of tracking data and very little visibility. The shipper sees one system, the carrier another, the customer a status page that updates when someone remembers to scan. Nobody can answer the only question anyone asks — where is it, and when will it arrive — with confidence, and so a large share of customer service is people asking that question by hand. This is the domain I work in day to day, which is why the gap is so visible to me: the data exists; the product that would make it useful mostly does not.",
      "## Where visibility breaks",
      "Manual updates, so information arrives hours after the event. Silos: each party has its own truth and no one has the whole picture. No prediction: delays are discovered, not anticipated, even when the signals were there. No shared channel, so a problem becomes a chain of phone calls. The last mile, which matters most to the recipient, is the least instrumented stretch of the whole journey. Exceptions with no owner and no path. And multi-carrier shipments, where the hand-offs are exactly where the tracking goes dark.",
      "## What I would build",
      "A real-time layer: vehicle and package telemetry feeding automatic status without a human scan, unified across carriers behind one interface. A predictive layer: models that flag a likely delay before it is late, continuously refined ETAs, route adjustments, and anomaly detection that raises the exception instead of waiting for a complaint. One communication surface: a shared dashboard where shipper, carrier and recipient see the same shipment; proactive notifications that fire on events people care about and stay quiet otherwise; self-service for the questions that do not need a person. Visibility layers on the shipment itself: live location and ETA, milestones, condition monitoring for sensitive goods, and proof of delivery. And exception management with automatic detection, clear resolution paths, escalation when a path stalls, and root-cause review so the same failure does not recur.",
      "## Design principles",
      "Transparency over obscurity. Proactive over reactive. One system and one truth for many stakeholders. Automated over manual wherever a human is only relaying a fact. And contextual: the right information at the right moment, which for a recipient is usually 'it is late, here is why, here is the new time'.",
      "## What I would measure",
      "Share of support contacts that are 'where is my order' — the metric that should go to near zero. Median time between a shipment event and the status reflecting it. ETA accuracy, and the share of delays flagged before they occurred. Exception resolution time. And satisfaction on delayed shipments specifically, because a late delivery that was communicated well is a different experience from one that was not.",
      "## The learning",
      "Visibility is what turns logistics from a black box into something that can be managed. Telemetry and prediction are necessary; the product that puts them in front of the right person at the right moment is what actually closes the gap — and it has to be designed across the whole stakeholder set, not just for whoever pays for it.",
    ],
  },
];

export function getFieldNote(slug: string) {
  return fieldNotes.find((n) => n.slug === slug);
}
