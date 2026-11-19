// Behance case studies for the company products (2026-11-19). Ali, mid-
// publish: "no ui to be shown, no mentioning the exact features, as it's the
// company's". So: problem, approach, ownership, measured results and the
// learning. No screens, schematics or wireframes; no feature lists. The
// hero art is an abstract orbit. Facts from PROFILE.md / missions.ts.
//
//   node tools/figma-plugin/case-boards.mjs            → case-<slug>.html
//   node tools/figma-plugin/behance-boards-render.mjs case-<slug>.html shots/case/<slug>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = "aliazamkazmi.vercel.app";

/* ── shared look ───────────────────────────────────────────────────────── */
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const starShadow = (n, w, h) =>
  Array.from({ length: n }, () => {
    const a = (0.25 + rnd() * 0.6).toFixed(2);
    return `${Math.round(rnd() * w)}px ${Math.round(rnd() * h)}px 0 ${rnd() < 0.12 ? 1 : 0}px rgba(220,240,232,${a})`;
  }).join(",");

const CSS = `
* { box-sizing:border-box; margin:0; padding:0; }
:root { --ink:#060606; --panel:#0d0d0d; --raised:#151515; --em:#3cdd9e; --mint:#8af0c8; --deep:#0f3b2e; --amber:#e8a34a; --t1:#f2f5f8; --t2:#a3a8ad; --t3:#7f7f7f; --line:rgba(190,230,215,.14); --line2:rgba(190,230,215,.26); }
body { background:#000; color:var(--t1); font-family:"Geist",system-ui,sans-serif; width:1920px; }
.b { position:relative; width:1920px; overflow:hidden; background:var(--ink); padding:150px 120px; }
.b > * { position:relative; }
.sky { position:absolute !important; inset:0; pointer-events:none; }
.sky i { position:absolute; left:0; top:0; width:1px; height:1px; }
.num { font-family:"Geist Mono",monospace; font-size:20px; letter-spacing:.2em; text-transform:uppercase; color:var(--t3); }
.num b { color:var(--em); font-weight:500; margin-right:14px; }
.kick { font-family:"Geist Mono",monospace; font-size:21px; letter-spacing:.2em; text-transform:uppercase; color:var(--em); display:flex; align-items:center; gap:14px; }
.kick i { width:11px; height:11px; border-radius:50%; background:var(--em); box-shadow:0 0 18px var(--em); }
h2 { font-size:84px; line-height:.98; font-weight:700; letter-spacing:-.045em; margin-top:30px; max-width:1500px; }
h2 em, h1 em { font-style:normal; color:var(--em); }
.lede { font-size:29px; line-height:1.45; color:#c9cfd4; margin-top:30px; max-width:1060px; }
.small { font-family:"Geist Mono",monospace; font-size:17px; letter-spacing:.16em; text-transform:uppercase; color:var(--t3); }
.model { margin-top:44px; font-family:"Geist Mono",monospace; font-size:17px; letter-spacing:.14em; text-transform:uppercase; color:var(--t3); display:flex; gap:14px; align-items:center; }
.model::before { content:""; width:26px; border-top:1px dashed var(--t3); }

/* hero */
.hero { height:1240px; padding:0; background:radial-gradient(900px 700px at 74% 52%, rgba(60,221,158,.14), transparent 70%), var(--ink); }
.hero .top { position:absolute; left:120px; right:120px; top:100px; display:flex; justify-content:space-between; }
.hero h1 { position:absolute; left:112px; top:230px; width:900px; font-size:150px; line-height:.9; font-weight:800; letter-spacing:-.055em; }
.hero .sub { position:absolute; left:120px; top:640px; width:780px; font-size:31px; line-height:1.42; color:#d2d7db; }
.hero .art { position:absolute; right:110px; top:150px; width:820px; height:900px; display:grid; place-items:center; }
.hero .meta { position:absolute; left:120px; right:120px; bottom:96px; display:grid; grid-template-columns:repeat(4,1fr); border-top:1px solid var(--line); }
.hero .meta div { padding-top:28px; padding-right:30px; }
.hero .meta small { display:block; font-family:"Geist Mono",monospace; font-size:16px; letter-spacing:.2em; text-transform:uppercase; color:var(--t3); margin-bottom:12px; }
.hero .meta strong { font-size:26px; font-weight:500; line-height:1.3; }

/* overview */
.ov { display:grid; grid-template-columns:1.15fr 1fr; gap:130px; }
.ov dl { margin-top:56px; display:grid; gap:34px; }
.ov dt { font-family:"Geist Mono",monospace; font-size:17px; letter-spacing:.2em; text-transform:uppercase; color:var(--em); margin-bottom:10px; }
.ov dd { font-size:26px; line-height:1.5; color:#c9cfd4; }
.stats { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--line); border:1px solid var(--line); }
.stats div { background:var(--ink); padding:40px 36px; }
.stats strong { display:block; font-size:78px; font-weight:700; letter-spacing:-.04em; color:var(--em); line-height:1; }
.stats strong.w { font-size:44px; line-height:1.1; color:var(--t1); }
.stats span { display:block; margin-top:14px; font-size:21px; color:var(--t2); }
.credits { margin-top:60px; display:grid; grid-template-columns:auto 1fr; gap:20px 40px; font-size:23px; line-height:1.4; }
.credits dt { font-family:"Geist Mono",monospace; font-size:16px; letter-spacing:.2em; text-transform:uppercase; color:var(--t3); padding-top:5px; }

/* features */
.feat { margin-top:90px; display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid var(--line2); border-left:1px solid var(--line2); }
.feat li { list-style:none; border-right:1px solid var(--line2); border-bottom:1px solid var(--line2); padding:44px 40px 40px; min-height:330px; display:flex; flex-direction:column; gap:16px; }
.feat .i { font-family:"Geist Mono",monospace; font-size:18px; letter-spacing:.16em; color:var(--em); }
.feat h3 { font-size:36px; font-weight:600; letter-spacing:-.02em; }
.feat p { font-size:22px; line-height:1.5; color:var(--t2); flex:1; }
.feat .tag { align-self:flex-start; font-family:"Geist Mono",monospace; font-size:15px; letter-spacing:.14em; text-transform:uppercase; color:var(--t3); border:1px solid var(--line2); padding:6px 10px; }

/* diagram frame */
.dg { margin-top:80px; border:1px solid var(--line2); padding:64px; background:linear-gradient(180deg,rgba(60,221,158,.04),transparent 60%); }
.dg .cap { margin-top:46px; font-size:22px; line-height:1.5; color:var(--t3); max-width:1200px; }

/* flow */
.flow { display:grid; gap:90px; }
.fcol { position:relative; display:flex; flex-direction:column; gap:16px; }
.fcol:not(:last-child)::after { content:""; position:absolute; top:50%; right:-78px; width:66px; border-top:2px solid rgba(60,221,158,.55); }
.fcol:not(:last-child)::before { content:""; position:absolute; top:calc(50% - 8px); right:-80px; border:8px solid transparent; border-left:12px solid var(--em); border-right:0; }
.fcol > p { font-family:"Geist Mono",monospace; font-size:17px; letter-spacing:.18em; text-transform:uppercase; color:var(--t3); margin-bottom:6px; }
.fcol > p b { color:var(--em); font-weight:500; margin-right:10px; }
.node { border:1px solid var(--line2); border-left:3px solid rgba(60,221,158,.6); background:var(--panel); padding:22px 26px; }
.node strong { display:block; font-size:25px; font-weight:500; line-height:1.3; }
.node span { display:block; margin-top:6px; font-family:"Geist Mono",monospace; font-size:16px; letter-spacing:.06em; color:var(--t3); }

/* bands */
.unit { font-family:"Geist Mono",monospace; font-size:17px; letter-spacing:.16em; text-transform:uppercase; color:var(--t3); margin-bottom:22px; }
.track { display:flex; gap:4px; height:200px; }
.band { flex-basis:0; min-width:0; border-top:4px solid currentColor; padding:22px 24px; display:flex; flex-direction:column; justify-content:flex-end; gap:8px; }
.band strong { font-size:30px; font-weight:600; letter-spacing:-.01em; }
.band span { font-family:"Geist Mono",monospace; font-size:17px; letter-spacing:.08em; color:var(--t2); }
.band.ok { color:var(--em); background:rgba(60,221,158,.13); }
.band.low { color:var(--mint); background:rgba(138,240,200,.05); }
.band.high { color:var(--amber); background:rgba(232,163,74,.12); }
.band.idle { color:var(--t3); background:rgba(127,127,127,.09); }
.band strong, .band span { color:inherit; }
.band span { opacity:.8; }
.ticks { display:flex; gap:4px; margin-top:16px; }
.ticks > span { flex-basis:0; min-width:0; display:flex; justify-content:space-between; font-family:"Geist Mono",monospace; font-size:17px; color:var(--t3); }

/* curve */
.curve { position:relative; }
.curve svg { display:block; width:100%; height:560px; overflow:visible; }
.curve .lbl { font-family:"Geist Mono",monospace; font-size:17px; letter-spacing:.14em; text-transform:uppercase; color:var(--t3); }
.spans { display:flex; border-top:1px solid var(--line2); }
.spans span { flex-basis:0; padding:20px 24px; font-size:24px; color:var(--t2); }
.spans span + span { border-left:2px dashed var(--line2); color:var(--amber); }

/* matrix */
.mx { display:grid; gap:1px; background:var(--line2); border:1px solid var(--line2); }
.mx > div { display:grid; gap:1px; }
.mx span { background:var(--ink); padding:22px 26px; display:flex; flex-wrap:wrap; gap:10px; align-content:flex-start; font-size:24px; }
.mx .h { font-family:"Geist Mono",monospace; font-size:17px; letter-spacing:.16em; text-transform:uppercase; color:var(--em); }
.mx .h.c { color:var(--t3); }
.mx .r { font-weight:600; }
.mx .e { background:repeating-linear-gradient(135deg,transparent 0 9px,rgba(190,230,215,.04) 9px 10px),var(--ink); }
.chip { border:1px solid rgba(60,221,158,.4); background:rgba(60,221,158,.07); padding:7px 14px; font-size:20px; }

/* schematic screens */
.scr { margin-top:80px; position:relative; display:flex; justify-content:center; gap:70px; }
.scr svg text { font-family:"Geist",sans-serif; }
.scr svg .m { font-family:"Geist Mono",monospace; letter-spacing:.08em; }
.pin { position:absolute; display:flex; align-items:center; gap:14px; font-family:"Geist Mono",monospace; font-size:18px; letter-spacing:.12em; text-transform:uppercase; color:var(--mint); }
.pin b { display:grid; place-items:center; width:36px; height:36px; border-radius:50%; background:var(--em); color:#04130d; font-size:17px; letter-spacing:0; flex:none; }
.pin span { background:rgba(6,6,6,.9); border:1px solid rgba(60,221,158,.35); padding:10px 16px; }
.keys { margin-top:70px; display:grid; grid-template-columns:repeat(4,1fr); gap:40px; border-top:1px solid var(--line); padding-top:40px; }
.keys div b { display:inline-grid; place-items:center; width:34px; height:34px; border-radius:50%; background:var(--em); color:#04130d; font-family:"Geist Mono",monospace; font-size:16px; margin-bottom:16px; }
.keys h4 { font-size:26px; font-weight:600; margin-bottom:8px; }
.keys p { font-size:20px; line-height:1.5; color:var(--t2); }

/* decisions */
.dec { margin-top:90px; display:grid; gap:1px; background:var(--line2); border:1px solid var(--line2); }
.dec > div { background:var(--ink); padding:48px 44px; }
.dec h3 { font-family:"Geist Mono",monospace; font-size:18px; letter-spacing:.2em; text-transform:uppercase; color:var(--em); font-weight:500; margin-bottom:30px; }
.dec li { list-style:none; font-size:25px; line-height:1.45; padding:18px 0 18px 34px; position:relative; border-top:1px solid var(--line); }
.dec li::before { content:""; position:absolute; left:2px; top:31px; width:11px; height:11px; transform:rotate(45deg); border:2px solid var(--em); }
.quote { margin-top:100px; font-size:54px; line-height:1.2; font-weight:600; letter-spacing:-.03em; max-width:1500px; }
.quote::before { content:"Learning"; display:block; font-family:"Geist Mono",monospace; font-size:18px; letter-spacing:.2em; text-transform:uppercase; color:var(--t3); font-weight:400; margin-bottom:26px; }

/* measure */
.ms { margin-top:80px; display:grid; grid-template-columns:1fr 1fr; gap:80px; }
.ms li { list-style:none; font-size:27px; line-height:1.4; padding:24px 0 24px 64px; position:relative; border-top:1px solid var(--line); }
.ms li::before { content:""; position:absolute; left:0; top:24px; width:32px; height:32px; border:2px solid var(--line2); }
.rec { border:1px solid var(--line2); padding:44px; }
.rec dl { display:grid; grid-template-columns:auto 1fr; gap:22px 40px; margin-top:30px; font-size:26px; }
.rec dt { font-family:"Geist Mono",monospace; font-size:16px; letter-spacing:.2em; text-transform:uppercase; color:var(--t3); padding-top:6px; }
.rec dd strong { color:var(--em); font-size:48px; font-weight:700; letter-spacing:-.03em; }

/* outro */
.out { height:900px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; background:radial-gradient(900px 500px at 50% 55%, rgba(60,221,158,.12), transparent 70%), var(--ink); }
.out h2 { font-size:110px; margin:30px 0; }
.out .btn { margin-top:50px; display:inline-flex; gap:18px; }
.out .btn span { font-family:"Geist Mono",monospace; font-size:23px; letter-spacing:.14em; padding:22px 34px; border:1.5px solid rgba(190,230,215,.4); }
.out .btn span.p { background:var(--em); color:#04130d; border-color:var(--em); }
`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const sky = (h, n = 260) => `<div class="sky"><i style="box-shadow:${starShadow(n, 1920, h)}"></i></div>`;

/* ── abstract hero art: an orbit, never a screen ───────────────────────── */
function orbitArt(k) {
  seed = 11 + k * 7;
  const C = 410, rings = [150, 235, 320, 395];
  let s = `<svg width="820" height="820" viewBox="0 0 820 820">
  <defs><radialGradient id="core" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffe2a8"/><stop offset=".35" stop-color="#e8a34a"/><stop offset="1" stop-color="#e8a34a" stop-opacity="0"/></radialGradient>
  <radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#3cdd9e" stop-opacity=".22"/><stop offset="1" stop-color="#3cdd9e" stop-opacity="0"/></radialGradient></defs>
  <circle cx="${C}" cy="${C}" r="400" fill="url(#halo)"/>`;
  rings.forEach((r, i) => {
    const tilt = [-18, 12, -6, 22][(i + k) % 4];
    s += `<g transform="rotate(${tilt} ${C} ${C})"><ellipse cx="${C}" cy="${C}" rx="${r}" ry="${r * 0.42}" fill="none" stroke="rgba(60,221,158,${0.55 - i * 0.1})" stroke-width="${i === 1 ? 2 : 1.2}" ${i % 2 ? 'stroke-dasharray="6 10"' : ""}/>`;
    const n = 2 + ((i + k) % 3);
    for (let j = 0; j < n; j++) {
      const a = rnd() * Math.PI * 2;
      const x = C + Math.cos(a) * r, y = C + Math.sin(a) * r * 0.42;
      const c = j === 0 && i === 2 ? "#e8a34a" : "#8af0c8";
      s += `<circle cx="${x}" cy="${y}" r="${14 + rnd() * 6}" fill="${c}" opacity=".14"/><circle cx="${x}" cy="${y}" r="${4 + rnd() * 4}" fill="${c}"/>`;
    }
    s += `</g>`;
  });
  s += `<circle cx="${C}" cy="${C}" r="120" fill="url(#core)"/><circle cx="${C}" cy="${C}" r="34" fill="#fff2d6"/></svg>`;
  return s;
}

/* ── per-project look (2026-11-19, Ali: "the case studies look too same").
   Each set of boards wears its cover's palette and opens on its cover's art:
   Intouch green with its public store screens, Indane saffron→navy with its
   store screens, Driver Safety hazard-yellow on black, the Tata Power
   dashboard light and blue. Store screenshots are the PUBLIC Google Play
   marketing images, used with Ali's go-ahead. ───────────────────────────── */
const STORE = "shots/case/store/";
const tile = (src, css, w = 400) =>
  `<div style="position:absolute;width:${w}px;border-radius:30px;overflow:hidden;box-shadow:0 50px 90px rgba(0,0,0,.55),0 0 0 2px rgba(255,255,255,.08);${css}"><img src="${STORE}${src}" style="display:block;width:100%"></div>`;
const THEMES = {
  intouch: {
    vars: "--ink:#04241c;--panel:#06302a;--raised:#0a3a31;--em:#33d6a0;--mint:#7ff0c9;--t2:#a9d6c6;--t3:#79a898;--line:rgba(127,240,201,.16);--line2:rgba(127,240,201,.3);--lede:#bfe9da;--onEm:#03241b;--emA:rgba(51,214,160,.5);",
    hero: "radial-gradient(1000px 900px at 74% 45%,#0f6b52 0%,#06382b 50%,#04241c 100%)",
    art: () => `<div style="position:absolute;inset:0">${tile("intouch-2.png", "left:20px;top:150px;transform:rotate(-9deg)", 360)}${tile("intouch-3.png", "left:430px;top:120px;transform:rotate(8deg)", 360)}${tile("intouch-1.png", "left:210px;top:40px;transform:rotate(-1deg);z-index:2", 400)}</div>`,
  },
  "indane-yatra-mitra": {
    vars: "--ink:#151b45;--panel:#1b2254;--raised:#222a60;--em:#ff8a2a;--mint:#ffc999;--t2:#c4c3d8;--t3:#9493b0;--line:rgba(255,201,153,.16);--line2:rgba(255,201,153,.3);--lede:#e3e1ef;--onEm:#2a1205;--emA:rgba(255,138,42,.5);",
    hero: "linear-gradient(160deg,#f07a1a 0%,#c4531c 34%,#4a2f4a 66%,#16204f 100%)",
    extra: ".hero h1 em, .out h2 em { color:#ffe1c2; } .hero .kick, .out .kick { color:#fff; } .hero .kick i, .out .kick i { background:#fff; box-shadow:0 0 18px #fff; }",
    art: () => `<div style="position:absolute;inset:0;transform:rotate(9deg)">${tile("iym-1.png", "left:60px;top:10px", 250)}${tile("iym-3.png", "left:340px;top:-30px", 250)}${tile("iym-4.png", "left:200px;top:450px", 250)}${tile("iym-2.png", "left:480px;top:410px", 250)}</div>`,
  },
  "driver-safety": {
    vars: "--ink:#0b0b0a;--panel:#141412;--raised:#1b1b18;--em:#ffc531;--mint:#ffe08a;--t2:#bdbab0;--t3:#8f8b80;--line:rgba(255,197,49,.14);--line2:rgba(255,197,49,.28);--lede:#d9d6cc;--onEm:#1a1400;--emA:rgba(255,197,49,.5);",
    hero: "#0b0b0a",
    stripe: true,
    art: () => {
      const P = [300, 450];
      let s = `<svg width="820" height="900" viewBox="0 0 820 900"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffc531" stop-opacity=".5"/><stop offset="1" stop-color="#ffc531" stop-opacity="0"/></radialGradient></defs><circle cx="${P[0]}" cy="${P[1]}" r="250" fill="url(#g)"/>`;
      for (let i = 0; i < 22; i++) {
        const y = 20 + i * 41, hot = i % 5 === 0, c = hot ? "#ffc531" : "rgba(255,255,255,.28)";
        s += `<path d="M820 ${y} C 620 ${y}, 520 ${P[1] + (y - P[1]) * 0.3}, ${P[0]} ${P[1]}" fill="none" stroke="${c}" stroke-width="${hot ? 3 : 1.5}"/><circle cx="${780 - (i % 3) * 36}" cy="${y}" r="${hot ? 8 : 5}" fill="${c}"/>`;
      }
      return s + `<circle cx="${P[0]}" cy="${P[1]}" r="46" fill="#0b0b0a" stroke="#ffc531" stroke-width="6"/><circle cx="${P[0]}" cy="${P[1]}" r="18" fill="#ffc531"/><text x="${P[0] - 270}" y="${P[1] + 8}" fill="#ffc531" style="font:500 22px 'Geist Mono';letter-spacing:.2em">ONE DECISION</text></svg>`;
    },
  },
  "tata-power-contracts": {
    vars: "--ink:#f2efe7;--panel:#ffffff;--raised:#ffffff;--em:#2350d9;--mint:#2350d9;--t1:#111111;--t2:#4a4740;--t3:#7a756a;--line:rgba(17,17,17,.14);--line2:rgba(17,17,17,.3);--lede:#3d3b36;--onEm:#ffffff;--emA:rgba(35,80,217,.5);",
    hero: "#f2efe7",
    light: true,
    art: () =>
      `<div style="position:absolute;left:60px;top:120px;width:660px;padding:44px;background:#fff;border:2px solid #111;box-shadow:24px 24px 0 #111;color:#111">
      <p style="font:500 22px 'Geist Mono';letter-spacing:.2em;text-transform:uppercase;display:flex;justify-content:space-between;margin-bottom:26px">Contract month <span style="color:#2350d9">To date</span></p>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:10px">${Array.from({ length: 30 }, (_, i) => `<i style="aspect-ratio:1;border:2px ${i < 17 ? "solid #2350d9;background:#2350d9;color:#fff" : "dashed #b9b4a8;color:#b9b4a8"};display:grid;place-items:center;font:500 18px 'Geist Mono';font-style:normal">${i + 1}</i>`).join("")}</div>
      <p style="margin-top:30px;font-size:40px;font-weight:800;letter-spacing:-.03em"><span style="color:#2350d9">17 days</span> vs <s style="color:#b9b4a8">30 days</s></p></div>`,
  },
};
const themeCSS = (t) => `
:root { ${t.vars} }
body { background:var(--ink); }
.lede, .ov dd { color:var(--lede); }
.hero .sub { color:var(--lede); }
.hero { background:${t.hero}; }
.out { background:${t.light ? "#ebe7dc" : t.hero}; }
.proc::before { border-top-color:var(--emA); }
.out .btn span { border-color:var(--line2); }
.out .btn span.p, .keys div b { color:var(--onEm); }
.kick i { box-shadow:0 0 18px var(--em); }
${t.light ? ".sky { display:none; } .out .btn span.p { color:#fff; } .stats strong.w { color:var(--t1); }" : ""}
${t.extra || ""}
${t.stripe ? ".stripe { position:absolute !important; left:0; right:0; top:0; height:22px; background:repeating-linear-gradient(-45deg,#ffc531 0 26px,#0b0b0a 26px 52px); z-index:3; }" : ".stripe { display:none; }"}
`;

const CSS2 = `
.proc { margin-top:90px; display:grid; grid-template-columns:repeat(4,1fr); gap:28px; position:relative; }
.proc::before { content:""; position:absolute; left:24px; right:24px; top:24px; border-top:2px dashed rgba(60,221,158,.45); }
.proc .dot { position:relative; width:48px; height:48px; transform:rotate(45deg); border:2px solid var(--em); background:var(--ink); margin-bottom:40px; }
.proc div:first-child .dot { background:var(--em); box-shadow:0 0 30px var(--em); }
.proc small { font-family:"Geist Mono",monospace; font-size:17px; letter-spacing:.2em; color:var(--t3); }
.proc h3 { font-size:38px; font-weight:600; letter-spacing:-.02em; margin:10px 0 14px; }
.proc p { font-size:23px; line-height:1.5; color:var(--t2); }
`;

/* ── the four projects: problem, approach, ownership, results. No screens,
   no feature lists (Ali, 2026-11-19: "no ui to be shown, no mentioning the
   exact features, as it's the company's"). ─────────────────────────────── */
const projects = [
  {
    slug: "intouch",
    kick: "Product · Mobile · Fleet SaaS",
    tag: "Product case study",
    h1: "Mappls<br/><em>Intouch</em>",
    sub: "A cross-platform fleet app for logistics teams. Built for ten thousand vehicles and architected for fifty thousand, because the second number is the one that arrives without warning.",
    meta: [["Role", "Product owner · Frontend · UI/UX"], ["Company", "MapMyIndia [Gtropy]"], ["Platform", "Android · iOS"], ["Status", "Live on Google Play"]],
    overview: {
      title: "Design for the fleet <em>you'll have next</em>",
      lede: "Logistics teams run on their phones. The app had to hold up under constant live data on Android and iOS, and it had to be built for a fleet larger than the one it launched with.",
      rows: [
        ["Problem", "Optimising for the fleet you have today produces an app that breaks on the fleet you have next quarter."],
        ["Discovery", "How operators actually work shaped the product more than any dashboard request did."],
        ["Approach", "Make the scale decision before the first screen, then ship in stages, each proven at production load before the next began."],
      ],
      stats: [["10,000+", "active vehicles in production"], ["50,000", "designed headroom"], ["1K+", "Google Play installs (listing, Nov 2026)"], ["3", "enterprise client deployments"]],
      credits: [["Role", "Product owner · Frontend · UI/UX"], ["Owner", "Since the July 2026 promotion"], ["Clients", "VinFast · SM Green · Toyota Logistics"]],
    },
    process: [
      ["Discovery", "Watched how operators really use a fleet app, rather than building the dashboard they asked for."],
      ["Decision", "Headroom for five times the launch fleet, decided before the first screen, not after the first outage."],
      ["Delivery", "Shipped in stages; each one held at 10,000 live vehicles before the next began."],
      ["Ownership", "Product owner since July 2026, including modules built for enterprise customers."],
    ],
    decisions: {
      decided: ["Product owner of Mappls Intouch since the July 2026 promotion", "Scale headroom as a launch requirement, not a later fix", "The PRD for an enterprise client module (v1.0, Oct 2026)"],
      built: ["The app's frontend and UI/UX across Android and iOS", "Client modules for VinFast, SM Green and Toyota Logistics"],
    },
    learning: "Designing for the fleet you will have is cheaper than it sounds, provided the decision is made before the first screen, not after the first outage.",
    listing: [["Where", "Google Play · Mappls Intouch"], ["Installs", "<strong>1K+</strong>"], ["Updated", "12 May 2026"], ["Read", "16 Nov 2026"]],
  },
  {
    slug: "driver-safety",
    kick: "Product · PRD · Telematics",
    tag: "PRD case study",
    h1: "Driver<br/><em>Safety</em>",
    sub: "A fleet manager doesn't need more dashboards. They need to know which driver to look at first, and why. A safety module for enterprise fleets at VinFast and SM Green.",
    meta: [["Role", "PRD owner · UX · Frontend"], ["Company", "MapMyIndia [Gtropy]"], ["Clients", "VinFast · SM Green"], ["Status", "In build"]],
    overview: {
      title: "From many signals <em>to one decision</em>",
      lede: "Video telematics produces far more alerts than any manager can read. The product had grown around its data sources, and none of its pages answered the question a manager actually has.",
      rows: [
        ["Discovery", "How a product is sold is not how its users think. The useful structure was the manager's question, not the data's source."],
        ["Problem", "Several similar-sounding measures competing for attention, and no clear answer to who needs attention this week."],
        ["Approach", "One clear answer first, fair comparisons between drivers, and the customer in control of what counts."],
      ],
      stats: [["11", "design iterations of the prototype"], ["v1.0", "PRD, signed off 13 Oct 2026"], ["2", "enterprise clients"], ["In build", "with engineering and QA"]],
      credits: [["Role", "PRD owner · UX · Frontend"], ["With", "Backend, frontend and QA on delivery"], ["Clients", "VinFast · SM Green"]],
    },
    process: [
      ["Discovery", "Mapped how managers decide who to talk to, against how the product was organised."],
      ["Scope", "Cut on purpose: the product reports, the customer's own team decides what to do about it."],
      ["PRD", "Scope, rules and success measures in one document, agreed with engineering."],
      ["Prototype", "A clickable prototype through 11 iterations before a line of production code."],
    ],
    decisions: {
      decided: ["Driver-first: who needs attention comes before anything else", "Data only: no coaching programme, no review workflow", "Fair comparison: drivers judged on how much they drive, never raw counts", "The customer chooses what counts for their fleet"],
      built: ["PRD v1.0 (13 Oct 2026)", "The clickable prototype, 11 iterations", "The module's frontend in Mappls Intouch"],
      withTeam: ["The API contract with backend", "Delivery with frontend and QA"],
    },
    learning: "A name is a product decision. Measures that sound alike cost more support tickets than any missing feature.",
    measure: ["Time for a manager to find the driver who needs attention", "Weekly adoption by enterprise accounts", "Customers who tailor the module to their fleet", "Support tickets that question a result"],
  },
  {
    slug: "indane-yatra-mitra",
    kick: "Product · Mobile · Safety",
    tag: "Product case study",
    h1: "Indane<br/><em>Yatra Mitra</em>",
    sub: "A tracking product for IOCL's LPG tanker fleet. When the cargo is LPG, a tracking product stops being a logistics tool and starts being a safety one.",
    meta: [["Role", "Product owner · Frontend · UI/UX"], ["Company", "MapMyIndia [Gtropy] · for IOCL"], ["Platform", "Android"], ["Status", "Live on Google Play"]],
    overview: {
      title: "The roles <em>were the product</em>",
      lede: "Different people answer for different parts of the same fleet. Giving everyone everything would have been both a usability failure and a security one.",
      rows: [
        ["Hypothesis", "If access follows accountability (you see what you answer for), the app is simpler for every user and safer for the operator."],
        ["Approach", "Accountability modelled from the start, not bolted on after the rest was built."],
        ["Priority", "Safety before convenience: the safety-critical path shipped first, administration last."],
      ],
      stats: [["4.5★", "Google Play rating, from 12 reviews"], ["1K+", "installs (listing, Nov 2026)"], ["Live", "in IOCL tanker operations"], ["Owner", "since the July 2026 promotion"]],
      credits: [["Role", "Product owner · Frontend · UI/UX"], ["Client", "Indian Oil (IOCL)"], ["Owner", "Since the July 2026 promotion"]],
    },
    process: [
      ["Discovery", "Mapped who answers for which part of the fleet, and what each of them needs to know."],
      ["Decision", "Access modelled on accountability from day one."],
      ["Delivery", "The safety-critical path first; everything else after it."],
      ["Ownership", "Product owner since July 2026."],
    ],
    decisions: {
      decided: ["Product owner of Indane Yatra Mitra since the July 2026 promotion", "Accountability as a first-class concept, not bolted on", "Safety before convenience in the build order"],
      built: ["The app's frontend and UI/UX", "Interfaces where the safe action is the obvious one"],
    },
    learning: "When the cargo is hazardous, a warning that is easy to dismiss is a design flaw. The interface has to make the safe action the obvious one.",
    listing: [["Where", "Google Play · Indane Yatra Mitra"], ["Rating", "<strong>4.5★</strong> &nbsp;from 12 reviews"], ["Installs", "<strong>1K+</strong>"], ["Read", "16 Nov 2026"]],
  },
  {
    slug: "tata-power-contracts",
    kick: "Product design · B2B · Prototype",
    tag: "Product design case study",
    h1: "Contract<br/><em>dashboard</em>",
    sub: "A contract dashboard for Tata Power's vehicle fleet. The old view compared part of a month with all of it, and called almost every vehicle under-used for most of the month.",
    meta: [["Role", "Product design · UX · Prototype"], ["Company", "MapMyIndia [Gtropy]"], ["Client", "Tata Power"], ["Status", "In client review"]],
    overview: {
      title: "A wrong denominator <em>is a UX bug</em>",
      lede: "Contract managers approve vendor bills. They need to know, on any day of the month, which vehicles and vendors are drifting from their contracts.",
      rows: [
        ["Discovery", "The existing view compared figures that were still running with totals that were not, so the picture was wrong for most of every month."],
        ["Problem", "Make every figure correct on any day, for any period, without the user having to know what is still running."],
        ["Approach", "Compare like with like, say plainly when a figure is still running, and keep the scope to the two jobs the client asked for."],
      ],
      stats: [["Tata Power", "client, on Mappls Insight"], ["In review", "working prototype, revised with the client"]],
      credits: [["Role", "Product design · UX · built the working prototype"], ["Client", "Tata Power"]],
    },
    process: [
      ["Discovery", "Traced every misleading number back to the one comparison behind it."],
      ["Scope", "Two jobs, done well; billing split into its own deliverable."],
      ["Prototype", "A working prototype the client could open anywhere, revised round by round."],
      ["Review", "Walked through with the client; in review now."],
    ],
    decisions: {
      decided: ["Billing as a separate deliverable, not a third tab", "Use over price: the question was drift from the contract", "Compare like with like in every view", "Status colours kept apart from the brand colour"],
      built: ["The working prototype", "Each round of client changes and the walkthrough"],
    },
    learning: "Every chart was correct arithmetic on the wrong comparison until the period was made explicit.",
    measure: ["Client sign-off on the calculation logic", "Whether the thresholds match how the business judges a vehicle", "What the client keeps, and drops, after using it"],
  },
];

function build(p, k) {
  let n = 0;
  const step = () => String(++n).padStart(2, "0");
  const parts = [];
  const t = THEMES[p.slug];
  parts.push(`<section class="b hero" id="b01">${sky(1240, 340)}<div class="stripe"></div>
    <div class="top"><p class="kick"><i></i>${p.kick}</p><p class="kick" style="color:var(--t2)">${p.tag}</p></div>
    <h1>${p.h1}</h1><p class="sub">${esc(p.sub)}</p>
    <div class="art">${t.art()}</div>
    <div class="meta">${p.meta.map(([a, v]) => `<div><small>${a}</small><strong>${esc(v)}</strong></div>`).join("")}</div></section>`);
  const o = p.overview;
  parts.push(`<section class="b" id="b02">${sky(1300, 160)}<div class="ov"><div>
    <p class="num"><b>${step()}</b>Overview</p><h2>${o.title}</h2><p class="lede">${esc(o.lede)}</p>
    <dl>${o.rows.map(([a, v]) => `<div><dt>${a}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></div>
    <div style="padding-top:60px"><div class="stats">${o.stats.map(([v, l]) => `<div><strong${v.length > 6 ? ' class="w"' : ""}>${v}</strong><span>${esc(l)}</span></div>`).join("")}</div>
    <dl class="credits">${o.credits.map(([a, v]) => `<dt>${a}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div></div></section>`);
  parts.push(`<section class="b" id="b03">${sky(1100, 160)}<p class="num"><b>${step()}</b>How I worked</p>
    <h2>From the question <em>to the product</em></h2>
    <div class="proc">${p.process.map(([h, t], i) => `<div><div class="dot"></div><small>${String(i + 1).padStart(2, "0")}</small><h3>${esc(h)}</h3><p>${esc(t)}</p></div>`).join("")}</div></section>`);
  const dc = p.decisions;
  const cols = [["I decided", dc.decided], ["I built", dc.built], ["With the team", dc.withTeam]].filter(([, v]) => v);
  parts.push(`<section class="b" id="b04">${sky(1400, 160)}<p class="num"><b>${step()}</b>Ownership</p><h2>Who did <em>what</em></h2>
    <div class="dec" style="grid-template-columns:repeat(${cols.length},1fr)">${cols.map(([h, v]) => `<div><h3>${h}</h3><ul>${v.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>`).join("")}</div>
    <p class="quote">${esc(p.learning)}</p></section>`);
  parts.push(`<section class="b" id="b05">${sky(1200, 140)}<p class="num"><b>${step()}</b>Results</p>
    <h2>${p.listing && p.measure ? "The public record, <em>and what's next</em>" : p.listing ? "The public record, <em>as it reads</em>" : "Nothing measured yet, <em>so nothing claimed</em>"}</h2>
    <div class="ms">${p.measure ? `<div><p class="small" style="margin-bottom:24px">What will be measured</p><ul>${p.measure.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>` : ""}
    ${p.listing ? `<div class="rec"><p class="small" style="color:var(--em)">Store listing, as it reads</p><dl>${p.listing.map(([a, v]) => `<dt>${a}</dt><dd>${v}</dd>`).join("")}</dl><p class="small" style="margin-top:34px;letter-spacing:.1em;line-height:1.6">The listing's own numbers, not an outcome claimed here. Store counts change.</p></div>` : ""}</div></section>`);
  parts.push(`<section class="b out" id="b99">${sky(900, 220)}<div class="stripe"></div><p class="kick"><i></i>More work</p>
    <h2>${p.h1.replace("<br/>", " ")}</h2><p class="lede" style="margin-top:0">The rest of the work, and how I think about product, on the portfolio.</p>
    <div class="btn"><span class="p">${SITE}</span><span>Ali Azam Kazmi</span></div></section>`);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>${p.slug} boards</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>${CSS}${CSS2}${themeCSS(t)}</style></head><body>${parts.join("\n")}</body></html>`;
}

projects.forEach((p, k) => {
  seed = 7;
  fs.writeFileSync(path.join(here, `case-${p.slug}.html`), build(p, k));
  console.log(`case-${p.slug}.html`);
});
