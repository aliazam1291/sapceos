export const DRAFT = "[DRAFT — needs input]" as const;

export type MissionStatus = "active" | "shipped" | "archived";

/** One section of a Mission Report. `body` may be the DRAFT marker when unverified. */
export type ReportSection = {
  label: string;
  body: string | string[];
};

export type Mission = {
  slug: string;
  title: string;
  org: string;
  role: string;
  period: string;
  status: MissionStatus;
  /** One line, shown on the index. Show the problem, not the tech. */
  premise: string;
  stack: string[];
  /** Verified scale facts only. Empty when none exist. */
  signals: { label: string; value: string }[];
  /**
   * Success data. `results` are measured numbers transcribed from PROFILE.md
   * (never inferred); `measure` is what WILL be measured where nothing is
   * yet — the honest state of an active mission. A mission may have either,
   * both, or (shipped, no public metric) neither.
   */
  results?: { value: string; label: string; source?: string }[];
  measure?: string[];
  /**
   * Ownership, split three ways so a reader never assumes solo-dev or
   * assumes a PM who only wrote the doc. Every line is a PROFILE.md fact;
   * omit a key rather than guess it.
   */
  ownership?: { decided?: string[]; built?: string[]; withTeam?: string[] };
  report: ReportSection[];
  featured?: boolean;
  /** Path under /public — a real screenshot or render of the shipped thing. */
  cover?: string;
};

export type FieldNote = {
  slug: string;
  title: string;
  kind: "case-study" | "note";
  premise: string;
  published?: string;
  body: string[];
  cover?: string;
};

export type OrbitTopic = {
  label: string;
  detail: string;
};

export type LabEntry = {
  title: string;
  premise: string;
  stack: string[];
  status: "live" | "open-source" | "prototype";
  href?: string;
  cover?: string;
};
