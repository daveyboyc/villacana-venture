#!/usr/bin/env python3
"""Pintor Dalí street dressing: plinth and curb on the mapped fence, hedge and lanterns off the routes."""
import json, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
street = json.loads((ROOT/'data/dali_street.json').read_text())
layout = json.loads((ROOT/'data/dali_cervantes.json').read_text())
skeleton = json.loads((ROOT/'public/map/skeleton.json').read_text())
manifest = {p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
threshold = json.loads((ROOT/'data/dali_cervantes_threshold.json').read_text())
coast = json.loads((ROOT/'data/coastal_gate.json').read_text())

fence = next(b for b in layout['barriers'] if b['id'] == street['fence']['barrierId'])
skel = next(b for b in skeleton['boundaryReference']['barriers'] if b['id'] == fence['id'])
assert skel['points'] == fence['points'], 'Skeleton fence drifted from data/dali_cervantes.json'
assert street['fence']['stopBeforeLastSegments'] == 1
dressed = fence['points'][:-1]
assert dressed[-1] == [-130.5, 224.8], 'Dressing must stop where the coastal gate plinth begins'
assert fence['points'][-1] == coast['walls'][0]['points'][0]

for block in (street, street['fence'], street['hedge'], street['lanterns']):
    assert block['evidence'] and set(block['evidence']) <= manifest and block['trust']
f = street['fence']
assert 0.3 <= f['plinthHeight'] <= 0.6
assert f['plinthHeight'] < fence['height']
assert 0.08 <= f['curbHeight'] <= 0.2 and 0.3 <= f['curbOffset'] <= 0.8
# The curb sits road-side of the fence and must not reach the carriageway centre.
road = next(r for r in layout['roads'] if r['id'] == 'dali')

def nearest(p, pts):
    best = 1e9
    for a, b in zip(pts, pts[1:]):
        dx, dz = b[0]-a[0], b[1]-a[1]
        l2 = dx*dx+dz*dz or 1
        t = max(0, min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dz)/l2))
        best = min(best, math.hypot(p[0]-a[0]-t*dx, p[1]-a[1]-t*dz))
    return best

for a, b in zip(dressed, dressed[1:]):
    mid = [(a[0]+b[0])/2, (a[1]+b[1])/2]
    gap = nearest(mid, road['points'])
    assert f['curbOffset'] + f['curbWidth']/2 < gap - road['width']/2 + 0.35, 'Curb crosses into the lane'

routes = [(r['points'], r['width']) for r in skeleton['boundaryReference']['roads']]
routes += [(threshold['footpathCentreline'], 1.3), (coast['route']['points'], 1.2)]

def seg(p, a, b):
    dx, dz = b[0]-a[0], b[1]-a[1]
    l2 = dx*dx+dz*dz
    t = 0 if l2 < 1e-8 else max(0, min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dz)/l2))
    return math.hypot(p[0]-a[0]-t*dx, p[1]-a[1]-t*dz)

def clears(p, radius):
    return not any(seg(p, a, b) < w/2 + radius + 0.15 for pts, w in routes for a, b in zip(pts, pts[1:]))

def point_in(x, z, ring):
    hit = False
    for a, b in zip(ring, ring[1:]+ring[:1]):
        if (a[1] > z) != (b[1] > z) and x < (b[0]-a[0])*(z-a[1])/(b[1]-a[1] or 1e-9)+a[0]:
            hit = not hit
    return hit

def hits_building(x, z, pad=0.4):
    for b in skeleton['buildings']:
        ring = b['ring']
        if point_in(x, z, ring) or any(seg((x, z), a, c) < pad for a, c in zip(ring, ring[1:]+ring[:1])):
            return True
    return False

lamps = street['lanterns']['points']
assert len(lamps) == 10 and len({tuple(p) for p in lamps}) == 10
for p in lamps:
    assert clears(p, street['lanterns']['radius']), f'Lantern {p} blocks a protected route'
    assert not hits_building(*p), f'Lantern {p} sits in a house'
    assert 3.2 <= nearest(p, road['points']) <= 6.2

hedge = street['hedge']
pieces = blocked = 0
for a, b in zip(dressed, dressed[1:]):
    dx, dz = b[0]-a[0], b[1]-a[1]
    length = math.hypot(dx, dz) or 1
    # Outward is away from the road, matching src/dali-street.ts.
    mid = ((a[0]+b[0])/2, (a[1]+b[1])/2)
    # sample the road to get the outward unit
    best = (1e9, mid)
    acc_a, acc_b = road['points'][0], road['points'][1]
    for p, q in zip(road['points'], road['points'][1:]):
        d = seg(mid, p, q)
        if d < best[0]:
            best = (d, None)
            dxr, dzr = q[0]-p[0], q[1]-p[1]
            l2 = dxr*dxr+dzr*dzr or 1
            t = max(0, min(1, ((mid[0]-p[0])*dxr+(mid[1]-p[1])*dzr)/l2))
            best = (d, (p[0]+dxr*t, p[1]+dzr*t))
    vx, vz = mid[0]-best[1][0], mid[1]-best[1][1]
    n = math.hypot(vx, vz) or 1
    ox, oz = vx/n, vz/n
    step = hedge['step']
    at = 0
    while at < length:
        piece = min(step, length-at)
        x = a[0] + dx/length*(at+piece/2) + ox*hedge['outward']
        z = a[1] + dz/length*(at+piece/2) + oz*hedge['outward']
        pieces += 1
        if not clears((x, z), math.hypot(piece/2, hedge['depth']/2)):
            blocked += 1
        at += step
assert pieces > 20 and blocked == 0, f'Hedge blocks a route ({blocked} of {pieces})'
assert hedge['base'] + hedge['height'] <= fence['height'] + 0.05, 'Hedge must not hide the mesh completely'

src = (ROOT/'src/dali-street.ts').read_text()
bounds = (ROOT/'src/boundaries.ts').read_text()
assert 'if (scene.userData.layoutOnly) return' in src
assert 'if (!clear) return' in src
assert 'daliDressedFence' in src
assert 'stopBeforeLastSegments' in bounds or 'plinthHeight' in bounds
assert 'addDaliStreet' in (ROOT/'src/slice.ts').read_text()
assert 'new THREE.Sprite' not in src
print(f"Dalí street: plinth {f['plinthHeight']} m and curb on {len(dressed)-1} fence runs, "
      f"hedge {pieces} pieces clear, {len(lamps)} lanterns clear of roads and houses")
