#!/usr/bin/env python3
"""The west corner of the Elena north mouth on Cervantes (data/elena_north_corner.json, its Cervantes arm in
data/cervantes_lane_edges.json, the patio wall in data/lane_walls.json).

  python3 scripts/check_elena_north_corner.py

Checks: the bed's ring is its lane-frame rectangle on the west side of Elena north, off the lane paving and out of the
house; its back stands against the patio wall, which continues the registry house front and closes on the Elena 24
garden-door wall; the Cervantes arm meets it at the corner and the old 0.65 m kerb wall it replaces is gone; both have
photos and a confidence level; and the renderer, collision and feature inventory are wired.
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
load = lambda p: json.loads((ROOT / p).read_text())
data = load('data/elena_north_corner.json')
cervantes = load('data/cervantes_lane_edges.json')
skeleton = load('public/map/skeleton.json')
confidence = load('data/confidence.json')['features']
photos = {p['file'] for p in load('public/photos-ref/manifest.json')}
wall = next(w for w in load('data/lane_walls.json')['walls'] if w['id'] == 'elena-north-corner-patio-wall')
house = next(b for b in skeleton['buildings'] if b['id'] == '6265201UF1366N_part4')

ax = data['axis']
O, U, V = ax['origin'], ax['along'], ax['right']
assert abs(math.hypot(*U) - 1) < 1e-3 and abs(U[0] * V[0] + U[1] * V[1]) < 1e-3, 'axis must be a unit frame'
world = lambda s, o: (O[0] + U[0] * s + V[0] * o, O[1] + U[1] * s + V[1] * o)
local = lambda p: ((p[0] - O[0]) * U[0] + (p[1] - O[1]) * U[1], (p[0] - O[0]) * V[0] + (p[1] - O[1]) * V[1])
lane = next(r for r in skeleton['boundaryReference']['roads'] if r['id'] == 'elena-north')['points']
assert all(abs(local(p)[1]) < 0.05 for p in lane), 'axis is not the Elena north centreline'


def inside(p, ring):
    hit = False
    for (ax_, az), (bx, bz) in zip(ring, ring[1:] + ring[:1]):
        if (az > p[1]) != (bz > p[1]) and p[0] < ax_ + (p[1] - az) * (bx - ax_) / (bz - az):
            hit = not hit
    return hit


def seg_dist(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)))
    return math.dist(p, (a[0] + dx * t, a[1] + dz * t))


(bed,) = data['planters']
(s0, s1), (o0, o1) = bed['s'], bed['o']
# The Elena north paving is 1.45 m wide (three 0.4 m tile columns and two margins, IMG_2686): its edge is 0.725 m off the centreline.
assert o0 < o1 < 0 and abs(o1) >= 0.72 and 0.25 <= o1 - o0 <= 1.5, 'bed must be on the west side, off the paving, 0.25-1.5 m deep'
assert 0 < s0 < s1 and s1 - s0 <= 8, 'bed extent'
assert bed['kind'] == 'raised' and 0.4 <= bed['height'] <= 0.7 and 0.05 <= bed['wall'] <= 0.15, 'raised kerb sizes'
want = [world(s0, o0), world(s1, o0), world(s1, o1), world(s0, o1)]
assert all(math.dist(p, q) < 0.02 for p, q in zip(bed['ring'], want)), 'ring is not its lane-frame rectangle'
probe = [world(s, (o0 + o1) / 2) for s in (s0 + 0.1, (s0 + s1) / 2, s1 - 0.1)]
assert not any(inside(p, house['ring']) for p in probe), 'bed inside the house'
# The back stands against the wall face; the wall's Elena run continues the registry house front.
a, b = wall['points'][0], wall['points'][1]
# The corner square at the south end has the Cervantes run behind it instead, so probe along the Elena run only.
for s in (max(s0, local(b)[0]) + 0.2, s1 - 0.2):
    d = seg_dist(world(s, o0), a, b)
    assert abs(d - wall['thickness'] / 2) < 0.05, f'bed back is {d:.2f} m from the wall centre'
face = [p for p in house['ring'] if math.dist(p, (-150.01, 48.72)) < 0.05 or math.dist(p, (-152.47, 44.73)) < 0.05]
assert len(face) == 2 and all(abs(local(p)[1] - local(a)[1]) < 0.15 for p in face), 'wall is off the house-front line'
assert math.dist(a, face[0] if math.dist(face[0], a) < 1 else face[1]) < 0.1, 'wall does not start at the house corner'
assert math.dist(wall['points'][-1], (-152.6, 54.85)) < 0.1, 'wall does not close on the Elena 24 garden-door wall'
assert wall['doors'] and all(seg_dist(d['at'], a, b) < 0.05 for d in wall['doors']), 'door off the Elena run'
# The Cervantes arm meets this bed at the corner, and the old kerb wall is gone.
arm = next(p for p in cervantes['planters'] if p['id'] == 'cervantes-elena-corner-bed')
gap = min(math.dist(p, q) for p in arm['ring'] for q in bed['ring'])
assert gap < 0.05, f'arms do not meet ({gap:.2f} m)'
assert arm['height'] == bed['height'], 'arms differ in height'
old = next(w for w in load('data/cervantes_patio_walls.json')['walls'] if w['id'] == 'cervantes-patio-north-east')
assert old.get('retired', {}).get('why') and 'cervantes_lane_edges.json:' + 'cervantes-elena-corner-bed' in old['retired']['by'], 'old 0.65 m wall must be retired (tombstone), not drawn'
assert '.retired' in (ROOT / 'src/cervantes-walls.ts').read_text(), 'renderer still draws retired walls'
for fid, f in [('elena_north_corner.json:' + bed['id'], bed), ('lane_walls.json:' + wall['id'], wall), ('cervantes_lane_edges.json:' + arm['id'], arm)]:
    assert f['evidence'] and all(p in photos for p in f['evidence']) and f['basis'].strip(), f'{fid}: photos and basis'
    assert confidence.get(fid, {}).get('level') in ('photographed', 'estimated', 'inferred'), f'{fid}: confidence level'
assert 'elena_north_corner.json' in (ROOT / 'src/cervantes-lane-edges.ts').read_text(), 'renderer does not load the bed'
assert 'elena_north_corner.json' in (ROOT / 'scripts/assign_photo_map.py').read_text(), 'bed not in the feature inventory'
# Details (Show details): the sign lies between the door and the lantern on the lane face; no climber covers either.
det = load('data/elena_north_corner_details.json')
assert det['wall'] == wall['id']
run = math.dist(a, b)
door_at = math.dist(a, wall['doors'][0]['at'])
door = (door_at - wall['doors'][0]['width'] / 2, door_at + wall['doors'][0]['width'] / 2)
sg, lp = det['sign'], det['lamp']
half_sign = (sum(len(w) for w in sg['words']) * sg['tileW'] + sg['gap'] * (len(sg['words']) - 1)) / 2
assert 0.06 <= sg['tileW'] <= 0.1 and 0.18 <= sg['tileH'] <= 0.25, 'letter tiles are tall and narrow (about 0.08 x 0.21 m)'
sign = (sg['centre'] - half_sign, sg['centre'] + half_sign)
# Structure review: the tiles run from the door's south jamb to the corner on the lane face; the lantern is just round the
# corner on the Cervantes face; about 2 m of plain wall north of the door.
assert sg['segment'] == 0 and lp['segment'] == 1 and lp['at'] <= 0.6, 'tiles on the lane face, lantern on the Cervantes face at the corner'
assert door[1] + 0.1 <= sign[0] and sign[1] <= run, 'tiles must lie between the door (with its pilaster) and the corner'
assert door[0] >= 1.5, 'about 2 m of plain wall north of the door'
assert sg['y'] + sg['tileH'] / 2 < wall['height'] and lp['y'] <= wall['height'], 'sign or lantern above the wall'
for c in det['climbers']:
    seg_len = run if c['segment'] == 0 else math.dist(wall['points'][1], wall['points'][2])
    assert 0 <= c['from'] < c['to'] <= seg_len + 1e-6, f"{c['id']}: off its wall run"
    if c['segment'] == 0:
        # Detail review D2: on the lane face the bougainvillea only drapes over the top, above the tiles.
        assert c['base'] >= sg['y'] + sg['tileH'] / 2 + 0.05, f"{c['id']}: covers the tiles"
    assert c['base'] >= bed['height'] and c['base'] + c['height'] <= wall['height'] + 0.55, f"{c['id']}: from the bed to about 0.5 m over the coping"
for key in ('climbers', 'lamp', 'sign'):
    assert confidence.get('elena_north_corner_details.json:' + key, {}).get('level'), f'{key}: confidence level'
assert all(p in photos for p in det['evidence'])
assert 'addElenaNorthCornerDetails(into,keep)' in (ROOT / 'src/slice.ts').read_text(), 'details not drawn'
# Detail review D1: no tree inside the patio (the gallery shows clear above the wall); the magnolia stands in tree bed 2.
assert not any(o['id'].startswith('elena-north-corner') for o in load('data/objects.json')), 'no tree in the corner patio'
print(f'Elena north corner: raised bed {s1 - s0:.1f} m up the mouth, {o1 - o0:.2f} m deep against the patio wall '
      f'on the house-front line, meeting the Cervantes arm PASS')
