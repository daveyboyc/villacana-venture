#!/usr/bin/env python3
"""Lay out the trees and mountains beyond the resort (data/backdrop.json) from the aerial and the photos.

The north-pool photos (IMG_2204-2206, one solved camera station on the roof south of the pool)
look out over the roofs at a dense skyline of trees, with the mountains behind. This places:

- **Trees where the aerial shows canopy** (public/map/ground.jpg, Esri World Imagery): dark green
  ground outside the resort block and inland of the beach, sampled on a 1 m grid and filled with
  trees spaced by their crown size. Species are not readable from the aerial: they are drawn from a
  mix seen in the photos (umbrella pines, broadleaf trees, palms, a few eucalyptus), with more tall
  eucalyptus in the belt beside the west wall of the resort (IMG_2206). Norfolk pines are only
  placed where the photos show them.
- **Trees picked in the photos:** the Norfolk Island pines over the roofs (IMG_2204, IMG_2205,
  IMG_2206) and the palms just north of the houses, each on the ray through its top pixel from the
  solved camera, at the distance where a tree of its usual height would reach that pixel.
- **A band of groves beyond the aerial,** inland only, thinning with distance (filled in, not seen).
- **The mountain ridge:** the line between sky and mountain, found column by column in the photos
  in the stretches where mountains, not trees or cloud, meet the sky, turned into compass bearing
  and elevation through the solved camera. Past the photographed bearings it falls away to low hills.

  python3 scripts/build_backdrop.py        writes data/backdrop.json (deterministic)

Needs numpy and Pillow.
"""
from __future__ import annotations

import json
import math
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from photo_pose import rotation  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "backdrop.json"
TURN = math.radians(26.0)
# The resort block in the turned frame (build_skeleton.py BLOCK), grown a little: its own garden
# trees are placed from the ground cover and by hand.
BLOCK = (-199.0, -81.0, -15.0, 161.0)
# Inland of this turned z is land; seaward of it are the beach and the sea.
SEA_Z = 165.0
# Stretches of each photo where the mountains (not trees, cloud or roofs) meet the sky: pixel columns.
SKYLINE = {"IMG_2204.jpg": [(590, 715), (790, 1035), (1085, 1500)], "IMG_2205.jpg": [(1000, 1245)], "IMG_2206.jpg": [(665, 745)]}
# Trees picked in the photos: top pixel, kind and its usual height in metres (sets the distance).
PICKED = [
    ("IMG_2204.jpg", (560, 107), "norfolk_pine", 25.0, "Norfolk Island pine over the roofs, left of centre (also IMG_2206 right)"),
    ("IMG_2204.jpg", (750, 110), "norfolk_pine", 24.0, "second Norfolk Island pine, centre of IMG_2204"),
    ("IMG_2205.jpg", (975, 72), "norfolk_pine", 26.0, "tall Norfolk Island pine right of centre in IMG_2205"),
    ("IMG_2205.jpg", (740, 190), "palm", 11.0, "palm north of the houses, IMG_2205"),
    ("IMG_2205.jpg", (905, 190), "palm", 11.0, "palm north of the houses, IMG_2205"),
    ("IMG_2205.jpg", (1290, 180), "palm", 12.0, "tall palm, right of IMG_2205"),
    ("IMG_2206.jpg", (770, 100), "palm", 14.0, "tall palm over the west roofs, IMG_2206"),
    ("IMG_2204.jpg", (1500, 150), "palm", 11.0, "palm, right of IMG_2204"),
]
# Model heights (SPRITE_SIZE in src/sprites.ts) and crown radii for spacing.
HEIGHT = {"umbrella_pine": 12.0, "norfolk_pine": 26.0, "eucalyptus": 20.0, "tree": 6.2, "palm": 10.0}
CROWN = {"umbrella_pine": 5.0, "norfolk_pine": 4.0, "eucalyptus": 4.5, "tree": 3.5, "palm": 3.0}
SCALE = {"umbrella_pine": (0.9, 1.25), "norfolk_pine": (0.8, 1.0), "eucalyptus": (0.95, 1.25), "tree": (1.0, 1.6), "palm": (0.9, 1.3)}
MIX = [("umbrella_pine", 0.42), ("tree", 0.3), ("palm", 0.2), ("eucalyptus", 0.08)]
WEST_MIX = [("eucalyptus", 0.4), ("umbrella_pine", 0.35), ("tree", 0.15), ("palm", 0.1)]


def turned(x, z):
    return x * math.cos(TURN) - z * math.sin(TURN), x * math.sin(TURN) + z * math.cos(TURN)


def in_block(x, z, grow=0.0):
    tx, tz = turned(x, z)
    return BLOCK[0] - grow <= tx <= BLOCK[2] + grow and BLOCK[1] - grow <= tz <= BLOCK[3] + grow


def choose(rng, mix):
    t, acc = rng.random(), 0.0
    for kind, w in mix:
        acc += w
        if t < acc:
            return kind
    return mix[-1][0]


def camera_ray(pose_record, u, v):
    pose, (w, h) = pose_record["solved"]["pose"], pose_record["image"]
    d = rotation(pose["yaw"], pose["pitch"], pose["roll"]) @ np.array([(u - w / 2) / pose["f"], -(v - h / 2) / pose["f"], -1.0])
    return np.array([pose["x"], pose["y"], pose["z"]]), d


def bearing_elevation(d):
    flat = math.hypot(d[0], d[2])
    return math.degrees(math.atan2(d[0], -d[2])) % 360, math.degrees(math.atan2(d[1], flat))


def skyline(poses):
    """(bearing, elevation) of the mountain/sky line in the given photo stretches."""
    points = []
    for photo, spans in SKYLINE.items():
        bright = np.asarray(Image.open(ROOT / "public/photos-ref" / photo).convert("L")).astype(float)
        for a, b in spans:
            for u in range(a, b, 4):
                col = bright[:320, u:u + 3].mean(1)
                sky = np.median(col[5:40])
                for v in range(40, 310):
                    if col[v] < sky - 28 and col[v:v + 6].mean() < sky - 28:
                        points.append(bearing_elevation(camera_ray(poses[photo], u + 1, v)[1]))
                        break
    return points


def tree_line(poses):
    """The highest elevation anything reaches against the sky, per whole degree of bearing, over every
    column of the three photos (trees, roofs or mountains). None where trees run off the top of the frame."""
    line = {}
    for photo in SKYLINE:
        bright = np.asarray(Image.open(ROOT / "public/photos-ref" / photo).convert("L")).astype(float)
        for u in range(0, bright.shape[1] - 3, 4):
            col = bright[:320, u:u + 3].mean(1)
            sky = np.median(col[5:40])
            hit = next((v for v in range(40, 310) if col[v] < sky - 28 and col[v:v + 6].mean() < sky - 28), None)
            if hit is None:
                continue
            b, e = bearing_elevation(camera_ray(poses[photo], u + 1, hit)[1])
            line[round(b) % 360] = None if hit <= 41 or line.get(round(b) % 360, 0) is None else max(e, line.get(round(b) % 360, -90))
    return line


def ridge(points):
    """One elevation per degree of bearing over the photographed stretch, falling to low hills beyond."""
    pts = sorted(((b - 360 if b > 180 else b), e) for b, e in points)  # bearings round north as -180..180
    lo, hi = math.floor(pts[0][0]), math.ceil(pts[-1][0])
    bins = {}
    for b, e in pts:
        bins.setdefault(round(b), []).append(e)
    known = {b: float(np.median(v)) for b, v in bins.items()}
    xs = sorted(known)
    out = []
    for b in [*range(-170, lo, 3), *range(lo, hi + 1), *range(hi + 3, 171, 3)]:
        if lo <= b <= hi:
            e = float(np.interp(b, xs, [known[x] for x in xs]))
            src = "photo" if min(abs(b - x) for x in xs) <= 1 else "interpolated"
        else:
            # Beyond the photographed bearings: low hills falling towards the coast on each side.
            edge, end = (lo, -170) if b < lo else (hi, 170)
            t = (b - edge) / (end - edge)
            e = known[min(xs, key=lambda x: abs(x - edge))] * (1 - t) ** 1.6 + 0.6 * t
            src = "inferred"
        out.append([b % 360, round(e, 2), src])
    return out


def main() -> None:
    poses = json.loads((ROOT / "data/photo_poses.json").read_text())["photos"]
    ground = json.loads((ROOT / "public/map/ground.json").read_text())
    rng = random.Random(2204)
    trees = []

    # Trees picked in the photos, on their rays.
    station = None
    for photo, (u, v), kind, height, note in PICKED:
        eye, d = camera_ray(poses[photo], u, v)
        station = eye
        b, e = bearing_elevation(d)
        dist = (height + 0.8 - eye[1]) / math.tan(math.radians(e))
        flat = np.array([d[0], d[2]]) / math.hypot(d[0], d[2])
        x, z = eye[0] + flat[0] * dist, eye[2] + flat[1] * dist
        trees.append([kind, round(x, 1), round(z, 1), round(height / HEIGHT[kind], 2), "photo"])

    # Trees where the aerial shows canopy.
    w, h = int(ground["maxX"] - ground["minX"]), int(ground["maxZ"] - ground["minZ"])
    rgb = np.asarray(Image.open(ROOT / "public/map/ground.jpg").convert("RGB").resize((w, h), Image.BOX)).astype(float)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    bright = (r + g + b) / 3
    canopy = ((g >= r + 2) & (g >= b - 4) & (bright < 105) & (bright > 25)).astype(np.uint8) * 255
    canopy = np.asarray(Image.fromarray(canopy).filter(ImageFilter.BoxBlur(2))).astype(float) / 255
    cells = [(i, j) for j in range(h) for i in range(w) if canopy[j, i] > 0.6]
    rng.shuffle(cells)
    placed = [(t[1], t[2], CROWN[t[0]]) for t in trees]
    grid = {}

    def free(x, z, radius):
        gx, gz = int(x // 10), int(z // 10)
        for dx in (-1, 0, 1):
            for dz in (-1, 0, 1):
                for px, pz, pr in grid.get((gx + dx, gz + dz), []):
                    if math.hypot(px - x, pz - z) < 0.8 * (radius + pr):
                        return False
        return True

    def keep(x, z, radius):
        grid.setdefault((int(x // 10), int(z // 10)), []).append((x, z, radius))

    for x, z, radius in placed:
        keep(x, z, radius)
    for i, j in cells:
        x, z = ground["minX"] + i + 0.5, ground["minZ"] + j + 0.5
        tx, tz = turned(x, z)
        if in_block(x, z, 3.0) or tz > SEA_Z:
            continue
        # The tall belt over the west wall (IMG_2206): beside the block, not north of it.
        mix = WEST_MIX if BLOCK[0] - 60 < tx < BLOCK[0] and tz > BLOCK[1] - 5 else MIX
        kind = choose(rng, mix)
        if not free(x, z, CROWN[kind]):
            continue
        keep(x, z, CROWN[kind])
        trees.append([kind, round(x, 1), round(z, 1), round(rng.uniform(*SCALE[kind]), 2), "aerial"])

    # Groves beyond the aerial, inland only, thinning with distance.
    centre = np.array([-110.0, 70.0])
    noise = [(rng.uniform(0, 2 * math.pi), rng.uniform(0.008, 0.02), rng.uniform(0, 2 * math.pi)) for _ in range(5)]
    for k in range(6000):
        a = rng.uniform(0, 2 * math.pi)
        dist = math.sqrt(rng.uniform(230 ** 2, 650 ** 2))
        x, z = centre[0] + math.sin(a) * dist, centre[1] - math.cos(a) * dist
        if ground["minX"] <= x <= ground["maxX"] and ground["minZ"] <= z <= ground["maxZ"]:
            continue
        tx, tz = turned(x, z)
        if tz > SEA_Z - 20:
            continue
        grove = sum(math.sin(x * f * math.cos(t) + z * f * math.sin(t) + ph) for t, f, ph in noise) / len(noise)
        if grove < 0.12 + (dist - 230) / 1400 or rng.random() > 0.55:
            continue
        kind = choose(rng, MIX)
        if not free(x, z, CROWN[kind] * 1.4):
            continue
        keep(x, z, CROWN[kind] * 1.4)
        trees.append([kind, round(x, 1), round(z, 1), round(rng.uniform(*SCALE[kind]), 2), "band"])

    # Nothing may stand above the line the photos show against the sky: trees in the photographed
    # bearings are lowered to it, and dropped where they would be hidden behind the roofs anyway.
    cap = tree_line(poses)
    eye = station
    kept = []
    for t in trees:
        kind, x, z, scale, src = t
        b = round(math.degrees(math.atan2(x - eye[0], -(z - eye[2])))) % 360
        limit = cap.get(b, None) if b in cap else None
        if src != "photo" and b in cap and limit is not None:
            room = eye[1] - 0.8 + math.hypot(x - eye[0], z - eye[2]) * math.tan(math.radians(limit + 0.3))
            if HEIGHT[kind] * scale > room:
                if room < 0.55 * HEIGHT[kind]:
                    continue
                t[3] = round(room / HEIGHT[kind], 2)
        kept.append(t)
    trees = kept
    lines = ridge(skyline(poses))
    out = {
        "about": "Trees and mountains beyond the resort, written by scripts/build_backdrop.py. Trees: [kind, x, z, scale, source] in map metres (+x east, +z south); scale is of the model height (src/sprites.ts SPRITE_SIZE). source: photo (on a ray from a solved camera, distance from the tree's usual height), aerial (where the aerial shows canopy; species from the mix in the photos), band (filled in beyond the aerial). Ridge: [compass bearing, elevation in degrees, source] seen from the solved north-pool station; photo where the photos show the mountain line, interpolated between, inferred beyond.",
        "block": list(BLOCK),
        "seaZ": SEA_Z,
        "station": [round(float(v), 2) for v in station],
        "ridgeDistance": 2200,
        "ridge": lines,
        "trees": trees,
    }
    OUT.write_text(json.dumps(out, separators=(",", ":")) + "\n")
    counts = {}
    for t in trees:
        counts[(t[0], t[4])] = counts.get((t[0], t[4]), 0) + 1
    print(f"{len(trees)} trees", dict(sorted(counts.items())), f"ridge {len(lines)} points,",
          sum(1 for p in lines if p[2] == 'photo'), "from the photos")


if __name__ == "__main__":
    main()
