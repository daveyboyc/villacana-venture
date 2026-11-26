#!/usr/bin/env python3
"""Check data/picasso_service_frontage.json: Calle Pintor Picasso south of the car park (task
picasso-bin-store-service-road). The hotel's lower wing keeps the registry ring exactly; every piece has
evidence that exists and a trust sentence; heights stay in the laser-survey ranges recorded in the trust;
nothing stands on a mapped route; the bin yard sits against the long wall's inner face; the utility row's
faces lie on the road's west side; the superseded IMG_2345-only features are gone; and each piece has a
confidence entry graded no better than estimated (no camera here is solved)."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
d = json.loads((ROOT / 'data/picasso_service_frontage.json').read_text())
sk = json.loads((ROOT / 'public/map/skeleton.json').read_text())
photos = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
confidence = json.loads((ROOT / 'data/confidence.json').read_text())['features']
car_park = json.loads((ROOT / 'data/picasso_car_park.json').read_text())
service_road = json.loads((ROOT / 'data/picasso_service_road.json').read_text())
roads = sk['boundaryReference']['roads']


def seg_distance(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz or 1)))
    return math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz)


def edge_points(ring, closed=True, step=0.25):
    pts = list(ring) + ([ring[0]] if closed else [])
    for a, b in zip(pts, pts[1:]):
        n = max(1, int(math.dist(a, b) / step))
        for i in range(n + 1):
            yield [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]


def clear_of_routes(name, ring, closed=True, half=0.0):
    for p in edge_points(ring, closed):
        for road in roads:
            gap = min(seg_distance(p, a, b) for a, b in zip(road['points'], road['points'][1:]))
            assert gap - half >= road['width'] / 2 - 0.05, f'{name} stands on mapped route {road.get("id") or road.get("name")} ({gap:.2f} m from its line at {p})'


frame = d['frame']
origin, along, east = frame['origin'], frame['along'], frame['east']
s_of = lambda p: (p[0] - origin[0]) * along[0] + (p[1] - origin[1]) * along[1]
e_of = lambda p: (p[0] - origin[0]) * east[0] + (p[1] - origin[1]) * east[1]
wall = car_park['wall']
# The frame is the long wall's line, ending at its south end.
assert origin == wall['points'][-1], 'frame origin is the long wall south end'
wd = [wall['points'][-1][0] - wall['points'][0][0], wall['points'][-1][1] - wall['points'][0][1]]
wl = math.hypot(*wd)
assert abs(along[0] - wd[0] / wl) < 1e-3 and abs(along[1] - wd[1] / wl) < 1e-3, 'frame runs along the long wall'

pieces = [d['hotelWing'], d['binYard'], d['recess'], d['slattedGate'], d['serviceGate'], *d['buildings']]
for f in pieces:
    assert f['evidence'] and set(f['evidence']) <= photos, f'{f["id"]}: evidence must be catalogued photos'
    assert len(f['trust']) > 60, f'{f["id"]}: trust sentence'
    key = 'picasso_service_frontage.json:' + f['id']
    assert key in confidence, f'{key}: no confidence entry'
    assert confidence[key]['level'] in ('estimated', 'inferred'), f'{key}: no camera is solved, so not photographed or registry-graded'

# Hotel lower wing: the registry ring exactly, top from the survey (flat, 3.75-4.1 m over the datum).
registry = {b['id']: b for b in sk['buildings']}
wing = d['hotelWing']
assert wing['ring'] == registry[wing['registryId']]['ring'], 'hotel lower wing keeps the registry footprint exactly'
assert registry[wing['registryId']].get('floors', 0) == 0, 'the registry part is still 0 storeys in the skeleton; the wing is drawn by src/picasso-service-frontage.ts'
assert 3.6 <= wing['top'] <= 4.1, 'wing top outside the surveyed 3.75-4.06 m'
clear_of_routes(wing['id'], wing['ring'])

# Bin yard: west of the long wall (inside the car park), within 3.2 m of it, along its last 12 m.
y = d['binYard']
for p in [*y['front'], *y['northEnd'], *y['southEnd'], *y['roadFace']]:
    assert -12.5 <= s_of(p) <= 3.0, f'bin yard runs along the wall\'s south end, not at s={s_of(p):.2f}'
    assert -3.2 <= e_of(p) <= 0.2, f'bin yard lies west of the wall\'s road face, within 3.2 m (e={e_of(p):.2f})'
assert all(abs(e_of(p) - 0.125) < 0.02 for p in y['roadFace']), 'the bin store\'s street face is flush with the long wall\'s road face (IMG_3124)'
for wall, o in ((y['front'], y['doorway']), (y['roadFace'], y['streetDoor'])):
    assert o['width'] / 2 <= o['at'] <= math.dist(*wall) - o['width'] / 2, 'bin yard openings fit their walls'
assert 'gate' not in y, 'the green door is in the street face, not the car-park front (IMG_3101 is taken from inside)'
assert 2.2 <= y['height'] <= 3.0
clear_of_routes(y['id'], y['front'], closed=False, half=y['thickness'] / 2)

# Utility row: faces on the road's west side, south-east of the wall's end, heights in the survey's range.
for b in d['buildings']:
    assert all(e_of(p) <= 0.7 for p in b['ring']), f'{b["id"]}: face no further into the road than 0.7 m east of the wall line'
    assert all(-3.5 <= s_of(p) <= 25 for p in b['ring']), f'{b["id"]}: within the stretch south of the car park'
    assert 1.4 <= b['top'] <= 3.0, f'{b["id"]}: top outside the surveyed 1.5-2.9 m'
    clear_of_routes(b['id'], b['ring'])
for f in (d['recess'], d['slattedGate'], d['serviceGate']):
    assert all(e_of(p) <= 0.7 for p in f['points'])
    clear_of_routes(f['id'], f['points'], closed=False, half=f['thickness'] / 2)

# The IMG_2345-only wall and brown-door front are superseded by the row.
# They stay in data/picasso_service_road.json as records (the placement graph has no retirement support), marked so
# src/picasso-service-road.ts does not build them.
for f in service_road['features']:
    if f['id'] in d['superseded']:
        assert f.get('superseded') and f.get('supersededBy') == 'picasso_service_frontage.json', f'{f["id"]}: superseded feature must be marked'
src = (ROOT / 'src/picasso-service-road.ts').read_text()
assert '!("superseded" in f)' in src and 'for(const f of picassoFeatures)' in src, 'superseded features must not be built'

print(f'Picasso service frontage: hotel lower wing on its registry ring, bin yard against the long wall, {len(d["buildings"])} utility buildings, set-back wall and gates clear of routes, all estimated PASS')
