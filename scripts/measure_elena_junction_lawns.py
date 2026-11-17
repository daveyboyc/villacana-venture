#!/usr/bin/env python3
"""Measure the Elena/Cervantes junction lawns and their west wall through two solved roof cameras.

  node scripts/shoot_views.cjs ELENA-ROOF-2026-11-17 --pose     (writes layout-checks.local/model.json: the ground)
  python3 scripts/measure_elena_junction_lawns.py

Each pick below is a pixel in the web copy of a photo whose camera is solved in data/photo_poses.json.
It is cast through that camera onto the model ground (the terrain the render uses), giving a plan
point in scene metres (+x east, +z south). The script then reports, for the current data, how far each
measured point lies from the edge it should sit on:

  - lane kerb points against the lane edge of lawns 1 and 2 (the kerb is drawn on the ring edge);
  - near-lawn cross-path kerb points against lawn 1's cross-path edge;
  - wall-foot points against the lawn-side face of elena-south-lawn-west-wall (centreline + half thickness),
    signed: + means the photographed foot is on the lawn side of the model face;
  - the cross-path end against the lawn door.

Far points (more than 20 m out) are held out: at that range a 1 degree pitch error moves a ground point
about 1 m along the ray. Task elena-junction-lawns-roof; docs/reviews/elena-junction-lawns-roof.
"""
import json
import math
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from photo_pose import rotation  # noqa: E402

NEW, OLD = 'ELENA-ROOF-2026-11-17.jpg', 'IMG_2358.jpg'
PICKS = {
    'kerb': [(NEW, 230, 820), (NEW, 268, 900), (NEW, 305, 1000), (NEW, 338, 1100), (NEW, 368, 1200),
             (OLD, 705, 600), (OLD, 725, 820)],
    'cross-kerb': [(NEW, 300, 806), (NEW, 380, 791), (NEW, 460, 775)],
    # At the grass line under the lit wall, not on the wall face (review of 17 Nov 2026, REVIEW.md).
    'wall-foot': [(NEW, 643, 893), (NEW, 700, 954), (NEW, 720, 975), (NEW, 740, 995),
                  (OLD, 1092, 530), (OLD, 1100, 545), (OLD, 1113, 560), (OLD, 1145, 620), (OLD, 1178, 665), (OLD, 1198, 695)],
    'path-end': [(NEW, 495, 757)],
    'wall-foot-far': [(NEW, 465, 742), (NEW, 415, 662)],
}

model = json.loads((ROOT / 'layout-checks.local/model.json').read_text())
grid = model['ground']
heights = np.array(grid['heights']).reshape(grid['nz'], grid['nx'])
poses = json.loads((ROOT / 'data/photo_poses.json').read_text())['photos']


def ground(x, z):
    fx, fz = (x - grid['x0']) / grid['step'], (z - grid['z0']) / grid['step']
    i, j = int(fx), int(fz)
    a, b = fx - i, fz - j
    return (heights[j, i] * (1 - a) * (1 - b) + heights[j, i + 1] * a * (1 - b)
            + heights[j + 1, i] * (1 - a) * b + heights[j + 1, i + 1] * a * b)


def cast(photo, u, v):
    rec = poses[photo]
    p, (w, h) = rec['solved']['pose'], rec['image']
    d = rotation(p['yaw'], p['pitch'], p['roll']) @ np.array([(u - w / 2) / p['f'], -(v - h / 2) / p['f'], -1.0])
    o = np.array([p['x'], p['y'], p['z']])
    y = 0.8
    for _ in range(20):
        q = o + (y - o[1]) / d[1] * d
        y = ground(q[0], q[2])
    return float(q[0]), float(q[2]), float(math.hypot(q[0] - o[0], q[2] - o[2]))


def seg_dist(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)))
    return math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t)


def line_dist(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    return ((p[0] - a[0]) * dz - (p[1] - a[1]) * dx) / math.hypot(dx, dz)


fronts = json.loads((ROOT / 'data/frontage_divisions.json').read_text())
rings = {r['id']: r['ring'] for r in fronts['regions']}
wall = next(w for w in json.loads((ROOT / 'data/lane_walls.json').read_text())['walls'] if w['id'] == 'elena-south-lawn-west-wall')
lawn1, lawn2 = rings['cervantes-elena-lawn-1'], rings['cervantes-elena-lawn-2']
door = next(d for d in wall['doors'] if d['id'] == 'elena-south-lawn-door')['at']
def face(p):
    """Signed distance from the wall's lawn-side face: + on the lawn side (east), - behind the face."""
    a, b = min(zip(wall['points'], wall['points'][1:]), key=lambda ab: seg_dist(p, *ab))
    s = line_dist(p, a, b)
    east = line_dist((a[0] + 1, a[1]), a, b)  # sign of a point due east of the segment
    return (s if east > 0 else -s) - wall['thickness'] / 2


def report(name, items, residual):
    rows = []
    for photo, u, v in items:
        x, z, dist = cast(photo, u, v)
        r = residual((x, z))
        rows.append(r)
        print(f'  {name:14} {photo:26} ({u:4},{v:4}) -> ({x:8.2f}, {z:6.2f})  {dist:5.1f} m out  residual {r:+.2f} m')
    return rows


print('Elena/Cervantes junction lawns measured through', NEW, 'and', OLD)
used, held = [], []
# Lane kerb: distance to the nearer of the two lawns' lane edges (lawn 1 corners 0-1, lawn 2 corners 1-2).
used += report('lane kerb', PICKS['kerb'], lambda p: min((line_dist(p, lawn1[0], lawn1[1]), line_dist(p, lawn2[2], lawn2[1])), key=abs))
used += report('cross kerb', PICKS['cross-kerb'], lambda p: line_dist(p, lawn1[1], lawn1[2]))
used += report('wall foot', PICKS['wall-foot'], face)
used += report('path end', PICKS['path-end'], lambda p: math.hypot(p[0] - door[0], p[1] - door[1]))
held += report('held out', PICKS['wall-foot-far'], face)
rms = lambda rows: math.sqrt(sum(r * r for r in rows) / len(rows))
print(f'used: {len(used)} points, rms {rms(used):.2f} m, worst {max(map(abs, used)):.2f} m')
print(f'held out (beyond 20 m): {len(held)} points, rms {rms(held):.2f} m, worst {max(map(abs, held)):.2f} m')
