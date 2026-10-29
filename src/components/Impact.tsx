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
  // A change past +100% (4× is +300%) fills the bar; the value says how far.
  if (r.kind === "delta") return Math.min(1, r.magnitude / 100);
  return Math.log10(r.magnitude) / MAX_LOG;
}

export default function Impact() {
  // Product-owned rows first (PRD, then UI/UX), so the matrix reads as the
  // trajectory it is: frontend roles that turned into product roles
  // (2026-10-28 review: "PRD owned on 2/10" read as a verdict, not a path).
  const prdCol = ownershipColumns.findIndex((c) => c.key === "prd");
  const uxCol = ownershipColumns.findIndex((c) => c.key === "ux");
  const matrix = missions
    .map((m) => ({
      slug: m.slug,
      title: m.title,
      status: m.status,
      owns: ownershipColumns.map((c) => c.test.test(m.role)),
    }))
    .sort((a, b) => Number(b.owns[prdCol]) - Number(a.owns[prdCol]) || Number(b.owns[uxCol]) - Number(a.owns[uxCol]));
  const prdOwned = matrix.filter((m) => m.owns[prdCol]).map((m) => m.title.split(" — ")[0].split(" & ")[0]);
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
            { kind: "delta", title: "Measured change", note: "change · linear, capped at +100%" },
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
          metrics for the two missions still in build are not yet measured and are not shown.
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
                    {/* role=img: aria-label is prohibited on a bare span. */}
                    <span
                      className={styles.dot}
                      data-on={on || undefined}
                      role="img"
                      aria-label={on ? `Owned ${ownershipColumns[ci].label}` : "Not owned"}
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
        {/* Phones (2026-09-22): the same matrix as rows — a sideways scroller
            inside a panel is a spreadsheet, not an app. Each mission is a row
            with the columns it owns as tags; the totals close the list. */}
        <ul className={styles.stack} aria-label="Ownership by mission">
          {matrix.map((m) => (
            <li key={m.slug} className={styles.stackRow}>
              <div className={styles.stackHead}>
                <Link href={`/missions/${m.slug}`} className={styles.stackLink}>
                  {m.title}
                </Link>
                <span className={styles.statusTag} data-status={m.status}>
                  {m.status}
                </span>
              </div>
              <ul className={styles.stackTags} aria-label="Owned">
                {ownershipColumns.map((c, ci) => (
                  <li key={c.key} className={styles.stackTag} data-on={m.owns[ci] || undefined}>
                    {c.label}
                  </li>
                ))}
              </ul>
            </li>
          ))}
          <li className={styles.stackTotals}>
            <span className={styles.totalLabel}>Owned on</span>
            {totals.map((n, ci) => (
              <span key={ci} className={styles.stackTotal}>
                {ownershipColumns[ci].label} <b>{n}</b>
                <span className={styles.totalOf}>/{missions.length}</span>
              </span>
            ))}
          </li>
        </ul>
        <p className={styles.footnote}>
          PRDs I wrote: {prdOwned.join(", ")}. The earlier rows were frontend and UX roles; the
          product work grew out of them. Every dot is a literal match against that mission&rsquo;s
          role line, so nothing here claims more than the report does.
        </p>
      </div>
    </div>
  );
}
