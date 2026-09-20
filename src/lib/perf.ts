/**
 * One quality level for the whole site, decided from the device and then
 * corrected by what the frame rate actually does.
 *
 * `level` starts from cheap signals (cores, memory, coarse pointer, saved
 * data) and the fps probe in DeepSpace lowers it if the page cannot hold
 * ~40fps for a few seconds. Scenes read `perf.level` each frame for the
 * things they can change live (post-processing, frame skipping) and once
 * at mount for the things they cannot (point counts).
 */
export type PerfLevel = "high" | "medium" | "low";

export const perf: { level: PerfLevel; fps: number; software: boolean } = {
  level: "high",
  fps: 60,
  /** True when WebGL is running on the CPU (SwiftShader, llvmpipe, …). */
  software: false,
};

let decided = false;

/*
 * Is WebGL a real GPU or a software rasteriser? Headless auditors
 * (Lighthouse, PageSpeed, most CI) and some locked-down desktops run
 * SwiftShader or llvmpipe, where every draw call is main-thread CPU time:
 * measured 2026-09-19, the galaxy alone produced 10-second long tasks and a
 * 31 s Total Blocking Time on the mobile audit. The fps probe would have
 * caught it, but only after ~4 s of that — too late for a page load. One
 * throwaway context, released immediately, answers it before any scene
 * mounts.
 */
function detectSoftwareGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") ?? c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /swiftshader|llvmpipe|softpipe|software|mesa offscreen|microsoft basic render/i.test(renderer);
  } catch {
    return false;
  }
}

export function decidePerfLevel(): PerfLevel {
  if (decided || typeof window === "undefined") return perf.level;
  decided = true;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = nav.hardwareConcurrency ?? 8;
  const mem = nav.deviceMemory ?? 8;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const saveData = nav.connection?.saveData === true;
  try {
    const saved = localStorage.getItem("space-os:perf");
    if (saved === "low" || saved === "medium") perf.level = saved;
  } catch {}
  if (saveData || cores <= 4 || mem <= 4) perf.level = "low";
  else if (coarse || cores <= 6) perf.level = perf.level === "low" ? "low" : "medium";
  perf.software = detectSoftwareGL();
  if (perf.software) perf.level = "low";
  document.documentElement.dataset.perf = perf.level;
  if (perf.software) document.documentElement.dataset.gl = "software";
  return perf.level;
}

let lowFrames = 0;
/**
 * Feed from a render loop. Sustained slowness steps the level down once
 * and remembers it, so the next visit starts at the right level.
 */
export function reportFrame(dt: number) {
  const fps = 1 / Math.max(dt, 1e-3);
  perf.fps += (fps - perf.fps) * 0.05;
  if (perf.fps < 38) lowFrames++;
  else lowFrames = Math.max(0, lowFrames - 2);
  if (lowFrames > 150 && perf.level !== "low") {
    perf.level = perf.level === "high" ? "medium" : "low";
    lowFrames = 0;
    try {
      localStorage.setItem("space-os:perf", perf.level);
    } catch {}
    document.documentElement.dataset.perf = perf.level;
    window.dispatchEvent(new CustomEvent("space:perf", { detail: perf.level }));
  }
}
