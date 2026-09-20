import Link from "next/link";
import Beacons from "./Beacons";
import Comms from "./Comms";
import { Section, SectionHead } from "./ui";
import { decisions } from "@/content/decisions";
import styles from "./RulesLeg.module.scss";

/** The three rules the home page flies past; the other four are on /decisions. */
const HOME_RULES = ["states", "prd", "speed"];

/*
 * Leg 04 — how the operator decides. A product page that only shows
 * outputs is a portfolio of screens; this is the judgement, in the flow,
 * before the case studies. Three beacons on the left, the sky and the
 * ship on the right.
 */
export default function RulesLeg() {
  const items = HOME_RULES.map((id) => decisions.find((d) => d.id === id)!).filter(Boolean);
  return (
    <Section id="rules" data-section="Flight rules">
      <div className={styles.leg}>
        <SectionHead
          label="06 / Flight rules"
          title="How I decide"
          action={
            <Link href="/decisions" className={styles.all}>
              All seven rules &rarr;
            </Link>
          }
        />
        <Comms at="rules" className={styles.comms} />
        <div className={styles.route}>
          <Beacons items={items} compact />
        </div>
      </div>
    </Section>
  );
}
