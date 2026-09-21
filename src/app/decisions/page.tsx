import type { Metadata } from "next";
import Beacons from "@/components/Beacons";
import PageForm from "@/components/space/PageForm";
import { NextStep, PageHeader, Section, ui } from "@/components/ui";
import { decisions } from "@/content/decisions";
import { breadcrumbJsonLd, jsonLd } from "@/lib/seo";
import Comms from "@/components/Comms";

export const metadata: Metadata = {
  title: { absolute: "Flight Rules — Product Decisions · Ali Azam Kazmi" },
  description:
    "Seven product management principles Ali Azam Kazmi used on shipped work — states before screens, PRDs early, manual processes replaced — each with evidence.",
  alternates: { canonical: "/decisions" },
};

/**
 * The flight rules — how the operator decides. A page of judgement, not
 * screens: one beacon per rule, each with the fact it came from. The
 * case studies show other products; this is the thinking on his own.
 */
export default function DecisionsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Flight rules", path: "/decisions" },
            ]),
          ),
        }}
      />
      <PageHeader
        label="Flight rules"
        title="How I decide"
        lede="Seven calls, each with the fact it came from. What I did when the answer was not in the spec."
        figure={<PageForm form="probe" label="A slowly turning wireframe probe." size={240} />}
      />
      <div className={ui.pageComms}>
        <Comms at="decisions" />
      </div>
      <Section>
        <Beacons items={decisions} headingLevel="h2" />
      </Section>
      <NextStep
        href="/missions"
        label="Next · Missions"
        title="Where the rules were applied"
        premise="The missions, with what was decided, built and carried with the team on each."
      />
    </>
  );
}
