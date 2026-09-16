import styles from "./Ticker.module.scss";

/**
 * A single line of telemetry that runs the width of the page.
 *
 * Every item is a fact from profile.ts, not marketing copy — orgs worked
 * with, the current role, the operating line. Duplicated once so the loop is
 * seamless; `aria-hidden` on the copy so a screen reader hears it once.
 */
export default function Ticker({ items }: { items: string[] }) {
  const line = items.map((item, i) => (
    <span key={i} className={styles.item}>
      {item}
      <span className={styles.sep} aria-hidden="true" />
    </span>
  ));

  return (
    <div className={styles.ticker} role="marquee" aria-label="Telemetry">
      <div className={styles.track}>
        <div className={styles.line}>{line}</div>
        <div className={styles.line} aria-hidden="true">
          {line}
        </div>
      </div>
    </div>
  );
}
