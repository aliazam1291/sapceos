"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";

/*
 * Custom events for Vercel Analytics (2026-09-20). Pageviews say who came;
 * these say what they did: downloaded the résumé, opened the palette,
 * clicked out to a channel (mail, Calendly, LinkedIn, GitHub, DumbMoney),
 * and — on the home page — which legs they actually reached. One event per
 * leg per pageview, by IntersectionObserver on every `[data-section]`.
 * No cookies, no identifiers; the footer's "no cookies on board" holds.
 */
export default function Telemetry() {
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (/\.pdf($|\?)/i.test(href)) track("resume_download", { from: pathname });
      else if (href.startsWith("mailto:")) track("channel", { via: "email", from: pathname });
      else if (/calendly\.com/.test(href)) track("channel", { via: "calendly", from: pathname });
      else if (/linkedin\.com/.test(href)) track("channel", { via: "linkedin", from: pathname });
      else if (/github\.com/.test(href)) track("channel", { via: "github", from: pathname });
      else if (/dumbmoney\.in/.test(href)) track("channel", { via: "dumbmoney", from: pathname });
    };
    document.addEventListener("click", onClick, { capture: true });
    // The palette announces itself with a sound cue; that is the open signal.
    const onSfx = (e: Event) => {
      if ((e as CustomEvent<string>).detail === "open") track("palette_open", { from: pathname });
    };
    window.addEventListener("space:sfx", onSfx);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("space:sfx", onSfx);
    };
  }, [pathname]);

  // Home: which legs a reader reaches. Fires once per leg per pageview.
  useEffect(() => {
    if (pathname !== "/") return;
    const seen = new Set<string>();
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const id = (en.target as HTMLElement).id || (en.target as HTMLElement).dataset.section || "";
          if (en.isIntersecting && id && !seen.has(id)) {
            seen.add(id);
            track("leg_reached", { leg: id });
          }
        }
      },
      { threshold: 0.35 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
