import { ButtonLink, PageHeader, Section, ui } from "@/components/ui";
import styles from "./not-found.module.scss";

export const metadata = { title: "Lost signal" };

/*
 * The one page on the site written to be funny rather than useful, because it
 * is the one page where "useful" is already a lost cause — nobody arrives here
 * on purpose. A dry, deadpan diagnostics readout, in the same instrument-panel
 * register as everything else, rather than a cartoon astronaut or a pun about
 * being "lost in space". The joke is that the system is filing an honest,
 * over-formal incident report about a page that simply is not there.
 */

const LOG = [
  { t: "T+0.000s", msg: "Requested resource not found in local manifest." },
  { t: "T+0.014s", msg: "Checked under the couch cushions of the router." },
  { t: "T+0.031s", msg: "Confirmed: not a typo. Confirmed: not a redirect. Confirmed: not there." },
  { t: "T+0.400s", msg: "Filed as 404 rather than 'philosophical uncertainty', for consistency." },
];

export default function NotFound() {
  return (
    <>
      <PageHeader
        label="404 · Lost signal"
        title="Nothing at these coordinates"
        lede="The page either moved or never existed. The system checked twice."
      />
      <Section>
        <ul className={styles.log} aria-hidden="true">
          {LOG.map((l) => (
            <li key={l.msg}>
              <span className={styles.time}>{l.t}</span>
              {l.msg}
            </li>
          ))}
        </ul>

        <div className={ui.buttonRow}>
          <ButtonLink href="/" primary>
            Return to Mission Control
          </ButtonLink>
          <ButtonLink href="/missions">Browse missions</ButtonLink>
        </div>
      </Section>
    </>
  );
}
