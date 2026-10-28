import Link from "next/link";
import { Status, ui } from "@/components/ui";
import { aiTools, education, lookingFor, openTo, profile } from "@/content/profile";

/*
 * The manifest a recruiter is scanning for (2026-09-21). Ali asked for
 * "hidden keywords"; hidden text is the one thing search engines penalise,
 * so these are the same words in plain sight — the role sought, the city,
 * the domains, the languages, where the résumé is — as one hairline
 * instrument on /about and /contact. Every line is a PROFILE.md fact, in
 * the phrasing a recruiter types: "product manager New Delhi", "fleet
 * telematics", "Founder & CPO".
 */
export default function RecruiterManifest() {
  return (
    <dl className={ui.manifest} aria-label="At a glance, for recruiters" data-reveal>
      <div className={ui.manifestCell}>
        <dt>Status</dt>
        <dd>
          {/* Plain words in the recruiter card; the space voice lives elsewhere. */}
          <Status>Open to new roles</Status>
        </dd>
      </div>
      <div className={ui.manifestCell}>
        <dt>Looking for</dt>
        <dd>{lookingFor}: a PM who builds the product</dd>
      </div>
      <div className={ui.manifestCell}>
        <dt>Location</dt>
        <dd>{openTo}</dd>
      </div>
      <div className={ui.manifestCell}>
        <dt>Builds with AI</dt>
        <dd>{aiTools.join(", ")}: research, prototyping, vibe coding</dd>
      </div>
      <div className={ui.manifestCell}>
        <dt>Now</dt>
        <dd>
          {profile.currentRole}, {profile.currentOrg}
        </dd>
      </div>
      {/* Side ventures as one line, not a second identity (2026-10-28 review). */}
      <div className={ui.manifestCell}>
        <dt>Also</dt>
        <dd>
          Co-founder, <Link href="/dumbmoney">DumbMoney</Link> · freelance design, <Link href="/smaak">Smaak.ux</Link>
        </dd>
      </div>
      <div className={ui.manifestCell}>
        <dt>Education</dt>
        <dd>
          {education.degree}, {education.school} · {education.detail}
        </dd>
      </div>
      <div className={ui.manifestCell}>
        <dt>Domains</dt>
        <dd>Fleet &amp; telematics platforms, logistics, geospatial products, enterprise SaaS dashboards, consumer e-commerce</dd>
      </div>
      <div className={ui.manifestCell}>
        <dt>Product craft</dt>
        <dd>PRDs, user story mapping, roadmapping, prioritisation, A/B testing, stakeholder management, UX research</dd>
      </div>
      <div className={ui.manifestCell}>
        <dt>Languages</dt>
        <dd>{profile.languages.join(" · ")}</dd>
      </div>
      <div className={ui.manifestCell}>
        <dt>Résumé</dt>
        <dd>
          <a href="/Ali_Azam_Kazmi_.pdf" target="_blank" rel="noreferrer noopener" className={ui.manifestLink}>
            One page, PDF<span aria-hidden="true"> ↗</span>
          </a>
        </dd>
      </div>
    </dl>
  );
}
