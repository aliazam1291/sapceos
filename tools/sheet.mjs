// Tile a set of screenshots into one contact sheet, so nine pages can be
// read in one look.  node tools/sheet.mjs "tools/shots/ship-1440-*.png" tools/shots/sheet-rest.png 3
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const pattern = process.argv[2];
const out = process.argv[3] ?? 'tools/shots/sheet.png';
const cols = +(process.argv[4] ?? 3);
const dir = path.dirname(pattern);
const re = new RegExp('^' + path.basename(pattern).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
const files = fs.readdirSync(dir).filter((f) => re.test(f)).sort().map((f) => path.join(dir, f));
if (!files.length) throw new Error('no files match ' + pattern);
const W = 480;
const tiles = [];
for (const f of files) {
  const img = sharp(f);
  const meta = await img.metadata();
  const h = Math.round((meta.height / meta.width) * W);
  tiles.push({ buf: await img.resize(W, h).png().toBuffer(), h, name: path.basename(f, '.png') });
}
const rowH = Math.max(...tiles.map((t) => t.h)) + 22;
const rows = Math.ceil(tiles.length / cols);
const canvas = sharp({ create: { width: W * cols, height: rowH * rows, channels: 3, background: '#111' } });
const composites = tiles.map((t, i) => ({ input: t.buf, left: (i % cols) * W, top: Math.floor(i / cols) * rowH + 22 }));
const labels = tiles.map((t, i) => ({
  input: Buffer.from(`<svg width="${W}" height="22"><text x="6" y="16" font-family="monospace" font-size="13" fill="#9ae6c4">${t.name}</text></svg>`),
  left: (i % cols) * W,
  top: Math.floor(i / cols) * rowH,
}));
await canvas.composite([...composites, ...labels]).png().toFile(out);
console.log('wrote', out, `${files.length} shots`);
