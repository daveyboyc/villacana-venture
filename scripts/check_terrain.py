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
    return west['rise'] * max(0, min(1, (edge - tx) / west['run'])) * seaward


assert west['rise'] == 0.5, 'Dave: the Dalí side is about half a metre higher'
assert west['rise'] / west['run'] <= 0.1, 'Ramp too steep to walk'
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
# Calle Eva climbs towards Dalí, west of where IMG_2248 was taken, and is level by the middle pool.
eva = roads['eva']['points']
assert abs(site_y(eva[0]) - west['rise']) < 1e-6 and site_y(eva[2]) == 0, 'Calle Eva does not climb towards Dalí'
photo = next(p for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text()) if p['file'] == 'IMG_2248.jpg')
assert site_y([photo['x'], photo['z']]) == 0, 'IMG_2248 was taken at the foot, looking up the ramp'
# The lane itself no longer carries a hump of its own.
assert len(set(roads['cervantes']['heights'])) == 1
print('Terrain: Dalí side 0.5 m up, pools level, Cervantes and Eva ramps where photographed, walkable slopes PASS')
