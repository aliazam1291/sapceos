/*
 * Dome textures for /smaak (2026-09-27).
 *
 * The gallery hangs ~14 images inside a sphere in WebGL, which means every
 * one of them is decoded and uploaded to the GPU on mount. The source files
 * in public/studio are Behance covers and full-page site captures — 3.7 MB
 * before the two new screenshots, 7 MB after. That is a hero image budget
 * spent on a decoration.
 *
 * This bakes each one to a 640px-wide WebP: the planes are ~400px on screen
 * at the widest, so 640 covers a 1.5 dpr without waste. Output goes to
 * public/studio/dome/ and the source files stay where they are — /studio
 * and the client rows still use the originals through next/image.
 *
 *   node tools/studio-textures.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = "public/studio";
const OUT = "public/studio/dome";
const WIDTH = 640;

fs.mkdirSync(OUT, { recursive: true });

const files = fs.readdirSync(SRC).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
let before = 0;
let after = 0;

for (const file of files) {
  const from = path.join(SRC, file);
  const to = path.join(OUT, file.replace(/\.(png|jpe?g|webp)$/i, ".webp"));
  const src = fs.statSync(from).size;
  await sharp(from)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(to);
  const dst = fs.statSync(to).size;
  before += src;
  after += dst;
  console.log(`${file.padEnd(46)} ${(src / 1024).toFixed(0).padStart(5)} KB → ${(dst / 1024).toFixed(0).padStart(4)} KB`);
}

console.log(`\n${files.length} textures · ${(before / 1048576).toFixed(2)} MB → ${(after / 1048576).toFixed(2)} MB`);
