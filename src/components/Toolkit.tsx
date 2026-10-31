import { toolkit } from "@/content/toolkit";
import AceCard from "./AceCard";
import ToolShelf from "./ToolShelf";
import styles from "./Toolkit.module.scss";

/**
 * The toolkit (2026-10-31): the five tools Ali builds with, as 3D logos in
 * space, and beside them the ace — "a jack of all trades … oftentimes better
 * than a master of one", the proverb he works by, which is what a shelf of
 * five different tools says. Right under the landing, before the work.
 * Part of leg 00 (no `data-section`), so the rail still counts eleven.
 */
export default function Toolkit() {
  return (
    <section id="toolkit" className={styles.toolkit} aria-labelledby="toolkit-title">
      <div className={styles.main}>
        <header className={styles.head}>
          <p className={styles.label}>Toolkit</p>
          <h2 id="toolkit-title" className={styles.title}>
            What I build with
          </h2>
        </header>
        <ToolShelf tools={toolkit} />
      </div>
      <AceCard />
    </section>
  );
}
