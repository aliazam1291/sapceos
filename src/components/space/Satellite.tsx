"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import styles from "./PageForm.module.scss";

const SatelliteScene = dynamic(() => import("./SatelliteScene"), { ssr: false, loading: () => null });

/**
 * The relay, as a page's signature object (2026-09-20).
 *
 * Same contract as PageForm: mounts near the viewport and after idle, never
 * under reduced motion, pauses off screen, and the label is the text
 * alternative. Photoreal where PageForm's forms are wireframe — this is an
 * object, not an instrument (CLAUDE.md, "photoreal worlds and ships;
 * wireframe instruments").
 */
export default function Satellite({ label, size = 300, className }: { label: string; size?: number; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (!entry.isIntersecting) return;
        if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => setMounted(true), { timeout: 1500 });
        else window.setTimeout(() => setMounted(true), 500);
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={host} className={`${styles.stage} ${className ?? ""}`} style={{ maxWidth: `${size}px` }} role="img" aria-label={label}>
      {mounted ? <SatelliteScene paused={!visible} /> : null}
    </div>
  );
}
