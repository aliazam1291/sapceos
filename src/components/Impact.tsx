import Link from "next/link";
import { missions } from "@/content/missions";
import { ownershipColumns, results } from "@/content/results";
import styles from "./Impact.module.scss";

/**
 * 03 / Impact — the results ledger and the ownership matrix.
 *
 * Two questions a product hiring manager asks in the first minute: what
 * moved, and what did you actually own. The ledger answers the first with
 * every verified number in PROFILE.md, sized on a log scale so 300 and
 * 200,000 can share one chart. The matrix answers the second, and it is
 * DERIVED — each dot is a match against the mission's own `role` string, so
 * it cannot claim more ownership than the mission report does.
 */

const MAX_LOG = Math.log10(Math.max(...results.map((r) => r.magnitude)));

function width(r: (typeof results)[number]) {
  if (r.kind === "delta") return r.magnitude / 100;
  return Math.log10(r.magnitude) / MAX_LOG;
}

export default function Impact() {
  const matrix = missions.map((m) => ({
    slug: m.slug,
    title: m.title,
    status: m.status,
    owns: ownershipColumns.map((c) => c.test.test(m.role)),
  }));
  const totals = ownershipColumns.map((_, ci) => matrix.filter((m) => m.owns[ci]).length);

  return (
    <div className={styles.impact}>
      {/* ── Results ledger ─────────────────────────────────────────────── */}
      <div className={styles.ledger} data-reveal>
        <div className={styles.panelHead}>
          <span className={styles.panelLabel}>Results ledger</span>
          <span className={styles.panelMeta}>{results.length} verified · log scale</span>
        </div>
        {(
          [
            { kind: "scale", title: "Scale reached", note: "absolute counts · log scale" },
            { kind: "delta", title: "Measured change", note: "percentage deltas · linear" },
          ] as const
        ).map((group) => (
          <div key={group.kind} className={styles.group}>
            <div className={styles.groupHead}>
              <span className={styles.groupTitle}>{group.title}</span>
              <span className={styles.groupNote}>{group.note}</span>
            </div>
            <ol className={styles.rows}>
              {results
                .filter((r) => r.kind === group.kind)
                .map((r, i) => (
                  <li key={`${r.label}-${r.source}`} className={styles.row} data-kind={r.kind}>
                    <span className={styles.rowIndex}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.value}>{r.value}</span>
                    <span className={styles.labelCol}>
                      <span className={styles.rowLabel}>{r.label}</span>
                      <span className={styles.rowSource}>{r.source}</span>
                    </span>
                    <span className={styles.bar} aria-hidden="true">
                      <span className={styles.fill} style={{ width: `${width(r) * 100}%` }}>
                        <i />
                      </span>
                    </span>
                  </li>
                ))}
            </ol>
          </div>
        ))}
        <p className={styles.footnote}>
          Bars are log-scaled for absolute counts and linear for percentage deltas. Outcome
          metrics for the three active missions are not yet measured and are not shown.
        </p>
      </div>

      {/* ── Ownership matrix ───────────────────────────────────────────── */}
      <div className={styles.matrix} data-reveal>
        <div className={styles.panelHead}>
          <span className={styles.panelLabel}>Ownership matrix</span>
          <span className={styles.panelMeta}>{missions.length} missions · from each report&rsquo;s role line</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.thMission}>Mission</th>
              {ownershipColumns.map((c) => (
                <th key={c.key} scope="col" className={styles.thCol}>
                  <span>{c.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((m) => (
              <tr key={m.slug}>
                <th scope="row" className={styles.thRow}>
                  <Link href={`/missions/${m.slug}`} className={styles.missionLink}>
                    {m.title}
                  </Link>
                  <span className={styles.statusTag} data-status={m.status}>
                    {m.status}
                  </span>
                </th>
                {m.owns.map((on, ci) => (
                  <td key={ci} className={styles.cell} data-on={on || undefined}>
                    <span
                      className={styles.dot}
                      data-on={on || undefined}
                      aria-label={on ? `Owned ${ownershipColumns[ci].label}` : "—"}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className={styles.thRow}>
                <span className={styles.totalLabel}>Owned on</span>
              </th>
              {totals.map((t, ci) => (
                <td key={ci} className={styles.cell}>
                  <span className={styles.total}>
                    {t}<span className={styles.totalOf}>/{missions.length}</span>
                  </span>
                  <span className={styles.totalBar} aria-hidden="true">
                    <i style={{ width: `${(t / missions.length) * 100}%` }} />
                  </span>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
        <p className={styles.footnote}>
          Every dot is a literal match against that mission&rsquo;s role line — nothing is
          claimed here that the report itself does not say.
        </p>
      </div>
    </div>
  );
}
