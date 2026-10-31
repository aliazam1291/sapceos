import Link from "next/link";
import { building } from "@/content/building";
import PreviewWindow from "./PreviewWindow";
import styles from "./Building.module.scss";

/**
 * What I'm building (2026-10-31). Ali: "add web preview for WatchSense and
 * DumbMoney." Each product as its live site in a browser window, in the
 * theme's monochrome until looked at (PreviewWindow): pointing at it opens
 * a lens of true colour under the pointer, turns the window flat and
 * scrolls the page through it (a tall capture moved on the compositor);
 * it opens the real site. Under it, his part and the product's own one-line description.
 * Still leg 00 (no `data-section`): it sits between the toolkit and the
 * flight, so the rail still counts eleven.
 */
export default function Building() {
  return (
    <section id="building" className={styles.building} aria-labelledby="building-title">
      <header className={styles.head}>
        <p className={styles.label}>Building now</p>
        <h2 id="building-title" className={styles.title}>
          What I&rsquo;m building
        </h2>
      </header>
      <ul className={styles.list}>
        {building.map((b, i) => (
          <li key={b.name} className={styles.item} data-side={i % 2 ? "right" : "left"}>
            <PreviewWindow build={b} />
            <div className={styles.meta}>
              <p className={styles.role}>{b.role}</p>
              <h3 className={styles.name}>{b.name}</h3>
              <p className={styles.line}>{b.line}</p>
              <p className={styles.links}>
                <a href={b.url} target="_blank" rel="noopener noreferrer">
                  {b.host} <span aria-hidden="true">↗</span>
                </a>
                {b.page ? (
                  <Link href={b.page}>
                    The venture page <span aria-hidden="true">→</span>
                  </Link>
                ) : null}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
