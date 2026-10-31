"""Cut a subject out of an image whose "transparency" is a painted checkerboard.

AI image tools often export a fake transparent background: white and light
grey squares baked into an RGB file (Ali's avatar, 2026-10-31). This removes
it with OpenCV only, no downloaded model:

  1. background candidates are colourless and light (the squares, and the
     faint grey scribbles some generators leave on them); the ones connected
     to the image border are surely background;
  2. GrabCut, seeded with those as background and the middle of the figure
     as foreground, finds the silhouette; the largest component is kept and
     its holes filled;
  3. the edge is feathered, and every part-transparent pixel is un-mixed
     against the square that was actually behind it (the nearest sure
     background pixel's colour), so neither a white nor a grey halo shows
     on a black page;
  4. crop to the subject and save WebP with alpha.

Usage: python -I tools/cutout-checker.py <in> <out.webp> [preview.png]
"""
import sys

import cv2
import numpy as np
from PIL import Image


def main(src: str, out: str, preview: str | None = None) -> None:
    img = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    h, w = img.shape[:2]
    mx, mn = img.max(axis=2), img.min(axis=2)
    light_grey = ((mx - mn) < 14) & (mn > 150)

    # 1. Colourless-and-light regions touching the border.
    n, lab = cv2.connectedComponents(light_grey.astype(np.uint8), 8)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    sure_bg = np.isin(lab, border[border > 0])

    # 2. GrabCut.
    mask = np.full((h, w), cv2.GC_PR_FGD, np.uint8)
    mask[light_grey] = cv2.GC_PR_BGD
    mask[sure_bg] = cv2.GC_BGD
    cy, cx = int(h * 0.34), w // 2
    cv2.ellipse(mask, (cx, cy), (int(w * 0.12), int(h * 0.12)), 0, 0, 360, cv2.GC_FGD, -1)
    mask[int(h * 0.7):, int(w * 0.25): int(w * 0.75)] = np.where(
        sure_bg[int(h * 0.7):, int(w * 0.25): int(w * 0.75)], cv2.GC_BGD, cv2.GC_FGD
    )
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(img.astype(np.uint8), mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    hard = np.isin(mask, (cv2.GC_FGD, cv2.GC_PR_FGD)).astype(np.uint8)
    hard = cv2.morphologyEx(hard, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(hard, 8)
    if n > 1:
        hard = (lab == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
    # Fill holes — flooding from a frame AROUND the image, so background
    # pieces cut off from each other (hair touching the top edge splits left
    # from right) all count as outside, not as holes in the subject.
    framed = np.pad(hard, 1)
    cv2.floodFill(framed, np.zeros((h + 4, w + 4), np.uint8), (0, 0), 1)
    hard[framed[1:-1, 1:-1] == 0] = 1
    # Squares seen through the curls: enclosed by hair, so neither GrabCut
    # nor the flood calls them outside. Above the brow nothing on him is
    # light and colourless (hair is dark, skin is warm), so they go — below
    # it, eye whites and highlights are, so the rule stops there.
    crown = int(h * 0.25)
    pocket = light_grey[:crown] & (mx[:crown] > 170)
    pocket = cv2.dilate(pocket.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    hard[:crown][pocket] = 0

    # 3. Feather, then un-mix against the square behind each edge pixel.
    alpha = cv2.GaussianBlur(hard.astype(np.float32), (0, 0), 0.9)
    alpha[hard == 0] *= 0.6
    alpha = np.clip(alpha, 0, 1)
    bg_src = (hard == 0).astype(np.uint8)
    _, labels = cv2.distanceTransformWithLabels(1 - bg_src, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    ys, xs = np.nonzero(bg_src == 1)
    lut = np.zeros((labels.max() + 1, 3), np.float32)
    lut[labels[ys, xs]] = img[ys, xs]
    behind = lut[labels]
    a3 = alpha[..., None]
    fg = np.where(a3 > 0.02, (img - (1.0 - a3) * behind) / np.maximum(a3, 0.05), img)
    fg = np.clip(fg, 0, 255)

    # 4. Crop and save.
    ay, ax = np.nonzero(alpha > 0.03)
    y0, x0, x1 = max(0, ay.min() - 8), max(0, ax.min() - 8), min(w, ax.max() + 9)
    rgba = np.dstack([fg, alpha * 255.0])[y0:, x0:x1].astype(np.uint8)
    im = Image.fromarray(rgba, "RGBA")
    im.save(out, "WEBP", quality=88, method=6)
    print("saved", out, im.size)
    if preview:
        bg = Image.new("RGBA", im.size, (6, 6, 6, 255))
        bg.alpha_composite(im)
        bg.convert("RGB").save(preview)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
