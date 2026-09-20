"use client";

import { useEffect, useRef } from "react";
import { damp } from "@/lib/scroll-signal";

/**
 * A portrait rendered as a character matrix.
 *
 * The photo is sampled into a grid of cells; each cell draws a glyph chosen
 * by its brightness (dark → "·", bright → "@"), in emerald on black — the
 * cyberpunk register the rest of the site speaks. It is never just a picture:
 *
 *   - A scan band sweeps down it continuously, decoding as it passes.
 *   - The pointer pushes cells away like a field, and inside its radius the
 *     glyphs resolve into the true photo colour, so the face emerges where
 *     you look and dissolves back to code when you leave.
 *   - Occasional cells flicker to a random glyph, the way a stream does.
 *
 * Canvas 2D, one text draw per cell per frame at ~48x48 cells. The <img> is
 * kept in the DOM (visually hidden) so the portrait has real alt text.
 */

const RAMP = " ·:-=+*#%@";

export default function MatrixPortrait({
  src,
  alt,
  size = 160,
  cells = 44,
}: {
  src: string;
  alt: string;
  size?: number;
  cells?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cell = size / cells;
    let lum: Float32Array | null = null;
    let rgb: Uint8ClampedArray | null = null;

    // Sample the photo once, at grid resolution.
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const off = document.createElement("canvas");
      off.width = cells;
      off.height = cells;
      const octx = off.getContext("2d");
      if (!octx) return;
      // Cover-fit, centred.
      const s = Math.max(cells / img.width, cells / img.height);
      const dw = img.width * s;
      const dh = img.height * s;
      octx.drawImage(img, (cells - dw) / 2, (cells - dh) / 2, dw, dh);
      const data = octx.getImageData(0, 0, cells, cells).data;
      rgb = data;
      lum = new Float32Array(cells * cells);
      let lo = 1;
      let hi = 0;
      for (let i = 0; i < cells * cells; i++) {
        const l = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
        lum[i] = l;
        if (l < lo) lo = l;
        if (l > hi) hi = l;
      }
      // Stretch contrast so the ramp uses its whole range.
      const span = Math.max(hi - lo, 0.01);
      for (let i = 0; i < lum.length; i++) lum[i] = (lum[i] - lo) / span;
    };
    img.src = src;

    const target = { x: -999, y: -999, on: 0 };
    const pointer = { x: size / 2, y: size / 2, on: 0 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width) * size;
      target.y = ((e.clientY - r.top) / r.height) * size;
      target.on = 1;
    };
    const onLeave = () => (target.on = 0);
    if (!coarse) {
      canvas.addEventListener("pointermove", onMove, { passive: true });
      canvas.addEventListener("pointerleave", onLeave);
    }

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    // Per-cell flicker state: which glyph index it is showing instead of its
    // true one, and how long until it settles back.
    const flicker = new Float32Array(cells * cells);
    const flickerGlyph = new Uint8Array(cells * cells);

    let raf = 0;
    let last = performance.now();
    let t = 0;
    const radius = size * 0.26;

    ctx.font = `${Math.max(cell * 1.15, 6)}px ui-monospace, "SF Mono", Menlo, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 30 fps (2026-09-20): ~3,100 fillText calls per frame was 5 ms of main
    // thread every frame the portrait was on screen, and a scan band does
    // not need sixty of them. Skipped frames still advance the clock.
    let acc = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || !lum || !rgb) return;
      acc += dt;
      if (acc < 1 / 31) return;
      t += acc;
      acc = 0;

      pointer.x = damp(pointer.x, target.on ? target.x : pointer.x, 8, dt);
      pointer.y = damp(pointer.y, target.on ? target.y : pointer.y, 8, dt);
      pointer.on = damp(pointer.on, target.on, 5, dt);

      // Scan band position, wrapping.
      const scan = ((t * 0.28) % 1.3) * size - size * 0.15;

      ctx.clearRect(0, 0, size, size);

      for (let gy = 0; gy < cells; gy++) {
        for (let gx = 0; gx < cells; gx++) {
          const i = gy * cells + gx;
          const l = lum[i];
          if (l < 0.06) continue;

          let x = gx * cell + cell / 2;
          let y = gy * cell + cell / 2;

          // Field: cells inside the pointer radius are pushed outward and
          // resolve toward the real photo.
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const d = Math.hypot(dx, dy);
          const f = Math.max(0, 1 - d / radius) * pointer.on;
          if (f > 0 && d > 0.001) {
            x += (dx / d) * f * f * cell * 1.6;
            y += (dy / d) * f * f * cell * 1.6;
          }

          // Scan band: a bright line that lifts brightness as it passes.
          const sb = Math.max(0, 1 - Math.abs(y - scan) / (cell * 2.2));

          // Random flicker.
          if (!reduced) {
            if (flicker[i] > 0) flicker[i] -= dt;
            else if (Math.random() < 0.0012) {
              flicker[i] = 0.12 + Math.random() * 0.2;
              flickerGlyph[i] = 1 + Math.floor(Math.random() * (RAMP.length - 1));
            }
          }

          const idx = flicker[i] > 0 ? flickerGlyph[i] : Math.min(RAMP.length - 1, Math.floor(l * (RAMP.length - 1) + 0.5));
          const ch = RAMP[idx];
          if (ch === " ") continue;

          const reveal = f * f;
          if (reveal > 0.02) {
            // Toward the true colour, a touch lifted.
            const r = rgb[i * 4];
            const g = rgb[i * 4 + 1];
            const b = rgb[i * 4 + 2];
            const mr = Math.round(60 + (r - 60) * reveal);
            const mg = Math.round(221 + (g - 221) * reveal);
            const mb = Math.round(158 + (b - 158) * reveal);
            ctx.fillStyle = `rgba(${mr}, ${mg}, ${mb}, ${0.35 + l * 0.65})`;
          } else {
            const a = 0.28 + l * 0.6 + sb * 0.4;
            ctx.fillStyle = sb > 0.4 ? `rgba(245, 245, 245, ${Math.min(a, 1)})` : `rgba(60, 221, 158, ${Math.min(a, 1)})`;
          }
          ctx.fillText(ch, x, y);
        }
      }

      // The scan line itself.
      ctx.fillStyle = "rgba(60, 221, 158, 0.18)";
      ctx.fillRect(0, scan - 1, size, 2);
    };

    if (reduced) {
      // Wait for the image, draw once.
      const once = () => {
        if (lum) {
          draw(performance.now());
          cancelAnimationFrame(raf);
        } else window.setTimeout(once, 60);
      };
      once();
    } else raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [src, size, cells]);

  return (
    <span style={{ position: "relative", display: "block", width: size, height: size }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: size, height: size, cursor: "crosshair" }}
        aria-hidden="true"
      />
      {/* The photo stays in the document for alt text and no-JS. */}
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        style={{ position: "absolute", inset: 0, width: size, height: size, opacity: 0, pointerEvents: "none" }}
      />
    </span>
  );
}
