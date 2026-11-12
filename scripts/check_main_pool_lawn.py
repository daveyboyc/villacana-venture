"""The November main-pool lawn: pink paths, flagstones, short walls, hedge and glass fence."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
lawn = json.loads((ROOT / "data/main_pool_lawn.json").read_text())
skeleton = json.loads((ROOT / "public/map/skeleton.json").read_text())
manifest = {p["file"] for p in json.loads((ROOT / "public/photos-ref/manifest.json").read_text())}
tags = json.loads((ROOT / "data/reference_tags.json").read_text())


def inside(p, ring):
    x, z = p
    hit = False
    for a, b in zip(ring, ring[1:] + ring[:1]):
        if (a[1] > z) != (b[1] > z) and x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1] + 1e-12) + a[0]:
            hit = not hit
    return hit


def dist_line(p, pts, closed=False):
    best = math.inf
    seq = list(zip(pts, pts[1:] + pts[:1])) if closed else list(zip(pts, pts[1:]))
    for a, b in seq:
        dx, dz = b[0] - a[0], b[1] - a[1]
        den = dx * dx + dz * dz
        t = 0 if not den else max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / den))
        best = min(best, math.dist(p, (a[0] + dx * t, a[1] + dz * t)))
    return best


main = next(p["ring"] for p in skeleton["pools"] if p["id"] == "main")
toddler = next(p["ring"] for p in skeleton["pools"] if p["id"] == "toddler")
roads = [r["points"] for r in skeleton["boundaryReference"]["roads"]]

assert "estimated" in lawn["trust"] and "4 m" in lawn["trust"]
cited = []
for key in ("paths", "apron", "fittings", "rooms", "hedge", "glass", "deck", "steps", "shop"):
    for photo in lawn[key]["evidence"]:
        assert photo in manifest and photo in tags, photo
        cited.append(photo)
assert len(set(cited)) >= 8

assert 1.8 <= lawn["paths"]["width"] <= 3.2
for line in lawn["paths"]["lines"]:
    assert len(line) >= 2
    for p in line:
        assert not inside(p, main) and not inside(p, toddler), p
        assert dist_line(p, main, closed=True) > 0.4

assert not inside(lawn["glass"]["gaps"][0], main)
assert dist_line(lawn["glass"]["gaps"][0], main, closed=True) < 3
assert lawn["glass"]["offset"] < 0.6 and len(lawn["glass"]["gaps"]) >= 2

for wall in lawn["rooms"]["walls"]:
    length = sum(math.dist(a, b) for a, b in zip(wall["points"], wall["points"][1:]))
    assert 0.5 < length < 8, length
    assert 0.8 <= wall["height"] <= 2.2
    for p in wall["points"]:
        assert not inside(p, main)
        assert all(dist_line(p, road) > 1.2 for road in roads)

for p in lawn["fittings"]["bollards"] + lawn["fittings"]["bins"]:
    near = min(dist_line(p, line) for line in lawn["paths"]["lines"])
    assert 0.6 < near < lawn["paths"]["width"], p

print(f"Main-pool lawn: {len(lawn['paths']['lines'])} pink paths, flagstone apron, "
      f"{len(lawn['rooms']['walls'])} white wall runs, hedge, glass fence with {len(lawn['glass']['gaps'])} gates, "
      f"deck band and Enrique step finish PASS")
