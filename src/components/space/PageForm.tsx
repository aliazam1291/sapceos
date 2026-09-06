"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { FormName } from "./forms";
import styles from "./PageForm.module.scss";

const FormScene = dynamic(() => import("./FormScene"), { ssr: false, loading: () => null });

/**
 * A page's signature object.
 *
 * Mounts only when it is near the viewport AND the browser has gone idle, and
 * never at all under reduced motion — the page must be complete without it.
 * The label is the text alternative, since WebGL is invisible to crawlers and
 * assistive tech alike.
 */
export default function PageForm({
  form,
  label,
  seed,
  size = 320,
  className,
}: {
  form: FormName;
  label: string;
  seed?: string;
  /** Rendered width in px; the stage is square. */
  size?: number;
  className?: string;
}) {
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

        // Near the viewport is necessary but not sufficient — wait for idle so
        // the object never competes with the page's own first paint.
        const supportsIdle = typeof window.requestIdleCallback === "function";
        if (supportsIdle) window.requestIdleCallback(() => setMounted(true), { timeout: 1500 });
        else window.setTimeout(() => setMounted(true), 500);
      },
      { rootMargin: "300px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={host}
      className={`${styles.stage} ${className ?? ""}`}
      style={{ maxWidth: `${size}px` }}
      role="img"
      aria-label={label}
    >
      {mounted ? <FormScene form={form} seed={seed} paused={!visible} /> : null}
    </div>
  );
}
