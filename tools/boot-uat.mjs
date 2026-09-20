// The launch sequence, end to end: boot screen up with its real progress
// readout, the launch window counting down, the auto-launch (or a hold),
// the overlay lifting, the galaxy resuming, the companion arriving on a
// secondary page (or yielding to the lead ship on the home page). Shots at
// each beat plus the state flags, so a frozen galaxy, a stuck percentage
// or a second ship is visible.
//
//   node tools/boot-uat.mjs /              (home: expect ONE ship after launch)
//   node tools/boot-uat.mjs /missions      (expect the companion to fly in)
//   HOLD=1 node tools/boot-uat.mjs /       (launch by holding instead of waiting)
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const route = process.argv[2] ?? '/';
const tag = route.replace(/\//g, '_') || '_root';
fs.mkdirSync('tools/shots', { recursive: true });

const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE + route, { waitUntil: 'load' });
const state = () =>
  p.evaluate(() => ({
    booting: document.documentElement.hasAttribute('data-booting'),
    readout: document.querySelector('[class*="BootScreen"] [class*="readout"]')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
    galaxyTick: window.__cameraFocus ? Math.round(performance.now() - window.__cameraFocus.tick) : null,
    galaxyShip: window.__cameraFocus?.ship,
    companionOn: window.__shipState?.on,
    canvases: document.querySelectorAll('canvas').length,
  }));
await p.waitForTimeout(1200);
console.log('loading      ', await state());
await p.screenshot({ path: `tools/shots/boot-${tag}-1-loading.png` });
await p.waitForSelector('button[aria-label="Hold to launch"][data-ready]', { timeout: 15000 });
await p.waitForTimeout(400);
console.log('ready        ', await state());
await p.screenshot({ path: `tools/shots/boot-${tag}-2-ready.png` });

if (process.env.HOLD) {
  const btn = await p.$('button[aria-label="Hold to launch"]');
  const box = await btn.boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.mouse.down();
  await p.waitForTimeout(1500);
  console.log('mid hold     ', await state());
  await p.screenshot({ path: `tools/shots/boot-${tag}-3-hold.png` });
  await p.waitForTimeout(1200);
  await p.mouse.up();
} else {
  // Let the launch window run out.
  await p.waitForTimeout(3000);
  console.log('T-2          ', await state());
  await p.screenshot({ path: `tools/shots/boot-${tag}-3-window.png` });
  await p.waitForFunction(() => !document.documentElement.hasAttribute('data-booting'), null, { timeout: 8000 });
}
await p.waitForTimeout(600);
console.log('lift-off     ', await state());
await p.screenshot({ path: `tools/shots/boot-${tag}-4-liftoff.png` });
await p.waitForTimeout(3000);
console.log('after 3 s    ', await state());
await p.screenshot({ path: `tools/shots/boot-${tag}-5-settled.png` });
await b.close();
