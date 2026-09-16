// Stitch seq-*.png into one contact sheet with sharp (a dev dependency of Next).
import sharp from "sharp";
import { readdirSync } from "node:fs";
const files = readdirSync("tools/shots").filter((f) => /^seq-\d+\.png$/.test(f)).sort();
const W = 480, H = 300, COLS = 5;
const tiles = await Promise.all(files.map((f) => sharp(`tools/shots/${f}`).resize(W, H).toBuffer()));
const rows = Math.ceil(tiles.length / COLS);
await sharp({ create: { width: W * COLS, height: H * rows, channels: 3, background: "#000" } })
  .composite(tiles.map((input, i) => ({ input, left: (i % COLS) * W, top: Math.floor(i / COLS) * H })))
  .png().toFile("tools/shots/seq-sheet.png");
console.log("sheet", tiles.length);
