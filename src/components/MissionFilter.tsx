"use client";

import { useMemo, useState } from "react";
import type { Mission } from "@/content/types";
import MissionRow, { MissionList } from "./MissionRow";
import styles from "./MissionFilter.module.scss";

type Filter = "all" | "active" | "shipped";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "shipped", label: "Shipped" },
];

export default function MissionFilter({ missions }: { missions: Mission[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [stack, setStack] = useState<string | null>(null);

  // Only offer stacks that actually appear more than once — a filter with one
  // result each is a list, not a filter.
  const stacks = useMemo(() => {
    const counts = new Map<string, number>();
    missions.forEach((m) => m.stack.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1)));
    return [...counts.entries()]
      .filter(([, n]) => n > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([s]) => s);
  }, [missions]);

  const visible = missions.filter(
    (m) =>
      (filter === "all" || m.status === filter) && (stack === null || m.stack.includes(stack)),
  );

  return (
    <>
      <div className={styles.bar}>
        <div className={styles.group} role="group" aria-label="Filter by status">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`${styles.chip} ${filter === f.key ? styles.chipActive : ""}`}
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className={styles.count}>
                {f.key === "all"
                  ? missions.length
                  : missions.filter((m) => m.status === f.key).length}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.group} role="group" aria-label="Filter by stack">
          <button
            type="button"
            className={`${styles.chip} ${stack === null ? styles.chipActive : ""}`}
            aria-pressed={stack === null}
            onClick={() => setStack(null)}
          >
            Any stack
          </button>
          {stacks.map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.chip} ${stack === s ? styles.chipActive : ""}`}
              aria-pressed={stack === s}
              onClick={() => setStack(stack === s ? null : s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.result} aria-live="polite">
        {visible.length} of {missions.length} missions
      </p>

      {visible.length ? (
        <MissionList>
          {visible.map((m, i) => (
            <MissionRow key={m.slug} mission={m} index={i} />
          ))}
        </MissionList>
      ) : (
        <p className={styles.empty}>
          Nothing matches that combination. Loosen one of the filters.
        </p>
      )}
    </>
  );
}
