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
    group: "platform",
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
      decided: ["The PRD: problem statement, user stories, acceptance criteria, edge cases", "The UX: installation, replacement and rectification as three distinct jobs"],
      built: ["The app, end to end"],
      withTeam: ["Cross-functional delivery"],
    },
    report: [
      {
        label: "Brief",
        body: "An end-to-end app for tracking technicians and managing field operations (installation, replacement and rectification jobs), built end to end.",
      },
      {
        label: "Context",
        body: "Installation, replacement and rectification are three different jobs wearing the same uniform. Each has its own preconditions, its own proof-of-completion, and its own way of going wrong once someone is standing at a vehicle with a phone in one hand.",
      },
      { label: "Users", body: "Field technicians and the operations staff who dispatch and verify their work." },
      {
        label: "Discovery",
        body: "Three job types (installation, replacement, rectification) were being coordinated through the same channels with no shared definition of 'done'. The first work was writing down, per job type, what has to be true before a technician starts, what proof closes it, and where each one usually stalls.",
      },
      {
        label: "Problem",
        body: "Coordination lived in messages and spreadsheets. Nobody could answer where a job stood without asking a person.",
      },
      {
        label: "Hypothesis",
        body: "If the app carries job state as its primary object, rather than the technician or the vehicle, then dispatch, the technician and verification are looking at the same thing, and the coordination that lived in messages disappears because it has nowhere left to live.",
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
    group: "owned",
    links: [{ label: "shop.mappls.com", href: "https://shop.mappls.com" }],
    updated: "2026-10-24",
    measure: [
      "Renewal conversion rate, the North Star",
      "Renewals completed without a support call",
      "Payment success rate",
      "Time from payment to invoice",
    ],
    results: [
      { value: "4×", label: "Collections", source: "vs the manual process" },
      { value: "80%", label: "Less manual ops work", source: "Billing & accounts" },
      { value: "30+", label: "Users", source: "shop.mappls.com" },
      { value: "Live", label: "Generating revenue" },
    ],
    title: "Mappls Shop Admin & Automated Billing",
    org: "MapMyIndia [Gtropy]",
    role: "UI/UX owner · PRD author · cross-functional delivery",
    period: "Active",
    status: "active",
    featured: true,
    premise:
      "Billing was done by hand. The interesting part was not automating the maths. It was finding every place a human was quietly making a decision.",
    stack: ["Angular", "TypeScript", "Spring Boot", "Odoo", "Razorpay"],
    // Results first: the galaxy HUD shows the first two signals.
    signals: [
      { label: "Collections", value: "4× the manual process" },
      { label: "Manual ops", value: "80% less" },
      { label: "Replaces", value: "A fully manual billing process" },
      { label: "Model", value: "Device subscription renewals" },
    ],
    ownership: {
      decided: [
        "The PRD",
        "The UI/UX",
        "The Admin Platform PRD (v1, October 2026): one portal for Billing, Gadgets Catalog and Operations, with role-based access",
      ],
      built: ["The web app frontend"],
      withTeam: ["Cross-functional delivery"],
    },
    report: [
      {
        label: "Brief",
        body: "Replace a fully manual billing process with an automated system for device subscriptions and their renewals, and give shop operations a first-class admin surface.",
      },
      {
        label: "Context",
        body: "A manual process is never only arithmetic. It carries exceptions, tolerances and judgement calls that were never written down anywhere, because the person doing them never needed them written down.",
      },
      { label: "Users", body: "Shop administrators, the billing team and the accounts team, plus the customers renewing a device subscription at shop.mappls.com." },
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
        body: "Automating the calculation is the easy half. If every judgement call the operator was making by hand is captured as an explicit rule, or explicitly surfaced for a human decision, the process becomes consistent, and consistency is what reconciliation actually needs.",
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
        body: "An Angular admin console over the Spring billing API, with Odoo upstream for devices and renewal dates and Razorpay for payments. The billing rules live server-side, so the admin surface, the customer checkout and any future automation share one source of truth.",
      },
      { label: "Build", body: "Ali owns the UI/UX, wrote the PRD, and drives delivery across the teams involved." },
      {
        label: "Roadmap",
        body: [
          "Billing was the first module of a bigger product: the subscription lifecycle for every connected device Mappls sells. The North Star is renewal conversion, the share of subscriptions that reach their renewal window and actually renew. Phase one is self-service renewal, payment, invoicing and timed reminders; phase two adds analytics and operational depth; phase three is auto-renewal, which waits on RBI's e-mandate rules.",
          "In October 2026 I wrote the PRD that grows the admin into one platform for three teams: Billing, a new Gadgets Catalog, and Operations for orders, shipping and installation. It replaces all-or-nothing super-admin access with role-based feature permissions, puts subscriptions and gadget orders on one payments layer, and records every change in an audit log. The gadgets storefront it serves is being built in four phases, with checkout off until the catalog is right.",
        ],
      },
      { label: "Outcome", body: "Live and generating revenue, with 30+ users. Collections are four times what the manual process brought in, and the operations work it needed is down 80%: the lookups, re-keying and re-checking that filled a manual cycle are now the system's job, and what is left for a person is the flagged decisions." },
      {
        label: "Learnings",
        body: "The PRD's most valuable section was the list of things the previous process decided silently. Making those decisions explicit was most of the product work; the code was the smaller part.",
      },
    ],
  },
  {
    slug: "iocl-geortd",
    group: "client",
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
      { label: "Brief", body: "Geospatial route data creation for Indian Oil: GeoRTD generation at scale." },
      {
        label: "Context",
        body: "Indian Oil moves LPG by road across thousands of routes. Every one of those routes needs geospatial reference data (the GeoRTD) before tracking, geofencing and playback can work against it.",
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
        body: "If every route carries provenance (what it was generated from, when, by which run), then errors are a data question rather than an archaeology exercise, and the team can trust the pipeline enough to keep running it.",
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
      { label: "Technology", body: "Route data generated and injected into an Amazon S3 bucket: 30,000+ routes." },
      { label: "Build", body: "In progress." },
      { label: "Outcome", body: "30,000+ routes injected so far; the pipeline is live and still being measured. What gets measured: route accuracy against ground truth, and throughput per run." },
      {
        label: "Learnings",
        body: "Data pipelines are products with a user of one team. They deserve the same discovery (what does the person running this need to know, and when?) as anything customer-facing.",
      },
    ],
  },
  {
    slug: "vahan-shakti",
    group: "platform",
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
      built: ["React map components: live location, custom markers, route plotting, clustering, heatmaps"],
    },
    report: [
      { label: "Brief", body: "Vehicle tracking and analytics for a government fleet programme." },
      {
        label: "Context",
        body: "A map that shows everything shows nothing. Past a certain density, every additional marker removes information rather than adding it.",
      },
      { label: "Users", body: "Government fleet operators and administrators, 200,000+ of them." },
      {
        label: "Discovery",
        body: "A map of a national fleet is unreadable at the scale it needs to serve. The work began by identifying which questions operators asked at which zoom levels (where is everything, where is the density, where is this one vehicle) and designing a different answer for each.",
      },
      {
        label: "Problem",
        body: "Live location at national scale, rendered in a browser, without the interface collapsing into noise.",
      },
      {
        label: "Hypothesis",
        body: "If the map changes what it emphasises with altitude (clusters and heat at the top, individual markers and routes close in), one interface can serve both the overview and the individual case without either collapsing into noise.",
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
        body: "React map components over the Mappls SDK: live location, custom markers, route plotting, clustering and heatmaps.",
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
    group: "owned",
    blueprint: {
      features: [
        { name: "Live fleet map", does: "Every vehicle's position and status in real time, rendered to stay smooth under high-frequency updates at fleet scale.", tag: "Core" },
        { name: "Quick filters", does: "Segment the fleet instantly by status, region, customer or vehicle type, the way operators actually slice it.", tag: "Core" },
        { name: "Trip playback", does: "Replay any journey as an animated trip with media-player controls, to see what happened instead of asking someone.", tag: "Investigation" },
        { name: "Operational dashboards", does: "The operational read first, the chart second: what needs attention across the fleet today.", tag: "Overview" },
        { name: "Driver Safety", does: "DMS, ADAS and trip alerts rolled into one Safety score and a ranked driver list, for VinFast and SM Green.", tag: "Client module" },
        { name: "Device Communication Health", does: "Which trackers have gone quiet, for how long and in which vehicle groups, for Toyota Logistics.", tag: "Client module" },
      ],
      diagrams: [
        {
          kind: "bands",
          title: "Built for the fleet that arrives next",
          caption: "The measured scale: 10,000+ active vehicles in production, on an architecture designed for 50,000. Widths are to scale.",
          unit: "Active vehicles",
          max: 50000,
          bands: [
            { from: 0, to: 10000, label: "In production", range: "10,000+ vehicles", tone: "ok" },
            { from: 10000, to: 50000, label: "Headroom built in", range: "up to 50,000", tone: "low" },
          ],
          ticks: [{ at: 0, label: "0" }, { at: 10000, label: "10,000" }, { at: 50000, label: "50,000" }],
        },
        {
          kind: "flow",
          title: "One app between the vehicles and the people who run them",
          caption: "What InTouch does with the data a fleet produces. A model of the product, not live data.",
          columns: [
            { label: "Vehicles", nodes: [{ name: "GPS trackers", note: "position, speed, ignition" }, { name: "Video telematics", note: "in-cab and road cameras" }, { name: "Device heartbeat", note: "last data received" }] },
            { label: "InTouch", nodes: [{ name: "Live map + quick filters" }, { name: "Trip playback" }, { name: "Dashboards" }, { name: "Client modules", note: "Driver Safety · Device health" }] },
            { label: "Teams", nodes: [{ name: "Fleet operators", note: "Android and iOS" }, { name: "Fleet and safety managers", note: "web portal" }, { name: "Enterprise clients", note: "VinFast · SM Green · Toyota Logistics" }] },
          ],
        },
        {
          kind: "flow",
          title: "The order it was built in",
          caption: "Each stage had to stay smooth at 10,000 active vehicles before the next one started.",
          columns: [
            { label: "First", nodes: [{ name: "Real-time tracking" }] },
            { label: "Then", nodes: [{ name: "Quick filters" }] },
            { label: "Then", nodes: [{ name: "Animated trip playback" }] },
            { label: "Then", nodes: [{ name: "Dashboards" }, { name: "Client modules" }] },
          ],
        },
      ],
    },
    links: [{ label: "Google Play", href: "https://play.google.com/store/apps/details?id=intouch.mappls.app" }],
    listing: {
      where: "Google Play",
      href: "https://play.google.com/store/apps/details?id=intouch.mappls.app",
      installs: "1K+",
      updated: "12 May 2026",
      read: "2026-11-16",
    },
    results: [
      { value: "10,000+", label: "Active vehicles" },
      { value: "50,000", label: "Designed headroom" },
      { value: "Live", label: "On the Play Store" },
    ],
    cover: "/missions/intouch.jpg",
    title: "Mappls Intouch",
    org: "MapMyIndia [Gtropy]",
    role: "Product owner · Frontend · UI/UX · Driver Safety PRD",
    updated: "2026-11-19",
    measure: [
      "Time for a new user to find the driver who most needs attention",
      "Weekly accounts opening the Driver Scorecard",
      "Accounts that change at least one Alert Setting",
      "Support tickets saying a score looks wrong",
    ],
    period: "Shipped",
    status: "shipped",
    featured: true,
    premise:
      "Built for ten thousand vehicles, architected for fifty thousand, because the second number is the one that arrives without warning.",
    stack: ["React", "Ionic", "TypeScript", "RxJS"],
    signals: [
      { label: "Active vehicles", value: "10,000+" },
      { label: "Headroom", value: "Scaling to 50,000" },
      { label: "Distribution", value: "Live on Play Store" },
      { label: "Client deployments", value: "VinFast, SM Green, Toyota Logistics" },
    ],
    ownership: {
      decided: [
        "Product owner of Mappls Intouch since the July 2026 promotion",
        "The Driver Safety PRD (v1.0, October 2026): scope, scoring rules, API contract, success measures",
        "The locked product calls: driver-first, data only, no coaching or review workflow",
      ],
      built: [
        "The DMS, ADAS and driver sections, for VinFast and SM Green",
        "A clickable Driver Safety prototype, through eleven design iterations",
        "The Device Communication Health dashboard for Toyota Logistics",
      ],
    },
    report: [
      { label: "Brief", body: "A cross-platform logistics management app for fleet operators." },
      {
        label: "Context",
        body: "Logistics teams run on their phones. The app had to hold up under high-frequency data on Android and iOS, and it had to be built for a fleet larger than the one it launched with.",
      },
      { label: "Users", body: "Logistics and fleet operations teams." },
      {
        label: "Discovery",
        body: "Operators segment fleets constantly (by status, region, customer, vehicle type) and they replay trips to understand what happened. Those two behaviours shaped the product more than any dashboard request.",
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
      {
        label: "Client work",
        body: [
          "## Driver Safety, for VinFast and SM Green",
          "The video telematics devices already produced the data: in-cab cameras, road-facing cameras, GPS and motion sensors. What a fleet manager could not do was answer \"which drivers are risky this week?\" without opening several screens, and the alarm names did not even agree with each other. I wrote the PRD for a Driver Safety module and created its DMS (driver monitoring), ADAS (driver assistance) and driver sections: a safety overview, a scorecard that ranks every driver, a report per driver, and one evidence window with video, map and trip for any alert.",
          "The decisions that shaped it were the ones about what not to build. It reports, scores and notifies; it does not run a coaching programme or a review queue, because the client's own team owns the people side. Drivers are compared per distance or hours driven, never on raw counts, and nobody is scored until they have driven enough to be judged. Customers choose which alarms they see and how much each one counts toward the score, and a hidden alarm is removed on the server, so it cannot leak back through an export.",
          "## Device health, for Toyota Logistics",
          "A tracker that stops reporting looks exactly like a parked vehicle until someone checks. I built a Device Communication Health dashboard that classifies every vehicle by the time since its last GPRS data (online, offline, inactive, not working), ranks vehicle groups by how much of them has gone quiet, and exports the list to act on.",
          "No outcome is on file for any of the three clients yet, so none is claimed here. The measures the PRD sets are listed under Results.",
        ],
      },
      { label: "Outcome", body: "Live on the Play Store." },
      {
        label: "Learnings",
        body: "Designing for the fleet you will have, not the one you have, is cheaper than it sounds, provided the architecture decision is made before the first screen, not after the first outage.",
      },
    ],
  },
  {
    slug: "locate",
    group: "platform",
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
      { label: "Brief", body: "Real-time vehicle monitoring for an OEM, on web and mobile dashboards." },
      {
        label: "Context",
        body: "A vehicle manufacturer wanted to see its fleet in the field: live location, engine health, journeys, driver behaviour and driver test scores, across 20,000+ vehicles in Maharashtra, from a desk and from a phone.",
      },
      { label: "Users", body: "Manufacturer operations teams monitoring 20,000+ vehicles across Maharashtra." },
      {
        label: "Discovery",
        body: "The web and mobile dashboards had different jobs. The desk wanted analysis: trends, comparisons, driver scoring. The phone wanted a quick answer about one vehicle. Same data, different questions.",
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
    group: "platform",
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
        body: "Alerts arrive continuously; humans work in queues. The product's job was to turn the first into the second, and to let an operator see where and when an alert happened, not just that it did.",
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
    group: "owned",
    blueprint: {
      features: [
        { name: "Live tanker tracking", does: "Where every LPG tanker is, with its alarm state visible on the map without a tap.", tag: "Core" },
        { name: "Safety alarms", does: "Alerts that fire when a tanker does something it shouldn't, designed so the safe action is the obvious one.", tag: "Safety" },
        { name: "Geofencing", does: "Zones and routes a tanker is meant to keep to, with an alarm when it leaves them.", tag: "Safety" },
        { name: "Route playback", does: "Replay any journey after the fact, for investigating an alarm or a complaint.", tag: "Investigation" },
        { name: "Role-based access", does: "Each person sees the slice of the fleet they are accountable for, no more and no less.", tag: "Access" },
        { name: "Fleet and role admin", does: "The surfaces for managing who sees which fleet, configured against the same roles the alarms use.", tag: "Admin" },
      ],
      diagrams: [
        {
          kind: "flow",
          title: "From a tanker on the road to the person accountable for it",
          caption: "How a position becomes an alarm in the right hands. A model of the product's logic, not live data.",
          columns: [
            { label: "On the road", nodes: [{ name: "Tanker tracker", note: "live position" }, { name: "Journey history", note: "for playback" }] },
            { label: "Rules", nodes: [{ name: "Geofences and routes" }, { name: "Safety alarm rules" }, { name: "Role scope", note: "who answers for which tankers" }] },
            { label: "Who sees it", nodes: [{ name: "Field and depot staff", note: "their tankers, live" }, { name: "Regional supervisors", note: "their region" }, { name: "Safety officers", note: "alarms and playback" }] },
          ],
        },
        {
          kind: "flow",
          title: "The order it was built in",
          caption: "Safety before convenience: the alarm path shipped first, the admin last.",
          columns: [
            { label: "First", nodes: [{ name: "Live tracking" }, { name: "Safety alarms" }] },
            { label: "Next", nodes: [{ name: "Geofencing" }] },
            { label: "Then", nodes: [{ name: "Route playback" }] },
            { label: "Last", nodes: [{ name: "Role and fleet admin" }] },
          ],
        },
      ],
    },
    links: [{ label: "Google Play", href: "https://play.google.com/store/apps/details?id=iocl.cvtms.mappls" }],
    listing: {
      where: "Google Play",
      href: "https://play.google.com/store/apps/details?id=iocl.cvtms.mappls",
      installs: "1K+",
      rating: "4.5",
      reviews: 12,
      updated: "19 Mar 2026",
      read: "2026-11-16",
    },
    results: [{ value: "Live", label: "On the Play Store", source: "IOCL LPG tanker operations" }],
    title: "Indane Yatra Mitra",
    org: "MapMyIndia [Gtropy] · for IOCL",
    role: "Product owner · Frontend · UI/UX",
    updated: "2026-11-19",
    ownership: {
      decided: ["Product owner of Indane Yatra Mitra since the July 2026 promotion", "Role-based access as a first-class concept, not bolted on"],
      built: ["The frontend: live tracking, alarms, geofencing, playback and role-based access", "Map-first screens with the alarm state visible without a tap"],
    },
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
        body: "If access is modelled around accountability (you see what you are answerable for), the app is simpler for every user and safer for the operator.",
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
    group: "platform",
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
        body: "Vehicle owners registering and managing FASTags, including fleet owners with many vehicles, and the operators supporting them.",
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
    group: "platform",
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
        body: "Internal tools accumulate inconsistency, with every screen built by whoever needed it that week. The first job was a component library, so that the next screen would look and behave like the last.",
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
        body: "Internal tools are where a design system pays for itself fastest: the audience is small, the screens are many, and nobody forgives inconsistency they have to live in every day.",
      },
    ],
  },
  // ── Client builds drawn, not screenshotted (2026-11-19) ─────────────────
  // Facts from PROFILE.md ("From Ali's own working files" and "From Ali's
  // claude.ai chats"). Product-level only: no internal API names, URLs,
  // vehicle numbers or client rates. The blueprints are models of each
  // product's logic, never charts of real data.
  {
    slug: "driver-safety",
    group: "client",
    title: "Driver Safety",
    org: "MapMyIndia [Gtropy] · InTouch, for VinFast & SM Green",
    role: "PRD owner · UX · DMS, ADAS & driver sections",
    period: "In build",
    updated: "2026-11-19",
    status: "active",
    premise: "A fleet manager doesn't need three sensor dashboards. They need to know which driver to look at first, and why.",
    stack: ["PRD v1.0", "Clickable prototype", "OpenAPI contract", "InTouch"],
    signals: [
      { label: "Clients", value: "VinFast · SM Green" },
      { label: "Camera alarms", value: "7 in-cab · 4 road" },
    ],
    measure: [
      "Time to find the riskiest driver",
      "Scorecard adoption",
      "Alert settings customised per customer",
      "“Score looks wrong” support tickets",
      "Alarm-naming support tickets",
    ],
    ownership: {
      decided: [
        "Driver-first: who needs attention, on one screen",
        "One Safety score; alerts grouped by risk, not by sensor",
        "Data only: no coaching programme, no review workflow",
        "Scores per distance or hours, never raw counts",
      ],
      built: ["PRD v1.0 (13 Oct 2026)", "The clickable prototype, 11 design iterations", "The DMS, ADAS and driver sections in InTouch"],
      withTeam: ["The OpenAPI contract with backend", "Delivery with frontend and QA"],
    },
    blueprint: {
      features: [
        { name: "Safety overview", does: "One Safety score with its trend, the risk themes, and the drivers who need attention first.", tag: "All sources" },
        { name: "DMS", does: "What the driver does: 7 in-cab camera alarms, from phone use and smoking to drowsiness and a missing seat belt.", tag: "In-cab camera" },
        { name: "ADAS", does: "What is happening on the road: 4 road-facing alarms for collision, pedestrians, headway and lane departure.", tag: "Road camera" },
        { name: "Trip alerts", does: "What the vehicle did: overspeeding, harsh acceleration, braking and cornering, night and non-stop driving.", tag: "GPS & motion" },
        { name: "Driver scorecard", does: "Every driver ranked on the same scale, with a per-driver report behind each score.", tag: "All sources" },
        { name: "On-demand video", does: "Request the clip behind an alert, so a score can be checked against what actually happened.", tag: "Cameras" },
        { name: "Alert settings", does: "Each customer hides alarms and sets their weights; weights must total 100, and hidden alarms never leak into exports.", tag: "Per customer" },
      ],
      diagrams: [
        {
          kind: "flow",
          title: "From three sensors to one decision",
          caption: "How an alarm becomes a ranked driver. A model of the product's logic, not live data.",
          columns: [
            { label: "Sources", nodes: [{ name: "In-cab camera", note: "DMS" }, { name: "Road camera", note: "ADAS" }, { name: "GPS & motion", note: "Trip alerts" }] },
            { label: "Scoring", nodes: [{ name: "Count per distance or hours", note: "never raw totals" }, { name: "Weight by the customer's settings", note: "weights total 100" }, { name: "Drop hidden alarms", note: "enforced server-side" }] },
            { label: "The manager sees", nodes: [{ name: "One Safety score" }, { name: "Risk themes" }, { name: "Drivers ranked, with video" }] },
          ],
        },
        {
          kind: "matrix",
          title: "Risk themes, not sensors",
          caption: "Each alert type belongs to one risk theme; the source is a tag. A theme with no alert types for a customer is hidden, so a GPS-only fleet still sees Speeding, Harsh driving and Fatigue.",
          cols: ["DMS · in-cab", "ADAS · road", "GPS · motion"],
          rows: [
            { label: "Speeding", cells: [[], [], ["Overspeeding"]] },
            { label: "Harsh driving", cells: [[], [], ["Harsh acceleration", "Harsh braking", "Harsh cornering"]] },
            { label: "Distraction", cells: [["Mobile phone use", "Distraction", "Smoking"], [], []] },
            { label: "Fatigue", cells: [["Drowsiness", "Yawning"], [], ["Night driving", "Continuous driving"]] },
            { label: "Collision risk", cells: [[], ["Forward collision", "Pedestrian collision", "Headway", "Lane departure"], []] },
            { label: "Compliance", cells: [["No seat belt", "Driver absent"], [], []] },
          ],
        },
      ],
    },
    report: [
      { label: "Brief", body: "A Driver Safety module inside InTouch for VinFast and SM Green: driver monitoring (DMS), driver assistance (ADAS) and trip alerts, rolled into one score and one ranked list of drivers." },
      { label: "Context", body: "Video telematics produces a flood of alarms from two cameras and the vehicle's own sensors. Sold by sensor, the product had a page per source and three separate gauges, and none of them said who to talk to." },
      { label: "Users", body: "Fleet managers and safety leads at enterprise customers, who have minutes, not hours, to decide which drivers need attention this week." },
      { label: "Discovery", body: "The sensor split is how the product is sold and entitled, not how a manager thinks. Alerts that all look equally important stop getting opened; the useful grouping is by risk (speeding, harsh driving, distraction, fatigue, collision risk, compliance), with the source shown as a small tag." },
      { label: "Problem", body: "Three modules with similar-sounding scores (driving score, fleet safety score, driver scores) and a third page called Driving Behaviour that read like the parent of the other two." },
      { label: "Strategy", body: "Name each source by what it sees (the driver, the road, the vehicle), keep exactly one Safety score, and make the overview answer three questions in order: are we improving, who needs attention, and what happened." },
      { label: "Prioritization", body: "Overview and the driver scorecard first, then the DMS, ADAS and trip-alert pages as the places to check the detail, then on-demand video and alert settings. Coaching and a review workflow were cut: the product reports, the customer decides." },
      { label: "UX", body: "Driver-first: the riskiest drivers are on the first screen. Scores compare per distance or per hour, never raw counts, and a driver isn't scored until they have driven enough to be compared fairly." },
      { label: "Design", body: "A clickable prototype through 11 design iterations by 1 October 2026, each page hidden for a customer who hasn't bought that source." },
      { label: "Technology", body: "A PRD (v1.0, 13 October 2026) and an OpenAPI contract for backend, frontend and QA. The scores, bands and risk themes are computed from event counts and the customer's own alert weights, and hidden alarms are enforced on the server so they never leak through an export." },
      { label: "Outcome", body: "In build. The PRD names what will be measured, listed above as targets, not results." },
      { label: "Learnings", body: "A name is a product decision. Three scores that sound alike cost more support tickets than any missing feature." },
    ],
  },
  {
    slug: "tata-power-contracts",
    group: "client",
    title: "Contract Management Dashboard",
    org: "MapMyIndia [Gtropy] · Mappls Insight, for Tata Power",
    role: "Product design · UX · Working prototype",
    period: "Prototype, in client review",
    updated: "2026-11-19",
    status: "active",
    premise: "Vehicle contracts are billed on kilometres. A dashboard that compares month-to-date kilometres with a full month's limit calls every vehicle under-used for most of the month.",
    stack: ["HTML prototype", "JavaScript", "Charts", "Mappls Insight"],
    signals: [
      { label: "Pages", value: "2" },
      { label: "Status bands", value: "90% · 110%" },
    ],
    measure: [
      "Client sign-off on the pro-rating and variable-cost logic",
      "Whether the 90% and 110% bands match how the business judges a vehicle",
      "Cards and charts the client keeps or drops",
    ],
    ownership: {
      decided: [
        "Two pages, with billing as a separate deliverable",
        "Utilization charts in place of pricing charts",
        "Compare kilometres to date with the limit to date",
        "Status colours kept apart from the brand orange",
      ],
      built: ["The working prototype, one HTML file that opens offline", "Each round of client changes and the walkthrough"],
    },
    blueprint: {
      features: [
        { name: "Contract overview", does: "Cost, kilometres, utilization and vehicle counts as cards, with KM driven against the allowance and the status split.", tag: "Contract management" },
        { name: "Vehicle details", does: "Every vehicle's limit, extra kilometres, variable rate and cost; a click opens the full calculation and its month-end projection.", tag: "Contract management" },
        { name: "Vendor summary", does: "Vendors compared by utilization, with a status that comes from the vendor's combined kilometres.", tag: "Vendors" },
        { name: "Timelines", does: "Daily, weekly (last 7 days or Mon–Sun), monthly and custom ranges, with fixed cost and limits pro-rated to the days chosen.", tag: "Period" },
        { name: "To-date handling", does: "Running periods are marked to date, compared with the same days last period, and projected to month end.", tag: "Period" },
        { name: "Filters", does: "Region, vertical, business, project, vendor and utilization band, applied to every card and chart.", tag: "All views" },
        { name: "Editable bands", does: "The under and over thresholds (90% and 110% by default) change every status on every page.", tag: "Rules" },
      ],
      diagrams: [
        {
          kind: "curve",
          title: "What a vehicle costs",
          caption: "The contract model: a fixed charge covers the contractual kilometres, and every kilometre beyond them is billed at the vehicle's variable rate. Illustrative units, not a client's rates.",
          xLabel: "Kilometres driven in the period",
          yLabel: "Actual cost",
          points: [[0, 60], [100, 60], [150, 88]],
          marks: [{ x: 100, label: "KM limit" }],
          spans: [
            { from: 0, to: 100, label: "Fixed charge" },
            { from: 100, to: 150, label: "Extra KM × variable rate" },
          ],
        },
        {
          kind: "bands",
          title: "When a vehicle is under- or over-used",
          caption: "Utilization is kilometres driven ÷ the limit for the same days. Comparing to date with to date is the fix: against the full month's limit, a vehicle on track reads as under-used until the last day.",
          unit: "Utilization, % of the limit to date",
          max: 150,
          bands: [
            { from: 0, to: 90, label: "Under utilised", range: "below 90%", tone: "low" },
            { from: 90, to: 110, label: "Optimal", range: "90–110%", tone: "ok" },
            { from: 110, to: 150, label: "Over utilised", range: "above 110%", tone: "high" },
          ],
          ticks: [{ at: 0, label: "0%" }, { at: 90, label: "90%" }, { at: 110, label: "110%" }, { at: 150, label: "150%+" }],
        },
        {
          kind: "flow",
          title: "From kilometres to a contract view",
          caption: "What the dashboard computes for any period the user picks. A model of the logic, not live data.",
          columns: [
            { label: "Inputs", nodes: [{ name: "Daily kilometres", note: "per vehicle" }, { name: "Contract", note: "fixed charge + KM limit" }, { name: "Variable rate" }, { name: "Period chosen" }] },
            { label: "Calculation", nodes: [{ name: "Pro-rate limit and fixed cost", note: "to the days covered" }, { name: "Extra KM × rate", note: "variable cost" }, { name: "Utilization to date", note: "against 90% / 110%" }, { name: "Month-end projection", note: "at the current pace" }] },
            { label: "Views", nodes: [{ name: "Overview cards and charts" }, { name: "Vehicle table + cost drawer" }, { name: "Vendor summary" }] },
          ],
        },
      ],
    },
    report: [
      { label: "Brief", body: "A contract management dashboard for Tata Power's vehicle contracts on Mappls Insight: what each vehicle and vendor costs, and whether it is under-used, on track or over-used." },
      { label: "Context", body: "Each vehicle is hired on a contract: a fixed charge that covers a set number of kilometres, and a variable rate for every kilometre beyond it. The client manages vehicles across regions, verticals (Solar and Wind) and businesses (O&M and EPC), from many vendors." },
      { label: "Users", body: "Contract and fleet managers who approve vendor bills and need to see, on any day of the month, which vehicles and vendors are drifting from their contracts." },
      { label: "Discovery", body: "The live dashboard compared kilometres driven so far with the whole month's limit, so a vehicle on pace looked under-used for most of every month, and so did the fleet average." },
      { label: "Problem", body: "Make cost and utilization correct on any day, for any period, without the user having to know which figures are still running." },
      { label: "Strategy", body: "Pro-rate everything to the days the user is looking at, compare running periods with the same days of the previous one, and say plainly when a figure is to date." },
      { label: "Prioritization", body: "Two pages: Contract management (overview and vehicle details) and Vendor summary. Billing became a separate deliverable rather than a third tab that would have crowded the two jobs the client actually asked for." },
      { label: "UX", body: "Data stops at the last full day, future dates can't be picked, and Weekly defaults to the last seven days instead of a half-finished calendar week. A running period carries a to-date tag and a month-end projection." },
      { label: "Design", body: "Uniform KPI cards with a small visual each, utilization charts instead of pricing charts (by business, by vertical, by region, a histogram and a KM-against-limit scatter), and status colours (under, optimal, over) kept apart from the brand orange." },
      { label: "Build", body: "A working prototype in a single HTML file that opens offline, with sample data, the client's filters and the new cost columns, revised round by round with the client." },
      { label: "Outcome", body: "In client review. Nothing measured yet, so nothing is claimed." },
      { label: "Learnings", body: "A wrong denominator is a UX bug. Every chart was correct arithmetic on the wrong comparison until the period was made explicit." },
    ],
  },
  {
    slug: "toyota-device-health",
    group: "client",
    title: "Device Communication Health",
    org: "MapMyIndia [Gtropy] · InTouch, for Toyota Logistics",
    role: "Dashboard design · Build",
    period: "Delivered",
    updated: "2026-11-19",
    status: "shipped",
    premise: "A tracker that has stopped reporting looks exactly like a parked truck, until someone asks how long it has been quiet.",
    stack: ["InTouch portal", "JavaScript", "CSV export"],
    signals: [{ label: "Status bands", value: "4" }],
    blueprint: {
      features: [
        { name: "Status classification", does: "Every vehicle placed in one of four states by the time since its last GPRS data.", tag: "Core" },
        { name: "Status split", does: "How much of the fleet is online, offline, inactive or not working, at a glance.", tag: "Overview" },
        { name: "Groups ranked", does: "Vehicle groups sorted by their share of non-communicating devices; a click on a row filters everything to that group.", tag: "Overview" },
        { name: "Vehicle table", does: "Every vehicle with its last data time and state, filterable by status and group.", tag: "Detail" },
        { name: "CSV export", does: "The filtered list out to the team that fixes the devices.", tag: "Action" },
      ],
      diagrams: [
        {
          kind: "bands",
          title: "How long since it last spoke",
          caption: "The four states, by time since a vehicle's last GPRS data. The bands are the product's rules; no fleet data is shown.",
          unit: "Time since last data",
          max: 40,
          bands: [
            { from: 0, to: 1, label: "Online", range: "within 24 h", tone: "ok" },
            { from: 1, to: 7, label: "Offline", range: "1–7 days", tone: "low" },
            { from: 7, to: 30, label: "Inactive", range: "8–30 days", tone: "high" },
            { from: 30, to: 40, label: "Not working", range: "31+ days", tone: "idle" },
          ],
          ticks: [{ at: 0, label: "0" }, { at: 7, label: "7 d" }, { at: 30, label: "30 d" }, { at: 40, label: "31 d+" }],
        },
        {
          kind: "flow",
          title: "From a timestamp to a repair list",
          caption: "What the page does with each vehicle's last data time. A model of the logic, not live data.",
          columns: [
            { label: "Input", nodes: [{ name: "Last GPRS data", note: "per vehicle" }] },
            { label: "Rule", nodes: [{ name: "Age since last data" }, { name: "Four states", note: "online · offline · inactive · not working" }] },
            { label: "Out", nodes: [{ name: "Groups ranked by non-communicating share" }, { name: "Filtered vehicle table" }, { name: "CSV for the repair team" }] },
          ],
        },
      ],
    },
    report: [
      { label: "Brief", body: "A Device Communication Health page in the InTouch portal for Toyota Logistics: which tracking devices have stopped reporting, for how long, and in which vehicle groups." },
      { label: "Context", body: "A silent device breaks everything downstream of it: tracking, alerts and reports all go quiet without saying why. On a map, a vehicle with a dead tracker and a vehicle parked for the night look the same." },
      { label: "Problem", body: "Turn the time since each vehicle's last data into a status a fleet team can act on, and show where the problem is concentrated." },
      { label: "UX", body: "Four states by age (online within 24 hours, offline up to 7 days, inactive up to 30, not working beyond that), the status split first, then vehicle groups ranked by their share of non-communicating devices. A click on a group filters the table." },
      { label: "Build", body: "The page, its classification rules, the group ranking, the filterable vehicle table and CSV export, inside the InTouch portal." },
      { label: "Outcome", body: "Delivered. No public number is attached, and none is invented." },
      { label: "Learnings", body: "Absence of data is data. The most useful view of a tracking fleet can be the vehicles that are not reporting." },
    ],
  },
];

export const featuredMissions = missions.filter((m) => m.featured);
export const activeMissions = missions.filter((m) => m.status === "active");

export function getMission(slug: string) {
  return missions.find((m) => m.slug === slug);
}
