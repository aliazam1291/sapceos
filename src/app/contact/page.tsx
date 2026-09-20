import type { Metadata } from "next";
import { ButtonLink, PageHeader, Section, Status, ui } from "@/components/ui";
import CopyLink from "@/components/CopyLink";
import PageForm from "@/components/space/PageForm";
import GravityGrid from "@/components/space/GravityGrid";
import { links, lookingFor, profile } from "@/content/profile";
import Comms from "@/components/Comms";

export const metadata: Metadata = {
  title: "Open Channel",
  description: `Get in touch with Ali Azam Kazmi about product roles or platform work — ${profile.email}, or book a slot on Calendly directly.`,
  alternates: { canonical: "/contact" },
};

// Initials for the vcard avatar — derived once from the profile name rather
// than hardcoded, so it stays correct if PROFILE.md's name ever changes.
const initials = profile.name
  .split(" ")
  .map((part) => part[0])
  .join("");

export default function ContactPage() {
  return (
    <>
      <PageHeader
        label="Open Channel"
        title="The channel is open"
        lede="Product roles, platform work, or an argument about something on this site. All three are welcome."
        figure={
          <PageForm form="planet" label="A slowly turning faceted wireframe planet." size={240} />
        }
      />
      <div className={ui.pageComms}>
        <Comms at="contact" />
      </div>

      {/* Every way to reach the operator, as masses — click one to open it. */}
      <GravityGrid
        label="Signal field"
        height={220}
        masses={[
          { label: "Email", value: profile.email, weight: 1, href: `mailto:${profile.email}` },
          { label: "Book a slot", value: "Calendly", weight: 0.85, href: profile.calendly },
          ...links.slice(0, 4).map((l) => ({ label: l.label, weight: 0.5, href: l.href })),
        ]}
      />

      <Section>
        {/* The vcard: one panel that reads as a business card, not a list of
            label/value rows. Name, role and status up front, actions right
            there beside them. */}
        <div className={ui.vcard} data-reveal>
          <span className={ui.vcardAvatar} aria-hidden="true">
            {initials}
          </span>

          <div className={ui.vcardMeta}>
            <div className={ui.metaRow}>
              <Status>Accepting transmissions</Status>
              <span>{profile.location}</span>
              <span>{profile.languages.join(" · ")}</span>
            </div>
            <h2 className={ui.vcardName}>{profile.name}</h2>
            <p className={ui.vcardTitle}>{profile.title}</p>
            <p className={ui.vcardLooking}>
              <span>Looking for</span> {lookingFor} &middot; currently {profile.currentRole}, {profile.currentOrg}
            </p>
          </div>

          <div className={ui.vcardActions}>
            <ButtonLink href={`mailto:${profile.email}`} primary external>
              Send a message
            </ButtonLink>
            <ButtonLink href={profile.calendly} external>
              Book a slot
            </ButtonLink>
          </div>
        </div>

        <div className={ui.instrumentGrid} style={{ marginTop: "var(--space-6)" }}>
          <div className={ui.instrumentCell} data-reveal>
            <span className={ui.labelRule}>Email</span>
            <div className={ui.vcardChannel}>
              <CopyLink
                href={`mailto:${profile.email}`}
                value={profile.email}
                label="email address"
                display={profile.email}
                compact
              />
            </div>
          </div>

          <div className={ui.instrumentCell} data-reveal>
            <span className={ui.labelRule}>Book a slot</span>
            <div className={ui.vcardChannel}>
              <CopyLink
                href={profile.calendly}
                value={profile.calendly}
                display={profile.calendly.replace("https://", "")}
                label="booking link"
                external
                compact
              />
            </div>
          </div>

          <div className={`${ui.instrumentCell} ${ui.vcardLinksCell}`} data-reveal>
            <span className={ui.labelRule}>Elsewhere</span>
            <ul className={ui.tagRow} style={{ listStyle: "none", padding: 0 }}>
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    className={ui.tagLink}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}
