#!/usr/bin/env python3
"""Hedge beds on the east side of Calle Elena south (data/elena_south_beds.json).

  python3 scripts/check_elena_south_beds.py
Each bed's ring is its s/o box in the lane frame; the frame is the mapped Elena south centreline; beds stay off the
lane paving, out of the houses and clear of the walls; evidence photos are indexed and each bed has a confidence level.
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
load = lambda p: json.loads((ROOT / p).read_text())
data, skeleton, walls = load('data/elena_south_beds.json'), load('public/map/skeleton.json'), load('data/lane_walls.json')['walls']
photos = {p['file'] for p in load('public/photos-ref/manifest.json')}
confidence = load('data/confidence.json')['features']
ax = data['axis']
O, U, R = ax['origin'], ax['along'], ax['right']
assert abs(math.hypot(*U) - 1) < 1e-3 and abs(U[0] * R[0] + U[1] * R[1]) < 1e-3, 'axis must be a unit frame'
road = next(r for r in skeleton['boundaryReference']['roads'] if r['id'] == 'elena-south')
a, b = road['points'][0], road['points'][1]
assert math.dist(a, O) < 0.05 and abs((b[0] - a[0]) * R[0] + (b[1] - a[1]) * R[1]) < 0.05, 'axis is not the Elena south centreline'
at = lambda s, o: [O[0] + U[0] * s + R[0] * o, O[1] + U[1] * s + R[1] * o]


def inside(p, ring):
    hit = False
    for (x1, z1), (x2, z2) in zip(ring, ring[1:] + ring[:1]):
        if (z1 > p[1]) != (z2 > p[1]) and p[0] < (x2 - x1) * (p[1] - z1) / (z2 - z1) + x1:
            hit = not hit
    return hit


def seg_dist(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)))
    return math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t)


houses = [h['ring'] for h in skeleton['buildings'] if h['floors'] > 0]
for bed in data['planters']:
    (s0, s1), (o0, o1) = bed['s'], bed['o']
    expect = [at(s0, o0), at(s1, o0), at(s1, o1), at(s0, o1)]
    assert all(math.dist(p, q) < 0.01 for p, q in zip(bed['ring'], expect)), f"{bed['id']}: ring does not match s/o"
    assert min(abs(o0), abs(o1)) >= road['width'] / 2, f"{bed['id']}: on the lane paving"
    assert 0.1 <= bed['height'] <= 0.3 and bed['planting']['height'] > bed['height'], f"{bed['id']}: heights"
    samples = [at(s, o) for s in (s0 + 0.05, (s0 + s1) / 2, s1 - 0.05) for o in (o0, o1)]
    assert not any(inside(p, h) for p in samples for h in houses), f"{bed['id']}: inside a house"
    for w in walls:
        for p in samples:
            assert min(seg_dist(p, q, r) for q, r in zip(w['points'], w['points'][1:])) >= w['thickness'] / 2 - 0.01, f"{bed['id']}: runs into {w['id']}"
    assert bed['evidence'] and all(p in photos for p in bed['evidence']), f"{bed['id']}: evidence"
    assert ('elena_south_beds.json:' + bed['id']) in confidence, f"{bed['id']}: no confidence level"
print(f"Elena south beds: {len(data['planters'])} kerbed hedge beds off the lane, out of the houses and clear of the walls PASS")
