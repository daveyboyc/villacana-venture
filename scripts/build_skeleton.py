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
from build_seafront import build_seafront

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
# Pools whose courtyard has been laid out. The south pool opens onto the beach
# lawn and needs its own treatment.
COURTYARD_POOLS = ("north", "middle")
# Courtyard rings, in metres out from the pool's rounded outline.
DECK_WIDTH = 2.4
# The crazy-paving path runs round the outside of the lawn, at the foot of the garden walls.
PATH_WIDTH = 1.5
COURTYARD_REACH = 30.0
# Paved strip left in front of the houses for their porches.
PORCH_DEPTH = 2.5
# Low garden walls edge the lawn; one block every WALL_STEP metres, with a
# gateway every WALL_GATE_EVERY metres or so.
WALL_STEP = 0.5
WALL_GATE_EVERY = 9.0
WALL_GATE_WIDTH = 1.6
# Gaps between houses narrower than twice this are lanes, not courtyard.
LANE_HALF_WIDTH = 3.75

COVER_COLOURS = {
    "paving": (201, 160, 122),
    "lawn": (110, 168, 84),
    "planting": (58, 110, 62),
    "deck": (236, 226, 204),
    "path": (178, 160, 136),
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


def convex_hull(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    pts = sorted(set(points))

    def half(seq: list[tuple[float, float]]) -> list[tuple[float, float]]:
        out: list[tuple[float, float]] = []
        for p in seq:
            while len(out) >= 2 and (out[-1][0] - out[-2][0]) * (p[1] - out[-2][1]) - (out[-1][1] - out[-2][1]) * (p[0] - out[-2][0]) <= 0:
                out.pop()
            out.append(p)
        return out[:-1]

    return half(pts) + half(pts[::-1])


def distance_to_ring(wx: np.ndarray, wz: np.ndarray, ring: list[tuple[float, float]]) -> np.ndarray:
    """Metres from each cell to a convex ring; zero inside it."""
    best = np.full(wx.shape, np.inf, dtype=np.float32)
    within = np.ones(wx.shape, dtype=bool)
    turn = 0.0
    n = len(ring)
    for i in range(n):
        (ax, az), (bx, bz) = ring[i], ring[(i + 1) % n]
        dx, dz = bx - ax, bz - az
        t = np.clip(((wx - ax) * dx + (wz - az) * dz) / (dx * dx + dz * dz), 0, 1)
        best = np.minimum(best, np.hypot(wx - (ax + t * dx), wz - (az + t * dz)))
        cross = dx * (wz - az) - dz * (wx - ax)
        turn = turn or float(np.sign(dx * (ring[(i + 2) % n][1] - az) - dz * (ring[(i + 2) % n][0] - ax)))
        within &= cross * turn >= 0
    best[within] = 0
    return best


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
    # The registry draws curves as short straight runs; round them off.
    for pool in pools:
        ring = [tuple(p) for p in pool["ring"]]
        pool["centre"] = [round(v, 2) for v in centroid(ring)]
        pool["ring"] = rounded(smooth_ring(ring))
    return pools


STREET_TYPES = {"CL": "Calle", "AV": "Avenida", "PS": "Paseo", "PZ": "Plaza", "CM": "Camino"}

# Lanes and roads, traced by hand along the gaps between the registry's
# buildings. Coordinates are in the turned frame (block square, sea at the
# bottom), in metres. Names are as Dave's map screenshots show them. Each is a
# first tracing, good to a few metres, to be corrected on the master map.
LANES = [
    ("Calle Loira", 6.0, [(-215, -100), (-60, -100)]),
    ("Calle Pintor Dalí", 6.0, [(-212, -100), (-212, 160)]),
    # The access lane down the west side of the car park.
    ("Calle Pintor Picasso", 4.0, [(-70.8, -100), (-70.8, 6)]),
    ("Calle Elena", 2.2, [(-155, -70), (-155, -22)]),
    ("Calle Alberto", 2.2, [(-122, -95), (-122, -18)]),
    # Eva is in two parts, either side of the middle pool's courtyard.
    ("Calle Eva", 2.2, [(-205, 37), (-172, 37)]),
    ("Calle Eva", 2.2, [(-142, 23), (-82, 22)]),
    ("Calle Patricia", 2.2, [(-205, 67), (-103, 67)]),
    ("Calle Silvia", 2.2, [(-160, 68), (-160, 106)]),
    ("Calle Jorge", 2.2, [(-205, 107), (-112, 107)]),
    ("Calle Teodoro Rojo", 2.2, [(-115, 66), (-115, 112)]),
    ("Calle Guillermo", 2.2, [(-80, 62), (-80, 112)]),
]


# Open ground that is neither building, pool nor garden, traced by hand from the
# aerial photo. Turned frame, metres, like LANES.
AREAS = [
    # The car park east of the houses. Calle Pintor Picasso is its western aisle.
    ("car_park", "Car park", [(-73, -98), (-41.5, -98), (-41.5, -12), (-40, -5), (-40, 6), (-73, 6)]),
    # The round planter at its southern end.
    ("planter", "", [(-56 + 4.5 * math.cos(i * math.pi / 8), -13 + 4.5 * math.sin(i * math.pi / 8)) for i in range(16)]),
    # The formal garden south of the car park.
    ("planter", "", [(-55, 9), (-45, 9), (-45, 26), (-55, 26)]),
]
# Rows of parking bays: where the row runs, and which way the cars nose in.
PARKING_ROWS = [
    ((-68.7, -96), (-68.7, -3), "east"),
    ((-57, -90), (-57, -17), "west"),
    ((-57, -90), (-57, -17), "east"),
    ((-61, 3), (-50, 3), "north"),
]
# The kerb down the middle of the car park.
KERBS = [[(-47.8, -98), (-47.8, -20)]]


# Named places not covered by a street, area or seafront outline. Turned frame.
# "approximate" positions were read off a map screenshot by eye and need Dave to
# confirm them.
PLACES = [
    ("Bistro Enrique's", -72, 52, "approximate"),
    ("90 Miles", -52, 46, "approximate"),
]


def build_areas() -> dict:
    return {
        "places": [{"name": name, "at": rounded([unturned((x, z))])[0], "trust": trust} for name, x, z, trust in PLACES],
        "areas": [{"kind": kind, "name": name, "ring": rounded([unturned(p) for p in ring]), "trust": "traced"} for kind, name, ring in AREAS],
        "parkingRows": [{"points": rounded([unturned(a), unturned(b)]), "nose": nose} for a, b, nose in PARKING_ROWS],
        "kerbs": [rounded([unturned(p) for p in line]) for line in KERBS],
    }


def registry_street_plots() -> dict[str, list[tuple[float, float]]]:
    """Where the registry puts each street's plots. It has no lane shapes."""
    text = gzip.open(CATASTRO / "address.gml.gz", "rt", encoding="utf-8", errors="replace").read()
    names = {}
    for ident, block in re.findall(r'<ad:ThoroughfareName gml:id="([^"]+)">(.*?)</ad:ThoroughfareName>', text, re.S):
        raw = re.search(r"<gn:text>([^<]+)", block).group(1).strip()
        kind, _, rest = raw.partition(" ")
        if kind in STREET_TYPES:
            names[ident] = f"{STREET_TYPES[kind]} {rest.title()}"
    plots: dict[str, list[tuple[float, float]]] = {}
    for block in re.findall(r"<ad:Address gml:id.*?</ad:Address>", text, re.S):
        pos = re.search(r"<gml:pos>([\d.]+) ([\d.]+)", block)
        street = next((names[i] for i in re.findall(r'xlink:href="#([^"]+)"', block) if i in names), None)
        if not pos or not street:
            continue
        p = project(*utm_to_latlon(float(pos.group(1)), float(pos.group(2))))
        if inside(AREA, p):
            plots.setdefault(street, []).append(p)
    return plots


def build_streets() -> list[dict]:
    plots = registry_street_plots()
    streets = []
    used = set()
    for name, width, line in LANES:
        entry = {"name": name, "width": width, "points": rounded([unturned(p) for p in line]), "trust": "traced"}
        # The registry's plots for a street should lie close to its lane.
        match = next((k for k in plots if k.split()[-1] in name.split()), None)
        if match:
            used.add(match)
            entry["registryPlots"] = rounded(plots[match])
        streets.append(entry)
    for name, pts in sorted(plots.items()):
        if name not in used:
            # Named in the registry but not yet matched to a lane on the ground.
            streets.append({"name": name, "registryPlots": rounded(pts), "trust": "unplaced"})
    return streets


def smooth_ring(ring: list[tuple[float, float]], passes: int = 2) -> list[tuple[float, float]]:
    """Round a ring's corners by cutting each one off; the outline keeps its shape."""
    for _ in range(passes):
        out = []
        for i in range(len(ring)):
            (ax, az), (bx, bz) = ring[i], ring[(i + 1) % len(ring)]
            out.append((ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25))
            out.append((ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75))
        ring = out
    return ring


def build_props() -> list[dict]:
    """Every hand-placed object: trees, plants, pool fittings, furniture.

    They live in data/objects.json, one per line: an id, a kind, a position in
    map metres, and how the position is known. The master map's edit mode and
    scripts/apply_map_edits.py change that file; nothing is placed in code.
    """
    return json.loads((ROOT / "data" / "objects.json").read_text())


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
    for k in range(4):  # the path class is laid out below, not read from the photo
        layer = Image.fromarray(((cls == k) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))
        votes.append(np.asarray(layer).astype(np.float32))
    cls = np.argmax(np.stack(votes), axis=0).astype(np.uint8)
    # Pools without a laid-out courtyard keep a plain deck right round them for now.
    cls[mask([p["ring"] for p in pools if p["id"] not in COURTYARD_POOLS], grow=2.25)] = 3

    # These pools sit in a courtyard laid out the same way: a stone deck, lawn
    # right up to it, and a stone path round the outside by the garden walls.
    built = mask([b["ring"] for b in buildings])
    walls: list[list[float]] = []
    gates: list[list[float]] = []
    gate_cells: set[tuple[int, int]] = set()
    wide = ~mask([b["ring"] for b in buildings], grow=LANE_HALF_WIDTH)
    open_ground = ~mask([b["ring"] for b in buildings], grow=PORCH_DEPTH)
    yy, xx = np.mgrid[0:height, 0:width]
    wx = min_x + (xx + 0.5) * COVER_CELL
    wz = min_z + (yy + 0.5) * COVER_CELL
    for pool in pools:
        if pool["id"] not in COURTYARD_POOLS:
            continue
        hull = convex_hull([tuple(p) for p in pool["ring"]])
        dist = distance_to_ring(wx, wz, hull)
        # Spread out from the pool through open ground, stopping at the houses.
        reach = wide & (dist < COURTYARD_REACH)
        yard = (dist == 0) & reach
        while True:
            grown = yard.copy()
            grown[1:, :] |= yard[:-1, :]
            grown[:-1, :] |= yard[1:, :]
            grown[:, 1:] |= yard[:, :-1]
            grown[:, :-1] |= yard[:, 1:]
            grown &= reach
            if grown.sum() == yard.sum():
                break
            yard = grown
        # Bring the lawn back out towards the houses, leaving the porch strip paved.
        spread = Image.fromarray((yard * 255).astype(np.uint8)).filter(
            ImageFilter.MaxFilter(int((LANE_HALF_WIDTH - PORCH_DEPTH) / COVER_CELL) * 2 + 1)
        )
        yard = (np.asarray(spread) > 0) & open_ground & (dist < COURTYARD_REACH)
        cls[(cls == 3) & (dist < COURTYARD_REACH)] = 0
        # Lawn everywhere; the courtyard's own trees are placed by hand in PROPS.
        cls[yard] = 1
        inner = Image.fromarray((yard * 255).astype(np.uint8)).filter(
            ImageFilter.MinFilter(int(PATH_WIDTH / COVER_CELL) * 2 + 1)
        )
        cls[yard & ~(np.asarray(inner) > 0) & (dist < COURTYARD_REACH - PATH_WIDTH - 0.5)] = 4

        # A low white wall runs where the lawn meets the paved strip by the houses.
        edge = np.zeros_like(yard)
        edge[1:, :] |= ~open_ground[:-1, :]
        edge[:-1, :] |= ~open_ground[1:, :]
        edge[:, 1:] |= ~open_ground[:, :-1]
        edge[:, :-1] |= ~open_ground[:, 1:]
        edge &= yard
        taken: set[tuple[int, int]] = set()
        for iy, ix in zip(*np.nonzero(edge)):
            x, z = float(wx[iy, ix]), float(wz[iy, ix])
            key = (round(x / WALL_STEP), round(z / WALL_STEP))
            if key in taken:
                continue
            taken.add(key)
            if ((x + z) % WALL_GATE_EVERY) < WALL_GATE_WIDTH:
                gate = (round(x / 4), round(z / 4))
                if gate not in gate_cells and abs(((x + z) % WALL_GATE_EVERY) - WALL_GATE_WIDTH / 2) < 0.3:
                    gate_cells.add(gate)
                    gates.append([round(x, 2), round(z, 2)])
                continue
            walls.append([round(x, 2), round(z, 2)])
        cls[(dist < DECK_WIDTH) & ~built] = 3

    # Main-pool lawn and curving terracotta walks, placed approximately from
    # Dave's web references. Keep registry buildings and their porch strips clear.
    main_layout = json.loads((ROOT / "data" / "main_pool.json").read_text())
    lawn_ring = rounded([unturned(tuple(p)) for p in main_layout["lawn"]])
    cls[mask([lawn_ring]) & open_ground] = 1
    path_image = Image.new("L", (width, height), 0)
    path_draw = ImageDraw.Draw(path_image)
    for line in main_layout["paths"]:
        path_draw.line([cell(unturned(tuple(p))) for p in line], fill=255,
                       width=round(main_layout["pathWidth"] / COVER_CELL), joint="curve")
    cls[(np.asarray(path_image) > 0) & ~built] = 0

    # The web references show a continuous cream apron joining the main and
    # toddler pools, with terracotta paths beyond it. Registry outlines stay fixed.
    main_deck = mask([p["ring"] for p in pools if p["kind"] in ("main", "toddler")], grow=3.0)
    cls[main_deck & ~built] = 3

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
        "gardenWalls": walls,
        "gardenGates": gates,
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
        "streets": build_streets(),
        "seafront": build_seafront(buildings, VIEW_ROTATION),
        **build_areas(),
        "poolNames": [{"name": f"{p['id'].title()} pool", "at": p["centre"]} for p in pools if p["kind"] != "toddler"],
        "props": build_props(),
        "gardenWalls": cover.pop("gardenWalls"),
        "gardenGates": cover.pop("gardenGates"),
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
