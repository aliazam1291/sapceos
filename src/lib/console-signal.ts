import { profile } from "@/content/profile";

/**
 * A message for the one audience actually likely to open devtools on a
 * portfolio: another engineer, or the person hiring one. Everywhere else on
 * the site plays it straight; this is the one unlocked door, left open on
 * purpose for whoever goes looking for it.
 *
 * Styled to match the terminal aesthetic rather than a generic console.log —
 * %c gives it the accent colour and mono type the rest of the instrument
 * panel uses, so it reads as part of the same system instead of a gimmick
 * bolted on top of it.
 */
export function printConsoleSignal() {
  if (typeof window === "undefined") return;
  const accent = "color:#22d0b2;font-family:monospace;font-weight:bold";
  const dim = "color:#8c8c8c;font-family:monospace";
  console.log("%cSPACE OS — signal received", accent);
  console.log(
    `%cYou opened the console on a portfolio site. Either the CSS broke, or you\nare exactly the kind of person this was built for. Hi.\n\nView source is a lot less interesting than this. ${profile.email} — say\nwhat's actually broken and I'll fix it faster than the recruiter reads my resume.`,
    dim,
  );
}
