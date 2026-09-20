import { NextResponse } from "next/server";
import { profile } from "@/content/profile";

/*
 * The open channel's inbox (2026-09-20). A message from the contact form is
 * delivered by Resend's REST API — no SDK, no domain needed: Resend's
 * `onboarding@resend.dev` sender may deliver to the account owner's own
 * address, which is exactly this case. Set RESEND_API_KEY in Vercel; without
 * it the route answers 501 and the form falls back to a prefilled mailto:,
 * so the channel is never dead.
 *
 * Kept deliberately small: a honeypot, length limits, and a per-IP minute
 * window in memory (one instance per warm function is all a portfolio needs).
 */
export const runtime = "nodejs";

const RECENT = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const PER_WINDOW = 4;

type Payload = {
  name?: string;
  email?: string;
  topic?: string;
  message?: string;
  /** Honeypot — real readers never fill it. */
  station?: string;
};

function tooMany(ip: string) {
  const now = Date.now();
  const hits = (RECENT.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  RECENT.set(ip, hits);
  return hits.length > PER_WINDOW;
}

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
  if (body.station) return NextResponse.json({ ok: true }); // a bot, quietly

  const name = (body.name ?? "").trim().slice(0, 120);
  const email = (body.email ?? "").trim().slice(0, 200);
  const topic = (body.topic ?? "").trim().slice(0, 80);
  const message = (body.message ?? "").trim().slice(0, 4000);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
    return NextResponse.json({ ok: false, error: "A name, a working address and a few words, please." }, { status: 422 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (tooMany(ip)) return NextResponse.json({ ok: false, error: "Channel busy — try again in a minute." }, { status: 429 });

  const key = process.env.RESEND_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "Inbox not wired" }, { status: 501 });

  const text = [`From: ${name} <${email}>`, topic ? `Topic: ${topic}` : null, "", message, "", `— sent from the open channel (${req.headers.get("referer") ?? "space os"})`]
    .filter((l) => l !== null)
    .join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM ?? "SPACE OS <onboarding@resend.dev>",
      to: [process.env.CONTACT_TO ?? profile.email],
      reply_to: email,
      subject: `[Open channel] ${topic || "Message"} — ${name}`,
      text,
    }),
  });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: "The relay dropped it — try the email link." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
