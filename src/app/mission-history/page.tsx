import type { Metadata } from "next";
import CertificateGrid from "@/components/CertificateGrid";
import { NextStep, PageHeader, Row, Section, SectionHead, ui } from "@/components/ui";
import { achievements, certifications, education, experience } from "@/content/profile";

export const metadata: Metadata = { title: "Mission History", description: "Ali Azam Kazmi's full work history, education, achievements and certifications.", alternates: { canonical: "/mission-history" } };

export default function MissionHistoryPage() {
  return <><PageHeader label="Mission History" title="The log, in order" lede="Roles, dates, and what each one actually involved. The resume, without the resume formatting." />
    <Section><SectionHead label="Experience" title="Where the time went" /><div className={ui.timeline}>{experience.map((job) => <article key={`${job.org}-${job.period}`} className={ui.timelineItem}><div className={ui.timelineHead}><h3 className={ui.timelineRole}>{job.role}</h3><span className={ui.timelinePeriod}>{job.period}</span></div><p className={ui.timelineOrg}>{job.org} · {job.place}</p>{job.points.length ? <ul className={ui.timelinePoints} style={{ marginTop: "var(--space-4)" }}>{job.points.map((point) => <li key={point}>{point}</li>)}</ul> : null}</article>)}</div></Section>
    <Section><SectionHead label="Education" title="Foundations" /><div className={ui.rows}><Row label={education.period}><div className={ui.rowBody}><p><strong style={{ color: "var(--text-primary)", fontWeight: 500 }}>{education.degree}</strong><br />{education.school} · {education.detail}</p></div></Row></div></Section>
    <Section><SectionHead label="Achievements" title="Worth logging" /><div className={ui.rows}>{achievements.map((item, i) => <Row key={item} label={String(i + 1).padStart(2, "0")}><div className={ui.rowBody}><p>{item}</p></div></Row>)}</div></Section>
    <Section><SectionHead label="Certifications" title="Paper trail" /><CertificateGrid items={certifications} /></Section>
    <NextStep
      href="/contact"
      label="Next · Open channel"
      title="The channel is open"
      premise="Product roles, platform work, or an argument about something on this site."
    />
  </>;
}
