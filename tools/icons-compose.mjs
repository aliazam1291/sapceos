// From public/icons/*.png (tools/icons-build.mjs) compose the site's marks:
// app/icon.png (the ringed giant, transparent, 512), app/apple-icon.png (the
// giant on the ground colour, 180 — iOS flattens transparency to black
// anyway), and app/og-ship.png (the ship, for the share card).
//
//   node tools/icons-compose.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';

const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const b = await chromium.launch();
const p = await b.newPage();
await p.setContent('<canvas id="c"></canvas>');
const compose = async (src, size, { bg = null, scale = 1, dy = 0 } = {}) =>
  p.evaluate(
    async ([src, size, bg, scale, dy]) => {
      const c = document.getElementById('c');
      c.width = size;
      c.height = size;
      const g = c.getContext('2d');
      if (bg) {
        g.fillStyle = bg;
        g.fillRect(0, 0, size, size);
      }
      const img = new Image();
      img.src = src;
      await img.decode();
      const s = size * scale;
      g.drawImage(img, (size - s) / 2, (size - s) / 2 + dy, s, s);
      return c.toDataURL('image/png');
    },
    [src, size, bg, scale, dy],
  );
const write = (path, dataUrl) => fs.writeFileSync(path, Buffer.from(dataUrl.split(',')[1], 'base64'));

write('src/app/icon.png', await compose(b64('public/icons/giant.png'), 192, { scale: 1.18 }));
// favicon.ico: a PNG-in-ICO (Vista+), 64px, so the tab shows the same mark.
const ico64 = Buffer.from((await compose(b64('public/icons/giant.png'), 64, { scale: 1.18 })).split(',')[1], 'base64');
const dir = Buffer.alloc(6 + 16);
dir.writeUInt16LE(0, 0); dir.writeUInt16LE(1, 2); dir.writeUInt16LE(1, 4);
dir.writeUInt8(64, 6); dir.writeUInt8(64, 7); dir.writeUInt8(0, 8); dir.writeUInt8(0, 9); dir.writeUInt16LE(1, 10); dir.writeUInt16LE(32, 12); dir.writeUInt32LE(ico64.length, 14); dir.writeUInt32LE(22, 18);
fs.writeFileSync('src/app/favicon.ico', Buffer.concat([dir, ico64]));
write('src/app/apple-icon.png', await compose(b64('public/icons/giant.png'), 180, { bg: '#060606', scale: 1.12 }));
fs.copyFileSync('public/icons/ship.png', 'src/app/og-ship.png');
// Small variants for UI use (the palette headings): 128px, a few KB each.
for (const n of ['ship', 'satellite', 'giant', 'world', 'ship-landed']) write(`public/icons/${n}-128.png`, await compose(b64(`public/icons/${n}.png`), 128, { scale: 1.15 }));
for (const f of ['src/app/icon.png', 'src/app/apple-icon.png', 'src/app/favicon.ico', 'src/app/og-ship.png']) console.log(f, Math.round(fs.statSync(f).size / 1024) + ' KB');
await b.close();
