"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Tool } from "@/content/toolkit";
import { perf } from "@/lib/perf";
import styles from "./Toolkit.module.scss";

const ToolLogosScene = dynamic(() => import("./space/ToolLogosScene"), { ssr: false, loading: () => null });

/**
 * The shelf: one canvas of five 3D logos over five labelled columns. The
 * labels are the content (server-rendered, what a crawler and a screen
 * reader get); the logos arrive over them once the reader is here, and
 * pointing at either a logo's column or its label lifts that logo.
 * No canvas under reduced motion or on a software rasteriser — the labels
 * carry a flat mark instead.
 */
export default function ToolShelf({ tools }: { tools: Tool[] }) {
  const host = useRef<HTMLDivElement>(null);
  const hover = useRef(-1);
  const [mounted, setMounted] = useState(false);
  const [go, setGo] = useState(false);
  const [lit, setLit] = useState(-1);

  useEffect(() => {
    const el = host.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || perf.software) return;
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        near.disconnect();
        if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => setMounted(true), { timeout: 1500 });
        else window.setTimeout(() => setMounted(true), 400);
      },
      { rootMargin: "400px" },
    );
    near.observe(el);
    // Arrival: most of the shelf on screen, confirmed a beat later.
    let timer = 0;
    const here = new IntersectionObserver(
      ([e]) => {
        window.clearTimeout(timer);
        if (e.isIntersecting && !document.documentElement.hasAttribute("data-booting")) timer = window.setTimeout(() => setGo(true), 350);
      },
      { threshold: 0.6 },
    );
    here.observe(el);
    return () => {
      near.disconnect();
      here.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  const point = (i: number) => {
    hover.current = i;
    setLit(i);
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.floor(((e.clientX - r.left) / r.width) * tools.length);
    if (i !== hover.current) point(Math.max(0, Math.min(tools.length - 1, i)));
  };

  return (
    <div ref={host} className={styles.shelf} data-live={mounted || undefined}>
      <div className={styles.stage} onPointerMove={onMove} onPointerLeave={() => point(-1)} aria-hidden="true">
        {mounted ? <ToolLogosScene logos={tools.map((t) => t.logo)} hover={hover} go={go} /> : null}
      </div>
      <ul className={styles.tools}>
        {tools.map((t, i) => (
          <li key={t.name} data-on={lit === i || undefined} onPointerEnter={() => point(i)} onPointerLeave={() => point(-1)}>
            <span className={styles.mark} aria-hidden="true" data-logo={t.logo} />
            <span className={styles.name}>{t.name}</span>
            <span className={styles.use}>{t.use}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
