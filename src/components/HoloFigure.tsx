"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { perf } from "@/lib/perf";

const HoloPortraitScene = dynamic(() => import("./space/HoloPortraitScene"), { ssr: false, loading: () => null });

/** What the readout hears while the skills install (HoloReadout). */
export type HoloInstall = { installed: number; total: number; done: boolean };

/**
 * The landing's figure, alive (2026-10-31). The avatar under it is the first
 * paint and the whole figure without WebGL or motion.
 *
 * The download: mounts near the viewport and after idle, never under reduced
 * motion or on a software rasteriser, and plays only once the reader can
 * see it — not behind the launch screen. Then it raises `data-holo="live"`
 * (CSS hides the avatar) and puts the figure into `data-install`: the
 * orbit's skills hide, and as the scan climbs through the hologram
 * `--installed` counts them back in while `holo:install` tells the readout.
 * Installed, it raises `"resolved"`: the avatar comes back over the points
 * and the canvas stops drawing for good — one sequence, then the image.
 *
 * Between times the figure answers the pointer (`--tx`/`--ty`, a small 3D
 * tilt in CSS) and floats; `data-off` pauses the float off screen.
 * Ali: "a 3D animated image, downloading skills."
 */
export default function HoloFigure({ src, total, className }: { src: string; total: number; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [booting, setBooting] = useState(true);
  const [phase, setPhase] = useState<"idle" | "live" | "resolved">("idle");
  const [stopped, setStopped] = useState(false);
  const installed = useRef(-1);
  const finished = useRef(false);

  useEffect(() => {
    const el = host.current;
    const figure = el?.parentElement;
    if (!el || !figure) return;
    const run = !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !perf.software;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) figure.removeAttribute("data-off");
        else figure.setAttribute("data-off", "");
        if (!entry.isIntersecting || !run) return;
        if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => setMounted(true), { timeout: 1500 });
        else window.setTimeout(() => setMounted(true), 500);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);

    // The pointer, written once a frame at most: the tilt (`--tx`/`--ty`,
    // the pointer's place on screen; mouse only, and only with motion) and
    // the peek under the helmet (`--mx`/`--my`, its place on the figure;
    // `data-peek` while a mouse is over the figure, or from a tap on it until a
    // tap elsewhere).
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let mx = 0;
    let my = 0;
    let peek = false;
    let finger = false;
    const flush = () => {
      raf = 0;
      if (run) {
        figure.style.setProperty("--tx", tx.toFixed(3));
        figure.style.setProperty("--ty", ty.toFixed(3));
      }
      figure.style.setProperty("--mx", `${mx.toFixed(1)}px`);
      figure.style.setProperty("--my", `${my.toFixed(1)}px`);
      if (peek) figure.setAttribute("data-peek", "");
      else figure.removeAttribute("data-peek");
    };
    const place = (e: PointerEvent) => {
      const r = figure.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      return mx >= 0 && my >= 0 && mx <= r.width && my <= r.height;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        tx = (e.clientX / window.innerWidth - 0.5) * 2;
        ty = (e.clientY / window.innerHeight - 0.5) * 2;
        peek = place(e);
      } else if (finger) {
        place(e);
      } else return;
      schedule();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      finger = place(e);
      peek = finger;
      schedule();
    };
    // A tap leaves the window open where it landed (a finger cannot hover,
    // and holding still is a scroll waiting to happen); a tap off the figure
    // closes it.
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      finger = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setBooting(root.hasAttribute("data-booting"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["data-booting"] });
    return () => mo.disconnect();
  }, []);

  const onLive = useCallback(() => {
    setPhase("live");
    host.current?.parentElement?.setAttribute("data-install", "");
  }, []);

  // Skill i installs when the scan is (i + 1) / (total + 1) of the way up.
  const onProgress = useCallback(
    (k: number) => {
      const n = k >= 1 ? total : Math.min(total, Math.floor(k * (total + 1)));
      const done = k >= 1;
      if (n === installed.current && done === finished.current) return;
      installed.current = n;
      finished.current = done;
      host.current?.parentElement?.style.setProperty("--installed", String(n));
      const detail: HoloInstall = { installed: n, total, done };
      window.dispatchEvent(new CustomEvent("holo:install", { detail }));
    },
    [total],
  );

  // Resolved: the avatar fades back over the points (1.2 s), then the
  // canvas stops — nothing left to draw.
  const onResolved = useCallback(() => {
    setPhase("resolved");
    window.setTimeout(() => setStopped(true), 1400);
  }, []);

  return (
    <div ref={host} className={className} data-holo={phase === "idle" ? undefined : phase} aria-hidden="true">
      {mounted ? (
        <HoloPortraitScene
          src={src}
          go={visible && !booting}
          paused={!visible || stopped}
          onLive={onLive}
          onProgress={onProgress}
          onResolved={onResolved}
        />
      ) : null}
    </div>
  );
}
