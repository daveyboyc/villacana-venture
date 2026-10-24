"""Check the raised terraces (data/raised_terraces.json, src/raised-terraces.ts).

Photo evidence and trust, the floor height against the levels survey, walkable stairs
(riser count and height, opening wide enough), outlines that keep off the pools, the
lanes and the inside of houses, house edges that really follow a registry front, and
that the terrace is wired into the game, the map and the browser test.
"""
import json
import math
from pathlib import Path
from check_map import inside

ROOT = Path(__file__).resolve().parents[1]
ns = {'__file__': str(ROOT / 'scripts/check_terrain.py')}
exec((ROOT / 'scripts/check_terrain.py').read_text().split('\nassert')[0], ns)
site_y = ns['site_y']
s = json.loads((ROOT / 'public/map/skeleton.json').read_text())
d = json.loads((ROOT / 'data/raised_terraces.json').read_text())
photos = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
survey = {i['id']: i for i in json.loads((ROOT / 'data/levels_survey.json').read_text())['items']}
tasks = {t['id']: t for t in json.loads((ROOT / 'data/build_queue.json').read_text())['tasks']}
buildings = {b['id']: b for b in s['buildings']}
PLAYER = 0.42


def seg(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)))
    return math.hypot(a[0] + t * dx - p[0], a[1] + t * dz - p[1])


def ring_gap(p, ring):
    return min(seg(p, ring[i], ring[(i + 1) % len(ring)]) for i in range(len(ring)))


def crosses(a, b, c, e):
    def orient(p, q, r):
        return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
    return orient(a, b, c) * orient(a, b, e) < 0 and orient(c, e, a) * orient(c, e, b) < 0


ids = set()
for t in d['terraces']:
    name, ring, edges = t['id'], t['outline'], t['edges']
    assert name not in ids, f'{name}: duplicate id'
    ids.add(name)
    assert t['evidence'] and all(p in photos for p in t['evidence']), f'{name}: cites a photo missing from the manifest'
    assert len(t['trust']) > 80 and 'Estimated' in t['trust'] and 'Photo-supported' in t['trust'], f'{name}: trust must say what is photo-supported and what is estimated'
    assert len(edges) == len(ring) >= 3, f'{name}: one edge entry per outline edge'
    assert all(e['kind'] in ('face', 'house', 'end') for e in edges), f'{name}: unknown edge kind'
    # A simple ring: no edge crosses another.
    n = len(ring)
    for i in range(n):
        for j in range(i + 2, n):
            if i == 0 and j == n - 1:
                continue
            assert not crosses(ring[i], ring[(i + 1) % n], ring[j], ring[(j + 1) % n]), f'{name}: outline crosses itself at edges {i} and {j}'
    area = abs(sum(ring[i][0] * ring[(i + 1) % n][1] - ring[(i + 1) % n][0] * ring[i][1] for i in range(n))) / 2
    assert area > 2, f'{name}: outline too small'
    sign = 1 if sum(ring[i][0] * ring[(i + 1) % n][1] - ring[(i + 1) % n][0] * ring[i][1] for i in range(n)) > 0 else -1
    # Height: the floor follows the survey; the base is the ground at the stair foot.
    item = survey[t['survey']]
    low, high = item['rise']
    assert low <= t['rise'] <= high, f"{name}: rise {t['rise']} m outside the survey's {low}-{high} m"
    assert f'{low}-{high} m' in t['trust'], f'{name}: trust should quote the survey range'
    assert item['model'] == 'built' and tasks[item['task']]['status'] == 'done', f"{t['survey']}: survey item not marked built"
    assert tasks['raised-terraces']['status'] == 'done', 'raised-terraces task not marked done'
    assert t['face'].get('height', t['rise']) >= t['rise'], f'{name}: wall top lower than floor'
    if t['area'] == 'middle-pool':
        assert not t['walkable'] and not t['openings'], f'{name}: no photographed private access'
        assert any(e['kind'] == 'end' for e in edges), f'{name}: untraced extent must remain explicit'
    # House edges run along a registry front; houses keep their own datum (not lifted here).
    for i, e in enumerate(edges):
        if e['kind'] != 'house':
            continue
        b = buildings[e['building']]
        for p in (ring[i], ring[(i + 1) % n]):
            assert ring_gap(p, b['ring']) < 0.05, f"{name}: edge {i} does not follow {e['building']}'s front"
    # Inside: off the pools, the lanes and the inside of every house.
    xs, zs = [p[0] for p in ring], [p[1] for p in ring]
    samples = [(x / 4, z / 4) for x in range(int(min(xs) * 4), int(max(xs) * 4) + 1) for z in range(int(min(zs) * 4), int(max(zs) * 4) + 1) if inside(x / 4, z / 4, ring)]
    assert samples, f'{name}: no floor samples'
    for p in samples:
        for pool in s['pools']:
            assert not inside(*p, pool['ring']) and ring_gap(p, pool['ring']) > 2.0, f'{name}: floor reaches the {pool["id"]} pool deck at {p}'
        for b in s['buildings']:
            if b['floors'] > 0 and inside(*p, b['ring']):
                assert ring_gap(p, b['ring']) < 0.3, f"{name}: floor runs inside house {b['id']} at {p}"
        for r in s['boundaryReference']['roads']:
            assert min(seg(p, a, q) for a, q in zip(r['points'], r['points'][1:])) > r['width'] / 2 + PLAYER, f"{name}: floor on lane {r['id']}"
    # Openings and stairs: a walker fits, one shallow riser at a time, the foot on the ground outside.
    assert t['openings'] or not t['walkable'], f'{name}: a walkable terrace needs an opening'
    for o in t['openings']:
        a, b = ring[o['edge']], ring[(o['edge'] + 1) % n]
        length = math.dist(a, b)
        assert edges[o['edge']]['kind'] in ('face', 'end'), f"{o['id']}: opening on a house edge"
        assert 0 <= o['at'] and o['at'] + o['width'] <= length + 0.01, f"{o['id']}: opening runs past its edge"
        assert o['width'] >= 2 * PLAYER + 0.3, f"{o['id']}: opening too narrow to walk through"
        st = o['stair']
        riser = t['rise'] / st['risers']
        assert 0.12 <= riser <= 0.2 and 0.25 <= st['tread'] <= 0.45, f"{o['id']}: riser {riser:.2f} m / tread {st['tread']} m not a walkable stair"
        assert st['direction'] in ('in', 'out')
        if o['id'] == t['survey'] or t['survey'] == o['id']:
            assert st['risers'] == item['risers'], f"{o['id']}: survey counts {item['risers']} risers"
        u = ((b[0] - a[0]) / length, (b[1] - a[1]) / length)
        nrm = (-u[1] * sign, u[0] * sign)
        mid = (a[0] + u[0] * (o['at'] + o['width'] / 2), a[1] + u[1] * (o['at'] + o['width'] / 2))
        assert inside(mid[0] + nrm[0] * 0.1, mid[1] + nrm[1] * 0.1, ring), f"{o['id']}: inward normal is wrong"
        run = (st['risers'] - 1) * st['tread']
        foot = mid if st['direction'] == 'in' else (mid[0] - nrm[0] * run, mid[1] - nrm[1] * run)
        if st['direction'] == 'in':
            top = (mid[0] + nrm[0] * (run + 0.5), mid[1] + nrm[1] * (run + 0.5))
            assert inside(*top, ring), f"{o['id']}: cut-back flight runs out of the terrace"
        out = (foot[0] - nrm[0] * 1.0, foot[1] - nrm[1] * 1.0)
        assert not inside(*out, ring), f"{o['id']}: stair foot is not on the ground outside"
        assert not any(b['floors'] > 0 and inside(*out, b['ring']) for b in s['buildings']), f"{o['id']}: stair foot lands in a house"
        if o is t['openings'][0]:
            assert math.dist(foot, t['base']) < 0.05, f"{name}: base should be the first stair foot"
        assert abs(site_y(foot) - site_y(t['base'])) < 0.03, f"{name}: openings need a shared path datum"
        if 'at' in item:
            gap = math.dist(foot, item['at'])
            assert gap <= item['atAccuracy'], f"{o['id']}: {gap:.1f} m from the survey position, outside its +-{item['atAccuracy']} m"
    # The ground at the base is the path level: a walkable terrace's stairs start at its pool's surveyed deck level,
    # and the survey's reading of the patio itself is not added to the ground under it (the floor is never buried).
    pool_deck = ns['grid']['decks'][{'north-pool': 'north', 'middle-pool': 'middle'}[t['area']]]
    assert not t['walkable'] or abs(site_y(t['base']) - pool_deck) < 0.15, f'{name}: stair foot should be at lawn level'
    assert all(site_y(p) <= site_y(t['base']) + t['rise'] for p in ring), f'{name}: ground under the terrace rises through its floor'
    for w in t.get('walks', []):
        for p in w:
            assert inside(*p, ring) and ring_gap(p, ring) > PLAYER + 0.2, f'{name}: walk point {p} too close to an edge'

# Issue 55: independent wall/floor levels and explicitly bounded private fragments.
middle = {t['id']: t for t in d['terraces'] if t['area'] == 'middle-pool'}
expected = {
    'middle-pool-north-terrace': (0.45, 0.8, {'IMG_2193.jpg', 'IMG_2194.jpg'}),
    'middle-pool-oleander-bed': (0.2, 0.2, {'IMG_2246.jpg', 'IMG_2247.jpg'}),
    'middle-pool-curved-hedge-patio': (0.2, 0.4, {'IMG_2341.jpg'}),
}
for name, (rise, wall, evidence) in expected.items():
    t = middle[name]
    assert t['rise'] == rise and t['face']['height'] == wall, f'{name}: photo floor/wall levels conflated'
    assert evidence <= set(t['evidence']), f'{name}: missing photographed evidence'
    assert 'untraced' in t['trust'].lower() or 'Untraced' in t['trust'], f'{name}: hidden boundary limit omitted'
    assert not t['openings'] and not t['walkable'], f'{name}: private access inferred'
assert 'uncertain' in middle['middle-pool-curved-hedge-patio']['trust'].lower(), 'IMG_2341 placement must remain uncertain'
assert middle['middle-pool-oleander-bed']['floor'] == 'soil', 'Oleander bed must not become an invented paved patio'

# Wired into the game, the map and the browser test.
src = {f: (ROOT / f).read_text() for f in ('src/slice.ts', 'src/blueprint.ts', 'scripts/test_layout_browser.cjs')}
assert 'raisedTerraceGroundOffset(x,z)' in src['src/slice.ts'] and 'raisedTerraceRings()' in src['src/slice.ts'] and 'addRaisedTerraces(scene)' in src['src/slice.ts'], 'slice.ts does not use the terrace ground, rings and meshes'
assert 'raisedTerraceBlueprint()' in src['src/blueprint.ts'], 'blueprint.ts does not draw the terraces'
assert 'raisedTerraceGroundOffset(x, z)' in src['scripts/test_layout_browser.cjs'] and '...raisedTerraceRings()' in src['scripts/test_layout_browser.cjs'], 'browser test world lacks the terraces'
print(f"Raised terraces: {len(ids)} terrace(s), floors within the survey, stairs walkable, clear of pools, lanes and houses PASS")
