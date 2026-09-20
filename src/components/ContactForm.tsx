"use client";

import { useState, type FormEvent } from "react";
import { track } from "@vercel/analytics";
import { sfx } from "@/lib/spaceSound";
import { profile } from "@/content/profile";
import styles from "./ContactForm.module.scss";

/*
 * The transmission form (2026-09-20). Ali: the channel was only a mailto and
 * a Calendly. This is an instrument — wireframe panel, mono labels, a
 * transmit button — that posts to /api/contact. If the inbox is not wired
 * (no RESEND_API_KEY) or the relay fails, it opens the reader's mail client
 * with everything they typed already in the message, so nothing is lost.
 */

const TOPICS = ["A product role", "Platform / fleet work", "DumbMoney", "Something on this site", "Other"];

type State = "idle" | "sending" | "sent" | "fallback" | "error";

export default function ContactForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setState("sending");
    setError(null);
    sfx("click");
    const mailto = () => {
      const subject = encodeURIComponent(`[Open channel] ${data.topic || "Message"} — ${data.name}`);
      const body = encodeURIComponent(`${data.message}\n\n— ${data.name} <${data.email}>`);
      window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
      setState("fallback");
    };
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.status === 501 || res.status === 502) return mailto();
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        setError(json.error ?? "Try again.");
        setState("error");
        return;
      }
      track("contact_sent", { topic: data.topic || "none" });
      sfx("ping");
      setState("sent");
      form.reset();
    } catch {
      mailto();
    }
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} aria-label="Send a transmission" data-reveal>
      <div className={styles.head}>
        <span className={styles.label}>Transmit</span>
        <span className={styles.meta}>Replies arrive in Earth time</span>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Callsign · your name</span>
          <input name="name" type="text" required maxLength={120} autoComplete="name" className={styles.input} />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Return address · email</span>
          <input name="email" type="email" required maxLength={200} autoComplete="email" className={styles.input} />
        </label>
        <label className={`${styles.field} ${styles.wide}`}>
          <span className={styles.fieldLabel}>Subject</span>
          <select name="topic" className={styles.input} defaultValue={TOPICS[0]}>
            {TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className={`${styles.field} ${styles.wide}`}>
          <span className={styles.fieldLabel}>Message</span>
          <textarea name="message" required minLength={10} maxLength={4000} rows={6} className={`${styles.input} ${styles.textarea}`} placeholder="What are you hiring for, or what are you arguing about?" />
        </label>
        {/* Honeypot: off screen, unlabelled to readers, filled only by bots. */}
        <input name="station" type="text" tabIndex={-1} autoComplete="off" className={styles.station} aria-hidden="true" />
      </div>

      <div className={styles.foot}>
        <button type="submit" className={styles.button} disabled={state === "sending"}>
          <span className={styles.dot} data-live={state === "sending" || undefined} aria-hidden="true" />
          {state === "sending" ? "Transmitting…" : "Transmit"}
        </button>
        <p className={styles.status} role="status" aria-live="polite">
          {state === "sent" ? "Received. CAPCOM will read it before the next orbit." : null}
          {state === "fallback" ? "The relay is offline here — your mail client has the message." : null}
          {state === "error" ? error : null}
        </p>
      </div>
    </form>
  );
}
