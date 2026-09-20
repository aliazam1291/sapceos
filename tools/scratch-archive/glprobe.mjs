import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new'] });
const p = await b.newPage();
await p.goto('about:blank');
console.log(
  await p.evaluate(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const ext = gl.getExtension('KHR_parallel_shader_compile');
    const build = (n) => {
      const vs = `#version 300 es\nin vec3 p; uniform mat4 m; out vec3 v; void main(){ v = p * ${n}.0; gl_Position = m * vec4(p,1.0); }`;
      let body = 'float a = 0.0;';
      for (let i = 0; i < 400; i++) body += `a += sin(v.x * ${i}.1) * cos(v.y * ${i}.3);`;
      const fs = `#version 300 es\nprecision highp float; in vec3 v; out vec4 o; void main(){ ${body} o = vec4(a); }`;
      const t0 = performance.now();
      const prog = gl.createProgram();
      for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        gl.attachShader(prog, s);
      }
      gl.linkProgram(prog);
      const issued = performance.now() - t0;
      const t1 = performance.now();
      const ok = gl.getProgramParameter(prog, gl.LINK_STATUS);
      const waited = performance.now() - t1;
      return { issued: Math.round(issued), waitedForLinkStatus: Math.round(waited), ok };
    };
    return { renderer: gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL), parallel: !!ext, first: build(1), second: build(2) };
  }),
);
await b.close();
