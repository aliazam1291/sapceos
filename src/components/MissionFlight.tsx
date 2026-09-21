"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Decode from "@/components/Decode";
import Comms from "@/components/Comms";
import ScanReadout from "@/components/ScanReadout";
import GalaxyNavigator from "@/components/GalaxyNavigator";
import LocalTime from "@/components/LocalTime";
import { Status } from "@/components/ui";
import type { Mission } from "@/content/types";
import { profile, proof } from "@/content/profile";
import styles from "./MissionFlight.module.scss";

/**
 * The landing screen and the selected work, as one flight.
 *
 * The galaxy fills the frame and the section pins. Scrolling is the throttle:
 * the first beat is the overview, then each beat flies the camera to the
 * next featured mission's system and a HUD docks beside it — the real
 * screenshot, the claim, the number, a way in. Scroll back and you fly back.
 *
 * This replaces a horizontal strip of cards. A card is a thing you look AT;
 * this is a place you arrive. Same content, no cards.
 *
 * Pins the inner stage, not the section (the section itself must stay React-owned or client navigation throws removeChild).
 */
export default function MissionFlight({ missions }: { missions: Mission[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [beat, setBeat] = useState(0);
  // The last few percent of the pin: the flight is over and the ship climbs
  // out to where the companion picks it up (top right).
  const [leaving, setLeaving] = useState(false);
  const beats = missions.length + 1;
  // Where the scroll wants to be; the shown beat walks toward it one system
  // at a time on a clock, so a fast flick still flies past every world
  // instead of cutting straight to the last one.
  const wantBeat = useRef(0);
  const shownBeat = useRef(0);
  const beatAt = useRef(0);

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled || !sectionRef.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();

      mm.add("(min-width: 769px) and (prefers-reduced-motion: no-preference)", () => {
        const section = sectionRef.current;
        if (!section) return;
        const stage = section.querySelector<HTMLElement>("[data-pin]") ?? section;
        const st = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          // One viewport per beat, with a little extra dwell on each.
          end: () => `+=${window.innerHeight * (beats - 1) * 1.15}`,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Snap progress to beats with a dead zone, so the camera commits
            // to a system rather than flickering between two mid-scroll.
            const raw = self.progress * (beats - 1);
            const next = Math.round(raw);
            if (Math.abs(raw - next) < 0.42) wantBeat.current = next;
            setLeaving(self.progress > 0.965);
          },
        });
        // The pacer: one step toward the wanted beat, never sooner than the
        // dwell after the last step. A reader who stops sees it catch up.
        const DWELL = 900;
        let raf = 0;
        const pace = (now: number) => {
          raf = requestAnimationFrame(pace);
          const cur = shownBeat.current;
          const want = wantBeat.current;
          if (cur === want || now - beatAt.current < DWELL) return;
          shownBeat.current = cur + Math.sign(want - cur);
          beatAt.current = now;
          setBeat(shownBeat.current);
        };
        raf = requestAnimationFrame(pace);
        return () => {
          cancelAnimationFrame(raf);
          st.kill();
        };
      });
      ctx = mm;
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [beats]);

  const mission = beat > 0 ? missions[beat - 1] : null;

  return (
    <section id="arrival" data-section="Arrival" className={styles.section} ref={sectionRef}>
      <div className={styles.stage} data-pin>
        <div className={styles.field} aria-hidden="true">
          <div className={styles.fieldInner}>
            <GalaxyNavigator flightControlled flightTo={mission ? mission.slug : null} flightLeaving={leaving} />
          </div>
        </div>

        <div className={styles.chrome}>
          <p className={styles.label}>
            <Status>
              <Decode delay={200}>Product engineer</Decode>
            </Status>
            <Decode delay={500}>{profile.name}</Decode>
            <Decode delay={800}>{profile.location}</Decode>
            <LocalTime />
          </p>
          <h1 className={styles.srOnly}>
            {profile.name} — {profile.title}. Digital products with a point of view.
          </h1>

          {/* Flight plan — the beat track. Clicking a stop is a request; the
              scroll is still the throttle, so it scrolls the page there. */}
          <ol className={styles.plan} aria-label="Flight plan">
            <li>
              <button
                type="button"
                className={styles.stop}
                data-on={beat === 0 || undefined}
                onClick={() => scrollToBeat(sectionRef.current, 0, beats)}
              >
                <i /> <span>Overview</span>
              </button>
            </li>
            {missions.map((m, i) => (
              <li key={m.slug}>
                <button
                  type="button"
                  className={styles.stop}
                  data-on={beat === i + 1 || undefined}
                  data-done={beat > i + 1 || undefined}
                  onClick={() => scrollToBeat(sectionRef.current, i + 1, beats)}
                >
                  <i /> <span>{m.title.split(" — ")[0]}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className={styles.foot}>
            {/* The opener: who this is and why to keep reading, on screen
                before anything moves. Dissolves once the flight starts. */}
            <div className={styles.opener} data-away={beat > 0 || undefined}>
              <p className={styles.openerPitch}>
                <Decode delay={1100}>{profile.oneLine}</Decode>
              </p>
              <p className={styles.openerLine}>
                {profile.title} &middot; targeting product roles &middot; {profile.location}
              </p>
              <p className={styles.openerLine}>
                <Link href="/dumbmoney" className={styles.openerVenture}>
                  Founder &amp; CPO, DumbMoney <span aria-hidden="true">&rarr;</span>
                </Link>
              </p>
              <p className={styles.openerProof}>
                <span>{proof.value}</span> {proof.label}
              </p>
            </div>

            <p className={styles.hint} aria-hidden="true">
              {beat === 0 ? "Scroll to fly" : `System ${String(beat).padStart(2, "0")} / ${String(missions.length).padStart(2, "0")}`}
            </p>
            {/* The 30-second path: past the flight, straight to the deck. */}
            <a href="#hangar" className={styles.skip} data-away={beat > 0 || undefined} title="The ship will understand.">
              Skip the flight &darr;
            </a>
          </div>
        </div>

        {/* The HUD: docks when a system is reached. */}
        <aside className={styles.hud} data-on={mission ? "" : undefined} aria-live="polite">
          {mission ? (
            <div className={styles.hudInner} key={mission.slug}>
              {/* Bracket corners — the registration marks of a targeting panel. */}
              <i className={styles.bracket} data-c="tl" />
              <i className={styles.bracket} data-c="tr" />
              <i className={styles.bracket} data-c="bl" />
              <i className={styles.bracket} data-c="br" />

              <div className={styles.hudHead}>
                <span className={styles.hudIndex}>SYS&#8209;{String(beat).padStart(2, "0")}</span>
                <span className={styles.hudStatus} data-status={mission.status}>
                  <i /> {mission.status}
                </span>
              </div>

              <h2 className={styles.hudTitle}>
                <Decode duration={500}>{mission.title}</Decode>
              </h2>

              {/* Stat strip: the numbers a planet card would carry. */}
              <dl className={styles.stats}>
                {mission.signals.slice(0, 2).map((s) => (
                  <div key={s.label} className={styles.stat}>
                    <dt>{s.label}</dt>
                    <dd data-big={/\d/.test(s.value) || undefined}>
                      {/* Read on arrival: the number counts up as the ship scans the world. */}
                      {/\d/.test(s.value) ? <ScanReadout value={s.value} /> : s.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className={styles.hudFoot}>
                <p className={styles.hudOwned}>
                  <span>Owned</span> {mission.role}
                </p>
                <Link href={`/missions/${mission.slug}`} className={styles.hudLink}>
                  Open the report &rarr;
                </Link>
              </div>
            </div>
          ) : (
            // Beat 0: mission control, in the air the HUD will dock into.
            <Comms at="boarding" className={styles.comms} delay={1600} />
          )}
        </aside>

      </div>

      {/* Phones and reduced motion: no pin, so the galaxy is the first screen
          and the systems are the list under it — an app list (2026-09-22:
          index, title, one line, a chevron; hairlines, no cards), not five
          panels floating over a stretched canvas. */}
      {/* data-nojs: the layout's <noscript> style shows this list when the
          script never arrives — without JS the pinned flight cannot fly and
          the five featured missions were unreachable on a desktop. */}
      <ul className={styles.fallback} data-nojs aria-label="Featured systems">
        <li className={styles.fallbackHead} aria-hidden="true">
          <span className={styles.hudIndex}>Systems</span>
          <span>{String(missions.length).padStart(2, "0")} on the route</span>
        </li>
        {missions.map((m, i) => (
          <li key={m.slug}>
            <Link href={`/missions/${m.slug}`} className={styles.fallbackItem}>
              <span className={styles.hudIndex}>SYS&#8209;{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.fallbackBody}>
                <span className={styles.fallbackTitle}>{m.title}</span>
                <span className={styles.hudPremise}>{m.premise}</span>
              </span>
              <span className={styles.fallbackGo} aria-hidden="true">
                &#8250;
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function scrollToBeat(section: HTMLElement | null, beat: number, beats: number) {
  if (!section) return;
  // The pin-spacer lives INSIDE the section (we pin the stage), so the
  // section's own top is where the flight starts.
  const top = section.getBoundingClientRect().top + window.scrollY;
  const per = window.innerHeight * 1.15;
  window.scrollTo({ top: top + per * beat + 2, behavior: "smooth" });
}
