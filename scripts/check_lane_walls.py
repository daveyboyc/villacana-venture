#!/usr/bin/env python3
"""Garden and patio walls along Calle Elena, Calle Jorge and Calle Cervantes (data/lane_walls.json).

  python3 scripts/check_lane_walls.py

Checks: each wall is a sane polyline with a confidence level and photos that exist; doors sit on their
wall and on the photographed sills; walls keep off the lanes' walking lines, pools and traced lawns;
the Jorge garden wall agrees with the planter gap, kerb and lawn it now closes; and the renderer,
collision and map are wired.
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
load = lambda p: json.loads((ROOT / p).read_text())
data = load('data/lane_walls.json')
skeleton = load('public/map/skeleton.json')
confidence = load('data/confidence.json')
photos = {p['file'] for p in load('public/photos-ref/manifest.json')}
sills = {s['id']: s for s in load('data/door_sills.json')['sills']}
lawns = {r['id']: r['ring'] for r in load('data/frontage_divisions.json')['regions']}
jorge = load('data/jorge_lane.json')


def seg_dist(p, a, b):
    ax, az = a; bx, bz = b; dx, dz = bx - ax, bz - az
    t = max(0, min(1, ((p[0] - ax) * dx + (p[1] - az) * dz) / (dx * dx + dz * dz or 1)))
    return math.hypot(p[0] - ax - dx * t, p[1] - az - dz * t)


def crosses(a, b, c, d):
    o = lambda p, q, r: (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
    return o(a, b, c) * o(a, b, d) < 0 and o(c, d, a) * o(c, d, b) < 0


def segments(points):
    return list(zip(points, points[1:]))


def line_gap(p_pts, q_pts, step=0.1):
    """Smallest distance between two polylines, sampled along the first."""
    best = math.inf
    for a, b in segments(p_pts):
        n = max(1, int(math.hypot(b[0] - a[0], b[1] - a[1]) / step))
        for k in range(n + 1):
            p = (a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n)
            best = min(best, min(seg_dist(p, c, d) for c, d in segments(q_pts)))
    return best


streets = {s['id']: s for s in skeleton['streets']}
ids = set()
for w in data['walls']:
    wid = w['id']
    assert wid not in ids, f'{wid}: duplicate id'; ids.add(wid)
    assert w['area'] in ('elena', 'seaward-lanes', 'cervantes'), f'{wid}: area'
    assert len(w['points']) >= 2 and all(len(p) == 2 for p in w['points']), f'{wid}: polyline'
    assert all(math.hypot(b[0] - a[0], b[1] - a[1]) > 0.2 for a, b in segments(w['points'])), f'{wid}: degenerate segment'
    assert 0.5 <= w['height'] <= 3.5 and 0.15 <= w['thickness'] <= 0.5 and w['raise'] >= 0, f'{wid}: size'
    assert all(p in photos for p in w['evidence']), f'{wid}: unknown photo'
    assert w['basis'].strip(), f'{wid}: basis'
    level = confidence['features'].get('lane_walls.json:' + wid, {}).get('level')
    assert level in ('photographed', 'estimated', 'inferred'), f'{wid}: no confidence level'
    assert (level == 'inferred') == (not w['evidence']), f'{wid}: an unphotographed wall must be graded inferred, a photographed one must not'
    # Doors: on the wall, inside a segment, under the wall top.
    for d in w['doors']:
        near = min(seg_dist(d['at'], a, b) for a, b in segments(w['points']))
        assert near <= 0.25, f"{d['id']}: {near:.2f} m off its wall"
        assert d['height'] < w['height'] and 0.7 <= d['width'] <= 1.6, f"{d['id']}: size"
    # Keep clear of the walking lines of the lane it lines and of the pools.
    for sid in ('elena-north', 'elena-south', 'jorge', 'alberto'):
        gap = line_gap(w['points'], streets[sid]['points'])
        assert gap >= 1.0, f'{wid}: {gap:.2f} m from the {sid} centreline'
    # Calle Cervantes is a narrow lane between its walls: keep a wall's face outside its 1.2 m paving and its kerb walls.
    gap = line_gap(w['points'], streets['cervantes']['points'])
    assert w['area'] != 'cervantes' or gap - w['thickness'] / 2 >= 1.0, f'{wid}: face {gap - w["thickness"] / 2:.2f} m from the Cervantes centreline'
    for pool in skeleton['pools']:
        ring = pool['ring'] + [pool['ring'][0]]
        assert not any(crosses(a, b, c, e) for a, b in segments(w['points']) for c, e in segments(ring)), f"{wid}: crosses pool {pool['id']}"

walls = {w['id']: w for w in data['walls']}

# Elena: the two doors are the ones whose sills are already built, and the wall keeps outside both lawns.
west = walls['elena-south-lawn-west-wall']
for door_id, sill_id in (('elena-south-bed-door', 'elena-bed-door-sill'), ('elena-south-lawn-door', 'elena-lawn-door-sill')):
    door = next(d for d in west['doors'] if d['id'] == door_id)
    sill = sills[sill_id]
    assert math.hypot(door['at'][0] - sill['door'][0], door['at'][1] - sill['door'][1]) < 0.05, f'{door_id}: not on {sill_id}'
    # The sill lies outside the wall: its depth runs away from the wall's outer face.
    out = sill['outward']; face = min(seg_dist(door['at'], a, b) for a, b in segments(west['points']))
    assert abs(face - west['thickness'] / 2) < 0.06, f'{door_id}: the wall face is not at the door ({face:.2f} m from the centreline)'
    tip = (sill['door'][0] + out[0] * sill['depth'], sill['door'][1] + out[1] * sill['depth'])
    assert min(seg_dist(tip, a, b) for a, b in segments(west['points'])) > face + 0.2, f'{sill_id}: sill runs into the wall'
for lawn in ('cervantes-elena-lawn-1', 'cervantes-elena-lawn-2'):
    ring = lawns[lawn] + [lawns[lawn][0]]
    assert not any(crosses(a, b, c, e) for a, b in segments(west['points']) for c, e in segments(ring)), f'west wall crosses {lawn}'
    assert line_gap(ring, west['points']) >= 0.3, f'west wall within 0.3 m of {lawn}'

# Jorge: wall stations on the lane frame, and the garden it now closes.
A, B = streets['jorge']['points']
L = math.hypot(B[0] - A[0], B[1] - A[1]); u = ((B[0] - A[0]) / L, (B[1] - A[1]) / L); n = (-u[1], u[0])
station = lambda p: ((p[0] - A[0]) * u[0] + (p[1] - A[1]) * u[1], -((p[0] - A[0]) * n[0] + (p[1] - A[1]) * n[1]))
garden = walls['jorge-garden-east-wall']
s0, s1 = [station(p) for p in garden['points']]
assert abs(s0[0] - s1[0]) < 0.05, 'garden wall must run straight back from the lane'
open_gap = next(g for g in jorge['boundary']['gaps'] if g['kind'] == 'open')
assert abs(open_gap['to'] - (s0[0] + garden['thickness'] / 2)) < 0.15, 'the planter must start at the garden wall'
assert jorge['kerb']['to'] <= s0[0] - garden['thickness'] / 2, 'the garden kerb runs through the wall'
lawn_strip = next(g for g in jorge['grass'] if g['side'] == 'hedge' and g['from'] == 94.6)
assert lawn_strip['to'] <= s0[0] - garden['thickness'] / 2, 'the garden lawn runs through the wall'
assert min(s0[1], s1[1]) >= jorge['kerb']['offset'] + jorge['kerb']['width'] / 2, 'garden wall on the kerb'
houses = [b for b in skeleton['buildings'] if b['floors'] > 0]
for wid in ('jorge-patio-wall-117', 'jorge-patio-wall-124'):
    a, b = [station(p) for p in walls[wid]['points']]
    assert abs(a[0] - b[0]) < 0.05, f'{wid}: not square to the lane'
    front = min(a[1], b[1]) - walls[wid]['thickness'] / 2
    planter_back = jorge['boundary']['offset'] + jorge['boundary']['thickness'] / 2
    assert abs(min(a[1], b[1]) - planter_back) < 0.05, f'{wid}: must reach the back of the planter'
    assert jorge['boundary']['from'] <= a[0] <= jorge['boundary']['to'], f'{wid}: no planter in front of it'
# No patio wall may cut a brick entrance off from the patio behind the planter west of it (IMG_2230; review of 16 November).
for w in data['walls']:
    if w['area'] != 'seaward-lanes' or w['id'] == 'jorge-garden-east-wall':
        continue
    s_wall = station(w['points'][0])[0]
    for g in jorge['boundary']['gaps']:
        if g['kind'] == 'threshold':
            assert not (g['from'] - 2.5 <= s_wall <= g['to']), f"{w['id']}: stands between the entrance at {g['from']} m and its patio"

src = (ROOT / 'src/slice.ts').read_text()
assert 'addLaneWalls(scene)' in src and 'laneWallRings()' in src, 'slice.ts: lane walls not drawn or not solid'
assert 'laneWalls' in (ROOT / 'src/blueprint.ts').read_text(), 'blueprint.ts: lane walls not on the map'
assert 'lane_walls.json' in (ROOT / 'scripts/assign_photo_map.py').read_text(), 'lane walls not in the feature inventory'
# Cervantes: the north wall stands where the photographed patio partitions end and meets the garden door's wall;
# the south wall carries on the line of the wall east of Elena to the Alberto crossing.
north = walls['cervantes-north-garden-wall-west']
for part in load('data/cervantes_north_patios.json')['walls']:
    if part['id'] == 'cervantes-north-partition-east':
        continue  # it ends on the garden door's wall, east of this one
    end = min(part['points'], key=lambda p: seg_dist(p, *north['points']))
    assert seg_dist(end, *north['points']) <= north['thickness'] / 2 + 0.1, f"{part['id']}: does not end on the Cervantes north wall"
door = load('data/cervantes_garden_door.json')
west_jamb = [door['origin'][i] + door['along'][i] * door['wallWidth'] / 2 for i in range(2)]  # its 'along' points west
assert math.dist(north['points'][1], west_jamb) < 0.15, 'Cervantes north wall does not meet the garden door wall'
south = walls['cervantes-south-garden-wall-alberto']
east_south = load('data/cervantes_east_south_patios.json')['walls'][0]['points']
assert math.dist(south['points'][0], east_south[1]) < 0.05 and seg_dist(south['points'][1], *east_south) > 10, 'Cervantes south wall does not continue the wall east of Elena'
print(f"Lane walls: {len(data['walls'])} walls, {sum(len(w['doors']) for w in data['walls'])} doors on the built sills, clear of lanes, pools and lawns; Jorge garden ends at its wall PASS")
