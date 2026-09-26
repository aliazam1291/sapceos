import type { Metadata } from "next";
import Link from "next/link";
import Comms from "@/components/Comms";
import PageForm from "@/components/space/PageForm";
import { ButtonLink, NextStep, PageHeader, Section, SectionHead, ui } from "@/components/ui";
import { plainName } from "@/content/pages";
import { faqs } from "@/content/faq";
import { breadcrumbJsonLd, faqJsonLd, jsonLd } from "@/lib/seo";
import { identityKeywords, keywordsFor, roleKeywords } from "@/lib/keywords";
import styles from "./faq.module.scss";

/*
 * Common questions (2026-09-24). Ali: "we need a FAQ page, I think that
 * will help to get more SEO."
 *
 * The premise needed correcting and the correction shaped the page: Google
 * deprecated FAQ rich results on 7 May 2026, so this earns no dropdown in
 * the results list. What it does earn is (a) a recruiter's screening
 * questions answered before they have to ask, and (b) grounding for answer
 * engines, which do read structured Q&A and are where a growing share of
 * "what has this person built" queries now land.
 *
 * Text-only content, so: a panel of rows, no object per question. The
 * station is the page's one object — a relay where questions come in.
 */

const description =
  "Straight answers about Ali Azam Kazmi: the roles he is after, why an engineer is moving into product management, what he has shipped, and what was measured.";

export const metadata: Metadata = {
  title: { absolute: "Questions & Answers · Ali Azam Kazmi, Product Manager" },
  description,
  keywords: keywordsFor(
    ["hire Ali Azam Kazmi", "engineer to product manager", "product manager questions", "what has Ali Azam Kazmi built"],
    identityKeywords,
    roleKeywords.slice(0, 8),
  ),
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "website",
    title: "Questions & Answers — Ali Azam Kazmi",
    description,
    url: "/faq",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ali Azam Kazmi — Space OS" }],
  },
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            faqJsonLd(faqs),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Questions", path: "/faq" },
            ]),
          ),
        }}
      />
      <PageHeader
        label="Ground control"
        plain={plainName["/faq"]}
        title="The questions, answered"
        lede="What a first call usually opens with. Answered here so nobody has to ask, and so the answers are the same every time."
        figure={<PageForm form="station" label="A slowly turning wireframe relay station." size={240} />}
      />
      <div className={ui.pageComms}>
        <Comms at="faq" />
      </div>

      <Section id="questions" data-section="Questions">
        <SectionHead
          label={`${faqs.length} on file`}
          title="Straight answers"
          action={
            <p className={ui.sectionNote}>
              Every answer here is a fact from the same record the rest of the site is built from. Where something has
              not been measured, it says so.
            </p>
          }
        />

        {/* Rows, not cards. Each question is an h2 so the page has a real
            outline — and so an answer engine can attribute one cleanly. */}
        <dl className={styles.list}>
          {faqs.map((f) => (
            <div key={f.q} className={styles.row} data-reveal>
              <dt className={styles.q}>
                <h2 className={styles.qText}>{f.q}</h2>
              </dt>
              <dd className={styles.a}>
                {f.a.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {f.more ? (
                  f.more.href.startsWith("/") && !f.more.href.endsWith(".pdf") ? (
                    <Link href={f.more.href} className={styles.more}>
                      {f.more.label} <span aria-hidden="true">&rarr;</span>
                    </Link>
                  ) : (
                    <a href={f.more.href} className={styles.more} target="_blank" rel="noreferrer noopener">
                      {f.more.label} <span aria-hidden="true">↗</span>
                    </a>
                  )
                ) : null}
              </dd>
            </div>
          ))}
        </dl>

        <div className={ui.buttonRow} data-reveal>
          <ButtonLink href="/contact" primary>
            Ask something else
          </ButtonLink>
          <ButtonLink href="/Ali_Azam_Kazmi_.pdf" external>
            Résumé (PDF)
          </ButtonLink>
        </div>
      </Section>

      <NextStep
        href="/missions"
        label="Next · Missions"
        title="The work the answers refer to"
        premise="Ten products, each with the problem, the decisions, and whether anything was measured."
      />
    </>
  );
}
