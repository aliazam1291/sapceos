import { references } from "@/content/profile";
import { Section, SectionHead } from "@/components/ui";
import styles from "./Transmissions.module.scss";

/**
 * Received transmissions — what other people said, shown as signals coming
 * in on the channel: a wireframe antenna, a signal-strength stack, the
 * message typed out beneath, and who sent it. Renders nothing until
 * `references` in profile.ts has entries — every quote must be real, with a
 * name and a role, or it does not go on the site.
 */
export default function Transmissions() {
  if (!references.length) return null;
  return (
    <Section id="transmissions" data-section="Transmissions">
      <SectionHead label="Received transmissions" title="What people I worked with said" />
      <ol className={styles.list}>
        {references.map((r, i) => (
          <li key={r.name} className={`${styles.signal} flies`} data-flight={i % 2 ? "right" : "left"} style={{ "--lag": `${i * 8}%` } as React.CSSProperties}>
            <span className={styles.antenna} aria-hidden="true">
              <svg viewBox="0 0 32 40" width="32" height="40">
                <path d="M16 38V16" />
                <path d="M6 12a12 12 0 0 1 20 0" />
                <path d="M10 15a7 7 0 0 1 12 0" />
                <circle cx="16" cy="16" r="1.6" />
                <path d="M10 38h12" />
              </svg>
              <span className={styles.bars}>
                <i /><i /><i /><i />
              </span>
            </span>
            <blockquote className={styles.body}>
              <p className={styles.quote}>{r.quote}</p>
              <footer className={styles.from}>
                <span>{r.name}</span> {r.role}
                {r.org ? <> &middot; {r.org}</> : null}
              </footer>
            </blockquote>
          </li>
        ))}
      </ol>
    </Section>
  );
}
