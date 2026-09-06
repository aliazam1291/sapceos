"use client";

import { useEffect, useState, type RefObject } from "react";

export type Frameloop = "always" | "demand" | "never";

/**
 * Runs a WebGL scene's loop only while somebody can actually see it.
 *
 * Measured on the production build before this existed: at the bottom of the
 * home page BOTH WebGL canvases were off-screen and the renderer was still
 * issuing ~390 draw calls a second. The hero galaxy never stopped — it rendered
 * at full rate for the whole visit, ten screens above wherever the reader had
 * got to. DESIGN_DIRECTION.md asks for exactly this and nothing implemented it.
 *
 * WHY THIS IS A HOOK AND NOT A COMPONENT INSIDE THE CANVAS
 *
 * The obvious version — a child calling `useThree().set({ frameloop: 'never' })`
 * — does not hold. `<Canvas>` measures itself with `useMeasure({ scroll: true })`
 * and re-runs `root.configure({ frameloop, ... })` whenever that measurement
 * changes. Scrolling changes it. So the canvas re-applies its `frameloop` PROP
 * every time the page scrolls, silently resurrecting a loop that was just put to
 * sleep — and scrolling is precisely when a scene goes off-screen, so the reset
 * always landed immediately after the pause. It tested as "the pause does
 * nothing" while the observer was firing perfectly.
 *
 * Driving the prop instead means React and R3F agree on one value.
 *
 *   const canvas = useRef<HTMLCanvasElement>(null);
 *   const frameloop = useSceneFrameloop(canvas);
 *   <Canvas ref={canvas} frameloop={frameloop}>
 *
 * `<Canvas ref>` forwards to the canvas element itself, so no wrapper is needed.
 * Reduced motion is folded in here as well, so there is exactly one place that
 * decides whether a given scene is allowed to run.
 */
export function useSceneFrameloop(
  ref: RefObject<HTMLElement | null>,
  /** How far outside the viewport still counts as visible. */
  margin = "20% 0px",
): Frameloop {
  // Starts "always" so the scene paints immediately on mount; the observer
  // corrects it on its first callback, which fires synchronously after observe.
  const [frameloop, setFrameloop] = useState<Frameloop>("always");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = true;

    const apply = () => {
      if (!onScreen || document.hidden) setFrameloop("never");
      // A genuinely different build, not a slowed-down one: "demand" renders
      // the scene once and then holds still.
      else if (reduced.matches) setFrameloop("demand");
      else setFrameloop("always");
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        apply();
      },
      { rootMargin: margin },
    );
    io.observe(el);

    document.addEventListener("visibilitychange", apply);
    reduced.addEventListener("change", apply);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", apply);
      reduced.removeEventListener("change", apply);
    };
  }, [ref, margin]);

  return frameloop;
}
