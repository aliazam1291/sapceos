"use client";

import { useEffect, useRef } from "react";

/*
 * Marks the nearest section `data-arrived` once the reader has actually
 * reached it, so CSS can run a timed sequence — things that fly in one
 * after another regardless of how fast they scrolled. Fires once.
 *
 * "Actually reached" matters: pinned sections above insert their spacers
 * a beat after load, and for one frame a section far down the page can sit
 * in the viewport before the layout jumps. An observer that fires on that
 * frame runs the whole sequence off-screen and the reader sees nothing.
 * So an intersection only *proposes* arrival; it is confirmed 350ms later
 * by measuring the box against the viewport again.
 */
export function confirmInView(el: HTMLElement, ratio: number) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
  return visible / Math.min(r.height, vh) >= ratio;
}

export default function ArrivalGate({ threshold = 0.35, host: hostKind = "section" }: { threshold?: number; host?: "section" | "parent" }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const host = (hostKind === "parent" ? el.parentElement : (el.closest("section") ?? el.parentElement)) as HTMLElement | null;
    if (!host) return;
    let timer = 0;
    let done = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (done) return;
        if (!entry.isIntersecting) {
          window.clearTimeout(timer);
          return;
        }
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          if (done || !confirmInView(host, threshold)) return;
          done = true;
          host.setAttribute("data-arrived", "");
          io.disconnect();
        }, 350);
      },
      { threshold },
    );
    io.observe(host);
    return () => {
      window.clearTimeout(timer);
      io.disconnect();
    };
  }, [threshold, hostKind]);
  return <span ref={ref} hidden />;
}
