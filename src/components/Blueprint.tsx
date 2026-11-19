import type { Blueprint as BlueprintT, BlueprintDiagram } from "@/content/types";
import styles from "./Blueprint.module.scss";

/*
 * How a product works, drawn instead of screenshotted (2026-11-19).
 *
 * Ali: "tell the features, add graphs of features, what it's doing — we
 * can't add images." Client products can't be shown, so the report shows
 * their mechanics: the modules (what each one does), then diagrams of the
 * product's own logic — a flow, a set of status bands, a cost curve, a
 * mapping. Every diagram is a MODEL, never a chart of real data, and its
 * caption says so.
 *
 * Server-rendered, no canvas, no client JS: text is HTML so it stays
 * legible and reflows on a phone (SVG text shrinks with its viewBox, and a
 * 375px screen would put it under the 11px floor). The only SVG is the cost
 * curve's line. Instruments are wireframe emerald; amber marks "over", as
 * amber is the field colour, and red is never used here (one red per chrome).
 */
export default function Blueprint({ blueprint }: { blueprint: BlueprintT }) {
  return (
    <section className={styles.blueprint} aria-label="How it works">
      <ul className={styles.features}>
        {blueprint.features.map((f, i) => (
          <li key={f.name} className={`${styles.feature} flies`} style={{ ["--lag" as string]: `${(i % 3) * 6}%` }}>
            <span className={styles.featureIndex} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className={styles.featureName}>{f.name}</h3>
            <p className={styles.featureDoes}>{f.does}</p>
            {f.tag ? <span className={styles.featureTag}>{f.tag}</span> : null}
          </li>
        ))}
      </ul>

      {blueprint.diagrams.map((d) => (
        <figure key={d.title} className={styles.diagram} data-kind={d.kind}>
          <figcaption className={styles.head}>
            <span className={styles.kind}>{kindLabel[d.kind]}</span>
            <span className={styles.title}>{d.title}</span>
          </figcaption>
          <Diagram d={d} />
          <p className={styles.caption}>{d.caption}</p>
        </figure>
      ))}
    </section>
  );
}

const kindLabel: Record<BlueprintDiagram["kind"], string> = {
  flow: "Flow",
  bands: "Rules",
  curve: "Model",
  matrix: "Map",
};

function Diagram({ d }: { d: BlueprintDiagram }) {
  switch (d.kind) {
    case "flow":
      return (
        <ol className={styles.flow} style={{ ["--cols" as string]: d.columns.length }}>
          {d.columns.map((c, ci) => (
            <li key={c.label} className={styles.flowCol}>
              <p className={styles.flowLabel}>
                <span aria-hidden="true">{String(ci + 1).padStart(2, "0")}</span> {c.label}
              </p>
              <ul className={styles.flowNodes}>
                {c.nodes.map((n) => (
                  <li key={n.name} className={styles.node}>
                    <span className={styles.nodeName}>{n.name}</span>
                    {n.note ? <span className={styles.nodeNote}>{n.note}</span> : null}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      );

    case "bands":
      return (
        <div className={styles.bands}>
          <p className={styles.unit}>{d.unit}</p>
          <div className={styles.bandTrack}>
            {d.bands.map((b) => (
              <span
                key={b.label}
                className={styles.band}
                data-tone={b.tone}
                style={{ flexGrow: Math.max(b.to - b.from, d.max * 0.06) }}
              >
                <span className={styles.bandLabel}>{b.label}</span>
                {/* Phones stack the bands, so each carries its own range. */}
                <span className={styles.bandRange} aria-hidden="true">
                  {b.range}
                </span>
              </span>
            ))}
          </div>
          {/* Ticks sit where the bands meet, so they follow the same widths. */}
          <div className={styles.ticks} aria-hidden="true">
            {d.bands.map((b, i) => (
              <span key={b.label} className={styles.tickSlot} style={{ flexGrow: Math.max(b.to - b.from, d.max * 0.06) }}>
                <span className={styles.tickStart}>{tickAt(d.ticks, b.from)}</span>
                {i === d.bands.length - 1 ? <span className={styles.tickEnd}>{tickAt(d.ticks, b.to)}</span> : null}
              </span>
            ))}
          </div>
          <ul className={styles.srList}>
            {d.bands.map((b) => (
              <li key={b.label}>
                {b.label}: {b.range}
              </li>
            ))}
          </ul>
        </div>
      );

    case "curve": {
      const xs = d.points.map((p) => p[0]);
      const ys = d.points.map((p) => p[1]);
      const xMax = Math.max(...xs);
      const yMax = Math.max(...ys) * 1.12;
      const W = 600;
      const H = 240;
      const px = (x: number) => (x / xMax) * W;
      const py = (y: number) => H - (y / yMax) * H;
      const line = d.points.map((p, i) => `${i ? "L" : "M"}${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join(" ");
      const area = `${line} L${W},${H} L0,${H} Z`;
      return (
        <div className={styles.curve}>
          <p className={styles.axisY}>{d.yLabel}</p>
          <div className={styles.plot}>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={styles.curveSvg} aria-hidden="true">
              <path d={area} className={styles.curveArea} />
              {d.marks.map((m) => (
                <line key={m.label} x1={px(m.x)} x2={px(m.x)} y1={0} y2={H} className={styles.curveMark} />
              ))}
              <path d={line} className={styles.curveLine} vectorEffect="non-scaling-stroke" />
            </svg>
            {d.marks.map((m) => (
              <span key={m.label} className={styles.markLabel} style={{ left: `${(m.x / xMax) * 100}%` }}>
                {m.label}
              </span>
            ))}
            <div className={styles.spans}>
              {d.spans.map((s) => (
                <span key={s.label} className={styles.span} style={{ flexGrow: s.to - s.from }}>
                  {s.label}
                </span>
              ))}
            </div>
          </div>
          <p className={styles.axisX}>{d.xLabel} →</p>
        </div>
      );
    }

    case "matrix":
      return (
        <div className={styles.matrix} style={{ ["--cols" as string]: d.cols.length }} role="table" aria-label={d.title}>
          <div className={styles.mRow} role="row" data-head>
            <span className={styles.mCorner} role="columnheader">
              Theme
            </span>
            {d.cols.map((c) => (
              <span key={c} className={styles.mHead} role="columnheader">
                {c}
              </span>
            ))}
          </div>
          {d.rows.map((r) => (
            <div key={r.label} className={styles.mRow} role="row">
              <span className={styles.mLabel} role="rowheader">
                {r.label}
              </span>
              {r.cells.map((items, ci) => (
                <span key={d.cols[ci]} className={styles.mCell} role="cell" data-empty={items.length ? undefined : ""}>
                  {/* On a phone the column header is gone, so each cell names its source. */}
                  {items.length ? <span className={styles.mSource}>{d.cols[ci]}</span> : null}
                  {items.map((it) => (
                    <span key={it} className={styles.chip}>
                      {it}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          ))}
        </div>
      );
  }
}

function tickAt(ticks: { at: number; label: string }[], at: number) {
  return ticks.find((t) => t.at === at)?.label ?? "";
}
