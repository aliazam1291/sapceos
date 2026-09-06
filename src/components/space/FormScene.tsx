"use client";

import { Canvas } from "@react-three/fiber";
import type { FormName } from "./forms";
import SurfacedForm from "./SurfacedForm";

/** Per-form framing, so no page has to hand-tune a camera. */
type Framing = { z: number; scale: number; spin: number; tilt: [number, number, number] };

/*
 * Per-form framing and pose.
 *
 * `tilt` matters as much as distance: the station's ring lies in the XZ plane,
 * so a level camera sees it exactly edge-on as a single line. Every flat form
 * needs to be pitched toward the viewer to read as a solid at all.
 */
const FRAMING: Record<FormName, Framing> = {
  planet: { z: 3.1, scale: 1, spin: 0.12, tilt: [0.3, 0, 0.12] },
  station: { z: 3.4, scale: 1.15, spin: 0.16, tilt: [-1.02, 0, 0.22] },
  truss: { z: 4.0, scale: 1, spin: 0.2, tilt: [0.42, 0, 0.5] },
  satellite: { z: 3.5, scale: 1.05, spin: 0.15, tilt: [0.5, 0, 0.18] },
  probe: { z: 3.1, scale: 1.1, spin: 0.22, tilt: [0.24, 0, 0] },
  crystal: { z: 3.0, scale: 1, spin: 0.18, tilt: [0.3, 0, 0.15] },
};

export default function FormScene({
  form,
  seed,
  paused = false,
}: {
  form: FormName;
  seed?: string;
  paused?: boolean;
}) {
  const coarse =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const framing = FRAMING[form];

  return (
    <Canvas
      camera={{ position: [0, 0, framing.z], fov: 42, near: 0.1, far: 30 }}
      dpr={coarse ? 1.25 : [1, 1.75]}
      // Scrolled out of view costs nothing: the loop stops entirely.
      frameloop={paused ? "never" : "always"}
      gl={{ antialias: !coarse, powerPreference: "low-power", alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <SurfacedForm
        form={form}
        seed={seed}
        scale={framing.scale}
        spin={framing.spin}
        tilt={framing.tilt}
      />
    </Canvas>
  );
}
