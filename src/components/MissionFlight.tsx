"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Decode from "@/components/Decode";
import GalaxyNavigator from "@/components/GalaxyNavigator";
import LocalTime from "@/components/LocalTime";
import { Status } from "@/components/ui";
import type { Mission } from "@/content/types";
import { profile } from "@/content/profile";
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
  const beats = missions.length + 1;

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
            setBeat((b) => (Math.abs(raw - next) < 0.42 ? next : b));
          },
        });
        return () => st.kill();
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
            <GalaxyNavigator flightControlled flightTo={mission ? mission.slug : null} />
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

          <p className={styles.hint} aria-hidden="true">
            {beat === 0 ? "Scroll to fly" : `System ${String(beat).padStart(2, "0")} / ${String(missions.length).padStart(2, "0")}`}
          </p>
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
                {mission.signals.slice(0, 3).map((s) => (
                  <div key={s.label} className={styles.stat}>
                    <dt>{s.label}</dt>
                    <dd data-big={/\d/.test(s.value) || undefined}>{s.value}</dd>
                  </div>
                ))}
              </dl>

              <p className={styles.hudPremise}>{mission.premise}</p>

              {mission.cover ? (
                <div className={styles.callout}>
                  <span className={styles.calloutLine} aria-hidden="true" />
                  <div className={styles.hudCover}>
                    <Image src={mission.cover} alt="" fill sizes="420px" className={styles.hudImg} />
                    <span className={styles.hudTint} />
                    <span className={styles.hudScan} />
                    <span className={styles.coverTag}>
                      <span>Interface</span> shipped
                    </span>
                  </div>
                </div>
              ) : null}

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
            <div className={styles.hudInner}>
              <p className={styles.hudIdle}>
                <Decode>Mission control</Decode>
              </p>
              <p className={styles.hudPremise}>
                {missions.length} systems on the flight plan. Scroll to fly to the first.
              </p>
            </div>
          )}
        </aside>

        {/* Touch and reduced-motion: no pin, so the systems list is the flight. */}
        <ul className={styles.fallback}>
          {missions.map((m, i) => (
            <li key={m.slug}>
              <Link href={`/missions/${m.slug}`} className={styles.fallbackItem}>
                <span className={styles.hudIndex}>SYS&#8209;{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.fallbackTitle}>{m.title}</span>
                <span className={styles.hudPremise}>{m.premise}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
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
