import Link from "next/link";
import MatrixPortrait from "@/components/space/MatrixPortrait";
import Comms from "./Comms";
import Decode from "./Decode";
import { Section, SectionHead } from "./ui";
import { currently, lookingFor, operatingLoop, profile } from "@/content/profile";
import styles from "./OperatorLeg.module.scss";

/*
 * Leg 02 — the operator, before the deck.
 *
 * The home page briefed the mission without ever saying who was flying:
 * the opener was a pitch and a number, and the person was three pages
 * away on /about. Ali (2026-09-19): "home page content is too less —
 * sections." This leg answers the recruiter's first question in one
 * screen: the portrait (the matrix, the site's object for a person), the
 * core story in three lines, the operating loop as one instrument strip,
 * and the facts — role, studio, city, what he is looking for. Every line
 * is PROFILE.md's "core story" section, in its words.
 */
export default function OperatorLeg() {
  return (
    <Section id="operator" data-section="Operator">
      <div className={styles.leg}>
        <SectionHead
          label="02 / Operator"
          title="Who is flying"
          action={
            <Link href="/about" className={styles.all}>
              About the operator &rarr;
            </Link>
          }
        />
        <Comms at="operator" className={styles.comms} />

        <div className={styles.grid}>
          <div className={styles.figure}>
            <MatrixPortrait src="/images/ali.jpg" alt={profile.name} size={240} cells={56} />
          </div>

          <div className={styles.copy}>
            <p className={styles.statement}>
              A product-minded generalist. I learn whatever I need to in order to build what I believe should exist.
            </p>
            <p className={styles.story}>
              On every project at {profile.currentOrg} the role has been the same four things at once:
              build the frontend, own the UI and UX, work across the teams, and write the document that says
              what we are actually solving — the PRD, not someone else&rsquo;s spec. That is the job right now,
              and it is the one I want to do on purpose.
            </p>

            {/* The loop, as one line of instrument. Full version on /about. */}
            <ol className={styles.loop} aria-label="Operating loop">
              {operatingLoop.map((s, i) => (
                <li key={s.step} className={styles.loopStep}>
                  <span className={styles.loopIndex}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.loopName}>
                    <Decode delay={200 + i * 90}>{s.step}</Decode>
                  </span>
                </li>
              ))}
            </ol>

            <dl className={styles.facts}>
              <div>
                <dt>Now</dt>
                <dd>
                  {profile.currentRole}, {profile.currentOrg}
                </dd>
              </div>
              <div>
                <dt>On the desk</dt>
                <dd>{currently}</dd>
              </div>
              <div>
                <dt>Also</dt>
                <dd>Founder, Smaak.ux — a product and design studio, since 2023</dd>
              </div>
              <div>
                <dt>Looking for</dt>
                <dd className={styles.accent}>{lookingFor}</dd>
              </div>
              <div>
                <dt>Base</dt>
                <dd>{profile.location}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </Section>
  );
}
