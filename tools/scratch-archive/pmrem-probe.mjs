import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.addInitScript(() => sessionStorage.setItem('space-os:booted', '1'));
await p.goto('http://localhost:3210/missions', { waitUntil: 'load' });
await p.waitForTimeout(6000);
console.log(
  await p.evaluate(async () => {
    const gl = (window.__gls || [])[0];
    if (!gl) return 'no renderer';
    // Find three's PMREMGenerator through a program's material? Not exposed.
    // Instead inspect what the app's warm-up left behind on this renderer.
    const props = gl.properties;
    const info = gl.info.programs.map((pr) => ({ name: pr.name, id: pr.id, used: pr.usedTimes, ready: typeof pr.isReady === 'function' ? pr.isReady() : null }));
    return { hasProps: !!props, ext: !!gl.getContext().getExtension('KHR_parallel_shader_compile'), programs: info, capabilities: gl.capabilities.isWebGL2 };
  }),
);
await b.close();
