/**
 * The one thing every <Canvas> on the site must do when its renderer is
 * created (2026-09-20).
 *
 * three's `renderer.debug.checkShaderErrors` defaults to true. With it on,
 * `WebGLProgram.onFirstUse` calls `getProgramInfoLog` / `getShaderInfoLog`
 * for every program the first time it is drawn — and those calls make the
 * browser WAIT for the compile to finish. That single flag turned the
 * parallel compile (`useWarmShaders`, KHR_parallel_shader_compile) back
 * into a synchronous one: profiled at 2.6–2.8 s of main thread on the
 * launch screen alone (Intel UHD, ANGLE D3D11, ~650 ms per program).
 * three's own docs recommend turning it off in production; a shader that
 * fails to compile still fails visibly, it just does not log why.
 */
export function quietGL({ gl }: { gl: { debug?: { checkShaderErrors: boolean } } }) {
  if (gl.debug) gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  // Every renderer, for the harnesses (tools/programs-uat.mjs reads
  // renderer.info.programs to see what compiled, and when).
  const w = window as unknown as { __gls?: unknown[] };
  (w.__gls ??= []).push(gl);
}
