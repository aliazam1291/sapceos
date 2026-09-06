"use client";

import { useEffect, useState } from "react";
import { sectionSlug as slug } from "@/lib/slug";
import { scrollToId } from "@/lib/lenis";
import styles from "./ReportNav.module.scss";

export function ReportLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.layout}>{children}</div>;
}

/** Tracks which report section is in view and jumps to it on click. */
export default function ReportNav({ labels }: { labels: string[] }) {
  const [active, setActive] = useState(labels[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.getAttribute("data-section") ?? labels[0]);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );

    labels.forEach((label) => {
      const el = document.getElementById(slug(label));
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [labels]);

  return (
    <nav className={styles.nav} aria-label="Report sections">
      {labels.map((label) => (
        <button
          key={label}
          type="button"
          className={`${styles.item} ${active === label ? styles.itemActive : ""}`}
          aria-current={active === label ? "true" : undefined}
          onClick={() => scrollToId(slug(label))}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
