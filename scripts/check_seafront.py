"""Check seaside outlines against the existing map, independently of the builder."""
import json
import math
from pathlib import Path
from check_map import inside
from PIL import Image

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
# Aerial shoreline trace must stay independent of photo camera coordinates.
root = Path(__file__).resolve().parents[1]
trace = json.loads((root / 'data/shoreline_trace.json').read_text())
ground = json.loads((root / trace['georeference']).read_text())
assert len(trace['points']) == len(trace['pixelPoints']) >= 3
for (u, v), (x, z) in zip(trace['pixelPoints'], trace['points']):
    expected = [ground['minX'] + u / trace['imageSize'][0] * (ground['maxX'] - ground['minX']),
                ground['minZ'] + v / trace['imageSize'][1] * (ground['maxZ'] - ground['minZ'])]
    assert math.dist(expected, [x, z]) < 0.01, 'Shoreline trace lost its aerial georeference'
    assert [x, z] in sf['coast'] and [x, z] in sf['beach']['ring'], 'Beach and sea must share aerial trace'
assert sf['sea']['ring'] == sf['coast'] + [[1500,1500],[-1500,1500]], 'Sea must follow shared coastline'
source = json.loads((root / 'public/map/villacana.json').read_text())
low, high = trace['replaceXRange']
for p in source['coast']:
    if p[0] <= low or p[0] >= high:
        assert p in sf['coast'], 'Unreviewed coastline outside aerial trace must remain unchanged'
manifest = json.loads((root / 'public/photos-ref/manifest.json').read_text())
for file in trace['evidence']:
    photo = next(p for p in manifest if p['file'] == file)
    assert not inside(photo['x'], photo['z'], sf['sea']['ring']), 'Reviewed dry-beach camera is incorrectly classified as sea'
print('Seafront: simple polygons, no pool overlaps, clear paseo route, exact registry restaurant footprint PASS')

# Retracing the photographed promenade must preserve its unrelated access joins.
root = Path(__file__).resolve().parents[1]
gate_join = json.loads((root / 'data/coastal_gate.json').read_text())['route']['points'][-1]
assert gate_join in sf['paseo']['points'], 'Paseo no longer meets the coastal gate connector'
assert sf['paseo']['points'][0] == [-121.26, 242.45], 'Western mapped approach moved'
assert sf['paseo']['points'][-10:] == [[0.97,129.83],[13.48,113.38],[20.79,102.36],[28.87,96.28],[34.28,95.71],[68.46,61.23],[93.49,35.17],[134.29,-4.84],[146.38,-30.72],[150.39,-34.25]], 'Eastern mapped / boardwalk joins moved'
assert set(sf['paseo']['evidence']) >= {'IMG_2350.jpg','IMG_2352.jpg','IMG_2354.jpg','IMG_2349.jpg'}
print('Paseo retrace: photographed run, coastal access and eastern boardwalk joins preserved PASS')

# Issue #41: the paseo keeps half its width clear of every standing registry house,
# end to end. Registry parts the aerial shows are not standing keep their ring.
def edge_gap(p, ring):
    best = math.inf
    for i in range(len(ring)):
        a, b = ring[i], ring[i-1]
        dx, dz = b[0]-a[0], b[1]-a[1]
        t = max(0.0, min(1.0, ((p[0]-a[0])*dx + (p[1]-a[1])*dz) / ((dx*dx + dz*dz) or 1)))
        best = min(best, math.hypot(p[0]-a[0]-t*dx, p[1]-a[1]-t*dz))
    return best
samples = []
for a, b in zip(sf['paseo']['points'], sf['paseo']['points'][1:]):
    steps = max(1, math.ceil(math.dist(a, b) / 0.25))
    samples += [[a[0]+(b[0]-a[0])*i/steps, a[1]+(b[1]-a[1])*i/steps] for i in range(steps+1)]
half = sf['paseo']['width'] / 2
for house in skeleton['buildings']:
    if house['floors'] > 0 and not house.get('passage'):
        gap = min(-1 if inside(*p, house['ring']) else edge_gap(p, house['ring']) for p in samples)
        assert gap >= half, f'Paseo enters house {house["id"]}' if gap < 0 else f'Paseo passes {gap:.2f} m from house {house["id"]}; needs {half} m'
corrections = json.loads((root / 'data/registry_corrections.json').read_text())['notStanding']
assert {b['id'] for b in skeleton['buildings'] if b.get('notStanding')} == {c['id'] for c in corrections}
photo = Image.open(root / 'public/map/ground.jpg').convert('RGB')
for c in corrections:
    house = next(b for b in skeleton['buildings'] if b['id'] == c['id'])
    assert house['floors'] == 0 and house['notStanding']['registryFloors'] == c['registryFloors'] >= 1
    assert all(any(p['file'] == f for p in manifest) for f in c['evidence']) and c['trust']
    # The correction is only justified where the visible paseo paving crosses the part.
    assert any(inside(*p, house['ring']) for p in samples), f'{c["id"]} correction is not on the paseo'
    for x, z in c['aerialPaving']:
        assert inside(x, z, house['ring'])
        r, g, b = photo.getpixel((int((x-ground['minX'])/(ground['maxX']-ground['minX'])*photo.width), int((z-ground['minZ'])/(ground['maxZ']-ground['minZ'])*photo.height)))
        assert r > 190 and r > g + 30 and r > b + 40, f'Aerial at {x},{z} in {c["id"]} is not the pink paseo paving'
print(f'Paseo clearance: {len(samples)} samples keep {half} m from every standing registry house; {len(corrections)} registry parts on the aerial paseo kept as outlines PASS')
