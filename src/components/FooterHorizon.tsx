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
     * Not on phones.
     *
     * This is the footer, so it rides on every route — including text-only
     * pages that otherwise never touch three.js. On a coarse pointer that
     * means spending 245kb and a WebGL context on decoration at the very
     * bottom of the page, against the one performance budget that actually
     * matters here. The star field still sits behind the footer, so it is not
     * bare; it just does not get ground.
     */
    if (window.matchMedia("(pointer: coarse)").matches) return;
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
