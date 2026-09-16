/**
 * Procedural planet surface.
 *
 * No textures: the surface is fBm noise evaluated in the fragment shader on
 * the sphere's object-space position, so every body is unique from a seed
 * and costs nothing to load. Three "kinds" share one shader and differ by
 * uniforms: banded gas giants (hubs), rocky worlds with continents and
 * polar caps, and ice/ocean worlds. Lit from the galactic core (the scene's
 * light), with a soft terminator and a Fresnel atmosphere at the limb.
 */

/**
 * Shared colour pipeline for every body shader. Work in linear light, then
 * ACES filmic tone-map and encode to sRGB — the same pipeline a renderer
 * applies to PBR materials, which ShaderMaterial skips. Without it the
 * colours clip and saturate into candy; with it highlights roll off and
 * midtones sit where a photograph puts them. Plus atmospheric depth: far
 * bodies sink toward the sky colour, which is how the eye reads distance
 * when nothing else in space gives it away.
 */
const colourPipeline = /* glsl */ `
  vec3 aces(vec3 x) {
    const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }
  vec3 toSRGB(vec3 c) { return pow(c, vec3(1.0 / 2.2)); }
  vec3 finish(vec3 linear, float dist) {
    vec3 sky = vec3(0.024, 0.026, 0.028);
    float fog = 1.0 - exp(-max(dist - 6.0, 0.0) * 0.075);
    vec3 c = mix(linear, sky, fog);
    return toSRGB(aces(c));
  }
`;

export const planetVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vObj;
  varying vec3 vCoreDir;
  varying float vDist;
  varying vec3 vViewPos;
  varying vec3 vCentre;
  varying float vRadius;
  varying float vSun;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    vDist = -mv.z;
    vObj = position;
    vViewPos = mv.xyz;
    vCentre = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vRadius = length((modelViewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
    // Sun direction is per-body, from the body's centre — never per-vertex.
    // Per-vertex, a body sitting at the core has half its vertices pointing
    // back at their own centre, and the day side ends in a jagged black cap.
    vec3 coreView = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 centreView = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 toCore = coreView - centreView;
    vCoreDir = length(toCore) < 1.5 ? vec3(-0.3, 0.55, 0.78) : normalize(toCore);
    // One sun means inverse-square light: worlds near the core are lit hard,
    // the outer ones sit in a dimmer, cooler light. Clamped so nothing on
    // the map ever goes unreadable.
    float dc = length(toCore);
    vSun = clamp(2.4 / (1.0 + dc * dc * 0.055), 0.55, 1.35);
    gl_Position = projectionMatrix * mv;
  }
`;

export const planetFrag = /* glsl */ `
  precision highp float;
  uniform vec3  uSea;      // low terrain / dark bands
  uniform vec3  uLand;     // high terrain / light bands
  uniform vec3  uAccent;   // highlights: ice, storm, city glow
  uniform vec3  uAtmo;     // atmosphere rim
  uniform float uSeed;
  uniform float uKind;     // 0 gas, 1 rock, 2 ice
  uniform float uTime;
  uniform float uOpacity;
  uniform float uRing;     // 1 when this body carries a ring
  uniform vec3  uRingN;    // ring plane normal, view space
  uniform float uRingIn;   // ring radii as multiples of the planet radius
  uniform float uRingOut;
  uniform float uDefocus;  // 0 sharp, 1 fully off the focal plane
  // Built-in: three.js uploads it to any stage that declares it. Must match
  // the vertex stage's precision (highp) or the program fails to link.
  uniform highp mat3 normalMatrix;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vObj;
  varying vec3 vCoreDir;
  varying float vDist;
  varying vec3 vViewPos;
  varying vec3 vCentre;
  varying float vRadius;
  varying float vSun;
  ${colourPipeline}

  // Value noise + fBm. Cheap enough for a handful of bodies.
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3) + uSeed);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.07 + vec3(1.7, 9.2, 3.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vView);
    vec3 K = normalize(vCoreDir);
    vec3 p = normalize(vObj);

    vec3 col;
    float rough = 0.0;
    float ocean = 0.0;
    float cloud = 0.0;
    if (uKind < 0.5) {
      // Gas giant: latitude bands warped by turbulence, a slow drift.
      float lat = p.y;
      float warp = fbm(p * 3.0 + vec3(uTime * 0.02, 0.0, 0.0)) * 0.35;
      float band = sin((lat + warp) * 14.0 + uSeed * 6.0) * 0.5 + 0.5;
      float band2 = sin((lat - warp * 0.6) * 31.0) * 0.5 + 0.5;
      float storm = smoothstep(0.62, 0.9, fbm(p * 5.0 + 4.0)) * 0.6;
      col = mix(uSea, uLand, band * 0.75 + band2 * 0.25);
      col = mix(col, uAccent, storm);
    } else if (uKind < 1.5) {
      // Rocky: continents from thresholded fBm, ice at the poles, night-side
      // city glow in the accent where there is land.
      float h = fbm(p * 2.6);
      float land = smoothstep(0.47, 0.53, h);
      float cap = smoothstep(0.72, 0.9, abs(p.y) + fbm(p * 4.0) * 0.12);
      // Land has relief: darker valleys, lighter ridges from a finer octave.
      float relief = fbm(p * 7.0 + 3.0);
      vec3 landCol = uLand * (0.72 + relief * 0.56);
      col = mix(uSea * (0.85 + h * 0.3), landCol, land);
      col = mix(col, uAccent * 0.9 + vec3(0.1), cap);
      rough = land;
      ocean = 1.0 - land;

      // Bump: perturb the normal by the height gradient on land, so ridges
      // catch the key and valleys fall into shadow. Finite differences on
      // the same noise, three extra taps.
      float e = 0.02;
      float hx = fbm((p + vec3(e, 0.0, 0.0)) * 7.0 + 3.0) - relief;
      float hy = fbm((p + vec3(0.0, e, 0.0)) * 7.0 + 3.0) - relief;
      float hz = fbm((p + vec3(0.0, 0.0, e)) * 7.0 + 3.0) - relief;
      vec3 grad = vec3(hx, hy, hz) / e;
      vec3 tangentGrad = grad - p * dot(grad, p);
      N = normalize(N - normalize(normalMatrix * tangentGrad) * 0.045 * land);

      // Clouds: a drifting layer at a coarser scale, thresholded to shapes.
      float c = fbm(p * 3.2 + vec3(uTime * 0.012, 0.0, uTime * 0.008));
      cloud = smoothstep(0.52, 0.68, c) * 0.85;
    } else {
      // Ice world, Europa-style: a bright frost shell scored by long dark
      // lineae (ridged noise, thin), with broad darker chaos regions where
      // the shell has refrozen dirty. Slightly glossy — it is ice.
      float h = fbm(p * 2.6);
      float ridge = 1.0 - abs(2.0 * fbm(p * 4.5 + 7.0) - 1.0);
      float lineae = smoothstep(0.86, 0.97, ridge);
      float chaos = smoothstep(0.5, 0.68, h);
      col = mix(uLand, uAccent, 0.35 + 0.3 * fbm(p * 9.0));   // frost mottling
      col = mix(col, uSea, chaos * 0.55);
      col = mix(col, uSea * 0.6, lineae * 0.7);
      rough = 0.35 + chaos * 0.4;
      ocean = 0.35 * (1.0 - chaos);
    }

    /*
     * Lighting. ONE sun: the core, warm. Lambert with a soft terminator (the
     * atmosphere scatters light a little past the geometric edge). The
     * night side is not black — the galactic plane bounces a faint cool
     * light back, which is what keeps the dark limb readable. Everything is
     * in linear light and only gets tone-mapped at the end.
     */
    vec3 sun = vec3(1.0, 0.93, 0.82) * 2.2;
    vec3 bounce = vec3(0.32, 0.5, 0.55) * 0.09;
    float kd = dot(N, K);
    float day = smoothstep(-0.18, 0.28, kd);
    float lambert = max(kd, 0.0);

    vec3 H = normalize(K + V);
    // Oceans are mirrors; land is matte. The sun's glint on water is the
    // single strongest "real planet" cue there is.
    float gloss = mix(48.0, 220.0, ocean);
    float specAmt = mix(0.06, 0.55, ocean) * (1.0 - rough * 0.8);
    float spec = pow(max(dot(N, H), 0.0), gloss) * specAmt;

    // Albedo is low for real worlds; keep the surface from ever reaching
    // the sun's brightness on its own.
    // Defocus: a lens cannot resolve surface detail off the focal plane,
    // so the texture collapses toward the body's mean colour. The limb
    // softens below, in the atmosphere term.
    col = mix(col, mix(uSea, uLand, 0.5), uDefocus * 0.75);
    sun *= vSun;

    vec3 albedo = col * 0.78;
    vec3 lit = albedo * (sun * lambert * day + bounce) + sun * spec * day * 0.5;

    // Cloud layer: white, lit like the surface, and it casts a soft shadow
    // just below and to the side — the offset is what makes clouds float.
    if (cloud > 0.0) {
      float shadow = smoothstep(0.52, 0.68, fbm((p - K * 0.035) * 3.2 + vec3(uTime * 0.012, 0.0, uTime * 0.008))) * 0.85;
      lit *= 1.0 - shadow * 0.4 * day;
      vec3 cloudCol = vec3(0.92, 0.94, 0.97) * (sun * (lambert * 0.9 + 0.04) * day + bounce);
      lit = mix(lit, cloudCol, cloud);
    }

    // Night-side glow on rocky worlds: settlements, faint and warm.
    if (uKind > 0.5 && uKind < 1.5) {
      float night = 1.0 - day;
      float h = fbm(p * 2.6);
      float land = smoothstep(0.47, 0.53, h);
      float cities = smoothstep(0.6, 0.85, fbm(p * 9.0 + 2.0)) * land * night;
      lit += vec3(1.0, 0.8, 0.5) * cities * 0.18;
    }

    // Ring shadow. March the sun ray from this surface point to the ring
    // plane; if it lands inside the annulus, the surface is in shade. The
    // dark band sweeping across a gas giant is the strongest depth cue a
    // ringed world has — it says the ring is a separate object in front.
    if (uRing > 0.5) {
      float ln = dot(K, uRingN);
      float s = dot(vCentre - vViewPos, uRingN) / (abs(ln) < 0.02 ? 0.02 : ln);
      vec3 q = vViewPos + K * max(s, 0.0);
      float r = length(q - vCentre) / vRadius;
      float inRing = smoothstep(uRingIn - 0.04, uRingIn + 0.06, r) * (1.0 - smoothstep(uRingOut - 0.08, uRingOut + 0.04, r));
      float shade = inRing * step(0.0, s) * day;
      lit *= 1.0 - shade * 0.62;
    }

    // Limb darkening on gas giants: the atmosphere is thick, so light on
    // the edge of the disc has travelled through far more of it. Rocky
    // worlds keep a hard limb.
    float nv = max(dot(N, V), 0.0);
    float limb = mix(0.42, 1.0, pow(nv, 0.45));
    lit *= mix(1.0, limb, 1.0 - step(0.5, uKind));

    // Atmosphere: thin Fresnel limb, only where the sun reaches it. An
    // out-of-focus body's limb bleeds wider and brighter — the halo a
    // defocused highlight grows.
    float fr = pow(1.0 - nv, mix(3.2, 1.3, uDefocus));
    lit += uAtmo * fr * (0.08 + day * 0.42) * (1.0 + uDefocus * 0.9);

    gl_FragColor = vec4(finish(lit, vDist), uOpacity);
  }
`;

/**
 * A thin additive shell just outside the surface — the atmosphere's glow.
 * Lit by the same sun as the surface so the glow is strongest on the day
 * limb and dies on the night limb (a real atmosphere is scattered sunlight,
 * not a uniform halo).
 */
export const atmoVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vCoreDir;
  varying float vDist;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    vDist = -mv.z;
    // Sun direction is per-body, from the body's centre — never per-vertex.
    // Per-vertex, a body sitting at the core has half its vertices pointing
    // back at their own centre, and the day side ends in a jagged black cap.
    vec3 coreView = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 centreView = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 toCore = coreView - centreView;
    vCoreDir = length(toCore) < 1.5 ? vec3(-0.3, 0.55, 0.78) : normalize(toCore);
    gl_Position = projectionMatrix * mv;
  }
`;

export const atmoFrag = /* glsl */ `
  precision highp float;
  uniform vec3 uAtmo;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vCoreDir;
  varying float vDist;
  ${colourPipeline}
  void main() {
    vec3 N = normalize(vNormal);
    float rim = 1.0 - abs(dot(N, normalize(vView)));
    // Day-side scattering: bright toward the sun, a whisper on the night limb.
    float day = smoothstep(-0.35, 0.45, dot(N, vCoreDir));
    float a = pow(clamp(rim, 0.0, 1.0), 2.4) * uIntensity * (0.12 + day * 0.88);
    // Additive: fog only dims, never adds the sky.
    float fog = 1.0 - exp(-max(vDist - 6.0, 0.0) * 0.075);
    gl_FragColor = vec4(toSRGB(aces(uAtmo * 1.6)) * (1.0 - fog), a);
  }
`;

/**
 * Ring system. One annulus; the bands, gaps and soft edges are all in the
 * fragment, so there are no hard geometry edges to alias. Lit by the same
 * sun as the planet, tone-mapped and fogged through the same pipeline.
 */
export const ringVert = /* glsl */ `
  uniform float uInner;
  uniform float uOuter;
  varying float vR;
  varying vec3 vCoreDir;
  varying vec3 vNormal;
  varying float vDist;
  varying vec3 vViewPos;
  varying vec3 vCentre;
  varying float vPlanetR;
  varying float vSun;
  void main() {
    // RingGeometry's uv is planar, not radial; derive the radial axis.
    vR = (length(position.xy) - uInner) / (uOuter - uInner);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDist = -mv.z;
    vViewPos = mv.xyz;
    vCentre = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    // The planet mesh is scale 1.06 inside the same group as this ring.
    vPlanetR = length((modelViewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz) * 1.06;
    vNormal = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));
    // Sun direction is per-body, from the body's centre — never per-vertex.
    // Per-vertex, a body sitting at the core has half its vertices pointing
    // back at their own centre, and the day side ends in a jagged black cap.
    vec3 coreView = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 centreView = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 toCore = coreView - centreView;
    vCoreDir = length(toCore) < 1.5 ? vec3(-0.3, 0.55, 0.78) : normalize(toCore);
    float dc = length(toCore);
    vSun = clamp(2.4 / (1.0 + dc * dc * 0.055), 0.55, 1.35);
    gl_Position = projectionMatrix * mv;
  }
`;

export const ringFrag = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uSeed;
  uniform float uOpacity;
  varying float vR;
  varying vec3 vCoreDir;
  varying vec3 vNormal;
  varying float vDist;
  varying vec3 vViewPos;
  varying vec3 vCentre;
  varying float vPlanetR;
  varying float vSun;
  ${colourPipeline}

  float hash(float x) { return fract(sin(x * 127.1 + uSeed) * 43758.5453); }
  float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), f);
  }

  void main() {
    float r = clamp(vR, 0.0, 1.0);
    // Soft inner and outer edges.
    float edge = smoothstep(0.0, 0.08, r) * (1.0 - smoothstep(0.9, 1.0, r));
    // Fine bands with a couple of real gaps; density thins toward the outer edge.
    float bands = 0.35 + 0.65 * noise(r * 26.0) * noise(r * 7.0 + 3.0);
    float gap1 = 1.0 - smoothstep(0.30, 0.33, r) * (1.0 - smoothstep(0.36, 0.39, r));
    float gap2 = 1.0 - smoothstep(0.66, 0.68, r) * (1.0 - smoothstep(0.71, 0.73, r)) * 0.7;
    float a = edge * bands * gap1 * gap2 * (1.0 - r * 0.35);

    // Ice particles: lit by the sun, from either face of the annulus.
    vec3 sun = vec3(1.0, 0.93, 0.82) * 2.2 * vSun;
    vec3 bounce = vec3(0.32, 0.5, 0.55) * 0.09;
    float lambert = abs(dot(normalize(vNormal), vCoreDir)) * 0.6 + 0.4;

    // Planet shadow. Does the sun ray from this ring particle pass through
    // the planet? Closest-approach test against the sphere, with a soft
    // penumbra. The far side of the ring going dark behind the planet is
    // what makes the ring sit *around* the planet rather than on top of it.
    vec3 d = vViewPos - vCentre;
    float along = -dot(d, vCoreDir);
    float miss = length(d + vCoreDir * max(along, 0.0));
    float eclipse = (1.0 - smoothstep(vPlanetR * 0.9, vPlanetR * 1.06, miss)) * step(0.0, along);

    vec3 albedo = uColor * 0.7;
    vec3 lit = albedo * (sun * lambert * 0.55 * (1.0 - eclipse * 0.9) + bounce);
    gl_FragColor = vec4(finish(lit, vDist), a * uOpacity);
  }
`;

/**
 * Per-body palette. Hubs are gas giants in the warm family; missions are
 * rocky worlds in the cool family; a few ice worlds for variety. Derived
 * from the node id so it is stable across renders.
 */
export type PlanetLook = {
  kind: 0 | 1 | 2;
  sea: string;
  land: string;
  accent: string;
  atmo: string;
  seed: number;
  /** Only a couple of worlds carry rings; on every giant they read as a toy. */
  ring: boolean;
};

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/*
 * Real albedos. Planets are dark: Earth's ocean is ~6% reflective, Jupiter's
 * bands are beige and tan, not orange. Saturation lives in the *lighting*
 * (a warm sun, a cool bounce), not in the paint — the tone-mapper then does
 * the rest. Every colour here is a muted, photographic one.
 */
export function planetLook(id: string, isHub: boolean): PlanetLook {
  const h = hashStr(id);
  const seed = (h % 1000) / 1000;
  if (isHub) {
    // Gas giants — beige/ochre/tan bands; one cool sea-green Neptune-like.
    const variants: Omit<PlanetLook, "seed" | "kind" | "ring">[] = [
      { sea: "#6b5238", land: "#c8b08c", accent: "#e6d7bd", atmo: "#c9a67a" },
      { sea: "#5c4630", land: "#b89a72", accent: "#ddc9a8", atmo: "#b8946a" },
      { sea: "#22434a", land: "#6f9aa0", accent: "#b7d4d6", atmo: "#7fb2b6" },
      { sea: "#7a5f43", land: "#cbb695", accent: "#e8dcc4", atmo: "#c8ab84" },
    ];
    // Exactly one ringed world: the missions hub, the destination that matters.
    return { kind: 0, seed, ring: id === "hub-missions", ...variants[h % variants.length] };
  }
  const variants: Omit<PlanetLook, "seed" | "kind" | "ring">[] = [
    { sea: "#0e2a3a", land: "#6d7a5a", accent: "#e9eef0", atmo: "#6fa8c4" }, // ocean world, olive land
    { sea: "#13303c", land: "#8a7f62", accent: "#efe9dc", atmo: "#79b0b8" }, // temperate, tan continents
    { sea: "#2c2f3c", land: "#8c8a86", accent: "#f2f2f4", atmo: "#9aa6c0" }, // grey rock, thin air
    { sea: "#3a2a20", land: "#a07a58", accent: "#e8d2b0", atmo: "#c49a72" }, // desert world
  ];
  const v = variants[h % variants.length];
  const kind: 1 | 2 = h % 5 === 0 ? 2 : 1;
  return { kind, seed, ring: false, ...v };
}
