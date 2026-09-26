"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import styles from "./SmaakPlanet.module.scss";

const SmaakPlanetScene = dynamic(() => import("./SmaakPlanetScene"), { ssr: false, loading: () => null });

/*
 * The studio's signature object, on the same contract as every other scene
 * here (PageForm, Satellite): three.js stays out of the first-paint bundle,
 * the canvas mounts only once it is near the viewport AND the browser has
 * gone idle, it never mounts at all under reduced motion, and it pauses when
 * it scrolls away. The label is the text alternative — the page reads
 * completely without it.
 */
export default function SmaakPlanet({ label, className }: { label: string; className?: string }) {
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
    <div ref={host} className={`${styles.stage} ${className ?? ""}`} role="img" aria-label={label}>
      {mounted ? <SmaakPlanetScene paused={!visible} /> : null}
    </div>
  );
}
