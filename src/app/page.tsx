import type { Metadata } from "next";
import HeroStage from "@/components/HeroStage";
import MagneticButton from "@/components/MagneticButton";
import Counter from "@/components/Counter";
import LocalTime from "@/components/LocalTime";
import MissionRow, { MissionList } from "@/components/MissionRow";
import Bento from "@/components/Bento";
import Fragments from "@/components/Fragments";
import MissionSequence from "@/components/space/MissionSequence";
import Spotlight from "@/components/space/Spotlight";
import GalaxyNavigator from "@/components/GalaxyNavigator";
import { ButtonLink, Section, SectionHead, Status, ui } from "@/components/ui";
import { featuredMissions } from "@/content/missions";
import { profile } from "@/content/profile";
import styles from "./home.module.scss";

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.title}`,
  description:
    "Mission Control for a curious builder. Fleet, telematics and platform products — frontend, UX and product ownership.",
  alternates: { canonical: "/" },
};

/*
 * Section order is set by how a recruiter actually reads this page, not by how
 * the argument would flow in an essay.
 *
 * The method sequence used to sit between the proof numbers and the work. It is
 * pinned for four beats, which is five viewport-heights of scrolling — so
 * anyone scanning the page hit five screens of abstract product philosophy
 * before seeing a single thing that had been built. Someone giving the site
 * forty seconds left before the evidence.
 *
 * Now: claim (hero) -> proof (numbers) -> the work -> only then how the work
 * runs -> contact. The method section still earns its place; it just answers
 * "why should I believe this" after there is something to believe, rather than
 * asking for patience up front.
 */
export default function Home() {
  return (
    <>
      {/* Hero text is server-rendered; the field mounts after idle so the
          headline stays the LCP element. */}
      <section id="arrival" data-section="Arrival" className={styles.hero}>
        {/* Tighter and dimmer than it was. At 92vw x 120vh and 0.16 alpha this
              stopped being a spotlight and became a green fog over the whole
              hero — the ground is meant to be #050505, and a wash that lifts it
              everywhere is why the section read as murky rather than deep. */}
          <Spotlight
            className="left-[-8%] top-[-26%] h-[86vh] w-[62vw] md:left-[4%] md:w-[48vw]"
            from="rgba(34,208,178,0.10)"
          />
        <HeroStage>
          {/*
            Set to the viewport, not to a column.
            The headline used to sit in a ~40% grid cell beside the galaxy, at
            three lines with two of them entirely in accent. Measured against
            the reference this was timid twice over: the type never reached the
            scale that makes a wordmark read as a wordmark, and accent covering
            two whole lines left nothing for the eye to land ON — the hierarchy
            rule in DESIGN_DIRECTION.md asks for one primary accent event per
            screen, not an accent paragraph.
            Now: two lines, full-bleed, with the accent carrying a single
            phrase. The galaxy moves behind the type rather than beside it.
          */}
          <div className={styles.heroInner}>
            <p className={styles.heroLabel} data-boot="status">
              <Status>Product engineer</Status>
              <span>{profile.location}</span>
              <LocalTime />
            </p>

            <h1 className={styles.heroTitle} data-boot="mask">
              <span className={styles.maskLine}>
                <span>Digital products</span>
              </span>
              <span className={styles.maskLine}>
                <span>
                  with a point <span className={styles.heroAccent}>of view.</span>
                </span>
              </span>
            </h1>

            <div className={styles.heroRule} data-boot="rule" />

            {/* Statement, mono counterweight, action — one band across the
                foot of the hero, so the headline above it is uninterrupted. */}
            <div className={styles.heroFoot}>
              <p className={styles.heroLede} data-boot="lede">
                I turn complex operational work into clear products — from the first sketch to
                the interface people rely on every day.
              </p>

              <p className={styles.heroSpec}>{profile.oneLine}</p>

              <div className={ui.buttonRow} data-boot="cta">
                <MagneticButton href="/missions" primary>
                  View missions &rarr;
                </MagneticButton>
                <MagneticButton href="/contact">Open a channel</MagneticButton>
              </div>
            </div>

            <div className={styles.heroPanel} data-boot="panel">
              <GalaxyNavigator />
            </div>
          </div>
        </HeroStage>

      </section>

      <div id="signals" data-section="Signals" className={styles.readout}>
        <div className={styles.readoutInner}>
          <div className={styles.readoutItem}>
            <span className={styles.readoutLabel}>Users reached</span>
            <span className={styles.readoutValue}>
              <Counter value={200000} suffix="+" />
            </span>
            <span className={styles.readoutNote}>Vahan Shakti</span>
          </div>
          <div className={styles.readoutItem}>
            <span className={styles.readoutLabel}>Vehicles monitored</span>
            <span className={styles.readoutValue}>
              <Counter value={20000} suffix="+" />
            </span>
            <span className={styles.readoutNote}>Locate · Maharashtra</span>
          </div>
          <div className={styles.readoutItem}>
            <span className={styles.readoutLabel}>Routes injected</span>
            <span className={styles.readoutValue}>
              <Counter value={30000} suffix="+" />
            </span>
            <span className={styles.readoutNote}>IOCL GeoRTD</span>
          </div>
          <div className={styles.readoutItem}>
            <span className={styles.readoutLabel}>Dashboard speed-up</span>
            <span className={styles.readoutValue}>
              ~<Counter value={40} suffix="%" />
            </span>
            <span className={styles.readoutNote}>Caching · RxJS · API work</span>
          </div>
        </div>
      </div>

      <Section id="missions" data-section="Missions">
        <SectionHead
          label="01 / Missions"
          title="Problems, and what happened next"
          action={<ButtonLink href="/missions">All missions</ButtonLink>}
        />
        <MissionList>
          {featuredMissions.map((m, i) => (
            <MissionRow key={m.slug} mission={m} index={i} />
          ))}
        </MissionList>
      </Section>

      {/* Breadth, immediately after the three highlights. A visitor who has
          just seen the featured missions should learn how much else there is
          before being asked to read about method. */}
      <Fragments />

      <MissionSequence />

      <Section id="approach" data-section="Operating loop">
        <SectionHead label="04 / Operating loop" title="How the work actually runs" />
        <Bento />
      </Section>

      <div id="channel" data-section="Open channel" className={styles.closing}>
        <p className={ui.labelRule}>05 / Open channel</p>
        <h2 className={styles.closingTitle}>Bring a problem worth arguing about.</h2>
        <p className={ui.lede}>
          Product roles, platform work, or a question about anything above. The channel is open.
        </p>
        <div className={ui.buttonRow}>
          <MagneticButton href="/contact" primary>
            Open a channel
          </MagneticButton>
          <MagneticButton href="/mission-history">Mission history</MagneticButton>
        </div>
      </div>
    </>
  );
}
