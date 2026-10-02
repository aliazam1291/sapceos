import Link from "next/link";
import { links, profile } from "@/content/profile";
import styles from "./AuthorBio.module.scss";

/*
 * Who wrote this (2026-10-02). Every essay and case study ends with the
 * author, in plain text a reader and a crawler can both attribute: the
 * Article JSON-LD already points at the Person node, and this is the visible
 * half of that claim. Every line is PROFILE.md.
 */
export default function AuthorBio() {
  const linkedin = links.find((l) => l.label === "LinkedIn")?.href;
  return (
    <aside className={styles.bio} aria-label="About the author">
      <p className={styles.label}>Written by</p>
      <p className={styles.name}>
        <Link href="/about" rel="author">
          {profile.name}
        </Link>
      </p>
      <p className={styles.line}>
        {profile.currentRole} at {profile.currentOrg}, building fleet and telematics platforms for 200,000+ users and
        writing the PRDs before building them. Founder &amp; CPO of DumbMoney; runs the Smaak.ux design studio. Based in{" "}
        {profile.location}, moving into product management.
      </p>
      <p className={styles.links}>
        <Link href="/about">More about Ali</Link>
        {linkedin ? (
          <a href={linkedin} target="_blank" rel="noreferrer noopener me">
            LinkedIn <span aria-hidden="true">↗</span>
          </a>
        ) : null}
        <Link href="/contact">Get in touch</Link>
      </p>
    </aside>
  );
}
