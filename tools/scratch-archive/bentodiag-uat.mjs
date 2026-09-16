import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE + '/', { waitUntil: 'load' });
await p.waitForTimeout(2000);
const y = await p.evaluate(() => {
  const el = document.querySelector('[class*="objectCaption"]');
  const r = el.getBoundingClientRect();
  return window.scrollY + r.top - 300;
});
await p.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y);
await p.waitForTimeout(6000);
const info = await p.evaluate(() => {
  const tile = document.querySelector('[class*="Bento_object"]') || [...document.querySelectorAll('[class*="object"]')].find(e=>e.querySelector('canvas'));
  const canvas = tile?.querySelector('canvas');
  if (!canvas) return { found: false };
  const rect = canvas.getBoundingClientRect();
  const stage = canvas.closest('[class*="stage"]');
  const stageStyle = stage ? getComputedStyle(stage) : null;
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  return {
    found: true,
    rect: { w: rect.width, h: rect.height },
    canvasAttr: { w: canvas.width, h: canvas.height },
    stageOpacity: stageStyle?.opacity,
    stageDisplay: stageStyle?.display,
    stageMask: stageStyle?.maskImage || stageStyle?.webkitMaskImage,
    glLost: gl ? gl.isContextLost() : 'no-gl-ctx-from-this-call',
  };
});
console.log(JSON.stringify(info, null, 2));
await b.close();
