// Every number here is transcribed from PROFILE.md. Nothing is inferred.
// `magnitude` is the bare number used to size the bar; `value` is what is shown.

export type Result = {
  value: string;
  label: string;
  source: string;
  magnitude: number;
  kind: "scale" | "delta";
};

export const results: Result[] = [
  { value: "200,000+", label: "Users", source: "Vahan Shakti", magnitude: 200000, kind: "scale" },
  { value: "30,000+", label: "Routes injected", source: "IOCL GeoRTD", magnitude: 30000, kind: "scale" },
  { value: "20,000+", label: "Vehicles monitored", source: "Locate · Maharashtra", magnitude: 20000, kind: "scale" },
  { value: "20,000+", label: "Attendees", source: "Milan, SRMIST", magnitude: 20000, kind: "scale" },
  { value: "10,000+", label: "Active vehicles, scaling to 50,000", source: "Intouch", magnitude: 10000, kind: "scale" },
  { value: "600K+", label: "Follower brand shipped", source: "Lean Multiverse · Smaak.ux", magnitude: 600000, kind: "scale" },
  { value: "300+", label: "Workshop participants", source: "UI/UX workshop, Alexa Developers SRM", magnitude: 300, kind: "scale" },
  { value: "50+", label: "Cross-functional team led", source: "Milan core team", magnitude: 50, kind: "scale" },
  { value: "~40%", label: "Dashboard performance", source: "Caching · RxJS · API optimisation", magnitude: 40, kind: "delta" },
  { value: "+30%", label: "OCR extraction accuracy", source: "Datamatics R&D", magnitude: 30, kind: "delta" },
  { value: "+15%", label: "Task completion after UX research", source: "Datamatics usability testing", magnitude: 15, kind: "delta" },
];

/** Ownership columns, matched against each mission's `role` string. */
export const ownershipColumns = [
  { key: "frontend", label: "Frontend", test: /frontend|full stack/i },
  { key: "ux", label: "UI / UX", test: /ui\/ux|ux|design/i },
  { key: "prd", label: "PRD", test: /prd/i },
  { key: "xfn", label: "Cross-team", test: /cross-functional|lead|architecture|full stack/i },
] as const;
