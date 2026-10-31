"use client";

import { useEffect, useState } from "react";
import styles from "./Radio.module.scss";

/*
 * The ship's radio (2026-11-01). Ali: "I need Back in Black in the bg to be
 * played." It is AC/DC's recording, so the site never hosts the audio — it
 * plays through Spotify's own embed, which is licensed (Ali chose this over a
 * royalty-free stand-in). Visitors signed in to Spotify hear the whole song;
 * everyone else gets Spotify's 30-second preview.
 *
 * Nothing loads until asked. `RadioButton` (dock, phone bar) dispatches
 * `space:radio`; the first press mounts the iframe and opens this panel, and
 * the visitor presses Spotify's own play (Ali: "when they press play" — no
 * sound a recruiter did not ask for). Hide keeps the iframe mounted, so the
 * song keeps playing; this lives in the root layout, so it survives client
 * navigation. Stop unmounts it. The state goes back out as
 * `space:radio-state` so every button agrees.
 *
 * The room tone (SoundToggle) is a separate instrument and stays opt-in.
 */
export const TRACK = {
  title: "Back in Black",
  artist: "AC/DC",
  embed: "https://open.spotify.com/embed/track/08mG3Y1vljYA6bvDt4Wqkj?utm_source=generator&theme=0",
  url: "https://open.spotify.com/track/08mG3Y1vljYA6bvDt4Wqkj",
};

export type RadioState = { mounted: boolean; open: boolean };

export default function Radio() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const toggle = () => {
      setMounted(true);
      setOpen((o) => !o || !mounted);
    };
    window.addEventListener("space:radio", toggle);
    return () => window.removeEventListener("space:radio", toggle);
  }, [mounted]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent<RadioState>("space:radio-state", { detail: { mounted, open } }));
  }, [mounted, open]);

  if (!mounted) return null;

  return (
    <section className={styles.panel} data-open={open || undefined} aria-label={`Music: ${TRACK.title} by ${TRACK.artist}`} aria-hidden={!open || undefined}>
      <header className={styles.head}>
        <p className={styles.label}>
          <i className={styles.dot} aria-hidden="true" /> On the radio
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.action} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
            Hide
          </button>
          <button
            type="button"
            className={styles.action}
            onClick={() => {
              setOpen(false);
              setMounted(false);
            }}
            tabIndex={open ? 0 : -1}
          >
            Stop
          </button>
        </div>
      </header>
      <iframe
        className={styles.player}
        src={TRACK.embed}
        title={`Spotify player: ${TRACK.title} by ${TRACK.artist}`}
        width="100%"
        height="80"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        tabIndex={open ? 0 : -1}
      />
    </section>
  );
}
