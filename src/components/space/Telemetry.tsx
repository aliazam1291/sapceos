"use client";

import { useEffect, useRef } from "react";
import { damp, signal } from "@/lib/scroll-signal";

/**
 * An oscilloscope trace running behind the stat readout.
 *
 * Idle, it is a quiet carrier wave. Hovering a readout tile drives the trace
 * hard under that tile — the number you are pointing at is the one making
 * noise — and scroll velocity adds gain across the whole line. Canvas 2D,
 * one polyline per frame; nothing allocates.
 *
 * The host element passes hover as a CSS variable (`--tx`, 0..1 across the
 * strip, or -1 for none) so the tiles need no JS of their own.
 */
export default function Telemetry() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const host = canvas.parentElement;
    const ctx = canvas.getContext("2d");
    if (!host || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    const resize = () => {
      const r = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(host);

    let focus = -1; // x fraction under the pointer, or -1
    let focusGain = 0;
    let tx = -1;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width;
    };
    const onLeave = () => (tx = -1);
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let last = performance.now();
    let t = 0;
    let gain = 0;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || !w) return;
      t += dt;

      focus = tx >= 0 ? (focus < 0 ? tx : damp(focus, tx, 10, dt)) : focus;
      focusGain = damp(focusGain, tx >= 0 ? 1 : 0, 6, dt);
      gain = damp(gain, signal.velocity, 3, dt);

      ctx.clearRect(0, 0, w, h);
      const mid = h * 0.58;
      const N = Math.max(120, Math.floor(w / 6));

      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        const x = u * w;
        // Carrier + a slower swell + scroll gain.
        let y = Math.sin(u * 42 + t * 3.2) * 3 + Math.sin(u * 9 - t * 1.1) * 4 * (0.4 + gain);
        // Under the pointer: a sharp burst with a fast inner frequency.
        if (focusGain > 0.01 && focus >= 0) {
          const d = (u - focus) * w;
          const env = Math.exp(-(d * d) / (2 * 70 * 70)) * focusGain;
          y += Math.sin(u * 220 + t * 18) * 16 * env + Math.sin(u * 90 - t * 7) * 6 * env;
        }
        if (i === 0) ctx.moveTo(x, mid + y);
        else ctx.lineTo(x, mid + y);
      }
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "rgba(60,221,158,0)");
      grad.addColorStop(0.08, "rgba(60,221,158,0.45)");
      grad.addColorStop(0.92, "rgba(60,221,158,0.45)");
      grad.addColorStop(1, "rgba(60,221,158,0)");
      ctx.strokeStyle = grad;
      ctx.stroke();

      // Hot spot under the pointer.
      if (focusGain > 0.02 && focus >= 0) {
        ctx.fillStyle = `rgba(60,221,158,${0.12 * focusGain})`;
        ctx.beginPath();
        ctx.ellipse(focus * w, mid, 90, h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (reduced) {
      draw(performance.now());
      cancelAnimationFrame(raf);
    } else raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}
