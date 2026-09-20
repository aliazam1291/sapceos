"use client";

import { useEffect, useState } from "react";
import { spaceSound } from "@/lib/spaceSound";
import styles from "./SoundToggle.module.scss";

/**
 * The audio switch. One control, in the dock and on the launch screen:
 * a speaker glyph whose three arcs are the level meter — lit when the room
 * tone is on. Off by default; the state is the engine's, so every instance
 * agrees (SoundSystem, the galaxy's HUD, the launch screen).
 */
export default function SoundToggle({ className, label = true }: { className?: string; label?: boolean }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(spaceSound.isOn());
    return spaceSound.subscribe(setOn);
  }, []);

  return (
    <button
      type="button"
      className={`${styles.toggle} ${className ?? ""}`}
      data-on={on || undefined}
      aria-pressed={on}
      aria-label={on ? "Sound on — turn off" : "Sound off — turn on"}
      title={on ? "Sound on" : "Sound off"}
      onClick={() => {
        spaceSound.enable(!on);
        if (!on) spaceSound.sfx("open");
      }}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M4 9.5v5h3l4 3.5v-12l-4 3.5z" />
        <path className={styles.arc} d="M14.5 9.2a3.6 3.6 0 0 1 0 5.6" />
        <path className={styles.arc} d="M16.8 6.8a6.8 6.8 0 0 1 0 10.4" />
        <path className={styles.arc} d="M19 4.4a10 10 0 0 1 0 15.2" />
      </svg>
      {label ? <span className={styles.text}>{on ? "Sound on" : "Sound"}</span> : null}
    </button>
  );
}
