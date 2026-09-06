"use client";

import { useEffect } from "react";
import { printConsoleSignal } from "@/lib/console-signal";

/**
 * One-shot reveals: no ticker, smooth-scroll engine, or permanent RAF.
 *
 * A `[data-reveal]` element starts at opacity:0 (see globals.scss) and is
 * flipped to `is-visible` the first time it scrolls into view. This used to
 * take one `querySelectorAll` snapshot on mount and observe only that batch —
 * fine for plain server-rendered pages, but any element that attaches to the
 * DOM slightly later (a "use client" component like MissionFilter, whose
 * rows depend on a post-hydration render pass) could mount AFTER that
 * snapshot ran, so it never got observed and sat at opacity:0 forever. The
 * mission rows on /missions were invisible on every load for exactly this
 * reason. A MutationObserver keeps watching, so late-mounting content is
 * caught too — not just what happened to exist at the first tick.
 */
export default function MotionProvider() {
  // Once per load, not tied to the reveal system below.
  useEffect(() => {
    printConsoleSignal();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -5%" },
    );

    const observeAll = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => io.observe(el));
    };

    observeAll(document);

    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.hasAttribute("data-reveal")) io.observe(node);
          observeAll(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
