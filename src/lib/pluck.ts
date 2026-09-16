/**
 * A tiny pluck synth for the gravity sheet.
 *
 * Web Audio needs a user gesture before it will make a sound, so `arm()` is
 * called from a click and everything else is a no-op until then. Each pluck
 * is a short sine with a fast pitch drop and an exponential decay — a
 * plucked string, not a beep — through a light delay so it sits in a room.
 */

let ctx: AudioContext | null = null;
let out: GainNode | null = null;
let armed = false;
let lastPluck = 0;

export function isArmed() {
  return armed;
}

export function arm() {
  if (armed) return true;
  if (typeof window === "undefined") return false;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  out = ctx.createGain();
  out.gain.value = 0.35;

  const delay = ctx.createDelay(0.5);
  delay.delayTime.value = 0.22;
  const fb = ctx.createGain();
  fb.gain.value = 0.28;
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  out.connect(ctx.destination);
  out.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(wet);
  wet.connect(ctx.destination);

  if (ctx.state === "suspended") void ctx.resume();
  armed = true;
  return true;
}

/** A pentatonic scale, so any sweep across the sheet sounds musical. */
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

/**
 * @param x  0..1 across the sheet — sets the pitch, low on the left.
 * @param strength  0..1 — velocity of the pluck.
 * @param low  A deeper voice, for launching a mass.
 */
export function pluck(x: number, strength = 0.6, low = false) {
  if (!armed || !ctx || !out) return;
  const now = ctx.currentTime;
  // Rate-limit so a fast sweep is a strum, not a buzz.
  if (now - lastPluck < 0.045) return;
  lastPluck = now;

  const idx = Math.min(SCALE.length - 1, Math.max(0, Math.floor(x * SCALE.length)));
  const base = low ? 110 : 220;
  const freq = base * Math.pow(2, SCALE[idx] / 12);

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq * 1.5, now);
  osc.frequency.exponentialRampToValueAtTime(freq, now + 0.02);

  const g = ctx.createGain();
  const peak = 0.12 + strength * 0.4;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, now + (low ? 1.2 : 0.55));

  osc.connect(g);
  g.connect(out);
  osc.start(now);
  osc.stop(now + (low ? 1.3 : 0.6));
}
