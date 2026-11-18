#!/usr/bin/env python3
"""Show-details pieces at the Elena south junction lawns (data/elena_junction_details.json).

  python3 scripts/check_elena_junction_details.py
Cypresses stand on the lawn side of the cypress wall at its foot; climbers lie within the length of a modelled wall
segment; the lamp is inside its hedge bed; the sign fits on its wall; every piece is cited and has a confidence level.
The shared route guard is applied again in the scene (src/elena-junction-details.ts).
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
load = lambda p: json.loads((ROOT / p).read_text())
d = load('data/elena_junction_details.json')
walls = {w['id']: w for w in load('data/lane_walls.json')['walls']}
beds = load('data/elena_south_beds.json')
photos = {p['file'] for p in load('public/photos-ref/manifest.json')}
confidence = load('data/confidence.json')['features']


def seg(wall, i):
    a, b = walls[wall]['points'][i], walls[wall]['points'][i + 1]
    length = math.dist(a, b)
    return a, b, length


assert d['evidence'] and all(p in photos for p in d['evidence']), 'evidence must be indexed photos'
cw = walls['elena-south-cypress-wall']['points']
for c in d['cypresses']:
    a, b = cw
    L = math.dist(a, b); u = ((b[0] - a[0]) / L, (b[1] - a[1]) / L)
    rel = (c['at'][0] - a[0], c['at'][1] - a[1])
    along, off = rel[0] * u[0] + rel[1] * u[1], abs(rel[0] * u[1] - rel[1] * u[0])
    assert 0 < along < L and 0.3 <= off <= 0.8, f"{c['id']}: not at the foot of the cypress wall"
    assert 2.0 <= c['height'] <= 4.0 and 0.15 <= c['radius'] <= 0.45, f"{c['id']}: size"
for c in d['climbers']:
    _, _, L = seg(c['wall'], c['segment'])
    assert 0 <= c['from'] < c['to'] <= L + 0.01, f"{c['id']}: off its wall segment"
    assert c['side'] in ('east', 'west', 'north', 'south') and 0.1 <= c['depth'] <= 0.6 and c['basis'], f"{c['id']}: side, depth or basis"
lamp = d['lamp']; bed = next(b for b in beds['planters'] if b['id'] == lamp['bed'])
assert bed['s'][0] < lamp['s'] < bed['s'][1] and min(bed['o']) < lamp['o'] < max(bed['o']), 'lamp is not in its bed'
sg = d['sign']; _, _, L = seg(sg['wall'], sg['segment'])
assert sg['from'] + len(sg['plaques']) * (sg['plaqueWidth'] + sg['gap']) <= L and 1.2 <= sg['y'] <= walls[sg['wall']]['height'], 'sign does not fit its wall'
for key in ['elena_junction_details.json:' + x for x in ['cypresses', 'climbers', 'lamp', 'sign']]:
    assert key in confidence, f'{key}: no confidence level'
print(f"Elena junction details: {len(d['cypresses'])} cypresses at the wall foot, {len(d['climbers'])} climbers on modelled walls, lamp in its bed, sign on the wall PASS")
