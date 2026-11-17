"""Check data/door_sills.json (issue #57): sills against the photographed doors, the Dalí
footpath kerb against the car park edge and house fronts, the south Dalí approach against
its arch and photos, the surveyed heights, and that every route stays walkable.

The model's ground offsets are mirrored here from src/door-sills.ts; heights are photo
reads, not measurements, so the checks hold the build to the survey ranges.
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
d = json.loads((ROOT / 'data/door_sills.json').read_text())
s = json.loads((ROOT / 'public/map/skeleton.json').read_text())
photos = {p['file']: p for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
survey = {i['id']: i for i in json.loads((ROOT / 'data/levels_survey.json').read_text())['items']}
fronts = json.loads((ROOT / 'data/frontage_divisions.json').read_text())
parking = json.loads((ROOT / 'data/dali_cervantes.json').read_text())['parking']
MAX_STEP = 0.45  # Player maxGroundStep in slice.ts and the layout browser test.


def inside(p, ring):
    hit = False
    for a, b in zip(ring, ring[1:] + ring[:1]):
        if (a[1] > p[1]) != (b[1] > p[1]) and p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]:
            hit = not hit
    return hit


def seg_dist(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    if not dx and not dz:
        return math.dist(p, a)
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)))
    return math.dist(p, (a[0] + dx * t, a[1] + dz * t))


def ring_dist(p, ring):
    return min(seg_dist(p, a, b) for a, b in zip(ring, ring[1:] + ring[:1]))


def bearing(frm, to):
    return math.degrees(math.atan2(to[0] - frm[0], -(to[1] - frm[1]))) % 360


def angle_gap(a, b):
    return abs((a - b + 180) % 360 - 180)


at = lambda o, u, a, v=(0, 0), b=0: (o[0] + u[0] * a + v[0] * b, o[1] + u[1] * a + v[1] * b)
dot = lambda p, o, u: (p[0] - o[0]) * u[0] + (p[1] - o[1]) * u[1]
solid = [b['ring'] for b in s['buildings'] if b.get('floors', 0) > 0 and not b.get('passage')]
roads = s['boundaryReference']['roads']
evidence = set()

# ---- Sills: only at photographed doors, placed where the photos put them.
item = survey['elena-south-sills']
lawns = {r['id']: r['ring'] for r in fronts['regions'] if r['kind'] == 'lawn'}
door_path = next(r['ring'] for r in fronts['regions'] if r['id'] == 'cervantes-lawn-door-path')
for sill in d['sills']:
    name, door, out = sill['id'], sill['door'], sill['outward']
    assert abs(math.hypot(*out) - 1) < 0.01, f'{name}: outward is not a unit vector'
    assert item['rise'][0] <= sill['rise'] <= item['rise'][1], f'{name}: rise outside the survey range'
    assert sill['tread'] in ('red', 'white'), f'{name}: tread is red or white in the photos'
    assert sill['photoBearings'] and set(sill['photoBearings']) <= set(sill['evidence']), f'{name}: bearings need cited photos'
    for photo in sill['evidence']:
        assert photo in photos and photo in item['photos'], f'{name}: {photo} is not a surveyed sill photo'
        evidence.add(photo)
    # The best-pinned view (IMG_2330, ±3.4 m) must see the door where the photo shows it.
    cam = photos['IMG_2330.jpg']
    gap = angle_gap(bearing((cam['x'], cam['z']), door), sill['photoBearings']['IMG_2330.jpg'])
    assert gap <= 8, f'{name}: {gap:.1f} deg off the door in IMG_2330'
    across = (-out[1], out[0])
    corners = [at(door, across, a, out, b) for a in (-sill['width'] / 2, sill['width'] / 2) for b in (0, sill['depth'])]
    assert not any(inside(c, r) for c in corners for r in solid), f'{name}: sill inside a building'
    assert not any(inside(c, r) for c in corners for r in lawns.values()), f'{name}: sill on a lawn'
    for r in roads:
        clear = min(seg_dist(c, a, b) for c in corners for a, b in zip(r['points'], r['points'][1:]))
        assert clear > r['width'] / 2 + 0.3, f'{name}: sill on route {r["id"]}'
first = d['sills'][0]
assert ring_dist(at(first['door'], first['outward'], first['depth']), door_path) < 0.5, 'lawn-path sill must meet the end of the traced door path'
# Spacing between the two doors from IMG_2261 (heading-independent): about 11 deg apart.
cam = photos['IMG_2261.jpg']
model_spread = angle_gap(bearing((cam['x'], cam['z']), d['sills'][0]['door']), bearing((cam['x'], cam['z']), d['sills'][1]['door']))
photo_spread = abs(d['sills'][1]['photoBearings']['IMG_2261.jpg'] - d['sills'][0]['photoBearings']['IMG_2261.jpg'])
assert abs(model_spread - photo_spread) <= 6, f'door spacing {model_spread:.1f} deg vs photo {photo_spread} deg in IMG_2261'
assert d['omittedDoors'] and all(o['why'] for o in d['omittedDoors']), 'say why photographed doors are left out'

# ---- Dalí footpath kerb: on the car park edge, reaching the house fronts.
k, item = d['footpathKerb'], survey['dali-footpath-kerb']
o, e, n = k['origin'], k['along'], k['toward']
assert abs(e[0] * n[0] + e[1] * n[1]) < 0.01 and abs(math.hypot(*e) - 1) < 0.01, 'kerb axes'
assert item['rise'][0] <= k['rise'] <= item['rise'][1], 'footpath kerb outside the survey range'
for photo in item['photos']:
    assert photo in k['evidence'], f'footpath kerb must cite {photo}'
evidence.update(k['evidence'])
car_park = next(c['ring'] for c in s['boundaryReference']['carParks'] if c['id'] == 'dali')
for st in [k['taper'] + i * (k['length'] - k['taper']) / 10 for i in range(11)]:
    p = at(o, e, st)
    assert ring_dist(p, car_park) < 0.35, f'kerb at s={st:.1f} is {ring_dist(p, car_park):.2f} m off the car park edge'
    assert not any(inside(at(o, e, st, n, c), b) for b in parking['bayRings'] for c in (k['pathEdge'] + 0.2, k['width'] - 0.2)), f'footpath on bays at s={st:.1f}'
    # The south end opens onto the corner at the Patricia mouth, past the last house front.
    if k['taper'] + 0.5 <= st <= k['length'] - 1.6:
        assert any(inside(at(o, e, st, n, k['width']), r) for r in solid), f'footpath stops short of the house fronts at s={st:.1f}'
        assert not any(inside(at(o, e, st, n, c), r) for r in solid for c in (0.2, k['pathEdge'])), f'kerb or lawn inside a house at s={st:.1f}'
dr = k['drain']
mid = at(o, e, sum(dr['along']) / 2, n, dr['across'][1] + 0.12)
assert any(inside(mid, r) or ring_dist(mid, r) < 0.35 for r in solid), 'porch drain is not at the house front'
assert set(dr['evidence']) <= set(k['evidence'])

# ---- South Dalí approach: square to the arch recess, matching IMG_2283, rising without steps.
a, item = d['approach'], survey['dali-south-approach']
arch, out = a['arch'], a['outward']
right = (out[1], -out[0])  # right-hand side walking in
building = next(b['ring'] for b in s['buildings'] if b['id'] == a['building'])
assert ring_dist(arch, building) < 0.15, 'arch is not on its registry building face'
assert item['rise'][0] <= a['rise'] <= item['rise'][1], 'approach rise outside the survey range'
run = a['slope'] - a['level']
assert item['run'][0] <= run <= item['run'][1], f'approach run {run} m outside the survey range'
assert a['rise'] / run <= 0.08, 'approach is steeper than a gentle rise'
assert item['rise'][0] - 0.05 <= a['kerbHeight'] <= 0.25, 'flared kerbs are 0.15-0.25 m'
for photo in item['photos']:
    assert photo in a['evidence']
evidence.update(a['evidence'])
for photo, heading in a['photoHeading'].items():
    assert angle_gap(bearing((0, 0), (-out[0], -out[1])), heading) <= 10, f'{photo} heading {heading} vs approach axis'
cam = photos['IMG_2283.jpg']
assert abs(dot((cam['x'], cam['z']), arch, right)) < cam['accuracy'], 'IMG_2283 camera is off the approach axis'
assert dot((cam['x'], cam['z']), arch, out) > a['foot'], 'IMG_2283 camera stands on the asphalt beyond the foot'


def inner(t, side):
    if side != a['flare']['side']:
        return a['halfWidth']
    f = a['flare']
    return a['halfWidth'] + f['extra'] * min(1, max(0, (t - f['from']) / (f['to'] - f['from'])))


def surface(t):
    if t <= a['level']:
        return a['rise']
    if t <= a['slope']:
        return a['rise'] + (a['footRise'] - a['rise']) * (t - a['level']) / (a['slope'] - a['level'])
    return a['footRise'] * max(0, a['foot'] - t) / (a['foot'] - a['slope'])


for i in range(67):
    t = a['foot'] * i / 66
    for side, sign in (('left', -1), ('right', 1)):
        for q in (0, inner(t, side), inner(t, side) + a['kerbWidth']):
            p = at(arch, out, max(t, 0.12), right, sign * q)  # its head butts the recess face
            assert not any(inside(p, r) for r in solid), f'approach inside a building at t={t:.2f}'
            assert not any(inside(at(arch, out, t, right, sign * max(0, q - 0.05)), r) for r in parking['bayRings']), f'approach on the bays at t={t:.2f}'
    assert abs(surface(t) - surface(min(a['foot'], t + a['foot'] / 66))) < 0.03, f'approach has a step at t={t:.2f}'

# ---- Route clearance: everything is a step the player takes, never a wall.
steps = [x['rise'] for x in d['sills']] + [k['rise'], a['footRise'] + a['kerbHeight'], a['kerbHeight']]
assert max(steps) < MAX_STEP, 'a feature is taller than the player can step'
for r in roads:
    for p1, p2 in zip(r['points'], r['points'][1:]):
        for i in range(21):
            p = (p1[0] + (p2[0] - p1[0]) * i / 20, p1[1] + (p2[1] - p1[1]) * i / 20)
            t, q = dot(p, arch, out), dot(p, arch, right)
            assert not (0 <= t <= a['foot'] and abs(q) < 2.2), f'route {r["id"]} runs over the approach'

for name in ('elena-south-sills', 'dali-footpath-kerb', 'dali-south-approach'):
    assert survey[name]['model'] == 'built', f'{name}: set model to built in data/levels_survey.json'
assert all(p in photos for p in evidence)
print(f"Door sills: {len(d['sills'])} sills at photographed doors ({len(d['omittedDoors'])} left out), Dalí footpath kerb {k['length']:.1f} m, "
      f"south Dalí approach {a['rise']:.2f} m over {run:.1f} m; {len(evidence)} photos cited PASS")
