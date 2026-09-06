import * as THREE from "three";
import { signatureFigure } from "@/lib/signature";

/**
 * A mission's card face, drawn once into a canvas and cached forever.
 *
 * Mirrors `glowTexture.ts`: procedural, module-scope singleton cache, built
 * lazily on the client and never on the server. The figure is the SAME walk
 * `MissionSignature` renders as SVG — both call `signatureFigure`, so a card
 * and its page can never show different traces for the same mission.
 *
 * WHY NOT RENDER THE SVG COMPONENT
 *
 * `renderToStaticMarkup` -> `data:image/svg+xml` -> `Image` -> `drawImage` pulls
 * `react-dom/server` into the CLIENT bundle and adds an async decode that then
 * has to be sequenced against first render. Replaying the geometry with Canvas2D
 * primitives is synchronous, has no bundle cost, and every SVG element used has
 * a direct 2D equivalent.
 *
 * TEXTURE BUDGET — read before changing SIZE
 *
 * A card is 1.0 x 1.4 world units and never fills the screen; at the rig's
 * framing the nearest card is roughly 500 device px tall. 384x512 is therefore
 * already generous, and sizing off `devicePixelRatio` would be waste that scales
 * with the reader's monitor.
 *
 *   384 x 512 x 4 bytes = 786 KB, x1.33 for mipmaps = ~1.05 MB per card
 *   x10 missions        = ~10.5 MB desktop
 *   256 x 352 coarse    = ~4.8 MB
 *
 * Both sit inside a mid-range mobile GPU budget. Raising SIZE raises this
 * quadratically.
 */

const SIZE = { w: 384, h: 512 };
const SIZE_COARSE = { w: 256, h: 352 };

/** Palette, from src/styles/tokens.scss. Kept literal — this is a canvas, not CSS. */
const BG = "#0b0b0b";
const HAIRLINE = "#1a1a1a";
const TEXT = "#f5f5f5";
const MUTED = "#8c8c8c";
const ACCENT = "#22d0b2";

const cache = new Map<string, THREE.CanvasTexture>();

export type CardFace = {
  slug: string;
  title: string;
  org: string;
  period: string;
  /** Optional headline metric, drawn small under the trace. */
  signal?: string;
};

/**
 * A 1x1 stand-in used until a card's real face has been built.
 *
 * Cards mount before their textures exist — the real ones are built across idle
 * slices so ten Canvas2D draws do not land as one dropped frame right as the
 * reader arrives. Without a placeholder the material would flash white.
 */
let placeholder: THREE.CanvasTexture | null = null;
export function getPlaceholderTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (placeholder) return placeholder;
  const c = document.createElement("canvas");
  c.width = 1;
  c.height = 1;
  const g = c.getContext("2d");
  if (!g) return null;
  g.fillStyle = BG;
  g.fillRect(0, 0, 1, 1);
  placeholder = new THREE.CanvasTexture(c);
  placeholder.colorSpace = THREE.SRGBColorSpace;
  return placeholder;
}

/** Wraps text to `max` px, returning at most `lines` lines with an ellipsis. */
function wrap(g: CanvasRenderingContext2D, text: string, max: number, lines: number) {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > max && line) {
      out.push(line);
      line = word;
      if (out.length === lines) break;
    } else {
      line = next;
    }
  }
  if (out.length < lines && line) out.push(line);
  if (out.length === lines && words.length) {
    const last = out[lines - 1];
    if (g.measureText(text).width > max * lines) {
      out[lines - 1] = last.replace(/\s*\S*$/, "") + "…";
    }
  }
  return out;
}

function draw(g: CanvasRenderingContext2D, face: CardFace, w: number, h: number) {
  const pad = Math.round(w * 0.075);

  // ── Panel. Square corners, translucent-reading fill, one hairline border —
  // the "panels, not cards" rule from DESIGN_DIRECTION.md, which still governs
  // surfaces even though textures are now allowed on them.
  g.fillStyle = BG;
  g.fillRect(0, 0, w, h);

  // ── The signature trace, in a band across the middle of the card.
  const traceH = Math.round(h * 0.3);
  const traceY = Math.round(h * 0.4);
  const traceW = w - pad * 2;
  const { points, liveIndex } = signatureFigure(face.slug, traceW, traceH);
  const px = (i: number) => pad + points[i][0];
  const py = (i: number) => traceY + points[i][1];

  // Baseline grid — three rules, not graph paper.
  g.strokeStyle = "rgba(245,245,245,0.09)";
  g.lineWidth = 1;
  for (const f of [0.25, 0.5, 0.75]) {
    const y = Math.round(traceY + traceH * f) + 0.5;
    g.beginPath();
    g.moveTo(pad, y);
    g.lineTo(w - pad, y);
    g.stroke();
  }

  // Area wash under the trace, dying out before the baseline.
  const area = g.createLinearGradient(0, traceY, 0, traceY + traceH);
  area.addColorStop(0, "rgba(34,208,178,0.28)");
  area.addColorStop(0.6, "rgba(34,208,178,0.06)");
  area.addColorStop(1, "rgba(34,208,178,0)");
  g.fillStyle = area;
  g.beginPath();
  g.moveTo(px(0), py(0));
  for (let i = 1; i < points.length; i++) g.lineTo(px(i), py(i));
  g.lineTo(w - pad, traceY + traceH);
  g.lineTo(pad, traceY + traceH);
  g.closePath();
  g.fill();

  // Stroke fades in from the left, so the trace reads as arriving.
  const stroke = g.createLinearGradient(pad, 0, w - pad, 0);
  stroke.addColorStop(0, "rgba(34,208,178,0.15)");
  stroke.addColorStop(0.55, "rgba(34,208,178,0.75)");
  stroke.addColorStop(1, "rgba(127,233,213,1)");
  g.strokeStyle = stroke;
  g.lineWidth = Math.max(w / 190, 1.5);
  g.lineJoin = "round";
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(px(0), py(0));
  for (let i = 1; i < points.length; i++) g.lineTo(px(i), py(i));
  g.stroke();

  // Bloom under the live node, so its core stays crisp.
  const r = w * 0.047;
  const bloom = g.createRadialGradient(px(liveIndex), py(liveIndex), 0, px(liveIndex), py(liveIndex), r);
  bloom.addColorStop(0, "rgba(159,251,232,0.95)");
  bloom.addColorStop(0.45, "rgba(34,208,178,0.45)");
  bloom.addColorStop(1, "rgba(34,208,178,0)");
  g.fillStyle = bloom;
  g.beginPath();
  g.arc(px(liveIndex), py(liveIndex), r, 0, Math.PI * 2);
  g.fill();

  for (let i = 0; i < points.length; i++) {
    g.fillStyle = i === liveIndex ? "#c7fff2" : "rgba(245,245,245,0.3)";
    g.beginPath();
    g.arc(px(i), py(i), i === liveIndex ? w * 0.0135 : w * 0.0068, 0, Math.PI * 2);
    g.fill();
  }

  // ── Type. Mono metadata, declarative title — the editorial law still holds
  // on the card face even though the card itself is a textured quad.
  const mono = `500 ${Math.round(w * 0.036)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  const sans = `600 ${Math.round(w * 0.082)}px ui-sans-serif, system-ui, -apple-system, sans-serif`;

  g.textBaseline = "top";
  g.font = mono;
  g.fillStyle = MUTED;
  g.fillText(face.org.toUpperCase(), pad, pad);

  g.font = sans;
  g.fillStyle = TEXT;
  const titleLines = wrap(g, face.title, w - pad * 2, 3);
  const lh = Math.round(w * 0.098);
  titleLines.forEach((line, i) => g.fillText(line, pad, pad + Math.round(w * 0.085) + i * lh));

  g.font = mono;
  g.fillStyle = MUTED;
  g.fillText(face.period, pad, h - pad - Math.round(w * 0.036));

  if (face.signal) {
    g.fillStyle = ACCENT;
    const text = face.signal.toUpperCase();
    g.fillText(text, w - pad - g.measureText(text).width, h - pad - Math.round(w * 0.036));
  }

  // ── Hairline border and corner registration ticks.
  g.strokeStyle = HAIRLINE;
  g.lineWidth = 2;
  g.strokeRect(1, 1, w - 2, h - 2);

  g.strokeStyle = "rgba(34,208,178,0.45)";
  g.lineWidth = Math.max(w / 190, 1.5);
  const tick = Math.round(w * 0.052);
  for (const [cx, cy, sx, sy] of [
    [0, 0, 1, 1],
    [w, 0, -1, 1],
    [0, h, 1, -1],
    [w, h, -1, -1],
  ]) {
    g.beginPath();
    g.moveTo(cx + sx * tick, cy + sy * 2);
    g.lineTo(cx + sx * 2, cy + sy * 2);
    g.lineTo(cx + sx * 2, cy + sy * tick);
    g.stroke();
  }
}

/**
 * The texture for one mission. Built once, cached at module scope.
 *
 * Returns null on the server. Never call this inside a frame loop — it is a
 * full canvas repaint, and `ProjectCard` takes the finished texture as a prop
 * precisely so it cannot.
 */
export function getCardTexture(face: CardFace, coarse = false): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;

  const key = `${face.slug}:${coarse ? "c" : "d"}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const { w, h } = coarse ? SIZE_COARSE : SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) return null;

  draw(g, face, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  cache.set(key, tex);
  return tex;
}

/** Frees every cached face. For unmount and HMR; safe to call repeatedly. */
export function disposeCardTextures() {
  for (const tex of cache.values()) tex.dispose();
  cache.clear();
  placeholder?.dispose();
  placeholder = null;
}
