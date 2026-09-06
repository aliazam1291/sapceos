import { profile } from "@/content/profile";
import styles from "./OrbitalPortrait.module.scss";

/** CSS-built depth instead of a canvas: no GPU render loop. */
export default function OrbitalPortrait() {
  return (
    <aside className={styles.panel} aria-label="Operator profile">
      <div className={styles.art} aria-hidden="true">
        <span className={`${styles.orbit} ${styles.orbitOne}`} />
        <span className={`${styles.orbit} ${styles.orbitTwo}`} />
        <span className={styles.sphere}><i /></span>
        <span className={styles.satellite} />
      </div>

      <div className={styles.caption}>
        <span>Operator / 01</span>
        <span className={styles.live}><i /> Available for a good problem</span>
      </div>

      <dl className={styles.readout}>
        <div><dt>Operator</dt><dd>{profile.name}</dd></div>
        <div><dt>Current role</dt><dd>{profile.currentRole}</dd></div>
        <div><dt>Base</dt><dd>{profile.location}</dd></div>
      </dl>
    </aside>
  );
}
