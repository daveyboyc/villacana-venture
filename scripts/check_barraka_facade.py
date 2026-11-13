#!/usr/bin/env python3
"""Barraka's photographed facade sits on the unchanged registry ring, above the old 3 m wall.

The parapet height comes from the door proportion in IMG_2618. The 2014-15 laser
survey's lower roof figure is recorded and not used to squash the clerestory.
Stations are estimates along the faces; this check does not grant placement approval.
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
d = json.loads((ROOT / "data/barraka_facade.json").read_text())
sk = json.loads((ROOT / "public/map/skeleton.json").read_text())
manifest = {p["file"] for p in json.loads((ROOT / "public/photos-ref/manifest.json").read_text())}
building = next(b for b in sk["buildings"] if b["id"] == d["buildingId"])
ring = building["ring"]

def length_of(start, count):
    pts = [ring[(start + i) % len(ring)] for i in range(count)]
    pts.append(ring[(start + count) % len(ring)])
    return sum(math.dist(a, b) for a, b in zip(pts, pts[1:]))

assert building["floors"] == 1, "registry floors stay 1; the parapet is a height override, not a second storey"
assert ring == d["registryRing"], "registry ring moved"
assert sk["seafront"]["restaurant"]["buildingId"] == d["buildingId"]
assert sk["seafront"]["restaurant"]["ring"] == ring
assert 4.5 <= d["wallHeight"] <= 5.1, d["wallHeight"]
assert "2.89" in d["facade"]["trust"] and "3.67" in d["facade"]["trust"], "lidar disagreement must stay in the trust note"
assert "two groups of three" in d["facade"]["trust"]
assert set(d["facade"]["evidence"]) <= manifest and len(d["facade"]["evidence"]) == 6

ne, sw, nw = (length_of(d["faces"][k]["start"], d["faces"][k]["count"]) for k in ("ne", "sw", "nw"))
assert 13.5 < ne < 14.8 and 13.5 < sw < 14.8 and 12.2 < nw < 13.4, (ne, sw, nw)

def inside(at, limit, what):
    assert 0.2 < at < limit - 0.2, f"{what} at {at} is off a face of {limit:.2f} m"

groups = d["ne"]["windows"]["groups"]
assert [len(g) for g in groups] == [3, 3], "IMG_2618 shows two groups of three, not 3+3+3"
for g in groups:
    for at in g:
        inside(at, ne, "NE window")
    assert g == sorted(g)
inside(d["ne"]["door"]["at"], ne, "door")
inside(d["ne"]["louvre"]["at"], ne, "louvre")
inside(d["ne"]["slot"]["at"], ne, "slot")
assert d["ne"]["door"]["height"] <= 2.2
assert d["ne"]["windows"]["sill"] + d["ne"]["windows"]["height"] < d["wallHeight"] - 0.4, "clerestory must sit inside the parapet"
assert d["ne"]["louvre"]["y"] + d["ne"]["louvre"]["height"] / 2 < d["wallHeight"]

assert len(d["sw"]["windows"]["at"]) == 8, "IMG_2604 shows eight windows on the south-west front"
for at in d["sw"]["windows"]["at"]:
    inside(at, sw, "SW window")
assert d["sw"]["windows"]["at"] == sorted(d["sw"]["windows"]["at"])
assert d["sw"]["glazing"]["sill"] <= 0.5, "the glazed lower storey has to reach the ground, not sit on a solid wall"
assert d["awning"]["y"] < d["wallHeight"] - 1.5
assert len(d["seating"]["alongSw"]) >= 4 and len(d["seating"]["alongNw"]) >= 4 and 1.4 <= d["seating"]["out"] <= 3.5
for at in d["seating"]["alongSw"]:
    inside(at, sw, "outside table")
se_len = length_of(d["faces"]["se"]["start"], d["faces"]["se"]["count"])
assert 10 < se_len < 16, se_len
for a, b in d["sw"]["awnings"]:
    assert 0 <= a < b <= sw + 0.05
assert d["nw"]["glazedTo"] > nw - 1.2, "the paseo front is glazed for its length"
for at in d["nw"]["windows"]["at"]:
    inside(at, nw, "NW window")
for at in d["seating"]["alongNw"]:
    inside(at, nw, "paseo-side table")
assert 1.2 <= d["awning"]["depth"] <= 1.6, "awning must stay short of the paseo, which is about 1.9 m from the wall at the closest point"
assert 0 < d["roof"]["neReturn"] < 4

src = (ROOT / "src/slice.ts").read_text()
assert "barrakaWallHeight" in src and "BARRAKA_BUILDING" in src
assert "b.id === BARRAKA_BUILDING ? barrakaWallHeight" in src
assert "barrakaLowerHead" in src and "skirt" in src, "the white mass is only the upper storey"
assert "b.id !== skeleton.seafront?.restaurant.buildingId" in src, "generic shutters and porches stay off Barraka"
facade = (ROOT / "src/barraka-facade.ts").read_text()
assert facade.count("layoutOnly") == 1 and facade.index("barraka-lower-floor") < facade.index("layoutOnly"), "Layout keeps the glazed lower storey; only the chairs wait for Show details"
assert "userData.base" in facade
sea = (ROOT / "src/seafront.ts").read_text()
assert "4.7" not in sea, "the old pyramidal thatch is gone"
assert "addBarrakaRoof" not in sea

print(f"Barraka facade: parapet {d['wallHeight']} m, NE {ne:.2f} m with 3+3 windows, SW {sw:.2f} m with 8 windows, ring unchanged PASS")
