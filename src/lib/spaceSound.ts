"use client";

import { shipState } from "@/components/space/shipState";
import { signal } from "@/lib/scroll-signal";

/*
 * The site's sound (2026-09-19). Ali: "we need sound too in the website".
 *
 * Everything is synthesised in Web Audio — no files, nothing to download,
 * and every sound comes from the same few voices so the site has one
 * timbre. Three layers:
 *
 *   ambient  — a very low, slowly moving pad plus filtered air. The room.
 *   engine   — the ship's drive: a sub oscillator through a low-pass whose
 *              pitch, cutoff and level follow `shipState.thrust`, so the
 *              engines are heard burning when the ship flies (scroll, a
 *              departure) and idling when it holds station.
 *   sfx      — one-shots: tick (hover), click, open/close (panels), log
 *              (a boot line arriving), warp (a route change: filtered noise
 *              sweeping up), launch (lift-off), hold (a rising tone that
 *              follows the launch fill), ping/scan (the galaxy's map ship).
 *
 * Rules. Opt-in, always: browsers block audio until a gesture and a
 * portfolio that plays sound unasked is a portfolio that gets closed. The
 * preference lives in localStorage (`space-os:sound`), the toggle is in the
 * dock (SoundToggle) and on the launch screen. Reduced-motion users are
 * never auto-enabled. Levels are low — this is a room tone, not a game.
 * Components never import this to play a one-shot; they dispatch
 * `space:sfx` with `{ detail: name }` and SoundSystem routes it here, so
 * nothing on the page depends on the audio graph existing.
 */

export type Sfx = "tick" | "click" | "open" | "close" | "log" | "warp" | "launch" | "land" | "ping";

const KEY = "space-os:sound";
const MASTER = 0.16;

class SpaceSoundController {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private on = false;
  private listeners = new Set<(on: boolean) => void>();

  // Engine voice.
  private engOsc: OscillatorNode | null = null;
  private engOsc2: OscillatorNode | null = null;
  private engFilter: BiquadFilterNode | null = null;
  private engGain: GainNode | null = null;
  private engNoise: AudioBufferSourceNode | null = null;
  private engNoiseGain: GainNode | null = null;
  private thrust = 0.1;

  // Ambient voice.
  private padGain: GainNode | null = null;

  // Hold tone (the launch ring).
  private holdOsc: OscillatorNode | null = null;
  private holdGain: GainNode | null = null;

  // Galaxy map ship (kept for GalaxyShip / InteractiveGalaxy).
  private scanOsc: OscillatorNode | null = null;
  private scanGain: GainNode | null = null;
  private scanLfo: OscillatorNode | null = null;

  private loop = 0;
  private lastTick = 0;
  private noiseBuffer: AudioBuffer | null = null;

  /** The saved preference, read once on the client. */
  savedPreference(): boolean | null {
    try {
      const v = localStorage.getItem(KEY);
      return v === "on" ? true : v === "off" ? false : null;
    } catch {
      return null;
    }
  }

  isOn() {
    return this.on;
  }

  subscribe(cb: (on: boolean) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  /**
   * Turn the site's sound on or off. Must be called from a user gesture
   * the first time (the AudioContext will not start otherwise).
   */
  enable(on: boolean) {
    this.on = on;
    try {
      localStorage.setItem(KEY, on ? "on" : "off");
    } catch {}
    if (on) {
      this.init();
      this.ctx?.resume();
      this.startLoop();
    }
    if (this.ctx && this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(on ? MASTER : 0, this.ctx.currentTime, 0.25);
    }
    if (!on) this.stopLoop();
    this.listeners.forEach((l) => l(on));
  }

  /** Resume a context the browser suspended (tab switch, autoplay policy). */
  resume() {
    if (this.on && this.ctx?.state === "suspended") this.ctx.resume();
  }

  // ── Compatibility with the galaxy's own controls ──────────────────────────
  toggleMute(muted: boolean) {
    this.enable(!muted);
  }
  getMutedState() {
    return !this.on;
  }
  setThrusterActive(active: boolean) {
    this.thrust = active ? 0.7 : 0.1;
  }

  // ── Graph ─────────────────────────────────────────────────────────────────
  private init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const c = this.ctx;
      this.master = c.createGain();
      this.master.gain.setValueAtTime(0, c.currentTime);
      // A gentle compressor keeps a warp over an engine from clipping.
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      this.master.connect(comp);
      comp.connect(c.destination);

      // Pink-ish noise, shared by the engine's hiss and the warp.
      const len = c.sampleRate * 2;
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + w * 0.099;
        b1 = 0.963 * b1 + w * 0.2965;
        b2 = 0.57 * b2 + w * 1.0526;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12;
      }
      this.noiseBuffer = buf;

      this.startAmbient();
      this.startEngine();
    } catch (e) {
      console.warn("Web Audio unavailable:", e);
    }
  }

  private startAmbient() {
    const c = this.ctx!;
    this.padGain = c.createGain();
    this.padGain.gain.value = 0.05;
    this.padGain.connect(this.master!);
    // Two sines a fifth apart, each slowly detuned by its own LFO: a pad
    // that never quite repeats.
    for (const [f, rate, depth] of [
      [55, 0.05, 0.6],
      [82.4, 0.037, 0.9],
      [110, 0.023, 0.4],
    ] as const) {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const lfo = c.createOscillator();
      lfo.frequency.value = rate;
      const lg = c.createGain();
      lg.gain.value = depth;
      lfo.connect(lg);
      lg.connect(o.detune);
      const g = c.createGain();
      g.gain.value = f > 100 ? 0.25 : 0.5;
      o.connect(g);
      g.connect(this.padGain);
      o.start();
      lfo.start();
    }
    // Air: noise through a wide band-pass, very quiet.
    const air = c.createBufferSource();
    air.buffer = this.noiseBuffer;
    air.loop = true;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 900;
    bp.Q.value = 0.4;
    const ag = c.createGain();
    ag.gain.value = 0.08;
    air.connect(bp);
    bp.connect(ag);
    ag.connect(this.padGain);
    air.start();
  }

  private startEngine() {
    const c = this.ctx!;
    this.engGain = c.createGain();
    this.engGain.gain.value = 0;
    this.engGain.connect(this.master!);

    this.engOsc = c.createOscillator();
    this.engOsc.type = "sawtooth";
    this.engOsc.frequency.value = 48;
    this.engOsc2 = c.createOscillator();
    this.engOsc2.type = "triangle";
    this.engOsc2.frequency.value = 72.5;
    this.engFilter = c.createBiquadFilter();
    this.engFilter.type = "lowpass";
    this.engFilter.frequency.value = 120;
    this.engFilter.Q.value = 3;
    this.engOsc.connect(this.engFilter);
    this.engOsc2.connect(this.engFilter);
    this.engFilter.connect(this.engGain);
    this.engOsc.start();
    this.engOsc2.start();

    // Exhaust hiss: noise through a low-pass that opens with thrust.
    this.engNoise = c.createBufferSource();
    this.engNoise.buffer = this.noiseBuffer;
    this.engNoise.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 400;
    this.engNoiseGain = c.createGain();
    this.engNoiseGain.gain.value = 0;
    this.engNoise.connect(lp);
    lp.connect(this.engNoiseGain);
    this.engNoiseGain.connect(this.master!);
    this.engNoise.start();
  }

  /** Read the ship every ~80ms and steer the engine voice toward it. */
  private startLoop() {
    if (this.loop) return;
    const tick = (now: number) => {
      this.loop = requestAnimationFrame(tick);
      if (now - this.lastTick < 80) return;
      this.lastTick = now;
      if (!this.ctx || !this.engOsc || !this.engOsc2 || !this.engFilter || !this.engGain || !this.engNoiseGain) return;
      // The companion's thrust when it is on screen; the galaxy's ship's when
      // it is not (GalaxyShip sets setThrusterActive); scroll speed on top.
      const shipThrust = shipState.on > 0.3 ? shipState.thrust : this.thrust;
      const want = Math.min(1, shipThrust * 0.85 + signal.velocity * 0.3);
      const t = this.ctx.currentTime;
      const k = 0.18;
      this.engOsc.frequency.setTargetAtTime(44 + want * 42, t, k);
      this.engOsc2.frequency.setTargetAtTime((44 + want * 42) * 1.5 + 0.7, t, k);
      this.engFilter.frequency.setTargetAtTime(90 + want * 520, t, k);
      // Heard when the ship is there; a whisper otherwise.
      const presence = shipState.on > 0.3 ? 1 : 0.35;
      this.engGain.gain.setTargetAtTime((0.05 + want * 0.32) * presence, t, k);
      this.engNoiseGain.gain.setTargetAtTime(want * want * 0.22 * presence, t, k);
    };
    this.loop = requestAnimationFrame(tick);
  }

  private stopLoop() {
    if (this.loop) cancelAnimationFrame(this.loop);
    this.loop = 0;
  }

  // ── One-shots ─────────────────────────────────────────────────────────────
  sfx(name: Sfx) {
    if (!this.on || !this.ctx || !this.master) return;
    this.resume();
    const c = this.ctx;
    const t = c.currentTime;
    const out = this.master;
    const tone = (type: OscillatorType, f0: number, f1: number, dur: number, vol: number, at = 0, filterHz?: number) => {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f0, t + at);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + at + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t + at);
      g.gain.exponentialRampToValueAtTime(vol, t + at + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
      let node: AudioNode = o;
      if (filterHz) {
        const f = c.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = filterHz;
        o.connect(f);
        node = f;
      }
      node.connect(g);
      g.connect(out);
      o.start(t + at);
      o.stop(t + at + dur + 0.05);
    };
    const noise = (dur: number, vol: number, f0: number, f1: number, q = 1, at = 0) => {
      if (!this.noiseBuffer) return;
      const n = c.createBufferSource();
      n.buffer = this.noiseBuffer;
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = q;
      f.frequency.setValueAtTime(f0, t + at);
      f.frequency.exponentialRampToValueAtTime(f1, t + at + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t + at);
      g.gain.exponentialRampToValueAtTime(vol, t + at + dur * 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
      n.connect(f);
      f.connect(g);
      g.connect(out);
      n.start(t + at);
      n.stop(t + at + dur + 0.05);
    };

    switch (name) {
      case "tick":
        tone("sine", 1800, 1400, 0.03, 0.05);
        break;
      case "click":
        tone("sine", 160, 40, 0.09, 0.28);
        tone("square", 2200, 1800, 0.02, 0.04);
        break;
      case "open":
        tone("sine", 420, 840, 0.14, 0.12);
        tone("sine", 630, 1260, 0.14, 0.08, 0.05);
        break;
      case "close":
        tone("sine", 840, 420, 0.12, 0.1);
        break;
      case "log":
        tone("square", 1400, 1400, 0.025, 0.05, 0, 3000);
        tone("square", 1900, 1900, 0.025, 0.04, 0.035, 3000);
        break;
      case "ping":
        tone("square", 520, 1040, 0.35, 0.16, 0, 2600);
        tone("sine", 784, 784, 0.3, 0.1, 0.07);
        tone("sine", 1046, 1046, 0.25, 0.06, 0.18);
        break;
      case "warp":
        // A rising sweep of air, then the drive spooling.
        noise(0.9, 0.5, 300, 4200, 0.8);
        tone("sawtooth", 60, 190, 0.7, 0.14, 0, 900);
        break;
      case "launch":
        noise(1.8, 0.7, 120, 2600, 0.6);
        tone("sawtooth", 40, 160, 1.6, 0.2, 0, 700);
        tone("sine", 30, 90, 1.2, 0.25);
        break;
      case "land":
        tone("sine", 90, 32, 0.5, 0.35);
        noise(0.4, 0.25, 200, 80, 1.2);
        break;
    }
  }

  /**
   * The launch hold: a tone that rises with the fill (0..1) and cuts at 0.
   * Called at the boot screen's frame rate; cheap (parameter automation).
   */
  setHold(fill: number) {
    if (!this.on || !this.ctx || !this.master) return;
    const c = this.ctx;
    const t = c.currentTime;
    if (fill <= 0) {
      if (this.holdGain) this.holdGain.gain.setTargetAtTime(0.0001, t, 0.08);
      return;
    }
    if (!this.holdOsc) {
      this.holdOsc = c.createOscillator();
      this.holdOsc.type = "triangle";
      this.holdGain = c.createGain();
      this.holdGain.gain.value = 0;
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 1400;
      this.holdOsc.connect(f);
      f.connect(this.holdGain);
      this.holdGain.connect(this.master);
      this.holdOsc.start();
    }
    this.holdOsc.frequency.setTargetAtTime(110 + fill * fill * 660, t, 0.05);
    this.holdGain!.gain.setTargetAtTime(0.04 + fill * 0.14, t, 0.05);
    // The engines spool with the hold.
    this.thrust = 0.1 + fill * 0.8;
  }

  // ── Galaxy map ship (legacy API) ──────────────────────────────────────────
  playPing() {
    this.sfx("ping");
  }
  playClick() {
    this.sfx("click");
  }
  startScanning() {
    if (!this.on || !this.ctx || !this.master || this.scanOsc) return;
    const c = this.ctx;
    const now = c.currentTime;
    this.scanOsc = c.createOscillator();
    this.scanOsc.type = "sine";
    this.scanOsc.frequency.setValueAtTime(180, now);
    this.scanGain = c.createGain();
    this.scanGain.gain.setValueAtTime(0, now);
    this.scanGain.gain.linearRampToValueAtTime(0.04, now + 0.2);
    this.scanLfo = c.createOscillator();
    const lfoGain = c.createGain();
    this.scanLfo.frequency.setValueAtTime(1.8, now);
    lfoGain.gain.setValueAtTime(80, now);
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(250, now);
    filter.Q.setValueAtTime(6, now);
    this.scanLfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    this.scanOsc.connect(filter);
    filter.connect(this.scanGain);
    this.scanGain.connect(this.master);
    this.scanLfo.start(now);
    this.scanOsc.start(now);
  }
  stopScanning() {
    if (!this.ctx || !this.scanOsc || !this.scanGain) return;
    const now = this.ctx.currentTime;
    const osc = this.scanOsc;
    const lfo = this.scanLfo;
    const gain = this.scanGain;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    window.setTimeout(() => {
      try {
        osc.stop();
        lfo?.stop();
        osc.disconnect();
        lfo?.disconnect();
        gain.disconnect();
      } catch {}
    }, 200);
    this.scanOsc = null;
    this.scanLfo = null;
    this.scanGain = null;
  }
}

export const spaceSound = new SpaceSoundController();

/** Fire a one-shot from anywhere without importing the audio graph. */
export function sfx(name: Sfx) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("space:sfx", { detail: name }));
}
