#!/usr/bin/env python3
"""Measure the stone deck round the three small pools and fit its width (data/pool_decks.json).

Two sources of deck-edge points (where the pale stone meets the lawn, at the foot of the glass
fence), both in the map frame (metres, +x east, +z south):

- Photos with solved cameras (data/photo_poses.json): pixels picked on the deck's outer edge,
  stored under "photoPicks", are cast through the camera onto the deck level (data/terrain.json
  decks). Each pixel is a few centimetres on the ground at 13-25 m.
- The aerial (public/map/ground.jpg, Esri World Imagery, about 0.24 m a pixel): registered to each
  pool by sliding its blue water over the registry water ring (best overlap, 5 cm steps; the aerial
  sits about a metre off the registry), then walked out along rays from the ring's centre to where
  pale stone gives way to lawn. Bearings marked "occluded" (tree canopy over the deck) are skipped.

The width at twelve compass bearings (scripts/pool_deck.py) is fitted to one set of points and
checked on the other: the north pool is fitted to the photo picks and checked on the aerial; the
middle and south pools have no solved camera, so they are fitted to every other aerial point and
checked on the rest. Uniform widths are scored too, to show whether one width would do.

  python3 scripts/measure_pool_decks.py            report only
  python3 scripts/measure_pool_decks.py --write    store widths and residuals, write the overlays

Overlays go to docs/reviews/north-pool-detail-pilot/deck-*.jpg. Needs numpy and Pillow.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from photo_pose import project, rotation  # noqa: E402
from pool_deck import STEP, DeckGrid, compass, inside, ring_distance  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "pool_decks.json"
OUT = ROOT / "docs" / "reviews" / "north-pool-detail-pilot"
BEARINGS = 12
UNIFORM = (1.2, 1.5, 1.8, 2.2)


def aerial_edges(ring, pool: dict, ground: dict, photo: Image.Image):
    """Register the aerial on the pool's water, then find the deck's outer edge along rays."""
    ring = np.asarray(ring, float)
    x0, z0 = ring.min(0) - 7
    x1, z1 = ring.max(0) + 7
    nx, nz = int((x1 - x0) / STEP), int((z1 - z0) / STEP)
    ppm = photo.width / (ground["maxX"] - ground["minX"])
    box = ((x0 - ground["minX"]) * ppm, (z0 - ground["minZ"]) * ppm, (x1 - ground["minX"]) * ppm, (z1 - ground["minZ"]) * ppm)
    rgb = np.asarray(photo.resize((nx, nz), Image.BILINEAR, box=box)).astype(float)
    water = (rgb[..., 2] > rgb[..., 0] + 40) & (rgb[..., 2] > rgb[..., 1] - 5)
    X, Z = np.meshgrid(x0 + (np.arange(nx) + 0.5) * STEP, z0 + (np.arange(nz) + 0.5) * STEP)
    pool_mask = inside(X, Z, ring)
    best = (-1.0, 0, 0)
    reach = int(2.5 / STEP)
    for coarse in (True, False):
        centre = (0, 0) if coarse else best[1:]
        span = range(-reach, reach + 1, 2) if coarse else range(-2, 3)
        for i in span:
            for j in span:
                di, dj = (i, j) if coarse else (centre[0] + i, centre[1] + j)
                w = np.roll(np.roll(water, -dj, 0), -di, 1)
                iou = (w & pool_mask).sum() / (w | pool_mask).sum()
                if iou > best[0]:
                    best = (float(iou), di, dj)
    iou, di, dj = best
    rgb = np.roll(np.roll(rgb, -dj, 0), -di, 1)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    bright = (r + g + b) / 3
    water = (b > r + 40) & (b > g - 5)
    pale = (bright > 150) & (np.abs(r - b) < 55) & ~water
    green = (g > r * 1.02) & (bright < 150)
    centre = ring.mean(0)
    skip = pool.get("occluded", [])
    points = []
    for bearing in np.arange(0, 360, 3.0):
        if any(a <= bearing <= c for a, c in skip):
            continue
        a = math.radians(bearing - 90)
        d = np.array([math.cos(a), math.sin(a)])
        ts = np.arange(0, 14, STEP / 2)
        p = centre + ts[:, None] * d
        ci, cj = ((p[:, 0] - x0) / STEP).astype(int), ((p[:, 1] - z0) / STEP).astype(int)
        ok = (ci >= 0) & (ci < nx) & (cj >= 0) & (cj < nz)
        ts, ci, cj = ts[ok], ci[ok], cj[ok]
        rim = ts[pool_mask[cj, ci]].max()
        pal, grn, brt = pale[cj, ci], green[cj, ci], bright[cj, ci]
        for q in range(len(ts)):
            if ts[q] <= rim or not pal[q]:
                continue
            if ts[q] - rim > 4.5:
                break
            beyond = (ts > ts[q]) & (ts <= ts[q] + 0.75)
            between = (ts > rim) & (ts <= ts[q])
            if beyond.any() and grn[beyond].mean() > 0.7 and not pal[beyond].any() and pal[between].mean() > 0.75:
                if brt[beyond].mean() >= 80:  # lawn, not tree shadow
                    points.append([float(centre[0] + ts[q] * d[0]), float(centre[1] + ts[q] * d[1])])
                break
    return points, {"shift": [round(di * STEP, 2), round(dj * STEP, 2)], "waterOverlap": round(iou, 3)}, (rgb, x0, z0)


def photo_edges(picks: dict, poses: dict, level: float):
    """Picked deck-edge pixels cast through each solved camera onto the deck level."""
    points = []
    for photo, sides in picks.items():
        record = poses[photo]
        pose, (w, h) = record["solved"]["pose"], record["image"]
        r = rotation(pose["yaw"], pose["pitch"], pose["roll"])
        eye = np.array([pose["x"], pose["y"], pose["z"]])
        for side, pixels in sides.items():
            for u, v in pixels:
                ray = r @ np.array([(u - w / 2) / pose["f"], -(v - h / 2) / pose["f"], -1.0])
                hit = eye + ray * (level - eye[1]) / ray[1]
                points.append({"photo": photo, "side": side, "pixel": [u, v], "point": [float(hit[0]), float(hit[2])]})
    return points


def residuals(grid: DeckGrid, field: np.ndarray, points) -> np.ndarray:
    """Measured minus modelled distance from the ring centre to the edge, along each point's bearing."""
    p = np.asarray(points, float).reshape(-1, 2)
    dx, dz = p[:, 0] - grid.centre[0], p[:, 1] - grid.centre[1]
    return np.array([math.hypot(a, b) - grid.edge_along(field, float(compass(a, b))) for a, b in zip(dx, dz)])


def fit(grid: DeckGrid, points, smoothing: float) -> np.ndarray:
    """Widths at the control bearings that put the band's edge through the points (outliers over 1 m dropped)."""
    p = np.asarray(points, float)
    sector = compass(p[:, 0] - grid.centre[0], p[:, 1] - grid.centre[1]) / (360 / BEARINGS)
    widths = np.full(BEARINGS, 1.8)
    for it in range(8):
        r = residuals(grid, grid.field(widths, smoothing), p)
        good = np.abs(r) < (2.0 if it < 2 else 1.0)
        for k in range(BEARINGS):
            near = np.clip(1 - np.abs(((sector - k + BEARINGS / 2) % BEARINGS) - BEARINGS / 2), 0, 1) * good
            if near.sum() > 0.5:
                widths[k] += 0.8 * np.sum(near * r) / near.sum()
        # Neighbouring bearings pull together a little: no bearing without points runs off on its own.
        widths = np.clip(0.7 * widths + 0.15 * (np.roll(widths, 1) + np.roll(widths, -1)), 0.9, 3.5)
    return widths


def stats(r: np.ndarray) -> dict:
    good = np.abs(r) < 1.0
    return {"points": int(len(r)), "within1m": int(good.sum()), "rmsM": round(float(np.sqrt(np.mean(r[good] ** 2))), 2),
            "medianM": round(float(np.median(r)), 2), "worstM": round(float(np.max(np.abs(r))), 2)}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    data = json.loads(DATA.read_text())
    skeleton = json.loads((ROOT / "public/map/skeleton.json").read_text())
    ground = json.loads((ROOT / "public/map/ground.json").read_text())
    aerial = Image.open(ROOT / "public/map/ground.jpg").convert("RGB")
    poses = json.loads((ROOT / "data/photo_poses.json").read_text())["photos"]
    decks = json.loads((ROOT / "data/terrain.json").read_text())["decks"]
    OUT.mkdir(parents=True, exist_ok=True)
    for pool in data["pools"]:
        ring = next(p["ring"] for p in skeleton["pools"] if p["id"] == pool["id"])
        grid = DeckGrid(ring, margin=8)
        air, registration, image = aerial_edges(ring, pool, ground, aerial)
        picks = photo_edges({k: v[pool["id"]] for k, v in data["photoPicks"].items() if pool["id"] in v}, poses, decks[pool["id"]])
        shot = [q["point"] for q in picks]
        fit_on, check_on = (shot, air) if shot else (air[0::2], air[1::2])
        widths = fit(grid, fit_on, pool["smoothing"])
        field = grid.field(widths, pool["smoothing"])
        rf, rc = residuals(grid, field, fit_on), residuals(grid, field, check_on)
        uniform = {}
        for w in UNIFORM:
            ru = residuals(grid, grid.field([w] * BEARINGS, pool["smoothing"]), fit_on)
            uniform[f"{w:.1f}"] = {"rmsM": round(float(np.sqrt(np.mean(ru ** 2))), 2), "medianM": round(float(np.median(ru)), 2)}
        measured = ring_distance(*np.asarray(fit_on + check_on, float).T, ring)
        print(f"{pool['id']}: aerial shift {registration['shift']} m, water overlap {registration['waterOverlap']}; "
              f"{len(shot)} photo and {len(air)} aerial edge points; widths {np.round(widths, 2).tolist()}")
        print(f"  fit {stats(rf)}  check {stats(rc)}")
        print("  uniform widths, rms against the fitted points: " + ", ".join(f"{k} m {v['rmsM']}" for k, v in uniform.items()))
        pool["widths"] = [{"bearing": k * 360 // BEARINGS, "width": round(float(w), 2)} for k, w in enumerate(widths)]
        pool["measurement"] = {
            "fittedOn": "photo picks through the solved cameras" if shot else "every other aerial edge point",
            "checkedOn": "aerial edge points" if shot else "the other aerial edge points",
            "aerialRegistration": registration, "fit": stats(rf), "check": stats(rc),
            "measuredWidthM": {"min": round(float(measured.min()), 2), "median": round(float(np.median(measured)), 2), "max": round(float(measured.max()), 2)},
            "uniformWidths": uniform,
        }
        if not args.write:
            continue
        outline = grid.outline(widths, pool["smoothing"])
        # Aerial overlay: water ring red, fitted deck edge yellow, aerial edge points magenta, photo points cyan.
        rgb, x0, z0 = image
        k = 30
        tile = Image.fromarray(rgb.astype(np.uint8)).resize((int(rgb.shape[1] * STEP * k), int(rgb.shape[0] * STEP * k)), Image.BICUBIC)
        draw = ImageDraw.Draw(tile)
        at = lambda p: ((p[0] - x0) * k, (p[1] - z0) * k)
        draw.line([at(p) for p in ring] + [at(ring[0])], fill=(255, 0, 0), width=2)
        draw.line([at(p) for p in outline] + [at(outline[0])], fill=(255, 230, 0), width=3)
        for p in air:
            u, v = at(p)
            draw.ellipse([u - 4, v - 4, u + 4, v + 4], outline=(255, 0, 255), width=2)
        for p in shot:
            u, v = at(p)
            draw.rectangle([u - 4, v - 4, u + 4, v + 4], outline=(0, 255, 255), width=2)
        draw.text((8, 8), f"{pool['id']} pool deck: Esri World Imagery (public/map/ground.jpg), shifted {registration['shift']} m onto the registry water ring. North up.", fill=(255, 255, 255))
        tile.save(OUT / f"deck-aerial-{pool['id']}.jpg", quality=88)
        # Photo overlays: picks, fitted edge and the uniform-width candidates projected through the camera.
        for photo in sorted({q["photo"] for q in picks}):
            record = poses[photo]
            pose, size = record["solved"]["pose"], record["image"]
            im = Image.open(ROOT / "public/photos-ref" / photo).convert("RGB")
            draw = ImageDraw.Draw(im)
            y = decks[pool["id"]]
            def curve(points, colour, width):
                uv, depth = project(pose, size, np.array([[p[0], y, p[1]] for p in points + points[:1]], float))
                draw.line([tuple(q) for q, d in zip(uv, depth) if d > 0], fill=colour, width=width)
            for w, colour in zip(UNIFORM, [(80, 160, 255), (120, 255, 120), (255, 160, 40), (255, 80, 80)]):
                curve(grid.outline([w] * BEARINGS, pool["smoothing"], 180), colour, 1)
            curve(outline, (255, 230, 0), 3)
            for q in picks:
                if q["photo"] == photo:
                    u, v = q["pixel"]
                    draw.ellipse([u - 5, v - 5, u + 5, v + 5], outline=(255, 0, 255), width=2)
            draw.text((10, 10), "Deck edge: picked (magenta), fitted (yellow); uniform 1.2 blue, 1.5 green, 1.8 orange, 2.2 m red", fill=(255, 255, 255))
            us = [q["pixel"][0] for q in picks if q["photo"] == photo]
            vs = [q["pixel"][1] for q in picks if q["photo"] == photo]
            im.crop((max(0, min(us) - 80), max(0, min(vs) - 120), min(im.width, max(us) + 80), min(im.height, max(vs) + 60))).save(OUT / f"deck-{photo.replace('.jpg', '')}-{pool['id']}.jpg", quality=88)
    if args.write:
        DATA.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
        print(f"wrote {DATA.relative_to(ROOT)} and overlays in {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
