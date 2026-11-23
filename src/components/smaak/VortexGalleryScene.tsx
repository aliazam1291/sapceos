"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { WarmShaders } from "@/components/space/useWarmShaders";
import { quietGL } from "@/lib/gl";
import { perf } from "@/lib/perf";
import type { GalleryItem } from "@/content/gallery";
import { Frame, TAP, TONES, isTouch, type DomeTone, type Tone } from "./DomeGalleryScene";

/*
 * The vortex (2026-11-23). Ali: "like a vortex — we're going through a circle
 * and things rotating, and once the user clicks he can see the design."
 *
 * The same hologram plates as the dome (Frame: the emerald ramp, scanlines,
 * true colour on the one piece being looked at), laid on a spiral down a
 * tunnel instead of on a sphere. Wireframe rings mark the tunnel; the reader
 * drifts forward through them and the whole spiral turns about its axis. The
 * tunnel loops: a plate that passes the lens fades out and comes back at the
 * far end, so the flight never stops. Drag sideways to spin it, up and down
 * to fly forward or back; let go and it keeps its momentum, then eases back
 * to the calm drift. A click opens the piece (the parent shows it full size).
 *
 * Plates stay upright and face the reader — a design has to be readable — so
 * the rotation is in where they sit, not in how they are turned.
 *
 * Same contract as every scene here: quietGL + WarmShaders before the first
 * frame, the loop stops off screen, dpr by perf level, and a lost context
 * remounts a fresh canvas (DomeGalleryScene's note, 2026-11-18).
 */

/** Tunnel radius, and the distance between one plate and the next. */
const R = 2.55;
const STEP = 2.1;
/** Plates per full turn of the spiral. */
const PER_TURN = 5;
/** The nearest a plate comes before it fades out past the lens. */
const NEAR = 0.9;
const FRAME_H = 1.3;
/** The calm drift: units per second forward, radians per second of turn. */
const DRIFT = 0.55;
const TURN = 0.09;
/** A focused piece is brought to this distance, at the top of the tunnel. */
const FOCUS_AT = 5.4;

const wrap = (v: number, m: number) => ((v % m) + m) % m;
/** Nearest equivalent of `to` around a loop of size `m`, measured from `from`. */
const nearest = (from: number, to: number, m: number) => from + (wrap(to - from + m / 2, m) - m / 2);

export default function VortexGalleryScene({
  items,
  paused,
  focus,
  onActive,
  onPick,
  onReady,
  onLost,
  tone = "emerald",
}: {
  items: GalleryItem[];
  paused: boolean;
  focus: number | null;
  onActive: (i: number | null) => void;
  onPick: (i: number | null, touch: boolean) => void;
  onReady?: () => void;
  onLost?: () => void;
  tone?: DomeTone;
}) {
  const [warm, setWarm] = useState(false);
  const [gen, setGen] = useState(0);
  const low = perf.level === "low";
  if (gen > 2) return null;

  return (
    <Canvas
      key={gen}
      onCreated={(state) => {
        quietGL(state);
        state.gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            onLost?.();
            setWarm(false);
            setGen((g) => g + 1);
          },
          { once: true },
        );
      }}
      frameloop={!warm || paused ? "never" : "always"}
      dpr={low ? 1 : [1, 1.5]}
      gl={{ antialias: !low, alpha: true, powerPreference: "low-power", outputColorSpace: THREE.SRGBColorSpace }}
      camera={{ position: [0, 0, 0], fov: 62, near: 0.05, far: 60 }}
      style={{ background: "transparent" }}
    >
      <Lens />
      <Vortex items={items} focus={focus} onActive={onActive} onPick={onPick} onReady={onReady} tone={TONES[tone]} />
      <WarmShaders onWarm={() => setWarm(true)} />
    </Canvas>
  );
}

/** A portrait box (a phone) gets a wider lens so the tunnel still reads as a ring. */
function Lens() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = size.width / size.height < 1.1 ? 76 : 62;
    cam.lookAt(0, 0, -1);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

/** 0 → 1 → 0 as a plate comes out of the far end, travels, and passes the lens. */
function fadeFor(d: number, length: number) {
  const near = THREE.MathUtils.smoothstep(d, 0, NEAR * 1.6);
  const far = 1 - THREE.MathUtils.smoothstep(d, length - STEP * 2.2, length);
  return near * far;
}

function Vortex({
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
  const n = items.length;
  // At least ten steps of tunnel, so a short list still reads as a vortex.
  const length = Math.max(n, 10) * STEP;
  const rings = Math.round(length / STEP);

  const plates = useRef<(THREE.Group | null)[]>([]);
  const ringRefs = useRef<(THREE.Group | null)[]>([]);
  const ringMats = useRef<(THREE.LineBasicMaterial | null)[]>([]);
  const fades = useMemo(() => items.map(() => ({ value: 0 })), [items]);

  const travel = useRef(0);
  const turn = useRef(0);
  const speed = useRef(DRIFT);
  const spin = useRef(TURN);
  const drag = useRef<{ on: boolean; x: number; y: number }>({ on: false, x: 0, y: 0 });
  const focusRef = useRef(focus);
  focusRef.current = focus;
  const [hovered, setHovered] = useState<number | null>(null);

  const time = useMemo(() => ({ value: 0 }), []);
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

  // One ring shape for every ring; a hairline circle just outside the plates.
  const ring = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * (R + 0.75), Math.sin(a) * (R + 0.75), 0));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  useEffect(() => () => ring.dispose(), [ring]);

  const announced = useRef(false);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!announced.current) {
      announced.current = true;
      onReady?.();
    }
    time.value += dt;

    const f = focusRef.current;
    if (f !== null && f < n) {
      // Bring the picked piece to FOCUS_AT ahead, at the top of the tunnel.
      const wantTravel = nearest(travel.current, f * STEP - FOCUS_AT, length);
      const angle = (f / PER_TURN) * Math.PI * 2;
      const wantTurn = nearest(turn.current, Math.PI / 2 - angle, Math.PI * 2);
      travel.current += (wantTravel - travel.current) * Math.min(dt * 3, 1);
      turn.current += (wantTurn - turn.current) * Math.min(dt * 3, 1);
      speed.current = 0;
      spin.current = 0;
    } else {
      if (!drag.current.on) {
        speed.current += (DRIFT - speed.current) * Math.min(dt * 0.9, 1);
        spin.current += (TURN - spin.current) * Math.min(dt * 0.9, 1);
      }
      travel.current += speed.current * dt;
      turn.current += spin.current * dt;
    }

    for (let i = 0; i < n; i++) {
      const g = plates.current[i];
      if (!g) continue;
      const d = wrap(i * STEP - travel.current, length);
      const a = (i / PER_TURN) * Math.PI * 2 + turn.current;
      g.position.set(Math.cos(a) * R, Math.sin(a) * R, -(d + NEAR));
      fades[i].value = fadeFor(d, length);
      g.visible = fades[i].value > 0.003;
    }
    for (let k = 0; k < rings; k++) {
      const g = ringRefs.current[k];
      const m = ringMats.current[k];
      if (!g || !m) continue;
      const d = wrap(k * STEP + STEP / 2 - travel.current, length);
      g.position.z = -(d + NEAR);
      g.rotation.z = turn.current * 0.5;
      m.opacity = 0.16 * fadeFor(d, length);
    }
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
    spin.current = THREE.MathUtils.clamp(dx * 0.02, -2.5, 2.5);
    // Drag up flies forward, down flies back.
    speed.current = THREE.MathUtils.clamp(-dy * 0.35, -9, 9);
  };
  const onUp = () => {
    drag.current.on = false;
  };

  return (
    <group>
      {/* The drag surface: a wide, invisible plane behind the whole tunnel,
          so a drag that starts on empty sky still flies it — and, being the
          farthest thing in the scene, it never steals a plate's hover. */}
      <mesh
        position={[0, 0, -(length + NEAR + 6)]}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onPointerCancel={onUp}
        onClick={(e) => {
          if (e.delta <= TAP) onPick(null, isTouch(e));
        }}
      >
        <planeGeometry args={[160, 160]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>

      {Array.from({ length: rings }, (_, k) => (
        <group key={`r${k}`} ref={(el) => void (ringRefs.current[k] = el)}>
          <lineLoop geometry={ring}>
            <lineBasicMaterial ref={(el) => void (ringMats.current[k] = el)} color={tone.grid} transparent opacity={0} depthWrite={false} />
          </lineLoop>
        </group>
      ))}

      {items.map((item, i) => (
        <group key={item.texture} ref={(el) => void (plates.current[i] = el)}>
          <Frame
            texture={textures[i]}
            seed={i * 0.137}
            time={time}
            height={FRAME_H}
            fade={fades[i]}
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
            linked
            tone={tone}
          />
        </group>
      ))}
    </group>
  );
}
