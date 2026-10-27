"""Check the grass and shrubs on the beach side of the paseo in front of the gateway and railings (data/beach_verge.json)."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
d = json.loads((ROOT / 'data/beach_verge.json').read_text())
skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
tags = json.loads((ROOT / 'data/reference_tags.json').read_text())
manifest = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
barraka = json.loads((ROOT / 'data/barraka_boardwalk.json').read_text())['boardwalk']


def to_segment(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)))
    return math.dist(p, (a[0] + dx * t, a[1] + dz * t))


def to_line(p, points):
    return min(to_segment(p, a, b) for a, b in zip(points, points[1:]))


def inside(p, ring):
    x, z = p
    result = False
    for a, b in zip(ring, ring[1:] + ring[:1]):
        if (a[1] > z) != (b[1] > z) and x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]:
            result = not result
    return result


assert all(e in tags and e in manifest for e in d['evidence']) and 'Dave' in d['trust'] and 'Not measured' in d['trust']
ring, paseo = d['grass']['ring'], skeleton['seafront']['paseo']
half = paseo['width'] / 2
# The grass lies off the paving and off every building (Barraka included).
houses = [b['ring'] for b in skeleton['buildings'] if b['floors'] > 0]
xs, zs = [p[0] for p in ring], [p[1] for p in ring]
cells = [(x + .25, z + .25) for x in [min(xs) + i * .5 for i in range(int((max(xs) - min(xs)) * 2))]
         for z in [min(zs) + j * .5 for j in range(int((max(zs) - min(zs)) * 2))] if inside((x + .25, z + .25), ring)]
assert cells and all(to_line(p, paseo['points']) >= half - 0.05 for p in cells), 'Grass runs onto the paseo'
assert not any(inside(p, h) for p in cells for h in houses), 'Grass runs into a building'
# Shrubs (Details) sit on the grass and keep their whole footprint off the paseo and the Barraka walk.
for x, z, r in d['shrubs']['clumps']:
    assert inside((x, z), ring), f'Shrub at {x}, {z} is off the grass'
    assert to_line((x, z), paseo['points']) - r >= half and to_line((x, z), barraka['points']) - r >= barraka['width'] / 2, f'Shrub at {x}, {z} blocks a walk'
print(f"Beach verge: {len(cells) / 4:.0f} m2 of grass off the paseo and buildings, {len(d['shrubs']['clumps'])} shrub clumps clear of the walks PASS (rough outline, unmeasured)")
