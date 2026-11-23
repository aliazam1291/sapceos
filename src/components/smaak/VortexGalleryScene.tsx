"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { WarmShaders } from "@/components/space/useWarmShaders";
import { quietGL } from "@/lib/gl";
import { perf } from "@/lib/perf";
import { decay, signal } from "@/lib/scroll-signal";
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
  progress,
  paused,
  focus,
  onActive,
  onPick,
  onPassing,
  onReady,
  onLost,
  tone = "emerald",
}: {
  items: GalleryItem[];
  /** How far through the page's pin the reader is, 0..1. Absent: free drift. */
  progress?: RefObject<number>;
  paused: boolean;
  focus: number | null;
  onActive: (i: number | null) => void;
  onPick: (i: number | null, touch: boolean) => void;
  /** The piece the flight is about to pass, when it changes. */
  onPassing?: (i: number) => void;
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
      <Vortex items={items} progress={progress} focus={focus} onActive={onActive} onPick={onPick} onPassing={onPassing} onReady={onReady} tone={TONES[tone]} />
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
  progress,
  focus,
  onActive,
  onPick,
  onPassing,
  onReady,
  tone,
}: {
  items: GalleryItem[];
  progress?: RefObject<number>;
  focus: number | null;
  onActive: (i: number | null) => void;
  onPick: (i: number | null, touch: boolean) => void;
  onPassing?: (i: number) => void;
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
  /** Pinned: the drift and drag accumulated on top of where the scroll puts the flight. */
  const base = useRef(0);
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

  // One ring shape for every ring: a DASHED circle just outside the plates —
  // a solid circle turning looks like a circle standing still; dashes show
  // the counter-rotation.
  const ring = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const dashes = 48;
    for (let i = 0; i < dashes; i++) {
      for (const s of [0, 0.62]) {
        const a = ((i + s) / dashes) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * (R + 0.75), Math.sin(a) * (R + 0.75), 0));
      }
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  useEffect(() => () => ring.dispose(), [ring]);

  /*
   * Light streaming past the reader inside the tunnel: one Points draw for
   * all of them, positions written on the CPU each frame (a few hundred
   * floats). Brightness carries the fade, on additive blending.
   */
  const streakCount = perf.level === "low" ? 160 : 360;
  const streaks = useMemo(() => {
    const seeds = Array.from({ length: streakCount }, (_, i) => {
      const h = (k: number) => {
        const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
        return x - Math.floor(x);
      };
      return { a: h(1) * Math.PI * 2, r: 0.35 + h(2) * (R + 0.4), s: h(3) * length, k: 0.6 + h(4) * 0.8 };
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(streakCount * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(streakCount * 3), 3));
    return { seeds, geo };
  }, [streakCount, length]);
  useEffect(() => () => streaks.geo.dispose(), [streaks]);
  // A soft round dot: square points read as pixels when one passes the lens.
  const dot = useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d");
    if (!g) return null;
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.55)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => dot?.dispose(), [dot]);
  const streakColor = useMemo(() => new THREE.Color(tone.lit), [tone.lit]);

  // The light at the end of the tunnel: amber at the heart, emerald falloff.
  const core = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: time, uHeart: { value: new THREE.Color("#ffb35a") }, uEdge: { value: new THREE.Color(tone.glow) } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uHeart; uniform vec3 uEdge; varying vec2 vUv;
          void main(){
            float r = length(vUv - 0.5) * 2.0;
            float glow = pow(max(0.0, 1.0 - r), 2.4) * (0.85 + 0.15 * sin(uTime * 1.3));
            vec3 c = mix(uHeart, uEdge, smoothstep(0.0, 0.55, r));
            // Alpha follows the glow: the canvas is composited over the page's
            // sky, and an opaque alpha painted the plane's corners black.
            // (Additive blending multiplies by alpha, so colour is not
            // pre-multiplied here.)
            gl_FragColor = vec4(c * 0.95, glow * 0.75);
          }`,
      }),
    [time, tone.glow],
  );
  useEffect(() => () => core.dispose(), [core]);

  // Plates bank toward the tunnel's axis as they spiral; the one being
  // looked at straightens and faces the reader.
  const bank = useRef<number[]>(items.map(() => 1));
  const lean = useRef(new THREE.Vector2());
  const finePointer = useMemo(() => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches, []);

  /*
   * Speed is felt, not shown (2026-11-23, "make it better"): the flight's own
   * velocity — scroll, drift, drag, all of it — widens the lens a few degrees,
   * swells the light streaks and brightens them, and eases back at rest. The
   * end of the pinned run opens the light at the end of the tunnel.
   */
  const lastTravel = useRef(0);
  const vel = useRef(0);
  const passing = useRef(-1);
  const streakMat = useRef<THREE.PointsMaterial>(null);
  const coreMesh = useRef<THREE.Mesh>(null);

  const announced = useRef(false);
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    decay(dt);
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
      // Pinned: let go of a piece and the flight carries on from here.
      if (progress) base.current = travel.current - progress.current * length;
    } else if (progress) {
      /*
       * Pinned (2026-11-23, Ali: "on scroll the vortex moves, once it's over
       * then normal scrolling"). The page's scroll through the pin IS the
       * flight: one full pass down the tunnel from the pin's top to its end.
       * A slow drift and any drag ride on top, so it is never frozen when
       * the reader stops; the damping is what makes a wheel feel like flying.
       */
      if (!drag.current.on) {
        speed.current += (DRIFT * 0.15 - speed.current) * Math.min(dt * 0.9, 1);
        spin.current += (TURN - spin.current) * Math.min(dt * 0.9, 1);
      }
      // Until the pin takes hold the flight is the scroll alone, so the run
      // always begins with piece 01 coming up; the drift only rides inside it.
      if (progress.current > 0 || drag.current.on) base.current += speed.current * dt;
      else base.current += (0 - base.current) * Math.min(dt * 2, 1);
      // Offset a step back so the first piece up is 01, not 03, and stop
      // short of a full loop so the run ends on the last piece, not 02.
      const want = base.current + progress.current * (length - STEP * 1.6) - STEP * 1.2;
      travel.current += (want - travel.current) * Math.min(dt * 4, 1);
      turn.current += spin.current * dt + (want - travel.current) * 0.02;
    } else {
      if (!drag.current.on) {
        speed.current += (DRIFT - speed.current) * Math.min(dt * 0.9, 1);
        spin.current += (TURN - spin.current) * Math.min(dt * 0.9, 1);
      }
      // Scrolling the page pushes the flight: down flies in, up flies back.
      const boost = signal.velocity * Math.sign(signal.delta) * 5;
      travel.current += (speed.current + boost) * dt;
      turn.current += spin.current * dt;
    }

    // Units per second, smoothed; signed (back is negative).
    const v = dt > 0 ? (travel.current - lastTravel.current) / dt : 0;
    lastTravel.current = travel.current;
    vel.current += (THREE.MathUtils.clamp(v, -14, 14) - vel.current) * Math.min(dt * 6, 1);
    const rush = THREE.MathUtils.smoothstep(Math.abs(vel.current), 0.8, 9);

    const cam = state.camera as THREE.PerspectiveCamera;
    const baseFov = state.size.width / state.size.height < 1.1 ? 76 : 62;
    const fov = baseFov + rush * 9;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    if (streakMat.current) streakMat.current.size = 0.07 + rush * 0.09;
    if (coreMesh.current) {
      const end = progress ? THREE.MathUtils.smoothstep(progress.current, 0.72, 1) : 0;
      coreMesh.current.scale.setScalar(1 + end * 0.9 + rush * 0.15);
    }

    // The next piece the reader will pass: the nearest one still well ahead.
    let next = -1;
    let nextD = Infinity;
    for (let i = 0; i < n; i++) {
      const d = wrap(i * STEP - travel.current, length);
      if (d > 2.2 && d < nextD) {
        nextD = d;
        next = i;
      }
    }
    if (next !== passing.current && next >= 0) {
      passing.current = next;
      onPassing?.(next);
    }

    for (let i = 0; i < n; i++) {
      const g = plates.current[i];
      if (!g) continue;
      const d = wrap(i * STEP - travel.current, length);
      const a = (i / PER_TURN) * Math.PI * 2 + turn.current;
      const x = Math.cos(a) * R;
      const y = Math.sin(a) * R;
      g.position.set(x, y, -(d + NEAR));
      const lit = hovered === i || focus === i;
      bank.current[i] += ((lit ? 0 : 1) - bank.current[i]) * Math.min(dt * 4, 1);
      const b = bank.current[i];
      // Face tilted in toward the axis, and a swirl roll with the spiral.
      g.rotation.set((y / R) * 0.34 * b, -(x / R) * 0.34 * b, 0.2 * b);
      fades[i].value = fadeFor(d, length);
      g.visible = fades[i].value > 0.003;
    }
    for (let k = 0; k < rings; k++) {
      const g = ringRefs.current[k];
      const m = ringMats.current[k];
      if (!g || !m) continue;
      const d = wrap(k * STEP + STEP / 2 - travel.current, length);
      g.position.z = -(d + NEAR);
      // Alternate rings turn against each other; every third burns brighter.
      g.rotation.z = k % 2 ? turn.current * 0.6 : -turn.current * 0.4;
      m.opacity = (k % 3 === 0 ? 0.3 : 0.14) * fadeFor(d, length);
    }

    const pos = streaks.geo.attributes.position as THREE.BufferAttribute;
    const col = streaks.geo.attributes.color as THREE.BufferAttribute;
    for (let j = 0; j < streaks.seeds.length; j++) {
      const s = streaks.seeds[j];
      const d = wrap(s.s - travel.current * 1.6 * s.k, length);
      const a = s.a + turn.current * 0.35;
      pos.setXYZ(j, Math.cos(a) * s.r, Math.sin(a) * s.r, -(d + NEAR));
      const f = fadeFor(d, length) * (0.9 + rush * 0.6);
      col.setXYZ(j, streakColor.r * f, streakColor.g * f, streakColor.b * f);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;

    // The lens leans a little toward the pointer (mouse only).
    if (finePointer) {
      lean.current.x += (state.pointer.x * 0.45 - lean.current.x) * Math.min(dt * 2, 1);
      lean.current.y += (state.pointer.y * 0.3 - lean.current.y) * Math.min(dt * 2, 1);
      state.camera.position.set(lean.current.x, lean.current.y, 0);
      state.camera.lookAt(0, 0, -12);
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

      {/* The light at the end of the tunnel. */}
      <mesh ref={coreMesh} position={[0, 0, -(length + NEAR - 1)]} material={core} raycast={() => null}>
        <planeGeometry args={[9, 9]} />
      </mesh>

      <points geometry={streaks.geo} raycast={() => null}>
        <pointsMaterial ref={streakMat} size={0.07} sizeAttenuation vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} map={dot ?? undefined} alphaTest={0.01} />
      </points>

      {Array.from({ length: rings }, (_, k) => (
        <group key={`r${k}`} ref={(el) => void (ringRefs.current[k] = el)}>
          <lineSegments geometry={ring} raycast={() => null}>
            <lineBasicMaterial ref={(el) => void (ringMats.current[k] = el)} color={tone.grid} transparent opacity={0} depthWrite={false} />
          </lineSegments>
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
