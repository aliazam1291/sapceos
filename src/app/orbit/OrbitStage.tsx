"use client";

import PageForm from "@/components/space/PageForm";
/**
 * Kept here rather than imported, because the scene it used to live in is gone.
 *
 * `OrbitScene` was replaced by the `PageForm` treatment below but survived as
 * dead code, reachable only by this type-only import — which is why a search
 * for "is anything still using OrbitScene?" answered no while deleting it would
 * have broken the build. The shape belongs to whatever renders these bodies,
 * and that is this file.
 */
export type OrbitBody = {
  label: string;
  radius: number;
  period: number;
  offset: number;
  tilt: number;
};
import styles from "./orbit.module.scss";

/**
 * Orbit gets the ring station: something built and inhabited, which is the
 * right register for a page about what currently holds attention.
 *
 * The four-body OrbitScene this replaced was another sphere-on-rings — the
 * third on the site — so the page had no identity of its own.
 */
export default function OrbitStage({ bodies }: { bodies: OrbitBody[] }) {
  return (
    <div className={styles.stage} data-reveal>
      <span className={styles.stageLabel}>Live system</span>
      <PageForm
        form="station"
        label={`A rotating wireframe habitation ring with spokes running to a central hub, a band of light sweeping through it. It stands for the topics in orbit: ${bodies
          .map((b) => b.label)
          .join(", ")}.`}
      />
      <span className={styles.stageHint}>Scroll to travel</span>
    </div>
  );
}
