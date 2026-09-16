import Image from "next/image";
import { studioClients } from "@/content/profile";
import styles from "./ClientGrid.module.scss";

/** The studio's clients as an instrument grid: logo, name, what was made. */
export default function ClientGrid() {
  return (
    <ul className={styles.grid}>
      {studioClients.map((c) => (
        <li key={c.name} className={styles.cell} data-reveal>
          <span className={styles.logo}>
            <Image src={c.logo} alt={`${c.name} logo`} width={120} height={48} className={styles.logoImg} />
          </span>
          <span className={styles.name}>{c.name}</span>
          <span className={styles.work}>{c.work}</span>
        </li>
      ))}
    </ul>
  );
}
