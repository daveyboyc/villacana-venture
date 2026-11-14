#!/usr/bin/env python3
"""Trace a ground class (lawn, or a paved/deck tone) from the georeferenced aerial, for the ground plan.

  python3 scripts/trace_ground.py lawn --within "x,z x,z x,z ..." [--tolerance 0.4] [--close 0.6] [--overlay out.png]

Reads public/map/ground.jpg (Esri World Imagery, bounds in public/map/ground.json), classifies each
pixel inside the `--within` polygon (world metres, x east, z south), cleans the mask (closing and
opening by `--close` metres removes worn patches, shadows and single trees), keeps the largest
region and prints its outline, simplified to `--tolerance` metres, as JSON world coordinates for
data/ground_plan_<area>.json. With --overlay it also writes the aerial crop with the outline drawn,
for the review record.

Classes:
  lawn  green: G clearly above R and B (the aerial's lawns, grass verges)
  pale  bright low-saturation pixels (pale stone decks, concrete paths, white planters)
  warm  reddish/brown pixels (terracotta paving, pink resin, bare earth)

The aerial is about 0.24 m a pixel and registered to the model to 1-2 m, so a traced edge is good to
about a metre; say so in the surface's note, and prefer photo evidence where the two disagree.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from skimage import measure, morphology
from skimage.draw import polygon as fill_polygon

ROOT = Path(__file__).resolve().parents[1]


def classify(rgb, kind):
    r, g, b = (rgb[..., k].astype(float) for k in range(3))
    if kind == 'lawn':
        return (g > r + 8) & (g > b + 4)
    if kind == 'pale':
        return (r + g + b > 520) & (np.max(rgb, -1).astype(float) - np.min(rgb, -1) < 45)
    if kind == 'warm':
        return (r > g + 18) & (r > b + 25)
    raise SystemExit(f'unknown class {kind}')


def simplify(ring, tolerance):
    """Douglas-Peucker on a closed ring."""
    pts = ring[:-1] if np.allclose(ring[0], ring[-1]) else ring
    def dp(seq):
        if len(seq) < 3:
            return list(seq)
        a, b = seq[0], seq[-1]
        ab = b - a
        n = np.hypot(*ab) or 1.0
        rel = seq - a
        d = np.abs(ab[0] * rel[:, 1] - ab[1] * rel[:, 0]) / n
        k = int(np.argmax(d))
        if d[k] > tolerance:
            return dp(seq[:k + 1])[:-1] + dp(seq[k:])
        return [a, b]
    # Split at the two points farthest apart so the ring is simplified as two open chains.
    i = 0
    j = int(np.argmax(np.hypot(*(pts - pts[0]).T)))
    first, second = dp(pts[i:j + 1]), dp(np.vstack([pts[j:], pts[:1]]))
    return np.array(first[:-1] + second[:-1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('kind', choices=['lawn', 'pale', 'warm'])
    ap.add_argument('--within', required=True, help='polygon "x,z x,z ..." in world metres (quoted, one argument)')
    ap.add_argument('--tolerance', type=float, default=0.4)
    ap.add_argument('--close', type=float, default=0.6)
    ap.add_argument('--overlay')
    a = ap.parse_args()
    bounds = json.loads((ROOT / 'public/map/ground.json').read_text())
    image = np.asarray(Image.open(ROOT / 'public/map/ground.jpg').convert('RGB'))
    h, w = image.shape[:2]
    sx, sz = w / (bounds['maxX'] - bounds['minX']), h / (bounds['maxZ'] - bounds['minZ'])
    poly = np.array([[float(v) for v in p.split(',')] for p in a.within.split()])
    cols, rows = (poly[:, 0] - bounds['minX']) * sx, (poly[:, 1] - bounds['minZ']) * sz
    c0, c1 = int(max(0, cols.min() - 4)), int(min(w, cols.max() + 5))
    r0, r1 = int(max(0, rows.min() - 4)), int(min(h, rows.max() + 5))
    crop = image[r0:r1, c0:c1]
    roi = np.zeros(crop.shape[:2], bool)
    rr, cc = fill_polygon(rows - r0, cols - c0, roi.shape)
    roi[rr, cc] = True
    mask = classify(crop, a.kind) & roi
    radius = max(1, round(a.close * sx))
    mask = morphology.closing(mask, morphology.disk(radius)).astype(bool)
    mask = morphology.opening(mask, morphology.disk(radius)).astype(bool) & roi
    labels = measure.label(mask)
    if labels.max() == 0:
        raise SystemExit('nothing of that class inside the polygon')
    biggest = np.argmax(np.bincount(labels.ravel())[1:]) + 1
    region = np.pad(labels == biggest, 1)
    contour = max(measure.find_contours(region.astype(float), 0.5), key=len) - 1
    world = np.c_[(contour[:, 1] + c0 + 0.5) / sx + bounds['minX'], (contour[:, 0] + r0 + 0.5) / sz + bounds['minZ']]
    ring = simplify(world, a.tolerance)
    area = abs(np.sum(ring[:, 0] * np.roll(ring[:, 1], -1) - np.roll(ring[:, 0], -1) * ring[:, 1])) / 2
    print(json.dumps([[round(x, 2), round(z, 2)] for x, z in ring]))
    print(f'# {len(ring)} points, {area:.0f} m2, class {a.kind}, {1 / sx:.2f} m a pixel', flush=True)
    if a.overlay:
        scale = 5
        out = Image.fromarray(crop).resize((crop.shape[1] * scale, crop.shape[0] * scale), Image.LANCZOS)
        d = ImageDraw.Draw(out)
        to_px = lambda x, z: (((x - bounds['minX']) * sx - c0) * scale, ((z - bounds['minZ']) * sz - r0) * scale)
        d.line([to_px(*p) for p in list(ring) + [ring[0]]], fill=(255, 0, 255), width=3)
        d.line([to_px(*p) for p in list(poly) + [poly[0]]], fill=(255, 255, 0), width=1)
        out.save(a.overlay)


if __name__ == '__main__':
    main()
