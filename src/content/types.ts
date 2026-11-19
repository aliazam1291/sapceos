export const DRAFT = "[DRAFT — needs input]" as const;

export type MissionStatus = "active" | "shipped" | "archived";

/** One section of a Mission Report. `body` may be the DRAFT marker when unverified. */
export type ReportSection = {
  label: string;
  body: string | string[];
};

/**
 * How a product works, drawn instead of screenshotted (2026-11-19). Ali:
 * "tell the features, add graphs of features, what it's doing — we can't
 * add images." Client products can't be shown, so their mechanics are:
 * every diagram is a MODEL of the product's logic (its flow, its bands,
 * its cost curve), never a chart of real data, and says so in its caption.
 */
export type BlueprintDiagram =
  | {
      kind: "flow";
      title: string;
      caption: string;
      /** Left to right: inputs → what the product does → what the user gets. */
      columns: { label: string; nodes: { name: string; note?: string }[] }[];
    }
  | {
      kind: "bands";
      title: string;
      caption: string;
      unit: string;
      /** Axis end; the last band runs to it. */
      max: number;
      /** `range` is the band in words ("90–110%"), shown where bands stack. */
      bands: { from: number; to: number; label: string; range: string; tone: "ok" | "low" | "high" | "idle" }[];
      ticks: { at: number; label: string }[];
    }
  | {
      kind: "curve";
      title: string;
      caption: string;
      xLabel: string;
      yLabel: string;
      /** Piecewise-linear model, in illustrative units. */
      points: [number, number][];
      marks: { x: number; label: string }[];
      /** Labelled spans along the curve. */
      spans: { from: number; to: number; label: string }[];
    }
  | {
      kind: "matrix";
      title: string;
      caption: string;
      cols: string[];
      /** Each row: a label and, per column, the items that fall in it. */
      rows: { label: string; cells: string[][] }[];
    };

export type Blueprint = {
  /** The product's modules: what each one does, in a sentence. */
  features: { name: string; does: string; tag?: string }[];
  diagrams: BlueprintDiagram[];
};

/** How the nav groups projects: products he owns, client builds, platforms shipped. */
export type MissionGroup = "owned" | "client" | "platform";

export type Mission = {
  slug: string;
  title: string;
  /** Nav grouping. */
  group?: MissionGroup;
  /** Mechanics drawn on the report page (see Blueprint). */
  blueprint?: Blueprint;
  org: string;
  role: string;
  period: string;
  /** ISO date this report last changed in substance; the sitemap's lastmod. */
  updated?: string;
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
  /** Where the shipped thing can be opened — store listings, live URLs. Proof, not decoration. */
  links?: { label: string; href: string }[];
  /**
   * The public record behind a live link: what the store listing itself
   * shows, read on a date (PROFILE.md "Public listings"). It is the
   * listing's number, attributed and dated — not an outcome Ali claims.
   */
  listing?: {
    where: string;
    href: string;
    installs?: string;
    rating?: string;
    reviews?: number;
    updated?: string;
    /** ISO date the listing was read. */
    read: string;
  };
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
