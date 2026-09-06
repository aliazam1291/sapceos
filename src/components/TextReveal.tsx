"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Line-masked text reveal, built on GSAP SplitText.
 *
 * The element renders as ordinary text server-side and is fully visible with
 * no JS — SplitText only takes over once motion is allowed, so this can never
 * leave a heading invisible the way an opacity-0-until-JS approach can.
 *
 * `autoSplit` re-splits on resize and after webfonts load, which matters: a
 * split measured against the fallback font produces line breaks that are wrong
 * the moment Geist swaps in. `aria: "auto"` keeps the original string exposed
 * to screen readers rather than a pile of per-line divs.
 */
export default function TextReveal({
  as: Tag = "span",
  children,
  className,
  delay = 0,
  stagger = 0.08,
  start = "top 88%",
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  start?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let split: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { SplitText }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/SplitText"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || !ref.current) return;

      gsap.registerPlugin(SplitText, ScrollTrigger);

      split = SplitText.create(ref.current, {
        type: "lines",
        // Wraps every line in its own overflow-hidden element, so lines rise
        // out from behind a clean edge instead of just fading.
        mask: "lines",
        autoSplit: true,
        aria: "auto",
        // Returning the tween lets GSAP swap it out cleanly on each re-split.
        onSplit: (self: { lines: Element[] }) =>
          gsap.from(self.lines, {
            yPercent: 115,
            duration: 0.95,
            ease: "power3.out",
            stagger,
            delay,
            scrollTrigger: { trigger: ref.current as Element, start, once: true },
          }),
      });
    })();

    return () => {
      cancelled = true;
      split?.revert();
    };
  }, [delay, stagger, start]);

  // TypeScript can't resolve JSX props through a generic `ElementType` (they
  // collapse to `never`), so pin it to one concrete intrinsic tag for type
  // purposes. `ref`/`className`/`children` are identical across every tag this
  // accepts, and the real tag name is still whatever the caller passed.
  const Component = Tag as "h1";

  return (
    <Component ref={ref as React.RefObject<HTMLHeadingElement>} className={className}>
      {children}
    </Component>
  );
}
