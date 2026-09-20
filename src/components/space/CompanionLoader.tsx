"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/*
 * Keeps three.js out of the first-paint bundle.
 *
 * `Companion` imports three, @react-three/fiber and the ship model
 * statically, and it used to be imported statically from the root layout —
 * so the 230 KiB three chunk was on the critical path of every route,
 * ahead of the page's own text (Lighthouse, 2026-09-19: three's chunk was
 * the top "bootup time" script on /missions, /about, every report). Every
 * other scene on the site is already behind `next/dynamic`; this was the
 * one that was not.
 *
 * The ship is never on the critical path: it arrives once the page has
 * painted and the main thread has gone quiet (`requestIdleCallback`, or a
 * short timer where that does not exist). Companion's own entrance flight
 * makes the late arrival read as the ship catching up, not as a pop-in.
 */
const Companion = dynamic(() => import("./Companion"), { ssr: false });

export default function CompanionLoader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idle = 0;
    let timer = 0;
    let mo: MutationObserver | undefined;
    const html = document.documentElement;
    // The launch screen covers the page and has its own ship on the pad; a
    // second one behind it is a canvas nobody can see. Wait for the pad to
    // clear, then arrive — the entrance flight starts as the overlay lifts.
    const go = () => {
      if (!html.hasAttribute("data-booting")) {
        setReady(true);
        return;
      }
      mo = new MutationObserver(() => {
        if (!html.hasAttribute("data-booting")) {
          mo?.disconnect();
          setReady(true);
        }
      });
      mo.observe(html, { attributes: true, attributeFilter: ["data-booting"] });
    };
    if (w.requestIdleCallback) idle = w.requestIdleCallback(go, { timeout: 1500 });
    else timer = window.setTimeout(go, 900);
    return () => {
      if (idle) w.cancelIdleCallback?.(idle);
      if (timer) window.clearTimeout(timer);
      mo?.disconnect();
    };
  }, []);

  return ready ? <Companion /> : null;
}
