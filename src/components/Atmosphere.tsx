import styles from "./Atmosphere.module.scss";

// A static finish layer. No cursor-following or scroll polling is needed for
// the atmosphere to feel considered.
export default function Atmosphere() {
  return (
    <>
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
    </>
  );
}
