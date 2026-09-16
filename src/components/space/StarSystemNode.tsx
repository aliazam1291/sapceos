"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { GalaxyNode } from "./galaxyData";
import styles from "./InteractiveGalaxy.module.scss";
import { spaceSound } from "@/lib/spaceSound";
import { cameraFocus } from "./cameraFocus";
import { atmoFrag, atmoVert, planetFrag, planetLook, planetVert, ringFrag, ringVert } from "./planetShader";

// One sphere for every body; segment count is enough for a smooth limb at
// the sizes it is drawn, and the surface detail is all in the fragment.
// Dense enough that the limb is a curve, not a polygon, at flight distance.
const PLANET = new THREE.SphereGeometry(1, 72, 48);
// The ring's u coordinate runs 0..1 from inner to outer radius, which the
// ring shader uses as its radial axis.
const RING = new THREE.RingGeometry(1.4, 2.1, 128, 1);
// R3F updates a ShaderMaterial's source strings on hot reload but never
// sets needsUpdate, so the old program keeps running until a hard reload —
// which is how a fixed shader bug can stay on screen for an hour. Keying
// the material on its source remounts it whenever the GLSL changes.
const SHADER_REV = String(planetVert.length + planetFrag.length + atmoFrag.length + ringVert.length + ringFrag.length);
const _ringN = new THREE.Vector3();

interface StarSystemNodeProps {
  node: GalaxyNode;
  isFocused: boolean;
  onSelect: (node: GalaxyNode) => void;
  /** True while any node is focused — other labels step aside for the drawer. */
  anyFocused?: boolean;
  /*
   * Lifts this node's hover out to the scene so the CAMERA can answer it, not
   * just the node. Hover was purely local until now, which meant the single
   * most common interaction on the whole hero — moving the cursor across the
   * map — moved nothing but the node directly under it.
   */
  onHover?: (node: GalaxyNode | null) => void;
  /** Coarse pointer: the map is a third of the width, so labels have to shrink. */
  compact?: boolean;
  /**
   * Draw the acquire brackets on the focused body.
   *
   * They are a fixed 1.24 world units across, which frames a node nicely from
   * the hero map's ~9-unit camera distance. The mission flight holds at ~2.4
   * units, where the same brackets span two thirds of the viewport and run off
   * the edges as stray lines. The flight turns them off — at that range the
   * subject is already the largest, brightest thing on screen.
   */
  reticle?: boolean;
  /** When false, hubs hide static idle labels (e.g. in the embedded hero) unless hovered. */
  showLabels?: boolean;
  /** Multiplier on the body's size — the hero runs bodies smaller than the map. */
  sizeScale?: number;
}

const _scale = new THREE.Vector3();
const _world = new THREE.Vector3();

/*
 * Shared geometry — one solid per CATEGORY.
 *
 * Every node used to be the same icosahedron, so fifteen bodies of three
 * different kinds read as one undifferentiated scatter: nothing about a shape
 * told you whether you were looking at a navigation hub, a fleet product or a
 * platform build. The data splits cleanly five/five/five, so the shape can do
 * that work instead of being decoration.
 *
 *   navigation  dodecahedron — twelve faces, the most built of the three;
 *               these are the anchors you steer by
 *   telematics  icosahedron  — the roundest, most planet-like solid, for the
 *               products that track things moving in the world
 *   platform    octahedron   — hard, crystalline, few faces; the engineered
 *               systems underneath
 *
 * All at detail 0. three's PolyhedronGeometry only computes FLAT facet normals
 * at detail 0 — above that it normalises them into a smooth sphere — and flat
 * normals are the entire reason a hull reads as a cut solid rather than a ball.
 *
 * Built once at module scope: there are fifteen nodes and three shapes, so
 * per-node geometry would allocate forty-five buffers for three distinct forms.
 */
type SolidKind = "navigation" | "telematics" | "platform";

const SOLIDS: Record<SolidKind, THREE.BufferGeometry> = {
  navigation: new THREE.DodecahedronGeometry(1, 0),
  telematics: new THREE.IcosahedronGeometry(1, 0),
  platform: new THREE.OctahedronGeometry(1, 0),
};

const SOLID_EDGES: Record<SolidKind, THREE.EdgesGeometry> = {
  navigation: new THREE.EdgesGeometry(SOLIDS.navigation, 1),
  telematics: new THREE.EdgesGeometry(SOLIDS.telematics, 1),
  platform: new THREE.EdgesGeometry(SOLIDS.platform, 1),
};

/*
 * Apparent-size correction.
 *
 * These solids share a circumradius but not an inradius: an octahedron's faces
 * sit at 0.577 of its circumradius against roughly 0.79 for the other two, so
 * at equal scale it reads noticeably smaller and lighter. Without this the
 * platform nodes would look like a lesser tier rather than a different kind.
 */
const SOLID_SCALE: Record<SolidKind, number> = {
  navigation: 0.97,
  telematics: 1,
  platform: 1.24,
};

function solidFor(category: string): SolidKind {
  return category === "navigation" || category === "platform"
    ? (category as SolidKind)
    : "telematics";
}

/** One inclined ellipse, shared by every hub; each node tilts its own copy. */
const ORBIT = (() => {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 96; i++) {
    const t = (i / 96) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * 2.2, 0, Math.sin(t) * 1.58));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
})();

/**
 * Hover reticle: four corner brackets, not a circle.
 *
 * A thin ring around a body is the most generic thing a 3D map can draw — it
 * reads as clip art, and at a glance it is indistinguishable from the orbit
 * sitting right next to it. Brackets read as a target being acquired, which is
 * both the right register and unambiguous against a curve.
 */
const RETICLE = (() => {
  const s = 1;
  const a = 0.42;
  const seg: number[] = [];
  for (const [sx, sy] of [
    [-1, 1],
    [1, 1],
    [1, -1],
    [-1, -1],
  ]) {
    // Vertical arm, then horizontal arm, meeting at the corner.
    seg.push(sx * s, sy * (s - a), 0, sx * s, sy * s, 0);
    seg.push(sx * s, sy * s, 0, sx * (s - a), sy * s, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
  return g;
})();

const UNIT_CIRCLE = (() => {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t), 0, Math.sin(t)));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
})();

/* ── Hull shading ─────────────────────────────────────────────────────────── */

/*
 * The hull used to be `meshBasicMaterial color="#080808"` — one flat
 * near-black. With white edges drawn on top, that reads as a hole punched in
 * the sky rather than as a solid: nothing tells you which face is turned
 * toward you, so the body has no volume and the tumble animation does nothing
 * you can see.
 *
 * Flat facet normals plus one fixed view-space key light means every face
 * catches a different value, and the body turning under that light is what
 * actually sells it as a mass. It stays dark — the near-black ground is not
 * negotiable — so this is a lift from #080808 to about #181818, not a lit ball.
 */
/*
 * Lit like a body in the scene, not a diagram.
 *
 * The galactic core is the scene's light source, so the key light comes from
 * it — direction computed per vertex in view space, so a body on the far side
 * of the disc is lit from behind and one near the camera is lit from the
 * front. A cool fill from the camera's upper-left keeps the dark side from
 * going flat, a Blinn highlight gives each facet a specular read, and a
 * Fresnel term lifts the silhouette. "Texture" is procedural, in the
 * fragment: fine grain plus thin panel seams in object space, so the hull
 * looks machined rather than painted. No texture files, ~15 low-poly meshes —
 * this costs nothing measurable.
 */
const hullVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vObj;
  varying vec3 vCoreDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    vObj = position;
    vec3 coreView = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 toCore = coreView - mv.xyz;
    // The hub sits at the core itself; a zero vector would normalise to NaN
    // and black the body out, so it takes a fixed key from the camera side.
    vCoreDir = length(toCore) < 0.6 ? vec3(-0.3, 0.55, 0.78) : normalize(toCore);
    gl_Position = projectionMatrix * mv;
  }
`;

const hullFrag = /* glsl */ `
  precision mediump float;
  uniform vec3 uBase;
  uniform vec3 uLit;
  uniform vec3 uAccent;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vObj;
  varying vec3 vCoreDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vView);
    vec3 K = normalize(vCoreDir);
    const vec3 FILL = vec3(-0.45, 0.62, 0.64);

    // Diffuse: warm key from the core, cool fill from the camera side.
    float kd = max(dot(N, K), 0.0);
    float fd = max(dot(N, normalize(FILL)), 0.0);

    // Blinn highlight on the key. Tight, so it reads as a hard material.
    vec3 H = normalize(K + V);
    float spec = pow(max(dot(N, H), 0.0), 56.0);

    // Fresnel: silhouettes pick up the ambient sky.
    float fr = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    // Surface. Grain at a fine scale; seams as thin dark lines on a coarser
    // object-space grid, so each facet shows plating.
    float grain = (hash(floor(vObj * 64.0)) - 0.5) * 0.05;
    vec3 g = abs(fract(vObj * 2.6) - 0.5);
    float seam = 1.0 - smoothstep(0.0, 0.045, min(min(g.x, g.y), g.z));

    vec3 col = uBase + uLit * (kd * 1.1 + fd * 0.32) + vec3(grain);
    col = mix(col, col * 0.55, seam * 0.7);
    col += uAccent * (spec * 0.55 + fr * 0.28);
    col += vec3(1.0, 0.98, 0.92) * spec * 0.25;

    gl_FragColor = vec4(col, uOpacity);
  }
`;

/* ── Rim light ────────────────────────────────────────────────────────────── */

const rimVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const rimFrag = /* glsl */ `
  precision mediump float;
  uniform vec3  uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vView)));
    // Widened from 2.2: at the tighter exponent the rim only lit right at the
    // silhouette edge, which at node scale is a handful of pixels and reads as
    // nothing. 1.6 gives it enough width to actually register as a glow.
    gl_FragColor = vec4(uColor, pow(clamp(rim, 0.0, 1.0), 1.6) * uIntensity);
  }
`;

/*
 * Brighter than the first pass. At #222222 the "lit" facet colour was only
 * marginally above the #080808 base — measured against a real screenshot, the
 * hull read as a flat dark shape with edge lines on top rather than a body
 * with facets catching light, which is exactly what the direction's "lit
 * vertices" language rules out. This is still dark and still desaturated —
 * the near-black ground stays non-negotiable — it is a genuine value step
 * instead of a barely-there one.
 */
const LIT = new THREE.Color("#3a3a3a");

/**
 * One navigable star system, drawn as a GEOMETRIC BODY.
 *
 * Every node is a faceted icosahedron: a shaded hull that occludes, its own
 * edge wireframe, and a rim light that follows those facets. It turns with the
 * camera because it is genuinely three-dimensional. Hubs additionally carry a
 * real inclined orbit with a body riding it.
 *
 * What is deliberately NOT here any more:
 *
 *   - the lit vertex cloud on every hull (twelve additive sprites per node,
 *     ~180 across the map, sitting on top of the edges they mark)
 *   - a rim shell built from a SPHERE. An icosahedron's faces sit at 0.795 of
 *     its circumradius, so any sphere big enough to be seen at the silhouette
 *     bulged up to 20% past every flat face — that is exactly where the soft
 *     green halo around each node was coming from. The shell is the same solid
 *     as the hull now, so the light catches the polyhedron's own edges.
 *   - the flat hub ring and the flat hover circle: two static concentric
 *     curves around one body, telling you nothing apart from each other.
 */
export default function StarSystemNode({
  node,
  isFocused,
  onSelect,
  anyFocused = false,
  onHover,
  compact = false,
  reticle = true,
  showLabels = true,
  sizeScale = 1,
}: StarSystemNodeProps) {
  const bodyRef = useRef<THREE.Group>(null);
  const reticleRef = useRef<THREE.LineSegments>(null);
  const satRef = useRef<THREE.Mesh>(null);
  const edgeMat = useRef<THREE.LineBasicMaterial>(null);
  const hullMat = useRef<THREE.ShaderMaterial>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const orbitTime = useRef(Math.random() * Math.PI * 2);
  const [hovered, setHovered] = useState(false);

  const spinningRingRef = useRef<THREE.Mesh>(null);
  const rippleScale = useRef(0);
  const rippleOpacity = useRef(0);
  const [rippleActive, setRippleActive] = useState(false);

  const active = hovered || isFocused;
  // A real size hierarchy. The source data has every node between 0.23 and
  // 0.35, so on its own the map is fifteen lumps of the same size and nothing
  // tells you what to click first. Hubs are now roughly twice a mission node.
  // Real hierarchy of scale. Gas giants are an order of magnitude larger
  // than rocky worlds; the map cannot go that far (the small ones are
  // still click targets) but a 2.5:1 ratio is enough to read as a system
  // rather than a set of marbles.
  const baseSize = node.size * (node.isHub ? 1.6 : 0.64) * sizeScale;
  const colorHex = node.color || "#2fbf8a";

  const look = useMemo(() => planetLook(node.id, Boolean(node.isHub)), [node.id, node.isHub]);

  const hullUniforms = useMemo(
    () => ({
      uSea: { value: new THREE.Color(look.sea) },
      uLand: { value: new THREE.Color(look.land) },
      uAccent: { value: new THREE.Color(look.accent) },
      uAtmo: { value: new THREE.Color(look.atmo) },
      uSeed: { value: look.seed * 10 },
      uKind: { value: look.kind },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uRing: { value: look.ring ? 1 : 0 },
      uRingN: { value: new THREE.Vector3(0, 1, 0) },
      // Ring radii in planet-radius units: the ring is 1.4–2.1 in group
      // space, the planet mesh is 1.06.
      uRingIn: { value: 1.4 / 1.06 },
      uRingOut: { value: 2.1 / 1.06 },
      uDefocus: { value: 0 },
    }),
    [look],
  );

  const rimUniforms = useMemo(
    () => ({
      uAtmo: { value: new THREE.Color(look.atmo) },
      uIntensity: { value: 0.4 },
    }),
    [look],
  );

  const ringUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(look.atmo) },
      uSeed: { value: look.seed * 40 },
      uOpacity: { value: 0.5 },
      uInner: { value: 1.4 },
      uOuter: { value: 2.1 },
    }),
    [look],
  );

  // A stable per-node phase, so the map does not pulse or orbit in unison.
  const phase = useMemo(() => node.position[0] * 1.7 + node.position[2] * 0.9, [node.position]);

  const radDist = useMemo(() => {
    return Math.sqrt(node.position[0] ** 2 + node.position[2] ** 2);
  }, [node.position]);

  /*
   * Each hub's orbit is inclined differently, derived from its own position — a
   * set of identically-tilted ellipses is what makes an orbit diagram look
   * printed rather than observed.
   *
   * The pitch is deliberately kept inside ±0.42rad rather than the ±0.5 around
   * a 0.55 bias it had. The map camera sits ~34° above the galactic plane, so
   * an orbit pitched much past that tips its plane face-on to the viewer and
   * draws a perfect circle — indistinguishable from the decorative ring this
   * replaced. Staying under it means every orbit is foreshortened into an
   * ellipse from where you are actually standing.
   */
  const orbitTilt = useMemo<[number, number, number]>(
    () => [Math.sin(phase) * 0.42, phase * 0.7, Math.cos(phase * 1.3) * 0.38],
    [phase],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);

    if (bodyRef.current) {
      const s = active ? baseSize * 1.28 : baseSize;
      _scale.set(s, s, s);
      bodyRef.current.scale.lerp(_scale, Math.min(dt * 8, 1));

      // Slow tumble on two axes — the read that says "this is a solid".
      bodyRef.current.rotation.y += dt * (node.isHub ? 0.22 : 0.34);
      bodyRef.current.rotation.x += dt * 0.11;

      // Depth cue. Near nodes hold their line weight; far ones recede, so the
      // map has a front and a back instead of being a flat constellation.
      bodyRef.current.getWorldPosition(_world);
      const dist = _world.distanceTo(state.camera.position);
      const depth = 1 - Math.min(Math.max((dist - 5.5) / 6.5, 0), 1) * 0.34;

      // Near clip, done softly. A body the camera flies past would fill a
      // corner of the frame as a giant low-poly prop; inside ~2.6 units it
      // fades out and shrinks instead, the way an out-of-focus foreground
      // object drops away in a real lens.
      // Measured to the *surface*, not the centre: a large hub's limb reaches
      // the near plane long before its centre does, and a sphere sliced flat
      // by the frustum is the least real thing a camera can show.
      const reach = bodyRef.current.scale.x * (look.ring ? 2.1 : 1.16);
      const near = Math.min(Math.max((dist - reach - 0.9) / 1.6, 0), 1);
      if (near < 1) bodyRef.current.scale.multiplyScalar(0.55 + near * 0.45);
      bodyRef.current.visible = near > 0.02 || active;

      hullUniforms.uOpacity.value = near;
      ringUniforms.uOpacity.value = 0.5 * near;

      // Depth of field, the cheap way: the subject is sharp, everything
      // off its focal plane loses surface detail and grows a soft limb.
      // The active body is always sharp — it is what the camera is on.
      const off = active ? 0 : Math.min(Math.abs(dist - cameraFocus.dist) / 4.0, 1);
      hullUniforms.uDefocus.value = off * cameraFocus.on;

      // The ring plane normal, in view space, for the ring-shadow test in
      // the planet shader. The group tumbles, so this moves every frame.
      if (ringRef.current) {
        ringRef.current.getWorldDirection(_ringN);
        _ringN.transformDirection(state.camera.matrixWorldInverse);
        hullUniforms.uRingN.value.copy(_ringN);
      }
      hullUniforms.uTime.value = state.clock.elapsedTime;
      if (hullMat.current) hullMat.current.transparent = near < 1;
      void depth;

      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.4 + phase) * 0.12;
      rimUniforms.uIntensity.value = (active ? 0.9 : 0.5 * depth) * pulse * near;
    }

    if (satRef.current) {
      orbitTime.current += dt * 0.42;
      satRef.current.position.set(
        Math.cos(orbitTime.current) * 2.2,
        0,
        Math.sin(orbitTime.current) * 1.58,
      );
      satRef.current.rotation.y += dt * 1.1;
    }

    if (reticleRef.current && active) {
      // Snaps in on acquire rather than appearing at full size.
      // Acquired size stays close to the body: brackets that expand to the
      // frame read as a crosshair, not a lock.
      // Tighter on the long lens: at flight distance the brackets would
      // otherwise frame half the sky instead of the body.
      const want = 0.78 - cameraFocus.on * 0.4;
      const s = THREE.MathUtils.lerp(reticleRef.current.scale.x, want, Math.min(dt * 12, 1));
      reticleRef.current.scale.set(s, s, s);
      reticleRef.current.lookAt(state.camera.position);
    } else if (reticleRef.current) {
      reticleRef.current.scale.setScalar(0.62);
    }

    // Spin reticle ring
    if (spinningRingRef.current && active) {
      spinningRingRef.current.lookAt(state.camera.position);
      spinningRingRef.current.rotateZ(-state.clock.elapsedTime * 1.2);
    }

    // Ripple expansion
    if (rippleActive) {
      rippleScale.current += dt * 4.2;
      rippleOpacity.current -= dt * 2.0;
      if (rippleOpacity.current <= 0) {
        setRippleActive(false);
      }
    }
  });

  return (
    <group position={node.position}>
      {/* Hit target. The visible body is small, which would leave roughly a
          10px click area on screen, so pointer events live on this generously
          sized invisible sphere. The OBJECT must stay visible — three.js skips
          `visible={false}` objects when raycasting — but its material need not
          be; see below. */}
      <mesh
        scale={[baseSize * 3.4, baseSize * 3.4, baseSize * 3.4]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover?.(node);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover?.(null);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
          spaceSound.playClick();
          rippleScale.current = 0.1;
          rippleOpacity.current = 0.8;
          setRippleActive(true);
        }}
      >
        <sphereGeometry args={[1, 8, 8]} />
        {/* `visible={false}` on the MATERIAL, not the object.

            The two are checked in different places: WebGLRenderer.projectObject
            gates the render-list push on `material.visible`, while Raycaster
            gates intersection on `object.visible`. Setting it here therefore
            removes the draw call and keeps the hit target — where the previous
            `transparent opacity={0}` still cost a full transparent sphere,
            fifteen of them, every single frame, to render nothing at all.
            Segment count is down too: nothing is shaded, so the sphere only
            needs enough facets to approximate its own silhouette for the ray. */}
        <meshBasicMaterial visible={false} />
      </mesh>

      <group ref={bodyRef} scale={[baseSize, baseSize, baseSize]} raycast={() => null}>
        {/* The world itself: a procedural planet (see planetShader.ts) — gas
            giant, rocky or ice by node — lit from the core, with a Fresnel
            atmosphere. Replaced the faceted wireframe solids, which read as
            props the moment the camera came near. */}
        <mesh geometry={PLANET} scale={1.06}>
          <shaderMaterial
            key={SHADER_REV}
            ref={hullMat}
            vertexShader={planetVert}
            fragmentShader={planetFrag}
            uniforms={hullUniforms}
          />
        </mesh>

        {/* Atmosphere shell, additive, just outside the limb. */}
        <mesh geometry={PLANET} scale={1.16}>
          <shaderMaterial
            key={SHADER_REV}
            vertexShader={atmoVert}
            fragmentShader={atmoFrag}
            uniforms={rimUniforms}
            transparent
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Ring system on gas giants — one annulus, bands and soft edges in
            the shader (see ringFrag), so nothing about it can alias. */}
        {look.ring && (
          <mesh ref={ringRef} geometry={RING} rotation={[Math.PI / 2 + 0.35, 0.2, 0]} raycast={() => null}>
            <shaderMaterial
              key={SHADER_REV}
              vertexShader={ringVert}
              fragmentShader={ringFrag}
              uniforms={ringUniforms}
              transparent
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {/* Hubs carry a real orbit with a body riding it, inclined per node.
          Mission nodes carry none — that contrast is the hierarchy. */}
      {node.isHub && (
        <group scale={[baseSize, baseSize, baseSize]} rotation={orbitTilt} raycast={() => null}>
          <line>
            <primitive object={ORBIT} attach="geometry" />
            <lineBasicMaterial
              color={colorHex}
              transparent
              // Fainter when the bodies are scaled down for the hero: an
              // orbit line brighter than the world it circles reads as a diagram.
              opacity={active ? 0.6 : sizeScale < 1 ? 0.14 : 0.28}
            />
          </line>
          <mesh ref={satRef}>
            <octahedronGeometry args={[0.11, 0]} />
            <meshBasicMaterial color={colorHex} />
          </mesh>
        </group>
      )}

      {/* Target reticle — hover/focus only. */}
      <lineSegments
        ref={reticleRef}
        geometry={RETICLE}
        visible={active && reticle}
        scale={[0.62, 0.62, 0.62]}
        raycast={() => null}
      >
        <lineBasicMaterial
          color={colorHex}
          transparent
          opacity={isFocused ? 0.95 : 0.7}
          depthTest={false}
        />
      </lineSegments>

      {/* Spinning outer reticle ring — hover/focus only. */}
      {active && reticle && (
        <mesh
          ref={spinningRingRef}
          raycast={() => null}
        >
          <ringGeometry args={[baseSize * 1.32, baseSize * 1.38, 32]} />
          <meshBasicMaterial
            color={colorHex}
            transparent
            opacity={isFocused ? 0.75 : 0.4}
            side={THREE.DoubleSide}
            depthTest={false}
          />
        </mesh>
      )}

      {/* Expanding click ripple */}
      {rippleActive && (
        <mesh scale={[rippleScale.current, rippleScale.current, rippleScale.current]} raycast={() => null}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color={colorHex}
            transparent
            opacity={rippleOpacity.current}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            wireframe
          />
        </mesh>
      )}

      {/* Galactic orbit line for hovered/focused node */}
      {active && (
        <group 
          position={[-node.position[0], 0, -node.position[2]]} 
          scale={[radDist, 1, radDist]} 
          raycast={() => null}
        >
          <line>
            <primitive object={UNIT_CIRCLE} attach="geometry" />
            <lineBasicMaterial
              color={colorHex}
              transparent
              opacity={isFocused ? 0.22 : 0.12}
            />
          </line>
        </group>
      )}

      {/* Hubs stay labelled so the map reads as navigation at rest; mission
          nodes reveal on approach, which keeps 15 labels from colliding. Once
          something is focused the drawer names it, so the remaining labels
          stand down rather than overlapping the panel. */}
      {((hovered && !isFocused) || (node.isHub && !anyFocused && showLabels)) && (
        <Html
          // drei scales HTML by distanceFactor/distance. On a phone the panel is
          // ~390px wide but the camera sits at the same world distance, so 12
          // rendered "MISSIONS HUB" at desktop pixel size across a third of the
          // screen and ran the outer labels off the edge.
          distanceFactor={compact ? 5.5 : 12}
          position={[0, baseSize * 2.4 + 0.18, 0]}
          style={{
            opacity: active ? 1 : 0.78,
            transition: "opacity 0.2s ease",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <div className={`${styles.spatialBadge} ${isFocused ? styles.focused : ""}`}>
            {node.title}
          </div>
        </Html>
      )}
    </group>
  );
}
