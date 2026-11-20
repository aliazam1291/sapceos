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

/*
 * Baked, not computed (2026-11-20). The four clouds were generated here at
 * startup — 256² pixels × two octaves of value noise each, ~350 ms of main
 * thread at 4× CPU (tools/startup-profile.mjs). The same seeds and maths now
 * run once in tools/bake-nebula.mjs → public/textures/nebula-N.png, and the
 * PNG is drawn into the same CanvasTexture when it arrives. The texture
 * object exists from the first frame, so every material is created with its
 * map and nothing recompiles when the pixels land (the 2026-09-20 rule).
 */
function cloudTexture(n: number): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    ctx.drawImage(img, 0, 0, size, size);
    tex.needsUpdate = true;
  };
  img.src = `/textures/nebula-${n}.png`;
  return tex;
}

function getCloudTextures() {
  if (cache) return cache;
  cache = [1, 2, 3, 4].map((n) => cloudTexture(n)).filter((t): t is THREE.CanvasTexture => t !== null);
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
