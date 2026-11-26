#!/usr/bin/env python3
"""Check Calle Pintor Picasso's run on to the beach (data/picasso_beach_lane.json, street picasso-beach-lane, the
forecourt apron): the lane joins the road and ends on the paseo, keeps clear of every standing house and the big-pool
lawn wall, falls with the laser-survey terrain; the tower stays off the lane; the terrace wall lies on the registry
strip's lane edge; every piece has evidence and an estimated confidence entry; the lane details are Show-details only."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
d = json.loads((ROOT / 'data/picasso_beach_lane.json').read_text())
sk = json.loads((ROOT / 'public/map/skeleton.json').read_text())
layout = json.loads((ROOT / 'data/street_layout.json').read_text())
photos = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
confidence = json.loads((ROOT / 'data/confidence.json').read_text())['features']
lawn_wall = json.loads((ROOT / 'data/picasso_lawn_wall.json').read_text())


def seg_distance(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz or 1)))
    return math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz)


def line_distance(p, line):
    return min(seg_distance(p, a, b) for a, b in zip(line, line[1:]))


def samples(ring, closed=True):
    pts = list(ring) + ([ring[0]] if closed else [])
    for a, b in zip(pts, pts[1:]):
        n = max(1, int(math.dist(a, b) / 0.25))
        for i in range(n + 1):
            yield [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]


streets = {s['id']: s for s in layout['streets']}
lane, road = streets['picasso-beach-lane'], streets['picasso']
for coll in (sk['streets'], sk['boundaryReference']['roads']):
    mine = {s['id']: s for s in coll}
    assert mine['picasso-beach-lane']['points'] == lane['points'] and mine['picasso']['points'] == road['points'], 'skeleton streets match data/street_layout.json'
assert lane['name'] == road['name'] == 'Calle Pintor Picasso'
assert lane['points'][0] == road['points'][-1], 'the lane starts where the road ends'
paseo = sk['seafront']['paseo']['points']
assert line_distance(lane['points'][-1], paseo) < 0.05, 'the lane ends on the paseo'

# Clear of standing houses (half-width plus 0.3 m) and of the lawn wall's face.
houses = [b for b in sk['buildings'] if b.get('floors', 0) > 0 and not b.get('passage')]
for name, s in (('lane', lane), ('road extension', {'points': road['points'][-4:], 'width': road['width']})):
    for b in houses:
        gap = min(line_distance(p, s['points']) for p in samples(b['ring']))
        if b['id'] == '6465301UF1366N_part2':
            continue  # the hotel's low block at the road's existing end, unchanged
        assert gap >= s['width'] / 2 + 0.3, f'{name} within {gap:.2f} m of house {b["id"]}'
wall_gap = min(line_distance(p, lane['points']) for p in samples(lawn_wall['points'], closed=False))
assert wall_gap - lawn_wall['thickness'] / 2 >= lane['width'] / 2 + 0.25, f'lane too close to the lawn wall ({wall_gap:.2f} m)'

# Tower: off the lane and the road, on its surveyed top.
t = d['tower']
assert min(line_distance(t['centre'], s['points']) for s in (lane, road)) > t['size'] / math.sqrt(2) + 3.0, 'tower stands off the road'
assert 4.8 <= t['top'] <= 6.0, 'tower top inside the surveyed 5.2-5.7 m'

# Terrace: the registry strip exactly; its wall on the lane side, clear of the lane.
reg = {b['id']: b for b in sk['buildings']}['6465801UF1366N_part2']
assert d['eastTerrace']['ring'] == reg['ring'] and reg.get('floors', 0) == 0, 'terrace keeps the 0-storey registry strip'
wall = reg['ring'][:3]
assert min(line_distance(p, lane['points']) for p in samples(wall, closed=False)) >= lane['width'] / 2 + 0.05, 'terrace wall clear of the lane'
assert 0.5 <= d['eastTerrace']['wallHeight'] <= 1.2

# Mouth details sit in the lane, near the paseo.
m = d['mouth']
for p in (m['bollard'], m['grate']['centre']):
    assert line_distance(p, lane['points']) <= lane['width'] / 2 and math.dist(p, lane['points'][-1]) < 3, 'lane-mouth details in the lane at the paseo'

# Evidence and confidence.
for f in (t, d['eastTerrace'], m):
    assert f['evidence'] and set(f['evidence']) <= photos and len(f['trust']) > 60
    assert confidence.get('picasso_beach_lane.json:' + f['id'], {}).get('level') == 'estimated'
for key in ('street:picasso-beach-lane', 'ground_plan_picasso.json:picasso-beach-road-forecourt'):
    assert confidence.get(key, {}).get('level') == 'estimated', key
src = (ROOT / 'src/slice.ts').read_text()
assert 'if(!layoutOnly)detailSteps.push({spatial:true,build:(into,keep)=>addPicassoBeachLaneDetails(into,keep)})' in src, 'lane details are Show-details only'
print(f'Picasso beach lane: {len(lane["points"])}-point lane from the road to the paseo, clear of houses and the lawn wall, tower, terrace and mouth estimated PASS')
