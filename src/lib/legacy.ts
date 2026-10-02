import { NextResponse } from "next/server";
import { missions } from "@/content/missions";
import { fieldNotes } from "@/content/field-notes";
import { hostedWriting, isLive } from "@/content/writing";

/*
 * Old URLs, sent where the piece lives now (2026-10-02).
 *
 * The pre-Space-OS site published case studies at /case-studies/<slug>, and
 * one of those (uber-driver-retention) is still what Google has indexed. The
 * old blanket rule sent every /case-studies, /work and /projects slug to
 * /missions/<slug> and every /blog slug to /field-notes/<slug> — but case
 * studies are field notes now and essays live under /writing, so most of
 * those landed on a 404. This looks the slug up and answers in one hop.
 * An unknown slug goes to the section's index rather than a dead end.
 */
function targetFor(slug: string) {
  if (missions.some((m) => m.slug === slug)) return `/missions/${slug}`;
  if (fieldNotes.some((f) => f.slug === slug)) return `/field-notes/${slug}`;
  if (hostedWriting.some((p) => p.slug === slug && isLive(p))) return `/writing/${slug}`;
  return null;
}

export function legacyRedirect(fallback: string) {
  return async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return NextResponse.redirect(new URL(targetFor(slug) ?? fallback, req.url), 308);
  };
}
