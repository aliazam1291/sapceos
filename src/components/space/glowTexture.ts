import * as THREE from "three";

/**
 * A soft radial falloff sprite, generated once and shared by every glow in the
 * scene (star halos, the galactic core). Procedural rather than a bundled PNG:
 * it's ~1KB of canvas work and avoids shipping a binary asset.
 */
let cached: THREE.CanvasTexture | null = null;

export function getGlowTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (cached) return cached;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  // Tight bright centre, long faint tail — a linear ramp reads as a flat disc.
  gradient.addColorStop(0.0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.12, "rgba(255,255,255,0.72)");
  gradient.addColorStop(0.28, "rgba(255,255,255,0.28)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.07)");
  gradient.addColorStop(1.0, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  cached = new THREE.CanvasTexture(canvas);
  cached.colorSpace = THREE.SRGBColorSpace;
  return cached;
}
