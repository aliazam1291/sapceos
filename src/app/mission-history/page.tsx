import type { Metadata } from "next";
import Link from "next/link";
import CertificateGrid from "@/components/CertificateGrid";
import Comms from "@/components/Comms";
import PageForm from "@/components/space/PageForm";
import { NextStep, PageHeader, Row, Section, SectionHead, ui } from "@/components/ui";
import { achievements, certifications, education, experience } from "@/content/profile";

export const metadata: Metadata = {
  title: "Mission History — Resume & Experience",
  description:
    "Ali Azam Kazmi's work history: MapMyIndia (Product & Platform), Smaak.ux, Wise Work, Datamatics. B.Tech CSE, SRM (CGPA 8.76). Google UX and AWS certified.",
  alternates: { canonical: "/mission-history" },
};

export default function MissionHistoryPage() {
  return <><PageHeader label="Mission History" title="The log, in order" lede="Roles, dates, and what each one actually involved. The resume, without the resume formatting." figure={<PageForm form="satellite" label="A slowly turning wireframe satellite with two solar panels." size={240} />} />
    <div className={ui.pageComms}><Comms at="history" /></div>
    <Section id="experience" data-section="Experience"><SectionHead label="Experience" title="Where the time went" /><div className={ui.timeline}>{experience.map((job) => <article key={`${job.org}-${job.period}`} className={ui.timelineItem}><div className={ui.timelineHead}><h3 className={ui.timelineRole}>{job.role}</h3><span className={ui.timelinePeriod}>{job.period}</span></div><p className={ui.timelineOrg}>{"href" in job && job.href ? <Link href={job.href}>{job.org}</Link> : job.org} · {job.place}</p>{job.points.length ? <ul className={ui.timelinePoints} style={{ marginTop: "var(--space-4)" }}>{job.points.map((point) => <li key={point}>{point}</li>)}</ul> : null}</article>)}</div></Section>
    <Section id="education" data-section="Education"><SectionHead label="Education" title="Foundations" /><div className={ui.rows}><Row label={education.period}><div className={ui.rowBody}><p><strong style={{ color: "var(--text-primary)", fontWeight: 500 }}>{education.degree}</strong><br />{education.school} · {education.detail}</p></div></Row></div></Section>
    <Section id="achievements" data-section="Achievements"><SectionHead label="Achievements" title="Worth logging" /><div className={ui.rows}>{achievements.map((item, i) => <Row key={item} label={String(i + 1).padStart(2, "0")}><div className={ui.rowBody}><p>{item}</p></div></Row>)}</div></Section>
    <Section id="certifications" data-section="Certifications"><SectionHead label="Certifications" title="Paper trail" /><CertificateGrid items={certifications} /></Section>
    <NextStep
      href="/contact"
      label="Next · Open channel"
      title="The channel is open"
      premise="Product roles, platform work, or an argument about something on this site."
    />
  </>;
}
