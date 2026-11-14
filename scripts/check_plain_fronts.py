#!/usr/bin/env python3
"""Check the photo-plain faces, measured roof-edge parapets and bare garden walls (data/plain_fronts.json).

Fronts need a box, a unit facing, photo evidence and a reason. Parapets need photo evidence, a
named registry building whose roof edge they stand on (both ends within 0.1 m of its outline),
an outer top above that roof by 0.3-1.5 m, an inner top no lower than the outer, and a sane coping."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
d = json.loads((ROOT / 'data/plain_fronts.json').read_text())
skel = json.loads((ROOT / 'public/map/skeleton.json').read_text())
buildings = {b['id']: b for b in skel['buildings']}
photos = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
terrain = json.loads((ROOT / 'data/terrain.json').read_text())


def to_segment(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz or 1)))
    return math.dist(p, (a[0] + dx * t, a[1] + dz * t))


fronts = d['fronts']
assert len({f['id'] for f in fronts}) == len(fronts)
for f in fronts:
    x0, z0, x1, z1 = f['box']
    assert x0 < x1 and z0 < z1 and abs(math.hypot(*f['facing']) - 1) < 0.01, f['id']
    assert f['evidence'] and all(e in photos for e in f['evidence']) and len(f['trust']) > 80, f['id']
    assert f['noPorches'] or f['noOpenings'], f['id']
for p in d.get('parapets', []):
    b = buildings[p['building']]
    ring = b['ring']
    for end in (p['from'], p['to']):
        assert min(to_segment(end, a, c) for a, c in zip(ring, ring[1:] + ring[:1])) < 0.1, f"{p['id']}: end {end} is not on {p['building']}'s outline"
    assert p['evidence'] and all(e in photos for e in p['evidence']) and len(p['trust']) > 120, p['id']
    assert p['innerTop'] >= p['outerTop'] and 0.2 <= p['coping'] <= 1.2 and 0.15 <= p['thickness'] <= 0.5, p['id']
    assert 0.5 <= math.dist(p['from'], p['to']) <= 20, p['id']
    # The roof it stands on: the house datum (survey ground at the outline's centroid, as the scene drapes it) plus its storeys.
    cx = sum(q[0] for q in ring) / len(ring); cz = sum(q[1] for q in ring) / len(ring)
    i = (cx - terrain['x0']) / terrain['step']; j = (cz - terrain['z0']) / terrain['step']
    ground = terrain['cm'][round(j)][round(i)] / 100
    roof = ground + b['floors'] * skel['floorHeight']
    assert 0.3 <= p['outerTop'] - roof <= 1.5, f"{p['id']}: outer top {p['outerTop']} is {p['outerTop'] - roof:.2f} m above the roof at {roof:.2f}"
# Bare garden walls: each box must hold generated garden-wall points (or it does nothing) and cite photos.
bare = d.get('bareWalls', [])
for w in bare:
    x0, z0, x1, z1 = w['box']
    assert x0 < x1 and z0 < z1 and (x1 - x0) * (z1 - z0) < 200, w['id']
    assert w['evidence'] and all(e in photos for e in w['evidence']) and len(w['trust']) > 120, w['id']
    assert any(x0 <= x <= x1 and z0 <= z <= z1 for x, z in skel['gardenWalls']), f"{w['id']}: no generated garden wall in its box"
print(f"Plain fronts: {len(fronts)} photo-plain front(s), {len(d.get('parapets', []))} measured parapet(s) on their roof edge, {len(bare)} bare garden-wall box(es) PASS")
