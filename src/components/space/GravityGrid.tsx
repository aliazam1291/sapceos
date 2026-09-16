"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { damp, signal } from "@/lib/scroll-signal";
import { arm, isArmed, pluck } from "@/lib/pluck";
import styles from "./GravityGrid.module.scss";

/**
 * A spacetime sheet with masses in it.
 *
 * The survey grid is drawn in canvas 2D (no GL context — that budget is
 * spent) and bent by two kinds of mass: the pointer, which dents the sheet
 * wherever it goes, and a fixed set of objects the page places on it. A
 * mass is a real thing — a result, a route, a way to make contact — with a
 * label, a weight that sets how deep it sits, and optionally somewhere to go.
 * Hover lights it; click launches it, and the click's ring is the launch
 * ripple. Scroll velocity sends a wave across the whole sheet.
 *
 * Everything is damped in the frame loop. Nothing reads the pointer directly.
 */

export type Mass = {
  label: string;
  /** Secondary line, e.g. the number. */
  value?: string;
  /** 0..1 — how deep it sits and how big it draws. */
  weight: number;
  href?: string;
};

const COLS = 56;
const ROWS = 14;
const HIT = 34;

type Ring = { x: number; y: number; t: number };

export default function GravityGrid({
  label = "Gravity well",
  height = 240,
  masses = [],
}: {
  label?: string;
  height?: number;
  masses?: Mass[];
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const massesRef = useRef(masses);
  massesRef.current = masses;
  const [sound, setSound] = useState(false);
  useEffect(() => setSound(isArmed()), []);

  useEffect(() => {
    const el = host.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    let w = 0;
    let h = 0;
    const resize = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const target = { x: -9999, y: -9999, on: 0 };
    const pointer = { x: 0, y: 0, on: 0 };
    const rings: Ring[] = [];
    let hovered = -1;
    // Per-mass hover glow, damped.
    const massGlow: number[] = [];

    // Masses sit on a gentle arc across the sheet, alternating above and
    // below centre so labels never collide.
    const massPos = (i: number, n: number) => {
      const u = n === 1 ? 0.5 : 0.08 + (i / (n - 1)) * 0.84;
      const y = h * (0.5 + (i % 2 === 0 ? -0.12 : 0.12));
      return { x: u * w, y };
    };

    const hitTest = (x: number, y: number) => {
      const ms = massesRef.current;
      for (let i = 0; i < ms.length; i++) {
        const p = massPos(i, ms.length);
        if (Math.hypot(p.x - x, p.y - y) < HIT + ms[i].weight * 10) return i;
      }
      return -1;
    };

    // Strings: every column line is one. Crossing a column at speed plucks
    // it, pitched by where on the sheet it sits.
    let lastCol = -1;
    let lastMoveT = 0;
    let lastMoveX = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
      target.on = 1;
      hovered = hitTest(target.x, target.y);
      el.style.cursor = hovered >= 0 && massesRef.current[hovered].href ? "pointer" : "crosshair";

      const col = Math.round((target.x / w) * (COLS - 1));
      const now = performance.now();
      const speed = Math.abs(target.x - lastMoveX) / Math.max(now - lastMoveT, 1);
      if (col !== lastCol && lastCol >= 0 && isArmed()) {
        pluck(target.x / w, Math.min(1, speed * 1.5));
      }
      lastCol = col;
      lastMoveT = now;
      lastMoveX = target.x;
    };
    const onLeave = () => {
      target.on = 0;
      hovered = -1;
    };
    const onDown = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      // First click arms the audio (browsers require a gesture); every click
      // plucks where it lands.
      const justArmed = !isArmed() && arm();
      setSound(isArmed());
      pluck(x / w, 0.8, false);
      const i = hitTest(x, y);
      if (i < 0) {
        if (justArmed) rings.push({ x, y, t: 0 });
        return;
      }
      const m = massesRef.current[i];
      const p = massPos(i, massesRef.current.length);
      rings.push({ x: p.x, y: p.y, t: 0 });
      if (rings.length > 3) rings.shift();
      pluck(x / w, 1, true);
      if (m.href) {
        const href = m.href;
        if (href.startsWith("/")) {
          // Let the ring show before the route changes.
          window.dispatchEvent(new Event("space:warp"));
          window.setTimeout(() => router.push(href), 260);
        } else if (href.startsWith("mailto:")) {
          window.location.href = href;
        } else {
          window.open(href, "_blank", "noopener,noreferrer");
        }
      }
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(el);

    let raf = 0;
    let last = performance.now();
    let time = 0;
    let wave = 0;

    const px = new Float32Array(COLS * ROWS);
    const py = new Float32Array(COLS * ROWS);
    const glow = new Float32Array(COLS * ROWS);

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || w === 0) return;
      time += dt;

      const ms = massesRef.current;
      while (massGlow.length < ms.length) massGlow.push(0);

      if (!coarse) {
        pointer.x = damp(pointer.x, target.on ? target.x : pointer.x, 6, dt);
        pointer.y = damp(pointer.y, target.on ? target.y : pointer.y, 6, dt);
        pointer.on = damp(pointer.on, target.on, 4, dt);
      }
      wave = damp(wave, signal.velocity, 3, dt);
      for (let i = 0; i < ms.length; i++) massGlow[i] = damp(massGlow[i], hovered === i ? 1 : 0, 8, dt);

      for (const ring of rings) ring.t += dt;
      while (rings.length && rings[0].t > 1.4) rings.shift();

      ctx.clearRect(0, 0, w, h);

      const padY = h * 0.12;
      const cellW = w / (COLS - 1);
      const cellH = (h - padY * 2) / (ROWS - 1);
      const wellR = Math.min(w, h) * 0.42;
      const wellDepth = 26 * pointer.on;
      const massR = Math.min(w, h) * 0.32;

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const i = r * COLS + c;
          let x = c * cellW;
          let y = padY + r * cellH;

          if (!reduced) {
            y += Math.sin(time * 0.8 + c * 0.35) * 2.2 + Math.cos(time * 0.5 + r * 0.6) * 1.4;
            y += Math.sin(c * 0.5 - time * 6) * 10 * wave;
          }

          let g = 0;

          // Fixed masses: each dents the sheet by its weight.
          for (let m = 0; m < ms.length; m++) {
            const p = massPos(m, ms.length);
            const dx = p.x - x;
            const dy = p.y - y;
            const d2 = dx * dx + dy * dy;
            const f = Math.exp(-d2 / (2 * massR * massR)) * (0.35 + ms[m].weight * 0.65);
            x += dx * f * 0.14;
            y += dy * f * 0.14 + f * 14;
            g = Math.max(g, f * f * (0.35 + massGlow[m] * 0.65));
          }

          // The pointer.
          const dx = pointer.x - x;
          const dy = pointer.y - y;
          const d = Math.hypot(dx, dy);
          const f = Math.exp(-(d * d) / (2 * wellR * wellR));
          x += dx * f * 0.22 * pointer.on;
          y += dy * f * 0.22 * pointer.on + f * wellDepth;
          g = Math.max(g, f * f * pointer.on);

          for (const ring of rings) {
            const rd = Math.hypot(ring.x - x, ring.y - y);
            const radius = ring.t * 560;
            const band = Math.exp(-((rd - radius) * (rd - radius)) / (2 * 18 * 18));
            const life = 1 - ring.t / 1.4;
            y -= band * 10 * life;
            g = Math.max(g, band * life * 0.7);
          }

          px[i] = x;
          py[i] = y;
          glow[i] = g;
        }
      }

      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      const seg = (a: number, b: number) => {
        const gl = Math.max(glow[a], glow[b]);
        const alpha = 0.1 + gl * 0.75;
        ctx.strokeStyle = gl > 0.04 ? `rgba(60, 221, 158, ${alpha})` : `rgba(190, 230, 215, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(px[a], py[a]);
        ctx.lineTo(px[b], py[b]);
        ctx.stroke();
      };
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS - 1; c++) seg(r * COLS + c, r * COLS + c + 1);
      for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS - 1; r++) seg(r * COLS + c, (r + 1) * COLS + c);

      for (let i = 0; i < COLS * ROWS; i++) {
        if (glow[i] < 0.08) continue;
        ctx.fillStyle = `rgba(60, 221, 158, ${glow[i]})`;
        ctx.beginPath();
        ctx.arc(px[i], py[i], 1.2 + glow[i] * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // The masses themselves: a node, sunk by its weight, and its label.
      ctx.font = "500 10px ui-monospace, 'SF Mono', Menlo, monospace";
      ctx.textAlign = "center";
      for (let m = 0; m < ms.length; m++) {
        const p = massPos(m, ms.length);
        const sink = 14 * (0.35 + ms[m].weight * 0.65);
        const cy = p.y + sink;
        const hg = massGlow[m];
        const rad = 3 + ms[m].weight * 5 + hg * 2;

        ctx.fillStyle = `rgba(60, 221, 158, ${0.55 + hg * 0.45})`;
        ctx.beginPath();
        ctx.arc(p.x, cy, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(60, 221, 158, ${0.25 + hg * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, cy, rad + 6 + hg * 4, 0, Math.PI * 2);
        ctx.stroke();

        const above = m % 2 === 0;
        const ly = above ? cy - rad - 14 : cy + rad + 18;
        ctx.fillStyle = `rgba(245, 245, 245, ${0.55 + hg * 0.45})`;
        ctx.fillText(ms[m].label.toUpperCase(), p.x, ly);
        if (ms[m].value) {
          ctx.fillStyle = `rgba(60, 221, 158, ${0.6 + hg * 0.4})`;
          ctx.fillText(ms[m].value as string, p.x, above ? ly - 13 : ly + 13);
        }
      }
    };

    if (reduced) {
      draw(performance.now());
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
    };
  }, [router]);

  const linked = masses.filter((m) => m.href);

  return (
    <div
      ref={host}
      className={styles.well}
      style={{ height }}
      role={linked.length ? "navigation" : "img"}
      aria-label={`${label}: a wireframe sheet that bends toward the pointer${masses.length ? `, carrying ${masses.length} objects` : ""}.`}
    >
      <canvas ref={canvasRef} className={styles.canvas} />
      <span className={styles.label} aria-hidden="true">
        {label}
        {masses.length ? ` · ${masses.length} masses` : ""}
        {linked.length ? " · click one to launch" : ""}
        {sound ? " · sound on — sweep the strings" : " · click to enable sound"}
      </span>
      {/* Real links for keyboard and assistive tech; the canvas is the picture. */}
      {linked.length ? (
        <ul className={styles.srList}>
          {linked.map((m) => (
            <li key={m.label}>
              <a
                href={m.href}
                {...(m.href?.startsWith("http") ? { target: "_blank", rel: "noreferrer noopener" } : {})}
              >
                {m.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
