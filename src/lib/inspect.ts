import type { InspectItem } from "@/components/InspectionBay";
import { studioKindLabel, type StudioPiece } from "@/content/studio";

/**
 * What the inspection bay shows for a studio piece: its true-colour image and
 * the facts the bay names. Shared by /studio and /smaak so a piece reads the
 * same in both rooms. A piece with no image has nothing to inspect.
 */
export function studioInspectItem(p: StudioPiece): InspectItem | null {
  const src = p.cover ?? p.logo;
  if (!src) return null;
  return {
    slug: p.slug,
    title: p.title,
    src,
    fit: p.cover ? "cover" : "contain",
    kind: studioKindLabel[p.kind],
    status: p.status === "client" ? "Client work" : "Independent",
    brief: p.brief,
    note: p.note,
    industry: p.industry,
    links: [
      ...(p.site ? [{ label: "Visit the live site", href: p.site }] : []),
      ...(p.behance ? [{ label: "Open on Behance", href: p.behance }] : []),
    ],
  };
}

export function isInspectable(x: InspectItem | null): x is InspectItem {
  return x !== null;
}
