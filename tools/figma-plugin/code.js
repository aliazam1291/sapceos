// Space OS — portfolio screens builder (2026-11-18).
//
// Run once inside the Figma file "Ali Azam Kazmi — Portfolio (Space OS)":
// Figma desktop → Plugins → Development → Import plugin from manifest… →
// pick tools/figma-plugin/manifest.json → run it from the same menu.
//
// It builds, from the components, variables and text styles already on the
// "Design system" page: six desktop screens (1440) and six phone screens
// (375) on "Screens", and the cover + read-me on "Cover & Read me" (the cover
// is also set as the file's Community thumbnail). Every word is the live
// site's copy; every number is one the site shows. Running it again removes
// what it built before and rebuilds, so it is safe to re-run after edits.

const IMG = {
  galaxy: "1ebc8f201232ae1bfeb29cb36c94aeb2e744a447",
  blackhole: "758f21238fc8676729cd5ef5ec9ccd72a3aeec28",
  landing: "463690d6bd4ddc3238ce118bc87907ddea31375f",
  avatar: "9d37c0d272b71986e0bfe173de89993f617206ad",
  portrait: "e7cc3a7daf1a181b1fb5af810fffb34ce7d8d55b",
  vahan: "789aa7fc545c1c0237d3f0ac20ba36b5e200bfb0",
  intouch: "b201d5bcf6db79d206cba13f722246bd9e9caa76",
  locate: "2d1c5931a52d6525db26394860cb7d762d0c7b8e",
  tower: "f2c1bfe36ae6a9cad0891959f77aec3affdc09cd",
};
// Nodes left by the asset upload and the first, partial Home build.
const STALE = ["5:2", "5:3", "5:4", "5:5", "5:6", "5:7", "5:8", "5:9", "5:10", "7:2"];
const BUILT = "space-os-built";

let V = {}, TS = {}, C = {};
let MODE = "desk";
const PHONE_SIZE = { "Display/Name": 44, "Title/Page": 36, "Title/Section": 28, "Title/Medium": 20, "Body/Large": 17, "Mono/Value": 24 };

// ── helpers ────────────────────────────────────────────────────────────────
function paint(name, o) {
  return figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: o === undefined ? 1 : o }, "color", V[name]);
}
function al(dir, props) {
  const f = figma.createFrame();
  f.layoutMode = dir; f.primaryAxisSizingMode = "AUTO"; f.counterAxisSizingMode = "AUTO"; f.fills = [];
  if (props) Object.assign(f, props);
  return f;
}
async function txt(chars, style, color, name) {
  const t = figma.createText();
  await t.setTextStyleIdAsync(TS[style].id);
  t.characters = chars;
  if (MODE === "phone" && PHONE_SIZE[style]) t.fontSize = PHONE_SIZE[style];
  t.fills = [paint(color)];
  if (name) t.name = name;
  return t;
}
// Append a wrapping text block that fills its auto-layout parent.
async function para(parent, chars, style, color, name) {
  const t = await txt(chars, style, color, name);
  parent.appendChild(t);
  t.layoutSizingHorizontal = "FILL"; t.textAutoResize = "HEIGHT";
  return t;
}
function fill(parent, node) { parent.appendChild(node); node.layoutSizingHorizontal = "FILL"; return node; }
function setP(inst, map) {
  const o = {};
  for (const k of Object.keys(inst.componentProperties)) { const b = k.split("#")[0]; if (b in map) o[k] = map[b]; }
  inst.setProperties(o); return inst;
}
function btn(kind, label, arrow) { return setP(C.button.children.find(c => c.name === "Kind=" + kind).createInstance(), { Label: label, Arrow: arrow }); }
function head(label, title) { return setP(C.SectionHead.createInstance(), { Label: label, Title: title }); }
function comms(call, line) { return setP(C.Comms.createInstance(), { Stamp: "T+0.0s", Callsign: call, Line: line }); }
function img(hash, mode) { return { type: "IMAGE", imageHash: hash, scaleMode: mode || "FILL" }; }
function place(parent, node, x, y) { parent.appendChild(node); node.x = x; node.y = y; return node; }
function P() { return MODE === "desk" ? 160 : 20; }
function rowOrCol(props) { return al(MODE === "desk" ? "HORIZONTAL" : "VERTICAL", props); }
function reportRow(label, body) {
  const r = setP(C.ReportRow.createInstance(), { Label: label, Body: body });
  if (MODE === "phone") { try { r.layoutMode = "VERTICAL"; r.itemSpacing = 10; } catch (e) {} }
  return r;
}
function buttonRow(list) {
  const r = al("HORIZONTAL", { name: "Actions", itemSpacing: 12, counterAxisAlignItems: "CENTER" });
  if (MODE === "phone") { r.layoutWrap = "WRAP"; r.counterAxisSpacing = 12; }
  for (const b of list) r.appendChild(btn(b[0], b[1], b[2]));
  return r;
}
function hologram(hash, kicker, title, meta) {
  const h = setP(C.Hologram.createInstance(), { Kicker: kicker, Title: title, Meta: meta });
  const cover = h.findOne(n => n.name === "Cover (swap image)");
  if (cover) cover.fills = hash ? [Object.assign(img(hash), { filters: { saturation: -1, contrast: 0.1 } })] : [];
  return h;
}
function svgNode(svg, name) { const n = figma.createNodeFromSvg(svg); n.name = name; return n; }

// Page wrapper with the right chrome for the mode.
function screen(name, screenLabel) {
  const W = al("VERTICAL", { name: name + (MODE === "desk" ? " — Desktop 1440" : " — Phone 375"), itemSpacing: 0 });
  W.resize(MODE === "desk" ? 1440 : 375, 100); W.primaryAxisSizingMode = "AUTO";
  W.fills = [paint("color/bg/primary")]; W.clipsContent = true;
  W.setPluginData(BUILT, "1");
  if (MODE === "phone") { const top = setP(C.PhoneTopBar.createInstance(), { Screen: "At · " + screenLabel }); fill(W, top); }
  return W;
}
function finishChrome(W) {
  if (MODE === "desk") { const d = C.Dock.createInstance(); W.appendChild(d); d.layoutPositioning = "ABSOLUTE"; d.x = (1440 - d.width) / 2; d.y = 900 - d.height - 24; }
  else { const t = C.PhoneTabBar.createInstance(); W.appendChild(t); t.layoutPositioning = "ABSOLUTE"; t.x = 0; t.y = 812 - t.height; }
  const fw = al("VERTICAL", { name: "Footer", paddingLeft: P(), paddingRight: P(), paddingTop: 80, paddingBottom: MODE === "desk" ? 40 : 100 });
  fill(W, fw);
  const f = C.Footer.createInstance(); fill(fw, f);
  if (MODE === "phone") { const cols = f.findOne(n => n.name === "Columns"); if (cols) { try { cols.layoutMode = "VERTICAL"; cols.itemSpacing = 28; } catch (e) {} } }
}
async function section(W, name, label, title, opts) {
  opts = opts || {};
  const s = al("VERTICAL", { name, itemSpacing: MODE === "desk" ? 40 : 28, paddingLeft: P(), paddingRight: P(), paddingTop: MODE === "desk" ? 120 : 72, paddingBottom: opts.bottom || (MODE === "desk" ? 40 : 24) });
  fill(W, s);
  if (label) {
    const h = al(MODE === "desk" ? "HORIZONTAL" : "VERTICAL", { itemSpacing: 20, primaryAxisAlignItems: MODE === "desk" ? "SPACE_BETWEEN" : "MIN", counterAxisAlignItems: MODE === "desk" ? "MAX" : "MIN", name: "Head" });
    fill(s, h); h.appendChild(head(label, title));
    if (opts.more) h.appendChild(btn("Text", opts.more, "→"));
  }
  return s;
}
// Secondary page header: label, plain name, title, lede, actions, figure.
async function pageHeader(W, o) {
  const hd = rowOrCol({ name: "Page header", itemSpacing: MODE === "desk" ? 64 : 24, paddingLeft: P(), paddingRight: P(), paddingTop: MODE === "desk" ? 140 : 40, paddingBottom: 32, counterAxisAlignItems: MODE === "desk" ? "CENTER" : "MIN" });
  fill(W, hd);
  const copy = al("VERTICAL", { name: "Copy", itemSpacing: 18 }); fill(hd, copy);
  const crumb = al("HORIZONTAL", { itemSpacing: 12 }); crumb.appendChild(await txt(o.label, "Mono/Label", "color/accent/emerald")); crumb.appendChild(await txt(o.plain, "Mono/Label", "color/text/tertiary")); copy.appendChild(crumb);
  await para(copy, o.title, "Title/Page", "color/text/primary", "Title (h1)");
  if (o.lede) { const l = await para(copy, o.lede, "Body/Large", "color/text/secondary", "Lede"); if (MODE === "desk") { l.layoutSizingHorizontal = "FIXED"; l.resize(560, l.height); } }
  if (o.actions) copy.appendChild(buttonRow(o.actions));
  if (o.figure) { const fg = o.figure(); hd.appendChild(fg); if (MODE === "phone" && fg.width > 335) { fg.rescale(335 / fg.width); } }
  if (o.comms) { const cw = al("VERTICAL", { paddingLeft: P(), paddingRight: P(), paddingBottom: 8, name: "Page comms" }); fill(W, cw); cw.appendChild(comms("CAPCOM", o.comms)); }
}
function grid(parent, cols, gap) {
  const g = al("HORIZONTAL", { name: "Grid", itemSpacing: gap, counterAxisSpacing: gap });
  g.layoutWrap = "WRAP"; fill(parent, g);
  return { add(node) { g.appendChild(node); node.layoutSizingHorizontal = "FIXED"; const w = (g.width - gap * (cols - 1)) / cols; node.resize(w, node.height); try { node.layoutSizingVertical = "HUG"; } catch (e) {} return node; } };
}
async function readoutRow(parent, cells) {
  const r = al(MODE === "desk" ? "HORIZONTAL" : "VERTICAL", { name: "Readout", itemSpacing: MODE === "desk" ? 0 : 18 });
  if (MODE === "phone") { r.layoutMode = "HORIZONTAL"; r.layoutWrap = "WRAP"; r.counterAxisSpacing = 20; }
  cells.forEach((c, i) => {
    const inst = setP(C.ReadoutCell.createInstance(), { Discipline: c[0], Value: c[1], Note: c[2] });
    if (i === 0 || MODE === "phone") { inst.paddingLeft = MODE === "phone" ? 14 : 0; if (MODE === "desk") inst.strokes = []; }
    inst.paddingRight = 28; r.appendChild(inst);
    if (MODE === "phone") { inst.layoutSizingHorizontal = "FIXED"; inst.resize(150, inst.height); }
  });
  parent.appendChild(r); if (MODE === "phone") r.layoutSizingHorizontal = "FILL";
  return r;
}
async function tags(parent, list) {
  const t = al("HORIZONTAL", { name: "Tags", itemSpacing: 8, counterAxisSpacing: 8 }); t.layoutWrap = "WRAP"; fill(parent, t);
  for (const s of list) { const c = al("HORIZONTAL", { paddingLeft: 10, paddingRight: 10, paddingTop: 6, paddingBottom: 6 }); c.strokes = [paint("color/line/strong")]; c.appendChild(await txt(s, "Mono/Label", "color/text/secondary")); t.appendChild(c); }
}

// ── figures (editable vectors, no flattened UI) ─────────────────────────────
const PROBE_SVG = '<svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg"><g stroke="#3CDD9E" stroke-opacity="0.75"><path d="M150 30 L250 150 L150 270 L50 150 Z"/><path d="M150 30 L190 150 L150 270 L110 150 Z" stroke-opacity="0.4"/><path d="M50 150 H250" stroke-opacity="0.4"/><ellipse cx="150" cy="150" rx="100" ry="26" stroke-opacity="0.35"/><circle cx="150" cy="150" r="6" fill="#3CDD9E"/></g></svg>';
const SAT_SVG = '<svg width="320" height="260" viewBox="0 0 320 260" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="105" width="90" height="50" fill="#0F3B2E" stroke="#3CDD9E" stroke-opacity="0.7"/><path d="M50 105 V155 M80 105 V155" stroke="#3CDD9E" stroke-opacity="0.3"/><rect x="210" y="105" width="90" height="50" fill="#0F3B2E" stroke="#3CDD9E" stroke-opacity="0.7"/><path d="M240 105 V155 M270 105 V155" stroke="#3CDD9E" stroke-opacity="0.3"/><path d="M110 130 H130 M190 130 H210" stroke="#BEE6D7" stroke-opacity="0.5"/><rect x="130" y="100" width="60" height="62" fill="#1A1611" stroke="#E8A34A" stroke-opacity="0.8"/><path d="M160 100 V70" stroke="#BEE6D7" stroke-opacity="0.5"/><path d="M130 70 Q160 30 190 70" stroke="#E8A34A" stroke-width="2"/><circle cx="160" cy="180" r="4" fill="#3CDD9E"/><path d="M160 184 V220" stroke="#3CDD9E" stroke-opacity="0.3" stroke-dasharray="3 4"/></svg>';

function figureHologram(hash, label) {
  return () => { const h = hologram(hash, "", label, ""); const cap = h.findOne(n => n.name === "Caption"); if (cap) cap.visible = false; return h; };
}
function figurePortrait() {
  return () => {
    const f = figma.createFrame(); f.name = "Portrait matrix"; f.resize(320, 360); f.fills = [img(IMG.portrait)]; f.strokes = [paint("color/accent/emerald", 0.6)];
    for (let y = 4; y < 360; y += 6) { const s = figma.createRectangle(); s.resize(320, 1); s.y = y; s.fills = [paint("color/bg/primary", 0.25)]; f.appendChild(s); }
    return f;
  };
}

// ── screens ────────────────────────────────────────────────────────────────
async function home() {
  const W = screen("Home", "Home");
  const desk = MODE === "desk";
  // Intro — landing
  const hero = al(desk ? "HORIZONTAL" : "VERTICAL", { name: "Intro — Landing", itemSpacing: desk ? 40 : 24, paddingLeft: P(), paddingRight: desk ? 80 : P(), paddingTop: desk ? 120 : 16, paddingBottom: desk ? 100 : 40, counterAxisAlignItems: "CENTER" });
  fill(W, hero);
  if (desk) { hero.counterAxisSizingMode = "FIXED"; hero.resize(1440, 900); }
  const stage = figma.createFrame(); stage.name = "Stage — avatar, planet limb, skill orbit"; stage.fills = []; stage.clipsContent = true;
  const sw = desk ? 620 : 335, sh = desk ? 700 : 300; stage.resize(sw, sh);
  const halo = figma.createEllipse(); halo.name = "Halo"; halo.resize(sw * 0.9, sw * 0.9); halo.x = sw * 0.05; halo.y = sh * 0.05;
  halo.fills = [{ type: "GRADIENT_RADIAL", gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: { r: 0.235, g: 0.867, b: 0.62, a: 0.16 } }, { position: 1, color: { r: 0.235, g: 0.867, b: 0.62, a: 0 } }] }]; stage.appendChild(halo);
  const pl = figma.createEllipse(); pl.name = "Planet limb"; pl.resize(sw * 2.4, sw * 2.4); pl.x = (sw - sw * 2.4) / 2; pl.y = sh * 0.86;
  pl.fills = [{ type: "SOLID", color: { r: 0.035, g: 0.035, b: 0.035 } }]; pl.strokeWeight = 2;
  pl.strokes = [{ type: "GRADIENT_LINEAR", gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: { r: 0.235, g: 0.867, b: 0.62, a: 0.9 } }, { position: 0.55, color: { r: 0.91, g: 0.64, b: 0.29, a: 0.8 } }, { position: 1, color: { r: 1, g: 0.29, b: 0.24, a: 0.9 } }] }];
  stage.appendChild(pl);
  const aw = desk ? 500 : 250; const av = figma.createRectangle(); av.name = "Avatar (ali-masked)"; av.resize(aw, aw * 1.094); av.x = (sw - aw) / 2; av.y = sh - aw * 1.094 - (desk ? 30 : 0);
  av.fills = [img(IMG.avatar, "FIT")]; stage.appendChild(av);
  const ob = figma.createEllipse(); ob.name = "Skill orbit"; ob.resize(sw * 0.84, sw * 0.21); ob.x = sw * 0.08; ob.y = sh * 0.67; ob.fills = []; ob.strokes = [paint("color/accent/emerald", 0.45)]; stage.appendChild(ob);
  const chips = desk ? [["TypeScript 10", 330, 586], ["UI/UX 7", 200, 592], ["React 7", 64, 520], ["PRDs 3", 270, 462], ["Mappls SDK 4", 440, 486]] : [["React 7", 10, 210], ["UI/UX 7", 120, 260], ["TypeScript 10", 200, 205]];
  for (const c of chips) { const ch = al("HORIZONTAL", { name: "Chip", paddingLeft: 10, paddingRight: 10, paddingTop: 6, paddingBottom: 6 }); ch.fills = [paint("color/bg/secondary", 0.9)]; ch.strokes = [paint("color/line/strong")]; ch.appendChild(await txt(c[0], "Mono/Label", "color/text/primary")); place(stage, ch, c[1], c[2]); }
  const ro = al("VERTICAL", { name: "Readout", itemSpacing: 4, paddingLeft: 14 }); ro.strokes = [paint("color/accent/emerald", 0.6)]; ro.strokeLeftWeight = 1; ro.strokeTopWeight = 0; ro.strokeRightWeight = 0; ro.strokeBottomWeight = 0;
  ro.appendChild(await txt("Skills installed  ▬▬▬▬  5/5", "Mono/Label", "color/text/secondary")); ro.appendChild(await txt(desk ? "Hover to unmask" : "Tap him to unmask", "Mono/Label", "color/text/tertiary")); place(stage, ro, desk ? 40 : 4, desk ? 20 : 4);
  const copy = al("VERTICAL", { name: "Copy", itemSpacing: desk ? 22 : 16 });
  if (desk) { hero.appendChild(copy); copy.resize(600, 10); copy.primaryAxisSizingMode = "AUTO"; hero.appendChild(stage); }
  else { hero.appendChild(stage); fill(hero, copy); }
  const kick = al("HORIZONTAL", { name: "Kicker", itemSpacing: 10, counterAxisAlignItems: "CENTER" }); const kd = figma.createEllipse(); kd.resize(7, 7); kd.fills = [paint("color/accent/emerald")]; kick.appendChild(kd); kick.appendChild(await txt("Product portfolio · Space OS", "Mono/Label", "color/accent/emerald")); copy.appendChild(kick);
  copy.appendChild(await txt("Ali Azam Kazmi", "Display/Name", "color/text/primary", "Name (h1)"));
  const role = await para(copy, "Product owner who designs, builds and ships · fleet products for 200,000+ users · New Delhi, India", "Body/Default", "color/text/secondary", "Role");
  if (desk) { role.layoutSizingHorizontal = "FIXED"; role.resize(520, role.height); }
  await para(copy, "Give me a problem. I’ll figure out what to do next.", "Body/Large", "color/text/primary", "Pitch");
  const acts = buttonRow([["Primary", "See the work", "↓"], ["Secondary", "Résumé (PDF)", "↗"], ["Text", "For recruiters", "→"]]);
  if (!desk) copy.appendChild(acts);
  await readoutRow(copy, [["Product", "3", "products owned"], ["Design · UX", "16", "design projects"], ["Engineering", "14", "products built"], ["Shipped", "4×", "collections, Mappls Shop"]]);
  await para(copy, "B.Tech CSE, SRMIST  ·  Associate Project Owner · MapMyIndia", "Body/Small", "color/text/secondary", "Meta");
  await para(copy, "Owns Mappls Shop · Mappls Intouch · Indane Yatra Mitra", "Body/Small", "color/text/primary", "Owns");
  if (desk) copy.appendChild(acts);

  // Toolkit + ace
  const tk = await section(W, "Intro — Toolkit", "Toolkit", "What I build with");
  const tools = al("HORIZONTAL", { name: "Tools", itemSpacing: 0 }); fill(tk, tools); if (!desk) { tools.layoutWrap = "WRAP"; tools.counterAxisSpacing = 20; }
  for (const t of [["React", "Web interfaces", "◎"], ["React Native", "Mobile apps", "▯"], ["Node.js", "APIs and services", "⬡"], ["Figma", "Product design", "◐"], ["Illustrator", "Brand and print", "Ai"]]) {
    const c = al("VERTICAL", { name: t[0], itemSpacing: 8, counterAxisAlignItems: "CENTER" });
    c.appendChild(await txt(t[2], "Title/Section", t[0] === "Figma" ? "color/signal/red" : "color/accent/emerald"));
    const ring = figma.createEllipse(); ring.resize(84, 18); ring.fills = []; ring.strokes = [paint("color/accent/emerald", 0.6)]; c.appendChild(ring);
    c.appendChild(await txt(t[0], "Title/Medium", "color/text/primary")); if (desk) c.appendChild(await txt(t[1], "Mono/Label", "color/text/tertiary"));
    tools.appendChild(c); if (desk) c.layoutSizingHorizontal = "FILL"; else { c.layoutSizingHorizontal = "FIXED"; c.resize(104, c.height); }
  }
  const ace = al("VERTICAL", { name: "Ace card — Jack of all trades", paddingTop: 18, paddingBottom: 18, paddingLeft: 18, paddingRight: 18, primaryAxisAlignItems: "SPACE_BETWEEN" });
  ace.resize(220, 308); ace.primaryAxisSizingMode = "FIXED"; ace.counterAxisSizingMode = "FIXED"; ace.cornerRadius = 14; ace.fills = [paint("color/bg/raised")]; ace.strokes = [paint("color/accent/emerald", 0.8)]; ace.strokeWeight = 1.5;
  ace.effects = [{ type: "DROP_SHADOW", color: { r: 0.235, g: 0.867, b: 0.62, a: 0.18 }, offset: { x: 0, y: 0 }, radius: 40, spread: 0, visible: true, blendMode: "NORMAL" }];
  ace.appendChild(await txt("A\n♠", "Title/Medium", "color/accent/emerald"));
  const pip = al("VERTICAL", { itemSpacing: 8, counterAxisAlignItems: "CENTER" }); pip.appendChild(await txt("♠", "Display/Name", "color/accent/emerald")); pip.appendChild(await txt("Jack of all trades", "Mono/Label", "color/text/secondary")); fill(ace, pip);
  const br = await txt("♠\nA", "Title/Medium", "color/accent/emerald"); br.textAlignHorizontal = "RIGHT"; ace.appendChild(br); br.layoutAlign = "STRETCH";
  const aceRow = rowOrCol({ name: "Ace", itemSpacing: 24, counterAxisAlignItems: "CENTER" }); fill(tk, aceRow); aceRow.appendChild(ace);
  await para(aceRow, "“A jack of all trades is a master of none, but oftentimes better than a master of one.”", "Body/Default", "color/text/secondary", "Proverb");

  // Building now
  const bd = await section(W, "Intro — Building now", "Building now", "What I’m building");
  const wins = rowOrCol({ name: "Products", itemSpacing: 40 }); fill(bd, wins);
  for (const p of [["Building it", "WatchSense", "A retail CRM for shops, clinics and salons: automatic birthday wishes, service reminders and WhatsApp offers that bring customers back.", "watchsensecrm.com"], ["Founder & CPO", "DumbMoney", "A coupon and deals platform for Indian online shoppers. Every code is checked for expiry and duplicates, then by a person, before it goes live.", "dumbmoney.in"]]) {
    const col = al("VERTICAL", { name: p[1], itemSpacing: 14 }); fill(wins, col);
    const win = al("VERTICAL", { name: "Browser window" }); win.strokes = [paint("color/line/strong")]; win.fills = [paint("color/bg/secondary")]; fill(col, win);
    const bar = al("HORIZONTAL", { name: "Chrome bar", itemSpacing: 8, paddingLeft: 14, paddingRight: 14, paddingTop: 10, paddingBottom: 10, counterAxisAlignItems: "CENTER" }); fill(win, bar);
    for (let i = 0; i < 3; i++) { const e = figma.createEllipse(); e.resize(8, 8); e.fills = [paint("color/line/strong")]; bar.appendChild(e); }
    const addr = al("HORIZONTAL", { paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4 }); addr.fills = [paint("color/bg/primary")]; addr.appendChild(await txt(p[3], "Mono/Label", "color/text/secondary")); fill(bar, addr);
    const body = figma.createFrame(); body.name = "Preview (monochrome until looked at)"; body.resize(540, desk ? 300 : 200);
    body.fills = [{ type: "GRADIENT_LINEAR", gradientTransform: [[0, 1, 0], [-1, 0, 1]], gradientStops: [{ position: 0, color: { r: 0.235, g: 0.66, b: 0.5, a: 0.5 } }, { position: 1, color: { r: 0.12, g: 0.46, b: 0.345, a: 0.12 } }] }];
    const bt = await txt(p[1], "Title/Page", "color/text/primary"); place(body, bt, 28, desk ? 120 : 76); bt.opacity = 0.85;
    fill(win, body);
    col.appendChild(await txt(p[0], "Mono/Label", "color/accent/emerald")); col.appendChild(await txt(p[1], "Title/Medium", "color/text/primary"));
    await para(col, p[2], "Body/Small", "color/text/secondary"); col.appendChild(await txt(p[3].toUpperCase() + " ↗", "Mono/Button", "color/text/primary"));
  }

  // 02 Work — the galaxy flight
  const work = figma.createFrame(); work.name = "02 Work — Galaxy flight"; work.resize(desk ? 1440 : 375, desk ? 900 : 640); work.fills = [img(IMG.galaxy)]; work.clipsContent = true; fill(W, work);
  const strip = al("HORIZONTAL", { name: "Top strip", itemSpacing: 14, counterAxisAlignItems: "CENTER" }); const sd = figma.createEllipse(); sd.resize(6, 6); sd.fills = [paint("color/accent/emerald")]; strip.appendChild(sd);
  for (const t of desk ? [["Product owner", "color/accent/emerald"], ["Ali Azam Kazmi", "color/text/secondary"], ["New Delhi, India", "color/text/secondary"]] : [["Product owner", "color/accent/emerald"]]) strip.appendChild(await txt(t[0], "Mono/Label", t[1]));
  place(work, strip, desk ? 64 : 20, desk ? 44 : 20);
  const op = al("VERTICAL", { name: "Opener", itemSpacing: 10 }); op.appendChild(await txt("02 / Work", "Mono/Label", "color/text/tertiary")); op.appendChild(await txt("Selected work", "Title/Section", "color/text/primary"));
  const opl = await txt("5 projects, one world at a time. Scroll to fly through them, or see all projects →", "Body/Small", "color/text/secondary"); op.appendChild(opl); opl.resize(desk ? 360 : 330, opl.height); opl.textAutoResize = "HEIGHT";
  place(work, op, desk ? 64 : 20, desk ? 110 : 56);
  const hud = al("VERTICAL", { name: "HUD — SYS-01", itemSpacing: 12, paddingLeft: 18, paddingRight: 18, paddingTop: 18, paddingBottom: 18 }); hud.strokes = [paint("color/accent/emerald", 0.6)]; hud.fills = [paint("color/bg/primary", 0.6)];
  hud.resize(300, 10); hud.primaryAxisSizingMode = "AUTO";
  const hr = al("HORIZONTAL", { primaryAxisAlignItems: "SPACE_BETWEEN" }); hr.appendChild(await txt("SYS-01", "Mono/Label", "color/accent/emerald")); hr.appendChild(await txt("■ Active", "Mono/Label", "color/accent/emerald")); fill(hud, hr);
  hud.appendChild(await txt("Technician App", "Title/Medium", "color/text/primary"));
  const stg = al("VERTICAL", { itemSpacing: 4, paddingLeft: 12, paddingRight: 12, paddingTop: 10, paddingBottom: 10 }); stg.fills = [paint("color/bg/raised")]; stg.strokes = [paint("color/line/hairline")]; fill(hud, stg);
  stg.appendChild(await txt("Stage", "Mono/Label", "color/text/tertiary")); stg.appendChild(await txt("Building end to end", "Body/Default", "color/text/primary"));
  await para(hud, "Owned  Frontend · UI/UX · PRD · cross-functional delivery", "Mono/Label", "color/text/secondary"); hud.appendChild(await txt("Open the report →", "Mono/Button", "color/accent/emerald"));
  place(work, hud, desk ? 1060 : 20, desk ? 330 : 400);
  if (desk) {
    const sys = al("VERTICAL", { name: "System list", itemSpacing: 14 });
    for (const s of [["Technician App", 1], ["Mappls Shop", 0], ["IOCL GeoRTD", 0], ["Vahan Shakti", 0], ["Intouch", 0]]) { const r = al("HORIZONTAL", { itemSpacing: 10 }); r.appendChild(await txt("◆", "Mono/Label", s[1] ? "color/accent/emerald" : "color/text/tertiary")); r.appendChild(await txt(s[0], "Mono/Label", s[1] ? "color/accent/emerald" : "color/text/tertiary")); sys.appendChild(r); }
    place(work, sys, 64, 300); place(work, await txt("System 01 / 05", "Mono/Label", "color/text/tertiary"), 64, 820);
  }

  // 03 Results — the black hole
  const res = figma.createFrame(); res.name = "03 Results — Every result has mass"; res.resize(desk ? 1440 : 375, desk ? 900 : 760); res.fills = [img(IMG.blackhole)]; res.clipsContent = true; fill(W, res);
  const rc = al("VERTICAL", { name: "Copy", itemSpacing: 14 }); rc.appendChild(await txt("03 / Results", "Mono/Label", "color/accent/emerald")); rc.appendChild(await txt("Every result has mass.", "Title/Section", "color/text/primary"));
  const rl = await txt("What was measured, in orbit. Everything else curves toward it.", "Body/Default", "color/text/secondary"); rc.appendChild(rl); rl.resize(desk ? 380 : 330, rl.height); rl.textAutoResize = "HEIGHT";
  rc.appendChild(btn("Text", "The full ledger", "→")); rc.appendChild(await txt(desk ? "Drag to orbit · Hold to dive" : "Swipe to orbit · Hold to dive", "Mono/Label", "color/text/tertiary"));
  if (desk) rc.appendChild(comms("CAPCOM", "Results have mass. Roadmaps, notably, do not."));
  place(res, rc, desk ? 64 : 20, desk ? 520 : 470);
  const masses = desk ? [["200,000+", "Users", 1110, 380], ["10,000+", "Active vehicles, scaling to 50,000", 690, 250], ["20,000+", "Attendees", 390, 300], ["20,000+", "Vehicles monitored", 400, 470], ["30,000+", "Routes injected", 740, 500]] : [["200,000+", "Users", 20, 40], ["30,000+", "Routes injected", 200, 40], ["20,000+", "Vehicles monitored", 20, 110], ["10,000+", "Active vehicles", 200, 110]];
  for (const m of masses) { const n = al("VERTICAL", { name: "Mass — " + m[1], itemSpacing: 4, counterAxisAlignItems: desk ? "CENTER" : "MIN" }); n.appendChild(await txt(m[0], "Mono/Value", "color/text/primary")); n.appendChild(await txt(m[1], "Mono/Label", "color/text/tertiary")); place(res, n, m[2], m[3]); }

  // 04 Experience
  const ex = await section(W, "04 Experience — Where the time went", "04 / Experience · 7 roles", "Where the time went", { more: "The full history" });
  const route = al("VERTICAL", { name: "Route" }); fill(ex, route);
  for (const r of [["Now", "DumbMoney", "Founder & CPO"], ["Sep 2024 — present", "MapMyIndia [Gtropy]", "Associate Project Owner · owns Mappls Shop, Mappls Intouch and Indane Yatra Mitra"], ["2023 — present", "Smaak.ux", "Founder & Product Designer · freelance"], ["Feb — Dec 2023", "Wise Work", "Full Stack Intern"], ["Jun — Aug 2023", "Datamatics", "R&D Project Intern"], ["Sep 2022 — Apr 2023", "Green Monk Energy", "Student Brand Ambassador, Chennai Lead"], ["Jan — Feb 2023", "Tech Analogy", "Graphic Designer Intern"]]) {
    const li = setP(C.ListRow.createInstance(), { Index: r[0], Title: r[1], Meta: r[2] }); fill(route, li);
    if (!desk) { try { li.layoutMode = "VERTICAL"; li.itemSpacing = 6; li.counterAxisAlignItems = "MIN"; } catch (e) {} }
  }

  // 05 Design
  const ds = await section(W, "05 Design — The studio on the side", "05 / Design · Smaak.ux · since 2023", "The studio on the side", { more: "The studio" });
  const pieces = [["Sunder Masala", "Website, content & branding"], ["Wolf Casa", "Website, content & branding"], ["Lean Multiverse", "Logo & branding"], ["Web3 NFT marketplace", "Multi-page UI · Figma"], ["Health dashboard", "Dark product UI"], ["TEDxSRMIST", "Web & app design"], ["Talent Connect", "Logo & visual identity"], ["AR/VR map", "Spatial web design"], ["Rois", "Clothing brand identity"], ["DumbMoney", "Brand concept"], ["Vivo mood board", "UI inspiration board"], ["Poster illustration", "Print"], ["A3 poster", "Print"], ["Independence Day", "Campaign template"]];
  const dome = al("HORIZONTAL", { name: "Dome — hologram plates", itemSpacing: 24, counterAxisAlignItems: "CENTER" }); fill(ds, dome);
  for (const hsh of desk ? [IMG.vahan, IMG.intouch, IMG.locate, IMG.tower] : [IMG.intouch]) { const h = hologram(hsh, "", "", ""); const cap = h.findOne(n => n.name === "Caption"); if (cap) cap.visible = false; dome.appendChild(h); if (desk) h.layoutSizingHorizontal = "FILL"; }
  const idx = rowOrCol({ name: "Dome index", itemSpacing: desk ? 64 : 0 }); fill(ds, idx);
  for (const half of desk ? [pieces.slice(0, 7), pieces.slice(7)] : [pieces]) {
    const col = al("VERTICAL", {}); fill(idx, col);
    for (const p of half) { const li = setP(C.ListRow.createInstance(), { Index: String(pieces.indexOf(p) + 1).padStart(2, "0"), Title: p[0], Meta: p[1] }); fill(col, li); }
  }

  // 06 Case studies
  const cs = await section(W, "06 Case studies — in flight", "06 / Case studies", "Case studies, in flight");
  cs.appendChild(comms("SHIP", "Three drones inbound. Each one carries its own conclusion."));
  const dr = rowOrCol({ name: "Drones", itemSpacing: desk ? 60 : 40 }); fill(cs, dr);
  for (const d of [["01", "Linear vs Jira", "Two tools for the same job, built on opposite beliefs about what a team is."], ["02", "The AI Code Assistant Adoption Paradox", "Everyone has one. Fewer people can say what changed."], ["03", "Apple Ecosystem Fragmentation", "The company most associated with coherence, examined at its seams."]]) {
    const di = setP(C.Drone.createInstance(), { Kicker: "Case study " + d[0], Title: d[1], Dek: d[2] }); fill(dr, di);
  }
  cs.appendChild(buttonRow([["Text", "All case studies", "→"], ["Text", "Essays", "→"], ["Text", "How I decide", "→"]]));

  // 07 Contact — the pad
  const ct = al("VERTICAL", { name: "07 Contact — Coming in to land", itemSpacing: 24, paddingLeft: P(), paddingRight: P(), paddingTop: desk ? 120 : 72, paddingBottom: 40 }); fill(W, ct);
  ct.appendChild(buttonRow([["Primary", "Get in touch", "→"], ["Secondary", "Résumé (PDF)", "↗"], ["Text", "Experience", "→"]]));
  const st = figma.createFrame(); st.name = "Landing stage (WebGL still) + caption"; st.resize(desk ? 1120 : 335, desk ? 637 : 520); st.fills = [img(IMG.landing)]; st.strokes = [paint("color/line/strong")]; st.clipsContent = true; fill(ct, st);
  const cap = al("VERTICAL", { name: "Stage caption", itemSpacing: 12 }); cap.appendChild(await txt("07 / Contact", "Mono/Label", "color/text/tertiary"));
  const cl = await txt("I learn whatever I need to build the thing I think should exist.", "Title/Medium", "color/text/primary"); cap.appendChild(cl); cl.resize(desk ? 420 : 300, cl.height); cl.textAutoResize = "HEIGHT";
  cap.appendChild(await txt("● On the pad · engines cold", "Mono/Label", "color/accent/emerald"));
  place(st, cap, desk ? 40 : 16, desk ? 420 : 340);
  if (desk) {
    const parts = al("VERTICAL", { name: "Part index", itemSpacing: 10, counterAxisAlignItems: "MAX" });
    for (const p of [["01 Nose · Sensors", 0], ["02 Canopy · Operator", 0], ["03 Canards · Control", 1], ["04 Wing · Lift", 0], ["05 Engines · Thrust", 0], ["06 Fins · Stability", 0]]) parts.appendChild(await txt(p[0], "Mono/Label", p[1] ? "color/accent/emerald" : "color/text/tertiary"));
    place(st, parts, 900, 30); place(st, btn("Secondary", "Dismantle", "◇"), 940, 570);
  }
  finishChrome(W);
  return W;
}

async function hire() {
  const W = screen("For Recruiters", "For recruiters");
  await pageHeader(W, { label: "Recruiter brief", plain: "For recruiters", title: "The PM who builds the product", lede: "Product Manager and Technical PM roles. Based in New Delhi, open to roles anywhere. The CV is one click away; the whole case takes thirty seconds.", actions: [["Primary", "Résumé (PDF)", "↗"], ["Secondary", "Book a call", "↗"], ["Text", "Email", "→"]], figure: () => svgNode(PROBE_SVG, "Wireframe probe"), comms: "Recruiter on frequency. The answers are pre-loaded; the call is still welcome." });
  const g = await section(W, "01 At a glance", "01 / At a glance", "What a first call asks");
  const man = al("VERTICAL", { name: "Manifest" }); fill(g, man);
  for (const r of [["Status", "Open to new roles"], ["Looking for", "Product Manager and Technical PM roles: a PM who builds the product"], ["Location", "Based in New Delhi, open to roles anywhere"], ["Builds with AI", "Claude, Gemini, ChatGPT: research, prototyping, vibe coding"], ["Now", "Associate Project Owner, MapMyIndia [Gtropy] · owns Mappls Shop, Mappls Intouch and Indane Yatra Mitra"], ["Also", "Co-founder & CPO, DumbMoney · Smaak.ux, a product and design studio"]]) fill(man, reportRow(r[0], r[1]));
  const pr = await section(W, "02 Proof", "02 / Proof", "Measured, not estimated");
  await para(pr, "Every number links back to a report that names its source. What was not measured says so.", "Body/Small", "color/text/secondary");
  await readoutRow(pr, [["Vahan Shakti", "200,000+", "users"], ["Mappls Shop", "4×", "collections"], ["Mappls Shop", "80%", "less manual ops work"], ["IOCL GeoRTD", "30,000+", "routes injected"]]);
  const cs = await section(W, "03 The case", "03 / The case", "Product, design, engineering, shipped");
  const claims = [
    ["Owns the product", "As Associate Project Owner at MapMyIndia he owns three products: Mappls Shop, Mappls Intouch, Indane Yatra Mitra. He writes the PRDs (Mappls Shop, the Admin Platform, Driver Safety for VinFast and SM Green): problem, user stories, acceptance criteria, the edge cases nobody wants to think about.", "How he decides"],
    ["Designs the experience", "User flows and wireframes come first, before a line of code: vehicle states, map behaviour, the alarm, geofence and ticket workflow were designed before they were built. Founder of Smaak.ux, a product and design studio with 10+ clients since 2023; Google UX Design certified.", "The design work"],
    ["Builds it himself", "Leads the React and Angular frontend on enterprise fleet platforms, and builds the Technician App in React Native. AI-native: prototypes with AI coding assistants and uses Claude, Gemini, ChatGPT for research. This site is the exhibit.", "The lab"],
    ["Ships, and measures it", "Mappls Shop replaced a manual billing process: 4× the collections, 80% less manual operations work, revenue-generating since its October 2026 launch. Mappls Intouch and Indane Yatra Mitra are live on Google Play; Vahan Shakti serves 200,000+ users.", "Ten mission reports"],
  ];
  for (const c of claims) {
    const r = rowOrCol({ name: "Claim — " + c[0], itemSpacing: MODE === "desk" ? 48 : 12, paddingTop: 28, paddingBottom: 28 }); r.strokes = [paint("color/line/hairline")]; r.strokeTopWeight = 1; r.strokeBottomWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; fill(cs, r);
    const t = await txt(c[0], "Title/Medium", "color/text/primary"); r.appendChild(t); if (MODE === "desk") { t.resize(320, t.height); t.textAutoResize = "HEIGHT"; }
    const ev = al("VERTICAL", { itemSpacing: 14 }); fill(r, ev); await para(ev, c[1], "Body/Default", "color/text/secondary"); ev.appendChild(await txt(c[2] + " →", "Mono/Button", "color/accent/emerald"));
  }
  const nx = await section(W, "04 Next step", "04 / Next step", "The CV, or a call", { bottom: 60 });
  nx.appendChild(buttonRow([["Primary", "Résumé (PDF)", "↗"], ["Secondary", "Book a call", "↗"], ["Text", "Forward this brief", "→"]]));
  const fax = al("VERTICAL", { name: "CV relay FX-01", itemSpacing: 10, paddingLeft: 24, paddingRight: 24, paddingTop: 24, paddingBottom: 24 }); fax.strokes = [paint("color/line/strong")]; fax.fills = [paint("color/bg/secondary")];
  fax.appendChild(await txt("CV relay FX-01 · Ready", "Mono/Label", "color/accent/emerald")); fax.appendChild(await txt("Swipe the pass through the reader. Or just download the PDF.", "Body/Small", "color/text/secondary")); nx.appendChild(fax);
  finishChrome(W); return W;
}

async function missions() {
  const W = screen("Projects", "Projects");
  await pageHeader(W, { label: "Hangar", plain: "Projects", title: "Every one started as somebody's bad afternoon", lede: "Enterprise fleet and telematics platforms, mostly. The interesting part is rarely the technology — it is deciding what the system should insist on.", figure: figureHologram(IMG.vahan, "Vahan Shakti"), comms: "Ten bays on the deck. Hover one and the chief will read its tag; he has been waiting." });
  const s = await section(W, "Success by project", "Success · by project", "What each one proved");
  await readoutRow(s, [["Bays", "10", "on the deck"], ["Active", "3", "in progress"], ["Shipped", "7", "live"], ["Largest", "200,000+", "users · Vahan Shakti"]]);
  const board = al("VERTICAL", { name: "Success board" }); fill(s, board);
  for (const m of [["Active", "Mappls Shop Admin & Automated Billing", "4× collections · measured"], ["Active", "IOCL GeoRTD Pipeline", "30,000+ routes injected · measured"], ["Active", "Technician App", "Being built · metrics named"], ["Shipped", "Vahan Shakti", "200,000+ users · measured"], ["Shipped", "Intouch", "10,000+ active vehicles · Play Store 1K+"], ["Shipped", "Locate — Manufacturer Backend", "20,000+ vehicles monitored · measured"], ["Shipped", "Indane Yatra Mitra", "Live on the Play Store · 1K+ installs"], ["Shipped", "Control Tower", "No public metric"], ["Shipped", "FASTag Platform", "No public metric"], ["Shipped", "Hermes", "No public metric"]]) {
    const li = setP(C.ListRow.createInstance(), { Index: m[0], Title: m[1], Meta: m[2] }); fill(board, li);
    if (MODE === "phone") { try { li.layoutMode = "VERTICAL"; li.itemSpacing = 6; li.counterAxisAlignItems = "MIN"; } catch (e) {} }
  }
  const dk = await section(W, "The deck", "Index · 10", "Filter the log", { bottom: 60 });
  await tags(dk, ["All 10", "Active 3", "Shipped 7", "TypeScript", "React", "Mappls SDK", "Angular", "RxJS"]);
  const deck = rowOrCol({ name: "Projectors", itemSpacing: 40 }); fill(dk, deck);
  if (MODE === "desk") { deck.layoutWrap = "WRAP"; deck.counterAxisSpacing = 48; }
  for (const h of [[IMG.vahan, "Shipped · 200,000+ users", "Vahan Shakti", "Government fleet platform · live tracking, clustering, heatmaps"], [IMG.intouch, "Shipped · 10,000+ vehicles", "Intouch", "Fleet-operator app · owned product"], [IMG.locate, "Shipped · 20,000+ vehicles", "Locate", "Manufacturer backend · Maharashtra"], [IMG.tower, "Shipped", "Control Tower", "Fleet operations console"]]) {
    const inst = hologram(h[0], h[1], h[2], h[3]); deck.appendChild(inst); if (MODE === "phone") inst.layoutSizingHorizontal = "FILL";
  }
  finishChrome(W); return W;
}

async function report() {
  const W = screen("Report — Mappls Shop", "Projects");
  const plate = () => {
    const h = hologram(null, "", "", ""); const cap = h.findOne(n => n.name === "Caption"); if (cap) cap.visible = false;
    return h;
  };
  await pageHeader(W, { label: "Mission report · MapMyIndia [Gtropy]", plain: "Project case study", title: "Mappls Shop Admin & Automated Billing", lede: "Billing was done by hand. The interesting part was not automating the maths. It was finding every place a human was quietly making a decision.", figure: plate });
  const pg = al("HORIZONTAL", { name: "Pager", itemSpacing: 20, paddingLeft: P(), paddingRight: P(), paddingTop: 8, paddingBottom: 8, primaryAxisAlignItems: "SPACE_BETWEEN", counterAxisAlignItems: "CENTER" }); fill(W, pg);
  pg.appendChild(await txt("← Technician App", "Mono/Label", "color/text/secondary")); pg.appendChild(await txt("Bay 02 / 10", "Mono/Label", "color/accent/emerald")); pg.appendChild(await txt("IOCL GeoRTD →", "Mono/Label", "color/text/secondary"));
  const mf = await section(W, "Manifest", null, null);
  const man = al("VERTICAL", { name: "Manifest" }); fill(mf, man);
  for (const r of [["Status", "Active"], ["Owned", "UI/UX owner · PRD author · cross-functional delivery"], ["Collections", "4× the manual process"], ["Manual ops", "80% less"], ["Replaces", "A fully manual billing process"], ["Model", "Device subscription renewals"], ["Open it", "shop.mappls.com ↗"], ["Stack", "Angular · TypeScript · Spring Boot · Odoo · Razorpay"]]) fill(man, reportRow(r[0], r[1]));
  mf.appendChild(await txt("Results · measured", "Mono/Label", "color/accent/emerald"));
  await readoutRow(mf, [["Collections", "4×", "vs the manual process"], ["Manual ops", "80%", "less, billing & accounts"], ["Users", "30+", "shop.mappls.com"], ["Status", "Live", "generating revenue"]]);
  const own = rowOrCol({ name: "Ownership", itemSpacing: MODE === "desk" ? 48 : 20 }); fill(mf, own);
  for (const o of [["I decided", "The PRD · The UI/UX · The Admin Platform PRD (v1, October 2026): one portal for Billing, Gadgets Catalog and Operations, with role-based access"], ["I built", "The web app frontend"], ["With the team", "Cross-functional delivery"]]) {
    const c = al("VERTICAL", { itemSpacing: 10, paddingTop: 20 }); c.strokes = [paint("color/line/hairline")]; c.strokeTopWeight = 1; c.strokeBottomWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; fill(own, c);
    c.appendChild(await txt(o[0], "Mono/Label", "color/accent/emerald")); await para(c, o[1], "Body/Small", "color/text/secondary");
  }
  const rp = await section(W, "Report", null, null, { bottom: 60 });
  const rows = [
    ["Brief", "Replace a fully manual billing process with an automated system for device subscriptions and their renewals, and give shop operations a first-class admin surface."],
    ["Context", "A manual process is never only arithmetic. It carries exceptions, tolerances and judgement calls that were never written down anywhere, because the person doing them never needed them written down."],
    ["Users", "Shop administrators, the billing team and the accounts team, plus the customers renewing a device subscription at shop.mappls.com."],
    ["Discovery", "Sat with the people doing the billing and traced one cycle end to end. Most of the time was not arithmetic; it was looking things up, deciding how to treat an edge case, and re-checking work."],
    ["Problem", "Manual billing is slow, and it is inconsistent in ways that only surface at reconciliation time."],
    ["Hypothesis", "Automating the calculation is the easy half. If every judgement call the operator was making by hand is captured as an explicit rule, or explicitly surfaced for a human decision, the process becomes consistent."],
    ["Strategy", "Build the admin surface and the billing engine as one product with one data model, so the shop record that drives billing is the same record operations edit. No exports, no re-keying."],
    ["Prioritization", "The rules that cover the majority of bills first; the exceptions as an explicit review queue rather than a growing list of special cases in code. Audit trail before automation of the last few percent."],
    ["UX", "The admin sees a bill the way an operator would check it: line by line, with the rule that produced each line visible on demand. Anything the system was unsure about is a flagged decision."],
    ["Design", "Dense tables with generous row height, inline rule explanations, and a review queue that reads as a to-do list rather than an error log."],
    ["Technology", "An Angular admin console over the Spring billing API, with Odoo upstream for devices and renewal dates and Razorpay for payments. The billing rules live server-side."],
    ["Build", "Ali owns the UI/UX, wrote the PRD, and drives delivery across the teams involved."],
    ["Roadmap", "Billing was the first module of a bigger product: the subscription lifecycle for every connected device Mappls sells. The North Star is renewal conversion."],
    ["Outcome", "Live and generating revenue, with 30+ users. Collections are four times what the manual process brought in, and the operations work it needed is down 80%."],
    ["Learnings", "The PRD's most valuable section was the list of things the previous process decided silently. Making those decisions explicit was most of the product work; the code was the smaller part."],
  ];
  const list = al("VERTICAL", { name: "Report rows (h2 labels)" }); fill(rp, list);
  for (const r of rows) fill(list, reportRow(r[0], r[1]));
  rp.appendChild(buttonRow([["Primary", "Open a channel", "→"], ["Secondary", "Résumé (PDF)", "↗"], ["Text", "All missions", "←"]]));
  finishChrome(W); return W;
}

async function about() {
  const W = screen("About", "About");
  await pageHeader(W, { label: "About the operator", plain: "About me", title: "Ali Azam Kazmi", lede: "I learn whatever I need to in order to build the thing I think should exist. That has meant frontend one week and a PRD the next, usually on the same product.", figure: figurePortrait(), comms: "The operator, in text. The airframe version is further down and says the same thing louder." });
  const st = await section(W, "Story", null, null);
  await para(st, "At MapMyIndia [Gtropy] I work on enterprise fleet and telematics platforms — the software that tells someone where two hundred thousand vehicles are, and, more usefully, which four of them need attention right now. My role there has been consistent across every project: build the frontend, own the UI and the UX, work across teams, and write the PRD.", "Body/Large", "color/text/primary");
  const man = al("VERTICAL", { name: "Manifest" }); fill(st, man);
  for (const r of [["Status", "Open to new roles"], ["Looking for", "Product Manager and Technical PM roles: a PM who builds the product"], ["Now", "Associate Project Owner, MapMyIndia [Gtropy]"], ["Location", "Based in New Delhi, open to roles anywhere"]]) fill(man, reportRow(r[0], r[1]));
  const im = await section(W, "Impact", "Impact", "What moved, and what I owned", { more: "Flight data" });
  const led = al("VERTICAL", { name: "Results ledger" }); fill(im, led);
  const results = [["200,000+", "Users", "Vahan Shakti"], ["30,000+", "Routes injected", "IOCL GeoRTD"], ["20,000+", "Vehicles monitored", "Locate · Maharashtra"], ["20,000+", "Attendees", "Milan, SRMIST"], ["10,000+", "Active vehicles, scaling to 50,000", "Intouch"], ["600K+", "Follower brand shipped", "Lean Multiverse · Smaak.ux"], ["300+", "Workshop participants", "UI/UX workshop, Alexa Developers SRM"], ["50+", "Cross-functional team led", "Milan core team"], ["4×", "Collections, vs the manual process", "Mappls Shop"], ["80%", "Less manual ops work, billing & accounts", "Mappls Shop"], ["~40%", "Dashboard performance", "Caching · RxJS · API optimisation"], ["+30%", "OCR extraction accuracy", "Datamatics R&D"], ["+15%", "Task completion after UX research", "Datamatics usability testing"]];
  results.forEach((r, i) => { const li = setP(C.ListRow.createInstance(), { Index: r[0], Title: r[1], Meta: r[2] }); fill(led, li); const ix = li.findOne(n => n.name === "Index"); if (ix) { ix.fills = [paint("color/accent/emerald")]; } if (MODE === "phone") { try { li.layoutMode = "VERTICAL"; li.itemSpacing = 6; li.counterAxisAlignItems = "MIN"; } catch (e) {} } });
  const ed = await section(W, "Education & leadership", "Education · Leadership", "Where the foundations came from");
  const el = al("VERTICAL", { name: "Rows" }); fill(ed, el);
  for (const r of [["Aug 2020 — Jun 2024", "B.Tech, Computer Science Engineering · SRM Institute of Science and Technology, Chennai · CGPA 8.76 / 10.0"], ["Sep 2022 — May 2024", "Technical Convener, Directorate of Student Affairs · SRMIST. Directed Milan, a national cultural festival with 20,000+ attendees. Managed a 50+ member cross-functional team."], ["Nov 2020 — May 2024", "Vice President · Alexa Developers SRM. 10+ technical events and hackathons. The flagship UI/UX workshop drew 300+ participants."]]) fill(el, reportRow(r[0], r[1]));
  const cp = await section(W, "Capabilities", "Capabilities", "What I reach for", { bottom: 60 });
  for (const g of [["Product", ["PRD writing", "User story mapping", "Roadmapping", "A/B testing", "Prioritisation", "Competitive analysis", "Agile / Scrum", "Stakeholder management", "SEO & growth"]], ["Design", ["Figma", "Spline", "Adobe Suite", "Wireframing", "Prototyping", "UX research", "User flow design", "Interaction design", "Usability testing"]], ["Technical", ["TypeScript", "React", "Next.js", "Angular", "Ionic", "Node.js", "Spring Boot", "Java", "Python", "RxJS", "Three.js", "Mappls SDK", "SQL", "REST APIs", "AWS S3"]]]) {
    cp.appendChild(await txt(g[0], "Mono/Label", "color/accent/emerald")); await tags(cp, g[1]);
  }
  finishChrome(W); return W;
}

async function contact() {
  const W = screen("Contact", "Contact");
  await pageHeader(W, { label: "Open channel", plain: "Contact", title: "The channel is open", lede: "Product roles, platform work, or an argument about something on this site. All three are welcome.", actions: [["Primary", "Email me", "→"], ["Secondary", "Book a call", "↗"], ["Text", "Résumé (PDF)", "↗"]], figure: () => svgNode(SAT_SVG, "Relay satellite"), comms: "Channel open. Replies arrive in Earth time." });
  const s = await section(W, "Channel", "Transmissions", "Accepting transmissions", { bottom: 60 });
  const card = al("VERTICAL", { name: "Vcard", itemSpacing: 12, paddingLeft: 28, paddingRight: 28, paddingTop: 28, paddingBottom: 28 }); card.strokes = [paint("color/line/strong")]; card.fills = [paint("color/bg/secondary")]; fill(s, card);
  const top = al("HORIZONTAL", { itemSpacing: 14 }); top.appendChild(await txt("AAK", "Mono/Button", "color/accent/emerald")); top.appendChild(await txt("Accepting transmissions · New Delhi, India · English · Hindi", "Mono/Label", "color/text/tertiary")); card.appendChild(top);
  card.appendChild(await txt("Ali Azam Kazmi", "Title/Section", "color/text/primary")); card.appendChild(await txt("Product owner who designs, builds and ships", "Body/Large", "color/text/secondary"));
  await para(card, "Looking for Product Manager and Technical PM roles · currently Associate Project Owner, MapMyIndia [Gtropy]", "Body/Small", "color/text/secondary");
  const ch = al("VERTICAL", { name: "Channels" }); fill(s, ch);
  for (const c of [["Email", "aliazamkazmi1291@gmail.com", "Send a message"], ["Calendly", "calendly.com/aliazamkazmi", "Book a slot"], ["LinkedIn", "linkedin.com/in/ali-azam-kazmi", "Connect"], ["GitHub", "github.com/aliazam1291", "Code"], ["Behance", "behance.net/aliak8", "Design work"]]) {
    const li = setP(C.ListRow.createInstance(), { Index: c[0], Title: c[1], Meta: c[2] }); fill(ch, li);
    const ix = li.findOne(n => n.name === "Index"); if (ix) { ix.resize(110, ix.height); ix.textAutoResize = "HEIGHT"; }
    if (MODE === "phone") { try { li.layoutMode = "VERTICAL"; li.itemSpacing = 6; li.counterAxisAlignItems = "MIN"; } catch (e) {} }
  }
  finishChrome(W); return W;
}

// ── cover + read me ────────────────────────────────────────────────────────
async function cover(page) {
  MODE = "desk";
  const cv = figma.createFrame(); cv.name = "Cover — 1920×960 (Community thumbnail)"; cv.resize(1920, 960); cv.clipsContent = true; cv.setPluginData(BUILT, "1");
  cv.fills = [img(IMG.galaxy), { type: "GRADIENT_LINEAR", gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: { r: 0.024, g: 0.024, b: 0.024, a: 0.94 } }, { position: 0.6, color: { r: 0.024, g: 0.024, b: 0.024, a: 0.55 } }, { position: 1, color: { r: 0.024, g: 0.024, b: 0.024, a: 0.2 } }] }];
  page.appendChild(cv); cv.x = 0; cv.y = 0;
  const av = figma.createRectangle(); av.name = "Avatar"; av.resize(700, 766); av.fills = [img(IMG.avatar, "FIT")]; place(cv, av, 1140, 194);
  const pl = figma.createEllipse(); pl.name = "Planet limb"; pl.resize(2600, 2600); pl.fills = [{ type: "SOLID", color: { r: 0.035, g: 0.035, b: 0.035 } }]; pl.strokeWeight = 3;
  pl.strokes = [{ type: "GRADIENT_LINEAR", gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: { r: 0.235, g: 0.867, b: 0.62, a: 0.9 } }, { position: 0.55, color: { r: 0.91, g: 0.64, b: 0.29, a: 0.8 } }, { position: 1, color: { r: 1, g: 0.29, b: 0.24, a: 0.9 } }] }];
  place(cv, pl, 160, 900);
  const c = al("VERTICAL", { name: "Copy", itemSpacing: 28 });
  const k = al("HORIZONTAL", { itemSpacing: 12, counterAxisAlignItems: "CENTER" }); const d = figma.createEllipse(); d.resize(10, 10); d.fills = [paint("color/accent/emerald")]; k.appendChild(d); k.appendChild(await txt("Space OS · a product portfolio", "Mono/Label", "color/accent/emerald")); c.appendChild(k);
  const n = await txt("Ali Azam Kazmi", "Display/Name", "color/text/primary"); n.fontSize = 120; c.appendChild(n);
  const l = await txt("Product owner who designs, builds and ships.\nA portfolio you fly through, not scroll past.", "Body/Large", "color/text/secondary"); l.fontSize = 32; c.appendChild(l);
  const t = al("HORIZONTAL", { itemSpacing: 12 });
  for (const s of ["Design system", "12 screens", "Desktop + phone", "Dark · emerald · Geist"]) { const ch = al("HORIZONTAL", { paddingLeft: 16, paddingRight: 16, paddingTop: 10, paddingBottom: 10 }); ch.strokes = [paint("color/line/strong")]; const tt = await txt(s, "Mono/Label", "color/text/primary"); tt.fontSize = 16; ch.appendChild(tt); t.appendChild(ch); }
  c.appendChild(t);
  const u = await txt("aliazamkazmi.vercel.app ↗", "Mono/Button", "color/accent/emerald"); u.fontSize = 18; link(u, SITE); c.appendChild(u);
  place(cv, c, 140, 230);
  try { await figma.setFileThumbnailNodeAsync(cv); } catch (e) {}

  const rm = al("VERTICAL", { name: "Read me", itemSpacing: 36, paddingLeft: 80, paddingRight: 80, paddingTop: 80, paddingBottom: 80 }); rm.setPluginData(BUILT, "1");
  rm.resize(1200, 100); rm.primaryAxisSizingMode = "AUTO"; rm.fills = [paint("color/bg/primary")]; page.appendChild(rm); rm.x = 0; rm.y = 1080;
  rm.appendChild(await txt("Read me", "Title/Page", "color/text/primary"));
  await para(rm, "Space OS is the portfolio of Ali Azam Kazmi, a product owner who designs, builds and ships fleet and geospatial products. The live site is a flight through the work: you board at a galaxy, a ship travels with you page to page, and everything you meet is a thing in space, never a card. This file is that site as an editable design.", "Body/Large", "color/text/secondary");
  const sec = async (title, lines) => { rm.appendChild(await txt(title, "Mono/Label", "color/accent/emerald")); for (const ln of lines) await para(rm, ln, "Body/Default", "color/text/secondary"); };
  await sec("What's inside", ["Design system: colour and spacing variables (one Dark mode), eleven text styles in Geist and Geist Mono, and components — Button, Section head, Readout cell, Report row, List row, Comms transcript, Dock, phone top bar and tab bar, Footer, Hologram, Drone.", "Screens: Home, For Recruiters, Projects, a project report (Mappls Shop), About and Contact, each at 1440 (desktop) and 375 (phone)."]);
  await sec("The rules the design follows", ["A project is a hologram; a case study is a drone. No card containers around objects — panels are for text only.", "Black ground, emerald signal, amber for the field, red only as heat. One primary accent event per screen; everything ambient is the same hue at low alpha.", "Every number is measured and sourced, or it is not on the page.", "The 3D scenes (galaxy, black hole, landing pad) are WebGL on the site; here they are stills of the real renders, and everything over them is editable."]);
  await sec("Credits", ["Designed and built by Ali Azam Kazmi.", "Typefaces: Geist and Geist Mono by Vercel (SIL Open Font License).", "Learn from it freely. Please don't republish it as your own portfolio."]);
  rm.appendChild(await txt("Links", "Mono/Label", "color/accent/emerald"));
  for (const [label, url] of [["Live site · aliazamkazmi.vercel.app", SITE], ["For recruiters · /hire", SITE + "/hire"], ["Projects · /missions", SITE + "/missions"], ["Résumé (PDF)", SITE + "/Ali_Azam_Kazmi_.pdf"], ["LinkedIn", "https://www.linkedin.com/in/ali-azam-kazmi"], ["Behance", "https://www.behance.net/aliak8"]]) {
    const t = await para(rm, label + " ↗", "Body/Default", "color/accent/emerald"); link(t, url);
  }
  await liveBoard(page, rm.y + rm.height + 160);
}

// The live site, as it is: screenshots captured from production by
// capture-shots.mjs (bundled into plugin.js as SHOTS), each with its URL as
// a clickable link. These are the real pages; the screens on "Screens" are
// the editable design.
async function liveBoard(page, y) {
  if (typeof SHOTS === "undefined" || !SHOTS.length) return;
  const b = al("VERTICAL", { name: "Live site — screenshots", itemSpacing: 48, paddingLeft: 80, paddingRight: 80, paddingTop: 80, paddingBottom: 80 });
  b.setPluginData(BUILT, "1"); b.resize(1920, 100); b.primaryAxisSizingMode = "AUTO"; b.fills = [paint("color/bg/primary")];
  page.appendChild(b); b.x = 0; b.y = y;
  b.appendChild(await txt("The live site", "Title/Page", "color/text/primary"));
  const sub = await para(b, "Screenshots of aliazamkazmi.vercel.app, captured from production. Every caption links to the page.", "Body/Large", "color/text/secondary");
  const top = await txt(SITE.replace("https://", "") + " ↗", "Mono/Button", "color/accent/emerald"); link(top, SITE); b.appendChild(top);
  const tile = async (s, w) => {
    const col = al("VERTICAL", { name: s.caption, itemSpacing: 12 });
    const r = figma.createRectangle(); r.name = "Screenshot — " + s.key; r.resize(w, Math.round(w * s.h / s.w));
    r.fills = [{ type: "IMAGE", imageHash: figma.createImage(figma.base64Decode(s.b64)).hash, scaleMode: "FILL" }];
    r.strokes = [paint("color/line/strong")]; col.appendChild(r);
    col.appendChild(await txt(s.caption, "Title/Medium", "color/text/primary"));
    const u = await txt(s.url.replace("https://", "") + " ↗", "Mono/Label", "color/accent/emerald"); link(u, s.url); col.appendChild(u);
    return col;
  };
  b.appendChild(await txt("Desktop · 1440", "Mono/Label", "color/text/tertiary"));
  const desk = SHOTS.filter(s => !s.mobile);
  for (let i = 0; i < desk.length; i += 2) {
    const row = al("HORIZONTAL", { itemSpacing: 48 }); b.appendChild(row);
    for (const s of desk.slice(i, i + 2)) row.appendChild(await tile(s, 856));
  }
  b.appendChild(await txt("Phone · 390", "Mono/Label", "color/text/tertiary"));
  const prow = al("HORIZONTAL", { itemSpacing: 48 }); b.appendChild(prow);
  for (const s of SHOTS.filter(s => s.mobile)) prow.appendChild(await tile(s, 390));
}
function link(textNode, url) { try { textNode.hyperlink = { type: "URL", value: url }; } catch (e) {} }
const SITE = "https://aliazamkazmi.vercel.app";

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  const vlist = await figma.variables.getLocalVariablesAsync(); for (const v of vlist) V[v.name] = v;
  const slist = await figma.getLocalTextStylesAsync(); for (const s of slist) TS[s.name] = s;
  for (const f of ["Regular", "Medium", "SemiBold"]) await figma.loadFontAsync({ family: "Geist", style: f });
  for (const f of ["Regular", "Medium"]) await figma.loadFontAsync({ family: "Geist Mono", style: f });
  const pages = {}; for (const p of figma.root.children) pages[p.name] = p;
  const ds = pages["Design system"], sc = pages["Screens"], cvp = pages["Cover & Read me"];
  await ds.loadAsync(); await sc.loadAsync(); await cvp.loadAsync();
  for (const name of ["Button", "SectionHead", "ReadoutCell", "ReportRow", "ListRow", "Comms", "Dock", "PhoneTopBar", "PhoneTabBar", "Footer", "Hologram", "Drone"]) {
    const n = ds.findOne(x => (x.type === "COMPONENT" || x.type === "COMPONENT_SET") && x.name === name);
    if (!n) throw new Error("Missing component: " + name);
    C[name === "Button" ? "button" : name] = n;
  }
  // Clean up: the upload frames, the first Home pass, and anything built before.
  for (const id of STALE) { const n = await figma.getNodeByIdAsync(id); if (n && n.parent && n.parent.type === "PAGE") n.remove(); }
  for (const p of [sc, cvp]) for (const n of [...p.children]) if (n.getPluginData(BUILT) === "1") n.remove();

  await figma.setCurrentPageAsync(sc);
  const builders = [home, hire, missions, report, about, contact];
  let x = 0, maxH = 0;
  MODE = "desk";
  for (const b of builders) { const W = await b(); sc.appendChild(W); W.x = x; W.y = 0; x += 1440 + 200; maxH = Math.max(maxH, W.height); }
  x = 0; MODE = "phone";
  for (const b of builders) { const W = await b(); sc.appendChild(W); W.x = x; W.y = maxH + 400; x += 375 + 120; }

  await figma.setCurrentPageAsync(cvp);
  await cover(cvp);
  figma.viewport.scrollAndZoomIntoView(cvp.children);
}

main().then(() => figma.closePlugin("Space OS screens built: 6 desktop, 6 phone, cover and read me.")).catch((e) => { console.error(e); figma.closePlugin("Build stopped: " + (e && e.message ? e.message : e)); });
