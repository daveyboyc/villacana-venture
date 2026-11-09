"""Calle Jorge: benches, walls and verges stay off the path and out of houses."""
import json, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
lane = json.loads((ROOT / 'data/jorge_lane.json').read_text())
skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
photos = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
jorge = next(s for s in skeleton['streets'] if s['id'] == 'jorge')
pts = jorge['points']
def inside(x, z, ring):
    inn = False
    for i, (x1, z1) in enumerate(ring):
        x2, z2 = ring[(i + 1) % len(ring)]
        if (z1 > z) != (z2 > z) and x < (x2 - x1) * (z - z1) / (z2 - z1 or 1e-12) + x1:
            inn = not inn
    return inn
def spot(dist, offset, side):
    left = dist
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        dx, dz = b[0] - a[0], b[1] - a[1]
        length = math.hypot(dx, dz)
        if left <= length or i == len(pts) - 2:
            d = (dx / length, dz / length)
            lawn = (-d[1], d[0])
            n = lawn if side == 'lawn' else (-lawn[0], -lawn[1])
            t = min(left, length)
            return (a[0] + d[0] * t + n[0] * offset, a[1] + d[1] * t + n[1] * offset)
        left -= length
def off_path(p):
    A, B = pts
    dx, dz = B[0] - A[0], B[1] - A[1]
    t = ((p[0] - A[0]) * dx + (p[1] - A[1]) * dz) / (dx * dx + dz * dz)
    return math.hypot(p[0] - (A[0] + t * dx), p[1] - (A[1] + t * dz))
def housed(p):
    return any(b['floors'] > 0 and inside(p[0], p[1], b['ring']) for b in skeleton['buildings'])
assert all(p in photos for p in lane['evidence'])
benches = [spot(d, lane['benches']['offset'], 'lawn') for d in lane['benches']['along']]
assert len(benches) >= 6
for p in benches + [tuple(lane['sign']['at']), tuple(lane['lamp']['at'])]:
    assert off_path(p) > jorge['width'] / 2 + 0.4, p
    assert not housed(p), p
assert 'verge(' in (ROOT / 'src/jorge-lane.ts').read_text() and 'jorge-hedge' in (ROOT / 'src/jorge-lane.ts').read_text()
print(f'Calle Jorge: {len(benches)} benches, grass and hedge wall off the path PASS')
