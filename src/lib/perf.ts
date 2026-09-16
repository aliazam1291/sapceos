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

export const perf: { level: PerfLevel; fps: number } = { level: "high", fps: 60 };

let decided = false;

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
    window.dispatchEvent(new CustomEvent("space:perf", { detail: perf.level }));
  }
}
