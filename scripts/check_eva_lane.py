"""Calle Eva lane dressing: evidence, widths, registry fronts, gateway, pools, asphalt and wiring (not a survey)."""
import json, math
from pathlib import Path
from check_map import inside
ROOT = Path(__file__).resolve().parents[1]
d = json.loads((ROOT / 'data/eva_lane.json').read_text())
s = json.loads((ROOT / 'public/map/skeleton.json').read_text())
photos = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
gate = json.loads((ROOT / 'data/middle_pool.json').read_text())['gateway']
roads = {r['id']: r for r in s['boundaryReference']['roads']}


class Axis:
    def __init__(self, pts):
        self.p = pts; self.at0 = [0.0]
        for a, b in zip(pts, pts[1:]): self.at0.append(self.at0[-1] + math.dist(a, b))
        self.length = self.at0[-1]

    def right(self, i):
        a, b = self.p[i], self.p[i + 1]; l = math.dist(a, b)
        return (-(b[1] - a[1]) / l, (b[0] - a[0]) / l)

    def at(self, s, c):
        n = len(self.p); i = 0
        while i < n - 2 and s > self.at0[i + 1]: i += 1
        a, b = self.p[i], self.p[i + 1]; seg = self.at0[i + 1] - self.at0[i]; t = (s - self.at0[i]) / seg
        r = self.right(i)
        v = i + 1 if abs(t - 1) < 1e-6 and i < n - 2 else i if abs(t) < 1e-6 and i > 0 else -1
        if v > 0:
            p, q = self.right(v - 1), self.right(v); m = (p[0] + q[0], p[1] + q[1]); ml = math.hypot(*m)
            cos = (m[0] * q[0] + m[1] * q[1]) / ml; r = (m[0] / ml / cos, m[1] / ml / cos)
        return [a[0] + (b[0] - a[0]) * t + r[0] * c, a[1] + (b[1] - a[1]) * t + r[1] * c]


def seg_distance(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]; n = dx * dx + dz * dz
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / n)) if n else 0
    return math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t)


def area_points(ax, s0, s1, c0, c1, step=.1):
    """Sample a run-local rectangle, its edges and inside, every `step` metres."""
    ns, nc = max(1, math.ceil((s1 - s0) / step)), max(1, math.ceil(abs(c1 - c0) / step))
    for i in range(ns + 1):
        for j in range(nc + 1): yield ax.at(s0 + (s1 - s0) * i / ns, c0 + (c1 - c0) * j / nc)


tile = d['tile']
assert abs(tile['columns'] * (tile['size'] + tile['joint']) - 2 * d['bandHalf']) < .01, 'Band is not four tiles and joints wide'
assert .1 <= d['margin'] <= .2 and .08 <= d['kerb']['width'] <= .16 and .08 <= d['kerb']['height'] <= .2
assert all(p in photos for p in d['evidence']), 'eva-lane cites a photo missing from the manifest'
houses = [b for b in s['buildings'] if b['floors'] > 0]
gw_a, gw_b = gate['points']
asphalt = [r for r in roads.values() if r.get('surface') == 'asphalt']
bays = s['boundaryReference']['parking'].get('bayRings', [])
seen = set()
for run in d['runs']:
    ax = Axis(run['axis']); L = ax.length; h, m = d['bandHalf'], d['margin']
    assert run['evidence'] and all(p in photos for p in run['evidence']), f"{run['id']} evidence"
    pieces = [('paving', 0, L, -h, h), ('margins', 0, L, -h - m, h + m)]
    for kind in ('beds', 'lawns', 'spurs', 'planters'):
        for f in run[kind]:
            assert f['id'] not in seen; seen.add(f['id'])
            assert 0 <= f['s'][0] < f['s'][1] <= L + 1e-6, f"{f['id']} runs off its axis"
            assert all(p in photos for p in f.get('evidence', run['evidence'])), f"{f['id']} evidence"
            pieces.append((f['id'], f['s'][0], f['s'][1], min(f['c']), max(f['c'])))
    for k in run['kerbs']:
        assert all(p in photos for p in k['evidence']) and len(k['line']) >= 2
        for (s0, c0), (s1, c1) in zip(k['line'], k['line'][1:]):
            assert s0 == s1 or c0 == c1, f"{k['id']}: kerb legs run along or across the axis"
            pieces.append((k['id'], min(s0, s1), max(s0, s1), min(c0, c1) - d['kerb']['width'] / 2, max(c0, c1) + d['kerb']['width'] / 2))
    for name, s0, s1, c0, c1 in pieces:
        for p in area_points(ax, s0, s1, c0 + .02, c1 - .02):
            for b in houses: assert not inside(*p, b['ring']), f"{run['id']} {name} crosses house {b['id']} at {p}"
            for pool in s['pools']: assert not inside(*p, pool['ring']), f"{run['id']} {name} crosses a pool"
            assert seg_distance(p, gw_a, gw_b) > gate['thickness'] / 2 + .05, f"{name} runs into the middle pool east gateway"
            for r in asphalt: assert min(seg_distance(p, a, b) for a, b in zip(r['points'], r['points'][1:])) > r['width'] / 2, f"{name} on asphalt {r['id']}"
            for ring in bays: assert not inside(*p, ring), f"{name} on a parking bay"
    # The old 1.2 m ribbon is cut out over the run, so its walking line is inside the clip band.
    eva = roads['eva']; c0, c1 = run['clip']
    for i in range(int(L * 10) + 1):
        sa = i / 10
        q = ax.at(sa, (c0 + c1) / 2)
        near = min(seg_distance(q, a, b) for a, b in zip(eva['points'], eva['points'][1:]))
        assert near <= (c1 - c0) / 2 - eva['width'] / 2 + .2, f"{run['id']}: mapped Eva route leaves the cut band at s={sa}"
    # Roses stand inside a bed; climbers grow from inside the bed back to its house edge, in the run.
    for sh in run.get('shrubs', []):
        assert all(p in photos for p in sh['evidence'])
        for s0, s1 in sh['s']:
            assert any(b['s'][0] <= s0 and s1 <= b['s'][1] and b['c'][0] < sh['c'] < b['c'][1] for b in run['beds']), f"{sh['id']} leaves its beds"
    for cl in run.get('climbers', []):
        assert all(p in photos for p in cl['evidence']) and 1.5 <= cl['height'] <= 3.5 and cl['depth'] <= .6
        assert any(b['s'][0] <= cl['s'][0] and cl['s'][1] <= b['s'][1] and abs(b['c'][1] - cl['wallC']) < .1 for b in run['beds']), f"{cl['id']} is not at the back of a bed"
        for i in range(21):
            p = ax.at(cl['s'][0] + (cl['s'][1] - cl['s'][0]) * i / 20, cl['wallC'] - .05)
            assert not any(inside(*p, b['ring']) for b in houses), f"{cl['id']} grows inside a house"
    for lamp in run['lamps']: assert all(p in photos for p in lamp['evidence'])
    for plant in run['plants']: assert all(p in photos for p in plant['evidence']) and plant['kind'] in ('bird_of_paradise',)

# East: the band starts at the gateway's street face and is centred on the opening; it stops before Teodoro Rojo.
east = Axis(d['runs'][0]['axis'])
start = east.p[0]
assert seg_distance(start, gw_a, gw_b) < gate['thickness'] / 2 + gate['pier']['depth'] / 2 + .1, 'East band does not start at the gateway face'
tr = roads['teodoro-rojo']
for c in (-d['bandHalf'] - d['margin'], d['bandHalf'] + d['margin']):
    assert min(seg_distance(east.at(east.length, c), a, b) for a, b in zip(tr['points'], tr['points'][1:])) >= tr['width'] / 2 - .05, 'East band runs into Teodoro Rojo'

src = (ROOT / 'src/eva-lane.ts').read_text()
assert 'clippedHedge(' in src and 'wallClimber(' in src and 'userData.footprint' in src
assert 'if (scene.userData.layoutOnly) return;' in src and 'decorationClearance' in src and 'refine(geometry, siteY' in src
assert 'addEvaLane(scene)' in (ROOT / 'src/slice.ts').read_text() and 'suppressInEvaLane(skeleton)' in (ROOT / 'src/slice.ts').read_text()
assert 'flatMap(outsideEvaLane)' in (ROOT / 'src/boundaries.ts').read_text()
assert 'evaLaneSurfaces()' in (ROOT / 'src/blueprint.ts').read_text()
assert eva['width'] == 1.2, 'The mapped Eva route width is unchanged by this dressing'
print(f"Eva lane: {len(d['runs'])} photographed runs, {len(seen)} beds/lawns/spurs/planters clear of houses, pools, gateway and asphalt; old ribbon cut over the route; wired into scene, map and Details guard PASS")
