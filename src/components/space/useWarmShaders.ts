"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import type * as THREE from "three";
import { shipEnvIfReady, warmShipEnv } from "./shipEnv";

/**
 * Compile a scene's shaders without blocking the page (2026-09-20).
 *
 * The first frame of any scene here used to compile every material
 * synchronously — the ship's clearcoat PBR, the pad, the planets — and on a
 * first visit that was one main-thread task of 1.1 s on a desktop (2.6 s
 * under a software rasteriser, ×4 on the mobile audit). It landed right
 * after first paint, so the LCP image waited on it and every tap during the
 * launch screen was dead. Profiled with tools/profile-uat.mjs.
 *
 * `renderer.compileAsync` uses KHR_parallel_shader_compile where the driver
 * offers it (ANGLE D3D11 does): the compile runs on the GPU process, the
 * main thread polls, and the promise resolves when every program has
 * linked. Two things have to hold for it to help, both learned the hard
 * way: (1) nothing may RENDER before it resolves — the first draw of an
 * unlinked program waits for it (`getProgramParameter(ACTIVE_UNIFORMS)`),
 * so the owner keeps the Canvas at `frameloop="never"` until `onWarm`;
 * (2) nothing may be HIDDEN during the compile — `compile()` gathers lights
 * with `traverseVisible`, so a `visible=false` root compiled light-less
 * programs that the real render then replaced, synchronously. And
 * `renderer.debug.checkShaderErrors` must be off in production (lib/gl.ts),
 * or `onFirstUse` waits on the info logs.
 *
 *   const [warm, setWarm] = useState(false);
 *   <Canvas frameloop={warm ? "demand" : "never"} onCreated={quietGL}>
 *     …scene…
 *     <WarmShaders onWarm={() => setWarm(true)} />
 *   </Canvas>
 */
export function WarmShaders({ onWarm }: { onWarm: () => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let cancelled = false;
    const frame = () => new Promise<void>((res) => requestAnimationFrame(() => res()));
    (async () => {
      // The ship's env map first (shipEnv.ts): the materials that use it
      // must have it BEFORE they compile, or they compile twice.
      await warmShipEnv(gl as THREE.WebGLRenderer).catch(() => null);
      // Two frames: one for React to hand the texture to the materials, one
      // for R3F to commit them into the scene — then, because a busy main
      // thread can land React's commit later than that, wait (bounded) until
      // no material that wants the map is still without it.
      await frame();
      await frame();
      if (cancelled) return;
      if (shipEnvIfReady(gl as THREE.WebGLRenderer)) {
        for (let i = 0; i < 12; i++) {
          let pending = false;
          scene.traverse((o) => {
            const m = (o as THREE.Mesh).material as (THREE.MeshStandardMaterial & { userData: { wantsEnv?: boolean } }) | undefined;
            if (m && !Array.isArray(m) && m.userData?.wantsEnv && !m.envMap) pending = true;
          });
          if (!pending) break;
          await frame();
        }
        if (cancelled) return;
      }
      const r = gl as THREE.WebGLRenderer & { compileAsync?: (s: THREE.Object3D, c: THREE.Camera) => Promise<unknown> };
      if (typeof r.compileAsync === "function") {
        await r.compileAsync(scene, camera).catch(() => null);
        // Shadow maps draw with their own depth materials, which compile()
        // never sees; on a canvas with shadows the first shadow pass was one
        // more synchronous compile. Warm the two default variants with a
        // render target bound (the shadow pass renders off-screen, and three
        // keys programs on that).
        if (r.shadowMap.enabled) {
          const T = await import("three");
          const warm = new T.Scene();
          warm.add(new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking })));
          warm.add(new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshDistanceMaterial()));
          const rt = new T.WebGLRenderTarget(4, 4);
          r.setRenderTarget(rt);
          await r.compileAsync(warm, camera).catch(() => null);
          r.setRenderTarget(null);
          rt.dispose();
          warm.traverse((o) => (o as THREE.Mesh).geometry?.dispose?.());
        }
      }
      if (!cancelled) onWarm();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
