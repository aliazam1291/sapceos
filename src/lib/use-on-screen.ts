"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Is this element near the viewport? One IntersectionObserver, a boolean.
 *
 * For pausing decorative loops (2026-09-20). A CSS animation ticks on the
 * main thread for as long as it runs, on screen or not — the robot's two
 * thruster jets alone dirtied layout four times a frame for the whole home
 * page (tools/layout-uat.mjs: 1,508 layout invalidations in one scroll,
 * with the robot in view for a tenth of it). `content-visibility: auto`
 * covers `.flies` rows; this is for the objects that are not in one. Pair
 * it with `data-off` on the element and `animation-play-state: paused`.
 *
 * `margin` is the observer's rootMargin — generous, so a loop is already
 * running when the object scrolls in.
 */
export function useOnScreen(ref: RefObject<Element | null>, margin = "40% 0px"): boolean {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOn(entry.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return on;
}
