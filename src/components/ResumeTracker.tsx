"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

/**
 * Counts résumé opens as a Vercel Analytics custom event (2026-10-28 review:
 * "track résumé downloads, so you know whether recruiters visit at all").
 * One delegated listener instead of an onClick on each of the dozen résumé
 * links, so a new link is counted without anyone remembering to wire it.
 * `from` is the page the reader was on, which says which page sold it.
 * No-op off Vercel, like the <Analytics /> it reports through.
 */
export default function ResumeTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href$='.pdf']");
      if (!a) return;
      track("Resume open", { from: window.location.pathname });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
