"""Check the ground heights: the laser-survey grid, pools level at their decks, photographed flights, walkable lanes."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
grid = json.loads((ROOT / 'data/terrain.json').read_text())
skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
angle = math.radians(skeleton['viewRotation'])
SIN, COS = math.sin(math.radians(26)), math.cos(math.radians(26))
RAMP_BLEND = 3


def turned(p):
    return p[0] * math.cos(angle) - p[1] * math.sin(angle), p[0] * math.sin(angle) + p[1] * math.cos(angle)


def surveyed(x, z):
    """The same bilinear sample as surveyed in src/terrain.ts."""
    u = max(0, min(grid['nx'] - 1.001, (x - grid['x0']) / grid['step']))
    v = max(0, min(grid['nz'] - 1.001, (z - grid['z0']) / grid['step']))
    i, j = int(u), int(v)
    fu, fv, row, nxt = u - i, v - j, grid['cm'][j], grid['cm'][j + 1]
    top = row[i] + (row[i + 1] - row[i]) * fu
    bottom = nxt[i] + (nxt[i + 1] - nxt[i]) * fu
    return (top + (bottom - top) * fv) / 100


def site_y(p):
    """The same rule as siteY in src/terrain.ts."""
    x, z = p[0], p[1]
    tz = x * SIN + z * COS
    seaward = 1 - max(0, min(1, (tz - grid['fade'][0]) / (grid['fade'][1] - grid['fade'][0])))
    if not seaward:
        return 0
    y = surveyed(x, z)
    for r in grid['ramps']:
        length = math.dist(r['foot'], r['toward'])
        up = [(r['toward'][0] - r['foot'][0]) / length, (r['toward'][1] - r['foot'][1]) / length]
        dx, dz = x - r['foot'][0], z - r['foot'][1]
        along, across = dx * up[0] + dz * up[1], abs(dz * up[0] - dx * up[1])
        below, beyond = max(-1 - along, 0) / r['behind'], max(along - (r['run'] + 1.5), 0) / RAMP_BLEND
        aside = max(across - r['halfWidth'], 0) / RAMP_BLEND
        weight = (1 - max(0, min(1, max(below, beyond)))) * (1 - max(0, min(1, aside)))
        if weight > 0:
            y += (r['base'] + r['rise'] * max(0, min(1, (along - r['start']) / (r['run'] - r['start']))) - y) * weight
    return y * seaward


def along(points, step=1.0):
    for a, b in zip(points, points[1:]):
        count = max(1, math.ceil(math.dist(a, b) / step))
        for i in range(count):
            yield [a[0] + (b[0] - a[0]) * i / count, a[1] + (b[1] - a[1]) * i / count]
    yield points[-1]


def flight_point(r, distance):
    length = math.dist(r['foot'], r['toward'])
    return [r['foot'][j] + (r['toward'][j] - r['foot'][j]) * distance / length for j in range(2)]


def near_flight(p):
    """Inside a photographed flight's own profile or its blend."""
    for r in grid['ramps']:
        a, c = (lambda rel, up: (rel[0] * up[0] + rel[1] * up[1], abs(rel[1] * up[0] - rel[0] * up[1])))(
            [p[0] - r['foot'][0], p[1] - r['foot'][1]], [(r['toward'][j] - r['foot'][j]) / math.dist(r['foot'], r['toward']) for j in range(2)])
        if -1 - r['behind'] < a < r['run'] + 1.5 + RAMP_BLEND and c < r['halfWidth'] + RAMP_BLEND:
            return True
    return False


assert 'PNOA-LiDAR' in grid['source'] and 'CC BY 4.0' in grid['source'], 'The survey grid must carry its attribution'
assert len(grid['cm']) == grid['nz'] and all(len(row) == grid['nx'] for row in grid['cm']), 'Grid shape'
# Every pool stays level at its surveyed deck (the lowered main-pool area adds the drop to the grid).
# The decks sit where the laser survey puts them (docs/reviews/lidar-levels): north +0.80, south +0.11, middle 0, main about -2.9.
SURVEYED_DECK = {'north': 0.80, 'south': 0.11, 'middle': 0.0, 'main': -2.95, 'toddler': -2.95}
for pool in skeleton['pools']:
    deck = grid['decks'][pool['id']]
    lift = grid['loweredDrop'] if deck < -1 else 0
    ys = [site_y(p) for p in pool['ring']]
    assert max(ys) - min(ys) <= 0.01 and abs(min(ys) - deck - lift) <= 0.01, f"{pool['id']} pool is not level at its deck"
    assert abs(deck - SURVEYED_DECK[pool['id']]) <= 0.15, f"{pool['id']} deck {deck} m is off the survey"
# Photographed flights keep an exact rise inside the photographed range, at a walkable pitch.
for r in grid['ramps']:
    low, high = r['photoRise']
    assert low - 1e-6 <= r['rise'] <= high + 1e-6, f"{r['id']}: rise outside the photographed range"
    assert (r['from'] == 'survey') == (r['rise'] == r['surveyRise']), f"{r['id']}: rise source mislabelled"
    assert abs(site_y(flight_point(r, r['start'])) - r['base']) < 0.005 and abs(site_y(flight_point(r, r['run'])) - r['base'] - r['rise']) < 0.005, f"{r['id']}: flight does not climb its rise"
    assert r['rise'] / (r['run'] - r['start']) <= 0.22 and 0 < r['behind'] <= RAMP_BLEND, f"{r['id']}: flight too steep to walk"
flights = {r['id']: r for r in grid['ramps']}
roads = {r['id']: r for r in skeleton['boundaryReference']['roads']}
# Pintor Dalí runs along the upper side (Dave: about half a metre up; the survey 0.6-1.9 m), down to the paseo at its seaward end.
for p in roads['dali']['points']:
    if turned(p)[1] < 120:
        assert site_y(p) >= 0.4, 'Pintor Dalí is not on the upper side'
# Every lane is walkable: outside the photographed flights no 2 m stretch is steeper than 15 %.
for name, road in roads.items():
    pts = list(along(road['points'], 2.0))
    for p, q in zip(pts, pts[1:]):
        if math.dist(p, q) > 0.5 and not (near_flight(p) or near_flight(q)):
            assert abs(site_y(q) - site_y(p)) / math.dist(p, q) <= 0.15, f'{name}: too steep to walk at {p}'
# The photographed Cervantes ramp climbs with the steps beside it.
ramp = skeleton['boundaryReference']['ramps'][0]
top, bottom = ramp['points']
steps = flights['cervantes-elena-steps']
assert abs(site_y(top) - site_y(bottom) - steps['rise']) < 0.03, 'Ground does not climb at the Cervantes ramp'
# The steps beside it (IMG_2286, IMG_2355): photographed tread spacing, and every tread above the ramp beside it.
tread = json.loads((ROOT / 'data/cervantes_elena_steps.json').read_text())
sf, st = tread['foot'], tread['toward']
up = [(st[0] - sf[0]) / math.dist(sf, st), (st[1] - sf[1]) / math.dist(sf, st)]
assert abs(tread['risers'][0] - 0.4) < 0.05 and all(.45 <= b - a <= .55 for a, b in zip(tread['risers'], tread['risers'][1:])), 'Cervantes steps: treads not one tile plus nosing'
for i, end in enumerate(tread['risers'][1:] + [tread['end']]):
    for across in tread['across']:
        p = [sf[0] + up[0] * end - up[1] * across, sf[1] + up[1] * end + up[0] * across]
        assert site_y(p) <= site_y(sf) + steps['rise'] * (i + 1) / len(tread['risers']) + 0.005, f'Cervantes steps: tread {i + 1} below the ramp'
# Calle Eva climbs out of the middle pool courtyard at the stone steps (IMG_2333) and runs on up towards Dalí.
eva = roads['eva']['points']
assert site_y(eva[0]) - site_y(eva[2]) >= 0.5 and abs(site_y(eva[3]) - grid['decks']['middle']) < 0.05, 'Calle Eva does not climb towards Dalí'
flight = json.loads((ROOT / 'data/middle_pool_steps.json').read_text())
sw = flights['middle-pool-sw-steps']
assert abs(site_y(flight['toward']) - site_y(flight['foot']) - sw['rise']) < 0.01, 'Ground does not climb at the middle pool steps'
photos = {p['file']: p for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
assert abs(site_y([photos['IMG_2248.jpg']['x'], photos['IMG_2248.jpg']['z']]) - sw['base'] - sw['rise']) < 0.05, 'IMG_2248 looks along the upper lane, above the steps'
# Elena south runs from the Cervantes junction to the middle pool gate without a step (photos read it level;
# the survey has it falling about 0.35 m over 15 m, too gentle to see).
es = list(along(roads['elena-south']['points'][1:], 1.0))
assert all(abs(site_y(q) - site_y(p)) <= 0.05 for p, q in zip(es, es[1:]) if not (near_flight(p) or near_flight(q))), 'Elena south has a step'
# Seaward of the fade line the seafront heights take over.
assert all(site_y([x, z]) == 0 for x in range(-260, 120, 20) for z in range(170, 260, 20) if x * SIN + z * COS >= grid['fade'][1])
# The lane itself carries no hump of its own.
assert len(set(roads['cervantes']['heights'])) == 1
print('Terrain: laser-survey grid (attributed), pools level at surveyed decks, photographed flights exact, Dalí side up, lanes walkable PASS')
