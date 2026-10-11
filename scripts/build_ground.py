#!/usr/bin/env python3
"""Bake the aerial photo that the game uses as its ground.

The image is Esri World Imagery, zoom 19. Pixel (0, 0) is the north-west
corner of the tile block. The same origin as the streets (36.4552 N,
5.0500 W, +x east, +z south) fixes every corner in metres, so the photo
cannot drift relative to the roads.

The script also scores the roads: a sample every few metres must land on
pavement-coloured pixels. A shift of more than a few metres would mean the
grid is wrong.
"""

from __future__ import annotations

import json
import math
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
TILE_CACHE = Path("/tmp/sat-tiles")
OUT_IMAGE = ROOT / "public" / "map" / "ground.jpg"
OUT_JSON = ROOT / "public" / "map" / "ground.json"
PROOF = Path("/tmp/align/alignment-proof.jpg")

LAT0 = 36.4552
LON0 = -5.0500
EARTH = 6_378_137.0
ZOOM = 19
X0, X1 = 254784, 254790
Y0, Y1 = 205057, 205063
TILE = 256
N = 2**ZOOM


def download() -> None:
    TILE_CACHE.mkdir(parents=True, exist_ok=True)
    url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    headers = {"User-Agent": "VillacanaRoam/1.0 (ground alignment)"}
    for tx in range(X0, X1 + 1):
        for ty in range(Y0, Y1 + 1):
            dest = TILE_CACHE / f"{ZOOM}_{tx}_{ty}.jpg"
            if dest.exists():
                continue
            req = urllib.request.Request(url.format(z=ZOOM, y=ty, x=tx), headers=headers)
            with urllib.request.urlopen(req, timeout=40) as response:
                dest.write_bytes(response.read())


def stitch() -> Image.Image:
    width = (X1 - X0 + 1) * TILE
    height = (Y1 - Y0 + 1) * TILE
    image = Image.new("RGB", (width, height))
    for tx in range(X0, X1 + 1):
        for ty in range(Y0, Y1 + 1):
            image.paste(Image.open(TILE_CACHE / f"{ZOOM}_{tx}_{ty}.jpg"), ((tx - X0) * TILE, (ty - Y0) * TILE))
    return image


def px_to_local(px: float, py: float) -> tuple[float, float]:
    xt = X0 + px / TILE
    yt = Y0 + py / TILE
    lon = xt / N * 360.0 - 180.0
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * yt / N))))
    x = math.radians(lon - LON0) * EARTH * math.cos(math.radians(LAT0))
    z = -math.radians(lat - LAT0) * EARTH
    return x, z


def local_to_px(x: float, z: float) -> tuple[float, float]:
    lat = LAT0 - (z / EARTH) * 180 / math.pi
    lon = LON0 + (x / (EARTH * math.cos(math.radians(LAT0)))) * 180 / math.pi
    xt = (lon + 180.0) / 360.0 * N
    lat_rad = math.radians(lat)
    yt = (1.0 - math.log(math.tan(lat_rad) + 1 / math.cos(lat_rad)) / math.pi) / 2.0 * N
    return (xt - X0) * TILE, (yt - Y0) * TILE


def roadlike(rgb: tuple[int, int, int]) -> bool:
    red, green, blue = rgb
    if green > red + 12 and green > blue:
        return False
    if blue > red + 25 and blue > 140:
        return False
    spread = max(red, green, blue) - min(red, green, blue)
    tone = (red + green + blue) / 3
    return spread < 38 and 70 < tone < 190


def alignment(image: Image.Image, roads: list[dict]) -> float:
    pixels = image.load()
    width, height = image.size
    samples = []
    for road in roads:
        if road["kind"] in ("footway", "path", "steps"):
            continue
        pts = road["points"]
        for i in range(len(pts) - 1):
            ax, az = pts[i]
            bx, bz = pts[i + 1]
            length = math.hypot(bx - ax, bz - az)
            steps = max(1, int(length / 8))
            for step in range(steps):
                t = step / steps
                samples.append((ax + (bx - ax) * t, az + (bz - az) * t))
    hits = 0
    seen = 0
    for x, z in samples:
        px, py = local_to_px(x, z)
        ix, iy = int(px), int(py)
        if not (2 <= ix < width - 2 and 2 <= iy < height - 2):
            continue
        seen += 1
        if any(roadlike(pixels[ix + a, iy + b]) for a in (-2, 0, 2) for b in (-2, 0, 2)):
            hits += 1
    return hits / seen if seen else 0.0


def main() -> None:
    download()
    image = stitch()
    nw = px_to_local(0, 0)
    se = px_to_local(image.width, image.height)
    payload = {
        "image": "/map/ground.jpg",
        "minX": round(nw[0], 2),
        "maxX": round(se[0], 2),
        "minZ": round(nw[1], 2),
        "maxZ": round(se[1], 2),
        "source": "Esri World Imagery zoom 19",
    }
    OUT_IMAGE.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUT_IMAGE, quality=82, optimize=True)
    OUT_JSON.write_text(json.dumps(payload))

    map_path = ROOT / "public" / "map" / "villacana.json"
    score = None
    if map_path.exists():
        roads = json.loads(map_path.read_text())["roads"]
        score = alignment(image, roads)
        draw = ImageDraw.Draw(image)
        for road in roads:
            pts = [local_to_px(x, z) for x, z in road["points"]]
            if len(pts) >= 2:
                colour = (255, 220, 40) if road.get("name") else (255, 255, 255)
                draw.line(pts, fill=colour, width=2)
        PROOF.parent.mkdir(parents=True, exist_ok=True)
        image.crop((280, 280, 1550, 1600)).save(PROOF, quality=88)
        print(f"alignment {score:.3f}  proof {PROOF}")
        if score < 0.65:
            raise SystemExit("Streets do not sit on the photo. The ground grid is wrong.")
    print(f"wrote {OUT_IMAGE} ({OUT_IMAGE.stat().st_size / 1024:.0f} KB)")
    print("bounds", payload)


if __name__ == "__main__":
    main()
