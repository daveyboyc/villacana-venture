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
# The big pool is level with the beach; the beach falls gently to a lower sea.
front = layout['seafront']
heights = [h for _, h in front['profile']]
assert min(heights) == -layout['drop'] and max(heights) == 0, 'Paseo must run from street level down to pool level'
assert all(a[0] < b[0] for a, b in zip(front['profile'], front['profile'][1:]))
assert all(abs(b[1] - a[1]) / (b[0] - a[0]) <= 0.1 for a, b in zip(front['profile'], front['profile'][1:])), 'Paseo too steep'
assert front['sea'] < -layout['drop'] and front['shore'] < front['sea'] <= front['shore'] + 0.3, 'Sea must lie just below the beach'
mapped = [turned(p) for p in skeleton['seafront']['paseo']['points']]
def paseo_height(x):
    pts = front['profile']
    if x <= pts[0][0]: return pts[0][1]
    for a, b in zip(pts, pts[1:]):
        if x <= b[0]: return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])
    return pts[-1][1]
# In front of both lowered pools the paseo is at pool level, so there is no step.
for pool in skeleton['pools']:
    if pool['id'] in ('main', 'toddler'):
        assert all(paseo_height(turned(p)[0]) == -layout['drop'] for p in pool['ring']), 'Step between pool and beach'
# Beside the south pool the paseo is about 1 m below the lawn, behind the sandstone retaining wall
# (IMG_2349, IMG_2350; data/paseo_wall.json), and back at street level by the Dalí coastal gate.
south = next(p for p in skeleton['pools'] if p['id'] == 'south')
assert all(-1.3 <= paseo_height(turned(p)[0]) <= -0.8 for p in south['ring']), 'Paseo beside the south lawn is not about 1 m below it'
gate_end = json.loads((ROOT / 'data/coastal_gate.json').read_text())['route']['points'][-1]
assert paseo_height(turned(gate_end)[0]) == 0, 'Coastal gate connector no longer meets the paseo at street level'
assert layout['enriqueSteps']['width'] > 2 * .42
assert 0 < layout['drop'] / layout['enriqueSteps']['count'] <= .2
# Both flights start on the platform and end on the lower deck.
for flight in (layout['steps'], layout['enriqueSteps']):
    assert lowered(flight['points'][1]), 'Steps do not reach the lower deck'
assert layout['terraceId'] in {b['id'] for b in skeleton['buildings']}
assert 'not API measurements' in layout['trust']
print('Lower main/children’s pools, unchanged other pools and street centre lines, stair rise and ramp width PASS')
