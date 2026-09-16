"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import styles from "./GalaxyNavigator.module.scss";

const DynamicInteractiveGalaxy = dynamic(() => import("@/components/space/InteractiveGalaxy"), {
  ssr: false,
  loading: () => null,
});

/**
 * The hero's galaxy stage, gated so it never competes with the headline.
 *
 * `next/dynamic` keeps three.js out of the first-paint bundle, but it starts
 * fetching the chunk the moment this component renders — which is hydration,
 * which is exactly when the text is trying to paint. Measured on the production
 * build: the 231kb 3D chunk was requested at 872ms and LCP landed at 1084ms, so
 * a quarter of a megabyte was in flight against the one element that has to be
 * fast. DESIGN_DIRECTION.md asks for the scenes to be "gated behind idle and/or
 * intersection"; the dynamic import alone is not that gate.
 *
 * Waiting for an idle callback moves the request after first paint. The timeout
 * is the floor: on a busy main thread idle may never come, and the stage should
 * still arrive rather than never loading at all.
 */
export default function GalaxyNavigator({
  flightTo = null,
  flightControlled = false,
}: {
  flightTo?: string | null;
  flightControlled?: boolean;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const idle = typeof window.requestIdleCallback === "function";
    const id = idle
      ? window.requestIdleCallback(() => setReady(true), { timeout: 2000 })
      : window.setTimeout(() => setReady(true), 700);

    return () => {
      if (idle) window.cancelIdleCallback(id as number);
      else window.clearTimeout(id as number);
    };
  }, []);

  // No fullscreen toggle here: this is the hero preview, and the nav already
  // carries a dedicated "Galaxy 3D" route for the full-page experience.
  if (!ready) return <div className={styles.shell} aria-hidden="true" />;

  return (
    <DynamicInteractiveGalaxy
      embedded
      allowFullscreen={false}
      flightTo={flightTo}
      flightControlled={flightControlled}
    />
  );
}
