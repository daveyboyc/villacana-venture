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
# The steps beside it (IMG_2286, IMG_2355): photographed tread spacing, and every tread above the ramp beside it.
steps = json.loads((ROOT / 'data/cervantes_elena_steps.json').read_text())
sf, st = steps['foot'], steps['toward']
up = [(st[0] - sf[0]) / math.dist(sf, st), (st[1] - sf[1]) / math.dist(sf, st)]
assert abs(steps['risers'][0] - 0.4) < 0.05 and all(.45 <= b - a <= .55 for a, b in zip(steps['risers'], steps['risers'][1:])), 'Cervantes steps: treads not one tile plus nosing'
for i, end in enumerate(steps['risers'][1:] + [steps['end']]):
    for across in steps['across']:
        p = [sf[0] + up[0] * end - up[1] * across, sf[1] + up[1] * end + up[0] * across]
        assert site_y(p) <= site_y(sf) + west['rise'] * (i + 1) / len(steps['risers']) + 0.005, f'Cervantes steps: tread {i + 1} below the ramp'
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
# Finite south approach is an additional local surface, never a new west-side run.
local_surfaces=json.loads((ROOT/'data/terrain.json').read_text()).get('localSurfaces',[])
assert len(local_surfaces)==1
approach=local_surfaces[0]
length=math.dist(approach['foot'],approach['top'])
assert approach['id']=='dali-south-approach' and approach['evidence']==['IMG_2283.jpg']
assert 5<=length<=6 and .15<=approach['rise']<=.35 and approach['rise']/length<.07
assert .15<=approach['kerbHeight']<=.25 and .2<=approach['landing']<=.35
assert site_y(approach['foot'])==site_y(approach['top'])==west['rise'],'Approach starts on the inherited level Dali-side datum'
from check_map import inside
from check_cervantes_patio_walls import distance, sample
u=[(approach['top'][i]-approach['foot'][i])/length for i in [0,1]]
at=lambda a,c:[approach['foot'][0]+u[0]*a-u[1]*c,approach['foot'][1]+u[1]*a+u[0]*c]
end=length+approach['landing'];half=approach['width']/2
outline=[at(0,-half-approach['flare']),at(1.2,-half),at(end,-half),at(end,half),at(1.2,half),at(0,half+approach['flare'])]
buildings=[b['ring'] for b in skeleton['buildings'] if b['floors']>0 and not b.get('passage')]
assert all(not any(inside(*p,b) for b in buildings) for p in sample(outline+[outline[0]])),'Approach/landing intrudes into a house'
# A radius-.42 player reaches only .12 m beyond the slope end: the .3 m exterior landing covers it.
gap=lambda p:min(distance(p,a,b) for ring in buildings for a,b in zip(ring,ring[1:]+[ring[0]]))
assert 0<=gap(approach['top'])-.42<approach['landing'],'Landing must cover reachable space before facade collision'
print('Terrain: Dalí side 0.5 m up, pools level, Cervantes ramp and middle pool steps where photographed, walkable slopes and bounded continuous south approach/landing PASS')
