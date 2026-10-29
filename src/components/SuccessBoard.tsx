"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { sfx } from "@/lib/spaceSound";
import { proofRank, type BoardRow } from "@/lib/success";
import { Status } from "./ui";
import styles from "./SuccessBoard.module.scss";

/**
 * The scoreboard (2026-10-29): every project's success on one instrument,
 * sortable. Rows are computed on the server from each mission's own record
 * (lib/success.ts); this only orders them. A project with nothing measured
 * sits in the table with a dash and says why — the column of proof levels
 * is as much the point as the column of numbers.
 */

type SortKey = "reach" | "proof" | "status" | "name";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "reach", label: "Reach" },
  { key: "proof", label: "Proof" },
  { key: "status", label: "Status" },
  { key: "name", label: "A–Z" },
];

const SHORT: Record<string, string> = { frontend: "FE", ux: "UX", prd: "PRD", xfn: "XFN" };

const byReach = (a: BoardRow, b: BoardRow) => (b.reach?.n ?? -1) - (a.reach?.n ?? -1);

function sortRows(rows: BoardRow[], key: SortKey) {
  const out = [...rows];
  switch (key) {
    case "reach":
      return out.sort((a, b) => byReach(a, b) || proofRank[a.proof] - proofRank[b.proof]);
    case "proof":
      return out.sort((a, b) => proofRank[a.proof] - proofRank[b.proof] || byReach(a, b));
    case "status":
      return out.sort((a, b) => Number(b.status === "active") - Number(a.status === "active") || byReach(a, b));
    default:
      return out.sort((a, b) => a.title.localeCompare(b.title));
  }
}

export default function SuccessBoard({ rows }: { rows: BoardRow[] }) {
  const [key, setKey] = useState<SortKey>("reach");
  const sorted = useMemo(() => sortRows(rows, key), [rows, key]);
  const max = Math.max(...rows.map((r) => r.reach?.n ?? 1), 10);
  const width = (n?: number) => (n && n > 1 ? Math.log10(n) / Math.log10(max) : 0);
  const ariaSort = (k: SortKey) => (key === k ? (k === "name" ? "ascending" : "descending") : undefined);

  const measured = rows.filter((r) => r.proof === "measured").length;

  const owns = (r: BoardRow) => (
    <span className={styles.owns} role="img" aria-label={`Owned: ${r.owns.filter((o) => o.on).map((o) => o.label).join(", ") || "none declared"}`}>
      {r.owns.map((o) => (
        <i key={o.key} data-on={o.on || undefined}>
          {SHORT[o.key] ?? o.label}
        </i>
      ))}
    </span>
  );

  const rail = (r: BoardRow) =>
    r.reach ? (
      <>
        <span className={styles.rail} title={`${r.reach.value} ${r.reach.label}`}>
          <span className={styles.grow}>
            <i className={styles.fill} data-kind={r.reach.label.includes("installs") ? "installs" : undefined} style={{ ["--w" as string]: width(r.reach.n).toFixed(3) }} />
          </span>
        </span>
        {/* When the lead result is a change (a %, a multiple), the bar is
            measuring something else; say what. */}
        {r.headline?.value !== r.reach.value ? (
          <span className={styles.railNote}>
            Reach: {r.reach.value} {r.reach.label.toLowerCase()}
          </span>
        ) : null}
      </>
    ) : (
      <span className={styles.railEmpty} aria-hidden="true" />
    );

  return (
    <div className={styles.board}>
      <div className={styles.toolbar}>
        <p className={styles.summary}>
          <b>{measured}</b> of {rows.length} with a measured number on file
        </p>
        <div className={styles.sort} role="group" aria-label="Sort the projects">
          <span className={styles.sortLabel} aria-hidden="true">
            Sort
          </span>
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={styles.key}
              aria-pressed={key === s.key}
              onClick={() => {
                if (s.key === key) return;
                setKey(s.key);
                sfx("tick");
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <table className={styles.table}>
        <caption className={styles.srOnly}>
          Success by project: the lead measured result, reach on a log scale, how much of it can be checked, and what was owned.
        </caption>
        <thead>
          <tr>
            <th scope="col" aria-sort={ariaSort("name")}>
              Project
            </th>
            <th scope="col">Lead result</th>
            <th scope="col" aria-sort={ariaSort("reach")}>
              Reach <span className={styles.thNote}>log</span>
            </th>
            <th scope="col" aria-sort={ariaSort("proof")}>
              Proof
            </th>
            <th scope="col">Record</th>
            <th scope="col">Owned</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.slug} data-proof={r.proof}>
              <th scope="row">
                <Link href={`/missions/${r.slug}`} className={styles.name}>
                  {r.title}
                </Link>
                <Status idle={r.status !== "active"}>{r.status === "active" ? "Active" : "Shipped"}</Status>
              </th>
              <td>
                {r.headline ? (
                  <span className={styles.headline}>
                    <b>{r.headline.value}</b> <span>{r.headline.label}</span>
                  </span>
                ) : (
                  <span className={styles.dash}>— none on file</span>
                )}
              </td>
              <td>{rail(r)}</td>
              <td>
                <span className={styles.proof} data-proof={r.proof}>
                  {r.proofLabel}
                </span>
              </td>
              <td className={styles.record}>
                <span>{r.measured} on file</span>
                <span>{r.toMeasure} named</span>
              </td>
              <td>{owns(r)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Phones: the same rows as a list — a sideways-scrolling table is a spreadsheet. */}
      <ol className={styles.stack} aria-label="Success by project">
        {sorted.map((r) => (
          <li key={r.slug} className={styles.stackRow}>
            <div className={styles.stackHead}>
              <Link href={`/missions/${r.slug}`} className={styles.name}>
                {r.title}
              </Link>
              <span className={styles.proof} data-proof={r.proof}>
                {r.proofLabel}
              </span>
            </div>
            {r.headline ? (
              <span className={styles.headline}>
                <b>{r.headline.value}</b> <span>{r.headline.label}</span>
              </span>
            ) : (
              <span className={styles.dash}>— no number on file</span>
            )}
            {rail(r)}
            <div className={styles.stackFoot}>
              <span className={styles.record}>
                {r.status === "active" ? "Active" : "Shipped"} · {r.measured} on file · {r.toMeasure} named
              </span>
              {owns(r)}
            </div>
          </li>
        ))}
      </ol>

      <p className={styles.foot}>
        Reach is the first measured size on each report (not a percentage, not designed headroom), on one log scale. Where a
        project has no measured size, its public listing&rsquo;s installs stand in, hatched, because installs are a different
        measure. Nothing here is estimated; a dash means nothing is on file.
      </p>
    </div>
  );
}
