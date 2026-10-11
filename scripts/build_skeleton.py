#!/usr/bin/env python3
"""Build the Villacana skeleton from the land registry.

Buildings (with floors) and pools come from the Catastro extract in data/catastro/.
The open ground between them is classified from the aerial photo into lawn,
planting, pool deck and paving, on the same metre grid.

Outputs:
  public/map/skeleton.json
  public/map/cover.png      one pixel per COVER_CELL metres, colour = ground class

Run with the project venv (needs Pillow and numpy):
  .venv/bin/python scripts/build_skeleton.py
"""

from __future__ import annotations

import gzip
import json
import math
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
CATASTRO = ROOT / "data" / "catastro"
MAP = ROOT / "public" / "map"

LAT0 = 36.4552
LON0 = -5.0500
R_EARTH = 6_378_137.0

# Degrees that turn the block square on screen, sea at the bottom.
VIEW_ROTATION = 26.0
# The Villacana block and its near surroundings, in the turned frame (metres).
AREA = (-215.0, -95.0, 75.0, 175.0)
# The block itself: between Loira, Pintor Dalí, the car park and the promenade.
BLOCK = (-196.0, -78.0, -18.0, 158.0)

FLOOR_HEIGHT = 3.0
COVER_CELL = 0.25
COVER_COLOURS = {
    "paving": (201, 160, 122),
    "lawn": (110, 168, 84),
    "planting": (58, 110, 62),
    "deck": (236, 226, 204),
}


def utm_to_latlon(x: float, y: float, lon0: float = -3.0) -> tuple[float, float]:
    """Inverse transverse Mercator for ETRS89 / UTM zone 30N."""
    a = 6378137.0
    f = 1 / 298.257222101
    k0 = 0.9996
    e2 = f * (2 - f)
    ep = e2 / (1 - e2)
    x -= 500000.0
    mu = (y / k0) / (a * (1 - e2 / 4 - 3 * e2**2 / 64 - 5 * e2**3 / 256))
    e1 = (1 - math.sqrt(1 - e2)) / (1 + math.sqrt(1 - e2))
    p1 = (
        mu
        + (3 * e1 / 2 - 27 * e1**3 / 32) * math.sin(2 * mu)
        + (21 * e1**2 / 16 - 55 * e1**4 / 32) * math.sin(4 * mu)
        + (151 * e1**3 / 96) * math.sin(6 * mu)
        + (1097 * e1**4 / 512) * math.sin(8 * mu)
    )
    n1 = a / math.sqrt(1 - e2 * math.sin(p1) ** 2)
    t1 = math.tan(p1) ** 2
    c1 = ep * math.cos(p1) ** 2
    r1 = a * (1 - e2) / (1 - e2 * math.sin(p1) ** 2) ** 1.5
    d = x / (n1 * k0)
    lat = p1 - (n1 * math.tan(p1) / r1) * (
        d * d / 2
        - (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * ep) * d**4 / 24
        + (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * ep - 3 * c1 * c1) * d**6 / 720
    )
    lon = (
        d
        - (1 + 2 * t1 + c1) * d**3 / 6
        + (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * ep + 24 * t1 * t1) * d**5 / 120
    ) / math.cos(p1)
    return math.degrees(lat), lon0 + math.degrees(lon)


def project(lat: float, lon: float) -> tuple[float, float]:
    x = math.radians(lon - LON0) * R_EARTH * math.cos(math.radians(LAT0))
    z = -math.radians(lat - LAT0) * R_EARTH
    return (x, z)


def turned(p: tuple[float, float]) -> tuple[float, float]:
    a = math.radians(VIEW_ROTATION)
    return (p[0] * math.cos(a) - p[1] * math.sin(a), p[0] * math.sin(a) + p[1] * math.cos(a))


def unturned(p: tuple[float, float]) -> tuple[float, float]:
    a = math.radians(-VIEW_ROTATION)
    return (p[0] * math.cos(a) - p[1] * math.sin(a), p[0] * math.sin(a) + p[1] * math.cos(a))


def centroid(ring: list[tuple[float, float]]) -> tuple[float, float]:
    return (sum(p[0] for p in ring) / len(ring), sum(p[1] for p in ring) / len(ring))


def area(ring: list[tuple[float, float]]) -> float:
    n = len(ring)
    return abs(sum(ring[i][0] * ring[(i + 1) % n][1] - ring[(i + 1) % n][0] * ring[i][1] for i in range(n))) / 2


def inside(box: tuple[float, float, float, float], p: tuple[float, float]) -> bool:
    x, z = turned(p)
    return box[0] <= x <= box[2] and box[1] <= z <= box[3]


def read_features(name: str, tag: str) -> list[dict]:
    text = gzip.open(CATASTRO / name, "rt", encoding="utf-8", errors="replace").read()
    out = []
    for block in re.findall(rf"<bu-ext2d:{tag} gml:id.*?</bu-ext2d:{tag}>", text, re.S):
        ident = re.search(r"<base:localId>([^<]+)", block)
        floors = re.search(r"numberOfFloorsAboveGround>(\d+)", block)
        rings = []
        for pos in re.findall(r"<gml:posList[^>]*>([^<]+)", block):
            v = [float(t) for t in pos.split()]
            ring = [project(*utm_to_latlon(v[i], v[i + 1])) for i in range(0, len(v), 2)]
            if ring[0] == ring[-1]:
                ring.pop()
            rings.append(ring)
        if not rings or not ident:
            continue
        out.append({"id": ident.group(1), "floors": int(floors.group(1)) if floors else 0, "rings": rings})
    return out


def rounded(ring: list[tuple[float, float]]) -> list[list[float]]:
    return [[round(x, 2), round(z, 2)] for x, z in ring]


def build_buildings() -> list[dict]:
    buildings = []
    for part in read_features("buildingpart.gml.gz", "BuildingPart"):
        ring = part["rings"][0]
        if not inside(AREA, centroid(ring)):
            continue
        entry = {"id": part["id"], "floors": part["floors"], "ring": rounded(ring)}
        if len(part["rings"]) > 1:
            entry["holes"] = [rounded(r) for r in part["rings"][1:]]
        buildings.append(entry)
    return buildings


def build_pools() -> list[dict]:
    found = []
    for item in read_features("otherconstruction.gml.gz", "OtherConstruction"):
        ring = item["rings"][0]
        if inside(BLOCK, centroid(ring)) or inside((-70.0, 40.0, -25.0, 110.0), centroid(ring)):
            found.append(ring)
    main = max(found, key=area)
    pools = []
    small = []
    for ring in found:
        if ring is main:
            pools.append({"id": "main", "kind": "main", "ring": rounded(ring)})
        elif math.dist(centroid(ring), centroid(main)) < 25:
            pools.append({"id": "toddler", "kind": "toddler", "ring": rounded(ring)})
        else:
            small.append(ring)
    small.sort(key=lambda r: turned(centroid(r))[1])
    names = ["north", "middle", "south"]
    if len(small) != 3:
        raise SystemExit(f"Expected 3 small pools in the block, found {len(small)}.")
    for name, ring in zip(names, small):
        pools.append({"id": name, "kind": "small", "ring": rounded(ring)})
    return pools


def build_cover(buildings: list[dict], pools: list[dict]) -> dict:
    """Classify the open ground of the area from the aerial photo."""
    ground = json.loads((MAP / "ground.json").read_text())
    photo = Image.open(MAP / "ground.jpg").convert("RGB")
    corners = [unturned(c) for c in ((AREA[0], AREA[1]), (AREA[2], AREA[1]), (AREA[2], AREA[3]), (AREA[0], AREA[3]))]
    min_x = max(min(c[0] for c in corners), ground["minX"])
    max_x = min(max(c[0] for c in corners), ground["maxX"])
    min_z = max(min(c[1] for c in corners), ground["minZ"])
    max_z = min(max(c[1] for c in corners), ground["maxZ"])
    width = int((max_x - min_x) / COVER_CELL)
    height = int((max_z - min_z) / COVER_CELL)

    # Resample the photo onto the cover grid.
    px = photo.width / (ground["maxX"] - ground["minX"])
    box = (
        (min_x - ground["minX"]) * px,
        (min_z - ground["minZ"]) * px,
        (max_x - ground["minX"]) * px,
        (max_z - ground["minZ"]) * px,
    )
    sample = photo.resize((width, height), Image.BILINEAR, box=box).filter(ImageFilter.GaussianBlur(1.2))
    rgb = np.asarray(sample).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    bright = (r + g + b) / 3
    green = (g > r * 1.04) & (g > b * 1.12)

    def cell(p: list[float]) -> tuple[float, float]:
        return ((p[0] - min_x) / COVER_CELL, (p[1] - min_z) / COVER_CELL)

    def mask(rings: list[list[list[float]]], grow: float = 0.0) -> np.ndarray:
        img = Image.new("L", (width, height), 0)
        draw = ImageDraw.Draw(img)
        for ring in rings:
            draw.polygon([cell(p) for p in ring], fill=255)
        if grow:
            img = img.filter(ImageFilter.MaxFilter(int(grow / COVER_CELL) * 2 + 1))
        return np.asarray(img) > 0

    near_pool = mask([p["ring"] for p in pools], grow=7.0)
    pale = (bright > 165) & (np.abs(r - b) < 45)

    cls = np.zeros((height, width), dtype=np.uint8)  # 0 paving
    cls[green & (bright >= 78)] = 1  # lawn
    cls[green & (bright < 78)] = 2  # planting
    cls[near_pool & pale & ~green] = 3  # deck

    # Smooth away speckle: each cell takes the commonest class around it.
    votes = []
    for k in range(4):
        layer = Image.fromarray(((cls == k) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))
        votes.append(np.asarray(layer).astype(np.float32))
    cls = np.argmax(np.stack(votes), axis=0).astype(np.uint8)
    # Every pool has a deck right round it, whatever the photo shows.
    cls[mask([p["ring"] for p in pools], grow=2.25)] = 3

    names = list(COVER_COLOURS)
    out = np.zeros((height, width, 3), dtype=np.uint8)
    for k, name in enumerate(names):
        out[cls == k] = COVER_COLOURS[name]
    Image.fromarray(out).save(MAP / "cover.png", optimize=True)
    return {
        "image": "/map/cover.png",
        "minX": round(min_x, 2),
        "maxX": round(min_x + width * COVER_CELL, 2),
        "minZ": round(min_z, 2),
        "maxZ": round(min_z + height * COVER_CELL, 2),
        "cell": COVER_CELL,
        "classes": {name: "#%02x%02x%02x" % COVER_COLOURS[name] for name in names},
    }


def main() -> None:
    buildings = build_buildings()
    pools = build_pools()
    cover = build_cover(buildings, pools)
    skeleton = {
        "origin": {"lat": LAT0, "lon": LON0},
        "viewRotation": VIEW_ROTATION,
        "floorHeight": FLOOR_HEIGHT,
        "area": rounded([unturned(c) for c in ((AREA[0], AREA[1]), (AREA[2], AREA[1]), (AREA[2], AREA[3]), (AREA[0], AREA[3]))]),
        "buildings": buildings,
        "pools": pools,
        "cover": cover,
        "sources": {
            "buildings": "Dirección General del Catastro, INSPIRE building parts, 2026-10-11",
            "pools": "Dirección General del Catastro, INSPIRE other constructions, 2026-10-11",
            "cover": "Classified from Esri World Imagery, zoom 19",
        },
    }
    (MAP / "skeleton.json").write_text(json.dumps(skeleton, separators=(",", ":")))
    kinds = [p["kind"] for p in pools]
    print(
        f"buildings {len(buildings)} | pools small {kinds.count('small')} main {kinds.count('main')} "
        f"toddler {kinds.count('toddler')} | cover {cover['maxX'] - cover['minX']:.0f} x {cover['maxZ'] - cover['minZ']:.0f} m"
    )
    for p in pools:
        print(f"  {p['id']:8s} {area([tuple(q) for q in p['ring']]):6.0f} m2")


if __name__ == "__main__":
    main()
