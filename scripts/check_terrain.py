"""Check the ground heights: the Dalí side stands higher, the pools stay level, ramps are walkable."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
west = json.loads((ROOT / 'data/terrain.json').read_text())['west']
skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
angle = math.radians(skeleton['viewRotation'])


def turned(p):
    return p[0] * math.cos(angle) - p[1] * math.sin(angle), p[0] * math.sin(angle) + p[1] * math.cos(angle)


def site_y(p):
    """The same rule as siteY in src/terrain.ts."""
    tx, tz = turned(p)
    foot = west['foot']
    edge = foot[-1][0]
    if tz <= foot[0][1]:
        edge = foot[0][0]
    else:
        for a, b in zip(foot, foot[1:]):
            if tz <= b[1]:
                edge = a[0] + (b[0] - a[0]) * (tz - a[1]) / (b[1] - a[1])
                break
    seaward = 1 - max(0, min(1, (tz - west['fade'][0]) / (west['fade'][1] - west['fade'][0])))
    return west['rise'] * max(0, min(1, (edge - tx) / run_at(tz))) * seaward


def run_at(tz):
    """The same rule as runAt in src/terrain.ts."""
    run = west['run']
    for local in west.get('localRuns', []):
        a, b = local['tz']
        inside = (tz - (a - local['blend'])) / local['blend'] if tz < a else ((b + local['blend']) - tz) / local['blend'] if tz > b else 1
        if inside > 0:
            run = min(run, west['run'] + (local['run'] - west['run']) * max(0, min(1, inside)))
    return run


assert west['rise'] == 0.5, 'Dave: the Dalí side is about half a metre higher'
assert west['rise'] / west['run'] <= 0.1, 'Ramp too steep to walk'
# A shorter run only where a steep ramp is photographed, and still walkable.
for local in west.get('localRuns', []):
    assert local['evidence'].startswith('photo:') and west['rise'] / local['run'] <= 0.22, f"{local['id']}: local ramp unphotographed or too steep"
assert all(a[1] < b[1] for a, b in zip(west['foot'], west['foot'][1:]))
# Every pool stays on level ground.
for pool in skeleton['pools']:
    assert all(site_y(p) == 0 for p in pool['ring']), f"{pool['id']} pool is on the slope"
roads = {r['id']: r for r in skeleton['boundaryReference']['roads']}
# Pintor Dalí runs along the top, until it drops to the paseo at its seaward end.
for p in roads['dali']['points']:
    if turned(p)[1] < west['fade'][0]:
        assert abs(site_y(p) - west['rise']) < 1e-6, 'Pintor Dalí is not on the upper level'
# The photographed Cervantes ramp is where the ground climbs.
ramp = skeleton['boundaryReference']['ramps'][0]
top, bottom = ramp['points']
assert abs(site_y(top) - west['rise']) < 0.03 and site_y(bottom) < 0.03, 'Ground does not climb at the Cervantes ramp'
# Calle Eva climbs out of the middle pool courtyard at the stone steps (IMG_2333) and runs on at the upper level to Dalí.
eva = roads['eva']['points']
assert abs(site_y(eva[0]) - west['rise']) < 1e-6 and site_y(eva[2]) == 0, 'Calle Eva does not climb towards Dalí'
flight = json.loads((ROOT / 'data/middle_pool_steps.json').read_text())
assert site_y(flight['foot']) < 0.01 and abs(site_y(flight['toward']) - west['rise']) < 0.01, 'Ground does not climb at the middle pool steps'
photos = {p['file']: p for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
assert abs(site_y([photos['IMG_2248.jpg']['x'], photos['IMG_2248.jpg']['z']]) - west['rise']) < 0.01, 'IMG_2248 looks along the upper lane, above the steps'
# The courtyard path beside the planter (Elena south) stays at pool level; the planter's back holds the upper ground.
middle = json.loads((ROOT / 'data/middle_pool.json').read_text())
assert all(site_y(p) == 0 for p in roads['elena-south']['points'][1:]), 'Elena south is level from the Cervantes junction to the middle pool'
assert all(site_y(p) < 0.01 for p in middle['planter']['face'][:2]), 'The planter face along the path stands on the courtyard level'
# The lane itself no longer carries a hump of its own.
assert len(set(roads['cervantes']['heights'])) == 1
print('Terrain: Dalí side 0.5 m up, pools level, Cervantes ramp and middle pool steps where photographed, walkable slopes PASS')
