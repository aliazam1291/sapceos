import type { Mission } from "./types";

// Facts, scale numbers, roles and dates come only from PROFILE.md.
// Framing and phrasing are editorial. Anything that would require a metric,
// outcome or research finding Ali has not confirmed is stated as not yet
// measured — in words a visitor can read, never an estimate. (The DRAFT
// sentinel used to sit in the three active Outcomes; it rendered as an
// editorial "needs input" flag to the public, 2026-09-19.)

export const missions: Mission[] = [
  {
    slug: "technician-app",
    measure: ["Time per job, installation to close", "Error rate on job state changes", "Technician adoption across regions"],
    title: "Technician App",
    org: "MapMyIndia [Gtropy]",
    role: "Frontend · UI/UX · PRD · cross-functional delivery",
    period: "Active",
    status: "active",
    featured: true,
    premise:
      "Field operations run on people who are never at a desk. The app had to work the way a technician's day actually works.",
    stack: ["Angular", "Ionic", "TypeScript", "REST APIs"],
    signals: [{ label: "Stage", value: "Building end to end" }],
    ownership: {
      decided: ["The PRD — problem statement, user stories, acceptance criteria, edge cases", "The UX: installation, replacement and rectification as three distinct jobs"],
      built: ["The app, end to end"],
      withTeam: ["Cross-functional delivery"],
    },
    report: [
      {
        label: "Brief",
        body: "An end-to-end app for tracking technicians and managing field operations — installation, replacement and rectification jobs — built end to end.",
      },
      {
        label: "Context",
        body: "Installation, replacement and rectification are three different jobs wearing the same uniform. Each has its own preconditions, its own proof-of-completion, and its own way of going wrong once someone is standing at a vehicle with a phone in one hand.",
      },
      { label: "Users", body: "Field technicians and the operations staff who dispatch and verify their work." },
      {
        label: "Discovery",
        body: "Three job types — installation, replacement, rectification — were being coordinated through the same channels with no shared definition of 'done'. The first work was writing down, per job type, what has to be true before a technician starts, what proof closes it, and where each one usually stalls.",
      },
      {
        label: "Problem",
        body: "Coordination lived in messages and spreadsheets. Nobody could answer where a job stood without asking a person.",
      },
      {
        label: "Hypothesis",
        body: "If the app carries job state as its primary object — not the technician, not the vehicle — then dispatch, the technician and verification are looking at the same thing, and the coordination that lived in messages disappears because it has nowhere left to live.",
      },
      {
        label: "Strategy",
        body: "Ship the field side first, because that is where the data is created; the operations dashboard is only as good as what technicians actually record. Keep the three job types on one flow with per-type steps rather than three apps that drift apart.",
      },
      {
        label: "Prioritization",
        body: "Preconditions and proof-of-completion before anything else. Offline tolerance before polish. Reporting last, because a report on unreliable data is worse than no report.",
      },
      {
        label: "UX",
        body: "Designed for one hand, poor signal and bright daylight. Job state is the first thing on screen, not the last.",
      },
      {
        label: "Design",
        body: "Large targets, one primary action per screen, and status you can read from arm's length. Every screen answers 'what is the next thing I do' before it answers anything else.",
      },
      { label: "Technology", body: "Angular and Ionic for a single cross-platform build against the existing platform APIs." },
      { label: "Build", body: "In progress. Ali owns frontend implementation, UI/UX, the PRD, and coordination across the teams involved." },
      { label: "Outcome", body: "In progress; nothing measured yet, so nothing claimed. What gets measured on the next release: time per job from installation to close, the error rate on job state changes, and technician adoption across regions." },
      {
        label: "Learnings",
        body: "Writing the PRD for a field product means interviewing for the exceptions, not the happy path. The happy path is the same everywhere; the exceptions are the product.",
      },
    ],
  },
  {
    slug: "mappls-shop-admin",
    measure: ["Billing cycle time, manual vs automated", "Invoice error rate", "Adoption by shop admins"],
    title: "Mappls Shop Admin & Automated Billing",
    org: "MapMyIndia [Gtropy]",
    role: "UI/UX owner · PRD author · cross-functional delivery",
    period: "Active",
    status: "active",
    featured: true,
    premise:
      "Billing was done by hand. The interesting part was not automating the maths — it was finding every place a human was quietly making a decision.",
    stack: ["React", "TypeScript", "REST APIs"],
    signals: [{ label: "Replaces", value: "A fully manual billing process" }],
    ownership: {
      decided: ["The PRD", "The UI/UX"],
      built: ["The web app frontend"],
      withTeam: ["Cross-functional delivery"],
    },
    report: [
      {
        label: "Brief",
        body: "Replace a fully manual billing process with an automated system, and give shop operations a first-class admin surface.",
      },
      {
        label: "Context",
        body: "A manual process is never only arithmetic. It carries exceptions, tolerances and judgement calls that were never written down anywhere, because the person doing them never needed them written down.",
      },
      { label: "Users", body: "Shop administrators and the billing operations team." },
      {
        label: "Discovery",
        body: "Sat with the people doing the billing and traced one cycle end to end. Most of the time was not arithmetic; it was looking things up, deciding how to treat an edge case, and re-checking work that had no system of record.",
      },
      {
        label: "Problem",
        body: "Manual billing is slow, and it is inconsistent in ways that only surface at reconciliation time.",
      },
      {
        label: "Hypothesis",
        body: "Automating the calculation is the easy half. If every judgement call the operator was making by hand is captured as an explicit rule — or explicitly surfaced for a human decision — the process becomes consistent, and consistency is what reconciliation actually needs.",
      },
      {
        label: "Strategy",
        body: "Build the admin surface and the billing engine as one product with one data model, so the shop record that drives billing is the same record operations edit. No exports, no re-keying.",
      },
      {
        label: "Prioritization",
        body: "The rules that cover the majority of bills first; the exceptions as an explicit review queue rather than a growing list of special cases in code. Audit trail before automation of the last few percent.",
      },
      {
        label: "UX",
        body: "The admin sees a bill the way an operator would check it: line by line, with the rule that produced each line visible on demand. Anything the system was unsure about is a flagged decision, not a silent default.",
      },
      {
        label: "Design",
        body: "Dense tables with generous row height, inline rule explanations, and a review queue that reads as a to-do list rather than an error log.",
      },
      {
        label: "Technology",
        body: "React and TypeScript over the platform's REST APIs; the billing rules live server-side so that the admin surface and any future automation share one source of truth.",
      },
      { label: "Build", body: "Ali owns the UI/UX, wrote the PRD, and drives delivery across the teams involved." },
      { label: "Outcome", body: "In progress; nothing measured yet, so nothing claimed. What gets measured once it runs: billing cycle time, manual against automated; invoice error rate; adoption by shop admins." },
      {
        label: "Learnings",
        body: "The PRD's most valuable section was the list of things the previous process decided silently. Making those decisions explicit was most of the product work; the code was the smaller part.",
      },
    ],
  },
  {
    slug: "iocl-geortd",
    results: [{ value: "30,000+", label: "Routes injected", source: "Amazon S3 pipeline" }],
    measure: ["Route accuracy against ground truth", "Pipeline throughput per run"],
    title: "IOCL GeoRTD Pipeline",
    org: "MapMyIndia [Gtropy]",
    role: "Frontend · UI/UX · cross-functional delivery",
    period: "Active",
    status: "active",
    featured: true,
    premise:
      "Thirty thousand routes is not a data problem you solve once. It is a pipeline you have to trust every time it runs.",
    stack: ["Geospatial data", "Amazon S3", "TypeScript"],
    signals: [{ label: "Routes injected", value: "30,000+" }],
    ownership: {
      decided: ["The UI/UX"],
      built: ["The frontend; 30,000+ routes injected into the S3 bucket"],
      withTeam: ["Cross-functional delivery"],
    },
    report: [
      { label: "Brief", body: "Geospatial route data creation for Indian Oil — GeoRTD generation at scale." },
      {
        label: "Context",
        body: "Indian Oil moves LPG by road across thousands of routes. Every one of those routes needs geospatial reference data — the GeoRTD — before tracking, geofencing and playback can work against it.",
      },
      {
        label: "Users",
        body: "The IOCL operations and telematics teams whose tracking products consume the route data, and the internal team maintaining the pipeline.",
      },
      {
        label: "Discovery",
        body: "Route creation at this volume cannot be a one-off import. Sources change, routes get corrected, and a bad batch has to be findable and reversible. The pipeline had to be designed as something that runs repeatedly, not something that ran once.",
      },
      {
        label: "Problem",
        body: "Generate route data for 30,000+ routes into a form the platform can consume, at a quality the downstream products can trust, with a process that can be re-run when the inputs change.",
      },
      {
        label: "Hypothesis",
        body: "If every route carries provenance — what it was generated from, when, by which run — then errors are a data question rather than an archaeology exercise, and the team can trust the pipeline enough to keep running it.",
      },
      {
        label: "Strategy",
        body: "Batch generation into Amazon S3 as the system of record, with validation before injection rather than after. Treat the bucket as the contract between the pipeline and the products that read from it.",
      },
      {
        label: "Prioritization",
        body: "Correctness of the route geometry first, then throughput, then the tooling that makes re-runs cheap. A fast pipeline that produces routes nobody trusts is a liability.",
      },
      {
        label: "UX",
        body: "The operator-facing surface is a run: what was processed, what was rejected and why, and what changed against the previous run.",
      },
      {
        label: "Design",
        body: "Logs and diffs presented as a report, not a console. The question a reviewer asks is 'what is different', and the interface answers that first.",
      },
      { label: "Technology", body: "Route data generated and injected into an Amazon S3 bucket — 30,000+ routes." },
      { label: "Build", body: "In progress." },
      { label: "Outcome", body: "30,000+ routes injected so far; the pipeline is live and still being measured. What gets measured: route accuracy against ground truth, and throughput per run." },
      {
        label: "Learnings",
        body: "Data pipelines are products with a user of one team. They deserve the same discovery — what does the person running this need to know, and when — as anything customer-facing.",
      },
    ],
  },
  {
    slug: "vahan-shakti",
    results: [
      { value: "200,000+", label: "Users", source: "Government fleet programme" },
      { value: "Live", label: "On the Play Store" },
    ],
    cover: "/missions/vahan-shakti.jpg",
    title: "Vahan Shakti",
    org: "MapMyIndia [Gtropy]",
    role: "Frontend · map UX",
    period: "Shipped",
    status: "shipped",
    featured: true,
    premise:
      "The challenge was never drawing the vehicles. It was keeping the map useful once thousands of them were moving at the same time.",
    stack: ["React", "Mappls SDK", "TypeScript", "RxJS"],
    signals: [
      { label: "Users", value: "200,000+" },
      { label: "Distribution", value: "Live on Play Store" },
      { label: "Sector", value: "Government" },
    ],
    ownership: {
      built: ["React map components — live location, custom markers, route plotting, clustering, heatmaps"],
    },
    report: [
      { label: "Brief", body: "Vehicle tracking and analytics for a government fleet programme." },
      {
        label: "Context",
        body: "A map that shows everything shows nothing. Past a certain density, every additional marker removes information rather than adding it.",
      },
      { label: "Users", body: "Government fleet operators and administrators — 200,000+ of them." },
      {
        label: "Discovery",
        body: "A map of a national fleet is unreadable at the scale it needs to serve. The work began by identifying which questions operators asked at which zoom levels — where is everything, where is the density, where is this one vehicle — and designing a different answer for each.",
      },
      {
        label: "Problem",
        body: "Live location at national scale, rendered in a browser, without the interface collapsing into noise.",
      },
      {
        label: "Hypothesis",
        body: "If the map changes what it emphasises with altitude — clusters and heat at the top, individual markers and routes close in — one interface can serve both the overview and the individual case without either collapsing into noise.",
      },
      {
        label: "Strategy",
        body: "Build the map as a set of React components over the Mappls SDK, each owning one visual concern (markers, clusters, heatmap, routes, geofences), so performance work could target the layer that was actually slow.",
      },
      {
        label: "Prioritization",
        body: "Clustering and lazy rendering first, because without them nothing else was usable at 200,000 vehicles. Then live-update throttling, then the analytics views that sit on top.",
      },
      {
        label: "UX",
        body: "Clustering and heatmaps carry density; custom markers and plotted routes carry the individual case. The map changes what it emphasises as you zoom, so the answer stays legible at every altitude.",
      },
      {
        label: "Design",
        body: "Custom vehicle markers with dynamic state, cluster badges that read at a glance, heat layers for movement and activity, and route playback for the individual journey.",
      },
      {
        label: "Technology",
        body: "React map components over the Mappls SDK — live location, custom markers, route plotting, clustering and heatmaps.",
      },
      {
        label: "Build",
        body: "Debounce-based load optimisation to cut redundant API calls and re-renders, clustering and lazy rendering for the dense views, and caching for navigation between map-heavy screens. Live on the Play Store.",
      },
      { label: "Outcome", body: "Live on the Play Store, serving 200,000+ users." },
      {
        label: "Learnings",
        body: "At this scale, performance is a UX decision. Every optimisation changed what the operator could see, so the two conversations had to happen together.",
      },
    ],
  },
  {
    slug: "intouch",
    results: [
      { value: "10,000+", label: "Active vehicles" },
      { value: "50,000", label: "Designed headroom" },
      { value: "Live", label: "On the Play Store" },
    ],
    cover: "/missions/intouch.jpg",
    title: "Intouch",
    org: "MapMyIndia [Gtropy]",
    role: "Frontend · performance",
    period: "Shipped",
    status: "shipped",
    featured: true,
    premise:
      "Built for ten thousand vehicles, architected for fifty thousand — because the second number is the one that arrives without warning.",
    stack: ["React", "Ionic", "TypeScript", "RxJS"],
    signals: [
      { label: "Active vehicles", value: "10,000+" },
      { label: "Headroom", value: "Scaling to 50,000" },
      { label: "Distribution", value: "Live on Play Store" },
    ],
    report: [
      { label: "Brief", body: "A cross-platform logistics management app for fleet operators." },
      {
        label: "Context",
        body: "Logistics teams run on their phones. The app had to hold up under high-frequency data on Android and iOS, and it had to be built for a fleet larger than the one it launched with.",
      },
      { label: "Users", body: "Logistics and fleet operations teams." },
      {
        label: "Discovery",
        body: "Operators segment fleets constantly — by status, region, customer, vehicle type — and they replay trips to understand what happened. Those two behaviours shaped the product more than any dashboard request.",
      },
      {
        label: "Problem",
        body: "Optimising for the fleet you have today produces an app that breaks on the fleet you have next quarter.",
      },
      {
        label: "Hypothesis",
        body: "If filtering is instant and trip history is visual, most of the questions that would otherwise become a call to someone get answered inside the app.",
      },
      {
        label: "Strategy",
        body: "One Ionic and Angular codebase with a modular NgModule architecture, so features could be added without re-testing the whole app, and the same components could serve both platforms.",
      },
      {
        label: "Prioritization",
        body: "Real-time tracking first, then quick filters, then animated trip playback, then the dashboards. Each stage had to stay smooth at 10,000 active vehicles before the next one started.",
      },
      {
        label: "UX",
        body: "Quick filters for instant segmentation, animated trip history for journey analysis, and dashboards that lead with the operational read rather than the chart.",
      },
      {
        label: "Design",
        body: "Responsive layouts across device sizes; dense fleet lists with clear status; playback controls that feel like a media player because that is what people already know.",
      },
      { label: "Technology", body: "Cross-platform build, optimised for 10,000+ active vehicles with a path to 50,000." },
      {
        label: "Build",
        body: "Ionic and Angular in TypeScript, REST integration tuned for mobile consumption, and rendering optimised for high-frequency live updates. In production at 10,000+ active vehicles, architected for 50,000.",
      },
      { label: "Outcome", body: "Live on the Play Store." },
      {
        label: "Learnings",
        body: "Designing for the fleet you will have, not the one you have, is cheaper than it sounds — provided the architecture decision is made before the first screen, not after the first outage.",
      },
    ],
  },
  {
    slug: "locate",
    results: [{ value: "20,000+", label: "Vehicles monitored", source: "Across Maharashtra" }],
    cover: "/missions/locate.jpg",
    title: "Locate — Manufacturer Backend",
    org: "MapMyIndia [Gtropy]",
    role: "Frontend lead (independent)",
    period: "Shipped",
    status: "shipped",
    premise:
      "Twenty thousand vehicles across one state, watched from both a desk and a phone. The two screens needed the same truth, not the same layout.",
    stack: ["React", "TypeScript", "Mappls SDK"],
    signals: [
      { label: "Vehicles", value: "20,000+" },
      { label: "Coverage", value: "Maharashtra" },
    ],
    ownership: {
      decided: ["Frontend direction, independently"],
      built: ["Real-time vehicle monitoring; web and mobile dashboards"],
    },
    report: [
      { label: "Brief", body: "Real-time vehicle monitoring for an OEM — web and mobile dashboards." },
      {
        label: "Context",
        body: "A vehicle manufacturer wanted to see its fleet in the field: live location, engine health, journeys, driver behaviour and driver test scores, across 20,000+ vehicles in Maharashtra, from a desk and from a phone.",
      },
      { label: "Users", body: "Manufacturer operations teams monitoring 20,000+ vehicles across Maharashtra." },
      {
        label: "Discovery",
        body: "The web and mobile dashboards had different jobs. The desk wanted analysis — trends, comparisons, driver scoring. The phone wanted a quick answer about one vehicle. Same data, different questions.",
      },
      {
        label: "Problem",
        body: "Give both surfaces the same truth without giving them the same layout, and keep everything responsive as live telemetry streams in.",
      },
      {
        label: "Hypothesis",
        body: "If global state is managed once and every view reads from it, web and mobile stay consistent by construction rather than by discipline.",
      },
      {
        label: "Strategy",
        body: "React with the Context API as the single state layer, D3.js for the custom visualisations the analytics required, Mappls SDK for the map, and a unified UI system across web and mobile.",
      },
      {
        label: "Prioritization",
        body: "Live tracking and engine metrics first, because that is the daily use. Journey reports and driver scoring next. The visual polish of the analytics last.",
      },
      {
        label: "UX",
        body: "Dashboards that lead with the current state of the fleet, drill into a vehicle, and only then into charts. Driver scoring presented as something a manager can act on, not a number on its own.",
      },
      {
        label: "Design",
        body: "Custom D3 visualisations for performance, route and behaviour patterns, on a responsive layout that reorganises rather than shrinks between desktop and mobile.",
      },
      { label: "Technology", body: "Web and mobile dashboards over real-time vehicle telemetry." },
      { label: "Build", body: "Ali independently led the frontend." },
      {
        label: "Outcome",
        body: "Live on the Google Play Store and Apple App Store, supporting 20,000+ vehicles across Maharashtra.",
      },
      {
        label: "Learnings",
        body: "Leading the frontend alone meant owning the questions, not just the screens. The most useful thing I did was ask what each dashboard was for before deciding what went on it.",
      },
    ],
  },
  {
    slug: "control-tower",
    measure: ["Time from alert to ticket", "Tickets resolved per operator"],
    cover: "/missions/control-tower.jpg",
    title: "Control Tower",
    org: "MapMyIndia [Gtropy]",
    role: "Frontend · dashboard architecture",
    period: "Shipped",
    status: "shipped",
    premise:
      "The system knew everything. It just didn't know what mattered first.",
    stack: ["React", "TypeScript", "RxJS", "Mappls SDK"],
    signals: [{ label: "Domain", value: "Alerts & ticketing" }],
    report: [
      { label: "Brief", body: "A real-time alert management and ticketing platform with map-based trip analysis." },
      {
        label: "Context",
        body: "An alert that fires constantly stops being an alert. It becomes background noise with a red icon.",
      },
      {
        label: "Users",
        body: "Operations teams responsible for monitoring alerts, working tickets and investigating trips.",
      },
      {
        label: "Discovery",
        body: "Alerts arrive continuously; humans work in queues. The product's job was to turn the first into the second — and to let an operator see where and when an alert happened, not just that it did.",
      },
      { label: "Problem", body: "Turning a continuous stream of vehicle events into a queue a human can actually work through." },
      {
        label: "Hypothesis",
        body: "If an alert can be opened straight into the trip it came from, with playback, most investigations become a minute of looking rather than a chain of questions.",
      },
      {
        label: "Strategy",
        body: "A modular React and TypeScript frontend on Vite, with heavy routes lazy-loaded and the bundle code-split, so the initial view is fast and the map-heavy analysis loads only when asked for.",
      },
      {
        label: "Prioritization",
        body: "The alert and ticket queue first, then map playback of trips, then the analytics on top. Performance work was scheduled as a feature, not deferred as a cleanup.",
      },
      {
        label: "UX",
        body: "Alerts grouped and prioritised so the queue reads top-down; a ticket is one click from its trip; playback controls let an operator scrub to the moment the alert fired.",
      },
      {
        label: "Design",
        body: "Clean separation between the queue, the map and the ticket detail, so an operator can keep the queue in view while investigating one item.",
      },
      { label: "Technology", body: "Performance-optimised architecture; map-based trip analysis." },
      {
        label: "Build",
        body: "Built the complete frontend: Vite, React, TypeScript, map SDKs and REST APIs. Lazy loading and code-splitting reduced the initial bundle; rendering paths were optimised for continuous updates.",
      },
      {
        label: "Outcome",
        body: "Faster initial load and perceived responsiveness through the bundling strategy, and an alert workflow operations teams could analyse spatially and temporally rather than as a list.",
      },
      {
        label: "Learnings",
        body: "In a real-time product the frontend architecture is part of the UX. Decisions about what loads when were felt by operators as decisions about how quickly they could respond.",
      },
    ],
  },
  {
    slug: "indane-yatra-mitra",
    results: [{ value: "Live", label: "On the Play Store", source: "IOCL LPG tanker operations" }],
    title: "Indane Yatra Mitra",
    org: "MapMyIndia [Gtropy] · for IOCL",
    role: "Frontend · UI/UX",
    period: "Shipped",
    status: "shipped",
    premise:
      "When the cargo is LPG, a tracking product stops being a logistics tool and starts being a safety one.",
    stack: ["React", "Ionic", "Mappls SDK", "TypeScript"],
    signals: [{ label: "Distribution", value: "Live on Play Store" }],
    report: [
      { label: "Brief", body: "Enterprise fleet tracking for IOCL LPG tanker operations." },
      {
        label: "Context",
        body: "IOCL runs LPG tanker fleets. Tracking them is a safety programme as much as a logistics one: where each tanker is, whether it left its route, whether an alarm fired, and who is allowed to see which fleet.",
      },
      {
        label: "Users",
        body: "IOCL operations and safety staff across roles, each responsible for a defined slice of the fleet.",
      },
      {
        label: "Discovery",
        body: "The roles were the product. A depot manager, a regional supervisor and a safety officer need different views of the same tankers, and giving everyone everything would have been both a usability and a security failure.",
      },
      {
        label: "Problem",
        body: "Live tracking with safety alarms, geofencing and route playback, delivered per role, on a mobile app that field staff would actually keep open.",
      },
      {
        label: "Hypothesis",
        body: "If access is modelled around accountability — you see what you are answerable for — the app is simpler for every user and safer for the operator.",
      },
      {
        label: "Strategy",
        body: "Role-based access as a first-class concept from the start, with geofences and alarms configured against it, rather than bolted on after the tracking views were built.",
      },
      {
        label: "Prioritization",
        body: "Live tracking and safety alarms first; geofencing next; playback for investigation; then the administrative surfaces for managing roles and fleets.",
      },
      { label: "UX", body: "Route playback and role-based access, so each role sees the slice of the fleet it is accountable for." },
      {
        label: "Design",
        body: "Map-first screens with the alarm state visible without a tap, and playback for after-the-fact review of any journey.",
      },
      {
        label: "Technology",
        body: "Live tracking, safety alarms, geofencing, route playback and role-based access control.",
      },
      {
        label: "Build",
        body: "React, Ionic and the Mappls SDK in TypeScript. Live on the Play Store.",
      },
      { label: "Outcome", body: "Live on the Play Store." },
      {
        label: "Learnings",
        body: "When the cargo is hazardous, an alert that is easy to dismiss is a design flaw. The interface has to make the safe action the obvious one.",
      },
    ],
  },
  {
    slug: "fastag-platform",
    measure: ["Registration completion rate", "OTP failure rate"],
    cover: "/missions/fastag-platform.jpg",
    title: "FASTag Platform",
    org: "MapMyIndia [Gtropy]",
    role: "Full stack",
    period: "Shipped",
    status: "shipped",
    premise:
      "Registration flows are where products lose people. Multi-vehicle registration is where they lose them twice.",
    stack: ["React", "Node.js", "REST APIs"],
    signals: [{ label: "Scope", value: "Full stack" }],
    report: [
      { label: "Brief", body: "Full-stack FASTag registration with multi-vehicle management and OTP authentication." },
      {
        label: "Context",
        body: "FASTag registration is a form-heavy process that users do rarely and under mild stress. Owners with several vehicles have to do it several times, and every repetition is a chance to abandon.",
      },
      {
        label: "Users",
        body: "Vehicle owners registering and managing FASTags — including fleet owners with many vehicles — and the operators supporting them.",
      },
      {
        label: "Discovery",
        body: "The registration flow had to be right on the first attempt, because there is no second one; and multi-vehicle management had to feel like one account with many vehicles, not many accounts.",
      },
      {
        label: "Problem",
        body: "Onboard users with OTP authentication, let them register and manage multiple vehicles, and keep the data in sync securely across the platform.",
      },
      {
        label: "Hypothesis",
        body: "If authentication is a phone number and a code, and a second vehicle is one screen rather than a whole flow, the registration ceases to be the reason people leave.",
      },
      {
        label: "Strategy",
        body: "Full stack: a Next.js frontend with validated interactive forms, a Node and Express backend with JWT session management and role-based access, and MongoDB schemas designed around the multi-vehicle relationship.",
      },
      {
        label: "Prioritization",
        body: "OTP authentication and the single-vehicle registration first; multi-vehicle management second; real-time sync and notifications after the core flow was stable.",
      },
      {
        label: "UX",
        body: "Forms that validate as you go and never lose state; a vehicle list that makes adding the next one obvious.",
      },
      {
        label: "Design",
        body: "Responsive, form-first screens with clear progress and no dead ends.",
      },
      { label: "Technology", body: "OTP authentication, multi-vehicle management, full-stack implementation." },
      {
        label: "Build",
        body: "Next.js, Node.js, Express and MongoDB, with authentication and REST APIs. Built end to end.",
      },
      {
        label: "Outcome",
        body: "A working registration and multi-vehicle management platform with OTP authentication and real-time data synchronisation.",
      },
      {
        label: "Learnings",
        body: "Registration is a product, not a form. Treating it as the thing that decides whether there is a user at all changed every decision about it.",
      },
    ],
  },
  {
    slug: "hermes",
    measure: ["Time per data task", "Errors per batch"],
    cover: "/missions/hermes.jpg",
    title: "Hermes",
    org: "MapMyIndia [Gtropy]",
    role: "Frontend · design system",
    period: "Shipped",
    status: "shipped",
    premise:
      "Internal tools get judged by the people who have no choice but to use them. That is a harder audience, not an easier one.",
    stack: ["React", "TypeScript"],
    signals: [{ label: "Audience", value: "Internal" }],
    report: [
      { label: "Brief", body: "An internal logistics and data management tool." },
      {
        label: "Context",
        body: "An internal logistics and data management tool. Its users could not choose another product, which makes them the most honest audience there is.",
      },
      { label: "Users", body: "Internal operations staff." },
      {
        label: "Discovery",
        body: "Internal tools accumulate inconsistency — every screen built by whoever needed it that week. The first job was a component library, so that the next screen would look and behave like the last.",
      },
      {
        label: "Problem",
        body: "A modular, consistent, accessible interface for daily internal operations and data management.",
      },
      {
        label: "Hypothesis",
        body: "If the components are consistent and accessible by default, every new screen inherits both, and the tool stops needing a redesign each year.",
      },
      {
        label: "Strategy",
        body: "A reusable component library in React with Tailwind CSS, designed in Figma first, with accessibility and responsive behaviour built into the base components.",
      },
      {
        label: "Prioritization",
        body: "The components used on every screen first, then the workflows operations staff run most often, then data visualisation.",
      },
      { label: "UX", body: "Accessibility was treated as a requirement, not a pass at the end." },
      { label: "Design", body: "Modular, component-driven UI." },
      {
        label: "Technology",
        body: "React, Next.js and Tailwind CSS; Figma for the design system source.",
      },
      {
        label: "Build",
        body: "Component-driven UI, consistent design patterns, accessibility standards maintained throughout.",
      },
      {
        label: "Outcome",
        body: "A consistent, accessible internal interface built on a reusable component library.",
      },
      {
        label: "Learnings",
        body: "Internal tools are where a design system pays for itself fastest — the audience is small, the screens are many, and nobody forgives inconsistency they have to live in every day.",
      },
    ],
  },
];

export const featuredMissions = missions.filter((m) => m.featured);
export const activeMissions = missions.filter((m) => m.status === "active");

export function getMission(slug: string) {
  return missions.find((m) => m.slug === slug);
}
