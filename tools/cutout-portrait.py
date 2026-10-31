"""Cut Ali out of his studio headshot for the landing's portrait (2026-10-31).

Ali: "we need a portfolio looking page related to space, like my photo and
masked on me in the landing." The headshot (AliKazmi_Photo.png: suit, plain
light-grey studio wall, a white print border) is the one photo with a
background simple enough to remove without a downloaded model, using only
OpenCV:

  1. trim the white border;
  2. GrabCut, seeded by colour: near-wall-grey is probably background, far
     from it is probably foreground, the top band is surely background, the
     face and torso surely foreground;
  3. hair: inside a thin band around the GrabCut edge, alpha comes from the
     colour distance to the wall (dark curls on light grey separate cleanly),
     so strands keep their shape instead of a hard cut;
  4. decontaminate: un-mix the grey wall out of every part-transparent pixel,
     so no grey halo shows on the black page;
  5. crop, save as WebP with alpha.

Usage: python -I tools/cutout-portrait.py <in.png> <out.webp> [preview.png]
"""
import sys

import cv2
import numpy as np
from PIL import Image


def main(src: str, out: str, preview: str | None = None) -> None:
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)

    # 1. The print border is near-white; the photo is everything inside it.
    not_white = (rgb.min(axis=2) < 238).astype(np.uint8)
    ys, xs = np.nonzero(not_white)
    pad = 6
    y0, y1 = ys.min() + pad, ys.max() - pad
    x0, x1 = xs.min() + pad, xs.max() - pad
    img = rgb[y0:y1, x0:x1]
    h, w = img.shape[:2]

    # The wall: median of the top band, which is wall all the way across.
    wall = np.median(img[: int(h * 0.05)].reshape(-1, 3), axis=0)
    dist = np.sqrt(((img - wall) ** 2).sum(axis=2))

    # 2. GrabCut, seeded by colour and position.
    mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    mask[dist > 42] = cv2.GC_PR_FGD
    mask[: int(h * 0.04)] = cv2.GC_BGD
    # The wall's flanks above the shoulders are wall.
    shoulder = int(h * 0.55)
    mask[:shoulder, : int(w * 0.08)] = cv2.GC_BGD
    mask[:shoulder, int(w * 0.92):] = cv2.GC_BGD
    # Face and torso are surely the subject.
    cy, cx = int(h * 0.45), w // 2
    cv2.ellipse(mask, (cx, cy), (int(w * 0.17), int(h * 0.16)), 0, 0, 360, cv2.GC_FGD, -1)
    mask[int(h * 0.82):, int(w * 0.2): int(w * 0.8)] = cv2.GC_FGD
    # The shirt front between the lapels: white with grey shading, close to
    # the wall's colour, and always the subject.
    mask[int(h * 0.56):, int(w * 0.38): int(w * 0.62)] = cv2.GC_FGD

    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(img.astype(np.uint8), mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    hard = np.isin(mask, (cv2.GC_FGD, cv2.GC_PR_FGD)).astype(np.uint8)

    # Wall left inside the mask: the pockets between jaw and shoulders get
    # sealed off by the hair and the collar, so neither GrabCut nor a hole
    # fill sees them as wall. Anything wall-coloured goes — except in the
    # face and the shirt front, where grey shading is the subject.
    protect = np.zeros((h, w), np.uint8)
    cv2.ellipse(protect, (cx, cy), (int(w * 0.16), int(h * 0.17)), 0, 0, 360, 1, -1)
    protect[int(h * 0.5):, int(w * 0.36): int(w * 0.64)] = 1
    wall_like = (dist < 26) & (protect == 0)
    hard[wall_like] = 0
    hard = cv2.morphologyEx(hard, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))

    # Keep the largest component (the person); fill only holes that are not
    # wall (a hole the colour of the wall is wall seen through a gap).
    n, lab, stats, _ = cv2.connectedComponentsWithStats(hard, 8)
    if n > 1:
        hard = (lab == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
    flood = hard.copy()
    ff = np.zeros((h + 2, w + 2), np.uint8)
    cv2.floodFill(flood, ff, (0, 0), 1)
    holes = (1 - flood).astype(np.uint8)
    hn, hlab = cv2.connectedComponents(holes, 8)
    for i in range(1, hn):
        comp = hlab == i
        if dist[comp].mean() > 30 or protect[comp].mean() > 0.5:
            hard[comp] = 1

    # 3. Soft alpha in a band around the edge, from distance to the wall.
    # The ramp starts well clear of the wall colour, so a fringe pixel that
    # is mostly wall comes out mostly transparent (a low ramp left a pale
    # halo round the curls).
    band_r = 10
    k = np.ones((2 * band_r + 1, 2 * band_r + 1), np.uint8)
    band = (cv2.dilate(hard, k) - cv2.erode(hard, k)).astype(bool)
    soft = np.clip((dist - 30.0) / (95.0 - 30.0), 0.0, 1.0)
    alpha = hard.astype(np.float32)
    alpha[band] = np.minimum(soft[band], cv2.dilate(hard, k)[band])
    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.7)
    # Nothing outside the dilated person survives (stray wall specks).
    alpha *= cv2.dilate(hard, k).astype(np.float32)

    # 4. Un-mix the wall from part-transparent pixels.
    a3 = alpha[..., None]
    fg = np.where(a3 > 0.02, (img - (1.0 - a3) * wall) / np.maximum(a3, 0.05), img)
    fg = np.clip(fg, 0, 255)

    # 5. Crop to the subject (the suit runs off the bottom: keep that edge).
    ay, ax = np.nonzero(alpha > 0.03)
    m = 12
    cy0, cy1 = max(0, ay.min() - m), h
    cx0, cx1 = max(0, ax.min() - m), min(w, ax.max() + m)
    rgba = np.dstack([fg, alpha * 255.0])[cy0:cy1, cx0:cx1].astype(np.uint8)
    im = Image.fromarray(rgba, "RGBA")
    im.save(out, "WEBP", quality=90, method=6)
    print("saved", out, im.size)

    if preview:
        # The cutout on the site's black, with a faint emerald glow behind it,
        # to judge the edge where it will actually be seen.
        bg = Image.new("RGBA", im.size, (6, 6, 6, 255))
        bg.alpha_composite(im)
        bg.convert("RGB").save(preview)
        print("preview", preview)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
