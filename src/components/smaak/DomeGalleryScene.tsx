"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { WarmShaders } from "@/components/space/useWarmShaders";
import { quietGL } from "@/lib/gl";
import { perf } from "@/lib/perf";
import type { GalleryItem } from "@/content/gallery";

/*
 * The dome gallery (2026-09-27). Ali: "we need a gallery kinda thing, like a
 * dome gallery in smaak.ux … my designs from Figma and Behance displayed."
 *
 * The work hangs on the inside of a sphere and the reader stands at its
 * centre. Drag spins the dome; release and it keeps its momentum and eases
 * down. Each frame is a plane placed on the sphere and turned to face the
 * middle, so the grid curves away in both directions the way a real
 * installation would.
 *
 * Why a dome rather than a wall of cards: a designer's portfolio is judged
 * on whether the work is shown with any confidence, and a grid of thumbnails
 * shows fourteen pieces as fourteen rows of a table. This shows them as a
 * room you are standing in. It is also honest about the medium — these are
 * screens and posters, so they are flat rectangles hung in space, not
 * boxes or tiles.
 *
 * Rules kept: `quietGL` and `WarmShaders` before the first frame, the loop
 * stops when the section is off screen, ring count and dpr scale with
 * `perf.level`, textures are the 640px WebP bakes rather than the 6.7 MB of
 * source art, and colour management is on so the covers are not washed out.
 */

const RADIUS = 5.2;
const FRAME_H = 2.3;

/*
 * One palette (2026-09-28). This briefly had a second, "smaak" blue, for
 * /smaak's own branding; Ali asked for the space theme there instead, so
 * both pages that mount the dome are emerald now and the variant is gone
 * rather than left as dead code. The `tone` prop stays because it is the
 * seam to widen if another palette ever earns its place — the CHROME is all
 * it controls (frame hairlines, hover, the tint on the drag sphere). The
 * artwork is whatever colour Ali made it, everywhere.
 */
export type DomeTone = "emerald";

const TONES: Record<DomeTone, { line: string; hover: string; shell: string }> = {
  emerald: { line: "#1f4438", hover: "#3cdd9e", shell: "#04100c" },
};

/*
 * Placement: rings, not a golden-angle scatter.
 *
 * The first version spread the fourteen pieces evenly over the whole sphere
 * with the golden angle. Measured rather than guessed: that left exactly ONE
 * frame inside the camera's cone at rest, because 14 items over 360 degrees
 * at this radius is 26 degrees of arc each and the view only spans about a
 * hundred. It read as an empty blue room with a poster in it.
 *
 * Two rings of seven, offset by half a step, fills roughly three quarters of
 * the circumference and always keeps four to six pieces in front of the
 * reader — which is what makes it read as a gallery wall curving away rather
 * than as scattered debris.
 */
function placements(n: number, rings: number) {
  const out: { phi: number; theta: number }[] = [];
  const per = Math.ceil(n / rings);
  // Latitudes sit either side of the equator; nothing goes near a pole,
  // where a rectangle mapped to a sphere shears badly.
  const lat = rings === 1 ? [Math.PI / 2] : rings === 2 ? [Math.PI * 0.42, Math.PI * 0.58] : [Math.PI * 0.36, Math.PI * 0.5, Math.PI * 0.64];
  for (let i = 0; i < n; i++) {
    const ring = Math.floor(i / per);
    const idx = i % per;
    const count = Math.min(per, n - ring * per);
    const step = (Math.PI * 2) / count;
    // Half-step offset per ring so frames do not stack in vertical columns.
    const theta = idx * step + (ring % 2 ? step / 2 : 0);
    out.push({ phi: lat[Math.min(ring, lat.length - 1)], theta });
  }
  return out;
}

export default function DomeGalleryScene({
  items,
  paused,
  onActive,
  onReady,
  tone = "emerald",
}: {
  items: GalleryItem[];
  paused: boolean;
  onActive: (i: number | null) => void;
  /** Fired on the first drawn frame — see the note in DomeGallery. */
  onReady?: () => void;
  tone?: DomeTone;
}) {
  const [warm, setWarm] = useState(false);
  const low = perf.level === "low";

  return (
    <Canvas
      onCreated={quietGL}
      frameloop={!warm || paused ? "never" : "always"}
      dpr={low ? 1 : [1, 1.5]}
      gl={{ antialias: !low, alpha: true, powerPreference: "low-power", outputColorSpace: THREE.SRGBColorSpace }}
      camera={{ position: [0, 0, 0.1], fov: 70, near: 0.05, far: 40 }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={1.1} />
      <Dome items={items} onActive={onActive} onReady={onReady} tone={TONES[tone]} />
      <WarmShaders onWarm={() => setWarm(true)} />
    </Canvas>
  );
}

function Dome({ items, onActive, onReady, tone }: { items: GalleryItem[]; onActive: (i: number | null) => void; onReady?: () => void; tone: { line: string; hover: string; shell: string } }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0.12);
  const drag = useRef<{ on: boolean; x: number; y: number }>({ on: false, x: 0, y: 0 });
  const tilt = useRef(0);
  const tiltTarget = useRef(0);

  // Two rings on a phone-ish canvas would crowd; three when there is room.
  const spots = useMemo(() => placements(items.length, items.length > 10 ? 2 : 1), [items.length]);
  const textures = useLoader(
    THREE.TextureLoader,
    items.map((i) => i.texture),
  );

  useMemo(() => {
    for (const t of textures) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
    }
  }, [textures]);

  const announced = useRef(false);
  useFrame((_, delta) => {
    if (!group.current) return;
    // useLoader suspends until every texture is decoded, so the first frame
    // this runs is the first frame with artwork actually on screen.
    if (!announced.current) {
      announced.current = true;
      onReady?.();
    }
    // Momentum: the dome keeps turning after a drag and slows down, rather
    // than stopping dead the instant a finger lifts.
    if (!drag.current.on) spin.current += (0.12 - spin.current) * Math.min(delta * 0.8, 1);
    group.current.rotation.y += spin.current * delta;
    tilt.current += (tiltTarget.current - tilt.current) * Math.min(delta * 3, 1);
    group.current.rotation.x = tilt.current;
  });

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    drag.current = { on: true, x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!drag.current.on) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    spin.current = dx * 0.012;
    tiltTarget.current = THREE.MathUtils.clamp(tiltTarget.current + dy * 0.002, -0.32, 0.32);
  };
  const onUp = () => {
    drag.current.on = false;
  };

  return (
    <group ref={group}>
      {/* The drag surface: an inside-out sphere the pointer can always hit,
          so a drag that starts on empty sky still turns the dome. */}
      <mesh onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
        <sphereGeometry args={[RADIUS + 2.5, 16, 16]} />
        <meshBasicMaterial color={tone.shell} side={THREE.BackSide} transparent opacity={0.35} />
      </mesh>

      {items.map((item, i) => (
        <Frame
          key={item.texture}
          texture={textures[i]}
          phi={spots[i].phi}
          theta={spots[i].theta}
          onOver={() => onActive(i)}
          onOut={() => onActive(null)}
          href={item.href}
          tone={tone}
        />
      ))}
    </group>
  );
}

function Frame({
  texture,
  phi,
  theta,
  onOver,
  onOut,
  href,
  tone,
}: {
  texture: THREE.Texture;
  phi: number;
  theta: number;
  onOver: () => void;
  onOut: () => void;
  href?: string;
  tone: { line: string; hover: string };
}) {
  const ref = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);

  const { position, quaternion, aspect } = useMemo(() => {
    const p = new THREE.Vector3().setFromSphericalCoords(RADIUS, phi, theta);
    /*
     * Face the centre — with the PLANE's convention, not the camera's.
     *
     * The first version used `Matrix4.lookAt(p, centre, up)`, which is the
     * camera convention: it points an object's −Z at the target. A
     * PlaneGeometry's face is +Z, so every frame ended up facing outward and
     * the reader saw the BACK of each one through `DoubleSide` — every
     * cover mirrored, "vivo" rendering as "oviv". Exactly the trap CLAUDE.md
     * records for the ship ("never g.lookAt()").
     *
     * setFromUnitVectors puts +Z on the direction we want, so the artwork
     * faces the middle of the dome and reads the right way round.
     */
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      p.clone().negate().normalize(),
    );
    const img = texture.image as { width?: number; height?: number } | undefined;
    const a = img?.width && img?.height ? img.width / img.height : 1.5;
    return { position: p, quaternion: q, aspect: a };
  }, [phi, theta, texture]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    // Hovered work leans in toward the reader.
    const target = hover ? 1.12 : 1;
    const s = ref.current.scale.x + (target - ref.current.scale.x) * Math.min(delta * 8, 1);
    ref.current.scale.setScalar(s);
  });

  const h = FRAME_H;
  const w = h * aspect;

  return (
    <group ref={ref} position={position} quaternion={quaternion}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          onOver();
          document.body.style.cursor = href ? "pointer" : "grab";
        }}
        onPointerOut={() => {
          setHover(false);
          onOut();
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (href) window.open(href, "_blank", "noopener,noreferrer");
        }}
      >
        <planeGeometry args={[w, h]} />
        {/* FrontSide now that +Z faces the centre: from inside the dome
            every frame shows its face, and nothing shows a mirrored back. */}
        <meshBasicMaterial map={texture} toneMapped={false} side={THREE.FrontSide} transparent />
      </mesh>

      {/* A hairline around each piece — the one bit of chrome, so the work
          reads as hung rather than floating. */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(w * 1.03, h * 1.05)]} />
        <lineBasicMaterial color={hover ? tone.hover : tone.line} transparent opacity={hover ? 0.9 : 0.45} />
      </lineSegments>
    </group>
  );
}
