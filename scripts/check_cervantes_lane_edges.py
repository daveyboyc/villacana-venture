#!/usr/bin/env python3
"""Beds and hedge planters along Calle Cervantes (data/cervantes_lane_edges.json).

  python3 scripts/check_cervantes_lane_edges.py

Checks: each bed's world ring is its lane-frame rectangle; it keeps off the lane's paving and the steps, inside the
house fronts and clear of the walls, the existing kerb walls and the other beds; sizes are sane; it has photos and a
confidence level; and the renderer, collision, details step, map and feature inventory are wired.
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
load = lambda p: json.loads((ROOT / p).read_text())
data = load('data/cervantes_lane_edges.json')
skeleton = load('public/map/skeleton.json')
confidence = load('data/confidence.json')['features']
photos = {p['file'] for p in load('public/photos-ref/manifest.json')}
walls = {w['id']: w for w in load('data/lane_walls.json')['walls']}
patio = load('data/cervantes_patio_walls.json')['walls']
flights = [load('data/cervantes_elena_steps.json'), load('data/cervantes_alberto_steps.json')]

ax = data['axis']
O, U, V = ax['origin'], ax['along'], ax['right']
assert abs(math.hypot(*U) - 1) < 1e-3 and abs(U[0] * V[0] + U[1] * V[1]) < 1e-3 and abs(U[0] * V[1] - U[1] * V[0] - 1) < 1e-3, 'axis must be a unit frame with right = south'
lane = next(s for s in skeleton['streets'] if s['id'] == 'cervantes')['points']
world = lambda s, o: (O[0] + U[0] * s + V[0] * o, O[1] + U[1] * s + V[1] * o)
local = lambda p: ((p[0] - O[0]) * U[0] + (p[1] - O[1]) * U[1], (p[0] - O[0]) * V[0] + (p[1] - O[1]) * V[1])
# The axis is the lane: every centreline vertex lies on it.
assert all(abs(local(p)[1]) < 0.05 for p in lane), 'lane axis is not the Cervantes centreline'


def inside(p, ring):
    hit = False
    for (ax_, az), (bx, bz) in zip(ring, ring[1:] + ring[:1]):
        if (az > p[1]) != (bz > p[1]) and p[0] < ax_ + (p[1] - az) * (bx - ax_) / (bz - az):
            hit = not hit
    return hit


def box_of(ring):
    pts = [local(p) for p in ring]
    return min(p[0] for p in pts), max(p[0] for p in pts), min(p[1] for p in pts), max(p[1] for p in pts)


houses = [b for b in skeleton['buildings'] if b['floors'] > 0]
boxes = {}
for bed in data['planters']:
    bid = bed['id']
    assert bid not in boxes, f'{bid}: duplicate id'
    (s0, s1), (o0, o1) = bed['s'], bed['o']
    assert 0 < s0 < s1 <= 138.5 and 0.5 <= s1 - s0 <= 40, f'{bid}: extent'
    assert o0 * o1 > 0 and abs(o0) >= 0.95 and 0.25 <= abs(o1 - o0) <= 1.2, f'{bid}: must be one side of the lane, outside its paving, 0.25-1.2 m deep'
    assert bed['kind'] in ('raised', 'bed') and (0.4 <= bed['height'] <= 0.7 if bed['kind'] == 'raised' else 0.08 <= bed['height'] <= 0.2), f'{bid}: height'
    assert 0.05 <= bed['wall'] <= 0.15 and 2 * bed['wall'] < abs(o1 - o0), f'{bid}: kerb'
    want = [world(s0, o0), world(s1, o0), world(s1, o1), world(s0, o1)]
    assert all(math.dist(p, q) < 0.02 for p, q in zip(bed['ring'], want)), f'{bid}: ring is not its lane-frame rectangle'
    assert bed['evidence'] and all(p in photos for p in bed['evidence']) and bed['basis'].strip(), f'{bid}: photos and basis'
    assert bed['planting']['height'] > bed['height'] and all(r['s'][0] >= s0 and r['s'][1] <= s1 for r in bed['planting']['runs']), f'{bid}: planting'
    assert confidence.get('cervantes_lane_edges.json:' + bid, {}).get('level') in ('photographed', 'estimated'), f'{bid}: confidence level'
    # Off the house footprints: no corner or midpoint inside a house (the back may touch the house front).
    probe = [world(s, o0 + (o1 - o0) * 0.9) for s in (s0 + 0.05, (s0 + s1) / 2, s1 - 0.05)]
    for h in houses:
        assert not any(inside(p, h['ring']) for p in probe), f"{bid}: inside {h['id']}"
    # Clear of the steps' cheeks beside the lane.
    for f in flights:
        fs = sorted(local(p)[0] for p in (f['foot'], f['toward']))
        if s0 < fs[1] and s1 > fs[0]:
            assert abs(o0) >= f['across'][1] + 0.1, f"{bid}: on the {f['id']}"
    boxes[bid] = (s0, s1, min(o0, o1), max(o0, o1))

# Beds do not overlap each other, the existing kerb walls or the lane walls.
items = list(boxes.items())
for i, (a, (as0, as1, ao0, ao1)) in enumerate(items):
    for b, (bs0, bs1, bo0, bo1) in items[i + 1:]:
        assert as1 <= bs0 or bs1 <= as0 or ao1 <= bo0 or bo1 <= ao0, f'{a} overlaps {b}'
    for w in patio:
        (ws0, wo), (ws1, _) = local(w['points'][0]), local(w['points'][-1])
        lo, hi = sorted((ws0, ws1))
        if as0 < hi and as1 > lo and ao0 < wo < ao1:
            raise AssertionError(f"{a}: through the kerb wall {w['id']}")
        if as0 < hi and as1 > lo:
            assert min(abs(wo - ao0), abs(wo - ao1)) >= w['thickness'] / 2 - 0.01 or not (ao0 - w['thickness'] / 2 < wo < ao1 + w['thickness'] / 2), f"{a}: overlaps the kerb wall {w['id']}"
    for w in walls.values():
        if w['area'] != 'cervantes':
            continue
        (ws0, wo), (ws1, _) = local(w['points'][0]), local(w['points'][-1])
        lo, hi = sorted((ws0, ws1))
        if as0 < hi and as1 > lo:
            assert wo + w['thickness'] / 2 <= ao0 + 0.01 or wo - w['thickness'] / 2 >= ao1 - 0.01, f"{a}: overlaps {w['id']}"

# The west bed fills the strip between the kerb wall and the north garden wall.
west, north = boxes['cervantes-north-bed-west'], walls['cervantes-north-garden-wall-west']
kerb = next(w for w in patio if w['id'] == 'cervantes-patio-north-1')
assert abs(west[3] - (local(kerb['points'][0])[1] - kerb['thickness'] / 2)) < 0.02, 'west bed does not start at the kerb wall'
# Review of 17 November 2026: the bed is at grade behind a low kerb, not a raised box (IMG_2274, IMG_2264, IMG_2468).
assert kerb['height'] <= 0.2 and next(b for b in data['planters'] if b['id'] == 'cervantes-north-bed-west')['height'] <= kerb['height'], 'west bed must sit at grade behind the low kerb'
assert abs(west[2] - (local(north['points'][0])[1] + north['thickness'] / 2)) < 0.02, 'west bed does not reach the garden wall'

src = (ROOT / 'src/slice.ts').read_text()
assert 'addCervantesLaneEdges(scene)' in src and 'cervantesLaneEdgeRings()' in src and 'addCervantesLaneEdgePlanting(into,keep)' in src, 'slice.ts: beds not drawn, solid or planted'
assert 'cervantesLaneEdges' in (ROOT / 'src/blueprint.ts').read_text(), 'blueprint.ts: beds not on the map'
assert 'cervantes_lane_edges.json' in (ROOT / 'scripts/assign_photo_map.py').read_text(), 'beds not in the feature inventory'
assert 'decorationClearance' in (ROOT / 'src/cervantes-lane-edges.ts').read_text(), 'planting does not use the route-clearance guard'
print(f"Cervantes lane edges: {len(boxes)} beds and planters off the lane, the steps, the houses, the walls and each other PASS")
