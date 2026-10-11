#!/usr/bin/env python3
"""Trace the Villacana pools off a georeferenced aerial photo.

The photo is Esri World Imagery at zoom 19. Each pixel maps to a Web
Mercator tile, and the same origin used by the game (36.4552 N, 5.0500 W,
+x east, +z south) turns that pixel into metres. The water is flood-filled
inside a fixed window for each pool, so rerunning this script produces the
same outlines.

Outputs:
  public/map/pools-traced.json   rings the game builds
  /tmp/align/ground-truth.jpg    streets and traced water on the aerial photo
"""

from __future__ import annotations

import json
import math
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "map" / "pools-traced.json"
TILE_CACHE = Path("/tmp/sat-tiles")
PROOF = Path("/tmp/align/ground-truth.jpg")

LAT0 = 36.4552
LON0 = -5.0500
EARTH = 6_378_137.0
ZOOM = 19
X0, X1 = 254784, 254790
Y0, Y1 = 205057, 205063
TILE = 256
N = 2**ZOOM
DIRS = [(1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1)]

# Windows in full-image pixels. Each window holds one resort pool.
WINDOWS = [
    {"name": "North pool", "kind": "flower", "box": (590, 450, 710, 570), "take": 1},
    {"name": "Middle pool", "kind": "flower", "box": (790, 740, 920, 860), "take": 1},
    {"name": "South pool", "kind": "flower", "box": (950, 1130, 1080, 1270), "take": 1},
    {"name": "Main pool", "kind": "main", "box": (1220, 720, 1420, 900), "take": 1},
    {"name": "Shallow pool", "kind": "baby", "box": (1220, 720, 1420, 900), "take": 2},
]


def local_to_ll(x: float, z: float) -> tuple[float, float]:
    lat = LAT0 - (z / EARTH) * 180 / math.pi
    lon = LON0 + (x / (EARTH * math.cos(math.radians(LAT0)))) * 180 / math.pi
    return lat, lon


def ll_to_px(lat: float, lon: float) -> tuple[float, float]:
    xt = (lon + 180.0) / 360.0 * N
    lat_rad = math.radians(lat)
    yt = (1.0 - math.log(math.tan(lat_rad) + 1 / math.cos(lat_rad)) / math.pi) / 2.0 * N
    return (xt - X0) * TILE, (yt - Y0) * TILE


def px_to_local(px: float, py: float) -> tuple[float, float]:
    xt = X0 + px / TILE
    yt = Y0 + py / TILE
    lon = xt / N * 360.0 - 180.0
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * yt / N))))
    x = math.radians(lon - LON0) * EARTH * math.cos(math.radians(LAT0))
    z = -math.radians(lat - LAT0) * EARTH
    return x, z


def download_tiles() -> None:
    TILE_CACHE.mkdir(parents=True, exist_ok=True)
    url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    request_headers = {"User-Agent": "VillacanaRoam/1.0 (pool alignment)"}
    for tx in range(X0, X1 + 1):
        for ty in range(Y0, Y1 + 1):
            dest = TILE_CACHE / f"{ZOOM}_{tx}_{ty}.jpg"
            if dest.exists():
                continue
            req = urllib.request.Request(url.format(z=ZOOM, y=ty, x=tx), headers=request_headers)
            with urllib.request.urlopen(req, timeout=40) as response:
                dest.write_bytes(response.read())


def stitch() -> Image.Image:
    width = (X1 - X0 + 1) * TILE
    height = (Y1 - Y0 + 1) * TILE
    image = Image.new("RGB", (width, height))
    for tx in range(X0, X1 + 1):
        for ty in range(Y0, Y1 + 1):
            tile = Image.open(TILE_CACHE / f"{ZOOM}_{tx}_{ty}.jpg")
            image.paste(tile, ((tx - X0) * TILE, (ty - Y0) * TILE))
    return image


def is_water(rgb: tuple[int, int, int]) -> bool:
    red, green, blue = rgb
    return blue > 145 and green > 120 and red < 205 and (blue - red) > 28 and (green - red) > 5


def components(image: Image.Image, box: tuple[int, int, int, int]) -> list[list[tuple[int, int]]]:
    pixels = image.load()
    x0, y0, x1, y1 = box
    mask = {(x, y) for y in range(y0, y1) for x in range(x0, x1) if is_water(pixels[x, y])}
    seen: set[tuple[int, int]] = set()
    found: list[list[tuple[int, int]]] = []
    for seed in mask:
        if seed in seen:
            continue
        stack = [seed]
        seen.add(seed)
        cells: list[tuple[int, int]] = []
        while stack:
            x, y = stack.pop()
            cells.append((x, y))
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nxt = (x + dx, y + dy)
                if nxt in mask and nxt not in seen:
                    seen.add(nxt)
                    stack.append(nxt)
        if len(cells) > 40:
            found.append(cells)
    found.sort(key=len, reverse=True)
    return found


def contour(cells: list[tuple[int, int]]) -> list[tuple[int, int]]:
    pixels = set(cells)
    start = min(pixels)
    point = start
    back = (start[0] - 1, start[1])
    ring = [point]
    for _ in range(len(cells) * 8):
        dx, dy = back[0] - point[0], back[1] - point[1]
        try:
            begin = DIRS.index((dx, dy))
        except ValueError:
            begin = 0
        nxt = None
        for step in range(1, 9):
            direction = (begin + step) % 8
            candidate = (point[0] + DIRS[direction][0], point[1] + DIRS[direction][1])
            if candidate in pixels:
                previous = (begin + step - 1) % 8
                back = (point[0] + DIRS[previous][0], point[1] + DIRS[previous][1])
                nxt = candidate
                break
        if nxt is None or (nxt == start and len(ring) > 10):
            break
        ring.append(nxt)
        point = nxt
    return ring


def simplify(points: list[tuple[int, int]], epsilon: float) -> list[tuple[int, int]]:
    if len(points) < 3:
        return points

    def distance(point, start, end) -> float:
        px, py = point
        ax, ay = start
        bx, by = end
        dx, dy = bx - ax, by - ay
        length = dx * dx + dy * dy or 1
        t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / length))
        return math.hypot(px - (ax + dx * t), py - (ay + dy * t))

    start, end = points[0], points[-1]
    worst, index = 0.0, 0
    for i in range(1, len(points) - 1):
        dist = distance(points[i], start, end)
        if dist > worst:
            worst, index = dist, i
    if worst <= epsilon:
        return [start, end]
    return simplify(points[: index + 1], epsilon)[:-1] + simplify(points[index:], epsilon)


def trace(image: Image.Image) -> list[dict]:
    pools = []
    for spec in WINDOWS:
        comps = components(image, spec["box"])
        if len(comps) < spec["take"]:
            raise SystemExit(f"No water found for {spec['name']}")
        ring_px = simplify(contour(comps[spec["take"] - 1]), 1.5)
        ring = [[round(v, 2) for v in px_to_local(x + 0.5, y + 0.5)] for x, y in ring_px]
        if spec["kind"] == "baby":
            # The colour cut keeps only the dark centre. Grow it onto the pale rim.
            cx = sum(point[0] for point in ring) / len(ring)
            cz = sum(point[1] for point in ring) / len(ring)
            ring = [[round(cx + (x - cx) * 1.5, 2), round(cz + (z - cz) * 1.5, 2)] for x, z in ring]
        pools.append({"name": spec["name"], "kind": spec["kind"], "ring": ring})
        print(f"  {spec['name']:16} {len(ring_px):3} vertices from {len(comps[spec['take'] - 1])} px")
    return pools


def proof(image: Image.Image, pools: list[dict], roads: list[dict]) -> None:
    canvas = image.copy()
    draw = ImageDraw.Draw(canvas)
    for road in roads:
        pts = []
        for x, z in road["points"]:
            lat, lon = local_to_ll(x, z)
            pts.append(ll_to_px(lat, lon))
        if len(pts) >= 2:
            colour = (255, 210, 40) if road.get("name") else (255, 255, 255)
            draw.line(pts, fill=colour, width=2)
    for pool in pools:
        pts = []
        for x, z in pool["ring"]:
            lat, lon = local_to_ll(x, z)
            pts.append(ll_to_px(lat, lon))
        draw.line(pts + [pts[0]], fill=(255, 0, 170), width=3)
    PROOF.parent.mkdir(parents=True, exist_ok=True)
    canvas.crop((280, 280, 1550, 1600)).save(PROOF, quality=90)


def main() -> None:
    download_tiles()
    image = stitch()
    pools = trace(image)
    payload = {
        "source": "Esri World Imagery zoom 19, water traced inside fixed windows",
        "projection": {
            "zoom": ZOOM,
            "tileOrigin": [X0, Y0],
            "tileSize": TILE,
            "origin": {"lat": LAT0, "lon": LON0},
            "axes": "+x east, +z south, metres",
        },
        "pools": pools,
    }
    OUT.write_text(json.dumps(payload))
    roads = json.loads((ROOT / "public" / "map" / "villacana.json").read_text()).get("roads", [])
    if roads:
        proof(image, pools, roads)
    print(f"wrote {OUT}")
    if PROOF.exists():
        print(f"proof {PROOF}")


if __name__ == "__main__":
    main()
