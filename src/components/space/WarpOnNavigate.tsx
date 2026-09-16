"use client";

import { useEffect } from "react";

/**
 * Fires `space:warp` when an internal link is followed, so the star field
 * (DeepSpace) bursts forward as the route changes. One document-level
 * listener instead of touching every Link on the site. Ignores modified
 * clicks (new tab), external links, hash jumps and the current page.
 */
export default function WarpOnNavigate() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank") return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return;
      window.dispatchEvent(new Event("space:warp"));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
