"use client";

import { useEffect, useRef } from "react";

/**
 * The cursor is a targeting reticle with a comet tail.
 *
 * Fine pointers only; off under reduced motion; the native cursor is hidden
 * while this runs and restored on unmount. One fixed, click-through canvas:
 *
 * - The reticle — a centre point and two counter-rotating bracket arcs —
 *   follows the pointer with a short lag, so it swings rather than snaps.
 * - Over anything interactive it opens up and squares into corner brackets:
 *   the target is acquired. The ship's HUD uses the same brackets.
 * - Movement sheds sparks that drift against the direction of travel and
 *   fade in under a second — the comet tail.
 * - A click fires a ring outward: a small shockwave.
 *
 * Kept faint at rest. It is texture until you reach for something.
 */

type Spark = { x: number; y: number; vx: number; vy: number; life: number; size: number };
type Ring = { x: number; y: number; life: number };

const INTERACTIVE = "a, button, [role=button], input, textarea, select, summary, label, [data-cursor]";

export default function CometCursor() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    document.documentElement.classList.add("has-reticle");

    let dpr = 1;
    const resize = () => {
      dpr = 1; // a reticle does not need retina; the full-screen clear does cost
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const sparks: Spark[] = [];
    const rings: Ring[] = [];
    let px = -100;
    let py = -100;
    let tx = -100;
    let ty = -100;
    let lastX = -1;
    let lastY = -1;
    let seen = false;
    let hot = 0; // 0 free … 1 locked on a target
    let wantHot = 0;
    let down = 0;

    const onMove = (e: PointerEvent) => {
      seen = true;
      tx = e.clientX;
      ty = e.clientY;
      if (px < 0) {
        px = tx;
        py = ty;
      }
      const target = (e.target as Element | null)?.closest?.(INTERACTIVE);
      wantHot = target ? 1 : 0;
      if (lastX >= 0) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        const speed = Math.hypot(dx, dy);
        const n = speed > 18 ? 2 : speed > 4 ? 1 : 0;
        for (let i = 0; i < n; i++) {
          sparks.push({
            x: e.clientX + (Math.random() - 0.5) * 3,
            y: e.clientY + (Math.random() - 0.5) * 3,
            vx: -dx * 0.08 + (Math.random() - 0.5) * 0.6,
            vy: -dy * 0.08 + (Math.random() - 0.5) * 0.6,
            life: 1,
            size: 0.8 + Math.random() * 1.2,
          });
        }
        if (sparks.length > 90) sparks.splice(0, sparks.length - 90);
      }
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onDown = (e: PointerEvent) => {
      down = 1;
      rings.push({ x: e.clientX, y: e.clientY, life: 1 });
      if (rings.length > 4) rings.shift();
    };
    const onUp = () => {
      down = 0;
    };
    const onLeave = () => {
      seen = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", () => (seen = true));

    let raf = 0;
    let last = performance.now();
    let spin = 0;
    let dirty = false;
    let bx0 = 0, by0 = 0, bx1 = 0, by1 = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      // Clear only what was drawn last frame: a box around the reticle, the
      // tail and any rings. A full-viewport clear every frame was the single
      // biggest 2D cost on the page.
      if (dirty) ctx.clearRect(bx0 - 4, by0 - 4, bx1 - bx0 + 8, by1 - by0 + 8);
      dirty = false;
      if (!seen) return;
      bx0 = px - 60; by0 = py - 60; bx1 = px + 60; by1 = py + 60;
      for (const s of sparks) { bx0 = Math.min(bx0, s.x - 6); by0 = Math.min(by0, s.y - 6); bx1 = Math.max(bx1, s.x + 6); by1 = Math.max(by1, s.y + 6); }
      for (const r of rings) { bx0 = Math.min(bx0, r.x - 50); by0 = Math.min(by0, r.y - 50); bx1 = Math.max(bx1, r.x + 50); by1 = Math.max(by1, r.y + 50); }
      dirty = true;

      // Follow with lag; lock tighter when hot.
      const k = 1 - Math.exp(-dt * (hot > 0.5 ? 26 : 16));
      px += (tx - px) * k;
      py += (ty - py) * k;
      hot += (wantHot - hot) * Math.min(dt * 10, 1);
      spin += dt * (hot > 0.5 ? 0.6 : 1.4);

      // Tail
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= dt * 1.6;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.94;
        s.vy *= 0.94;
        ctx.fillStyle = `rgba(60, 221, 158, ${s.life * s.life * 0.7})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fill();
      }

      // Shockwaves
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.life -= dt * 2.2;
        if (r.life <= 0) {
          rings.splice(i, 1);
          continue;
        }
        const rad = 10 + (1 - r.life) * 34;
        ctx.strokeStyle = `rgba(138, 240, 200, ${r.life * 0.7})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Reticle
      const R = 10 + hot * 8 - down * 3;
      const a = 0.55 + hot * 0.4;
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = `rgba(60, 221, 158, ${a})`;
      ctx.fillStyle = `rgba(191, 245, 223, ${0.9})`;

      // Centre point
      ctx.beginPath();
      ctx.arc(px, py, 1.6, 0, Math.PI * 2);
      ctx.fill();

      if (hot < 0.5) {
        // Free: two counter-rotating arcs.
        ctx.beginPath();
        ctx.arc(px, py, R, spin, spin + Math.PI * 0.75);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(px, py, R, spin + Math.PI, spin + Math.PI * 1.75);
        ctx.stroke();
        // A faint outer ring, barely there.
        ctx.strokeStyle = `rgba(60, 221, 158, 0.16)`;
        ctx.beginPath();
        ctx.arc(px, py, R + 7, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Locked: four corner brackets, the HUD's acquisition marks.
        const s = R + 2;
        const l = s * 0.45;
        ctx.strokeStyle = `rgba(138, 240, 200, ${a})`;
        for (const [sx, sy] of [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ] as const) {
          ctx.beginPath();
          ctx.moveTo(px + sx * s, py + sy * (s - l));
          ctx.lineTo(px + sx * s, py + sy * s);
          ctx.lineTo(px + sx * (s - l), py + sy * s);
          ctx.stroke();
        }
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-reticle");
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 10000,
      }}
    />
  );
}
