const { chromium } = require("playwright");
const path = require("path");
const OUT = process.argv[2] || ".";

const S = {
  heroPanel: '[class*="heroPanel"]',
  shell: '[class*="__shell"]',
  hudTop: '[class*="__hudTop"]',
  hudBottom: '[class*="__hudBottom"]',
  filterBar: '[class*="__filterBar"]',
  hudControls: '[class*="__hudControls"]',
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  const geo = await page.evaluate((S) => {
    const r = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), right: Math.round(b.right), bottom: Math.round(b.bottom) };
    };
    const out = {};
    for (const [k, v] of Object.entries(S)) out[k] = r(v);
    const canvas = document.querySelector("canvas");
    const cb = canvas?.getBoundingClientRect();
    out.canvas = cb ? { x: Math.round(cb.x), y: Math.round(cb.y), w: Math.round(cb.width), h: Math.round(cb.height), right: Math.round(cb.right), bottom: Math.round(cb.bottom) } : null;
    return out;
  }, S);

  console.log("=== geometry ===");
  console.log(JSON.stringify(geo, null, 2));

  if (geo.shell && geo.filterBar && geo.hudControls) {
    console.log("\n=== HUD alignment vs shell ===");
    console.log("filterBar   left gap:", geo.filterBar.x - geo.shell.x, " right gap:", geo.shell.right - geo.filterBar.right);
    console.log("hudControls left gap:", geo.hudControls.x - geo.shell.x, " right gap:", geo.shell.right - geo.hudControls.right);
    console.log("stacked (wrapped)?", geo.filterBar.y !== geo.hudControls.y, " filterBar.y:", geo.filterBar.y, " hudControls.y:", geo.hudControls.y);
    console.log("bottom gap shell->hudBottom:", geo.shell.bottom - geo.hudBottom.bottom);
  }

  const clip = geo.heroPanel
    ? { x: Math.max(0, geo.heroPanel.x - 20), y: Math.max(0, geo.heroPanel.y - 20), width: Math.min(1440, geo.heroPanel.w + 40), height: Math.min(900, geo.heroPanel.h + 40) }
    : null;

  if (clip) await page.screenshot({ path: path.join(OUT, "p0-default.png"), clip });

  // Measure visible star density inside the canvas at each zoom state.
  const density = async (tag) => {
    const d = await page.evaluate(() => {
      const c = document.querySelector("canvas");
      if (!c) return null;
      // Read pixels via a 2D copy (canvas is WebGL, so draw into a scratch 2D ctx).
      const s = document.createElement("canvas");
      s.width = c.width; s.height = c.height;
      const ctx = s.getContext("2d");
      ctx.drawImage(c, 0, 0);
      const { data } = ctx.getImageData(0, 0, s.width, s.height);
      let lit = 0, total = 0;
      for (let i = 0; i < data.length; i += 4 * 8) { // sample every 8th pixel
        total++;
        if (data[i] + data[i + 1] + data[i + 2] > 90) lit++;
      }
      return { litPct: +(100 * lit / total).toFixed(2), w: s.width, h: s.height };
    });
    console.log(`density ${tag}:`, JSON.stringify(d));
  };
  await density("default(100%)");

  // Zoom in to max via direct DOM clicks (no auto-scroll).
  await page.evaluate(() => {
    const plus = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "+");
    for (let i = 0; i < 6; i++) plus.click();
  });
  await page.waitForTimeout(1400);
  if (clip) await page.screenshot({ path: path.join(OUT, "p1-zoomed-in.png"), clip });
  await density("zoomed-in");

  // Zoom out to min.
  await page.evaluate(() => {
    const minus = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "−" || b.textContent.trim() === "-");
    for (let i = 0; i < 10; i++) minus.click();
  });
  await page.waitForTimeout(1400);
  if (clip) await page.screenshot({ path: path.join(OUT, "p2-zoomed-out.png"), clip });
  await density("zoomed-out");

  await browser.close();
})();
