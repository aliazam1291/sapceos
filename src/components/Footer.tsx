import Link from "next/link";
import { links, profile } from "@/content/profile";
import { orbitHasContent } from "@/content/orbit";
import { footerLine } from "@/content/voice";
import FooterHorizon from "./FooterHorizon";
import LocalTime from "./LocalTime";
import { ui } from "./ui";

const nav = [
  { href: "/missions", label: "Missions" },
  { href: "/lab", label: "Lab" },
  // Gated the same way as in Nav.tsx — see src/content/orbit.ts. Listing a
  // route whose four rows all read "needs input" is worse than not listing
  // it, and this reverses itself the moment there is content.
  ...(orbitHasContent ? [{ href: "/orbit", label: "Orbit" }] : []),
  { href: "/field-notes", label: "Field Notes" },
  { href: "/writing", label: "Writing" },
  { href: "/decisions", label: "Flight Rules" },
  { href: "/about", label: "About" },
  { href: "/mission-history", label: "Mission History" },
  { href: "/contact", label: "Open Channel" },
];

export default function Footer() {
  return (
    <footer className={ui.footer}>
      <FooterHorizon />
      <div className={ui.footerInner}>
        <div className={ui.footerCol}>
          <p className={ui.label}>Navigation</p>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={ui.footerLink}>
              {n.label}
            </Link>
          ))}
        </div>

        <div className={ui.footerCol}>
          <p className={ui.label}>Elsewhere</p>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={ui.footerLink}
              target="_blank"
              rel="noreferrer noopener"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className={ui.footerCol}>
          <p className={ui.label}>Open channel</p>
          <a href={`mailto:${profile.email}`} className={ui.footerLink}>
            {profile.email}
          </a>
          <a
            href={profile.calendly}
            className={ui.footerLink}
            target="_blank"
            rel="noreferrer noopener"
          >
            Book a slot
          </a>
          <p className={ui.footerLink}>{profile.location}</p>
        </div>
      </div>

      <div className={ui.wordmark} aria-hidden="true">
        <div className={ui.wordmarkText}>SPACE OS</div>
      </div>

      <div className={ui.footerBase}>
        <span className={ui.footerRow}>
          <span>© {new Date().getFullYear()} {profile.name}</span>
          <span>{profile.location}</span>
          <span className={ui.footerAside}>{footerLine}</span>
        </span>
        <span className={ui.footerRow}>
          <LocalTime />
          {/* Every version-numbering scheme is a small lie about how finished
              something is. This one just admits it. */}
          <span title="Actually the third rewrite. Semver is a suggestion.">
            Space OS · v1
          </span>
        </span>
      </div>
    </footer>
  );
}
