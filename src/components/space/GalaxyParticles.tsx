"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uDpr;

  varying vec3 vColor;
  varying float vTwinkle;

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
    gl_PointSize = aSize * uDpr * (16.0 / dist);
  }
`;

const fragmentShader = /* glsl */ `
  precision mediump float;

  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float d = length(coord);
    if (d > 0.5) discard;

    // Tight core with a long faint halo — a wide gaussian makes every star
    // read as a soft blob, which is what made the field look like painted dots.
    float core = exp(-d * d * 34.0);
    float halo = exp(-d * d * 7.0) * 0.30;
    float alpha = (core + halo) * vTwinkle;

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
const ARM_SHARE = 0.85;

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

export default function GalaxyParticles({ count = 6000, dpr = 1.5 }: GalaxyParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, colors, sizes, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const ph = new Float32Array(count);

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
          const spread = 0.10 + 0.30 / (1 + r);
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

      // ── Colour by radius. Warm core → mint → accent teal → dim outer blue.
      let cr: number;
      let cg: number;
      let cb: number;

      if (r < 0.55) {
        cr = 1.0; cg = 0.94; cb = 0.83;          // warm white bulge
      } else if (r < 1.6) {
        cr = 0.78; cg = 0.99; cb = 0.93;          // hot mint
      } else if (r < 3.6) {
        cr = 0.13; cg = 0.82; cb = 0.70;          // brand teal
      } else {
        cr = 0.30; cg = 0.44; cb = 0.66;          // cool, dim outskirts
      }

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
        cr = 0.99; cg = 0.72; cb = 0.42;
      }

      // Brightness falls with radius so the core dominates — but gently, or
      // the outer arms go too dim to read as structure.
      // Peak stays well under 1: with additive blending the bright core should
      // come from stars overlapping, not from each one being near-white.
      const falloff = Math.max(0.38, 0.86 - r * 0.062);
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
      sz[i] = (0.52 + Math.pow(Math.random(), 4) * 2.2) * (1 - dustHere * 0.7);
      ph[i] = Math.random() * Math.PI * 2;
    }

    return { positions: pos, colors: col, sizes: sz, phases: ph };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDpr: { value: dpr },
    }),
    [dpr]
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += Math.min(delta, 0.05);
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
