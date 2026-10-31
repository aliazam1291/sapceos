"use client";

import Image from "next/image";
import { useRef } from "react";
import type { Build } from "@/content/building";
import styles from "./Building.module.scss";

/**
 * One live site in a browser window (2026-10-31). At rest it is the site
 * in the theme's monochrome — the hologram treatment, muted, on a screen
 * with scanlines (Ali: "something on what I am building — monochromatic
 * mask"); pointing at it opens a lens of true colour under the pointer
 * (`--lx`/`--ly` and `data-lens` on the screen, the radius a registered
 * length that eases open), the window turns flat and the page scrolls
 * through it. A phone, with no pointer to follow, resolves to colour as
 * the window crosses the middle of the screen (CSS, scroll-driven).
 */
export default function PreviewWindow({ build }: { build: Build }) {
  const screen = useRef<HTMLSpanElement>(null);

  const move = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = screen.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty("--lx", `${x.toFixed(1)}px`);
    el.style.setProperty("--ly", `${y.toFixed(1)}px`);
    if (x >= 0 && y >= 0 && x <= r.width && y <= r.height) el.setAttribute("data-lens", "");
    else el.removeAttribute("data-lens");
  };
  const leave = () => screen.current?.removeAttribute("data-lens");

  return (
    <a
      href={build.url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.window}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {/* Named by this, not an aria-label that would have to repeat the
          visible address and hint (WCAG 2.5.3). */}
      <span className="visually-hidden">{`${build.name}, the live site at ${build.host} (opens in a new tab)`}</span>
      <span className={styles.bar} aria-hidden="true">
        <i />
        <i />
        <i />
        <span className={styles.url}>{build.host}</span>
        <span className={styles.tag}>Point for true colour</span>
      </span>
      <span ref={screen} className={styles.viewport}>
        {/* The monochrome screen: the capture in luminance, multiplied onto
            a muted emerald, under scanlines. */}
        <span className={styles.mono}>
          <Image src={build.shot} alt="" width={960} height={2100} sizes="(max-width: 900px) 92vw, 44vw" className={styles.shot} />
        </span>
        {/* True colour, seen only through the lens (or mid-screen on a phone). */}
        <span className={styles.color}>
          <Image src={build.shot} alt="" width={960} height={2100} sizes="(max-width: 900px) 92vw, 44vw" className={styles.shot} />
        </span>
        <span className={styles.ring} />
      </span>
    </a>
  );
}
