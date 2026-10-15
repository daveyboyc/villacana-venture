"""Check seaside outlines against the existing map, independently of the builder."""
import json
import math
from pathlib import Path
from check_map import inside

skeleton = json.loads((Path(__file__).resolve().parents[1] / 'public/map/skeleton.json').read_text())
sf = skeleton['seafront']
restaurant = sf['restaurant']
assert restaurant['ring'] == next(b['ring'] for b in skeleton['buildings'] if b['id'] == restaurant['buildingId']), 'Restaurant must reuse the registry footprint'


def crossing(a, b, c, d):
    def cross(p, q, r):
        return (q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])
    return cross(a,b,c)*cross(a,b,d) < -1e-8 and cross(c,d,a)*cross(c,d,b) < -1e-8


for name, ring in [('beach', sf['beach']['ring']), ('sea', sf['sea']['ring']), ('terrace', restaurant['terrace'])]:
    assert len(ring) >= 3 and all(math.isfinite(v) for p in ring for v in p), f'Invalid {name} coordinates'
    for i in range(len(ring)):
        for j in range(i+2, len(ring)):
            if i == 0 and j == len(ring)-1:
                continue
            assert not crossing(ring[i], ring[(i+1)%len(ring)], ring[j], ring[(j+1)%len(ring)]), f'Self-intersecting {name}'
    if name in ('beach', 'sea'):
        for pool in skeleton['pools']:
            assert not any(inside(x,z,ring) for x,z in pool['ring']), f'{name} overlaps {pool["id"]} pool'

for a, b in zip(sf['paseo']['points'], sf['paseo']['points'][1:]):
    length = math.hypot(a[0]-b[0],a[1]-b[1])
    assert length > 0, 'Duplicate paseo point'
    steps = max(1, math.ceil(length))
    for i in range(steps+1):
        x = a[0]+(b[0]-a[0])*i/steps; z = a[1]+(b[1]-a[1])*i/steps
        assert not inside(x,z,restaurant['ring']), 'Paseo crosses restaurant footprint'
        assert not any(inside(x,z,p['ring']) for p in skeleton['pools']), 'Paseo crosses a pool'
print('Seafront: simple polygons, no pool overlaps, clear paseo route, exact registry restaurant footprint PASS')

# Retracing the photographed promenade must preserve its unrelated access joins.
root = Path(__file__).resolve().parents[1]
gate_join = json.loads((root / 'data/coastal_gate.json').read_text())['route']['points'][-1]
assert gate_join in sf['paseo']['points'], 'Paseo no longer meets the coastal gate connector'
assert sf['paseo']['points'][0] == [-121.26, 242.45], 'Western mapped approach moved'
assert sf['paseo']['points'][-10:] == [[0.97,129.83],[13.48,113.38],[20.79,102.36],[28.87,96.28],[34.28,95.71],[68.46,61.23],[93.49,35.17],[134.29,-4.84],[146.38,-30.72],[150.39,-34.25]], 'Eastern mapped / boardwalk joins moved'
assert set(sf['paseo']['evidence']) >= {'IMG_2350.jpg','IMG_2352.jpg','IMG_2354.jpg','IMG_2349.jpg'}
print('Paseo retrace: photographed run, coastal access and eastern boardwalk joins preserved PASS')
