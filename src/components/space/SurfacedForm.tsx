"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildForm, disposeForm, type FormName } from "./forms";

/**
 * The house surface treatment, applied to any form from forms.ts.
 *
 * A flat wireframe is the same brightness whichever way it faces, so the eye
 * gets no depth cue and the object reads as a flat tangle of lines. Three
 * things fix that, and they are the whole point of this component:
 *
 *   1. Depth-faded edges — far edges dim, so the solid reads as solid.
 *   2. A travelling scan band — a bright plane sweeping along one axis, which
 *      reveals the form's cross-section as it passes.
 *   3. Sequenced node pulses — vertices light in a wave rather than in unison,
 *      so the object looks powered rather than lit.
 *
 * Two draw calls per form (edges + nodes), plus an optional hull.
 */

const ACCENT = new THREE.Color("#22d0b2");

const edgeVert = /* glsl */ `
  uniform float uTime;
  uniform float uScanSpeed;
  uniform float uExtent;

  varying float vDepth;
  varying float vScan;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;

    // 0 near the camera, 1 far. Normalised by the form's own size so every
    // form fades over the same visual range regardless of scale.
    vDepth = clamp((-mv.z - uExtent * 0.4) / (uExtent * 3.2), 0.0, 1.0);

    // Scan plane travels along local Y, wrapping through the form's extent.
    float span = uExtent * 2.2;
    float head = mod(uTime * uScanSpeed, span) - span * 0.5;
    vScan = 1.0 - clamp(abs(position.y - head) / (uExtent * 0.16), 0.0, 1.0);
  }
`;

const edgeFrag = /* glsl */ `
  precision mediump float;

  uniform vec3  uBase;
  uniform vec3  uScanColor;
  uniform float uOpacity;

  varying float vDepth;
  varying float vScan;

  void main() {
    // Near edges read at full strength, far ones drop away — this is what
    // gives a wireframe its solidity.
    float depthFade = mix(1.0, 0.28, vDepth);

    float scan = pow(vScan, 2.0);
    vec3 col = mix(uBase, uScanColor, scan * 0.85);

    gl_FragColor = vec4(col, (depthFade + scan * 0.6) * uOpacity);
  }
`;

const nodeVert = /* glsl */ `
  attribute float aIndex;

  uniform float uTime;
  uniform float uCount;
  uniform float uSize;

  varying float vPulse;
  varying float vDepth;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;

    // Offsetting the phase by index sends a wave around the form instead of
    // flashing every node at once.
    float phase = (aIndex / max(uCount, 1.0)) * 6.2831;
    vPulse = 0.45 + 0.55 * sin(uTime * 2.0 - phase * 3.0);

    vDepth = clamp((-mv.z - 1.0) / 9.0, 0.0, 1.0);
    gl_PointSize = uSize * mix(1.25, 0.55, vDepth) * (1.0 + vPulse * 0.5) * (260.0 / max(-mv.z, 0.001));
  }
`;

const nodeFrag = /* glsl */ `
  precision mediump float;

  uniform vec3 uColor;

  varying float vPulse;
  varying float vDepth;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float core = pow(smoothstep(0.5, 0.0, d), 1.6);
    gl_FragColor = vec4(uColor, core * vPulse * mix(1.0, 0.25, vDepth));
  }
`;

export default function SurfacedForm({
  form,
  seed = "space-os",
  scale = 1,
  spin = 0.14,
  tilt = [0, 0, 0],
  scanSpeed = 0.55,
  edgeColor = "#c3d2d6",
  nodeSize = 0.028,
  opacity = 0.92,
}: {
  form: FormName;
  seed?: string;
  scale?: number;
  spin?: number;
  /** Static pose, applied outside the spin so it never drifts. */
  tilt?: [number, number, number];
  scanSpeed?: number;
  edgeColor?: string;
  nodeSize?: number;
  opacity?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const edgeMat = useRef<THREE.ShaderMaterial>(null);
  const nodeMat = useRef<THREE.ShaderMaterial>(null);

  const built = useMemo(() => buildForm(form, seed), [form, seed]);

  // Built here rather than by R3F, so it must be released here too.
  useEffect(() => () => disposeForm(built), [built]);

  // Node index attribute, so each vertex knows its place in the pulse wave.
  const nodeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(built.nodes, 3));
    const count = built.nodes.length / 3;
    const idx = new Float32Array(count);
    for (let i = 0; i < count; i++) idx[i] = i;
    g.setAttribute("aIndex", new THREE.BufferAttribute(idx, 1));
    return g;
  }, [built]);

  useEffect(() => () => nodeGeo.dispose(), [nodeGeo]);

  const edgeUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScanSpeed: { value: scanSpeed },
      uExtent: { value: built.extent },
      uBase: { value: new THREE.Color(edgeColor) },
      uScanColor: { value: ACCENT.clone() },
      uOpacity: { value: opacity },
    }),
    [built.extent, edgeColor, opacity, scanSpeed],
  );

  const nodeUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCount: { value: built.nodes.length / 3 },
      uSize: { value: nodeSize },
      uColor: { value: ACCENT.clone() },
    }),
    [built.nodes.length, nodeSize],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (edgeMat.current) edgeMat.current.uniforms.uTime.value += dt;
    if (nodeMat.current) nodeMat.current.uniforms.uTime.value += dt;
    if (group.current) {
      group.current.rotation.y += dt * spin;
      group.current.rotation.x += dt * spin * 0.35;
    }
  });

  return (
    <group rotation={tilt} scale={scale}>
      <group ref={group}>
        {/* Occluder in the page colour, so far edges are genuinely hidden
            rather than just dimmed. Only closed forms have one. */}
        {built.hull && (
          <mesh geometry={built.hull} scale={0.985}>
            <meshBasicMaterial color="#060809" />
          </mesh>
        )}

        <lineSegments geometry={built.edges}>
        <shaderMaterial
          ref={edgeMat}
          vertexShader={edgeVert}
          fragmentShader={edgeFrag}
          uniforms={edgeUniforms}
          transparent
          depthWrite={false}
        />
        </lineSegments>

        <points geometry={nodeGeo}>
        <shaderMaterial
          ref={nodeMat}
          vertexShader={nodeVert}
          fragmentShader={nodeFrag}
          uniforms={nodeUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
        </points>
      </group>
    </group>
  );
}
