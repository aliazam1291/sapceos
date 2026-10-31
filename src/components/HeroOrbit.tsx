"use client";

import { useRef } from "react";
import type { SkillCount } from "@/content/portfolio";
import { useOnScreen } from "@/lib/use-on-screen";
import styles from "./PortfolioHero.module.scss";

/**
 * The skills on an orbit around the portrait. CSS only, compositor-only:
 * a flattened wrapper (scaleY) holds a ring that turns (rotate); each skill
 * sits on the ring and turns back the other way (the individual `rotate`
 * property, so its own static angle can live in `transform` and no var()
 * goes into a keyframe). Two copies — the back one under the photo, the
 * front one over it clipped to the near half — so a skill passes behind his
 * head and in front of his chest. Paused off screen and under reduced
 * motion. Decorative: the same skills are listed in the copy.
 *
 * Each skill's angle is `--i` of `--n` in CSS, so a phone can carry fewer
 * (the stylesheet lowers `--n` and hides the rest) and still space them
 * evenly.
 */
export default function HeroOrbit({ layer, skills }: { layer: "back" | "front"; skills: SkillCount[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const on = useOnScreen(ref, "0px");
  return (
    <div
      ref={ref}
      className={styles.orbit}
      data-layer={layer}
      data-off={on ? undefined : ""}
      style={{ "--count": skills.length } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className={styles.flat}>
        <div className={styles.ring}>
          {skills.map((s, i) => (
            <span key={s.name} className={styles.satellite} style={{ "--i": i } as React.CSSProperties}>
              <span className={styles.chip}>
                {s.name}
                <b>{s.count}</b>
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
