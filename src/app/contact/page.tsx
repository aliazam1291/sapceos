import type { Metadata } from "next";
import { ButtonLink, NextStep, PageHeader, Section, Status, ui } from "@/components/ui";
import CopyLink from "@/components/CopyLink";
import Satellite from "@/components/space/Satellite";
import GravityGrid from "@/components/space/GravityGrid";
import { links, lookingFor, profile } from "@/content/profile";
import Comms from "@/components/Comms";
import ContactForm from "@/components/ContactForm";
import RecruiterManifest from "@/components/RecruiterManifest";
import { plainName } from "@/content/pages";

export const metadata: Metadata = {
  title: { absolute: "Contact — Hire a Product Manager, New Delhi · Ali Azam Kazmi" },
  description: `Contact Ali Azam Kazmi about product manager, APM or technical PM roles in New Delhi / Delhi NCR — ${profile.email}, the form, or a Calendly slot.`,
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
        plain={plainName["/contact"]}
        title="The channel is open"
        lede="Product roles, platform work, or an argument about something on this site. All three are welcome."
        // The channel is a relay: a comms satellite holding station beside the
        // title (2026-09-20, Ali: "more elements like the spaceship").
        figure={<Satellite label="A comms relay satellite holding station: gold dish, two solar wings, an emerald beacon." size={340} />}
        figureWidth={340}
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

          {/* The résumé belongs here (2026-09-24). /contact is the second
              most visited page on the site and two thirds of a week's
              visitors reached it — and it was the one page offering no way
              to take the CV away. Every report, /about and the pad had it. */}
          <div className={ui.vcardActions}>
            <ButtonLink href={`mailto:${profile.email}`} primary external>
              Send a message
            </ButtonLink>
            <ButtonLink href={profile.calendly} external>
              Book a slot
            </ButtonLink>
            <ButtonLink href="/Ali_Azam_Kazmi_.pdf" external>
              Résumé (PDF)
            </ButtonLink>
          </div>
        </div>

        {/* The form: a transmission, delivered by the relay (api/contact) or
            handed to the reader's mail client if the relay is offline. */}
        <div style={{ marginTop: "var(--space-6)" }}>
          <RecruiterManifest />
        </div>

        <div style={{ marginTop: "var(--space-6)" }}>
          <ContactForm />
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

      {/* Not a dead end (2026-09-24). Somebody arriving here from a CV, a
          LinkedIn profile or the GitHub README has seen none of the work
          yet, and this page offered no route to any of it. */}
      <NextStep
        href="/missions"
        label="Next · Missions"
        title="The work behind the channel"
        premise="Ten products, each with the problem, the decisions and what shipped — the reason to start a conversation."
      />
    </>
  );
}
