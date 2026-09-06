"use client";

import { useEffect, useRef } from "react";
import { damp } from "@/lib/scroll-signal";
import styles from "./DeepSpace.module.scss";

/**
 * The one persistent space layer for the whole site.
 *
 * This is a TRAVELLING field, not a wallpaper. Stars live at real depths and
 * the camera is always moving through them: they grow, brighten and slide off
 * the edges of the screen, and scrolling is the throttle — down accelerates the
 * approach, up reverses it. That is the difference between "there are stars
 * behind the page" and "the page is somewhere".
 *
 * They are also CLUSTERED. Uniform random scatter is the single thing that
 * makes a star field read as noise: real sky has knots and voids. Stars are
 * drawn around a handful of cluster seeds, each seed carrying a faint nebular
 * glow that swells as you fly into it, so the depth has landmarks in it rather
 * than being an even fog you never appear to make progress through.
 *
 * Deliberately canvas 2D, not WebGL. A layer present on every route must not
 * hold a GL context — the budget is two live contexts per scroll position and
 * the galaxy and the pinned sequence already spend both.
 */

/* ── Field geometry ───────────────────────────────────────────────────────── */

const Z_NEAR = 0.3;
const Z_FAR = 3.4;
const Z_RANGE = Z_FAR - Z_NEAR;

/** Half-extent of the generated field in world units, at unit depth. */
const SPREAD = 1.35;

/** Constant approach speed, in depth units per second, with no scroll at all. */
const IDLE_SPEED = 0.055;
/** Ceiling on the scroll throttle, so a fling can't turn this into a warp gate. */
const MAX_THROTTLE = 1.5;

const CLUSTERS = 11;
/** Share of stars that belong to a cluster; the rest fill the voids between. */
const CLUSTER_SHARE = 0.66;

type Tint = { r: number; g: number; b: number };

// Three populations. Mostly cold white, a few carrying the signal colour, a
// few warm — a monochrome field reads synthetic, a colourful one reads like a
// screensaver.
const TINTS: Tint[] = [
  { r: 226, g: 236, b: 245 },
  { r: 34, g: 208, b: 178 },
  { r: 255, g: 206, b: 150 },
];

type Star = {
  x: number;
  y: number;
  z: number;
  size: number;
  /** Index into TINTS. Stars are generated pre-sorted by this. */
  tint: number;
  bright: number;
  phase: number;
  rate: number;
};

type Cluster = { x: number; y: number; z: number; r: number; tint: number };

/** mulberry32 — deterministic, so the sky is the same every reload. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildField(count: number) {
  const rand = rng(0x5eed);
  const gauss = () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const clusters: Cluster[] = [];
  for (let i = 0; i < CLUSTERS; i++) {
    clusters.push({
      x: (rand() * 2 - 1) * SPREAD * 0.92,
      y: (rand() * 2 - 1) * SPREAD * 0.92,
      z: Z_NEAR + rand() * Z_RANGE,
      r: 0.16 + rand() * 0.2,
      // Most clusters are cold; two in eleven carry the signal colour.
      tint: rand() < 0.2 ? 1 : 0,
    });
  }

  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const inCluster = rand() < CLUSTER_SHARE;
    let x: number;
    let y: number;
    let z: number;
    let bright: number;

    if (inCluster) {
      const c = clusters[(rand() * CLUSTERS) | 0];
      // Depth scatter is wider than the lateral scatter, so a cluster is a
      // volume you fly THROUGH rather than a disc you fly at.
      x = c.x + gauss() * c.r;
      y = c.y + gauss() * c.r;
      z = c.z + gauss() * c.r * 2.4;
      bright = 0.3 + Math.pow(rand(), 2.2) * 0.95;
    } else {
      x = (rand() * 2 - 1) * SPREAD;
      y = (rand() * 2 - 1) * SPREAD;
      z = Z_NEAR + rand() * Z_RANGE;
      bright = 0.16 + Math.pow(rand(), 2.8) * 0.8;
    }

    // Heavily skewed: an evenly-sized field looks like a texture. Most stars
    // are specks, a handful are genuinely bright — and the handful is what the
    // eye actually reads as "stars", so the tail matters more than the median.
    const size = 0.5 + Math.pow(rand(), 4.4) * 3.4;

    const roll = rand();
    const tint = roll < 0.075 ? 1 : roll < 0.105 ? 2 : 0;

    stars.push({
      x,
      y,
      z,
      size,
      tint,
      bright,
      phase: rand() * Math.PI * 2,
      // Small stars flicker faster than big ones, which is what the eye expects.
      rate: 0.5 + rand() * 1.3,
    });
  }

  // Pre-sorted by tint so the draw loop touches `fillStyle` three times per
  // frame instead of once per star.
  stars.sort((a, b) => a.tint - b.tint);

  return { stars, clusters };
}

/** One radial-falloff sprite, rendered once, reused for every cluster glow. */
function buildGlow(tint: Tint) {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (!g) return c;

  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${tint.r},${tint.g},${tint.b},0.34)`);
  grad.addColorStop(0.28, `rgba(${tint.r},${tint.g},${tint.b},0.08)`);
  grad.addColorStop(1, `rgba(${tint.r},${tint.g},${tint.b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

/**
 * One star, pre-rendered once per tint and reused for the whole field.
 *
 * Stars used to be drawn as `fillRect` squares — cheap, and the reason the sky
 * read as sensor dust. A 1px hard-edged square has no core and no falloff, so
 * at any size it is a flat grey smudge; blown up 3x the larger ones looked like
 * dead pixels. A sprite scaled with `drawImage` is smoothly resampled at every
 * size, which is what makes a point of light look like a point of light.
 *
 * The gradient is deliberately steep: a hot core inside about a tenth of the
 * radius, then a fast falloff into a wide, very faint halo. A gentle gradient
 * is what makes every star read as a soft blob.
 */
function buildStar(tint: Tint, spikes: boolean) {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (!g) return c;

  const mid = size / 2;
  const rgb = `${tint.r},${tint.g},${tint.b}`;

  if (spikes) {
    // Only the brightest handful get diffraction spikes. It is the detail that
    // separates "a dot" from "a star" — but on every star it would read as a
    // lens filter, so it is reserved for the few that are genuinely bright.
    g.globalCompositeOperation = "lighter";
    for (const [w, h] of [
      [size, 1.4],
      [1.4, size],
    ]) {
      const grad = g.createLinearGradient(
        w > h ? 0 : mid, w > h ? mid : 0,
        w > h ? size : mid, w > h ? mid : size,
      );
      grad.addColorStop(0, `rgba(${rgb},0)`);
      grad.addColorStop(0.5, `rgba(${rgb},0.55)`);
      grad.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = grad;
      g.fillRect(mid - w / 2, mid - h / 2, w, h);
    }
  }

  const grad = g.createRadialGradient(mid, mid, 0, mid, mid, mid);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.08, `rgba(${rgb},0.92)`);
  grad.addColorStop(0.18, `rgba(${rgb},0.42)`);
  grad.addColorStop(0.38, `rgba(${rgb},0.11)`);
  grad.addColorStop(0.68, `rgba(${rgb},0.03)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.globalCompositeOperation = "lighter";
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

/** 0 → 1 across [edge0, edge1], with the ends flattened. */
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

export default function DeepSpace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const { stars, clusters } = buildField(coarse ? 480 : 1150);
    const glows = TINTS.map(buildGlow);
    const stars9 = TINTS.map((t) => buildStar(t, false));
    const bright9 = TINTS.map((t) => buildStar(t, true));

    // Fill rate is the whole cost of a full-screen 2D canvas, and it scales with
    // the square of this. Stars are 1-3px specks: past ~1.5 there is nothing left
    // to resolve, and a phone gets none of it.
    const dprCap = coarse ? 1 : 1.5;
    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let focal = 0;

    /*
     * The cluster glows are drawn into their own quarter-resolution buffer and
     * upscaled once, instead of straight onto the main canvas.
     *
     * Measured (tools/fieldcost.mjs, 1440x900): the 823 visible STARS cost
     * 0.08M pixels a frame — nothing. The eleven glows cost 12.61M, which is
     * 99.4% of the field's fill and roughly ten full viewports of additive
     * blending per frame. A glow's source sprite is a 128px radial gradient, so
     * blowing it up to ~2000px on screen buys no detail at all; it is pure
     * fill. Compositing them at quarter resolution divides that by sixteen and
     * is visually indistinguishable, because the thing being scaled is already
     * a smooth low-frequency gradient.
     *
     * Additive blending is associative, so accumulating the glows into a
     * transparent buffer and then adding that buffer is the same image as
     * adding each glow to the canvas directly — the compounding where clusters
     * overlap, which is the whole point of the pass, is preserved.
     */
    const GLOW_SCALE = 0.25;
    const glowBuf = document.createElement("canvas");
    const gctx = glowBuf.getContext("2d");
    let gw = 0;
    let gh = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // The glow buffer is sized off CSS pixels, not dpr: it is deliberately
      // low-resolution, and scaling it with the display would undo the saving.
      gw = Math.max(Math.round(w * GLOW_SCALE), 1);
      gh = Math.max(Math.round(h * GLOW_SCALE), 1);
      glowBuf.width = gw;
      glowBuf.height = gh;
      cx = w / 2;
      cy = h / 2;
      // Framing constant. Tied to the diagonal so the field covers ultrawide
      // and portrait alike without regenerating anything.
      focal = Math.hypot(w, h) * 0.42;
    };

    resize();

    /* ── Motion state ──────────────────────────────────────────────────────
     * Scroll is READ inside the frame loop and damped toward, never animated
     * off the scroll event itself. `camZ` is how far the camera has travelled;
     * everything else is derived from it.
     */
    let camZ = 0;
    let throttle = 0;
    let lastY = window.scrollY;
    let clock = 0;

    /*
     * Pointer parallax — the sky's lateral position, damped toward the cursor.
     *
     * This is true parallax, not a uniform slide: the offset is applied in
     * WORLD space and then projected, so it is divided by depth on the way out.
     * Near stars swing across; distant ones barely move. That difference is the
     * whole effect — shifting the entire field by the same number of pixels
     * reads as the page sliding, not as depth.
     *
     * Skipped on coarse pointers: there is no cursor to follow, and it would
     * only cost frames.
     */
    let panX = 0;
    let panY = 0;
    let panTargetX = 0;
    let panTargetY = 0;

    const draw = (dt: number) => {
      clock += dt;

      ctx.clearRect(0, 0, w, h);

      // ── Cluster glows first, so stars sit on top of their own nebulosity.
      // Additive only here, because overlapping glows should compound and it is
      // ten draw calls. Large translucent fills are the expensive part of a 2D
      // canvas, so a coarse pointer skips the pass entirely — the density of
      // the stars themselves still carries the clustering.
      if (!coarse && gctx) {
        gctx.clearRect(0, 0, gw, gh);
        gctx.globalCompositeOperation = "lighter";
        let drew = false;
        for (let i = 0; i < clusters.length; i++) {
          const c = clusters[i];
          const z = ((((c.z - camZ - Z_NEAR) % Z_RANGE) + Z_RANGE) % Z_RANGE) + Z_NEAR;
          const k = focal / z;
          const sx = cx + (c.x - panX) * k;
          const sy = cy + (c.y - panY) * k;
          const d = c.r * k * 3.2;
          if (d < 24) continue;
          if (sx + d < 0 || sx - d > w || sy + d < 0 || sy - d > h) continue;

          // Deliberately faint. Anything stronger stops reading as a distant
          // knot of stars and starts reading as fog laid over the page, which
          // lifts the #050505 ground everything else is judged against.
          const a =
            0.13 *
            smoothstep(Z_NEAR, Z_NEAR + 0.5, z) *
            smoothstep(Z_FAR, Z_FAR - 1.1, z);
          if (a <= 0.002) continue;

          gctx.globalAlpha = a;
          gctx.drawImage(
            glows[c.tint],
            (sx - d) * GLOW_SCALE,
            (sy - d) * GLOW_SCALE,
            d * 2 * GLOW_SCALE,
            d * 2 * GLOW_SCALE,
          );
          drew = true;
        }
        gctx.globalAlpha = 1;
        gctx.globalCompositeOperation = "source-over";

        // One upscale for the whole pass. Skipped entirely when every cluster
        // culled, so an empty stretch of sky costs nothing at all.
        if (drew) {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 1;
          ctx.drawImage(glowBuf, 0, 0, gw, gh, 0, 0, w, h);
        }
        ctx.globalCompositeOperation = "source-over";
      }

      /*
       * Stars, drawn additively.
       *
       * `source-over` was a perf choice and it cost the field everything: with
       * no accumulation a star can never be brighter than its own alpha, so the
       * whole sky sat in one dim grey band and clusters did not glow where they
       * overlapped. Additive is what lets cores burn to white and dense knots
       * build up, which is the entire point of clustering them.
       */
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const z = ((((s.z - camZ - Z_NEAR) % Z_RANGE) + Z_RANGE) % Z_RANGE) + Z_NEAR;
        const k = focal / z;
        const sx = cx + (s.x - panX) * k;
        const sy = cy + (s.y - panY) * k;
        if (sx < -12 || sx > w + 12 || sy < -12 || sy > h + 12) continue;

        // Fade in out of the far distance and dissolve just before passing the
        // camera, so the depth wrap is never a pop.
        const fade = smoothstep(Z_NEAR, Z_NEAR + 0.42, z) * smoothstep(Z_FAR, Z_FAR - 1.0, z);
        if (fade <= 0.004) continue;

        // Small stars scintillate hard; big ones barely do. That asymmetry is
        // both what the sky actually does and what stops the field looking
        // like a string of fairy lights blinking in unison.
        const depth = 1 - Math.min(s.size / 3.2, 1) * 0.7;
        const twinkle = 1 - depth * 0.45 * (0.5 - 0.5 * Math.sin(clock * s.rate + s.phase));
        // Global level. The field has to read as depth BEHIND the page — at
        // full strength the brightest stars competed with the galaxy in the
        // hero and with body copy everywhere else.
        const a = s.bright * fade * twinkle * 0.82;
        if (a <= 0.012) continue;

        /*
         * Radius is generous and floored at 0.75px. The old scale left most of
         * the field genuinely sub-pixel — a 0.3px speck at 40% alpha, which is
         * indistinguishable from noise — so the sky looked sparse and dirty no
         * matter how many stars were in it. Depth now reads through BRIGHTNESS,
         * which is how distance actually reads, and size carries the difference
         * between a faint star and a bright one.
         */
        const r = Math.min(Math.max(s.size * k * 0.0038, 1), 5);
        // Roughly one star in eighty. At the 14% the first pass produced, the
        // sky read as a lens filter rather than as a sky.
        const sprite = (s.size > 3.4 ? bright9 : stars9)[s.tint];

        ctx.globalAlpha = Math.min(a, 1);
        // Extent is 5x the core radius: enough halo to glow, tight enough that
        // a field of them does not turn into bokeh.
        ctx.drawImage(sprite, sx - r * 2.5, sy - r * 2.5, r * 5, r * 5);
      }

      ctx.globalAlpha = 1;
    };

    if (reduced) {
      // A genuinely different build: one static frame, no loop, no listeners.
      draw(0);
      const onResizeStatic = () => {
        resize();
        draw(0);
      };
      window.addEventListener("resize", onResizeStatic);
      return () => window.removeEventListener("resize", onResizeStatic);
    }

    let raf = 0;
    let prev = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;

      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;

      // Scroll is the throttle: down flies in, up flies back out. Damped, so
      // the field keeps coasting after the wheel stops instead of jerking.
      const target = Math.max(Math.min(dy * 0.05, MAX_THROTTLE), -MAX_THROTTLE);
      throttle = damp(throttle, target, 2.4, dt);
      // Below the idle floor the field would stall or crawl backwards on a
      // hard scroll-up; clamping keeps it always moving, just sometimes slowly.
      camZ += (IDLE_SPEED + throttle) * dt;

      // Read the pointer in the loop and damp toward it, the same contract the
      // scroll throttle follows — chasing pointermove directly ties the motion
      // to event frequency and reads as jitter.
      panX = damp(panX, panTargetX, 2.6, dt);
      panY = damp(panY, panTargetY, 2.6, dt);

      draw(dt);
    };

    const onResize = () => resize();
    window.addEventListener("resize", onResize, { passive: true });

    // How far the sky leans, in world units, at the edge of the viewport. Small
    // on purpose: this should register as the page having depth, never as the
    // background sliding around under the text.
    const PAN = 0.055;
    const onPointer = (e: PointerEvent) => {
      panTargetX = (e.clientX / w - 0.5) * 2 * PAN;
      panTargetY = (e.clientY / h - 0.5) * 2 * PAN * 0.6;
    };
    // Leaving the window returns the sky to centre rather than freezing it
    // wherever the cursor happened to exit.
    const onLeave = () => {
      panTargetX = 0;
      panTargetY = 0;
    };
    if (!coarse) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }

    // The loop is suspended entirely while the tab is in the background.
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        prev = performance.now();
        lastY = window.scrollY;
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className={styles.deepSpace} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.nebula} />
      <div className={styles.horizon} />
    </div>
  );
}
