import Link from "next/link";
import { missions } from "@/content/missions";
import MissionSignature from "@/components/MissionSignature";
import styles from "./MissionSequence.module.scss";

/**
 * A second, deeper cut of the work — in depth, not just headline.
 *
 * This used to be a 400vh GSAP ScrollTrigger pin with its own WebGL scene
 * (first an abstract flight through invented telemetry, later an interactive
 * card gallery). Both were reverted after real use: pinning the scroll made
 * normal wheel scrolling feel stuck, content jumped while the pin measured
 * itself, and the mechanism ended up competing with the portfolio work it was
 * supposed to be showing. This is intentionally a plain, editorial,
 * native-scroll section now — no pin, no canvas, no `live` branch to keep in
 * sync with one. The persistent sky already gives the page its sense of
 * motion; this section's job is just to read well.
 *
 * REWRITTEN FROM A DEAD-BRANCH COMPONENT.
 *
 * The previous version kept full `live`/CardGallery/sr-only-flight-nav/
 * itinerary machinery around a `const live = false` that could never flip —
 * a section that renders exactly one way with roughly half its JSX unable to
 * execute. Removed rather than left dark, because the next person to open
 * this file has no way to tell "kept for later" from "forgot to delete."
 */

/*
 * Different four missions than the ones already shown above.
 *
 * The home page's "01 / Missions" section renders `featuredMissions` — the
 * five with `featured: true`. This section used to take `missions.slice(0,
 * 4)`, which is array order, not curation — and the first four missions in
 * the array happen to BE four of the five featured ones. The result was the
 * same four case studies shown twice in one scroll, back to back, which is
 * the kind of thing a visitor notices even if they can't say why the page
 * felt padded. Filtering to the non-featured missions gives this section its
 * own material instead.
 */
const beats = missions
  .filter((m) => !m.featured)
  .slice(0, 4)
  .map((m) => ({
    id: m.slug,
    label: m.org,
    title: m.title,
    body: m.premise,
    href: `/missions/${m.slug}`,
    role: m.role,
    period: m.period,
    stack: m.stack,
    signals: m.signals ?? [],
  }));

export default function MissionSequence() {
  return (
    <section id="method" data-section="More of the work" className={styles.sequence}>
      <div className={styles.screen}>
        {/*
          CSS-only relief model: a static faceted planet with orbit rings,
          communicating depth without a WebGL canvas or a render loop. Kept
          from the pinned version deliberately — it costs nothing (no canvas,
          no JS) and gives this section a visual anchor of its own rather than
          just being four more text rows after the missions grid above it.
        */}
        <div className={styles.stage}>
          <div className={styles.cssOrbit} aria-hidden="true">
            <span />
            <i />
            <b />
          </div>
        </div>

        <div className={styles.rail} aria-hidden="true">
          <span className={styles.hudTag}>03 / More of the work</span>
          <span className={styles.railLine} />
        </div>

        <div className={styles.copy}>
          {beats.map((b) => (
            <article key={b.id} className={styles.beat}>
              <div className={styles.beatStory}>
                {/* Server-rendered SVG, zero JS — the same figure a card in
                    the old 3D flight would have shown, kept here as this
                    mission's visual identity now that there is no 3D scene
                    to show it in. */}
                <MissionSignature seed={b.id} width={220} height={72} className={styles.beatSignature} />
                <p className={styles.beatLabel}>{b.label}</p>
                <h2 className={styles.beatTitle}>{b.title}</h2>
                <p className={styles.beatBody}>{b.body}</p>
                {/* Each stop is a real report, so it gets a way in. */}
                <Link href={b.href} className={styles.beatLink}>
                  Open the report &rarr;
                </Link>
              </div>

              <dl className={styles.readout}>
                {b.signals.map((sig) => (
                  <div key={sig.label}>
                    <dt>{sig.label}</dt>
                    <dd>{sig.value}</dd>
                  </div>
                ))}
                <div>
                  <dt>Period</dt>
                  <dd>{b.period}</dd>
                </div>
              </dl>

              <dl className={styles.spec}>
                <div>
                  <dt>Role</dt>
                  <dd>{b.role}</dd>
                </div>
                <div>
                  <dt>Stack</dt>
                  <dd>{b.stack.join(" · ")}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
