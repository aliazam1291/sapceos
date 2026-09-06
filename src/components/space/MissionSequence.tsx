"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { activeStop, STOP_SCROLL, STOPS, sequence } from "@/lib/sequence";
import { missions } from "@/content/missions";
import MissionSignature from "@/components/MissionSignature";

type GsapModules = {
  gsap: typeof import("gsap")["gsap"];
  ScrollTrigger: typeof import("gsap/ScrollTrigger")["ScrollTrigger"];
};
import styles from "./MissionSequence.module.scss";

const CardGallery = dynamic(() => import("./CardGallery"), {
  ssr: false,
  loading: () => null,
});

/**
 * The cinematic beat of the site: one pinned screen the reader scrubs through.
 *
 * Technique is GSAP ScrollTrigger pin + scrub rather than drei's ScrollControls,
 * because this is a 3D moment *inside* a normal scrolling document — the rest of
 * the page has to keep behaving like a page. ScrollTrigger writes a plain object
 * (`sequence.p`); the R3F loop reads it and damps toward it. Neither system ever
 * writes the same property, which is what keeps them from fighting.
 *
 * Progressive enhancement is the whole design here. Server-render is the static
 * fallback: four stacked articles and a CSS orbit, no canvas, fully readable.
 * `data-live` is attached only once GSAP has loaded and reduced motion is off,
 * and the tall pinned track plus the WebGL scene exist only in that state.
 */

/*
 * The beats ARE the missions.
 *
 * This used to be a hand-written array of four abstract stages — "Approach",
 * "Orbit insertion", "Surface scan", "Handoff" — with invented telemetry
 * ("RANGE 6.2 AU") beside them. Three and a half screens of the most expensive
 * scroll on the site, spent on saying nothing that could be checked.
 *
 * Now every mission gets a stop, not just the five featured ones — the flight
 * is the showcase, and a showcase that skips half the work undersells it.
 * `STOPS` in sequence.ts is kept at 10 to match; if the mission count ever
 * changes, that constant and this array drift out of sync in a way TypeScript
 * cannot catch, so tools/spiralfit.mjs and tools/beatfit.mjs both assert the
 * pinned track still fits after any change to either.
 */
const beats = missions.map((m) => ({
  id: m.slug,
  label: m.org,
  title: m.title,
  body: m.premise,
  href: `/missions/${m.slug}`,
  role: m.role,
  period: m.period,
  stack: m.stack,
  signals: m.signals ?? [],
}));

export default function MissionSequence() {
  const section = useRef<HTMLElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const [beat, setBeat] = useState(0);
  const [live, setLive] = useState(false);
  // Which mission a click (or keyboard focus, via the sr-only nav below) has
  // pinned the camera on. Separate from `beat`, which is purely a function of
  // scroll — CardGallery owns the decision to stop following scroll while a
  // card is selected, this component only needs to know WHICH one to show in
  // the text band. Cleared by CardGallery itself once scroll drifts far
  // enough, so there is never a scroll-hijack state this component has to undo.
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const selectedIndex = selectedSlug ? beats.findIndex((b) => b.id === selectedSlug) : -1;
  const activeIndex = selectedIndex >= 0 ? selectedIndex : beat;

  const faces = useMemo(
    () =>
      beats.map((b) => ({
        slug: b.id,
        title: b.title,
        org: b.label,
        period: b.period,
        signal: b.signals[0]?.value,
      })),
    [],
  );
  /*
   * True only while ScrollTrigger actually has the screen pinned.
   *
   * The band, rail and flight plan are positioned against `.screen`, which is
   * 100vh. Before the pin engages that box is still scrolling with the page, so
   * anything anchored to its bottom sits below the fold and gets sliced by the
   * viewport — the section looked broken for the whole approach. The chrome now
   * waits for the pin; the flight itself stays visible throughout, so the
   * readout arrives over a scene that is already there.
   */
  const [pinned, setPinned] = useState(false);

  // Two effects on purpose.
  //
  // ScrollTrigger's pin freezes an INLINE height on the pinned element, taken
  // at the moment it is created. If it is created in the same tick that flips
  // `live`, React has not yet painted the live layout, so it measures the
  // fallback (four stacked beats, ~2100px) and pins that height forever — the
  // stage ends up far below the fold. Loading GSAP and creating the trigger are
  // therefore split, so the second effect only runs once `live` is committed to
  // the DOM and the one-screen layout is real.
  const gsapRef = useRef<GsapModules | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = section.current;
    if (!el) return;

    let disposed = false;

    /*
     * Gated by proximity, not by mount.
     *
     * This used to fire the moment the component mounted, with no regard for
     * where the reader actually was — measured, GSAP and the MissionFlight
     * WebGL chunk were both loading, and the flight's canvas had created its
     * GL context, within ~3.7s of ANY page load, while the section itself sat
     * 4000px below the viewport. DESIGN_DIRECTION.md is explicit that three.js
     * must be "gated behind idle and/or intersection" and caps live WebGL
     * contexts at two; this was quietly spending one on a section nobody had
     * scrolled near yet.
     *
     * A wide rootMargin starts the load a full screen early, so it is still
     * ready by the time the reader arrives — this is a proximity gate, not a
     * lazy-render that would show a blank pin.
     */
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        (async () => {
          const [{ gsap }, { ScrollTrigger }] = await Promise.all([
            import("gsap"),
            import("gsap/ScrollTrigger"),
          ]);
          if (disposed) return;
          gsap.registerPlugin(ScrollTrigger);
          gsapRef.current = { gsap, ScrollTrigger };
          setLive(true);
        })();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);

    return () => {
      disposed = true;
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    const mods = gsapRef.current;
    const el = section.current;
    if (!live || !mods || !el) return;

    const { gsap, ScrollTrigger } = mods;
    let raf = 0;
    let ctx: { revert: () => void } | undefined;

    // One more frame so layout has settled before anything is measured.
    raf = requestAnimationFrame(() => {
      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: `+=${STOPS * STOP_SCROLL}%`,
          pin: screen.current,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onToggle: (self) => setPinned(self.isActive),
          onUpdate: (self) => {
            // Store only. The scene damps toward this in its own frame loop.
            sequence.p = self.progress;
            setBeat((prev) => {
              const next = activeStop(self.progress);
              return next === prev ? prev : next;
            });
          },
        });
      }, el);

      ScrollTrigger.refresh();
    });

    return () => {
      cancelAnimationFrame(raf);
      ctx?.revert();
      sequence.p = 0;
    };
  }, [live]);

  return (
    <section
      ref={section}
      id="method"
      data-section="The work"
      className={styles.sequence}
      data-live={live || undefined}
      aria-label="A flight through the missions"
    >
      <div
        ref={screen}
        className={styles.screen}
        data-live={live || undefined}
        data-pinned={pinned || undefined}
      >
        <div className={styles.stage} data-live={live || undefined}>
          {live ? (
            /*
             * No role="img" here. That description used to duplicate the
             * sr-only <nav> below it — a WebGL canvas announces nothing on its
             * own, so describing the picture AND publishing the real,
             * operable list is telling assistive tech about the same thing
             * twice. The canvas is aria-hidden inside CardGallery; the nav is
             * the one description that exists.
             */
            <div className={styles.canvas}>
              <CardGallery faces={faces} onFocusChange={setSelectedSlug} />
            </div>
          ) : (
            // Static fallback: a CSS orbit, no canvas, no WebGL.
            <div className={styles.cssOrbit} aria-hidden="true">
              <span />
              <i />
              <b />
            </div>
          )}

        </div>

          {/*
            The real, operable version of the flight — see the comment on the
            canvas above. Focus (tab) and click both select and pin the camera,
            the identical result a mouse click on a card gives, so a keyboard
            user gets the same experience rather than a text consolation prize.
            Pattern lifted from InteractiveGalaxy's own sr-only node list.
          */}
          {live && (
            <nav className={styles.srOnly} aria-label="Missions in this flight">
              <ul>
                {beats.map((b, i) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      aria-current={activeIndex === i ? "true" : undefined}
                      onFocus={() => setSelectedSlug(b.id)}
                      onClick={() =>
                        setSelectedSlug((prev) => (prev === b.id ? null : b.id))
                      }
                    >
                      {b.title} — {b.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Top rail. The live screen is a full 100vh with a vertically centred
              column of copy in it, so the top and bottom thirds were simply
              empty — the composition read as two objects floating with a lot of
              black between them. The column now has a header and a footer
              registered to the same left edge as the text, which is what gives
              it structure instead of just centring. */}
          <div className={styles.rail} aria-hidden="true">
            <span className={styles.hudTag}>03 / The work, in flight</span>
            <span className={styles.railLine} />
          </div>

          <div className={styles.hud} aria-hidden="true">
            {live && (
              <>
                {/* The route, named. Five identical dashes told you how far in
                    you were and nothing about where you were going; this is the
                    flight plan, with the current stop lit. */}
                <ol className={styles.itinerary}>
                  {beats.map((b, i) => (
                    <li
                      key={b.id}
                      data-on={i === activeIndex || undefined}
                      data-done={i < activeIndex || undefined}
                    >
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      {b.title}
                    </li>
                  ))}
                </ol>
                <span className={styles.hudCount}>
                  {String(activeIndex + 1).padStart(2, "0")} <i>/ 0{beats.length}</i>
                </span>
              </>
            )}
          </div>

        <div className={styles.copy} data-live={live || undefined}>
          {beats.map((b, i) => (
            <article
              key={b.id}
              className={styles.beat}
              data-on={i === activeIndex || undefined}
              data-selected={i === selectedIndex || undefined}
              aria-hidden={live && i !== activeIndex ? true : undefined}
            >
              {/* Only present while a click (or sr-only focus) has pinned this
                  card. Scrolling on clears the selection itself, so this is
                  the deliberate early exit, not the only one. */}
              {i === selectedIndex && (
                <button
                  type="button"
                  className={styles.beatClose}
                  onClick={() => setSelectedSlug(null)}
                >
                  &times; Resume flight
                </button>
              )}
              {/* No number here. It used to print "01 APPROACH" directly under
                  a section labelled "02 / Method" — two counters running at
                  once — and the readout at the foot of the column already says
                  which beat of four this is. */}
              {/* The story is ONE column, wrapped.
                  It used to be four loose children with the readout spanning
                  `grid-row: 1 / -1` beside them — but in a grid with only
                  implicit rows, `-1` resolves to line 1, so the span collapsed
                  and the numbers sat on top of the band instead of beside it. */}
              <div className={styles.beatStory}>
              {/* Same card face the 3D flight shows, server-rendered as SVG.
                  Hidden once the live cross-fade takes over (see
                  .copy[data-live] .beatSignature in the stylesheet) so it
                  exists for exactly the audience that needs it: reduced
                  motion, no JS, and search engines — never a duplicate next
                  to the WebGL card. */}
              <MissionSignature seed={b.id} width={220} height={72} className={styles.beatSignature} />
              <p className={styles.beatLabel}>{b.label}</p>
              <h2 className={styles.beatTitle}>{b.title}</h2>
              <p className={styles.beatBody}>{b.body}</p>
              {/* Each stop is a real report, so it gets a way in. Without this
                  the flight shows you the work and then strands you. */}
              <Link href={b.href} className={styles.beatLink}>
                Open the report &rarr;
              </Link>
              </div>

              {/* A readout, not a sentence. The signals used to run as one dim
                  inline line that the eye skipped; as labelled cells they read
                  as instrument values, which is what they are. */}
              <dl className={styles.readout}>
                {b.signals.map((sig) => (
                  <div key={sig.label}>
                    <dt>{sig.label}</dt>
                    <dd>{sig.value}</dd>
                  </div>
                ))}
                <div>
                  <dt>Period</dt>
                  <dd>{b.period}</dd>
                </div>
              </dl>

              {/* Role and stack were already in the data and shown nowhere on
                  the home page. This is the part that answers "what did HE
                  actually do here". */}
              <dl className={styles.spec}>
                <div>
                  <dt>Role</dt>
                  <dd>{b.role}</dd>
                </div>
                <div>
                  <dt>Stack</dt>
                  <dd>{b.stack.join(" · ")}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
