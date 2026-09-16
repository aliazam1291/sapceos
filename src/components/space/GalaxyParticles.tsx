"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { cameraFocus } from "./cameraFocus";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uDpr;
  uniform float uFocus;    // focus distance, world units
  uniform float uFocusOn;  // 0 free map, 1 flight

  varying vec3 vColor;
  varying float vTwinkle;
  varying float vDepth;
  varying float vCloud;
  varying float vCoc;
  varying float vNear;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    /*
     * Scintillation, not a pulse. A single sine makes every star breathe on the
     * same clean rhythm, which the eye reads as a blinking string of lights.
     * Two incommensurate frequencies never repeat in step, so the field
     * shimmers irregularly the way atmospheric seeing actually looks.
     */
    vTwinkle = 0.78 + 0.13 * sin(uTime * 1.1 + aPhase)
                    + 0.09 * sin(uTime * 2.73 + aPhase * 1.7);
    vColor = aColor;

    float dist = max(-mvPosition.z, 0.001);
    // Capped: when the camera flies in close, an uncapped size turns the
    // near dust into fist-sized blobs across the frame. Stars stay small
    // points; clouds get a little more room but never fill the view.
    // Stars are points, not discs: a hard cap keeps the near ones as pinpricks
    // and lets DENSITY, not size, make the core bright.
    float cap = aSize < 4.0 ? 4.5 : 42.0;
    // Circle of confusion. Off the focal plane a point of light does not
    // get dimmer, it gets bigger and fainter — the bokeh of a real lens.
    // The dust is most of the frame, so this is most of the depth cue.
    // Real depth of field lives in the composer now; this only nudges.
    vCoc = uFocusOn * clamp(abs(dist - uFocus) / 12.0, 0.0, 1.0);
    float spread = 1.0 + vCoc * 0.5;
    gl_PointSize = min(aSize * uDpr * (11.0 / dist) * spread, cap * uDpr * (1.0 + vCoc * 0.5));

    // Depth cue: far points fade as well as shrink. 0 near, 1 far, across
    // the range the camera actually uses, so the far side of the disc reads
    // as further away instead of just smaller.
    vDepth = clamp((dist - 4.0) / 10.0, 0.0, 1.0);
    // Dust inside ~2.5 units of the glass is not resolved by a real lens; it
    // would be a bright smear. Fade it out rather than let it fill the frame.
    vNear = smoothstep(0.9, 2.6, dist);

    // Clouds are flagged by size: anything past the star range is a cloud
    // sprite and gets the wide, soft profile in the fragment shader.
    vCloud = step(4.0, aSize);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vTwinkle;
  varying float vDepth;
  varying float vCloud;
  varying float vCoc;
  varying float vNear;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float d = length(coord);
    if (d > 0.5) discard;

    float alpha;
    if (vCloud > 0.5) {
      // Cloud: one wide, very soft gaussian. Faint on its own; the picture
      // is a few hundred of these overlapping under the fine dust.
      alpha = exp(-d * d * 9.0) * 0.045;
    } else {
      // Tight core with a long faint halo — a wide gaussian makes every star
      // read as a soft blob, which is what made the field look like painted
      // dots. The halo is wide enough that fine points fuse into haze.
      // Defocus widens the core into a disc and spends the same light
      // over the larger area.
      float core = exp(-d * d * mix(30.0, 7.0, vCoc));
      float halo = exp(-d * d * 5.5) * 0.3;
      alpha = (core + halo) * vTwinkle * mix(1.0, 0.5, vDepth) / (1.0 + vCoc * 2.2) * 1.25;
    }

    // Soft-knee tone curve. Additive blending stacks the bulge straight to
    // clipped white; compressing each point's contribution keeps the core
    // saturating toward warm cream with texture instead of a flat disc.
    alpha = 1.0 - exp(-alpha * 1.35);
    alpha *= vNear;

    gl_FragColor = vec4(vColor, alpha);
  }
`;

interface GalaxyParticlesProps {
  count?: number;
  dpr?: number;
}

/** Box–Muller, for the gaussian scatter real star distributions actually have. */
function gaussian(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const ARMS = 3;
const R_MAX = 6.4;
// Exponential disc scale length. Surface density ~ exp(-r/L), which is the
// actual profile of a spiral galaxy: dense core, smooth fade to nothing.
// Too small and the whole disc collapses into a featureless ball.
const SCALE_LEN = 1.95;
// Kept low: additive blending means a dense bulge saturates straight to a
// flat white blob, which is exactly what the old build did.
const CORE_FRACTION = 0.09;
// Radians of winding per unit radius. Across the disc this works out to
// ~1.4 turns, which is what makes the arms legible as arms.
const WIND = 1.55;
// Share of disc stars that track an arm. The remainder fill inter-arm space.
const ARM_SHARE = 0.9;

/*
 * Dust lanes.
 *
 * This is the single feature that separates a photograph of a spiral galaxy
 * from a spray of dots, and it was entirely absent: every real spiral is
 * defined by dark absorption lanes running along the inner edge of each arm.
 *
 * They cannot be drawn. The field is additively blended, so there is no way to
 * paint something darker than the background — adding a dark layer contributes
 * nothing. A lane has to be an ABSENCE: stars whose line of sight passes
 * through dust are dimmed and thinned, so the lane emerges as the gap between
 * the arm ridge and the inter-arm space.
 *
 * Offset is negative, which places the lane on the inner (trailing) edge of
 * each arm — the side dust actually piles up on, because the density wave
 * compresses gas before it forms stars.
 */
const DUST_OFFSET = -0.16;
const DUST_WIDTH = 0.1;
const DUST_DEPTH = 0.82;
/** Dust is concentrated inward; beyond this the disc is optically thin. */
const DUST_FADE_R = 4.4;
/** Share of `count` added as large soft cloud sprites under the dust. */
const CLOUD_FRACTION = 0.025;

/**
 * Colour by radius, continuous. Real galaxies shift temperature smoothly —
 * an old yellow bulge, blue-white young stars along the arms, faint cool
 * outskirts — and a banded if/else reads as painted rings. Emerald-tinted to
 * stay in the palette, but the *shape* of the curve is the astronomical one.
 */
function radiusColour(r: number): [number, number, number] {
  // Warm to cool, the way a real disc runs: an old amber bulge, a gold-white
  // ring, then the young blue-green arms, then cold blue outskirts. Two
  // temperatures on one field is what stops it reading as monochrome.
  const stops: [number, number, number, number][] = [
    [0.0, 1.0, 0.92, 0.74], // amber-white core
    [0.6, 1.0, 0.8, 0.46], // gold ring
    [1.4, 0.86, 0.98, 0.9], // pale mint-white
    [2.6, 0.36, 0.95, 0.7], // emerald arms
    [4.2, 0.4, 0.66, 0.92], // blue
    [6.4, 0.3, 0.4, 0.72], // cold blue outskirts
  ];
  let i = 0;
  while (i < stops.length - 2 && r > stops[i + 1][0]) i++;
  const [r0, a, b, c] = stops[i];
  const [r1, d, e, f] = stops[i + 1];
  const t = Math.min(1, Math.max(0, (r - r0) / (r1 - r0)));
  return [a + (d - a) * t, b + (e - b) * t, c + (f - c) * t];
}

export default function GalaxyParticles({ count = 6000, dpr = 1.5 }: GalaxyParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, colors, sizes, phases } = useMemo(() => {
    // Clouds ride in the same buffers after the stars — one draw call.
    const clouds = Math.round(count * CLOUD_FRACTION);
    const total = count + clouds;
    const pos = new Float32Array(total * 3);
    const col = new Float32Array(total * 3);
    const sz = new Float32Array(total);
    const ph = new Float32Array(total);

    const coreCount = Math.floor(count * CORE_FRACTION);

    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      let z: number;
      let r: number;
      // Distance off the arm ridge; stays 0 for bulge stars, which sit in
      // front of the dust rather than behind it.
      let armPhase = 0;

      if (i < coreCount) {
        // ── Central bulge: a flattened gaussian ball, not part of the arms.
        r = Math.abs(gaussian()) * 0.58;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        x = r * Math.sin(phi) * Math.cos(theta);
        z = r * Math.sin(phi) * Math.sin(theta);
        y = r * Math.cos(phi) * 0.45; // squashed toward the disc plane
      } else {
        // ── Disc: exponential radial profile.
        // The old code used pow(random, 1.6) * maxRadius, which biases stars
        // OUTWARD and terminates at a hard edge — that produced the stray
        // ellipse ringing the galaxy. This fades out smoothly instead.
        r = R_MAX + 1;
        let guard = 0;
        while (r > R_MAX && guard++ < 8) r = -SCALE_LEN * Math.log(1 - Math.random());
        if (r > R_MAX) r = Math.random() * R_MAX; // rare fallback, stays uniform

        // Most stars track an arm; the rest fill inter-arm space so the spiral
        // reads as a galaxy rather than three clean painted stripes.
        let angle: number;
        if (Math.random() < ARM_SHARE) {
          const armBase = ((i % ARMS) * Math.PI * 2) / ARMS;
          // Scatter widens toward the core, where orbits are crowded — but
          // stays tight enough that the arms survive it.
          const spread = 0.07 + 0.22 / (1 + r);
          angle = armBase + r * WIND + gaussian() * spread;
        } else {
          angle = Math.random() * Math.PI * 2;
        }

        r += gaussian() * 0.10; // slight radial fuzz so arms aren't wire-thin
        x = Math.cos(angle) * r;
        z = Math.sin(angle) * r;

        /*
         * Angular offset from the nearest arm ridge, in [-pi/ARMS, +pi/ARMS].
         * Unwinding the spiral by `r * WIND` turns the arms back into straight
         * spokes, which makes "how far off the ridge is this star" a single
         * modulo instead of a search over three arms.
         */
        const spokes = (Math.PI * 2) / ARMS;
        let phase = ((angle - r * WIND) % spokes + spokes) % spokes;
        if (phase > spokes / 2) phase -= spokes;
        armPhase = phase;
        // Thin disc that flares slightly inward.
        y = gaussian() * 0.085 * Math.exp(-r * 0.16);
      }

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // ── Colour by radius, continuous (see radiusColour).
      let [cr, cg, cb] = radiusColour(r);

      /*
       * Star-forming knots.
       *
       * These used to be sprinkled at a flat 3.5% anywhere in the disc, which
       * reads as noise. Real HII regions sit ON the arm ridge, just outside the
       * dust lane that fed them — so the probability now peaks on the ridge and
       * falls away between arms. Same number of warm stars, arranged as
       * structure instead of confetti.
       */
      const onRidge = Math.exp(-(armPhase * armPhase) / (2 * 0.09 * 0.09));
      if (r > 1.0 && r < 5.2 && Math.random() < 0.02 + 0.12 * onRidge) {
        cr = 0.99; cg = 0.82; cb = 0.55;          // warm star-forming knots
      }

      // Brightness falls with radius so the core dominates — but gently, or
      // the outer arms go too dim to read as structure.
      // Peak stays well under 1: with additive blending the bright core should
      // come from stars overlapping, not from each one being near-white.
      const falloff = Math.max(0.42, 0.95 - r * 0.062);
      const jitter = 0.6 + Math.random() * 0.4;

      // Extinction: a gaussian trough in angle, sitting just inside the ridge,
      // fading out where the disc thins.
      const d = armPhase - DUST_OFFSET;
      const lane = Math.exp(-(d * d) / (2 * DUST_WIDTH * DUST_WIDTH));
      const dustHere = lane * Math.max(0, 1 - r / DUST_FADE_R) * DUST_DEPTH;

      const b = falloff * jitter * (1 - dustHere);

      col[i * 3] = cr * b;
      col[i * 3 + 1] = cg * b;
      col[i * 3 + 2] = cb * b;

      // Dimming alone leaves the lane fully populated with faint stars, which
      // still reads as haze rather than as absorption. Shrinking them too
      // removes the accumulated glow that additive blending would otherwise
      // rebuild inside the gap.
      // Most points are dust — sub-pixel at the pulled-back camera, which
      // is what makes the arms read as gas. A steep tail keeps a few real
      // stars for the eye to land on.
      sz[i] = (0.5 + Math.pow(Math.random(), 6) * 2.6) * (1 - dustHere * 0.7);
      ph[i] = Math.random() * Math.PI * 2;
    }

    /*
     * Clouds. A sparse population of large, very soft, very faint sprites
     * laid along the arms, under the dust. Real nebulae are big soft shapes
     * with small hard stars in them; the stars were there, the shapes were
     * not. Sizes start at 4.0, which is the flag the shader uses to pick the
     * cloud profile.
     */
    for (let k = 0; k < clouds; k++) {
      const i = count + k;
      let r = -SCALE_LEN * 1.1 * Math.log(1 - Math.random());
      r = Math.min(Math.max(r, 0.6), R_MAX - 0.4);
      const armBase = ((k % ARMS) * Math.PI * 2) / ARMS;
      const angle = armBase + r * WIND + gaussian() * 0.12;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = gaussian() * 0.05;
      pos[i * 3 + 2] = Math.sin(angle) * r;
      const [cr, cg, cb] = radiusColour(r);
      const b = 0.7 + Math.random() * 0.3;
      col[i * 3] = cr * b;
      col[i * 3 + 1] = cg * b;
      col[i * 3 + 2] = cb * b;
      sz[i] = 4.0 + Math.random() * 5.0;
      ph[i] = Math.random() * Math.PI * 2;
    }

    return { positions: pos, colors: col, sizes: sz, phases: ph };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDpr: { value: dpr },
      uFocus: { value: 6 },
      uFocusOn: { value: 0 },
    }),
    [dpr]
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += Math.min(delta, 0.05);
      matRef.current.uniforms.uFocus.value = cameraFocus.dist;
      matRef.current.uniforms.uFocusOn.value = cameraFocus.on;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.012;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
