"""Check the white wall, arched gateway and railings between the big-pool lawn and the paseo."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
d = json.loads((ROOT / 'data/seafront_fence.json').read_text())
skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
levels = json.loads((ROOT / 'data/main_pool.json').read_text())['levels']
paseo_wall = json.loads((ROOT / 'data/paseo_wall.json').read_text())['wall']
tags = json.loads((ROOT / 'data/reference_tags.json').read_text())
manifest = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
angle = math.radians(skeleton['viewRotation'])
PLAYER = 0.42


def turned(p):
    return p[0] * math.cos(angle) - p[1] * math.sin(angle), p[0] * math.sin(angle) + p[1] * math.cos(angle)


def to_segment(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)))
    return math.dist(p, (a[0] + dx * t, a[1] + dz * t))


def to_line(p, points):
    return min(to_segment(p, a, b) for a, b in zip(points, points[1:]))


def inside(p, ring):
    x, z = p
    result = False
    for a, b in zip(ring, ring[1:] + ring[:1]):
        if (a[1] > z) != (b[1] > z) and x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]:
            result = not result
    return result


def along(points, step=0.25):
    for a, b in zip(points, points[1:]):
        n = max(1, math.ceil(math.dist(a, b) / step))
        for i in range(n + 1):
            yield a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n


assert all(e in tags and (e.startswith('ref:') or e in manifest) for e in d['evidence']), 'Fence cites an uncatalogued source'
assert 'Dave' in d['trust'] and 'not measured' in d['trust']
paseo = [turned(p) for p in skeleton['seafront']['paseo']['points']]
pieces = [d['wall'], d['stub'], d['railing']]
gate = d['gate']
half = gate['opening'] / 2 + gate['pier']
piers = [(gate['at'][0] + gate['along'][0] * s * (gate['opening'] / 2 + gate['pier'] / 2),
          gate['at'][1] + gate['along'][1] * s * (gate['opening'] / 2 + gate['pier'] / 2)) for s in (-1, 1)]

# Off the paving, beside it: every piece stands just inland of the 3 m paseo.
for f in pieces:
    for p in along(f['points']):
        dist = to_line(p, paseo)
        assert skeleton['seafront']['paseo']['width'] / 2 + 0.1 <= dist - f['thickness'] / 2 and dist < 2.2, f"{f['id']} not beside the paseo at {p}"
# One continuous run: sandstone wall end, corner wall, gateway, short wall, railings.
wall_end = turned(paseo_wall['face'][-1])
assert math.dist(d['wall']['points'][0], wall_end) < 0.6, 'Corner wall does not start where the sandstone wall ends'
assert abs(math.dist(d['wall']['points'][-1], gate['at']) - half) < 0.05 and abs(math.dist(d['stub']['points'][0], gate['at']) - half) < 0.05, 'Gateway not between the two walls'
assert math.dist(d['stub']['points'][-1], d['railing']['points'][0]) < 0.01
# Calle Guillermo runs on through the gateway to the paseo, and the opening is walkable.
g = [turned(p) for p in next(r for r in skeleton['boundaryReference']['roads'] if r['id'] == 'guillermo')['points']]
assert to_line(gate['at'], g) < 0.2, 'Gateway is not on the line of Calle Guillermo'
assert to_line(g[-1], paseo) < 0.1, 'Calle Guillermo does not run through the gateway to the paseo'
assert gate['opening'] >= 2 * PLAYER + 0.4 and gate['spring'] + gate['opening'] / 2 >= 2.2, 'Gateway too narrow or too low to walk through'
# Railings end at the lawn's east edge, and nothing crosses a house, pool or lane.
assert to_line(d['railing']['points'][-1], [[-32, 88], [-34, 110]]) < 0.3, 'Railings do not reach the lawn east edge'
houses = [[turned(p) for p in b['ring']] for b in skeleton['buildings'] if b['floors'] > 0 and not b.get('passage')]
pools = [[turned(p) for p in p_['ring']] for p_ in skeleton['pools']]
roads = [[turned(p) for p in r['points']] for r in skeleton['boundaryReference']['roads']]
for f in pieces:
    for p in along(f['points']):
        assert not any(inside(p, r) for r in houses + pools), f"{f['id']} crosses a house or pool"
        assert all(to_line(p, r) >= 0.6 + f['thickness'] / 2 for r in roads), f"{f['id']} runs into a lane"
print(f"Seafront fence: corner wall from the sandstone wall's end, {gate['opening']} m arched gateway at the foot of Calle Guillermo, "
      f"{sum(math.dist(a, b) for a, b in zip(d['railing']['points'], d['railing']['points'][1:])):.0f} m of railings to the lawn's east edge, "
      f"all beside the paseo and clear of lanes, houses and pools PASS")
