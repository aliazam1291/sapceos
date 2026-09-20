"use client";

import * as THREE from "three";
import { decidePerfLevel } from "@/lib/perf";

/*
 * The ship's environment map — built once per renderer, off the critical
 * path (2026-09-20).
 *
 * A space environment, not a studio: black, one hot sun, a faint cool sky
 * band. Reflections on the hull are then one hard highlight and a lot of
 * dark — which is what metal in vacuum looks like. RoomEnvironment (bright
 * walls all round) is what made it look like plastic.
 *
 * It used to be a `useMemo` inside ShipModel: `PMREMGenerator.fromScene`
 * ran during React's render, compiled the generator's own shaders with
 * blocking status queries, and drew the cube and its blur chain — ~700 ms
 * of main thread on an Intel iGPU, once for EVERY canvas the ship appears
 * in (the pad, the companion, the galaxy, the landing, the hole). Profiled
 * with tools/profile-uat.mjs as the last long task standing.
 *
 * Now: `compileCubemapShader()` issues the generator's compiles without
 * waiting (KHR_parallel_shader_compile), two frames go by while the driver
 * links them, then `fromScene` draws with programs that are already ready.
 * One texture per renderer, shared by every ShipModel on that canvas; the
 * promise is shared too, so five ships mounting at once build it once.
 */
const cache = new WeakMap<THREE.WebGLRenderer, { texture: THREE.Texture | null; promise: Promise<THREE.Texture | null> }>();

/*
 * The finished cube-UV map, read back to the CPU once (2026-09-20). GPU
 * textures cannot cross WebGL contexts, and every ship canvas — the pad,
 * the companion, the galaxy, the landing, the hole — has its own; each
 * used to run PMREM again, and PMREM's GGX pass blocks ~550 ms on an iGPU
 * that no warm-up can hide. Now the first canvas renders it, reads the
 * pixels back (half-float, 768×1024, one ~2 ms stall), and every later
 * canvas uploads that buffer as a DataTexture with CubeUVReflectionMapping —
 * exactly what PMREM's output is — so three uses it as-is, no GGX.
 */
let baked: { data: Uint16Array; width: number; height: number } | null = null;
let baking: Promise<void> | null = null;

function fromBaked(): THREE.Texture | null {
  if (!baked) return null;
  const t = new THREE.DataTexture(baked.data, baked.width, baked.height, THREE.RGBAFormat, THREE.HalfFloatType);
  t.mapping = THREE.CubeUVReflectionMapping;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.LinearSRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

function buildScene() {
  const scene = new THREE.Scene();
  // No Color background: PMREM would draw it with its own box material,
  // compiled synchronously at render. The sky sphere below encloses the
  // camera and is the background.
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(14, 12, 9) }));
  sun.position.set(-6, 9, 8);
  scene.add(sun);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(30, 24, 16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.02, 0.03, 0.04), side: THREE.BackSide }),
  );
  sky.position.y = -22;
  scene.add(sky);
  return scene;
}

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/** The env texture for this renderer, once it has been built. */
export function shipEnvIfReady(gl: THREE.WebGLRenderer): THREE.Texture | null {
  const hit = cache.get(gl);
  if (hit) return hit.texture;
  // Baked already by another canvas: hand this renderer its copy now, so a
  // ShipModel mounting here builds env-mapped materials on its first
  // render instead of swapping them in a frame later (a swap disposes the
  // first set, and three then compiles the second set synchronously).
  if (baked && decidePerfLevel() === "high") {
    const texture = fromBaked();
    if (texture) {
      cache.set(gl, { texture, promise: Promise.resolve(texture) });
      return texture;
    }
  }
  return null;
}

/** Build (or join the build of) this renderer's env texture. */
export function warmShipEnv(gl: THREE.WebGLRenderer): Promise<THREE.Texture | null> {
  const hit = cache.get(gl);
  if (hit) return hit.promise;
  // Phones and low/medium devices: no environment map at all. The GGX
  // convolution PMREM runs to build it cannot be warmed (its program key
  // differs from any pre-compile — traced with tools/glblock-uat.mjs) and
  // blocks ~550 ms on an iGPU, ×4 under the mobile audit's CPU throttle,
  // for a reflection that a 375px hull does not show. The hull keeps its
  // metalness and lights; only the mirror of the sky goes.
  if (decidePerfLevel() !== "high") {
    const none = { texture: null, promise: Promise.resolve(null) };
    cache.set(gl, none);
    return none.promise;
  }
  const entry: { texture: THREE.Texture | null; promise: Promise<THREE.Texture | null> } = { texture: null, promise: Promise.resolve(null) };
  entry.promise = (async () => {
    // Another canvas is baking, or has baked: reuse.
    if (baking) await baking;
    const reused = fromBaked();
    if (reused) {
      entry.texture = reused;
      return reused;
    }
    let finishBake: () => void = () => {};
    baking = new Promise<void>((res) => {
      finishBake = res;
    });
    const pmrem = new THREE.PMREMGenerator(gl);
    // Issue the generator's shader compiles now, wait for the driver to
    // link them in parallel, then render — nothing here blocks.
    pmrem.compileCubemapShader();
    // compileCubemapShader covers the cubemap pass only. The blur and the GGX
    // convolution materials are created inside fromScene and compiled on
    // first use — the GGX one measured 564 ms to link (tools/glblock-uat.mjs),
    // the last blocking query on the launch screen. Allocate them early at
    // the size fromScene will use and issue their compiles too. Private API,
    // so guarded: if three moves it, this degrades to the old cost.
    const priv = pmrem as unknown as {
      _setSize?: (n: number) => void;
      _allocateTargets?: () => { dispose?: () => void };
      _compileMaterial?: (m: THREE.Material) => void;
      _blurMaterial?: THREE.Material | null;
      _ggxMaterial?: THREE.Material | null;
    };
    const warmScene = new THREE.Scene();
    if (priv._setSize && priv._allocateTargets) {
      priv._setSize(256);
      priv._allocateTargets()?.dispose?.();
      const cubemap = (pmrem as unknown as { _cubemapMaterial?: THREE.Material | null })._cubemapMaterial;
      // The generator's own materials on real planes (its lod meshes are
      // planes), compiled through compileAsync so the wait below is three's
      // own COMPLETION_STATUS poll — not a guess, and not a blocking query.
      for (const m of [priv._blurMaterial, priv._ggxMaterial, cubemap]) {
        if (!m) continue;
        // PMREM draws these into render targets, where three resolves the
        // tone-mapping parameter to None; a warm compile against the screen
        // resolves it to the renderer's ACES and lands in a DIFFERENT program
        // (found with tools/glblock-uat.mjs — the GGX pass still blocked 550 ms
        // after a "successful" warm-up). toneMapped=false pins it to None in
        // both, so the key matches and the render finds a linked program.
        m.toneMapped = false;
        // An EMPTY geometry, as three's own _compileMaterial uses: r185 keys a
        // program on whether the geometry has a normal attribute (HAS_NORMAL),
        // and PMREM's lod planes have none. A PlaneGeometry here compiled a
        // program with normals that the GGX pass never used — it still
        // blocked 560 ms (tools/progkeys-uat.mjs, 2026-09-20).
        warmScene.add(new THREE.Mesh(new THREE.BufferGeometry(), m));
      }
    }
    const scene = buildScene();
    // The scene's own two materials compile in parallel too; the promise
    // resolves when every program has linked.
    const r = gl as THREE.WebGLRenderer & { compileAsync?: (s: THREE.Object3D, c: THREE.Camera) => Promise<unknown> };
    if (typeof r.compileAsync === "function") {
      const cam = new THREE.PerspectiveCamera();
      // PMREM renders everything into render targets, and three resolves two
      // program parameters from the CURRENT render target — output colour
      // space (linear off-screen, sRGB on screen) and tone mapping. A warm
      // compile against the screen produced programs PMREM never used and the
      // GGX pass still blocked ~550 ms. Compiling with a throwaway target set
      // gives the same keys PMREM will ask for.
      const rt = new THREE.WebGLRenderTarget(4, 4);
      gl.setRenderTarget(rt);
      await Promise.all([r.compileAsync(scene, cam).catch(() => null), r.compileAsync(warmScene, cam).catch(() => null)]);
      gl.setRenderTarget(null);
      rt.dispose();
    }
    warmScene.traverse((o) => (o as THREE.Mesh).geometry?.dispose?.());
    await frame();
    const target = pmrem.fromScene(scene, 0.02);
    const texture = target.texture;
    pmrem.dispose();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      (m.material as THREE.Material | undefined)?.dispose?.();
    });
    // Read the map back for every other canvas (see `baked`).
    try {
      const { width, height } = target;
      const data = new Uint16Array(width * height * 4);
      gl.readRenderTargetPixels(target, 0, 0, width, height, data);
      // A context that cannot read half floats returns zeros (three logs,
      // does not throw); a black map must not be shared.
      let lit = false;
      for (let i = 0; i < data.length && !lit; i += 97) lit = data[i] !== 0;
      if (lit) baked = { data, width, height };
    } catch {
      // A context that cannot read half floats keeps the per-canvas PMREM.
    }
    finishBake();
    entry.texture = texture;
    return texture;
  })();
  cache.set(gl, entry);
  return entry.promise;
}
