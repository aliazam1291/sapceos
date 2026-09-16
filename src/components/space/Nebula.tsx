"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/*
 * Nebula: colour and structure behind the disc.
 *
 * Space in this scene was black, and black has no depth. Six large, faint,
 * additive clouds sit far behind the galaxy — two warm, four cool — each
 * a procedurally generated texture (radial falloff × two octaves of value
 * noise, so the edges are ragged rather than a soft disc). They rotate at
 * different rates and, being far away, barely parallax against the disc,
 * which is exactly the cue that says "that is far".
 */

let cache: THREE.CanvasTexture[] | null = null;

function noise2(x: number, y: number, seed: number) {
  const h = (i: number, j: number) => {
    const n = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = h(i, j);
  const b = h(i + 1, j);
  const c = h(i, j + 1);
  const d = h(i + 1, j + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function cloudTexture(seed: number): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x / size - 0.5) * 2;
      const dy = (y / size - 0.5) * 2;
      const r = Math.sqrt(dx * dx + dy * dy);
      const fall = Math.max(0, 1 - r * r) ** 1.6;
      const n = noise2(x / 38, y / 38, seed) * 0.6 + noise2(x / 13, y / 13, seed + 9) * 0.4;
      const a = Math.max(0, fall * (n * 1.4 - 0.25));
      const k = (y * size + x) * 4;
      img.data[k] = 255;
      img.data[k + 1] = 255;
      img.data[k + 2] = 255;
      img.data[k + 3] = Math.min(255, a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function getCloudTextures() {
  if (cache) return cache;
  cache = [1, 2, 3, 4].map((s) => cloudTexture(s * 3.7)).filter((t): t is THREE.CanvasTexture => t !== null);
  return cache;
}

const CLOUDS = [
  { pos: [-9, 3, -18], scale: 18, color: "#ffb35a", opacity: 0.05, spin: 0.006, tex: 0 },
  { pos: [7, -2, -22], scale: 20, color: "#3cdd9e", opacity: 0.025, spin: -0.004, tex: 1 },
  { pos: [2, 6, -16], scale: 16, color: "#d98a7a", opacity: 0.035, spin: 0.009, tex: 2 },
  { pos: [-4, -6, -24], scale: 18, color: "#5fcfc0", opacity: 0.04, spin: -0.007, tex: 3 },
] as const;

export default function Nebula() {
  const group = useRef<THREE.Group>(null);
  const textures = useMemo(() => getCloudTextures(), []);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.children.forEach((c, i) => {
      const s = c as THREE.Sprite;
      s.material.rotation += CLOUDS[i].spin * dt;
    });
  });

  if (!textures.length) return null;
  return (
    <group ref={group}>
      {CLOUDS.map((c, i) => (
        <sprite key={i} position={c.pos as unknown as [number, number, number]} scale={[c.scale, c.scale, 1]}>
          <spriteMaterial map={textures[c.tex % textures.length]} color={c.color} opacity={c.opacity} transparent blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} />
        </sprite>
      ))}
    </group>
  );
}
