#!/usr/bin/env python3
"""Check bounded photo detail geometry and the route guard's full visible extents."""
import json, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
d = json.loads((ROOT/'data/paseo_details.json').read_text())
w = json.loads((ROOT/'data/paseo_wall.json').read_text())['wall']
manifest = {p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
length = sum(math.dist(a,b) for a,b in zip(w['face'],w['face'][1:]))
features = d['features']
assert len({f['id'] for f in features}) == len(features)
for f in features:
    assert f['evidence'] and set(f['evidence']) <= manifest and f['trust']
    assert 0 <= f['along'][0] <= f['along'][1] <= length
    assert f['width'] > 0 and f['height'] >= 0
    if f['kind'] == 'hedge':
        assert f['inland']-f['width']/2 > w['thickness'], 'Hedge must stand behind the fence/wall'
        assert f['height'] < w['fence']['height'], 'Do not hide the full mesh behind tall hedges'
    elif f['kind'] == 'cloth':
        assert abs(f['inland']-w['fence']['setback']) < .08
        assert f['height']+.04 < w['fence']['height'], 'Leave exposed mesh above cloth'
    elif f['kind'] == 'cover':
        assert f['height'] == 0, 'Cover is a flush surface, not a route obstruction'
    else:
        assert f['kind'] == 'lamp'
        # The head box is .32 along the wall, .65 across and displaced .125.
        assert math.hypot(.45,.18) >= math.hypot(.325+.125,.16)
        # Photographed on the pavement at the wall foot (IMG_2350/2352), not on the coping.
        assert -0.3 <= f['inland'] < 0, 'Lamp must stand on the paseo at the wall foot'
assert sum(f['along'][1]-f['along'][0] for f in features if f['kind']=='cloth') < length / 4
assert max(f['along'][1] for f in features) < length - 30, 'Do not invent eastern repetition'
# Same test as src/route-clearance.ts over the routes src/slice.ts protects: an
# omitted lamp must genuinely fail at its photographed spot, a placed one must pass.
sk = json.loads((ROOT/'public/map/skeleton.json').read_text())
def seg(p, a, b):
    dx, dz = b[0]-a[0], b[1]-a[1]; l2 = dx*dx+dz*dz
    t = 0 if l2 < 1e-8 else max(0, min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dz)/l2))
    return math.hypot(p[0]-a[0]-t*dx, p[1]-a[1]-t*dz)
routes = [(r['points'], r['width']) for r in sk['boundaryReference']['roads']]
routes += [(json.loads((ROOT/'data/dali_cervantes_threshold.json').read_text())['footpathCentreline'], 1.3),
           (sk['seafront']['paseo']['points'], sk['seafront']['paseo']['width'])]
routes += [(r['points'], r['width']) for r in (json.loads((ROOT/'data/coastal_gate.json').read_text())['route'],
                                               json.loads((ROOT/'data/barraka_boardwalk.json').read_text())['boardwalk'])]
def clear(p, radius):
    return not any(seg(p, a, b) < width/2 + radius + .15 for pts, width in routes for a, b in zip(pts, pts[1:]))
def station(along, inland):
    face, rem = w['face'], along
    for i, (a, b) in enumerate(zip(face, face[1:])):
        L = math.dist(a, b)
        if rem <= L or i == len(face)-2:
            t, tx, tz = min(1, rem/L), (b[0]-a[0])/L, (b[1]-a[1])/L
            return (a[0]+(b[0]-a[0])*t+tz*inland, a[1]+(b[1]-a[1])*t-tx*inland)
        rem -= L
placed = []
for f in features:
    if f['kind'] != 'lamp': continue
    ok = clear(station(f['along'][0], f['inland']), math.hypot(.45, .18))
    if f.get('omitted'):
        assert not ok, f"{f['id']} now clears the routes: drop 'omitted' and update its trust"
        assert not clear(station(f['along'][0], f['inland']), .08), f"{f['id']}: shaft alone would clear"
        assert 'omitted' in f['trust'] and 'protected paseo route' in f['trust'], 'Record why in trust'
    else:
        assert ok, f"{f['id']} blocks a protected route at its photographed spot: mark it omitted"
        placed.append(f['id'])
src = (ROOT/'src/paseo-details.ts').read_text()
assert 'if (scene.userData.layoutOnly) return' in src
assert 'if (!clear) return' in src
assert 'Math.hypot(length / 2, f.width / 2)' in src
assert 'if (!clear(p.x, p.z, radius)) continue' in src
assert 'flushRouteSurface = true' in src
assert 'new THREE.Sprite' not in src
assert 'paseoDetailStation' in src and 'wallData.wall.thickness + .3' in src
assert 'const p = paseoDetailStation(f.along[0], f.inland);\n      // Head' in src, 'Lamps keep their photographed station'
lamps = [f for f in features if f['kind'] == 'lamp']
print(f'Paseo details: bounded evidence, hedge/cloth positions, full-footprint guard and flush-cover invariants pass; '
      f'lamps {len(placed)} placed, {len(lamps)-len(placed)} omitted at photographed wall-foot spots inside the protected paseo')
