"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import MissionSignature from "./MissionSignature";
import styles from "./Hologram.module.scss";

interface HologramProps {
  /** Cover image to project. Without one, the mission's trace is projected. */
  src?: string;
  seed: string;
  /** Short mono tag drawn on the emitter, e.g. "M-04". */
  tag?: string;
  className?: string;
}

/*
 * A project as a hologram.
 *
 * An emitter plate on the ground throws a cone of light up, and the cover
 * hangs in it as a volumetric plate: emerald-tinted, scanlined, a bright
 * band sweeping through it, flickering the way a projection flickers when
 * the emitter is doing its best. It turns slowly on its own and tilts
 * toward the pointer, so the parallax says "this has depth" before the
 * reader has consciously noticed it.
 *
 * All CSS 3D and gradients; the only JS is the pointer tilt, which writes
 * two custom properties. Reduced motion: it holds still and stops
 * flickering, still a hologram.
 */
export default function Hologram({ src, seed, tag, className }: HologramProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The nearest article is the hover target — the whole row, not just the
    // small plate, so the tilt answers the pointer wherever it is.
    const host = (el.closest("article") ?? el) as HTMLElement;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--tx", `${(-y * 14).toFixed(2)}deg`);
      el.style.setProperty("--ty", `${(x * 22).toFixed(2)}deg`);
    };
    const onLeave = () => {
      el.style.setProperty("--tx", "0deg");
      el.style.setProperty("--ty", "0deg");
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className={`${styles.holo} ${className ?? ""}`} aria-hidden="true">
      <div className={styles.stage}>
        {/* Ghost copies give the projection its chromatic fringe. */}
        <div className={`${styles.plate} ${styles.ghostA}`}>
          {src ? <Image src={src} alt="" fill sizes="260px" className={styles.img} /> : <MissionSignature seed={seed} className={styles.trace} />}
        </div>
        <div className={`${styles.plate} ${styles.ghostB}`}>
          {src ? <Image src={src} alt="" fill sizes="260px" className={styles.img} /> : <MissionSignature seed={seed} className={styles.trace} />}
        </div>
        <div className={styles.plate}>
          {src ? <Image src={src} alt="" fill sizes="260px" className={styles.img} /> : <MissionSignature seed={seed} className={styles.trace} />}
          <span className={styles.scanlines} />
          <span className={styles.sweep} />
          <span className={styles.edge} />
        </div>
      </div>

      <span className={styles.cone} />

      <div className={styles.emitter}>
        <span className={styles.slit} />
        <span className={styles.ring} />
        {tag ? <span className={styles.tag}>{tag}</span> : null}
      </div>
    </div>
  );
}
