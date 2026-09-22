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
    title: "How to write a PRD for a feature that can be wrong",
    outlet: "Space OS",
    date: "2026-09-23",
    slug: "prd-for-an-ai-feature",
    href: "/writing/prd-for-an-ai-feature",
    status: "published",
    kind: "essay",
    line: "A PRD works because software is deterministic. A model is not. What acceptance criteria become when the same input can produce a different answer on Tuesday.",
    related: { label: "How I approach PRDs as an engineer", href: "/writing/prds-as-an-engineer" },
    body: [
      "Every PRD I have written rests on an assumption nobody states: the same input produces the same output. You write what must happen, engineering builds it, a tester checks it, and Tuesday behaves like Monday. Put a model in the middle and that assumption is gone. The document does not survive unchanged, and pretending otherwise is how AI features ship without anyone able to say whether they work.",
      "## The criteria that stop working",
      "“The summary is accurate.” “The assistant answers the user’s question.” “Suggestions are relevant.” These read like acceptance criteria and are not: nobody can run them, and two reasonable people will disagree about whether a given output passed. On deterministic software I could write “within 400ms, the marker turns amber” and a tester could check it without asking me. That is the bar a criterion has to clear. Vague criteria do not survive contact with a Tuesday afternoon build; with a model they do not survive the first output.",
      "## What replaces them: a set of cases, and a rule for how many must pass",
      "The unit stops being a statement and becomes a collection. You write down thirty real inputs — the ordinary ones, the ones users actually send, and the ones you are afraid of — and for each you say what a good answer looks like and what an unacceptable one looks like. The criterion is then statistical: this share must be acceptable, and this specific set must never fail. “No case in the safety set produces an instruction that could damage a vehicle” is checkable. “The assistant is helpful” is not.",
      "Building that collection is product work, not engineering work. Choosing which thirty inputs matter is the same decision as deciding what the feature is for, and it is exactly the decision a PM should not hand to someone else.",
      "## Failure is a gradient, so the document has to rank the kinds of wrong",
      "Deterministic features fail loudly: the API errors, the screen is blank, someone files a ticket. Model-powered features fail quietly and partially — the answer is plausible, slightly wrong, and nobody notices for a month. So the PRD has to name the kinds of wrong and put them in order. In fleet software the order writes itself: an alert that fires when nothing happened costs an operator thirty seconds; an alert that stays silent while a vehicle sits stationary for four hours in the wrong place costs a delivery. Those two failures are not equal and must never be averaged into one accuracy number.",
      "## Edge cases are where engineering knowledge earns its place",
      "This is the part an engineer can do that a pure spec-writer often cannot: knowing which edge cases are real. On deterministic work that meant a route playback with a gap in the GPS data, an alarm that can fire twice, a dashboard that is fine at a hundred vehicles and unusable at ten thousand. The model-powered version is: what happens when the input arrives in a language nobody planned for, when the retrieved context is stale, when the model is confidently wrong, when the provider is slow, and when the same question is asked twice, answered differently, and the user notices. Writing these down up front is cheaper than discovering them in a demo.",
      "## Cost and latency are product constraints, not infrastructure details",
      "This one feels like engineering and is not. A response that takes eight seconds is a different product from one that takes eight hundred milliseconds — it decides whether the feature belongs in the flow or beside it. A feature that costs more per call than the work it saves is a feature you cancel later, at greater expense. At fleet scale I learned that rendering ten thousand markers was a UX decision as much as an engineering one, because performance changed what the operator could see. Same logic: the budget shapes what the feature can be, so it belongs in the document that says what the feature is.",
      "## What I would measure",
      "Not model accuracy. The share of outputs a person accepts without editing; the share of suggestions someone acts on; how often a user asks the same thing twice because the first answer was not usable. And one almost nobody tracks: how long it takes the team to notice when quality drops — because with a probabilistic system it will, and silently.",
    ],
  },
  {
    title: "An AI agent that acts is an alarm that fires",
    outlet: "Space OS",
    date: "2026-09-23",
    slug: "agents-and-the-alarm-problem",
    href: "/writing/agents-and-the-alarm-problem",
    status: "published",
    kind: "essay",
    line: "Plenty of enterprise agent pilots, far fewer agents in production. Fleet software solved a version of this problem years ago, and the lesson is not about the model.",
    related: { label: "The mission the alarms were built for", href: "/missions/control-tower" },
    body: [
      "The industry is spending 2026 discovering that an agent which *can* act is not the same as an agent anyone *lets* act. Every survey of enterprise adoption I have read this year lands on the same shape: a lot of pilots, far fewer things running in production, and quality named as the reason. I have built the pre-AI version of this problem — alert systems for vehicle fleets — and the failure mode is old enough to have a name.",
      "## The alarm problem",
      "Build a system that detects conditions and it will detect them. Within a week the operator has three hundred notifications a day, of which four matter. By week three they are clearing the list without reading it, and the system is now worse than nothing, because everyone believes the fleet is monitored. Detection was never the hard part. The hard part is that an alert nobody acts on is noise, and noise teaches people to ignore the channel it arrives on.",
      "An agent is this with the volume turned up. It does not notify you about a condition, it takes an action about it — and the equivalent of a dismissed alert is an action somebody has to undo.",
      "## The hand-off is the product work",
      "On the telematics platforms, alarms, geofences and ticketing were designed as one chain rather than three features: a geofence defines the condition, an alarm says it happened, a ticket says who owns it now. That third link is the one that gets cut from requirements documents, because it is the least interesting to specify and the only one that makes the first two worth building.",
      "Agents need the same chain and usually ship with two links. The agent decides, the agent acts, and then nothing: no record of why, no owner, no route for a human who disagrees. Observability is not ownership — knowing what the agent did tells you nothing about who is accountable for it having been the wrong thing.",
      "## Autonomy is a dial, and it should start low",
      "The useful question is never “can the agent do this” but “what happens the tenth time it does this wrong”. That makes autonomy a product decision with visible settings: suggest and wait; act and notify; act silently and log. Different actions inside the same product deserve different settings, and a setting should be allowed to move as evidence accumulates — which requires the evidence to be collected, which is the step teams skip.",
      "In fleet terms: drafting a ticket is a suggestion, closing one is an action, and dispatching a technician is an action with a cost in diesel. Nobody would give those three the same permissions. Software teams give their agent one permission level and are then surprised by the outcome.",
      "## Trust is withdrawn per action, not per product",
      "The teardown I wrote on AI coding assistants ended on this: developers adopt the tool, then quietly stop trusting it for the parts that matter while continuing to use it for the parts that do not. Nobody files a ticket saying “I no longer trust the suggestions”, so the usage graph stays healthy while the product dies in a way the dashboard cannot show.",
      "The same will happen to agents, and the same metric will hide it. Seats and sessions will look fine while every user quietly narrows the set of things they let the agent touch.",
      "## What I would measure",
      "Of the actions the agent took, how many a human reversed. Of the ones it suggested, how many were accepted without edit. How narrow the set of actions a given user permits it three months in, compared with week one. And the fleet metric that transfers directly: how many alerts ended as closed tickets rather than dismissed noise. That number tells you whether you built a colleague or a notification.",
    ],
  },
  {
    title: "What AI actually changes in fleet software",
    outlet: "Space OS",
    date: "2026-09-23",
    slug: "ai-in-fleet-software",
    href: "/writing/ai-in-fleet-software",
    status: "published",
    kind: "essay",
    line: "Nobody watching two hundred thousand vehicles wants a chatbot. They want the product to notice the thing they would have found an hour later.",
    related: { label: "Vahan Shakti, the mission report", href: "/missions/vahan-shakti" },
    body: [
      "Every category is being told it needs AI, and most are being shown the same demo: a chat box bolted to the corner of an existing product. In fleet and telematics software, where I have spent the last two years, that demo is close to useless — and the genuinely useful version is unglamorous enough that nobody puts it in a launch video.",
      "## The chat box is the wrong shape",
      "An operator watching a live map of thousands of vehicles is not short of ways to ask questions. They are short of attention. An interface that requires them to formulate a query, wait, and read a paragraph adds a step to a job that is entirely about removing steps. Rotating the map to the vehicle’s heading, fitting a whole route into one view, replaying a trip instead of reading a table — each of those was worth building because it removed something a human was doing in their head. A chat box puts one back.",
      "## The useful version is the map noticing first",
      "What is worth building is the product surfacing what the operator would have found an hour later: the vehicle idling somewhere idling does not happen; the route deviation that is about to become a late delivery; the alarm that is statistically noise and can wait. That is not conversation, it is ranking — deciding what deserves the top of a list currently sorted by time.",
      "It is also where the real risk sits. Ranking means something falls below the fold, and a product that quietly demotes the one alert that mattered has done more damage than one that never ranked at all.",
      "## States before screens still holds",
      "Before any of this is possible, a vehicle has to be in exactly one of a known set of states — moving, stopped, idle, delayed, offline — with the lines between them drawn once, in one place. Every attempt I have seen to do something clever on top of location data hits this first: the data says a vehicle is somewhere, the product needs to say a vehicle is *doing* something, and until those five words mean one thing each, no model on top of them can be right, because there is nothing to be right about.",
      "The unglamorous prerequisite for AI in an operational product is a data model somebody argued about.",
      "## Where it pays without anyone calling it AI",
      "Three places, all boring: cutting alert volume so the remaining alerts get read; turning free-text tickets into the structured fields nobody fills in by hand; and extraction — the work I did before fleet software, pulling numbers off documents that arrive as photographs. That last one has been quietly working for years and has never needed a chat interface to do it.",
      "## The scale question everyone skips",
      "At two hundred thousand vehicles, a per-vehicle inference is two hundred thousand inferences. The cost and latency of a feature change what the feature can be, exactly as rendering cost did — clustering and lazy rendering were not visual choices, they were what made the screen readable at all. Any AI feature in this category has the same constraint waiting for it, and it belongs in the requirements document rather than in the first month’s invoice.",
      "## What I would measure",
      "How long an operator takes to find the one vehicle that needs them, before and after. What share of surfaced items end in an action rather than a dismissal. And the honest counter-metric: how often something that mattered was ranked below something that did not. If you cannot measure the third, you have not shipped a ranking feature — you have shipped a hope.",
    ],
  },
  {
    title: "The AI product manager is four jobs, not one",
    outlet: "Space OS",
    date: "2026-09-21",
    slug: "ai-product-manager-four-jobs",
    href: "/writing/ai-product-manager-four-jobs",
    status: "published",
    kind: "essay",
    line: "What the 2026 market is actually hiring when it says “AI PM”, why the junior rung has gone missing, and what an engineer moving into product should read in a posting before applying.",
    related: { label: "A related teardown: the AI coding-assistant adoption paradox", href: "/field-notes/ai-code-assistant-adoption-paradox" },
    body: [
      "I am moving from building products to managing them, in a year when almost every product-management posting has “AI” somewhere in it. This is what I have worked out from reading a great many of them, from shipping software alongside models, and from being on the receiving end of the hiring funnel. It is a market note, not a career guide.",
      "## The title is one word; the work is four",
      "Read past the title and “AI product manager” resolves into four different jobs. The first owns a customer-facing assistant — a chat or copilot surface where the model is the product and the hard problems are trust, latency, and what to do when the answer is wrong. The second owns the platform underneath: models, evaluation, tooling, cost, for teams inside the company who will never talk to a customer. The third ships model-powered features inside a product that is not about AI at all — a smarter search, a summary, a suggestion — where the model is a means and the roadmap is still the roadmap. The fourth runs internal operations tooling, where the customer is a colleague and the metric is hours. These need different people. A posting that does not say which one it is has not finished its own PRD.",
      "## Why I care which one: fleet software is the third job already",
      "The telematics products I have worked on — a map of ten thousand vehicles, alarms, geofences, tickets — are exactly where the third kind of AI PM lands. Nobody wants a chatbot on top of a fleet dashboard. What an operator wants is for the product to notice the thing they would have noticed an hour later: the vehicle that has been idle in the wrong place, the route deviation that is going to become a delayed delivery, the alarm that is going to be noise. That is a model-powered feature inside a non-AI product, and everything I wrote about states, alarms and hand-offs still applies. The model does not replace the product decision about what a state means; it makes that decision more expensive to get wrong, because now it fires automatically.",
      "## The junior rung is missing",
      "The posting analyses I have read this year agree on one uncomfortable shape: the market is hiring at the manager level and above, and hardly at all below it. Companies want someone who has already owned an outcome, because a model in production is a live thing that can embarrass you, and nobody wants a first-timer holding it. I understand the logic and I think it is a mistake at the market level — it means the next generation of AI PMs is being recruited from people who are already PMs, and the people who understand how the systems actually behave, the engineers, are being told to come back in three years. That is the gap I am applying into, and the argument I make is the one this site makes: I have written the PRDs and then built what they said, at fleet scale, and I know which edge cases are real because I have hit them.",
      "## What “AI experience” should mean in a posting, and usually does not",
      "It should not mean “has used ChatGPT”. Three things I would look for in a candidate if I were writing the posting, and therefore three things I try to show. One: can you write an evaluation before you write a feature — what does a good answer look like, how will you know, what is the failure you refuse to ship with. Two: can you reason about cost and latency as product constraints, the way a fleet PM reasons about rendering ten thousand markers — the constraint changes what the feature can be. Three: have you watched real people use a model-powered feature and changed the feature because of it. The teardown I wrote on why developers adopt AI coding assistants and then quietly stop trusting them is that third thing done from the outside; doing it from the inside is the job.",
      "## What is going on in the market, plainly",
      "The AI premium in pay is real and it is pulling every generalist posting toward the label, whether or not the role has a model in it. Specialisation is winning: “growth PM”, “platform PM”, “AI PM” are replacing “product manager”, and a generalist résumé reads as unfinished. Enterprises that had no AI a year ago are hiring their first AI PM and do not yet know which of the four jobs they mean, so the first hire ends up defining the role — which is a good place to be if you can write the document. And the tooling for the job itself is changing under everyone: a PM who can prototype with a model, run an evaluation and read the logs is doing in an afternoon what used to be a two-week ask to an engineering team. That is the one place where coming from engineering is not a detour into product management but a head start.",
      "## What I would measure",
      "For the market: how many “AI PM” postings say which of the four jobs they are, six months from now. For myself: whether the next product I ship makes a model’s decision visible enough that an operator can disagree with it. A feature that fires and cannot be argued with is an alarm nobody acts on, with better marketing.",
    ],
  },
  {
    title: "UX decisions in real-time vehicle tracking",
    outlet: "Space OS",
    date: "2026-09-21",
    slug: "ux-decisions-in-vehicle-tracking",
    href: "/writing/ux-decisions-in-vehicle-tracking",
    status: "published",
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
