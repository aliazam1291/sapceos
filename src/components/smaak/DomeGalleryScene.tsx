"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { WarmShaders } from "@/components/space/useWarmShaders";
import { quietGL } from "@/lib/gl";
import { perf } from "@/lib/perf";
import type { GalleryItem } from "@/content/gallery";

/*
 * The dome gallery (2026-09-27). Ali: "we need a gallery kinda thing, like a
 * dome gallery in smaak.ux … my designs from Figma and Behance displayed."
 * The work hangs on the inside of a sphere with the reader at its centre;
 * drag spins it, release and it keeps its momentum.
 *
 * It speaks the site's language now (2026-09-30). Ali: "the smaak section on
 * the entire website looks off, not going with the theme." Measured against
 * the Hangar two legs earlier, it was a different website: a bordered green
 * box of full-colour screenshots — the only saturated imagery anywhere on
 * Space OS — rolled at random angles under a 109-degree lens. Now:
 *
 *  - Every frame is a HOLOGRAM, the same treatment `Hologram.tsx` gives every
 *    project on the site: luminance pushed onto the emerald ramp, scanlines,
 *    edge light, a sweep band, chamfered corners, and no black — dark areas
 *    are simply not there, so the sky shows through. A project is a
 *    hologram, wherever it appears.
 *  - The one piece being looked at (hover, or its row in the index below)
 *    RESOLVES into its true colours. That is the screen's single accent
 *    event, and it means a designer's work can still be judged in the
 *    colours it was made in — just one at a time, on request.
 *  - Frames hang upright. `setFromUnitVectors(+Z, inward)` is the shortest
 *    arc, which rolls any frame that is both off the equator and off to the
 *    side; the basis is built with world-up instead.
 *  - A 52-degree lens (60 on a portrait box) instead of 70, and no box: the
 *    canvas clears transparent and its edges are masked into the page's sky.
 *  - A faint lat/long wireframe of the dome itself, so the structure reads
 *    as an instrument the holograms hang on.
 *
 * Rules kept: `quietGL` and `WarmShaders` before the first frame, the loop
 * stops off screen, dpr scales with `perf.level`, textures are the 640px
 * WebP bakes. All fourteen frames share one program (same shader source),
 * and one time uniform.
 */

const RADIUS = 5.2;
/** Sized so both rings clear the masked top and bottom edges of the stage. */
const FRAME_H = 1.75;
/** Cut-corner size, in plate heights — the CSS plate's clip-path, in 3D. */
const CHAMFER = 0.07;
/** Idle turn, radians per second. The site flies calm. */
const IDLE = 0.07;

/*
 * One palette. This briefly had a second, "smaak" blue; that was withdrawn
 * on 2026-09-28 and the variant deleted. `tone` stays as the seam to widen
 * if another palette ever earns its place. It colours the chrome and the
 * hologram ramp; the artwork's own colours show only when a piece is lit.
 */
export type DomeTone = "emerald";

type Tone = { line: string; lit: string; low: string; high: string; glow: string; band: string; grid: string };

const TONES: Record<DomeTone, Tone> = {
  // low/high are Hologram.module.scss's plate gradient (#1a8f68 → #4de3aa).
  emerald: { line: "#2a6b55", lit: "#8af0c8", low: "#1a8f68", high: "#4de3aa", glow: "#3cdd9e", band: "#bff5df", grid: "#3cdd9e" },
};

/*
 * Placement: two rings, offset by half a step. A golden-angle scatter over
 * the whole sphere left exactly one frame in the camera's cone at rest
 * (measured 2026-09-27); two offset rings keep a brick-laid wall of four to
 * six pieces in front of the reader, with nothing near a pole.
 */
function placements(n: number) {
  const out: { phi: number; theta: number }[] = [];
  const per = Math.ceil(n / 2);
  const lat = [Math.PI * 0.43, Math.PI * 0.57];
  for (let i = 0; i < n; i++) {
    const ring = Math.floor(i / per);
    const idx = i % per;
    const count = Math.min(per, n - ring * per);
    const step = (Math.PI * 2) / count;
    out.push({ phi: lat[ring], theta: idx * step + (ring % 2 ? step / 2 : 0) });
  }
  return out;
}

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uTime;
uniform float uSeed;
uniform float uLit;
uniform float uAspect;
uniform float uChamfer;
uniform vec3 uLow;
uniform vec3 uHigh;
uniform vec3 uGlow;
uniform vec3 uBand;
varying vec2 vUv;

void main() {
  // The plate's cut corners, top-right and bottom-left, at 45 degrees.
  if ((1.0 - vUv.x) * uAspect + (1.0 - vUv.y) < uChamfer) discard;
  if (vUv.x * uAspect + vUv.y < uChamfer) discard;

  vec4 tex = texture2D(uMap, vUv);

  // Luminance in display space, pushed the way the CSS plate pushes it
  // (grayscale, contrast 1.35, brightness 1.05), then back to linear.
  float l = pow(max(dot(tex.rgb, vec3(0.2126, 0.7152, 0.0722)), 0.0), 1.0 / 2.2);
  l = clamp(((l - 0.5) * 1.35 + 0.5) * 1.05, 0.0, 1.0);

  // A floor under the ramp: a dark piece is still a plate of light, tinted
  // glass rather than nothing (most of the studio's work is dark UI).
  vec3 holo = mix(uLow, uHigh, vUv.y) * max(pow(l, 2.2), 0.045);

  // Scanlines: a dark third of every line.
  holo *= mix(0.62, 1.0, smoothstep(0.30, 0.38, fract(vUv.y * 72.0)));

  // Edge light down both sides; a softer glow in from all four edges (the
  // CSS plate's inset shadow); the band that sweeps down through it.
  float edge = smoothstep(0.16, 0.0, vUv.x) + smoothstep(0.84, 1.0, vUv.x);
  vec2 d = min(vUv, 1.0 - vUv) * vec2(uAspect, 1.0);
  float inner = 1.0 - smoothstep(0.0, 0.16, min(d.x, d.y));
  float y = 1.15 - fract(uTime * 0.23 + uSeed) * 1.5;
  float band = smoothstep(0.1, 0.0, abs(vUv.y - y));
  holo += uGlow * (0.22 * edge + 0.1 * inner) + uBand * 0.18 * band;

  // A hologram has no black: the dark of the projection is mostly sky.
  float a = clamp(l * 0.8 + 0.26 + edge * 0.18 + inner * 0.15 + band * 0.12, 0.0, 1.0);

  gl_FragColor = vec4(mix(holo, tex.rgb, uLit), mix(a, 1.0, uLit));
  #include <colorspace_fragment>
}
`;

export default function DomeGalleryScene({
  items,
  paused,
  focus,
  onActive,
  onPick,
  onReady,
  tone = "emerald",
}: {
  items: GalleryItem[];
  paused: boolean;
  /** A piece picked from the index: the dome turns it to the front and lights it. */
  focus: number | null;
  onActive: (i: number | null) => void;
  /** A tap or click on a frame (i), or on empty sky (null). */
  onPick: (i: number | null, touch: boolean) => void;
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
      camera={{ position: [0, 0, 0.1], fov: 52, near: 0.05, far: 40 }}
      style={{ background: "transparent" }}
    >
      <Lens />
      <Dome items={items} focus={focus} onActive={onActive} onPick={onPick} onReady={onReady} tone={TONES[tone]} />
      <WarmShaders onWarm={() => setWarm(true)} />
    </Canvas>
  );
}

/** A portrait box (a phone) gets a wider lens, so a whole frame fits across. */
function Lens() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = size.width / size.height < 1.1 ? 60 : 52;
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

/**
 * A click that ends a drag is not a pick. R3F fires `onClick` on whatever
 * the pointer went DOWN on, however far it then moved — so a drag that
 * started on a frame used to open a new tab on release. `e.delta` is the
 * distance since pointer-down, in pixels.
 */
const TAP = 6;
const isTouch = (e: ThreeEvent<MouseEvent>) => (e.nativeEvent as PointerEvent).pointerType === "touch";

function Dome({
  items,
  focus,
  onActive,
  onPick,
  onReady,
  tone,
}: {
  items: GalleryItem[];
  focus: number | null;
  onActive: (i: number | null) => void;
  onPick: (i: number | null, touch: boolean) => void;
  onReady?: () => void;
  tone: Tone;
}) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef(IDLE);
  const drag = useRef<{ on: boolean; x: number; y: number }>({ on: false, x: 0, y: 0 });
  const tilt = useRef(0);
  const tiltTarget = useRef(0);
  const focusRef = useRef(focus);
  focusRef.current = focus;
  const [hovered, setHovered] = useState<number | null>(null);

  // One clock for every plate: fourteen materials, one uniform object.
  const time = useMemo(() => ({ value: 0 }), []);
  const spots = useMemo(() => placements(items.length), [items.length]);
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

  // The dome's own structure: latitude and longitude only. EdgesGeometry at
  // one degree drops the quads' diagonals, which a wireframe would draw.
  const grid = useMemo(() => new THREE.EdgesGeometry(new THREE.SphereGeometry(RADIUS + 1.6, 24, 12), 1), []);

  const announced = useRef(false);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    // useLoader suspends until every texture is decoded, so the first frame
    // this runs is the first frame with artwork actually on screen.
    if (!announced.current) {
      announced.current = true;
      onReady?.();
    }
    time.value += delta;

    const f = focusRef.current;
    if (f !== null && spots[f]) {
      // Turn the picked piece to the front: a piece at azimuth θ faces the
      // camera (−Z) when the dome is turned to π − θ. Nearest way round.
      const d = Math.PI - spots[f].theta - g.rotation.y;
      g.rotation.y += Math.atan2(Math.sin(d), Math.cos(d)) * Math.min(delta * 3.5, 1);
      spin.current = 0;
      tiltTarget.current = 0;
    } else {
      // Momentum: after a drag the dome keeps turning and eases back to idle.
      if (!drag.current.on) spin.current += (IDLE - spin.current) * Math.min(delta * 0.8, 1);
      g.rotation.y += spin.current * delta;
    }
    tilt.current += (tiltTarget.current - tilt.current) * Math.min(delta * 3, 1);
    g.rotation.x = tilt.current;
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
    tiltTarget.current = THREE.MathUtils.clamp(tiltTarget.current + dy * 0.002, -0.28, 0.28);
  };
  const onUp = () => {
    drag.current.on = false;
  };

  return (
    <group ref={group}>
      {/* The drag surface: an inside-out sphere the pointer can always hit,
          so a drag that starts on empty sky still turns the dome. It draws
          nothing — the page's own sky is the backdrop. */}
      <mesh
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onPointerCancel={onUp}
        onClick={(e) => {
          if (e.delta <= TAP) onPick(null, isTouch(e));
        }}
      >
        <sphereGeometry args={[RADIUS + 2.5, 16, 16]} />
        <meshBasicMaterial side={THREE.BackSide} colorWrite={false} depthWrite={false} />
      </mesh>

      <lineSegments geometry={grid}>
        <lineBasicMaterial color={tone.grid} transparent opacity={0.07} depthWrite={false} />
      </lineSegments>

      {items.map((item, i) => (
        <Frame
          key={item.texture}
          texture={textures[i]}
          phi={spots[i].phi}
          theta={spots[i].theta}
          seed={i * 0.137}
          time={time}
          lit={hovered === i || focus === i}
          onOver={() => {
            setHovered(i);
            onActive(i);
          }}
          onOut={() => {
            setHovered((h) => (h === i ? null : h));
            onActive(null);
          }}
          onPick={(touch) => onPick(i, touch)}
          linked={Boolean(item.href)}
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
  seed,
  time,
  lit,
  onOver,
  onOut,
  onPick,
  linked,
  tone,
}: {
  texture: THREE.Texture;
  phi: number;
  theta: number;
  seed: number;
  time: { value: number };
  lit: boolean;
  onOver: () => void;
  onOut: () => void;
  onPick: (touch: boolean) => void;
  linked: boolean;
  tone: Tone;
}) {
  const ref = useRef<THREE.Group>(null);
  const line = useRef<THREE.LineBasicMaterial>(null);

  const { position, quaternion, aspect } = useMemo(() => {
    const p = new THREE.Vector3().setFromSphericalCoords(RADIUS, phi, theta);
    /*
     * Face the centre, upright. +Z (the plane's face) points inward; X is
     * world-up × Z, so it stays level; Y completes the basis. Two traps on
     * record here: `Matrix4.lookAt` is the CAMERA convention (−Z at the
     * target) and showed every cover mirrored from behind ("vivo" read
     * "oviv", 2026-09-27); `setFromUnitVectors` is the shortest arc and
     * rolled every frame that sat both off the equator and off to the side.
     */
    const z = p.clone().negate().normalize();
    const x = new THREE.Vector3(0, 1, 0).cross(z).normalize();
    const y = new THREE.Vector3().crossVectors(z, x);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    const img = texture.image as { width?: number; height?: number } | undefined;
    const a = img?.width && img?.height ? img.width / img.height : 1.6;
    return { position: p, quaternion: q, aspect: a };
  }, [phi, theta, texture]);

  const h = FRAME_H;
  const w = h * aspect;

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uMap: { value: texture },
          uTime: time,
          uSeed: { value: seed },
          uLit: { value: 0 },
          uAspect: { value: aspect },
          uChamfer: { value: CHAMFER },
          uLow: { value: new THREE.Color(tone.low) },
          uHigh: { value: new THREE.Color(tone.high) },
          uGlow: { value: new THREE.Color(tone.glow) },
          uBand: { value: new THREE.Color(tone.band) },
        },
      }),
    [texture, time, seed, aspect, tone],
  );
  useEffect(() => () => material.dispose(), [material]);

  // The hairline follows the plate's cut corners rather than boxing them.
  const outline = useMemo(() => {
    const W = (w * 1.03) / 2;
    const H = (h * 1.04) / 2;
    const k = CHAMFER * h;
    const pts = [
      [-W + k, -H],
      [W, -H],
      [W, H - k],
      [W - k, H],
      [-W, H],
      [-W, -H + k],
    ].map(([px, py]) => new THREE.Vector3(px, py, 0.002));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [w, h]);

  const litColor = useMemo(() => new THREE.Color(tone.lit), [tone.lit]);
  const restColor = useMemo(() => new THREE.Color(tone.line), [tone.line]);

  useFrame((_, delta) => {
    const u = material.uniforms.uLit;
    // The projection resolves into the real thing, and fades back.
    u.value += ((lit ? 1 : 0) - u.value) * Math.min(delta * (lit ? 5 : 3), 1);
    if (line.current) {
      line.current.color.lerpColors(restColor, litColor, u.value);
      line.current.opacity = 0.45 + u.value * 0.45;
    }
    if (ref.current) {
      const s = ref.current.scale.x + ((lit ? 1.08 : 1) - ref.current.scale.x) * Math.min(delta * 8, 1);
      ref.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={ref} position={position} quaternion={quaternion}>
      <mesh
        material={material}
        onPointerOver={(e) => {
          e.stopPropagation();
          onOver();
          document.body.style.cursor = linked ? "pointer" : "grab";
        }}
        onPointerOut={() => {
          onOut();
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta <= TAP) onPick(isTouch(e));
        }}
      >
        <planeGeometry args={[w, h]} />
      </mesh>

      <lineLoop geometry={outline}>
        <lineBasicMaterial ref={line} color={tone.line} transparent opacity={0.45} depthWrite={false} />
      </lineLoop>
    </group>
  );
}
