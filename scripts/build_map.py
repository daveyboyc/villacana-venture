#!/usr/bin/env python3
"""Turn the OpenStreetMap extract of Villacana into a game map.

The extract is data/villacana.osm.gz (ODbL, © OpenStreetMap contributors).
Regenerate it with:

  curl -A "VillacanaRoam/1.0" -o data/villacana.osm \\
    "https://api.openstreetmap.org/api/0.6/map?bbox=-5.0605,36.4495,-5.0425,36.4635"
  gzip -f data/villacana.osm
  python3 scripts/build_map.py
"""

from __future__ import annotations

import gzip
import json
import math
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OSM_PATH = ROOT / "data" / "villacana.osm.gz"
OUT_PATH = ROOT / "public" / "map" / "villacana.json"
PREVIEW_PATH = Path("/tmp/villacana-preview.png")

LAT0 = 36.4552
LON0 = -5.0500
R_EARTH = 6_378_137.0

# Local metres: +x east, +z south, origin on the lanes of Villacana.
MIN_X, MAX_X = -450.0, 340.0
MIN_Z, MAX_Z = -340.0, 340.0
# A point that is definitely inland, used to orient the coastline.
LAND_REF = (-80.0, 20.0)

ROAD_WIDTH = {
    "residential": 7.0,
    "living_street": 5.2,
    "service": 4.2,
    "tertiary": 9.0,
    "unclassified": 6.5,
    "pedestrian": 4.0,
    "footway": 2.2,
    "path": 1.8,
    "steps": 1.6,
    "track": 3.2,
}
SKIP_HIGHWAYS = {"trunk", "trunk_link", "motorway", "motorway_link", "busway"}
HOUSE_CLEARANCE_KINDS = {
    "residential",
    "living_street",
    "service",
    "tertiary",
    "unclassified",
    "pedestrian",
}
HOUSE_ALONG = ("residential", "living_street")


def project(lat: float, lon: float) -> tuple[float, float]:
    x = math.radians(lon - LON0) * R_EARTH * math.cos(math.radians(LAT0))
    z = -math.radians(lat - LAT0) * R_EARTH
    return (x, z)


def dist(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def ring_area(pts: list[tuple[float, float]]) -> float:
    a = 0.0
    for i in range(len(pts)):
        x1, z1 = pts[i]
        x2, z2 = pts[(i + 1) % len(pts)]
        a += x1 * z2 - x2 * z1
    return a / 2.0


def point_in_ring(x: float, z: float, ring: list[tuple[float, float]]) -> bool:
    inside = False
    n = len(ring)
    for i in range(n):
        x1, z1 = ring[i]
        x2, z2 = ring[(i + 1) % n]
        if ((z1 > z) != (z2 > z)) and (
            x < (x2 - x1) * (z - z1) / (z2 - z1 + 1e-12) + x1
        ):
            inside = not inside
    return inside


def closest_on_seg(
    px: float, pz: float, ax: float, az: float, bx: float, bz: float
) -> tuple[float, float, float]:
    dx, dz = bx - ax, bz - az
    l2 = dx * dx + dz * dz
    t = 0.0 if l2 < 1e-8 else clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0.0, 1.0)
    cx, cz = ax + dx * t, az + dz * t
    return cx, cz, math.hypot(px - cx, pz - cz)


def douglas(pts: list[tuple[float, float]], eps: float) -> list[tuple[float, float]]:
    if len(pts) < 3:
        return pts
    ax, az = pts[0]
    bx, bz = pts[-1]
    worst_i = 1
    worst = -1.0
    for i in range(1, len(pts) - 1):
        _, _, d = closest_on_seg(pts[i][0], pts[i][1], ax, az, bx, bz)
        if d > worst:
            worst = d
            worst_i = i
    if worst <= eps:
        return [pts[0], pts[-1]]
    left = douglas(pts[: worst_i + 1], eps)
    right = douglas(pts[worst_i:], eps)
    return left[:-1] + right


def clean_open(pts: list[tuple[float, float]], min_step: float) -> list[tuple[float, float]]:
    out: list[tuple[float, float]] = []
    for p in pts:
        if not out or dist(out[-1], p) >= min_step:
            out.append(p)
    return out


def clean_ring(pts: list[tuple[float, float]]) -> list[tuple[float, float]] | None:
    if len(pts) < 3:
        return None
    if dist(pts[0], pts[-1]) <= 1.2:
        pts = pts[:-1]
    elif dist(pts[0], pts[-1]) > 4.0:
        return None
    pts = clean_open(pts, 0.35)
    if len(pts) < 3:
        return None
    if abs(ring_area(pts)) < 16:
        return None
    return pts


def in_bounds(x: float, z: float, margin: float = 0.0) -> bool:
    return MIN_X - margin <= x <= MAX_X + margin and MIN_Z - margin <= z <= MAX_Z + margin


def coast_query(
    x: float, z: float, coast: list[tuple[float, float]]
) -> tuple[float, tuple[float, float]]:
    """Signed distance to the coastline. Positive is inland."""
    best = 1e18
    normal = (0.0, -1.0)
    closest = (x, z)
    for i in range(len(coast) - 1):
        ax, az = coast[i]
        bx, bz = coast[i + 1]
        cx, cz, d = closest_on_seg(x, z, ax, az, bx, bz)
        d2 = d * d
        if d2 < best:
            best = d2
            dx, dz = bx - ax, bz - az
            length = math.hypot(dx, dz) or 1.0
            n1 = (-dz / length, dx / length)
            mx, mz = (ax + bx) / 2.0, (az + bz) / 2.0
            if (LAND_REF[0] - mx) * n1[0] + (LAND_REF[1] - mz) * n1[1] < 0:
                n1 = (-n1[0], -n1[1])
            normal = n1
            closest = (cx, cz)
    signed = (x - closest[0]) * normal[0] + (z - closest[1]) * normal[1]
    dist_abs = math.sqrt(best)
    return (dist_abs if signed >= 0 else -dist_abs), normal


def clip_polyline(
    pts: list[tuple[float, float]], margin: float
) -> list[list[tuple[float, float]]]:
    runs: list[list[tuple[float, float]]] = []
    current: list[tuple[float, float]] = []
    for p in pts:
        if in_bounds(p[0], p[1], margin):
            current.append(p)
        elif current:
            runs.append(current)
            current = []
    if current:
        runs.append(current)
    return [r for r in runs if len(r) >= 2]


def intersect_x(pts: list[tuple[float, float]], x: float) -> tuple[float, float] | None:
    for i in range(len(pts) - 1):
        x1, z1 = pts[i]
        x2, z2 = pts[i + 1]
        if (x1 - x) * (x2 - x) <= 0 and abs(x2 - x1) > 1e-6:
            t = (x - x1) / (x2 - x1)
            if -0.02 <= t <= 1.02:
                return (x, z1 + t * (z2 - z1))
    return None


def load_osm() -> tuple[dict[str, tuple[float, float, dict[str, str]]], list[tuple[dict[str, str], list[str]]]]:
    with gzip.open(OSM_PATH, "rb") as handle:
        root = ET.parse(handle).getroot()
    nodes: dict[str, tuple[float, float, dict[str, str]]] = {}
    ways: list[tuple[dict[str, str], list[str]]] = []
    for el in root:
        if el.tag == "node":
            tags = {t.get("k", ""): t.get("v", "") for t in el.findall("tag")}
            nodes[el.get("id", "")] = (float(el.get("lat", "0")), float(el.get("lon", "0")), tags)
        elif el.tag == "way":
            tags = {t.get("k", ""): t.get("v", "") for t in el.findall("tag")}
            refs = [n.get("ref", "") for n in el.findall("nd")]
            ways.append((tags, refs))
    return nodes, ways


def way_points(
    refs: list[str], nodes: dict[str, tuple[float, float, dict[str, str]]]
) -> list[tuple[float, float]]:
    pts = []
    for ref in refs:
        if ref in nodes:
            lat, lon, _ = nodes[ref]
            pts.append(project(lat, lon))
    return pts


def centroid(pts: list[tuple[float, float]]) -> tuple[float, float]:
    return (
        sum(p[0] for p in pts) / len(pts),
        sum(p[1] for p in pts) / len(pts),
    )


def round_ring(pts: list[tuple[float, float]]) -> list[list[float]]:
    return [[round(p[0], 1), round(p[1], 1)] for p in pts]


def building_height(kind: str, area: float) -> float:
    if kind == "shed":
        return 3.0
    if kind in {"hotel", "apartments"} or area > 900:
        return 11.0
    if area > 500:
        return 8.0
    return 6.2


def door_color(x: float, z: float) -> str:
    colors = ["#c4542c", "#2458a6", "#2c6b4a", "#d7a441", "#8d3d55"]
    return colors[int(abs(x) * 3 + abs(z) * 7) % len(colors)]


def nearest_road_point(
    x: float,
    z: float,
    roads: list[dict],
) -> tuple[float, float, float, float] | None:
    best = None
    best_d = 1e18
    for road in roads:
        pts = road["raw"]
        for i in range(len(pts) - 1):
            cx, cz, d = closest_on_seg(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])
            if d < best_d:
                dx, dz = pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]
                length = math.hypot(dx, dz) or 1.0
                best = (cx, cz, dx / length, dz / length)
                best_d = d
    return best


def clearance_to_roads(x: float, z: float, roads: list[dict]) -> float:
    best = 1e18
    for road in roads:
        if road["kind"] not in HOUSE_CLEARANCE_KINDS:
            continue
        pts = road["raw"]
        half = road["width"] / 2.0
        for i in range(len(pts) - 1):
            _, _, d = closest_on_seg(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])
            best = min(best, d - half)
    return best


def make_rect(
    cx: float, cz: float, yaw: float, width: float, depth: float
) -> list[tuple[float, float]]:
    forward = (math.sin(yaw), -math.cos(yaw))
    right = (math.cos(yaw), math.sin(yaw))
    hw, hd = width / 2.0, depth / 2.0
    corners = []
    for sx, sz in ((-hw, -hd), (hw, -hd), (hw, hd), (-hw, hd)):
        corners.append(
            (
                cx + right[0] * sx + forward[0] * sz,
                cz + right[1] * sx + forward[1] * sz,
            )
        )
    return corners


def main() -> None:
    nodes, ways = load_osm()

    roads: list[dict] = []
    buildings_raw: list[tuple[dict[str, str], list[tuple[float, float]]]] = []
    pools_raw: list[list[tuple[float, float]]] = []
    gardens: list[dict] = []
    pitches: list[dict] = []
    beaches: list[dict] = []
    coast_pts: list[tuple[float, float]] | None = None

    for tags, refs in ways:
        pts = way_points(refs, nodes)
        if len(pts) < 2:
            continue
        if tags.get("natural") == "coastline":
            coast_pts = pts
            continue
        cx, cz = centroid(pts)
        if not in_bounds(cx, cz, 80) and not any(in_bounds(p[0], p[1], 20) for p in pts):
            continue
        if "highway" in tags and tags["highway"] not in SKIP_HIGHWAYS:
            kind = tags["highway"]
            if kind not in ROAD_WIDTH:
                continue
            for run in clip_polyline(pts, 30):
                simple = douglas(clean_open(run, 1.0), 1.1)
                if len(simple) >= 2:
                    roads.append(
                        {
                            "name": tags.get("name", ""),
                            "kind": kind,
                            "width": ROAD_WIDTH[kind],
                            "raw": simple,
                        }
                    )
            continue
        if "building" in tags:
            ring = clean_ring(pts)
            if ring is None:
                continue
            c = centroid(ring)
            if not in_bounds(c[0], c[1], 8):
                continue
            area = abs(ring_area(ring))
            if area > 2800 or area < 18:
                continue
            buildings_raw.append((tags, ring))
            continue
        if tags.get("leisure") == "swimming_pool":
            ring = clean_ring(pts)
            if ring and in_bounds(centroid(ring)[0], centroid(ring)[1], 5):
                pools_raw.append(ring)
            continue
        if tags.get("natural") == "beach":
            ring = clean_ring(pts)
            if ring and abs(ring_area(ring)) < 80_000:
                c = centroid(ring)
                if in_bounds(c[0], c[1], 40):
                    beaches.append({"name": tags.get("name", ""), "ring": ring})
            continue
        leisure = tags.get("leisure", "")
        landuse = tags.get("landuse", "")
        if leisure == "pitch":
            ring = clean_ring(pts)
            if ring and abs(ring_area(ring)) < 8_000 and in_bounds(*centroid(ring), 10):
                pitches.append({"sport": tags.get("sport", ""), "ring": ring})
            continue
        if leisure in {"park", "garden"} or landuse == "grass":
            ring = clean_ring(pts)
            if ring and 40 < abs(ring_area(ring)) < 25_000 and in_bounds(*centroid(ring), 10):
                gardens.append({"kind": leisure or landuse, "ring": ring})

    if not coast_pts:
        raise SystemExit("No coastline in the extract")

    # Keep the shoreline that crosses the playable rectangle, west to east.
    coast_window = [p for p in coast_pts if MIN_X - 80 <= p[0] <= MAX_X + 80]
    coast_window = clean_open(coast_window, 2.0)
    if coast_window[0][0] > coast_window[-1][0]:
        coast_window.reverse()
    west = intersect_x(coast_window, MIN_X)
    east = intersect_x(coast_window, MAX_X)
    if west is None or east is None:
        raise SystemExit("Coastline does not cross the play area")
    coast = [west]
    for p in coast_window:
        if MIN_X < p[0] < MAX_X:
            coast.append(p)
    coast.append(east)
    coast = clean_open(coast, 1.5)

    def signed(x: float, z: float) -> float:
        return coast_query(x, z, coast)[0]

    land_d = signed(*LAND_REF)
    sea_d = signed(220.0, 300.0)
    if land_d < 40 or sea_d > -5:
        raise SystemExit(f"Coast orientation looks wrong (land {land_d:.1f}, sea {sea_d:.1f})")

    # Outlines traced from the georeferenced aerial photo. See scripts/trace_pools.py.
    traced_path = ROOT / "public" / "map" / "pools-traced.json"
    traced = json.loads(traced_path.read_text())
    pool_specs = [
        {
            "name": pool["name"],
            "kind": pool["kind"],
            "ring": [(point[0], point[1]) for point in pool["ring"]],
        }
        for pool in traced["pools"]
    ]
    pool_rings = [spec["ring"] for spec in pool_specs]
    ground = json.loads((ROOT / "public" / "map" / "ground.json").read_text())

    def on_photo(x: float, z: float) -> bool:
        return ground["minX"] <= x <= ground["maxX"] and ground["minZ"] <= z <= ground["maxZ"]
    lawn_path = ROOT / "public" / "map" / "lawns-traced.json"
    lawn_specs = [
        {"name": lawn["name"], "ring": [(point[0], point[1]) for point in lawn["ring"]]}
        for lawn in json.loads(lawn_path.read_text())["lawns"]
    ]
    lawn_rings = [lawn["ring"] for lawn in lawn_specs]

    osm_buildings: list[dict] = []
    osm_rings: list[list[tuple[float, float]]] = []
    for tags, ring in buildings_raw:
        c = centroid(ring)
        if signed(c[0], c[1]) < 4:
            continue
        area = abs(ring_area(ring))
        kind = tags.get("building", "yes")
        near = nearest_road_point(c[0], c[1], roads)
        if near:
            rx, rz, _tx, _tz = near
            face = math.atan2(rx - c[0], -(rz - c[1]))
        else:
            face = 0.0
            rx, rz = c[0], c[1] + 1
        # Door sits on the footprint edge closest to the lane.
        best_mid = ring[0]
        best_d = 1e18
        for i in range(len(ring)):
            a = ring[i]
            b = ring[(i + 1) % len(ring)]
            mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
            d = dist(mid, (rx, rz))
            if d < best_d:
                best_d = d
                best_mid = mid
        osm_rings.append(ring)
        osm_buildings.append(
            {
                "name": tags.get("name", ""),
                "kind": kind,
                "height": building_height(kind, area),
                "ring": ring,
                "inferred": False,
                "face": face,
                "width": 0.0,
                "depth": 0.0,
                "door": {
                    "x": best_mid[0],
                    "z": best_mid[1],
                    "yaw": face,
                    "color": door_color(c[0], c[1]),
                },
            }
        )

    # Typical terraces along residential lanes that OpenStreetMap has not traced house by house.
    homes: list[dict] = []
    candidates: list[tuple[float, dict]] = []
    for road in roads:
        if road["kind"] not in HOUSE_ALONG:
            continue
        pts = road["raw"]
        length = sum(dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))
        if length < 18:
            continue
        step = 12.6
        walked = step * 0.5
        while walked < length - 4:
            acc = 0.0
            point = pts[0]
            tangent = (1.0, 0.0)
            for i in range(len(pts) - 1):
                seg = dist(pts[i], pts[i + 1])
                if acc + seg >= walked:
                    t = (walked - acc) / (seg or 1)
                    point = (
                        pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t,
                        pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t,
                    )
                    dx, dz = pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]
                    norm = math.hypot(dx, dz) or 1
                    tangent = (dx / norm, dz / norm)
                    break
                acc += seg
            right = (-tangent[1], tangent[0])
            setback = road["width"] / 2.0 + 1.7 + 3.7
            for side in (-1.0, 1.0):
                cx = point[0] + right[0] * setback * side
                cz = point[1] + right[1] * setback * side
                # Face the lane.
                face = math.atan2(-right[0] * side, -(-right[1] * side))
                rank = math.hypot(cx - LAND_REF[0], cz - LAND_REF[1])
                candidates.append((rank, {"x": cx, "z": cz, "face": face}))
            walked += step

    candidates.sort(key=lambda item: item[0])
    width, depth = 8.2, 7.4
    for _rank, cand in candidates:
        if len(homes) >= 170:
            break
        cx, cz, face = cand["x"], cand["z"], cand["face"]
        if not in_bounds(cx, cz, -6):
            continue
        # The aerial photo is the ground here. Invented terraces would hide it.
        if on_photo(cx, cz):
            continue
        if signed(cx, cz) < 20:
            continue
        ring = make_rect(cx, cz, face, width, depth)
        if any(signed(p[0], p[1]) < 12 for p in ring):
            continue
        if any(clearance_to_roads(p[0], p[1], roads) < 0.85 for p in ring):
            continue
        blocked = False
        for other in osm_rings:
            if any(point_in_ring(p[0], p[1], other) for p in ring):
                blocked = True
                break
            if point_in_ring(centroid(other)[0], centroid(other)[1], ring):
                blocked = True
                break
        if blocked:
            continue
        for other in homes:
            if dist((cx, cz), centroid(other["ring"])) < 10.2:
                blocked = True
                break
        if blocked:
            continue
        if any(point_in_ring(pt[0], pt[1], pool) for pool in pool_rings for pt in (*ring, (cx, cz))):
            continue
        if any(point_in_ring(pt[0], pt[1], lawn) for lawn in lawn_rings for pt in (*ring, (cx, cz))):
            continue
        # Door on the side that faces the lane (local +depth).
        forward = (math.sin(face), -math.cos(face))
        door = (cx + forward[0] * (depth / 2), cz + forward[1] * (depth / 2))
        homes.append(
            {
                "name": "",
                "kind": "house",
                "height": 6.0,
                "ring": ring,
                "inferred": True,
                "face": face,
                "width": width,
                "depth": depth,
                "door": {
                    "x": door[0],
                    "z": door[1],
                    "yaw": face,
                    "color": door_color(cx, cz),
                },
            }
        )

    all_buildings = osm_buildings + homes
    solid_rings = [b["ring"] for b in all_buildings]

    def blocked_at(x: float, z: float, radius: float = 0.7) -> bool:
        for ring in solid_rings:
            if point_in_ring(x, z, ring):
                return True
            for i in range(len(ring)):
                _, _, d = closest_on_seg(
                    x, z, ring[i][0], ring[i][1], ring[(i + 1) % len(ring)][0], ring[(i + 1) % len(ring)][1]
                )
                if d < radius:
                    return True
        return False

    # Spawn on a named residential lane near the middle of Villacana, with houses around.
    spawn = None
    spawn_score = -1e18
    for road in roads:
        if road["kind"] != "residential" or not road["name"]:
            continue
        pts = road["raw"]
        for p in pts[::1]:
            if not in_bounds(p[0], p[1], -8):
                continue
            if signed(p[0], p[1]) < 28:
                continue
            # Stand just off the crown of the lane.
            near = nearest_road_point(p[0], p[1], roads)
            if not near:
                continue
            _cx, _cz, tx, tz = near
            side = (-tz, tx)
            sx = p[0] + side[0] * 1.6
            sz = p[1] + side[1] * 1.6
            if blocked_at(sx, sz, 0.8):
                continue
            if signed(sx, sz) < 24:
                continue
            nearby = sum(1 for ring in solid_rings if dist((sx, sz), centroid(ring)) < 24)
            center_d = math.hypot(sx - LAND_REF[0], sz - LAND_REF[1])
            score = nearby * 4 - center_d * 0.03
            if on_photo(sx, sz):
                score += 40
            if road["name"] == "Calle Pintor Dalí":
                score += 8
            if score > spawn_score:
                # Look toward the sea.
                _sd, normal = coast_query(sx, sz, coast)
                yaw = math.atan2(-normal[0], normal[1])
                spawn = {"x": sx, "z": sz, "yaw": yaw, "street": road["name"]}
                spawn_score = score

    if spawn is None:
        raise SystemExit("Could not find a spawn point on a lane")

    # Start on the photographed block, on Calle Pintor Dalí, not on a lane outside the picture.
    dali_best = None
    dali_dist = 1e9
    for road in roads:
        if road["name"] != "Calle Pintor Dalí":
            continue
        pts = road["raw"]
        length = sum(dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))
        walked = 12.0
        samples = []
        while walked < length - 12:
            acc = 0.0
            for i in range(len(pts) - 1):
                seg = dist(pts[i], pts[i + 1])
                if acc + seg >= walked:
                    t = (walked - acc) / (seg or 1)
                    samples.append(
                        (
                            pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t,
                            pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t,
                        )
                    )
                    break
                acc += seg
            walked += 18.0
        for p in samples:
            near = nearest_road_point(p[0], p[1], roads)
            if not near:
                continue
            _cx, _cz, tx, tz = near
            side = (-tz, tx)
            sx = p[0] + side[0] * 1.6
            sz = p[1] + side[1] * 1.6
            if not on_photo(sx, sz) or signed(sx, sz) < 40 or blocked_at(sx, sz, 0.8):
                continue
            dist_mid = math.hypot(sx + 180, sz - 90)
            if dist_mid < dali_dist:
                _sd, normal = coast_query(sx, sz, coast)
                dali_best = {"x": sx, "z": sz, "yaw": math.atan2(-normal[0], normal[1]), "street": "Calle Pintor Dalí"}
                dali_dist = dist_mid
    if dali_best:
        spawn = dali_best

    # The stand-point can end up closer to the cross street than the lane we sampled.
    nearest_name = ""
    nearest_d = 1e9
    for road in roads:
        if not road["name"]:
            continue
        pts = road["raw"]
        for i in range(len(pts) - 1):
            _, _, d = closest_on_seg(
                spawn["x"], spawn["z"], pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]
            )
            if d < nearest_d:
                nearest_d = d
                nearest_name = road["name"]
    if nearest_name and nearest_d < 14:
        spawn["street"] = nearest_name

    # Palms along sidewalks and just behind the beach.
    palms: list[dict] = []

    def hash01(x: float, z: float, salt: float) -> float:
        n = math.sin(x * 12.9898 + z * 78.233 + salt * 39.346) * 43758.5453
        return n - math.floor(n)

    def try_palm(x: float, z: float, salt: float) -> None:
        if len(palms) >= 240:
            return
        if not in_bounds(x, z, -3):
            return
        if on_photo(x, z):
            return
        if signed(x, z) < 3:
            return
        if any(dist((x, z), (p["x"], p["z"])) < 7.5 for p in palms):
            return
        if any(point_in_ring(x, z, ring) for ring in pool_rings):
            return
        if any(point_in_ring(x, z, ring) for ring in lawn_rings):
            return
        if blocked_at(x, z, 1.3):
            return
        if clearance_to_roads(x, z, roads) < 0.4:
            return
        palms.append(
            {
                "x": round(x, 1),
                "z": round(z, 1),
                "s": round(0.82 + hash01(x, z, salt) * 0.55, 2),
            }
        )

    for road in roads:
        if road["kind"] not in {"residential", "living_street", "pedestrian", "footway"}:
            continue
        pts = road["raw"]
        length = sum(dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))
        walked = 8.0
        while walked < length:
            acc = 0.0
            for i in range(len(pts) - 1):
                seg = dist(pts[i], pts[i + 1])
                if acc + seg >= walked:
                    t = (walked - acc) / (seg or 1)
                    px = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t
                    pz = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t
                    dx, dz = pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]
                    norm = math.hypot(dx, dz) or 1
                    right = (-dz / norm, dx / norm)
                    offset = road["width"] / 2.0 + 1.15
                    if hash01(px, pz, 1.2) > 0.38:
                        try_palm(px + right[0] * offset, pz + right[1] * offset, 2.0)
                    if hash01(px, pz, 3.4) > 0.38:
                        try_palm(px - right[0] * offset, pz - right[1] * offset, 4.0)
                    break
                acc += seg
            walked += 18.0

    walked = 0.0
    coast_len = sum(dist(coast[i], coast[i + 1]) for i in range(len(coast) - 1))
    while walked < coast_len:
        acc = 0.0
        for i in range(len(coast) - 1):
            seg = dist(coast[i], coast[i + 1])
            if acc + seg >= walked:
                t = (walked - acc) / (seg or 1)
                px = coast[i][0] + (coast[i + 1][0] - coast[i][0]) * t
                pz = coast[i][1] + (coast[i + 1][1] - coast[i][1]) * t
                _sd, normal = coast_query(px, pz, coast)
                try_palm(px + normal[0] * 14, pz + normal[1] * 14, 5.5)
                break
            acc += seg
        walked += 16.0

    def pack_building(b: dict) -> dict:
        return {
            "name": b["name"],
            "kind": b["kind"],
            "height": b["height"],
            "ring": round_ring(b["ring"]),
            "inferred": b["inferred"],
            "face": round(b["face"], 3),
            "width": b["width"],
            "depth": b["depth"],
            "door": {
                "x": round(b["door"]["x"], 1),
                "z": round(b["door"]["z"], 1),
                "yaw": round(b["door"]["yaw"], 3),
                "color": b["door"]["color"],
            },
        }

    payload = {
        "attribution": "© OpenStreetMap contributors",
        "origin": {"lat": LAT0, "lon": LON0},
        "bounds": {"minX": MIN_X, "maxX": MAX_X, "minZ": MIN_Z, "maxZ": MAX_Z},
        "ground": ground,
        "spawn": {
            "x": round(spawn["x"], 1),
            "z": round(spawn["z"], 1),
            "yaw": round(spawn["yaw"], 3),
            "street": spawn["street"],
        },
        "coast": round_ring(coast),
        "landRef": list(LAND_REF),
        "beaches": [{"name": b["name"], "ring": round_ring(douglas(b["ring"] + [b["ring"][0]], 2.0)[:-1])} for b in beaches],
        "gardens": [{"kind": g["kind"], "ring": round_ring(douglas(g["ring"] + [g["ring"][0]], 2.0)[:-1])} for g in gardens],
        "pitches": [{"sport": p["sport"], "ring": round_ring(p["ring"])} for p in pitches],
        "roads": [
            {
                "name": road["name"],
                "kind": road["kind"],
                "width": road["width"],
                "points": round_ring(road["raw"]),
            }
            for road in roads
        ],
        "buildings": [pack_building(b) for b in all_buildings],
        "lawns": [{"name": lawn["name"], "ring": round_ring(lawn["ring"])} for lawn in lawn_specs],
        "pools": [
            {"name": spec["name"], "kind": spec["kind"], "ring": round_ring(spec["ring"])}
            for spec in pool_specs
        ],
        "palms": palms,
        "meta": {
            "osmBuildings": len(osm_buildings),
            "typicalHomes": len(homes),
            "pools": sum(1 for spec in pool_specs if spec["kind"] != "baby"),
            "palms": len(palms),
            "roads": len(roads),
        },
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, separators=(",", ":")))
    print(f"wrote {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.0f} KB)")
    print("meta", payload["meta"])
    print("spawn", payload["spawn"], "inland", round(signed(spawn["x"], spawn["z"]), 1))
    print("coast pts", len(coast), "beaches", len(beaches), "gardens", len(gardens), "pitches", len(pitches))

    try:
        draw_preview(payload, coast, signed)
    except Exception as exc:  # Preview is a dev aid, not part of the game.
        print("preview skipped", exc)


def draw_preview(payload: dict, coast: list[tuple[float, float]], signed) -> None:
    from PIL import Image, ImageDraw

    scale = 1.15
    min_x, max_x = MIN_X, MAX_X
    min_z, max_z = MIN_Z, MAX_Z
    w = int((max_x - min_x) * scale) + 20
    h = int((max_z - min_z) * scale) + 20

    def xy(p):
        return (10 + (p[0] - min_x) * scale, 10 + (p[1] - min_z) * scale)

    img = Image.new("RGB", (w, h), (190, 214, 228))
    draw = ImageDraw.Draw(img)
    # sea is everything; paint land by flood of inland samples as polygons via coast
    land_poly = [(min_x, min_z), (max_x, min_z), coast[-1], *reversed(coast[:-1]), coast[0]]
    draw.polygon([xy(p) for p in land_poly], fill=(126, 168, 92))
    for g in payload["gardens"]:
        draw.polygon([xy(p) for p in g["ring"]], fill=(108, 158, 78))
    for b in payload["beaches"]:
        draw.polygon([xy(p) for p in b["ring"]], fill=(230, 214, 170))
    # sand ribbon
    ribbon = []
    inner = []
    for p in coast:
        _d, n = coast_query(p[0], p[1], coast)
        ribbon.append(p)
        inner.append((p[0] + n[0] * 34, p[1] + n[1] * 34))
    draw.polygon([xy(p) for p in ribbon + list(reversed(inner))], fill=(232, 214, 168))
    for road in payload["roads"]:
        pts = [xy(p) for p in road["points"]]
        width = max(1, int(road["width"] * scale * 0.45))
        draw.line(pts, fill=(214, 206, 190), width=width)
    for pool in payload["pools"]:
        draw.polygon([xy(p) for p in pool["ring"]], fill=(46, 176, 206))
    for b in payload["buildings"]:
        color = (244, 240, 232) if not b["inferred"] else (255, 250, 242)
        draw.polygon([xy(p) for p in b["ring"]], fill=color, outline=(196, 106, 70))
    sx, sz = payload["spawn"]["x"], payload["spawn"]["z"]
    s = xy((sx, sz))
    draw.ellipse((s[0] - 4, s[1] - 4, s[0] + 4, s[1] + 4), fill=(196, 60, 40))
    img.save(PREVIEW_PATH)
    print("preview", PREVIEW_PATH, "land check spawn", round(signed(sx, sz), 1))


if __name__ == "__main__":
    main()
