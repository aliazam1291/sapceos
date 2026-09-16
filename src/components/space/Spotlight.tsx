"use client";

import { cn } from "@/lib/cn";

/**
 * Aceternity's spotlight, rebuilt on a CSS gradient.
 *
 * The original is an SVG ellipse behind a `stdDeviation="151"` Gaussian blur.
 * That rasterises a ~3800x2800 surface and re-blurs it on resize, which is a
 * real cost for a decorative wash. A radial-gradient composites on the GPU and
 * is visually indistinguishable at this softness.
 */
export default function Spotlight({
  className,
  from = "rgba(52, 211, 153,0.16)",
}: {
  className?: string;
  from?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -z-[1] blur-[2px]",
        "[animation:spotlight_2.6s_cubic-bezier(0.22,1,0.36,1)_0.3s_1_both]",
        className,
      )}
      style={{
        background: `radial-gradient(closest-side, ${from}, transparent 72%)`,
      }}
    />
  );
}
