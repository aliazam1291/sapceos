"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { GalaxyNode } from "./galaxyData";
import styles from "./InteractiveGalaxy.module.scss";
import { spaceSound } from "@/lib/spaceSound";

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
 * The hull used to be `meshBasicMaterial color="#070a0b"` — one flat
 * near-black. With white edges drawn on top, that reads as a hole punched in
 * the sky rather than as a solid: nothing tells you which face is turned
 * toward you, so the body has no volume and the tumble animation does nothing
 * you can see.
 *
 * Flat facet normals plus one fixed view-space key light means every face
 * catches a different value, and the body turning under that light is what
 * actually sells it as a mass. It stays dark — the near-black ground is not
 * negotiable — so this is a lift from #060809 to about #1b2325, not a lit ball.
 */
const hullVert = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const hullFrag = /* glsl */ `
  precision mediump float;
  uniform vec3 uBase;
  uniform vec3 uLit;
  varying vec3 vNormal;

  // Fixed in VIEW space: the key light stays put while the body turns under it.
  const vec3 KEY = vec3(-0.42, 0.66, 0.62);

  void main() {
    float d = clamp(dot(normalize(vNormal), normalize(KEY)) * 0.5 + 0.5, 0.0, 1.0);
    // Steeper than a linear mix: unlit facets stay close to uBase so the body
    // still reads as a dark solid, and only the facets actually facing the key
    // light climb to uLit — contrast between faces, not a flat overall lift.
    gl_FragColor = vec4(mix(uBase, uLit, pow(d, 2.4)), 1.0);
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
 * Brighter than the first pass. At #242f32 the "lit" facet colour was only
 * marginally above the #060809 base — measured against a real screenshot, the
 * hull read as a flat dark shape with edge lines on top rather than a body
 * with facets catching light, which is exactly what the direction's "lit
 * vertices" language rules out. This is still dark and still desaturated —
 * the near-black ground stays non-negotiable — it is a genuine value step
 * instead of a barely-there one.
 */
const LIT = new THREE.Color("#3c4f54");

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
}: StarSystemNodeProps) {
  const bodyRef = useRef<THREE.Group>(null);
  const reticleRef = useRef<THREE.LineSegments>(null);
  const satRef = useRef<THREE.Mesh>(null);
  const edgeMat = useRef<THREE.LineBasicMaterial>(null);
  const orbitTime = useRef(Math.random() * Math.PI * 2);
  const [hovered, setHovered] = useState(false);

  const spinningRingRef = useRef<THREE.Mesh>(null);
  const rippleScale = useRef(0);
  const rippleOpacity = useRef(0);
  const [rippleActive, setRippleActive] = useState(false);

  const active = hovered || isFocused;
  const kind = solidFor(node.category);
  const solid = SOLIDS[kind];
  const solidEdges = SOLID_EDGES[kind];
  const shapeScale = SOLID_SCALE[kind];
  // A real size hierarchy. The source data has every node between 0.23 and
  // 0.35, so on its own the map is fifteen lumps of the same size and nothing
  // tells you what to click first. Hubs are now roughly twice a mission node.
  const baseSize = node.size * (node.isHub ? 1.35 : 0.72);
  const colorHex = node.color || "#22d0b2";

  const hullUniforms = useMemo(
    () => ({
      uBase: { value: new THREE.Color("#060809") },
      // A trace of the node's own colour in the lit facets, so the hub and
      // mission families read as different materials, not just different sizes.
      uLit: { value: new THREE.Color().copy(LIT).lerp(new THREE.Color(colorHex), 0.16) },
    }),
    [colorHex],
  );

  const rimUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(colorHex) },
      uIntensity: { value: 0.4 },
    }),
    [colorHex],
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

      if (edgeMat.current) {
        edgeMat.current.opacity = active ? 0.95 : 0.78 * depth;
      }

      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.4 + phase) * 0.12;
      rimUniforms.uIntensity.value = (active ? 0.9 : 0.5 * depth) * pulse;
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
      const s = THREE.MathUtils.lerp(reticleRef.current.scale.x, 1, Math.min(dt * 12, 1));
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
        {/* Shaded hull. Occludes the far side of the wireframe, and carries the
            facet values that make the tumble legible. */}
        <mesh geometry={solid} scale={0.99 * shapeScale}>
          <shaderMaterial
            vertexShader={hullVert}
            fragmentShader={hullFrag}
            uniforms={hullUniforms}
          />
        </mesh>

        <lineSegments geometry={solidEdges} scale={shapeScale}>
          <lineBasicMaterial ref={edgeMat} color={colorHex} transparent opacity={0.5} />
        </lineSegments>

        {/* Rim light on the hull's own silhouette — same solid, marginally out. */}
        <mesh geometry={solid} scale={1.03 * shapeScale}>
          <shaderMaterial
            vertexShader={rimVert}
            fragmentShader={rimFrag}
            uniforms={rimUniforms}
            transparent
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Hubs carry a real orbit with a body riding it, inclined per node.
          Mission nodes carry none — that contrast is the hierarchy. */}
      {node.isHub && (
        <group scale={[baseSize, baseSize, baseSize]} rotation={orbitTilt} raycast={() => null}>
          <line>
            <primitive object={ORBIT} attach="geometry" />
            <lineBasicMaterial color={colorHex} transparent opacity={active ? 0.6 : 0.28} />
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
