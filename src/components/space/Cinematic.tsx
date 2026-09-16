"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, DepthOfField } from "@react-three/postprocessing";
import { cameraFocus } from "./cameraFocus";
import { decidePerfLevel, perf, type PerfLevel } from "@/lib/perf";

/*
 * The lens, for real — sized to the machine.
 *
 * Bloom is the cheap half and the one that carries the look (the core,
 * the plumes, the sun-glint). Depth of field is the expensive half: a
 * full-resolution circle-of-confusion pass plus two blur passes. It runs
 * only on machines that report a "high" level, and only at half
 * resolution; if the fps probe steps the level down mid-session the
 * composer rebuilds without it. No multisampling here — MSAA inside a
 * composer doubles the fill cost and the dust never needed it.
 */
export default function Cinematic() {
  const [level, setLevel] = useState<PerfLevel>("medium");
  const dofRef = useRef<{ bokehScale: number; circleOfConfusionMaterial: { worldFocusDistance: number } } | null>(null);

  useEffect(() => {
    setLevel(decidePerfLevel());
    const onPerf = () => setLevel(perf.level);
    window.addEventListener("space:perf", onPerf);
    return () => window.removeEventListener("space:perf", onPerf);
  }, []);

  useFrame((state, dt) => {
    const d = dofRef.current;
    if (!d) return;
    const on = cameraFocus.on;
    const coc = d.circleOfConfusionMaterial;
    const mapDist = state.camera.position.length();
    const wantDist = on > 0.05 ? cameraFocus.dist : mapDist;
    coc.worldFocusDistance += (wantDist - coc.worldFocusDistance) * Math.min(dt * 4, 1);
    const wantScale = 0.05 + on * 2.2;
    d.bokehScale += (wantScale - d.bokehScale) * Math.min(dt * 3, 1);
  });

  if (level === "low") return null;

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom luminanceThreshold={0.85} luminanceSmoothing={0.15} intensity={0.7} mipmapBlur radius={0.55} />
      {level === "high" ? (
        <DepthOfField ref={dofRef as never} worldFocusDistance={9} worldFocusRange={4.5} bokehScale={0.05} resolutionScale={0.5} />
      ) : (
        <></>
      )}
    </EffectComposer>
  );
}
