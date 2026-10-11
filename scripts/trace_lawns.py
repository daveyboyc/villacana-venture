#!/usr/bin/env python3
"""Trace the open lawns of the Villacana block from the same aerial photo as the pools.

A cell counts as lawn only when the photo is green there and the surrounding
ground is green too, so the wide courtyards and the beach lawn are kept and
the thin gaps between roofs are not. The cells use the same metre origin as
the streets and the pools.

Outputs:
  public/map/lawns-traced.json
  /tmp/align/lawns-proof.jpg
"""

from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "map" / "lawns-traced.json"
SATELLITE = Path("/tmp/align/satellite.jpg")
PROOF = Path("/tmp/align/lawns-proof.jpg")

LAT0 = 36.4552
LON0 = -5.0500
EARTH = 6_378_137.0
ZOOM = 19
X0, Y0 = 254784, 205057
TILE = 256
N = 2**ZOOM
CELL = 2.0
DIRS = [(1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1)]

# Calle Pintor Dalí, northwest end, and the two axes of the block.
DALI = (-240.4, -6.0)
ALONG = (0.46427387071558657, 0.8856916918266575)
ACROSS = (0.8856916918266575, -0.46427387071558657)


def local_to_ll(x: float, z: float) -> tuple[float, float]:
    lat = LAT0 - (z / EARTH) * 180 / math.pi
    lon = LON0 + (x / (EARTH * math.cos(math.radians(LAT0)))) * 180 / math.pi
    return lat, lon


def ll_to_px(lat: float, lon: float) -> tuple[float, float]:
    xt = (lon + 180.0) / 360.0 * N
    lat_rad = math.radians(lat)
    yt = (1.0 - math.log(math.tan(lat_rad) + 1 / math.cos(lat_rad)) / math.pi) / 2.0 * N
    return (xt - X0) * TILE, (yt - Y0) * TILE


def local_to_px(x: float, z: float) -> tuple[float, float]:
    lat, lon = local_to_ll(x, z)
    return ll_to_px(lat, lon)


def on_property(x: float, z: float) -> bool:
    vx, vz = x - DALI[0], z - DALI[1]
    along = vx * ALONG[0] + vz * ALONG[1]
    across = vx * ACROSS[0] + vz * ACROSS[1]
    return -15 <= along <= 290 and -6 <= across <= 185


def is_green(rgb: tuple[int, int, int]) -> bool:
    red, green, blue = rgb
    return green > 55 and green > red + 4 and green + 12 > blue and red < 185 and blue < 190


def coast_inland(x: float, z: float, coast: list[list[float]]) -> float:
    best = 1e9
    closest = (x, z)
    normal = (0.0, -1.0)
    land = (-80.0, 20.0)
    for i in range(len(coast) - 1):
        ax, az = coast[i]
        bx, bz = coast[i + 1]
        dx, dz = bx - ax, bz - az
        length = dx * dx + dz * dz or 1
        t = max(0.0, min(1.0, ((x - ax) * dx + (z - az) * dz) / length))
        cx, cz = ax + dx * t, az + dz * t
        dist = math.hypot(x - cx, z - cz)
        if dist < best:
            best = dist
            closest = (cx, cz)
            norm = math.hypot(dx, dz) or 1
            nx, nz = -dz / norm, dx / norm
            mx, mz = (ax + bx) / 2, (az + bz) / 2
            if (land[0] - mx) * nx + (land[1] - mz) * nz < 0:
                nx, nz = -nx, -nz
            normal = (nx, nz)
    signed = (x - closest[0]) * normal[0] + (z - closest[1]) * normal[1]
    return best if signed >= 0 else -best


def lawn_cells(image: Image.Image, coast: list[list[float]]) -> set[tuple[float, float]]:
    pixels = image.load()
    width, height = image.size
    green: set[tuple[float, float]] = set()
    xs = [x * CELL for x in range(int(-230 / CELL), int(55 / CELL))]
    zs = [z * CELL for z in range(int(-80 / CELL), int(250 / CELL))]
    for z in zs:
        for x in xs:
            if not on_property(x, z) or coast_inland(x, z, coast) < 22:
                continue
            px, py = local_to_px(x + CELL / 2, z + CELL / 2)
            ix, iy = int(px), int(py)
            if not (0 <= ix < width and 0 <= iy < height):
                continue
            if is_green(pixels[ix, iy]):
                green.add((x, z))
    lawn: set[tuple[float, float]] = set()
    radius = 5.0
    for x, z in green:
        near = 0
        total = 0
        for dx in range(-4, 5, 2):
            for dz in range(-4, 5, 2):
                if dx * dx + dz * dz > radius * radius:
                    continue
                total += 1
                if (x + dx, z + dz) in green:
                    near += 1
        if total and near / total >= 0.34:
            lawn.add((x, z))
    # One cell of growth so a courtyard reads as one lawn, not speckles.
    grown = set(lawn)
    for x, z in lawn:
        for dx, dz in ((CELL, 0), (-CELL, 0), (0, CELL), (0, -CELL)):
            grown.add((x + dx, z + dz))
    return {cell for cell in grown if on_property(*cell) and coast_inland(*cell, coast) >= 18}


def components(cells: set[tuple[float, float]]) -> list[list[tuple[float, float]]]:
    remaining = set(cells)
    found: list[list[tuple[float, float]]] = []
    while remaining:
        seed = remaining.pop()
        stack = [seed]
        group = [seed]
        while stack:
            x, z = stack.pop()
            for dx, dz in ((CELL, 0), (-CELL, 0), (0, CELL), (0, -CELL)):
                nxt = (x + dx, z + dz)
                if nxt in remaining:
                    remaining.remove(nxt)
                    stack.append(nxt)
                    group.append(nxt)
        if len(group) * CELL * CELL >= 50:
            found.append(group)
    found.sort(key=len, reverse=True)
    return found


def contour(cells: list[tuple[float, float]]) -> list[tuple[float, float]]:
    pixels = {(round(x / CELL), round(z / CELL)) for x, z in cells}
    start = min(pixels)
    point = start
    back = (start[0] - 1, start[1])
    ring = [point]
    for _ in range(len(pixels) * 8):
        dx, dy = back[0] - point[0], back[1] - point[1]
        dirs = DIRS
        try:
            begin = dirs.index((dx, dy))
        except ValueError:
            begin = 0
        nxt = None
        for step in range(1, 9):
            direction = (begin + step) % 8
            candidate = (point[0] + dirs[direction][0], point[1] + dirs[direction][1])
            if candidate in pixels:
                previous = (begin + step - 1) % 8
                back = (point[0] + dirs[previous][0], point[1] + dirs[previous][1])
                nxt = candidate
                break
        if nxt is None or (nxt == start and len(ring) > 6):
            break
        ring.append(nxt)
        point = nxt
    return [(index[0] * CELL, index[1] * CELL) for index in ring]


def simplify(points: list[tuple[float, float]], epsilon: float) -> list[tuple[float, float]]:
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


def main() -> None:
    if not SATELLITE.exists():
        raise SystemExit("Missing /tmp/align/satellite.jpg. Run scripts/trace_pools.py first.")
    image = Image.open(SATELLITE).convert("RGB")
    coast = json.loads((ROOT / "public" / "map" / "villacana.json").read_text())["coast"]
    cells = lawn_cells(image, coast)
    groups = components(cells)
    lawns = []
    for index, group in enumerate(groups, 1):
        ring = simplify(contour(group), 2.2)
        if len(ring) < 4:
            continue
        lawns.append(
            {
                "name": f"Lawn {index}",
                "ring": [[round(x, 1), round(z, 1)] for x, z in ring],
            }
        )
    OUT.write_text(
        json.dumps(
            {
                "source": "Esri World Imagery zoom 19, open lawn inside the Villacana block",
                "cellMetres": CELL,
                "lawns": lawns,
            }
        )
    )
    print(f"wrote {OUT}  lawns {len(lawns)}  cells {len(cells)}")
    for lawn in lawns:
        print(f"  {lawn['name']:10} {len(lawn['ring'])} corners")

    proof = image.crop((280, 280, 1550, 1600)).copy()
    draw = ImageDraw.Draw(proof, "RGBA")
    for x, z in cells:
        px, py = local_to_px(x, z)
        draw.rectangle((px - 281, py - 281, px - 279, py - 279), fill=(40, 210, 60, 180))
    PROOF.parent.mkdir(parents=True, exist_ok=True)
    proof.save(PROOF, quality=88)
    print(f"proof {PROOF}")


def local_to_px(x: float, z: float) -> tuple[float, float]:
    lat, lon = local_to_ll(x, z)
    xt = (lon + 180.0) / 360.0 * N
    lat_rad = math.radians(lat)
    yt = (1.0 - math.log(math.tan(lat_rad) + 1 / math.cos(lat_rad)) / math.pi) / 2.0 * N
    return (xt - X0) * TILE, (yt - Y0) * TILE


if __name__ == "__main__":
    main()
