"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CARD_H, CARD_W } from "./spiral";

/**
 * One mission, as an instrument plaque in the flight — not a flat card.
 *
 * REWRITTEN FROM A PLAIN PLANE.
 *
 * The first version was a textured `PlaneGeometry` — exactly the thing
 * DESIGN_DIRECTION.md's visual language already warns against elsewhere in
 * this codebase: "a billboarded PNG in a starfield reads as a tile pasted on
 * the screen." Every other body in this scene (StarSystemNode, MissionObject,
 * GalaxyShip) is a faceted low-poly SOLID with its own edges drawn over it —
 * a flat rectangle sitting among them read as generic UI chrome that had
 * wandered into a 3D scene, not as an object that belonged there.
 *
 * This is now a chamfered, shallow-extruded plaque: a real solid with eight
 * sides, a visible thickness, and small faceted mounting accents at two
 * corners — built from THREE.Shape + ExtrudeGeometry rather than a plane, so
 * it catches light at glancing angles and reads as an instrument rather than
 * a sheet of paper. The card face texture is unchanged; only the geometry
 * it's mapped onto changed.
 *
 * The hit target is still a SECOND, larger, invisible plane behind it — the
 * `StarSystemNode` trick: `WebGLRenderer.projectObject` gates the render-list
 * push on `material.visible`, while `Raycaster.intersectObject` gates on
 * `object.visible`, so a mesh with `visible={false}` on its MATERIAL, not the
 * object, is a raycast target that costs zero draw calls. A plain rectangle is
 * fine here even though the visible plaque is chamfered — a few extra square
 * millimetres of hit area at the corners costs nothing and is never seen.
 *
 * Hover and select are damped in `useFrame`, never set directly — the motion
 * contract in DESIGN_DIRECTION.md: read state, damp toward it, never animate a
 * transform off an event.
 */

const HAIRLINE = new THREE.Color("#1a1a1a");
const ACCENT = new THREE.Color("#22d0b2");

/** How much of each corner is cut. Small enough that the texture's own corner
 *  ticks (drawn in cardTexture.ts) still read as sitting just inside it. */
const CHAMFER = CARD_W * 0.09;

/** Extrusion depth — enough to catch a glancing highlight, not enough to read
 *  as a box. A real plaque, not a brick. */
const DEPTH = 0.045;

/** Built once and shared: every card is the same shape. */
let panelGeometry: THREE.ExtrudeGeometry | null = null;
let edgesGeometry: THREE.EdgesGeometry | null = null;
let cornerGeometry: THREE.OctahedronGeometry | null = null;
let hitGeometry: THREE.PlaneGeometry | null = null;

function getSharedGeometry() {
  if (!panelGeometry) {
    const w = CARD_W;
    const h = CARD_H;
    const c = CHAMFER;
    const x = -w / 2;
    const y = -h / 2;

    const shape = new THREE.Shape();
    shape.moveTo(x + c, y);
    shape.lineTo(x + w - c, y);
    shape.lineTo(x + w, y + c);
    shape.lineTo(x + w, y + h - c);
    shape.lineTo(x + w - c, y + h);
    shape.lineTo(x + c, y + h);
    shape.lineTo(x, y + h - c);
    shape.lineTo(x, y + c);
    shape.closePath();

    // No bevel: a beveled edge on a shape this small would just look soft.
    // The chamfer itself is the facet; the extrusion gives it a hairline of
    // actual thickness to catch light on.
    panelGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: DEPTH,
      bevelEnabled: false,
      steps: 1,
      curveSegments: 1,
    });
    panelGeometry.translate(0, 0, -DEPTH / 2);

    // A generous angle threshold: ExtrudeGeometry's cap is a fan of
    // coplanar triangles, and a low threshold would draw every internal
    // triangulation seam as a stray line. This keeps only the shape's own
    // perimeter and the cap/side seam.
    edgesGeometry = new THREE.EdgesGeometry(panelGeometry, 30);
    cornerGeometry = new THREE.OctahedronGeometry(CARD_W * 0.045, 0);
    hitGeometry = new THREE.PlaneGeometry(w, h);
  }
  return {
    panel: panelGeometry,
    edges: edgesGeometry!,
    corner: cornerGeometry!,
    hit: hitGeometry!,
  };
}

export default function ProjectCard({
  position,
  texture,
  hovered,
  selected,
  dimmed,
  coarse,
  onHoverChange,
  onSelect,
}: {
  position: THREE.Vector3;
  texture: THREE.Texture;
  hovered: boolean;
  selected: boolean;
  /** True while a DIFFERENT card is selected — this one steps back. */
  dimmed: boolean;
  coarse: boolean;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const face = useRef<THREE.Mesh>(null);
  const border = useRef<THREE.LineSegments>(null);
  const glow = useRef<THREE.Sprite>(null);
  const scaleRef = useRef(1);
  const opacityRef = useRef(1);
  const glowRef = useRef(0.12);

  const geo = getSharedGeometry();
  const half = CARD_W / 2 - CHAMFER * 0.55;
  const halfH = CARD_H / 2 - CHAMFER * 0.55;

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const k = 1 - Math.exp(-9 * dt);

    // Face the camera on the local axes only — the group itself carries the
    // "orient toward the helix" rotation set by the caller each frame, so a
    // full billboard here would fight it. Handled by the caller via lookAt on
    // the group, so this effect only manages scale/opacity/glow.
    const targetScale = selected ? 1.18 : hovered ? 1.055 : 1;
    scaleRef.current += (targetScale - scaleRef.current) * k;
    g.scale.setScalar(scaleRef.current);

    const targetOpacity = dimmed ? 0.25 : 1;
    opacityRef.current += (targetOpacity - opacityRef.current) * k;
    const mats = face.current?.material as THREE.MeshBasicMaterial[] | undefined;
    if (mats) {
      mats[0].opacity = opacityRef.current;
      mats[1].opacity = opacityRef.current;
    }
    const bmat = border.current?.material as THREE.LineBasicMaterial | undefined;
    if (bmat) bmat.opacity = 0.35 + 0.55 * (hovered || selected ? 1 : 0) * opacityRef.current;

    /*
     * Idle glow is deliberately faint. Measured: at an earlier 0.35 idle /
     * 1.9x scale, ten cards' sprites overlapped into a continuous cyan wash
     * that hid the card faces underneath — the same overdraw failure the
     * DeepSpace starfield had. Hover and select stay strong, because
     * DESIGN_DIRECTION.md asks for hierarchy, not headcount: the glow should
     * be the reward for looking at a card, not ambient wallpaper under all
     * ten at once.
     */
    const targetGlow = (selected ? 0.65 : hovered ? 0.4 : 0.12) * opacityRef.current;
    glowRef.current += (targetGlow - glowRef.current) * k;
    const smat = glow.current?.material as THREE.SpriteMaterial | undefined;
    if (smat) smat.opacity = glowRef.current;
  });

  return (
    <group ref={group} position={position}>
      {/*
        Rim glow, behind the plaque, sized to peek past the chamfered edges
        rather than engulf the card. See the idle-glow comment in useFrame for
        why the ambient level is so low.
      */}
      <sprite ref={glow} scale={[CARD_W * 1.22, CARD_H * 1.22, 1]} position={[0, 0, -0.06]}>
        <spriteMaterial
          color={ACCENT}
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {/*
        Two materials via two geometry groups: ExtrudeGeometry always builds
        group 0 for the front+back caps and group 1 for the extruded sides.
        The cap carries the mission's texture; the side is a plain hairline
        tint, which is what gives the plaque a visible edge of actual material
        rather than the illusion of one.
        NOT `transparent` on the cap by default — the texture is fully opaque
        — but both materials still need `transparent: true` set so opacity
        animates at all when a neighbour is selected and this one dims.
      */}
      <mesh ref={face} geometry={geo.panel} raycast={() => null}>
        <meshBasicMaterial attach="material-0" map={texture} toneMapped={false} transparent />
        <meshBasicMaterial attach="material-1" color={HAIRLINE} toneMapped={false} transparent />
      </mesh>

      <lineSegments ref={border} geometry={geo.edges} raycast={() => null}>
        <lineBasicMaterial color={HAIRLINE} transparent opacity={0.35} />
      </lineSegments>

      {/*
        Faceted mounting accents — small octahedra at two opposite corners,
        the same low-poly vocabulary GalaxyShip and StarSystemNode use
        elsewhere in this scene. Two, not four: an asymmetric pair reads as
        something engineered — a bracket holding the plaque in its frame —
        where four would read as decoration.
      */}
      {[
        [-half, halfH, DEPTH * 0.6],
        [half, -halfH, DEPTH * 0.6],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} geometry={geo.corner} raycast={() => null}>
          <meshBasicMaterial color={ACCENT} toneMapped={false} transparent opacity={0.8} />
        </mesh>
      ))}

      {/* Hit target: larger than the plaque, invisible via material.visible so
          it costs zero draw calls, per the trick documented at the top. */}
      <mesh
        geometry={geo.hit}
        scale={[1.25, 1.15, 1]}
        onPointerOver={coarse ? undefined : () => onHoverChange(true)}
        onPointerOut={coarse ? undefined : () => onHoverChange(false)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}
