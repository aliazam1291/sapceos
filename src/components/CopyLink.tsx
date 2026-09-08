"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CopyLink.module.scss";

/**
 * A value that is both a link and copyable.
 *
 * On a contact page the address is as often something you want to PASTE
 * somewhere as something you want to open a mail client with, and the page
 * previously offered only the second. The link keeps working exactly as it
 * did; the copy control is added beside it rather than replacing it, so
 * nothing that used to be one click away became two.
 *
 * Deliberately not a toast. Confirmation appears in place, on the control
 * that was pressed, which is where the eye already is.
 */
export default function CopyLink({
  href,
  value,
  display,
  label,
  external,
}: {
  href: string;
  /**
   * What gets copied. Kept separate from `display` on purpose: the booking
   * link is shown without its `https://` because the protocol is noise at
   * 3rem, but copying it that way pastes a URL that does not resolve.
   */
  value: string;
  /** What is shown, if it differs from what is copied. */
  display?: string;
  /** Describes the value for assistive tech, e.g. "email address". */
  label: string;
  external?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  // A pending timeout that fires after unmount would set state on a dead
  // component; clearing on unmount is the whole reason this is held in a ref.
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /*
       * Clipboard access can be refused — an insecure origin, a permissions
       * policy, an older browser. Swallowing it leaves the link, which is
       * still perfectly usable, rather than showing a false confirmation.
       */
    }
  };

  return (
    <span className={styles.wrap}>
      <a
        className={styles.value}
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      >
        {display ?? value}
      </a>
      <button
        type="button"
        className={styles.copy}
        onClick={copy}
        data-copied={copied || undefined}
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
      >
        <span aria-hidden="true">{copied ? "Copied" : "Copy"}</span>
      </button>
      {/* Announced rather than shown twice — the visible label above already
          changes, but a sighted-only change is not an announcement. */}
      <span role="status" aria-live="polite" className={styles.srOnly}>
        {copied ? `${label} copied to clipboard` : ""}
      </span>
    </span>
  );
}
