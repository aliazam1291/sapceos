import { DRAFT, type FieldNote } from "./types";

// The six independent case studies are listed in PROFILE.md by title only.
// They are product/UX analyses, NOT client work, and must be labelled as such.
// Their bodies are not written yet — the marker stays until Ali supplies them.

export const fieldNotes: FieldNote[] = [
  {
    slug: "linear-vs-jira",
    title: "Linear vs Jira",
    kind: "case-study",
    premise: "Two tools for the same job, built on opposite beliefs about what a team is.",
    body: [DRAFT],
  },
  {
    slug: "ai-code-assistant-adoption-paradox",
    title: "The AI Code Assistant Adoption Paradox",
    kind: "case-study",
    premise: "Everyone has one. Fewer people can say what changed.",
    body: [DRAFT],
  },
  {
    slug: "apple-ecosystem-fragmentation",
    title: "Apple Ecosystem Fragmentation",
    kind: "case-study",
    premise: "The company most associated with coherence, examined at its seams.",
    body: [DRAFT],
  },
  {
    slug: "flipkart-product-discovery",
    title: "Flipkart Product Discovery",
    kind: "case-study",
    premise: "Discovery at catalogue scale, where the shelf is infinite and attention is not.",
    body: [DRAFT],
  },
  {
    slug: "uber-driver-retention",
    title: "Uber Driver Retention",
    kind: "case-study",
    premise: "A two-sided marketplace where one side can leave on any given Tuesday.",
    body: [DRAFT],
  },
  {
    slug: "the-logistics-visibility-gap",
    title: "The Logistics Visibility Gap",
    kind: "case-study",
    premise: "Everything is tracked. Very little is actually visible.",
    body: [DRAFT],
  },
];

export function getFieldNote(slug: string) {
  return fieldNotes.find((n) => n.slug === slug);
}
