"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/spaceSound";
import styles from "./FaxTerminal.module.scss";

/**
 * The paper relay (2026-10-28, Ali: "download my resume like a 3D design
 * where the user needs to swipe on something … and it comes out as a fax").
 *
 * A CSS-3D machine, not a WebGL canvas: a box of transformed faces costs no
 * shader compile and no frame loop, so it can sit on any page. Swipe the
 * visitor pass through the reader, the display clears it, the sheet feeds
 * out of the slot a line at a time (steps()), and the PDF downloads. A tap
 * or Enter glides the pass through for you — the swipe is the fun, never a
 * gate — and the plain "Résumé (PDF)" button always sits beside it.
 *
 * Reduced motion: no glide, no feed; the sheet is simply there and the PDF
 * downloads. The sheet is decorative and aria-hidden, nothing on it under the
 * 11px phone floor.
 *
 * Redrawn 2026-10-31 (Ali: "make this look better"): the sheet prints the
 * real header and the measured numbers the page passes in (the rest of it is
 * bars); the machine got a keypad, an etched plate, screws and a pad to
 * stand on; the thermal head in the slot glows red while it prints (red is
 * heat); the pass is an ID card — contact chip, a sheen that moves as you
 * drag it, the magnetic stripe riding the reader's groove.
 */

export type FaxSheet = {
  name: string;
  role: string;
  place: string;
  numbers: { value: number; suffix?: string; label: string; note?: string }[];
};

const figure = (n: FaxSheet["numbers"][number]) => `${n.value.toLocaleString("en-US")}${n.suffix ?? ""}`;

const PDF = "/Ali_Azam_Kazmi_.pdf";
const FEED_MS = 2400;

type State = "idle" | "reading" | "noread" | "cleared" | "printing" | "done";

const LCD: Record<State, string> = {
  idle: "Ready · swipe pass to print CV",
  reading: "Reading pass…",
  noread: "No read · swipe all the way",
  cleared: "Clearance OK · recruiter",
  printing: "Receiving 1 page…",
  done: "Printed · PDF downloaded",
};

export default function FaxTerminal({ sheet }: { sheet: FaxSheet }) {
  const [state, setState] = useState<State>("idle");
  const [run, setRun] = useState(0); // remounts the sheet so a reprint feeds again
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const drag = useRef<{ x0: number; pos: number; max: number; moved: boolean } | null>(null);
  // A drag ends in a click event too; this swallows it so a short swipe
  // reads "no read" instead of gliding through anyway.
  const swallowClick = useRef(false);
  const timers = useRef<number[]>([]);
  const stateRef = useRef<State>("idle");
  stateRef.current = state;

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const reduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setPos = (px: number, glide = false) => {
    const card = cardRef.current;
    if (!card) return;
    if (glide) card.dataset.glide = "";
    else delete card.dataset.glide;
    card.style.setProperty("--x", `${px}px`);
  };

  const maxTravel = () => {
    const track = trackRef.current;
    const card = cardRef.current;
    if (!track || !card) return 0;
    return Math.max(0, track.clientWidth - card.offsetWidth);
  };

  const print = useCallback(() => {
    setState("cleared");
    sfx("ping");
    const r = reduced();
    later(() => {
      setRun((n) => n + 1);
      setState("printing");
      sfx("log");
      if (!r) for (let i = 1; i < 6; i++) later(() => sfx("tick"), i * (FEED_MS / 6));
    }, r ? 0 : 650);
    later(() => {
      setState("done");
      // The swipe was the gesture; the download rides on it.
      linkRef.current?.click();
    }, r ? 50 : 650 + FEED_MS + 150);
  }, []);

  const busy = () => stateRef.current === "cleared" || stateRef.current === "printing";

  const glideThrough = () => {
    if (busy()) return;
    const max = maxTravel();
    if (reduced()) {
      print();
      return;
    }
    setState("reading");
    setPos(max, true);
    later(() => {
      print();
      later(() => setPos(0, true), 900);
    }, 520);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (busy() || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x0: e.clientX, pos: 0, max: maxTravel(), moved: false };
    setState("reading");
    sfx("click");
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x0;
    if (Math.abs(dx) > 4) d.moved = true;
    d.pos = Math.min(d.max, Math.max(0, dx));
    setPos(d.pos);
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    swallowClick.current = d.moved;
    if (!d.moved) {
      // A tap: let the machine do the swipe (onClick follows; handled there).
      setState("idle");
      return;
    }
    if (d.pos >= d.max * 0.88) {
      setPos(d.max, true);
      print();
      later(() => setPos(0, true), 900);
    } else {
      setPos(0, true);
      setState("noread");
    }
  };

  const onClick = () => {
    // Pointer swipes resolve in onPointerUp; a tap, or Enter/Space, glides
    // the pass through.
    if (swallowClick.current) {
      swallowClick.current = false;
      return;
    }
    glideThrough();
  };

  return (
    <figure className={styles.terminal} data-state={state}>
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.world}>
          <span className={styles.pad} />
          <div className={styles.machine}>
            <div className={styles.top}>
              <span className={styles.slot}>
                <i className={styles.heat} />
              </span>
              <span className={styles.lcdFace}>{LCD[state]}</span>
              {/* Power, receiving (red: the head is hot), printed. */}
              <span className={styles.leds}>
                <i data-kind="power" data-on="" />
                <i data-kind="rx" data-on={state === "cleared" || state === "printing" || undefined} />
                <i data-kind="ok" data-on={state === "done" || undefined} />
              </span>
              <span className={styles.keypad}>
                {Array.from({ length: 12 }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
              <span className={styles.plate}>Relay FX-01</span>
              <span className={styles.screw} data-at="tl" />
              <span className={styles.screw} data-at="tr" />
              <span className={styles.screw} data-at="bl" />
              <span className={styles.screw} data-at="br" />
            </div>
            <div className={styles.front}>
              <span className={styles.grille} />
              <span className={styles.strip} />
            </div>
            <div className={styles.side}>
              <span className={styles.vents} />
            </div>
            <div className={styles.paper}>
              {run > 0 ? (
                <div key={run} className={styles.sheet} style={{ ["--feed" as string]: `${FEED_MS}ms` }}>
                  <span className={styles.sheetTop}>
                    <b className={styles.sheetName}>{sheet.name}</b>
                    <span className={styles.sheetPage}>CV · 1/1</span>
                  </span>
                  <span className={styles.sheetRole}>{sheet.role}</span>
                  <span className={styles.rule} />
                  {sheet.numbers.map((n) => (
                    <span key={n.label} className={styles.sheetNum}>
                      <b>{figure(n)}</b>
                      <span>{n.label}</span>
                    </span>
                  ))}
                  <span className={styles.sheetHead}>Experience</span>
                  {[88, 72, 80].map((w, i) => (
                    <span key={`e${i}`} className={styles.line} style={{ width: `${w}%` }} />
                  ))}
                  <span className={styles.sheetHead}>Skills</span>
                  {[76, 62].map((w, i) => (
                    <span key={`s${i}`} className={styles.line} style={{ width: `${w}%` }} />
                  ))}
                  <span className={styles.sheetFoot}>{sheet.place}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* The reader: the pass rides in a groove; the head is the far end. */}
      <div className={styles.reader}>
        <div ref={trackRef} className={styles.track}>
          <span className={styles.groove} aria-hidden="true" />
          <span className={styles.hint} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className={styles.head} aria-hidden="true">
            <i />
          </span>
          <button
            ref={cardRef}
            type="button"
            className={styles.card}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={onClick}
            aria-label="Visitor pass: swipe or press to print the résumé (downloads the PDF)"
          >
            <span className={styles.sheen} aria-hidden="true" />
            <span className={styles.chip} aria-hidden="true" />
            <span className={styles.cardKind}>Visitor pass</span>
            <span className={styles.cardName}>Recruiter</span>
            <span className={styles.cardArrow} aria-hidden="true">
              &rarr;
            </span>
            <span className={styles.stripe} aria-hidden="true" />
          </button>
        </div>
        <p className={styles.lcd} aria-live="polite">
          {LCD[state]}
        </p>
      </div>

      <figcaption className={styles.caption}>
        Swipe the pass through the reader. Or just{" "}
        <a ref={linkRef} href={PDF} download="Ali_Azam_Kazmi_Resume.pdf" className={styles.plainLink}>
          download the PDF
        </a>
        .
      </figcaption>
    </figure>
  );
}
