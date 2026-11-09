"""Calle Jorge east: the photographed bench and street sign sit off the walking line."""
import json, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
lane = json.loads((ROOT / 'data/jorge_lane.json').read_text())
skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
photos = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
jorge = next(s for s in skeleton['streets'] if s['id'] == 'jorge')
A, B = jorge['points']
dx, dz = B[0] - A[0], B[1] - A[1]
L2 = dx * dx + dz * dz
def inside(x, z, ring):
    inn = False
    for i, (x1, z1) in enumerate(ring):
        x2, z2 = ring[(i + 1) % len(ring)]
        if (z1 > z) != (z2 > z) and x < (x2 - x1) * (z - z1) / (z2 - z1 or 1e-12) + x1:
            inn = not inn
    return inn
def off(p):
    t = ((p[0] - A[0]) * dx + (p[1] - A[1]) * dz) / L2
    return math.hypot(p[0] - (A[0] + t * dx), p[1] - (A[1] + t * dz))
assert all(p in photos for p in lane['evidence'])
for name in ('bench', 'sign', 'lamp'):
    p = lane[name]['at']
    gap = off(p)
    assert gap > jorge['width'] / 2 + 0.35, f'{name} is in the walking line ({gap:.2f} m)'
    assert not any(b['floors'] > 0 and inside(p[0], p[1], b['ring']) for b in skeleton['buildings']), name
for item in (lane['bench'], lane['sign']):
    f = item['face']
    assert abs(math.hypot(*f) - 1) < 0.02
assert 'addJorgeLane(scene)' in (ROOT / 'src/slice.ts').read_text()
print('Calle Jorge bench and sign: off the walking line, clear of houses PASS')
