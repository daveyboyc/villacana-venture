#!/usr/bin/env python3
"""Check the forecourt of Calle Pintor Picasso by the pool building (data/picasso_forecourt.json): the 90 MILES upper
block stays inside its registry building (6364501UF1366S_part5, footprint unchanged) at its surveyed top; the garden
wall keeps off the forecourt asphalt, the road and every standing house; the containers stand on open ground clear of
the road ribbon; every piece has photo evidence and an estimated confidence entry, and the task's gaps are recorded."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
d = json.loads((ROOT / 'data/picasso_forecourt.json').read_text())
sk = json.loads((ROOT / 'public/map/skeleton.json').read_text())
layout = json.loads((ROOT / 'data/street_layout.json').read_text())
gp = json.loads((ROOT / 'data/ground_plan_picasso.json').read_text())
photos = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
conf = json.loads((ROOT / 'data/confidence.json').read_text())
features, gaps = conf['features'], {g['id'] for g in conf['gaps']}


def seg_distance(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz or 1)))
    return math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz)


def line_distance(p, line):
    return min(seg_distance(p, a, b) for a, b in zip(line, line[1:]))


def ring_distance(p, ring):
    return line_distance(p, list(ring) + [ring[0]])


def inside(p, ring):
    x, z = p
    hit = False
    for (x1, z1), (x2, z2) in zip(ring, ring[1:] + ring[:1]):
        if (z1 > z) != (z2 > z) and x < x1 + (z - z1) * (x2 - x1) / (z2 - z1):
            hit = not hit
    return hit


def samples(line, closed=False):
    pts = list(line) + ([line[0]] if closed else [])
    for a, b in zip(pts, pts[1:]):
        n = max(1, int(math.dist(a, b) / 0.25))
        for i in range(n + 1):
            yield [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]


buildings = {b['id']: b for b in sk['buildings']}
houses = [b for b in sk['buildings'] if b.get('floors', 0) > 0 and not b.get('passage')]
road = next(s for s in layout['streets'] if s['id'] == 'picasso')
forecourt = next(s for s in gp['surfaces'] if s['id'] == 'picasso-beach-road-forecourt')['outline']

# The 90 MILES upper block: on its registry host, footprint unchanged, at the surveyed band's top.
up = d['ninetyMiles']
host = buildings[up['hostId']]
assert host['floors'] == 1, 'the host keeps its registry storeys'
for p in up['ring']:
    assert inside(p, host['ring']) or ring_distance(p, host['ring']) < 0.1, f'upper block corner {p} outside its registry building'
assert 5.2 <= up['top'] <= 5.9, 'upper block top inside the surveyed 5.6-5.7 m band'
assert line_distance(up['ring'][0], road['points']) > road['width'] / 2, 'upper block off the road'

# The garden wall: off the forecourt asphalt, the road ribbon and every standing house.
w = d['gardenWall']
for p in samples(w['points']):
    assert not inside(p, forecourt) and ring_distance(p, forecourt) >= w['thickness'] / 2 + 0.05, f'garden wall on the forecourt at {p}'
    assert line_distance(p, road['points']) >= road['width'] / 2 + 0.5, f'garden wall within the road at {p}'
    for b in houses:
        assert not inside(p, b['ring']) and ring_distance(p, b['ring']) > 0.5, f'garden wall touches house {b["id"]}'
assert 1.0 <= w['height'] <= 2.0

# Containers: on open ground, clear of the road ribbon and the houses, apart from each other.
c = d['containers']
for p in c['centres']:
    assert line_distance(p, road['points']) >= road['width'] / 2 + 0.3, f'container {p} on the road ribbon'
    for b in houses:
        assert not inside(p, b['ring']) and ring_distance(p, b['ring']) > max(c['size'][:2]) / 2, f'container {p} in house {b["id"]}'
    assert line_distance(p, w['points']) > c['size'][1] / 2 + 0.1, 'container clear of the garden wall'
assert math.dist(*c['centres']) >= c['size'][0], 'containers side by side, not overlapping'

# Evidence and confidence.
for key in ('ninetyMiles', 'sign', 'gardenWall', 'containers'):
    f = d[key]
    assert f['evidence'] and set(f['evidence']) <= photos, f'{key} evidence must be catalogued photos'
    entry = features.get(f'picasso_forecourt.json:{f["id"]}')
    assert entry and entry['level'] == 'estimated', f'{f["id"]} needs an estimated confidence entry (no camera solved)'
for g in ('gap:picasso-90-miles-front', 'gap:picasso-forecourt-east-enclosure', 'gap:picasso-service-road-to-beach'):
    assert g in gaps, f'missing {g}'
print('picasso forecourt ok: 90 MILES upper block on its registry building, garden wall and containers clear, confidence recorded')
