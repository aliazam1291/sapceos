import type { Metadata } from "next";
import { ButtonLink, PageHeader, Row, Section, Status, ui } from "@/components/ui";
import CopyLink from "@/components/CopyLink";
import { links, profile } from "@/content/profile";

export const metadata: Metadata = {
  title: "Open Channel",
  description: `Get in touch with Ali Azam Kazmi — ${profile.email}, or book a slot directly.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        label="Open Channel"
        title="The channel is open"
        lede="Product roles, platform work, or an argument about something on this site. All three are welcome."
      />

      <Section>
        <div className={ui.metaRow} data-reveal>
          <Status>Accepting transmissions</Status>
          <span>{profile.location}</span>
          <span>{profile.languages.join(" · ")}</span>
        </div>

        <div className={ui.rows} style={{ marginTop: "var(--space-8)" }}>
          {/* Both values are as often copied as clicked, so each carries a
              copy control beside the link rather than only a mailto/href. */}
          <Row label="Email">
            <CopyLink
              href={`mailto:${profile.email}`}
              value={profile.email}
              label="email address"
            />
          </Row>
          <Row label="Book a slot">
            <CopyLink
              href={profile.calendly}
              value={profile.calendly}
              display={profile.calendly.replace("https://", "")}
              label="booking link"
              external
            />
          </Row>
          <Row label="Elsewhere">
            <div className={ui.rowBody}>
              <ul className={ui.tagRow} style={{ listStyle: "none", padding: 0 }}>
                {links.map((l) => (
                  <li key={l.href}>
                    {/* The chip IS the link now. It used to be a static `.tag`
                        <li> with a bare <a> inside, so the visible chip was not
                        the hit target and nothing responded to hover. */}
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
          </Row>
        </div>

        <div className={ui.buttonRow} style={{ marginTop: "var(--space-12)" }} data-reveal>
          <ButtonLink href={`mailto:${profile.email}`} primary external>
            Send a message
          </ButtonLink>
          <ButtonLink href={profile.calendly} external>
            Book a slot
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
