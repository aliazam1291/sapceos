"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Shared shell for every 3D scene on the site.
 *
 * Guarantees, in one place, that a canvas:
 *  - never renders server-side, so text stays the LCP element,
 *  - only mounts once the browser is idle AND the element is near the viewport,
 *  - carries a text alternative, since WebGL is invisible to crawlers and AT,
 *  - stops rendering entirely when scrolled out of view.
 */
export default function Scene3D({
  label,
  children,
  className,
  rootMargin = "250px",
}: {
  label: string;
  children: ReactNode;
  className?: string;
  rootMargin?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={host} className={className} role="img" aria-label={label}>
      {mounted ? (
        <div style={{ position: "absolute", inset: 0 }} data-visible={visible}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** Pauses a canvas' render loop while it is off-screen. */
export function useOnScreenFrameloop(visible: boolean) {
  return visible ? ("always" as const) : ("never" as const);
}
