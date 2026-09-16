import Link from "next/link";
import MatrixPortrait from "@/components/space/MatrixPortrait";
import { Status } from "@/components/ui";
import { currently, experience, principles, profile, skills } from "@/content/profile";
import styles from "./Operator.module.scss";

const initials = profile.name
  .split(" ")
  .map((part) => part[0])
  .join("");

/**
 * The "who" panel on the home page.
 *
 * Between the work and the method there was nothing that said who was doing
 * it — a visitor had to leave for /about to learn the current role or what
 * the person reaches for. This is the identity card: role, org, one line on
 * how the work goes, and capabilities at a glance. Everything deeper stays
 * on /about and /mission-history.
 */
export default function Operator() {
  const current = experience[0];

  return (
    <div className={styles.operator}>
      <div className={styles.identity} data-reveal>
        <span className={styles.avatar}>
          <MatrixPortrait src="/images/ali.jpg" alt={profile.name} size={168} cells={46} />
          <span className={styles.avatarInitials} aria-hidden="true">
            {initials}
          </span>
        </span>
        <div className={styles.meta}>
          <Status>{current.period}</Status>
          <h3 className={styles.name}>{profile.name}</h3>
          <p className={styles.role}>
            {profile.currentRole}
            <span className={styles.org}> · {profile.currentOrg}</span>
          </p>
        </div>
        <p className={styles.statement}>
          I learn whatever I need to in order to build the thing I think should exist.{" "}
          <span className={styles.statementDim}>
            Frontend one week, a PRD the next — usually on the same product.
          </span>
        </p>
        <p className={styles.currently}>
          <span className={styles.currentlyLabel}>Currently</span>
          {currently}
        </p>
        <div className={styles.links}>
          <Link href="/about" className={styles.link}>
            About the operator &rarr;
          </Link>
          <Link href="/mission-history" className={styles.link}>
            Mission history &rarr;
          </Link>
        </div>
      </div>

      {/* The mindset. Four principles, each with the fact that backs it —
          a principle without evidence is a poster. */}
      <ol className={styles.principles} data-reveal>
        {principles.map((p, i) => (
          <li key={p.title} className={styles.principle}>
            <span className={styles.principleIndex}>0{i + 1}</span>
            <div className={styles.principleBody}>
              <h4 className={styles.principleTitle}>{p.title}</h4>
              <p className={styles.principleText}>{p.body}</p>
              <p className={styles.principleEvidence}>
                <span className={styles.evidenceLabel}>Evidence</span>
                {p.evidence}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className={styles.capabilities}>
        {skills.map((group, i) => (
          <div key={group.group} className={styles.cell} data-reveal>
            <div className={styles.cellHead}>
              <span className={styles.cellIndex}>0{i + 1}</span>
              <span className={styles.cellLabel}>{group.group}</span>
            </div>
            <ul className={styles.tags}>
              {group.items.slice(0, 7).map((item) => (
                <li key={item} className={styles.tag}>
                  {item}
                </li>
              ))}
              {group.items.length > 7 ? (
                <li className={`${styles.tag} ${styles.tagMore}`}>
                  +{group.items.length - 7}
                </li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
