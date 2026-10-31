import type { Dossier } from "@/content/portfolio";
import Counter from "./Counter";
import styles from "./PortfolioDossier.module.scss";

/**
 * The title card on the launch pad (2026-10-31): before the flight starts,
 * the screen says whose portfolio this is — the name, the role and how much
 * work there is, counted. The skills and the degree are on the landing the
 * launch opens onto (PortfolioHero), where there is room for them.
 *
 * Data comes in as props, computed on the server from the content
 * (content/portfolio.ts), so the launch screen's bundle carries a few
 * numbers rather than every project report.
 */
export default function PortfolioDossier({ data }: { data: Dossier }) {
  const { counts } = data;
  const cells = [
    { value: counts.total, label: "Projects", note: "products · design · venture" },
    { value: counts.products, label: "Products built", note: `${counts.platform} platforms · ${counts.lab} lab` },
    { value: counts.design, label: "Design projects", note: `${counts.clients} freelance clients` },
  ];

  return (
    <section className={styles.dossier} aria-label={`Portfolio of ${data.name}`}>
      <p className={styles.kicker}>
        <span className={styles.dot} aria-hidden="true" />
        Portfolio · Space OS
      </p>
      <p className={styles.name}>{data.name}</p>
      <p className={styles.role}>
        {data.role} · {data.location}
      </p>

      <dl className={styles.counts}>
        {cells.map((c) => (
          <div key={c.label} className={styles.cell}>
            <dd className={styles.value}>
              <Counter value={c.value} />
            </dd>
            <dt className={styles.label}>
              {c.label}
              <span className={styles.note}>{c.note}</span>
            </dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
