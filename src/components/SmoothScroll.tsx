"use client";

import { useEffect } from "react";
import { setLenis } from "@/lib/lenis";
import { startScrollSignal } from "@/lib/scroll-signal";

/**
 * The one Lenis instance, and the one scroll sampler, for the whole site.
 *
 * `src/lib/lenis.ts` has always exported `setLenis`/`getLenis`/`scrollToId`/
 * `lockScroll` — and `setLenis` was never called anywhere in `src/`. So the
 * handle was permanently null, which made `lockScroll()` a silent no-op and
 * sent every `scrollToId()` in ReportNav and SectionGuide down its native
 * `scrollIntoView` fallback. globals.scss line 15 asserts "Lenis already owns
 * smooth scrolling"; it did not. This is the component that makes that true.
 *
 * Deliberately NOT folded into MotionProvider: that component's own docblock
 * promises "no ticker, smooth-scroll engine, or permanent RAF", and it keeps
 * that promise by using only IntersectionObserver. A permanent rAF belongs in
 * its own file rather than quietly breaking that contract.
 *
 * WHY LENIS IS DRIVEN FROM GSAP'S TICKER
 *
 * The pinned mission sequence uses ScrollTrigger with `scrub`, and scrub reads
 * scroll position on GSAP's tick. If Lenis runs on its own requestAnimationFrame
 * the two clocks drift by up to a frame, and a scrubbed pin driven by a
 * smoothed scroll position that updated on the *other* clock visibly stutters.
 * Handing Lenis the GSAP ticker puts both on one clock. `lagSmoothing(0)`
 * stops GSAP from silently skipping time after a long frame, which would
 * otherwise desync the two again on exactly the slow frames that matter.
 *
 * GSAP is dynamically imported here, not at module scope, so three.js-free
 * routes still do not pull it into the first-paint bundle. It is already
 * loaded on effectively every route anyway — `PageHeader` renders `TextReveal`,
 * which imports it — so this adds a wiring cost, not a payload cost.
 */
export default function SmoothScroll() {
  useEffect(() => {
    // One shared sampler for every scene that reads `signal`. Previously this
    // was started only by InteractiveGalaxy, so the read-model was empty on
    // every route that did not mount the galaxy.
    const stopSignal = startScrollSignal();

    // Reduced motion gets native scrolling: instant, honest, no interpolation.
    // The signal above still runs, so scenes that damp toward it keep working.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return stopSignal;
    }

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [{ default: Lenis }, { gsap }] = await Promise.all([
        import("lenis"),
        import("gsap"),
      ]);
      if (disposed) return;

      const lenis = new Lenis({
        // Long enough to feel like weight, short enough that a reader trying to
        // get to the footer does not feel held back.
        lerp: 0.1,
        wheelMultiplier: 1,
        // Touch is left alone. Native momentum on a phone is better than
        // anything reimplemented on top of it, and smoothing it is the classic
        // way to make a site feel broken on mobile.
        smoothWheel: true,
        syncTouch: false,
      });

      setLenis(lenis);

      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      // ScrollTrigger is registered by the components that use it. Updating it
      // from Lenis's own scroll event keeps pinned/scrubbed sections exact
      // rather than relying on the native scroll event arriving in time.
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (disposed) {
        gsap.ticker.remove(raf);
        lenis.destroy();
        setLenis(null);
        return;
      }
      const update = () => ScrollTrigger.update();
      lenis.on("scroll", update);

      cleanup = () => {
        lenis.off("scroll", update);
        gsap.ticker.remove(raf);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.destroy();
        setLenis(null);
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
      stopSignal();
    };
  }, []);

  return null;
}
