import Image from "next/image";
import Link from "next/link";
import type { Dossier, SkillCount } from "@/content/portfolio";
import HeroOrbit from "./HeroOrbit";
import HoloFigure from "./HoloFigure";
import HoloReadout from "./HoloReadout";
import ResultValue from "./ResultValue";
import styles from "./PortfolioHero.module.scss";

/**
 * The landing (2026-10-31). Ali: "we need a portfolio looking page related
 * to space, like my photo and masked on me, in the landing; then the next
 * page continues what we have."
 *
 * A portfolio's first screen, in the site's world: Ali cut out of his studio
 * headshot (tools/cutout-portrait.py) standing in front of a planet's lit
 * limb, his skills on an orbit around him — each with the number of
 * projects that used it — and, beside him, who he is, how much work there
 * is, the skills, the degree and the ways in. The galaxy flight starts
 * right under it, unchanged. Then, the same day: "a 3D animated space
 * version of me, futuristic, with mask", and "I don't like my image — a 3D
 * animated image, downloading skills": the photo is never shown. A hologram
 * built from it (HoloFigure) materialises from a rising scan while the
 * skills install into the orbit one by one; a baked still of the same
 * hologram is the first paint and the fallback.
 *
 * Server-rendered: the h1, every number and every link are in the HTML
 * from the first byte (the page's LCP is here, so nothing waits on
 * JavaScript; the orbit and the count-ups are the only client parts). The
 * numbers come from content/portfolio.ts, counted from the projects.
 */

export default function PortfolioHero({ data }: { data: Dossier }) {
  const { counts, skills, education, proof, owned, outcome } = data;
  // The four things he does, each with its proof (2026-11-17, Ali: "a PM
  // who knows design and tech and UX and can ship products"). Every value
  // is counted from content or read from results.ts.
  const cells = [
    { discipline: "Product", value: String(owned.length), label: "products owned" },
    { discipline: "Design · UX", value: String(counts.design), label: "design projects" },
    { discipline: "Engineering", value: String(counts.products), label: "products built" },
    ...(outcome ? [{ discipline: "Shipped", value: outcome.value, label: outcome.label }] : []),
  ];

  // What orbits him (2026-10-31, "too clustered": five, not seven): the
  // three most-used stacks with the two PM crafts between them. The skill
  // rows that used to sit in the copy are gone — this ring and the toolkit
  // under the landing carry them.
  const stacks = skills[0].items;
  const crafts = skills[1].items.filter((s) => s.name === "UI/UX" || s.name === "PRDs");
  const orbit: SkillCount[] = [stacks[0], crafts[0], stacks[1], crafts[1], stacks[2]].filter(
    (s): s is SkillCount => Boolean(s),
  );

  return (
    <section id="portfolio" data-section="Intro" className={styles.hero} aria-labelledby="portfolio-name">
      <div className={styles.copy}>
        <p className={styles.kicker}>
          <span className={styles.dot} aria-hidden="true" />
          Product portfolio · Space OS
        </p>
        <h1 id="portfolio-name" className={styles.name}>
          {data.name}
        </h1>
        <p className={styles.role}>
          {data.role}{proof ? <> · fleet products for {proof.value} users</> : null} · {data.location}
        </p>
        <p className={styles.pitch}>Give me a problem. I&rsquo;ll figure out what to do next.</p>

        <dl className={styles.counts}>
          {cells.map((c) => (
            <div key={c.discipline} className={styles.cell}>
              <dt className={styles.discipline}>{c.discipline}</dt>
              <dd className={styles.value}>
                <ResultValue value={c.value} />
              </dd>
              <dd className={styles.label}>{c.label}</dd>
            </div>
          ))}
        </dl>
        {/* The orbit is decorative; its skills, said for a screen reader. */}
        <p className={styles.srOnly}>
          Most-used skills: {orbit.map((s) => `${s.name} (${s.count} projects)`).join(", ")}.
        </p>

        <p className={styles.meta}>
          <span>
            {education.degreeShort}, {education.short}
          </span>
          <span>{data.now}</span>
        </p>
        <p className={styles.owns}>
          Owns <strong>{owned.join(" · ")}</strong>
        </p>

        <div className={styles.actions}>
          {/* The flight below IS the selected work: plain words for the way in. */}
          <a href="#arrival" className={styles.primary}>
            See the work <span aria-hidden="true">↓</span>
          </a>
          <a href="/Ali_Azam_Kazmi_.pdf" target="_blank" rel="noreferrer noopener" className={styles.action}>
            Résumé (PDF) <span aria-hidden="true">↗</span>
          </a>
          <Link href="/hire" className={styles.textLink}>
            For recruiters <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* The stage: a planet's lit limb behind him, the orbit around him. */}
      <div className={styles.stage}>
        <span className={styles.halo} aria-hidden="true" />
        <span className={styles.planet} aria-hidden="true" />
        <span className={styles.bracket} data-c="tl" aria-hidden="true" />
        <span className={styles.bracket} data-c="tr" aria-hidden="true" />
        <HoloReadout skills={orbit.map((s) => s.name)} />

        {/* Sized to his figure, so the ring sits at the same point on him
            whatever shape the stage is. */}
        <div className={styles.figure}>
          <HeroOrbit layer="back" skills={orbit} />
          {/* His avatar (2026-10-31, his choice over the studio photo): the
              first paint, the whole figure without WebGL or motion, and what
              the hologram resolves into once the skills are installed. */}
          <Image
            src="/images/ali-masked.webp"
            alt={`${data.name} as a 3D astronaut, his face behind a black helmet`}
            width={1199}
            height={1312}
            priority
            fetchPriority="high"
            sizes="(max-width: 768px) 260px, (max-width: 1440px) 36vw, 520px"
            className={styles.still}
          />
          {/* Under the helmet (2026-10-31, Ali: "when someone hovers show the
              second image, but only the part where the mouse is"): the same
              frame unmasked, cut to a soft circle that follows the pointer —
              or a finger, while it is down. The two images line up pixel for
              pixel (both 1199×1312). */}
          <Image
            src="/images/ali-astronaut.webp"
            alt=""
            aria-hidden="true"
            width={1199}
            height={1312}
            sizes="(max-width: 768px) 260px, (max-width: 1440px) 36vw, 520px"
            className={styles.reveal}
          />
          {/* The download: a hologram of the avatar materialises over it
              once it can be seen, installs the skills into the orbit, then
              resolves back into the avatar and stops drawing. */}
          <HoloFigure src="/images/ali-masked.webp" total={orbit.length} className={styles.holo} />
          <HeroOrbit layer="front" skills={orbit} />
        </div>
      </div>
    </section>
  );
}
