#!/usr/bin/env python3
"""Check Barraka's roped lounge garden, the painted paseo crossing, the green lawn railing and the lamp heads.

Details-only furniture: evidence indexed, positions on the beach verge and clear of the protected routes,
the crossing flush on the paseo, and the guard/Details invariants in the source."""
import json, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
d = json.loads((ROOT/'data/barraka_frontage.json').read_text())
sk = json.loads((ROOT/'public/map/skeleton.json').read_text())
verge = json.loads((ROOT/'data/beach_verge.json').read_text())['grass']['ring']
manifest = {p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
paseo = sk['seafront']['paseo']['points']

def seg(p, a, b):
    dx, dz = b[0]-a[0], b[1]-a[1]; l2 = dx*dx+dz*dz
    t = 0 if l2 < 1e-8 else max(0, min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dz)/l2))
    return math.hypot(p[0]-a[0]-t*dx, p[1]-a[1]-t*dz)
def to_paseo(p): return min(seg(p, a, b) for a, b in zip(paseo, paseo[1:]))
def inside(p, ring):
    x, z = p; c = False
    for i in range(len(ring)):
        a, b = ring[i], ring[(i+1) % len(ring)]
        if (a[1] > z) != (b[1] > z) and x < (b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0]: c = not c
    return c
routes = [(r['points'], r['width']) for r in sk['boundaryReference']['roads']]
routes += [(json.loads((ROOT/'data/dali_cervantes_threshold.json').read_text())['footpathCentreline'], 1.3),
           *((r['points'], r['width']) for r in sk['seafront']['paseo']['protect'])]
routes += [(r['points'], r['width']) for r in (json.loads((ROOT/'data/coastal_gate.json').read_text())['route'],
                                               json.loads((ROOT/'data/barraka_boardwalk.json').read_text())['boardwalk'])]
def clear(p, radius):  # same test as src/route-clearance.ts
    return not any(seg(p, a, b) < width/2 + radius + .15 for pts, width in routes for a, b in zip(pts, pts[1:]))

lounge, crossing = d['lounge'], d['crossing']
for f in (lounge, crossing):
    assert f['evidence'] and set(f['evidence']) <= manifest and f['trust'], f['id']
# IMG_2607/2608/2609 pins (+-12-19 m) cannot be the only support for a position.
assert {'IMG_2604.jpg', 'IMG_2631.jpg'} <= set(lounge['evidence']), 'Lounge position needs the two usable cameras'

posts = lounge['rope']['posts']
assert len(posts) == 7 and lounge['rope']['height'] <= 1.1
gaps = [math.dist(a, b) for a, b in zip(posts, posts[1:])]
assert all(2.0 <= g <= 2.6 for g in gaps), gaps
for p in posts:
    assert clear(p, .1), f'rope post {p} blocks a protected route'
    assert 1.9 <= to_paseo(p) <= 2.5, f'rope posts keep to the paving edge, not {to_paseo(p):.2f} m'
inside_verge = [inside(p, verge) for p in [lounge['centre'], lounge['menuStand'], lounge['easel'], *[q[:2] for q in lounge['pots']]]]
assert all(inside_verge), 'furniture belongs on the grass verge'
# Seating: two sofas and four pods around the centre, never beyond what IMG_2604/2609/2631 show.
half, spread = lounge['sofaSpacing']/2, .55
assert lounge['sofaSpacing'] <= 3 and abs(lounge['podU']) < 1 and abs(lounge['sofaU']) < 1
assert clear(lounge['centre'], 2.5), 'the seating keeps well clear of the paving'
assert 3.0 <= to_paseo(lounge['centre']) <= 6.5
for pot in lounge['pots']: assert clear(pot[:2], pot[2]+.05)
assert clear(lounge['menuStand'], .3) and clear(lounge['easel'], .55)

# Crossing: flush on the paving, spanning its width, on the paseo centre line.
assert abs(to_paseo(crossing['at'])) < .3, 'crossing sits on the mapped paseo line'
# A zebra the usual way round (IMG_2484): the bars sit side by side across the full paving, each running along the walk.
assert abs(crossing['width'] - sk['seafront']['paseo']['width']) < .2 and 1.0 <= crossing['depth'] <= 1.8, 'bars span the paving, each along the walk'
# Immediately outside the gate (Dave, 2026-11-13): the band is centred on the gateway opening.
fence = json.loads((ROOT / 'data/seafront_fence.json').read_text())
_t = math.radians(26)
_gate = (fence['gate']['at'][0] * math.cos(_t) + fence['gate']['at'][1] * math.sin(_t), -fence['gate']['at'][0] * math.sin(_t) + fence['gate']['at'][1] * math.cos(_t))
_off = ((_gate[0] - crossing['at'][0]) * crossing['along'][0] + (_gate[1] - crossing['at'][1]) * crossing['along'][1])
assert abs(_off) < .2 and math.dist(_gate, crossing['at']) < 2.0, f'crossing is not right outside the gate ({_off:.2f} m along)'
assert crossing['bars'] == 8
assert abs(math.hypot(*crossing['along']) - 1) < .01

# Lawn railing: dark green bars on a sandstone plinth, geometry unchanged.
rail = json.loads((ROOT/'data/seafront_fence.json').read_text())['railing']
r, g, b = (int(rail['paint'][i:i+2], 16) for i in (1, 3, 5))
assert g > r and g > b and max(r, g, b) < 100, 'railing paint must be dark green'
pr, pg, pb = (int(rail['plinthFinish'][i:i+2], 16) for i in (1, 3, 5))
assert pr > pb and pr > 180, 'plinth must be sandstone'
assert rail['height'] == 1.1 and rail['plinth'] == .3 and rail['thickness'] == .2

# Lamps: slim tube and solar head at the same footprint, about 4 m.
lamps = [f for f in json.loads((ROOT/'data/paseo_details.json').read_text())['features'] if f['kind'] == 'lamp']
assert lamps and all(3.5 <= f['height'] <= 4.5 for f in lamps)
assert all('IMG_2480.jpg' in f['evidence'] for f in lamps)

src = (ROOT/'src/barraka-frontage.ts').read_text()
assert 'if (scene.userData.layoutOnly) return' in src, 'Details only'
assert 'routeClearance' in src and src.count('clear(') >= 2
assert 'flushRouteSurface = true' in src and 'new THREE.Sprite' not in src
assert 'userData.noDrape = true' in src
fence = (ROOT/'src/seafront-fence.ts').read_text()
assert 'data.railing.paint' in fence and 'data.railing.plinthFinish' in fence
lamp_src = (ROOT/'src/paseo-details.ts').read_text()
assert 'solar' in lamp_src and 'CylinderGeometry(.045' in lamp_src
slice_src = (ROOT/'src/slice.ts').read_text()
assert 'addBarrakaFrontage(scene' in slice_src
print(f"Barraka frontage: {len(posts)} rope posts at the paving edge, lounge {to_paseo(lounge['centre']):.1f} m off the paseo on the verge, "
      f"crossing on the paseo line, railing dark green on sandstone, {len(lamps)} lamps at 4 m; all clear of the protected routes")
