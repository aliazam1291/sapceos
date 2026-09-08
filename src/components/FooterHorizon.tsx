"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { ui } from "./ui";

const HorizonScene = dynamic(() => import("@/components/space/HorizonScene"), {
  ssr: false,
  loading: () => null,
});

/**
 * Mounts the footer's horizon only once the footer is actually approaching.
 *
 * The footer sits at the bottom of every route, so importing three.js from it
 * unconditionally would pull the 3D bundle into every page — including ones
 * that have no other 3D at all, like /contact. An IntersectionObserver with a
 * generous margin means the chunk is fetched while the reader is still a
 * screen away, so it is ready by the time they arrive but never competes with
 * the page they came for.
 *
 * Once mounted it stays mounted: tearing the scene down on scroll-up would
 * drop and recreate a WebGL context repeatedly. `useSceneFrameloop` inside the
 * scene already stops the loop when it leaves the viewport, which is the part
 * that actually costs anything.
 */
export default function FooterHorizon() {
  const ref = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /*
     * Now mounts on touch too, at a reduced budget.
     *
     * This used to skip coarse pointers outright, on the reasoning that the
     * footer rides on every route — including text-only ones like /contact —
     * so 245kb and a WebGL context felt like a lot to spend on decoration.
     * The cost is real but bounded: `useSceneFrameloop` inside the scene
     * already pauses the render loop the moment it leaves the viewport, and
     * `HorizonScene` itself halves the grid density and drops to dpr 1 on a
     * coarse pointer (see SEG_X_COARSE/SEG_Z_COARSE). What tipped this back
     * on: the pointer interactivity this scene offers was previously
     * unavailable on touch entirely, on the one input class where "tap to
     * see it respond" is the most natural gesture there is.
     */
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMount(true);
          io.disconnect();
        }
      },
      { rootMargin: "60% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={ui.footerHorizon} data-horizon aria-hidden="true">
      {mount ? <HorizonScene /> : null}
    </div>
  );
}
