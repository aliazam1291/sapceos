# PROFILE.md — Verified facts about Ali Azam Kazmi

**This is the only approved source for biographical or project claims on the site.**
If a fact is not here, do not put it on the site. Mark it `[DRAFT — needs input]` and flag it instead. Never invent metrics, outcomes, clients, or achievements.

---

## Identity

- **Name:** Ali Azam Kazmi
- **Current title:** Associate Software Developer (Product & Platform), MapMyIndia [Gtropy]
- **Positioning for this site (2026-10-28):** "Product Engineer, fleet & geospatial products", targeting Technical PM roles. One line on every page (tab titles say "Product Engineer moving into PM"). Replaced "Product Engineer & UX Strategist" after an outside review: too many identities. Not a job title; the PM title waits on Ali.
- **Location:** New Delhi, India
- **Email:** aliazamkazmi1291@gmail.com
- **Languages:** English, Hindi
- **Calendly:** calendly.com/aliazamkazmi

### Links
- GitHub: https://github.com/aliazam1291
- LinkedIn: https://linkedin.com/in/ali-azam-kazmi
- Behance: https://www.behance.net/aliak8
- Figma: https://www.figma.com/@aliak
- Medium: https://medium.com/@aliazamkazmi1291
- HackerRank: https://www.hackerrank.com/profile/aliazamkazmi1291
- Coursera: https://www.coursera.org/user/765f7d46ad857abfa027105fd0f33e4e
- Credly: https://www.credly.com/users/ali-azam-kazmi/badges
- Holopin: https://www.holopin.io/@aliazam1291

---

## The core story (use this to shape copy)

Ali is a **product-minded generalist**. He learns whatever he needs in order to build what he believes should exist. Across every project at MapMyIndia his role has consistently been: **frontend implementation + UI/UX ownership + cross-functional team collaboration + acting as de facto product/project manager** — writing PRDs, not just executing someone else's spec.

That is the differentiator, and it is verifiable — it is literally the job he is doing right now.

Career loop: PROBLEM → UNDERSTAND → STRATEGY → UX → TECHNOLOGY → BUILD → SHIP → LEARN → NEXT PROBLEM.

### The job search (Ali, 2026-10-24, answering direct questions)
- **Roles sought:** Product Manager and Technical PM. In his words: "i need to build products are pm" — a PM who builds the product, not only specs it. (Associate PM was offered as an option and not picked.)
- **Title:** the PM title at MapMyIndia has NOT happened yet ("Not yet, keep as is"). The site and résumé keep "Associate Software Developer (Product & Platform)" and "targeting Product Management roles".
- **AI:** "say i am a vibe coder claude gemini chatgpt for research gen ai if we can say it" — he builds with AI coding assistants (vibe coding) and uses **Claude, Gemini and ChatGPT** for research and generative AI work. Stated by Ali; no metric or employer is attached to it. One piece of evidence is on file: this portfolio was built with Claude Code — its git history is co-authored by Claude.
- **Location:** asked "Where will you take a job?", answered "anywhere". Based in New Delhi.
- Still not on file: notice period / earliest start, salary expectation, references.

---

## ACTIVE work (in progress — strongest PM-track material)

All at MapMyIndia/Gtropy. Ali owns frontend, UI/UX, cross-functional collaboration, and product/project management on each.

1. **Technician App** — end-to-end app for tracking technicians and managing field operations: installation, replacement, and rectification jobs. Building end to end.
2. **Mappls Shop Admin + automatic billing web app** — replacing a fully manual billing process with an automated system. Owns UI/UX, the PRD, and cross-functional delivery. **Live** at shop.mappls.com (Angular 17 admin console over the Spring `mappls-billing` API; Odoo upstream for devices and renewal dates; Razorpay for payments — from Ali's architecture doc, Mappls-Billing-Admin-Portal.docx). **Results (Ali, 2026-10-15):** live and generating revenue (do NOT state the amount, ever); 30+ users; the billing and accounts teams are 80% more productive.
3. **IOCL (Indian Oil) GeoRTD creation** — geospatial route data pipeline, 30,000+ routes injected into an Amazon S3 bucket.

### Client deliveries on shipped products (Ali, 2026-10-23)
Ali: "made dashboard for Toyota for non communicating device, and also created DMS, ADAS and driver section for Intouch for client VinFast, SM Green." Scope is his words and nothing more.
- **Toyota** — made a dashboard for **non-communicating devices** (devices that have stopped reporting). Which MapMyIndia product it sits in, the users, and any outcome are NOT on file — the site states the deliverable only, and it is on the experience line, not a mission report, until Ali supplies the rest.
- **Intouch, for VinFast and SM Green** — created the **DMS** (driver monitoring), **ADAS** (driver assistance) and **driver** sections. Clients named are VinFast and SM Green. No outcome is on file for either.

### From Ali's own working files (read 2026-10-24; Ali: "you have context of cowork")
Read from D:/lap165/Projects and Downloads. Product-level facts only. ⚠️ These are MapMyIndia internal documents (the subscription PRD is marked Confidential): never publish their revenue model, device counts, prices, client account details, internal URLs, API contracts or brand specs. Targets in them are PROPOSED, not results — never present one as an outcome.
- **Toyota = an InTouch page.** `toyota/toyota-non-communicating-devices.html`: "Device Communication Health" in the InTouch portal for the customer Toyota Logistics. Every vehicle is classified by time since its last GPRS data — Online (0–24 h), Offline (1–7 days), Inactive (8–30 days), Not Working (31+ days) — with a status split, status by vehicle group sorted by non-communicating share (click a row to filter), a filterable vehicle table and CSV export. Users, problem history and outcome still not on file.
- **Driver Safety PRD v1.0** (`Vinfast/Driver_Safety_PRD.pdf`, 13 Oct 2026, **owner: Ali Azam Kazmi**, audience backend/frontend/QA, design, delivery). A Driver Safety module inside InTouch: Safety Overview, DMS (7 in-cab alarms), ADAS (4 road-facing alarms), Drive Alerts (GPS/motion), Driver Scorecard with a per-driver report, On-Demand Video, Alert Settings. Ships with a clickable prototype and an OpenAPI contract. Product decisions in it: driver-first (find who needs attention in one screen); data only — no coaching programme, no review workflow; scores compared per distance or hours, never raw counts, with a minimum distance before a driver is scored; the customer hides alarms and sets each alarm's weight (totals must reach 100 before save); hidden alarms are enforced server-side so they never leak through exports. Success measures are proposed targets (time to find the riskiest driver, scorecard adoption, settings customisation, "score looks wrong" tickets, alarm-naming tickets) — not results. The prototype went through 11 design iterations by 1 Oct 2026 (`intouch-safety-redesign-notes.md`).
- **Mappls Admin Platform PRD v1** (`mappls shop gadgets/docs/Mappls_Admin_Platform_PRD_v1.pdf`, 8 Oct 2026, by **@Azam**). Grows the shop.mappls.com billing admin into one platform for three teams — Billing (subscription renewals, exists), Gadgets Catalog (new), Operations (orders, inventory, shipping, installation; new) — with feature-ID role-based access replacing all-or-nothing super-admin, one Razorpay payments layer for subscriptions and gadgets, and an audit log of every change.
- **Mappls Subscription Automation Platform PRD v1.1** (`PRDS/`, June 2026, owner "Subscription Product Team"). The product Mappls Shop billing belongs to: the connected-device subscription lifecycle — expiry discovery, reminders, renewal, Razorpay payment, Odoo invoicing, status sync to InTouch — self-service. North Star: **renewal conversion rate**. Phased: Phase 1 self-service renewal, payments, invoicing and reminders; Phase 2 analytics and ops depth; Phase 3 auto-renewal (subject to RBI e-mandate rules). Ali calls this product "subscription" too (2026-10-24).
- **Mappls Gadgets Shop PRD v1.0** (8 Oct 2026, draft for CTO review) and a four-phase plan (Phase 1: catalog and storefront, checkout off): turns the enquiry-only gadgets site into a store, in the Mappls app and on the web. In build; nothing live or measured.
- **Technician App PRD** (`internal technician app/…prd_and_react_native_architecture.md`): React Native, offline-first, for installation, deinstallation, replacement and rectification tickets.
- **Title (resolved 2026-10-24):** the Driver Safety PRD names Ali "Technical APM", but Ali confirmed: "Not yet. Keep the current title for now." The site keeps "Associate Software Developer (Product & Platform)", targeting PM roles. Do not use "Technical APM" anywhere until Ali says it is official.

⚠️ Outcome metrics for the Technician App (time saved, error rate, adoption) are **not yet known**. Do not estimate them. Mappls Shop's are above and are the only ones.

---

## Venture

**DumbMoney** (https://dumbmoney.in) — **Founder & CPO**. Confirmed by Ali on 2026-09-20 ("I am the founder and CPO, and there is a link"). Has a dedicated page on the site (/dumbmoney).
- What it is (from dumbmoney.in, read 2026-09-20): a coupon and deals platform for Indian online shoppers — verified coupon codes, promo codes and cashback offers from Indian retailers, browsable by store or category, copy the code at checkout, no signup. Tagline on the site: "India's most trusted coupon platform. We verify every deal so you save more, every day."
- Run by co-founders **Akshat Somani** and **Ali Kazmi** (dumbmoney.in/about-dumbmoney). Every coupon is attributed to whichever founder checked it; verification combines automated expiry/duplicate checks with human review before a code goes live; the site says it does not yet manually test every code at checkout.
- Ali writes on its blog (dumbmoney.in/author/ali): "How to Use Coupons During Big Billion Days & Great Indian Festival" (15 Sep 2026), "Why Coupon Codes Stop Working (And How to Avoid Expired Ones)" (10 Sep 2026).
- An earlier design concept for the brand is on Behance: https://www.behance.net/gallery/217772229/Dumb-Money
- "Serj Slavoj", the byline on the DumbMoney blog and deals guides, is a shared editorial voice the two co-founders write under — not a separate person (dumbmoney.in/about-dumbmoney, read 2026-09-23). Ali's own author page (dumbmoney.in/author/ali, "Ali Azam Kazmi") carries the two articles above.
- **Re-read 2026-09-23.** The contradiction recorded on 2026-09-20 no longer exists on the live site: the home page no longer shows "2,436+ verified deals from 62+ Indian brands". The about page's panel now reads "India's Top Stores · 10,000+ Active Deals · Daily update frequency · Human-Reviewed verification". That 10,000+ is the platform's own public figure for CATALOGUE SIZE — it is not an outcome of Ali's product work, so it is used on /dumbmoney only as a manifest fact, attributed and dated, and the Results strip stays "not yet measured".
- ⚠️ No outcome number is confirmed. The older resume's "profitable in its first quarter, 37+ partner brands" stays unverified (below) — searched 2026-09-23, nothing public supports it. Founding date still not confirmed by Ali and not public anywhere found; the older resume says 2026.

---

## Work experience

**MapMyIndia [Gtropy]** — Associate Software Developer, Product & Platform · Sep 2024–present · New Delhi
- Built and scaled enterprise fleet & telematics platforms: Vahan Shakti (government, 200,000+ users), OEM platforms (20,000+ users), fleet operators (10,000+ vehicles)
- 5+ live production projects; owned operational and analytics dashboards (vehicle health, trips, delays, alerts, compliance)
- ~40% performance improvement on data-heavy dashboards via caching, RxJS state management, API optimisation
- Defined vehicle status logic (moving / stopped / idle / delayed / offline); map UX (rotation, fit-to-route, route playback); alarm, geofence and ticketing workflows
- Authored full PRDs — problem statements, user stories, acceptance criteria, edge cases

**Smaak.ux** — Founder & Product Designer · 2023–present · Remote/freelance
- Product and design studio; 10+ clients across SaaS, creator brands, e-commerce, home décor, services
- Clients (10 named, 2026-09-26): **Sunder Masala** (website UI, content, branding, market strategy) · **Wolf Casa** (website UI, content, branding, market strategy) · **Atmos** (brand identity) · **Mintair** (investor pitch deck) · **Ravenouxs** (responsive website) · **Lean Multiverse** (brand identity + web UI for a creator-led brand with 600K+ followers) · **Ekal** (brand identity, pitch decks) · **Urban Livin** (product catalogues) · **Sorted Blinds** (website, Australia-based) · **Posh Dikur** (luxury home décor marketing creatives)

### Client industries (Ali, 2026-09-26: "Mintair was a web3 company … we can be industry specific")
What each client's own site says it does. This is context for the sector a
piece was made for — it is NOT a claim about what the work achieved, and the
deliverable above is still the only thing Ali is credited with.
- **Mintair** (mintair.xyz, read 2026-09-26) — **Web3 / blockchain infrastructure.** A one-click node deployment and management platform: pick a chain, take a subscription, the service provisions and maintains the validator node. Tagline "One Click Node"; the site claims 35+ supported networks, 150,000+ users and 80,000+ nodes deployed. ⚠️ Those are **Mintair's own public numbers about their platform**, not outcomes of Ali's pitch deck — do not present them as his results.
- **Lean Multiverse** (leanmultiverse.com, read 2026-09-26) — **career development / management consultancy.** LeanMultiverse Consultancy Pvt Ltd: a one-month bootcamp with a long-range career roadmap, live weekend sessions, industry mentors, capped batches. Taglines "Build in the Multiverse — Unlock Collaborative Innovation" and "Better Careers. A Brighter You." ⚠️ Note the tension with the line above: PROFILE records it as "a creator-led brand with 600K+ followers", the site presents a consultancy. Both may be true (a creator audience behind a consultancy) — **needs one word from Ali** before the site describes it either way. Until then the site says only what the deliverable was.
- The other six clients' industries are not on file. Ali has them; they are not guessed here.

### Two more clients, confirmed by Ali 2026-09-26
Ali: "sundermasala.com — made this website UI and content and branding and
market strategy … also same for casa, wolfcasa.in". Scope on both is his
words: **website UI, content, branding and market strategy.** No outcome is
claimed for either; none is on file.
- **Sunder Masala** (sundermasala.com, read 2026-09-26) — **spice brand, FMCG / food.** A heritage masala house from Indore, Madhya Pradesh: founded 1975 by Bharat Kumar Jain, three generations, cold-milled under 40°C, single-origin, "100% pure, no artificial colour". Range: 13 blended spices, 9 pure, 8 whole, 2 hing, plus a recipe section ("Rasoi"). Taglines on the site: "Kam masala, poora swaad" and "Ek chutki, full fire". ⚠️ The 1975 founding and the family story are the CLIENT's history, not Ali's — never present them as his.
- **Wolf Casa** (wolfcasa.in, read 2026-09-26) — **interiors / premium home furnishing.** An interior showroom and curation service positioned as "The Interio Mall for Curated Living", selling composed rooms rather than single pieces — "A sofa alone is inventory. A curated room is desire." 18 categories, 11 room curations, a 100,000 sq ft showroom, plus a sourcing service and franchise model. ⚠️ Showroom size and category counts are the client's figures about their business, not results of Ali's work.

**Wise Work** — Full Stack Intern · Feb–Dec 2023 · Remote — React.js, scalable UI components, REST API integration

**Datamatics** — R&D Project Intern · Jun–Aug 2023 · Mumbai — AI-driven OCR (+30% data extraction accuracy); UX research and usability testing (+15% task completion)

**Green Monk Energy** — Student Brand Ambassador, Chennai Lead · Sep 2022–Apr 2023 · Chennai

**Tech Analogy** — Graphic Designer Intern · Jan–Feb 2023

---

## Shipped projects

| Project | Detail |
|---|---|
| **Vahan Shakti** | Vehicle tracking & analytics. React map components for live location, custom markers, route plotting, clustering, heatmaps. 200,000+ users. Live on Play Store. |
| **Intouch** | Cross-platform logistics management app. Optimised for 10,000+ active vehicles, scaling to 50,000. Live on Play Store: https://play.google.com/store/apps/details?id=intouch.mappls.app (Ali, 2026-09-20). |
| **Locate (Manufacturer Backend)** | Independently led frontend. Real-time vehicle monitoring, web + mobile dashboards, 20,000+ vehicles across Maharashtra. |
| **Control Tower** | Real-time alert management & ticketing platform. Map-based trip analysis, performance-optimised architecture. |
| **Hermes** | Internal logistics & data management tool. Modular, component-driven UI, accessibility focus. |
| **D3 Advanced Visuals** | Open-source enterprise analytics platform. D3.js, Next.js, TypeScript, dual-theme dashboards, reusable chart components. |
| **FASTag Platform** | Full-stack FASTag registration + multi-vehicle management, OTP authentication. |
| **Indane Yatra Mitra (IOCL)** | Enterprise fleet tracking for IOCL LPG tanker operations — live tracking, safety alarms, geofencing, route playback, role-based access. Live on Play Store: https://play.google.com/store/apps/details?id=iocl.cvtms.mappls (Ali, 2026-09-20). |
| **Handwritten Text Recognition** | OCR pipeline, OpenCV + Tesseract, advanced preprocessing. |
| **PUJ Obstruction Detection** | Deep learning medical imaging pipeline on ultrasound data. |
| **Carbon Footprint Calculator** | Electricity-based carbon emissions estimator with offset visualisation. |

## Independent case studies (product/UX analyses, not client work — label them as such)

Linear vs Jira · The AI Code Assistant Adoption Paradox · Apple Ecosystem Fragmentation · Flipkart Product Discovery · Uber Driver Retention · The Logistics Visibility Gap

---

## Education

**B.Tech, Computer Science Engineering** — SRM Institute of Science and Technology, Chennai · CGPA 8.76/10.0 · Aug 2020–Jun 2024

## Leadership

- **Technical Convener**, Directorate of Student Affairs, SRMIST (Sep 2022–May 2024) — directed *Milan*, a national cultural festival with 20,000+ attendees; managed a 50+ member cross-functional team
- **Vice President**, Alexa Developers SRM (Nov 2020–May 2024) — 10+ technical events and hackathons; flagship UI/UX workshop drew 300+ participants

## Achievements

- Won the GitHub SRM Ideathon for an innovative product concept
- Led a UI/UX workshop for 300+ participants
- Recognised for leading a 50-person core team on a national event with 20,000+ registrations

## Certifications

- AWS Academy Machine Learning Foundations — AWS, Jun 2023
- AWS Academy Cloud Foundations — AWS, May 2023
- Conduct UX Research and Test Early Concepts — Google, Mar 2023
- Build Wireframes and Low-Fidelity Prototypes — Google, Feb 2023
- Start the UX Design Process: Empathize, Define, and Ideate — Google, Feb 2023
- Foundations of User Experience (UX) Design — Google, Jan 2023
- Blockchain Basics — University at Buffalo, Nov 2022
- Technical Product Management — Aha!

## Skills

**Technical:** JavaScript, TypeScript, HTML, CSS, React, Next.js, Angular, Ionic, Node.js, Nest.js, Spring Boot, Java, Python, C++, RxJS, D3.js, Three.js, Mappls SDK, OpenCV, TensorFlow, MongoDB, MySQL, SQL, REST APIs, Git, Postman, Vite, AWS S3

**Design:** Figma, Spline, Adobe Suite — wireframing, prototyping, UX research, user flow design, interaction design, usability testing

**Product:** PRD writing, user story mapping, roadmapping, A/B testing, prioritisation, competitive analysis, Agile/Scrum, stakeholder management, SEO & growth

---

## Unverified — DO NOT USE without confirmation

- ~~**"Sunder Masala"**~~ — **CONFIRMED by Ali on 2026-09-26** and moved up to the Smaak.ux client list. It sat here as unverified from the first day of this project; it is his work. See "Smaak.ux" above.
- **DumbMoney outcomes** — the older resume's "profitable in its first quarter with 37+ partner brands" and the founding year (2026) are not confirmed. The venture itself IS confirmed (see "Venture" above); only these numbers and the date wait on Ali. A public search on 2026-09-23 found neither.
- **Vahan Shakti's store listing** — Intouch and Indane Yatra Mitra have URLs Ali gave (above). A search on 2026-09-23 for Vahan Shakti returned several unrelated AIS-140 tracking apps by other publishers (com.dhundhoolite, com.ce.vahanshakti) and nothing identifiable as the MapMyIndia build. NOT added: linking the wrong company's app under Ali's name is worse than no link. Needs the URL from Ali.
- Outcome metrics for the three Active missions.
- Orbit topics / reading list / music — no verified data. Must come from Ali directly.

---

> **On design direction:** this file is Ali's factual record and nothing else.
> The visual authority is `DESIGN_DIRECTION.md`, with `CLAUDE.md` for working
> rules. A block of "Quiet Orbit" build instructions used to sit below this
> line — zero render loops, a three-per-screen accent cap, no accent on large
> buttons or glows — all of which `DESIGN_DIRECTION.md` has explicitly
> withdrawn, and which pointed at a `src/once-ui/` directory that does not
> exist in this repo. Instructions inside a data file are how a later session
> ends up reverting shipped work while believing it is following the brief.
