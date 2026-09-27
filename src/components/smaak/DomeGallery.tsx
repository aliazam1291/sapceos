"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gallery } from "@/content/gallery";
import styles from "./DomeGallery.module.scss";

const DomeGalleryScene = dynamic(() => import("./DomeGalleryScene"), { ssr: false, loading: () => null });

/*
 * The dome, and what it degrades to.
 *
 * Same contract as every scene here: three.js stays out of the first-paint
 * bundle, the canvas mounts near the viewport and after idle, and it pauses
 * off screen. What is different is the fallback — this one carries CONTENT,
 * not decoration, so the grid underneath is not a placeholder. Under reduced
 * motion, without JS, or on a device that never mounts the canvas, the work
 * is still all there as a plain responsive grid of links. The dome is the
 * nicer way to see it, never the only way.
 *
 * The caption is HTML rather than in-scene text: a label that has to be
 * legible is not a job for a texture.
 */
export default function DomeGallery() {
  const host = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (!entry.isIntersecting) return;
        if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => setMounted(true), { timeout: 2000 });
        else window.setTimeout(() => setMounted(true), 600);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const item = active === null ? null : gallery[active];

  return (
    <div className={styles.wrap}>
      <div ref={host} className={styles.dome} data-live={mounted || undefined}>
        {mounted ? <DomeGalleryScene items={gallery} paused={!visible} onActive={setActive} /> : null}

        {mounted ? (
          <>
            <p className={styles.hint} aria-hidden="true">
              Drag to look around · click to open
            </p>
            <p className={styles.caption} data-on={item ? "" : undefined} aria-live="polite">
              {item ? (
                <>
                  <span className={styles.captionTitle}>{item.title}</span>
                  <span className={styles.captionKind}>{item.kind}</span>
                </>
              ) : null}
            </p>
          </>
        ) : null}
      </div>

      {/* The work, as markup. Always in the DOM — this is how the gallery is
          crawled, and how it reads with the canvas absent. */}
      <ul className={styles.grid} data-behind={mounted || undefined}>
        {gallery.map((g) => (
          <li key={g.texture} className={styles.cell}>
            {g.href ? (
              <a href={g.href} target="_blank" rel="noreferrer noopener" className={styles.cellLink}>
                <GalleryFigure item={g} />
              </a>
            ) : (
              <GalleryFigure item={g} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GalleryFigure({ item }: { item: (typeof gallery)[number] }) {
  return (
    <figure className={styles.figure}>
      <Image src={item.texture} alt={`${item.title} — ${item.kind}`} width={640} height={400} className={styles.img} loading="lazy" sizes="(max-width: 700px) 45vw, 260px" />
      <figcaption className={styles.figCaption}>
        <span className={styles.figTitle}>{item.title}</span>
        <span className={styles.figKind}>{item.kind}</span>
      </figcaption>
    </figure>
  );
}
