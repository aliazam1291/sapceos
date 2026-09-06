import type Lenis from "lenis";

/**
 * Module-level handle on the single Lenis instance, so components that need to
 * drive the scroll (in-page jumps, locking behind the mobile menu) go through
 * Lenis rather than fighting it with native scrolling.
 *
 * Null whenever smooth scroll is off — reduced motion, or before hydration.
 * Every helper below is a no-op in that case, and callers fall back to native.
 */
let instance: Lenis | null = null;

export function setLenis(next: Lenis | null) {
  instance = next;
}

export function getLenis() {
  return instance;
}

/** Scroll to an element by id. Returns false if Lenis is not driving. */
export function scrollToId(id: string, offset = -80) {
  const el = document.getElementById(id);
  if (!el) return true;

  if (instance) {
    instance.scrollTo(el, { offset });
    return true;
  }

  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

/** Freeze/thaw the page behind an overlay. */
export function lockScroll(locked: boolean) {
  if (!instance) return;
  if (locked) instance.stop();
  else instance.start();
}
