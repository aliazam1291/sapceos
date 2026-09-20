import Link from "next/link";
import Comms from "./Comms";
import { Section, SectionHead } from "./ui";
import { experience } from "@/content/profile";
import styles from "./LogLeg.module.scss";

/*
 * Leg 07 — the flight log, compact.
 *
 * Where the time went, on one screen: a dashed route down the left with
 * a diamond waypoint per role (the same route language as /mission-history
 * and the beacons), period, role, organisation and the first line of what
 * it involved. The full log with every point is one click away. A
 * recruiter reads a résumé in this order; the home page now has one.
 */
export default function LogLeg() {
  return (
    <Section id="log" data-section="Flight log">
      <div className={styles.leg}>
        <SectionHead
          label={`07 / Flight log · ${experience.length} roles`}
          title="Where the time went"
          action={
            <Link href="/mission-history" className={styles.all}>
              The full log &rarr;
            </Link>
          }
        />
        <Comms at="log" className={styles.comms} />
        <ol className={styles.route} aria-label="Roles, most recent first">
          {experience.map((job, i) => (
            <li key={`${job.org}-${job.period}`} className={`${styles.stop} flies`} data-flight={i % 2 ? "right" : "left"} style={{ "--lag": `${i * 6}%` } as React.CSSProperties}>
              <span className={styles.mark} aria-hidden="true">
                <i />
              </span>
              <div className={styles.body}>
                <p className={styles.period}>{job.period}</p>
                <h3 className={styles.role}>{job.role}</h3>
                <p className={styles.org}>
                  {"href" in job && job.href ? <Link href={job.href}>{job.org}</Link> : job.org} &middot; {job.place}
                </p>
                {job.points[0] ? <p className={styles.point}>{job.points[0]}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
