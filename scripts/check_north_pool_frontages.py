#!/usr/bin/env python3
"""Check the north pool front gardens and facade details (data/north_pool_frontages.json).

Furniture stands on open ground or a terrace floor, never in a registry house or on a mapped lane;
awnings, climbers and the alley arch sit on registry house fronts; every item cites catalogued photos.
"""
import json
import math
from pathlib import Path

from check_map import inside

ROOT = Path(__file__).resolve().parents[1]


def seg(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz or 1)))
    return math.dist(p, (a[0] + dx * t, a[1] + dz * t))


def ring_gap(p, ring):
    return min(seg(p, ring[i], ring[(i + 1) % len(ring)]) for i in range(len(ring)))
d = json.loads((ROOT / 'data/north_pool_frontages.json').read_text())
s = json.loads((ROOT / 'public/map/skeleton.json').read_text())
photos = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
houses = [b for b in s['buildings'] if b['floors'] > 0]
lanes = s['boundaryReference']['roads']
ids = [x['id'] for k in ('furniture', 'awnings', 'climbers', 'arches') for x in d[k]]
assert len(ids) == len(set(ids)), 'duplicate ids'
KINDS = {'dining-set', 'bistro-set', 'armchair', 'loungers', 'side-table', 'parasol'}


def on_front(p, tol=0.1):
    return min(ring_gap(p, b['ring']) for b in houses) < tol


for k in ('furniture', 'awnings', 'climbers', 'arches'):
    for x in d[k]:
        assert x['evidence'] and all(e in photos for e in x['evidence']) and len(x['note']) > 40, f"{x['id']}: evidence and a note"
for f in d['furniture']:
    assert f['kind'] in KINDS, f"{f['id']}: unknown kind {f['kind']}"
    p = f['at']
    assert not any(inside(*p, b['ring']) for b in houses), f"{f['id']}: stands in a house"
    assert min(ring_gap(p, b['ring']) for b in houses) > 0.35, f"{f['id']}: too close to a house wall"
    for r in lanes:
        assert min(seg(p, a, q) for a, q in zip(r['points'], r['points'][1:])) > r['width'] / 2 + 0.5, f"{f['id']}: on lane {r.get('id')}"
for a in d['awnings']:
    assert all(on_front(p) for p in a['wall']), f"{a['id']}: wall ends are not on a registry front"
    assert abs(math.hypot(*a['out']) - 1) < 0.01 and 0.6 <= a['depth'] <= 3.5 and 2.0 <= a['height'] <= 3.2, a['id']
    (ax, az), (bx, bz) = a['wall']
    assert abs((bx - ax) * a['out'][0] + (bz - az) * a['out'][1]) < 0.1 * math.hypot(bx - ax, bz - az), f"{a['id']}: out is not square to the wall"
    mid = ((ax + bx) / 2 + a['out'][0] * 0.3, (az + bz) / 2 + a['out'][1] * 0.3)
    assert not any(inside(*mid, b['ring']) for b in houses), f"{a['id']}: out points into the house"
for c in d['climbers']:
    assert on_front(c['at']), f"{c['id']}: not on a registry front"
for a in d['arches']:
    assert on_front(a['from']) and on_front(a['to']), f"{a['id']}: ends are not on registry corners"
    assert 1.5 <= math.dist(a['from'], a['to']) <= 4.5, a['id']
f = d['photographedFrontage']
assert all(e in photos for e in f['evidence']) and abs(math.hypot(*f['facing']) - 1) < 0.01
print(f"North pool frontages: {len(d['furniture'])} furniture, {len(d['awnings'])} awnings, {len(d['climbers'])} climbers, {len(d['arches'])} arch, on floors and house fronts, clear of houses and lanes PASS")
