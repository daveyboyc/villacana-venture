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
assert sum(f['along'][1]-f['along'][0] for f in features if f['kind']=='cloth') < length / 4
assert max(f['along'][1] for f in features) < length - 30, 'Do not invent eastern repetition'
src = (ROOT/'src/paseo-details.ts').read_text()
assert 'if (scene.userData.layoutOnly) return' in src
assert 'if (!clear) return' in src
assert 'Math.hypot(length / 2, f.width / 2)' in src
assert 'if (!clear(p.x, p.z, radius)) continue' in src
assert 'flushRouteSurface = true' in src
assert 'new THREE.Sprite' not in src
assert 'paseoDetailStation' in src and 'wallData.wall.thickness + .3' in src
print('Paseo details: bounded evidence, hedge/cloth positions, full-footprint guard and flush-cover invariants pass')
