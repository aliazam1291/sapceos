// Behance covers for the four company case studies, 1616×1264 (2× the
// 808×632 card). Ali, 2026-11-19: "the case studies look too same … see the
// app screens in the app store … different covers". Each cover has its own
// look:
//  - Mappls Intouch and Indane Yatra Mitra use the PUBLIC Google Play
//    marketing screenshots (shots/case/store/, downloaded from the listings
//    with Ali's go-ahead) in each app's own colours.
//  - Driver Safety and the Tata Power dashboard have no public listing, so
//    they show no screens: an abstract idea in their own palette.
// The bottom ~25% of a Behance card carries its title overlay on hover, so
// nothing important sits there.
//   node tools/figma-plugin/case-covers.mjs → shots/case/<slug>/cover.png
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;700;800&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet"/>`;
const BASE = `*{margin:0;padding:0;box-sizing:border-box}body{width:1616px;height:1264px;overflow:hidden;position:relative;font-family:Geist,sans-serif}
.k{font-family:"Geist Mono",monospace;font-size:26px;letter-spacing:.22em;text-transform:uppercase}
.tile{position:absolute;width:440px;border-radius:34px;overflow:hidden;box-shadow:0 50px 90px rgba(0,0,0,.55),0 0 0 2px rgba(255,255,255,.08)}
.tile img{display:block;width:100%}`;

const covers = {
  /* 1 — Intouch: the brand's deep green, three store tiles fanned on the right */
  intouch: `<style>${BASE}
body{background:radial-gradient(1100px 900px at 78% 40%,#0f6b52 0%,#06382b 45%,#031a14 100%);color:#eafff6}
.glow{position:absolute;right:120px;top:120px;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(46,214,160,.35),transparent 65%)}
h1{position:absolute;left:100px;top:300px;font-size:150px;line-height:.9;font-weight:800;letter-spacing:-.05em}
h1 span{color:#33d6a0}
.k{position:absolute;left:104px;top:200px;color:#7ff0c9}
.sub{position:absolute;left:104px;top:600px;width:520px;font-size:34px;line-height:1.35;color:#bfe9da}
.num{position:absolute;left:104px;top:760px;display:flex;gap:56px}
.num b{display:block;font-size:76px;font-weight:800;letter-spacing:-.04em;color:#fff}
.num small{font-family:"Geist Mono",monospace;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:#7ff0c9}
</style><div class="glow"></div>
<div class="tile" style="left:760px;top:180px;transform:rotate(-9deg)"><img src="../store/intouch-2.png"></div>
<div class="tile" style="left:1150px;top:150px;transform:rotate(8deg)"><img src="../store/intouch-3.png"></div>
<div class="tile" style="left:950px;top:90px;transform:rotate(-1deg);width:470px;z-index:2"><img src="../store/intouch-1.png"></div>
<p class="k">● Product case study</p><h1>Mappls<br/><span>Intouch</span></h1>
<p class="sub">A fleet app built for 10,000 vehicles and architected for 50,000.</p>
<div class="num"><div><b>10K+</b><small>Active vehicles</small></div><div><b>1K+</b><small>Play installs</small></div></div>`,

  /* 2 — Indane Yatra Mitra: the listing's saffron → navy, four tiles in a tilted row */
  "indane-yatra-mitra": `<style>${BASE}
body{background:linear-gradient(160deg,#f07a1a 0%,#c4531c 38%,#4a2f4a 70%,#16204f 100%);color:#fff}
.row{position:absolute;left:860px;top:-60px;width:1200px;height:1400px;transform:rotate(12deg);transform-origin:top left}
.scrim{position:absolute;inset:0;background:linear-gradient(90deg,rgba(214,96,28,.96) 0%,rgba(190,82,30,.9) 40%,rgba(190,82,30,0) 60%);z-index:1}
h1,.k,.sub,.star{z-index:2}
.row .tile{width:300px;border-radius:26px}
h1{position:absolute;left:96px;top:310px;font-size:138px;line-height:.92;font-weight:800;letter-spacing:-.05em;text-shadow:0 8px 40px rgba(0,0,0,.25)}
.k{position:absolute;left:100px;top:210px;color:#ffe2c4}
.sub{position:absolute;left:100px;top:620px;width:560px;font-size:34px;line-height:1.35;color:#ffe9d6}
.star{position:absolute;left:100px;top:760px;display:flex;align-items:center;gap:22px}
.star b{font-size:84px;font-weight:800;letter-spacing:-.04em}
.star small{font-family:"Geist Mono",monospace;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:#ffe2c4;line-height:1.5}
</style>
<div class="row">
 <div class="tile" style="left:0;top:120px"><img src="../store/iym-1.png"></div>
 <div class="tile" style="left:330px;top:40px"><img src="../store/iym-3.png"></div>
 <div class="tile" style="left:660px;top:-40px"><img src="../store/iym-4.png"></div>
 <div class="tile" style="left:165px;top:700px"><img src="../store/iym-2.png"></div>
</div><div class="scrim"></div>
<p class="k">● Product case study · IOCL</p><h1>Indane<br/>Yatra Mitra</h1>
<p class="sub">Tracking for Indian Oil's LPG tanker fleet, where tracking is a safety job.</p>
<div class="star"><b>4.5★</b><small>Google Play<br/>12 reviews · 1K+ installs</small></div>`,

  /* 3 — Driver Safety: no screens. Hazard yellow on black; many signals
     converge on one point. */
  "driver-safety": `<style>${BASE}
body{background:#0b0b0a;color:#fff}
svg{position:absolute;inset:0}
h1{position:absolute;left:96px;top:300px;font-size:168px;line-height:.86;font-weight:800;letter-spacing:-.055em}
h1 span{color:#ffc531}
.k{position:absolute;left:100px;top:200px;color:#ffc531}
.sub{position:absolute;left:100px;top:640px;width:560px;font-size:34px;line-height:1.35;color:#d9d6cc}
.stripe{position:absolute;left:0;right:0;top:0;height:26px;background:repeating-linear-gradient(-45deg,#ffc531 0 28px,#0b0b0a 28px 56px)}
.tag{position:absolute;left:100px;top:790px;display:flex;gap:14px}
.tag span{font-family:"Geist Mono",monospace;font-size:20px;letter-spacing:.14em;text-transform:uppercase;border:2px solid #ffc531;color:#ffc531;padding:10px 16px}
</style>
<div class="stripe"></div>
<svg width="1616" height="1264" viewBox="0 0 1616 1264">${(() => {
    // signals fan in from the right edge and converge on one point
    const P = [1060, 520];
    let s = `<defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffc531" stop-opacity=".55"/><stop offset="1" stop-color="#ffc531" stop-opacity="0"/></radialGradient></defs><circle cx="${P[0]}" cy="${P[1]}" r="260" fill="url(#g)"/>`;
    for (let i = 0; i < 26; i++) {
      const y = 60 + i * 46;
      const x = 1616;
      const c = i % 5 === 0 ? "#ffc531" : "rgba(255,255,255,.28)";
      s += `<path d="M${x} ${y} C ${1350} ${y}, ${1230} ${P[1] + (y - P[1]) * 0.3}, ${P[0]} ${P[1]}" fill="none" stroke="${c}" stroke-width="${i % 5 === 0 ? 3 : 1.5}"/>`;
      s += `<circle cx="${1560 - (i % 3) * 40}" cy="${y}" r="${i % 5 === 0 ? 8 : 5}" fill="${c}"/>`;
    }
    s += `<circle cx="${P[0]}" cy="${P[1]}" r="46" fill="#0b0b0a" stroke="#ffc531" stroke-width="6"/><circle cx="${P[0]}" cy="${P[1]}" r="18" fill="#ffc531"/>`;
    s += `<text x="${P[0] - 300}" y="${P[1] + 8}" fill="#ffc531" style="font:500 22px 'Geist Mono';letter-spacing:.2em">ONE DECISION</text>`;
    return s;
  })()}</svg>
<p class="k">● PRD case study</p><h1>Driver<br/><span>Safety</span></h1>
<p class="sub">Many signals, one answer: which driver to look at first.</p>
<div class="tag"><span>VinFast</span><span>SM Green</span></div>`,

  /* 4 — Tata Power contracts: light, editorial. A month as a grid, the days
     so far filled: "part of a month, compared with all of it". */
  "tata-power-contracts": `<style>${BASE}
body{background:#f2efe7;color:#111}
h1{position:absolute;left:96px;top:300px;font-size:150px;line-height:.9;font-weight:800;letter-spacing:-.055em}
h1 span{color:#2350d9}
.k{position:absolute;left:100px;top:200px;color:#2350d9}
.sub{position:absolute;left:100px;top:620px;width:560px;font-size:34px;line-height:1.35;color:#3d3b36}
.cal{position:absolute;left:880px;top:150px;width:640px;padding:44px;background:#fff;border:2px solid #111;box-shadow:24px 24px 0 #111}
.cal h3{font-family:"Geist Mono",monospace;font-size:22px;letter-spacing:.2em;text-transform:uppercase;display:flex;justify-content:space-between;margin-bottom:26px}
.cal h3 span{color:#2350d9}
.g{display:grid;grid-template-columns:repeat(7,1fr);gap:10px}
.g i{aspect-ratio:1;border:2px solid #111;display:grid;place-items:center;font-style:normal;font:500 18px "Geist Mono";}
.g i.on{background:#2350d9;border-color:#2350d9;color:#fff}
.g i.x{border-style:dashed;border-color:#b9b4a8;color:#b9b4a8}
.eq{margin-top:30px;display:flex;align-items:baseline;gap:18px;font-size:40px;font-weight:800;letter-spacing:-.03em}
.eq em{font-style:normal;color:#2350d9}
.eq s{color:#b9b4a8}
.client{position:absolute;left:100px;top:780px;font-family:"Geist Mono",monospace;font-size:22px;letter-spacing:.18em;text-transform:uppercase;border-top:2px solid #111;padding-top:18px;width:640px}
</style>
<div class="cal"><h3>Contract month <span>To date</span></h3>
<div class="g">${Array.from({ length: 30 }, (_, i) => `<i class="${i < 17 ? "on" : "x"}">${i + 1}</i>`).join("")}</div>
<p class="eq"><em>17 days</em> vs <s>30 days</s></p></div>
<p class="k">● Product design case study</p><h1>Contract<br/><span>dashboard</span></h1>
<p class="sub">When "under-used" was really "the month isn't over".</p>
<p class="client">Tata Power · Mappls Insight</p>`,
};

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1616, height: 1264 } });
for (const [slug, body] of Object.entries(covers)) {
  const f = path.join(here, `shots/case/${slug}/cover.html`);
  fs.writeFileSync(f, `<!doctype html><html><head><meta charset="utf-8"/>${FONTS}</head><body>${body}</body></html>`);
  await p.goto(pathToFileURL(f).href, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(here, `shots/case/${slug}/cover.png`) });
  fs.unlinkSync(f);
  console.log(slug);
}
await b.close();
