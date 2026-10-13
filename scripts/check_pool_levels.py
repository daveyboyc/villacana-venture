"""Check lower pool coverage and preserve the checked street network."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
layout = json.loads((ROOT / 'data/main_pool.json').read_text())['levels']
skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
angle = math.radians(skeleton['viewRotation'])


def turned(p):
    x, z = p
    return x * math.cos(angle) - z * math.sin(angle), x * math.sin(angle) + z * math.cos(angle)


def inside(p, ring):
    x, z = p
    result = False
    for a, b in zip(ring, ring[1:] + ring[:1]):
        if (a[1] > z) != (b[1] > z) and x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]:
            result = not result
    return result


def lowered(p):
    return inside(p, layout['lowerArea']) and not any(inside(p, r) for r in layout['lowerHoles'])


for pool in skeleton['pools']:
    if pool['id'] in ('main', 'toddler'):
        assert all(lowered(turned(p)) for p in pool['ring']), f"Pool outside lower deck: {pool['id']}"
    else:
        assert not any(lowered(turned(p)) for p in pool['ring']), f"Unrelated pool lowered: {pool['id']}"
for road in skeleton['boundaryReference']['roads']:
    for a, b in zip(road['points'], road['points'][1:]):
        for i in range(101):
            point = turned([a[0] + (b[0] - a[0]) * i / 100, a[1] + (b[1] - a[1]) * i / 100])
            assert not lowered(point), f"Street cut by lower deck: {road['id']}"
assert 0 < layout['drop'] / layout['steps']['count'] <= .2
# The seaward lawn is an even, gentle slope to the paseo, measured from the mapped paseo itself.
slope = layout['seawardSlope']
mapped = [turned(p) for p in skeleton['seafront']['paseo']['points']]
assert all(min(math.dist(p, q) for q in mapped) < 0.2 for p in slope['paseo']), 'Slope no longer follows the mapped paseo'
assert layout['drop'] / slope['run'] <= 0.15, 'Seaward lawn too steep'
def to_paseo(p):
    best = math.inf
    for a, b in zip(mapped, mapped[1:]):
        dx, dz = b[0] - a[0], b[1] - a[1]
        t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)))
        best = min(best, math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz))
    return best
for pool in skeleton['pools']:
    if pool['id'] in ('main', 'toddler'):
        assert all(to_paseo(turned(p)) >= slope['flat'] + slope['run'] + 2 for p in pool['ring']), 'Slope reaches the pool deck'

assert layout['ramp']['width'] > 2 * .42
assert layout['terraceId'] in {b['id'] for b in skeleton['buildings']}
assert 'not API measurements' in layout['trust']
print('Lower main/children’s pools, unchanged other pools and street centre lines, stair rise and ramp width PASS')
