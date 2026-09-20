"use client";

import { useEffect } from "react";
import { spaceSound, type Sfx } from "@/lib/spaceSound";

/**
 * Routes the page's events into the sound engine (lib/spaceSound.ts).
 *
 * Mounted once in the layout. Nothing here plays unless the reader has
 * turned sound on (SoundToggle, or the launch screen); with the preference
 * saved "on" from a previous visit, the first gesture on the page — a
 * pointer down or a key — starts the audio context, because browsers will
 * not start one without a gesture.
 *
 * What it listens for:
 *   space:sfx      { detail: Sfx }   one-shots from any component
 *   space:warp                      a route change → the warp sweep
 *   space:palette                   mission control opening
 *   pointerover on a/button          a tick, throttled to one per 70 ms
 *   visibilitychange                 resume after a tab switch
 */
export default function SoundSystem() {
  useEffect(() => {
    const onSfx = (e: Event) => spaceSound.sfx((e as CustomEvent<Sfx>).detail);
    const onWarp = () => spaceSound.sfx("warp");
    const onPalette = () => spaceSound.sfx("open");
    let lastTick = 0;
    const onOver = (e: PointerEvent) => {
      if (!spaceSound.isOn()) return;
      const t = e.target as Element | null;
      if (!t?.closest?.("a, button, [role=option], [data-bay]")) return;
      const now = performance.now();
      if (now - lastTick < 70) return;
      lastTick = now;
      spaceSound.sfx("tick");
    };
    const onVis = () => spaceSound.resume();

    // A saved "on" arms itself on the first gesture.
    const arm = () => {
      if (spaceSound.savedPreference() === true && !spaceSound.isOn()) {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!reduced) spaceSound.enable(true);
      }
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };
    window.addEventListener("pointerdown", arm);
    window.addEventListener("keydown", arm);

    window.addEventListener("space:sfx", onSfx);
    window.addEventListener("space:warp", onWarp);
    window.addEventListener("space:palette", onPalette);
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
      window.removeEventListener("space:sfx", onSfx);
      window.removeEventListener("space:warp", onWarp);
      window.removeEventListener("space:palette", onPalette);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return null;
}
