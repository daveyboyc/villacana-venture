"""Check the Calle Elena covered walkway details (data/elena_walkway.json, src/elena-walkway.ts).

The frame must sit on registry part 6265201UF1366N_part5, everything built in it must stay inside that
strip, the steps must be walkable (the player's ground step is 0.45 m at most) and the headroom above the
raised floor must clear the doors. Photos cited must exist. This checks the records and arithmetic only:
it does not show the model looks like the photographs or that the dimensions are surveyed.
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
d = json.loads((ROOT / 'data/elena_walkway.json').read_text())
skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
photos = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
survey = {i['id']: i for i in json.loads((ROOT / 'data/levels_survey.json').read_text())['items']}
ns = {'__file__': str(ROOT / 'scripts/check_terrain.py')}
exec((ROOT / 'scripts/check_terrain.py').read_text().split('\nassert')[0], ns)
site_y = ns['site_y']

F = d['frame']
O, U, N = F['origin'], F['along'], F['across']
assert abs(math.hypot(*U) - 1) < 2e-3 and abs(math.hypot(*N) - 1) < 2e-3, 'frame axes are not unit vectors'
assert abs(U[0] * N[0] + U[1] * N[1]) < 2e-3, 'frame axes are not perpendicular'
# across is a quarter turn to the right of along when seen from above with +z south: north is -z.
assert N[1] < 0, 'across must point north (-z)'
frame = lambda a, b: (O[0] + U[0] * a + N[0] * b, O[1] + U[1] * a + N[1] * b)
local = lambda p: ((p[0] - O[0]) * U[0] + (p[1] - O[1]) * U[1], (p[0] - O[0]) * N[0] + (p[1] - O[1]) * N[1])

# 1. The frame matches the registry strip it stands in (within 0.25 m, registry corners are mapped to 0.01 m).
part = next(b for b in skeleton['buildings'] if b['id'] == d['passageId'])
assert part.get('passage'), 'part is not a registered covered passage'
loc = [local(p) for p in part['ring']]
a_min, a_max = min(a for a, _ in loc), max(a for a, _ in loc)
b_min, b_max = min(b for _, b in loc), max(b for _, b in loc)
assert abs(a_min) < 0.25 and abs(a_max - F['length']) < 0.25, f'length {F["length"]} vs registry {a_min:.2f}..{a_max:.2f}'
assert abs(b_min + F['halfWidth']) < 0.25 and abs(b_max - F['halfWidth']) < 0.25, f'width vs registry {b_min:.2f}..{b_max:.2f}'

L = d['level']
HALF, LEN = F['halfWidth'], F['length']
# 2. Steps and ramp: ordered, inside the strip, risers walkable.
assert L['risers'] == sorted(L['risers']) and L['risers'][0] == 0 and len(L['risers']) == 3, 'three risers from the portal'
assert L['stepAcross'][0] == -HALF and L['rampAcross'][1] == HALF and L['stepAcross'][1] == L['rampAcross'][0], 'steps and ramp share the width'
assert L['rampLength'] > L['risers'][-1], 'the ramp reaches the floor beyond the top riser'
riser = L['rise'] / len(L['risers'])
assert 0.08 <= riser <= 0.2, f'riser {riser:.3f} m outside the plausible 0.08-0.20 m'
assert riser <= 0.45, 'riser exceeds the walk ground step'
assert math.degrees(math.atan2(L['rise'], L['rampLength'])) < 15, 'ramp steeper than 15 degrees'
item = survey['elena-walkway-east-steps']
low, high = item['rise']
assert low - 0.05 <= L['rise'] <= high + 0.05, f'rise {L["rise"]} is outside the levels survey range {low}-{high}'
assert item['model'] == 'built', 'the levels survey should record the walkway steps as built'

# 3. Headroom: the registry block above is lifted 2.6 m at its own terrain level (src/slice.ts).
cx = sum(p[0] for p in part['ring']) / len(part['ring'])
cz = sum(p[1] for p in part['ring']) / len(part['ring'])
soffit = 2.6 + site_y((cx, cz)) - site_y(tuple(O))
floor = 0.06 + L['rise']
headroom = soffit - floor
tallest = max(x['height'] for x in d['doors'])
assert headroom > tallest + 0.15, f'headroom {headroom:.2f} m does not clear a {tallest} m door'
assert d['arches']['spring'] + 0.3 < soffit - 0.12, 'arch has no rise'
assert d['arches']['spring'] > floor + 1.0, 'arch springs too low'
lantern = d['lantern']
assert lantern['bottom'] + 0.3 < headroom, 'lantern hangs through the ceiling'
assert lantern['bottom'] > 1.9, 'lantern hangs below head height'

# 4. Everything built stays inside the strip and on the floor, doors do not overlap each other or the signs.
mat = d['pebbleMat']
assert L['risers'][-1] < mat['along'][0] < mat['along'][1] < LEN, 'pebble mat on the level floor'
assert -HALF < mat['across'][0] < mat['across'][1] < HALF
for door in d['doors']:
    assert door['side'] in (-1, 1) and door['width'] / 2 < door['along'] < LEN - door['width'] / 2
north = sorted([(x['along'] - x['width'] / 2, x['along'] + x['width'] / 2, x['id']) for x in d['doors'] if x['side'] == 1] +
               [(x['along'] - x['width'] / 2, x['along'] + x['width'] / 2, x['id']) for x in d['signs'] + [d['hatch']] if x['side'] == 1 and x['up'] > 1.4])
for (a0, a1, n0), (b0, b1, n1) in zip(north, north[1:]):
    assert a1 <= b0 + 0.01, f'{n0} overlaps {n1} on the north wall'
assert all(0 < s['along'] - s['width'] / 2 and s['along'] + s['width'] / 2 < LEN for s in d['signs'])
assert d['kerb']['from'] < LEN and d['kerb']['depth'] < 0.3

# 5. Ground the player stands on follows the visible floor, and no step between neighbours exceeds 0.45 m.
def rise(a, b):
    if b <= L['stepAcross'][1]:
        return L['rise'] * sum(1 for r in L['risers'] if a >= r) / len(L['risers'])
    return L['rise'] * min(1, a / L['rampLength'])
worst = 0.0
step = 0.05
a = 0.0
while a < LEN:
    b = -HALF
    while b < HALF:
        worst = max(worst, abs(rise(a + step, b) - rise(a, b)), abs(rise(a, min(HALF, b + step)) - rise(a, b)))
        b += step
    a += step
# the largest jump is the open side of the top step beside the ramp (floor level against the sloping ramp)
assert worst <= 0.2, f'unexpected ground jump {worst:.3f} m'
west = site_y(frame(LEN, 0)) - site_y(tuple(O))
assert abs(L['rise'] - west) < 0.1, f'terrain rise along the walkway {west:.2f} m vs floor rise {L["rise"]} m: the floor would sink into or hover over the ground'

# 6. Evidence exists.
assert d['evidence'] and all(p in photos for p in d['evidence']), 'unknown photo cited'
for key in ('signs', 'doors'):
    assert all(x.get('basis') for x in d[key]), f'{key} without a basis'
assert d['trust'] and d['unknown']
print(f"Elena walkway: frame on registry strip {a_max:.1f} x {b_max - b_min:.1f} m, 3 risers of {riser:.3f} m, "
      f"ramp {math.degrees(math.atan2(L['rise'], L['rampLength'])):.1f} deg, headroom {headroom:.2f} m, "
      f"terrain rise {west:.2f} m PASS")
