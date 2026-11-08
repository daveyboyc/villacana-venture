"""Calle Alberto 22-40 porch: evidence, the registry recess it fills, routes and wiring (not a survey)."""
import json, math
from pathlib import Path
from check_map import inside
ROOT = Path(__file__).resolve().parents[1]
d = json.loads((ROOT / 'data/alberto_passage.json').read_text())
s = json.loads((ROOT / 'public/map/skeleton.json').read_text())
photos = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
F = d['frame']; O, A, I, W, D = F['origin'], F['along'], F['in'], F['width'], F['depth']
at = lambda a, b: [O[0] + A[0] * a + I[0] * b, O[1] + A[1] * a + I[1] * b]
assert d['evidence'] and all(p in photos for p in d['evidence']) and all(p in photos for x in d['plants'] for p in x['evidence'])
host = next(b for b in s['buildings'] if b['id'] == d['hostBuilding'])
# The frame is the registry recess: both mouth corners lie on the facade and the back wall is a ring edge.
near = lambda p: min(math.dist(p, q) for q in host['ring'])
assert near(at(0, 0)) < .05 and near(at(W, 0)) < .1, 'Mouth corners are not the recess corners'
assert near(at(0, D)) < .1 and near(at(W, D)) < .15, 'Back wall is not the recess back edge'
assert abs(A[0] * I[0] + A[1] * I[1]) < 1e-6 and inside(*at(W / 2, D + .5), host['ring']) and not inside(*at(W / 2, D / 2), host['ring']), 'in must point into the house; the porch is outside it'
# Everything built stands in the recess or on its front step, not in a house or on a mapped street.
pts = [at(a / 10 * W, b / 10 * (D - d['platform']['step']['from']) + d['platform']['step']['from']) for a in range(11) for b in range(11)]
for p in pts:
    for b in s['buildings']:
        assert b['floors'] == 0 or not inside(*p, b['ring']) or math.dist(p, at(W / 2, D)) < 1.6, f'porch crosses {b["id"]}'
def seg(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]; t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)))
    return math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t)
for r in s['boundaryReference']['roads']:
    assert min(seg(p, a, b) for p in pts for a, b in zip(r['points'], r['points'][1:])) > r['width'] / 2, f"porch on {r['id']}"
ar = d['arch']; assert ar['spring'] < ar['crown'] < ar['ceiling'] <= host['floors'] * s['floorHeight']
for k in ('ramp', 'platform'): assert 0 <= d[k]['along'][0] < d[k]['along'][1] <= W + 1e-6
assert d['ramp']['along'][1] <= d['platform']['along'][0] + 1e-6, 'ramp and step platform overlap'
assert d['route']['trust'] == 'inferred' and any(min(seg(d['route']['points'][1], h[i], h[(i + 1) % len(h)]) for i in range(len(h))) < .05 for h in host.get('holes', [])), 'route must end on the registry courtyard'
src = (ROOT / 'src/alberto-passage.ts').read_text()
assert 'if (scene.userData.layoutOnly) return;' in src and 'decorationClearance' in src
assert 'addAlbertoPassage(scene)' in (ROOT / 'src/slice.ts').read_text() and 'inAlbertoPorch(' in (ROOT / 'src/slice.ts').read_text() and 'inAlbertoPorch(' in (ROOT / 'src/facade-kit.ts').read_text()
assert 'data-alberto-id' in (ROOT / 'src/blueprint.ts').read_text()
print('Calle Alberto 22-40 porch: photographed, fills the registry recess of', host['id'], '; clear of streets; inferred route ends on the courtyard; wired into scene, map, shutters and kit PASS')
