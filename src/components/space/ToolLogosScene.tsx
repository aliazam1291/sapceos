"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WarmShaders } from "./useWarmShaders";
import { quietGL } from "@/lib/gl";
import { perf } from "@/lib/perf";
import { useSceneFrameloop } from "@/lib/use-scene-frameloop";
import type { ToolLogo } from "@/content/toolkit";

/*
 * The toolkit's logos as objects in space (2026-10-31). Ali: "the tools I
 * code with — React, React Native, Node.js, Figma, Illustrator — kinda use
 * 3D logos in space theme."
 *
 * Built from geometry, not images, so they have real depth and light: the
 * React atom (a nucleus and three elliptical orbits), the same atom in a
 * phone for React Native, Node's hexagon with "JS" on its face, Figma's
 * five pieces extruded, Illustrator's "Ai" tile — in the site's colours,
 * not the brands' (Ali, same day: "the 3D icons in our colours"): emerald
 * and mint for the atoms, the hexagon and the Figma family, gunmetal for
 * the phone and the tile, and one red-hot core — Figma's circle — since red
 * is heat in the 3D. The shapes say which tool; the colours say whose. Each
 * stands over an emerald pad ring (an object stands on a floor line). Lit
 * like the landing's figure: emerald from the left, red heat from the
 * right. They warp in one by one when the reader arrives, the atoms spin,
 * the rest sway; the one under the pointer (or its label) turns to face you
 * and lifts. Slot i sits over the i-th of five equal columns, so the HTML
 * labels under the canvas line up with no measuring.
 */

// Space OS, not the brands: mint → emerald → deep green, gunmetal, one heat.
const PALETTE = {
  mint: "#8af0c8",
  emerald: "#3cdd9e",
  green: "#2fbf8a",
  deep: "#1a8f68",
  night: "#0f3b2e",
  gunmetal: "#1d2224",
  heat: "#ff3d2e",
  ink: "#04110c",
};

function std(color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.38, ...opts });
}

function textTexture(text: string, color: string, font: string) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = color;
    g.font = font;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 128, 138);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function roundedRect(w: number, h: number, r: number, cx = 0, cy = 0) {
  const s = new THREE.Shape();
  const x = cx - w / 2;
  const y = cy - h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function extrude(shape: THREE.Shape, depth: number, bevel = 0.02) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 24 });
  g.translate(0, 0, -depth / 2);
  return g;
}

function atom(): THREE.Group {
  const g = new THREE.Group();
  const orbit = std(PALETTE.emerald, { emissive: PALETTE.deep, emissiveIntensity: 0.55, metalness: 0.35, roughness: 0.28 });
  const core = std(PALETTE.mint, { emissive: PALETTE.mint, emissiveIntensity: 0.9, metalness: 0.1, roughness: 0.3 });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 32, 16), core));
  for (let i = 0; i < 3; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.z = (i * Math.PI) / 3;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.032, 16, 96), orbit);
    ring.scale.set(1, 0.36, 1);
    pivot.add(ring);
    g.add(pivot);
  }
  return g;
}

function reactNative(): THREE.Group {
  const g = new THREE.Group();
  const body = roundedRect(0.62, 1.0, 0.1);
  body.holes.push(roundedRect(0.52, 0.88, 0.06));
  g.add(new THREE.Mesh(extrude(body, 0.08, 0.015), std(PALETTE.gunmetal, { metalness: 0.7, roughness: 0.32, emissive: PALETTE.night, emissiveIntensity: 0.35 })));
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.88),
    new THREE.MeshBasicMaterial({ color: "#0b1d17", transparent: true, opacity: 0.85 }),
  );
  screen.position.z = -0.02;
  g.add(screen);
  const a = atom();
  a.scale.setScalar(0.52);
  a.position.z = 0.02;
  a.userData.spin = true;
  g.add(a);
  return g;
}

function node(): THREE.Group {
  const g = new THREE.Group();
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.2, 6, 1), std(PALETTE.green, { metalness: 0.45, roughness: 0.3, emissive: PALETTE.night, emissiveIntensity: 0.4 }));
  hex.rotation.x = Math.PI / 2;
  g.add(hex);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.62),
    new THREE.MeshBasicMaterial({ map: textTexture("JS", PALETTE.ink, "800 112px Arial, Helvetica, sans-serif"), transparent: true }),
  );
  face.position.z = 0.105;
  g.add(face);
  return g;
}

function figma(): THREE.Group {
  const g = new THREE.Group();
  const r = 0.25;
  const left = (x0: number, y0: number) => {
    const s = new THREE.Shape();
    s.moveTo(x0 + r, y0);
    s.lineTo(x0 + 2 * r, y0);
    s.lineTo(x0 + 2 * r, y0 + 2 * r);
    s.lineTo(x0 + r, y0 + 2 * r);
    s.absarc(x0 + r, y0 + r, r, Math.PI / 2, 1.5 * Math.PI, false);
    return s;
  };
  const right = (x0: number, y0: number) => {
    const s = new THREE.Shape();
    s.moveTo(x0 + r, y0 + 2 * r);
    s.lineTo(x0, y0 + 2 * r);
    s.lineTo(x0, y0);
    s.lineTo(x0 + r, y0);
    s.absarc(x0 + r, y0 + r, r, -Math.PI / 2, Math.PI / 2, false);
    return s;
  };
  const circle = (x0: number, y0: number) => {
    const s = new THREE.Shape();
    s.absarc(x0 + r, y0 + r, r, 0, Math.PI * 2, false);
    return s;
  };
  const drop = (x0: number, y0: number) => {
    const s = new THREE.Shape();
    s.moveTo(x0 + r, y0 + 2 * r);
    s.lineTo(x0 + 2 * r, y0 + 2 * r);
    s.lineTo(x0 + 2 * r, y0 + r);
    s.absarc(x0 + r, y0 + r, r, 0, -1.5 * Math.PI, true);
    return s;
  };
  const pieces: [THREE.Shape, string][] = [
    [left(-0.5, 0.25), PALETTE.mint],
    [right(0, 0.25), PALETTE.emerald],
    [left(-0.5, -0.25), PALETTE.deep],
    [circle(0, -0.25), PALETTE.heat],
    [drop(-0.5, -0.75), PALETTE.green],
  ];
  for (const [shape, color] of pieces) {
    // The circle is the one hot thing on the shelf: it glows.
    const hot = color === PALETTE.heat;
    g.add(
      new THREE.Mesh(
        extrude(shape, 0.12, 0.018),
        std(color, { metalness: 0.15, roughness: 0.35, emissive: hot ? PALETTE.heat : PALETTE.night, emissiveIntensity: hot ? 0.75 : 0.35 }),
      ),
    );
  }
  g.scale.setScalar(0.68);
  return g;
}

function illustrator(): THREE.Group {
  const g = new THREE.Group();
  const rim = new THREE.Mesh(extrude(roundedRect(1, 1, 0.2), 0.1, 0.02), std(PALETTE.emerald, { metalness: 0.5, roughness: 0.3, emissive: PALETTE.deep, emissiveIntensity: 0.45 }));
  g.add(rim);
  const tile = new THREE.Mesh(extrude(roundedRect(0.88, 0.88, 0.16), 0.12, 0.015), std(PALETTE.gunmetal, { metalness: 0.4, roughness: 0.4 }));
  tile.position.z = 0.02;
  g.add(tile);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.8),
    new THREE.MeshBasicMaterial({ map: textTexture("Ai", PALETTE.emerald, "700 124px Arial, Helvetica, sans-serif"), transparent: true }),
  );
  face.position.z = 0.1;
  g.add(face);
  g.scale.setScalar(0.86);
  return g;
}

const BUILD: Record<ToolLogo, () => THREE.Group> = { react: atom, "react-native": reactNative, node, figma, illustrator };
const SPINS: Record<ToolLogo, boolean> = { react: true, "react-native": false, node: false, figma: false, illustrator: false };

const FOV = 28;
const DIST = 9;

function Shelf({ logos, hover, go }: { logos: ToolLogo[]; hover: MutableRefObject<number>; go: boolean }) {
  const { size } = useThree();
  const clock = useRef(0);
  const startAt = useRef(-1);

  const slots = useMemo(
    () =>
      logos.map((kind) => {
        const holder = new THREE.Group();
        const logo = BUILD[kind]();
        holder.add(logo);
        const pad = new THREE.Mesh(
          new THREE.RingGeometry(0.46, 0.5, 64),
          new THREE.MeshBasicMaterial({ color: "#3cdd9e", transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }),
        );
        pad.rotation.x = -Math.PI / 2;
        pad.position.y = -0.66;
        holder.add(pad);
        return { kind, holder, logo, pad, lift: 0 };
      }),
    [logos],
  );

  useEffect(
    () => () => {
      for (const s of slots) {
        s.holder.traverse((o) => {
          const m = o as THREE.Mesh;
          m.geometry?.dispose();
          const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
          for (const mat of mats) {
            (mat as THREE.MeshBasicMaterial).map?.dispose();
            mat.dispose();
          }
        });
      }
    },
    [slots],
  );

  // Five equal columns across the canvas, at the z = 0 plane.
  const visH = 2 * DIST * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const visW = visH * (size.width / Math.max(1, size.height));
  const slotW = visW / logos.length;
  const scale = Math.min(0.52 * visH, 0.62 * slotW);

  useFrame((_, dt) => {
    clock.current += Math.min(dt, 0.1);
    const t = clock.current;
    if (go && startAt.current < 0) startAt.current = t;
    slots.forEach((s, i) => {
      // Warp in: one by one, overshooting a little.
      const k = startAt.current < 0 ? 0 : THREE.MathUtils.clamp((t - startAt.current - i * 0.16) / 0.7, 0, 1);
      const arrive = k === 0 ? 0 : 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
      const on = hover.current === i ? 1 : 0;
      s.lift += (on - s.lift) * Math.min(1, dt * 6);
      const sc = scale * arrive * (1 + 0.14 * s.lift);
      s.holder.position.set(((i + 0.5) / logos.length - 0.5) * visW, Math.sin(t * 1.1 + i * 1.3) * 0.05 * scale + s.lift * 0.08 * scale, 0);
      s.holder.scale.setScalar(Math.max(sc, 0.0001));
      const sway = Math.sin(t * 0.7 + i * 1.7) * 0.5;
      const yaw = SPINS[s.kind] ? t * 0.8 : sway;
      s.logo.rotation.y = THREE.MathUtils.lerp(yaw, 0, s.lift);
      s.logo.rotation.x = Math.sin(t * 0.5 + i) * 0.08;
      s.logo.traverse((o) => {
        if (o.userData.spin) o.rotation.y = t * 0.9;
      });
      (s.pad.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.35 * s.lift;
    });
  });

  return (
    <>
      {slots.map((s, i) => (
        <primitive key={i} object={s.holder} />
      ))}
    </>
  );
}

export default function ToolLogosScene({
  logos,
  hover,
  go,
}: {
  logos: ToolLogo[];
  /** Index of the logo under the pointer or its label, -1 for none. */
  hover: MutableRefObject<number>;
  /** The reader is here: warp in. */
  go: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visibleLoop = useSceneFrameloop(canvasRef, "0px");
  const [warm, setWarm] = useState(false);
  return (
    <Canvas
      ref={canvasRef}
      onCreated={quietGL}
      frameloop={!warm ? "never" : visibleLoop}
      dpr={perf.level === "low" ? 1 : [1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 0.15, DIST], fov: FOV, near: 0.1, far: 40 }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 8]} intensity={2.2} />
      <directionalLight position={[-7, 1, 3]} intensity={1.1} color="#3cdd9e" />
      <directionalLight position={[7, -1, 3]} intensity={0.9} color="#ff3d2e" />
      <Shelf logos={logos} hover={hover} go={go} />
      <WarmShaders onWarm={() => setWarm(true)} />
    </Canvas>
  );
}
