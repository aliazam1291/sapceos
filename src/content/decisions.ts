/**
 * Flight rules — the calls that show how Ali thinks, one beacon each.
 *
 * `call` is editorial (the rule, as a headline). `fact` and `evidence` are
 * transcribed from PROFILE.md, or — where marked `site` — are decisions
 * made on this site that the repo itself verifies. `measured` is set only
 * when PROFILE.md carries a number for it. Never add a rule without a fact.
 */
export type Decision = {
  id: string;
  call: string;
  fact: string;
  evidence: string;
  where: string;
  measured?: string;
  site?: boolean;
};

export const decisions: Decision[] = [
  {
    id: "states",
    call: "Define the states before the screens.",
    fact: "A vehicle is moving, stopped, idle, delayed or offline. Until those five words meant one thing each, no dashboard could be right.",
    evidence: "Defined vehicle status logic (moving / stopped / idle / delayed / offline); alarm, geofence and ticketing workflows.",
    where: "MapMyIndia · fleet & telematics platforms",
  },
  {
    id: "prd",
    call: "Write it down early enough to be wrong cheaply.",
    fact: "The PRD is the argument. Problem statement, user stories, acceptance criteria, edge cases — before a screen exists.",
    evidence: "Authored full PRDs — problem statements, user stories, acceptance criteria, edge cases.",
    where: "MapMyIndia · every active mission",
  },
  {
    id: "manual",
    call: "Replace the manual process; don't decorate it.",
    fact: "Billing was done by hand. The work was not the arithmetic — it was finding every place a person was quietly deciding.",
    evidence: "Mappls Shop Admin + automatic billing: replacing a fully manual billing process. Owns UI/UX, the PRD, cross-functional delivery.",
    where: "MapMyIndia · Mappls Shop Admin",
  },
  {
    id: "jobs",
    call: "Three jobs are not one screen.",
    fact: "Installation, replacement and rectification wear the same uniform and are different work. The app is built around the job, not the technician.",
    evidence: "Technician App: end-to-end tracking of technicians and field operations — installation, replacement, and rectification jobs.",
    where: "MapMyIndia · Technician App",
  },
  {
    id: "speed",
    call: "Speed is a product decision.",
    fact: "A data-heavy dashboard that takes too long is a dashboard nobody trusts. Caching, RxJS state and API shape were product work.",
    evidence: "~40% performance improvement on data-heavy dashboards via caching, RxJS state management, API optimisation.",
    where: "MapMyIndia · operational & analytics dashboards",
    measured: "~40%",
  },
  {
    id: "map",
    call: "A map is behaviour, not a layer.",
    fact: "Rotation, fit-to-route and playback are what make a map answer a question. Markers alone are a picture.",
    evidence: "Map UX: rotation, fit-to-route, route playback. React map components for live location, custom markers, route plotting, clustering, heatmaps.",
    where: "MapMyIndia · Vahan Shakti, 200,000+ users",
    measured: "200,000+",
  },
  {
    id: "source",
    call: "No number without a source.",
    fact: "The case studies once carried survey percentages nobody could trace. They were cut. Each note now ends with what would be measured instead.",
    evidence: "Every result on this site is transcribed from a verified record; active missions read “Not yet measured” until they are.",
    where: "This site",
    site: true,
  },
];
