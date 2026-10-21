"""Check the lowered Calle Guillermo and Jorge, the kiosk at the lane's foot and the east steps from the Picasso side."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = json.loads((ROOT / 'data/guillermo_slope.json').read_text())
levels = json.loads((ROOT / 'data/main_pool.json').read_text())['levels']
skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
tags = json.loads((ROOT / 'data/reference_tags.json').read_text())
angle = math.radians(skeleton['viewRotation'])
STREET, PLAYER = 0.27, 0.42
foot = STREET - levels['drop']


def turned(p):
    return p[0] * math.cos(angle) - p[1] * math.sin(angle), p[0] * math.sin(angle) + p[1] * math.cos(angle)


def inside(p, ring):
    x, z = p
    result = False
    for a, b in zip(ring, ring[1:] + ring[:1]):
        if (a[1] > z) != (b[1] > z) and x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]:
            result = not result
    return result


def to_segment(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)))
    return math.dist(p, (a[0] + dx * t, a[1] + dz * t))


def to_ring(p, ring):
    return min(to_segment(p, a, b) for a, b in zip(ring, ring[1:] + ring[:1]))


def along(points, heights, steps=50):
    for a, b, ha, hb in zip(points, points[1:], heights, heights[1:]):
        for i in range(steps + 1):
            yield (a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps), ha + (hb - ha) * i / steps


assert all(ref in tags for ref in spec['evidence']), 'Evidence screenshot is not catalogued in data/reference_tags.json'
assert 'not heights' in spec['trust'] and 'Estimated' in spec['trust'], 'Trust must say the heights are estimates'
roads = {r.get('id'): r for r in skeleton['boundaryReference']['roads']}
g, j = roads[spec['guillermo']['road']], roads[spec['jorge']['road']]
gp, jp = [turned(p) for p in g['points']], [turned(p) for p in j['points']]

# Guillermo: street level to the slope start, then down evenly to paseo level at its foot.
assert g['heights'][0] == g['heights'][1] == STREET and abs(g['heights'][-1] - foot) < 1e-6, g['heights']
assert math.dist(gp[1], spec['guillermo']['slopeStart']) < 0.05
assert all(b <= a for a, b in zip(g['heights'], g['heights'][1:])), 'Guillermo climbs on its way to the sea'
for road, points in ((g, gp), (j, jp)):
    for a, b, ha, hb in zip(points, points[1:], road['heights'], road['heights'][1:]):
        assert abs(hb - ha) / math.dist(a, b) <= 0.1, f"{road['id']} steeper than 10 %"
# The paseo where the lane meets it is at pool level (data/main_pool.json levels.seafront).
profile = levels['seafront']['profile']
x = gp[-1][0]
paseo = next(a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]) for a, b in zip(profile, profile[1:]) if a[0] <= x <= b[0])
assert abs(paseo - (foot - STREET)) < 1e-6, 'Lane foot is not level with the paseo'

# Jorge: street level, then ramps down to meet Guillermo at Guillermo's height there, no step.
assert j['heights'][:2] == [STREET, STREET]
junction = min(range(len(gp) - 1), key=lambda i: to_segment(jp[-1], gp[i], gp[i + 1]))
a, b = gp[junction], gp[junction + 1]
t = ((jp[-1][0] - a[0]) * (b[0] - a[0]) + (jp[-1][1] - a[1]) * (b[1] - a[1])) / math.dist(a, b) ** 2
there = g['heights'][junction] + (g['heights'][junction + 1] - g['heights'][junction]) * t
assert to_segment(jp[-1], a, b) < g['width'] / 2 and abs(there - j['heights'][-1]) < 0.02, 'Step where Jorge meets Guillermo'

# The street-level ground is cut along every lowered stretch, and the deck never takes a lane's centre line.
for road, points in ((g, gp), (j, jp)):
    for p, h in along(points, road['heights']):
        if h < STREET - 0.005:
            assert inside(p, levels['sheetCut']) or to_ring(p, levels['sheetCut']) < 0.02, f"{road['id']} lowered but the ground is not cut"
            assert not inside(p, levels['lowerArea']) or abs(h - foot) < 0.01, f"{road['id']} centre line on the deck"
        else:
            assert not inside(p, levels['lowerArea']), f"{road['id']} at street level inside the deck"
assert all(inside(p, levels['sheetCut']) or to_ring(p, levels['sheetCut']) < 0.02 for p in levels['lowerArea']), 'Deck reaches past the cut'

# The kiosk at the foot stands on the lowered lawn, clear of the lane.
kiosk = next(b for b in skeleton['buildings'] if b['id'] == spec['kiosk'])
ring = [turned(p) for p in kiosk['ring']]
centre = (sum(p[0] for p in ring) / len(ring), sum(p[1] for p in ring) / len(ring))
assert inside(centre, levels['lowerArea']), 'Kiosk is not on the lowered lawn'
assert min(to_ring(p, ring) for p, _ in along(gp[1:], g['heights'][1:])) >= g['width'] / 2, 'Kiosk blocks the lane'

# East steps: a narrow flight from street level beside the Picasso side down onto the deck.
steps = levels['steps']
top, bottom = steps['points'][0], steps['points'][-1]
assert not inside(top, levels['terraceRing']) and inside(bottom, levels['lowerArea'])
assert 2 * PLAYER < steps['width'] <= 1.5 and 0 < levels['drop'] / steps['count'] <= 0.2
assert 'apple-maps/12' in steps['evidence']
solid = [[turned(p) for p in b['ring']] for b in skeleton['buildings'] if b['id'] in ('6364501UF1366S_part3', '6364501UF1366S_part4')]
for i in range(21):
    p = (top[0] + (bottom[0] - top[0]) * i / 20, top[1] + (bottom[1] - top[1]) * i / 20)
    assert all(not inside(p, r) and to_ring(p, r) >= steps['width'] / 2 for r in solid), 'East steps run into the terrace or the east building'
    assert i in (0, 20) or not inside(p, levels['surfaceRing']), 'Lawn drawn over the east steps'
print(f"Lowered lanes: Guillermo falls {g['heights'][1] - g['heights'][-1]:.1f} m at most 10 %, Jorge meets it with no step, "
      f"ground cut along both, kiosk on the lawn; east steps {steps['width']} m wide from street level onto the deck PASS")
