"""Calle Jorge: benches, walls, plants and plaques stay off the walking line; covers stay in the tiles."""
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
# Only what a photo shows: one bench, and dressing only along the photographed stretch.
shown = lane['photographed']
assert len(benches) == 1 and shown['from'] <= lane['benches']['along'][0] <= shown['to'], 'benches must be the photographed one, not repeats'
assert shown['from'] <= lane['boundary']['from'] < lane['boundary']['to'] <= shown['to'], 'wall runs outside the photographed stretch'
assert all(shown['from'] <= d <= shown['to'] for d in lane['plants']['along'] + lane['lamps']['along'] + [c['along'] for c in lane['covers']])
for p in benches + [tuple(lane['sign']['at']), tuple(lane['lamp']['at'])]:
    assert off_path(p) > jorge['width'] / 2 + 0.4, p
    assert not housed(p), p
assert lane['verges']['inner'] > lane['path']['edgeHalf'] > lane['path']['tileHalf'] > jorge['width'] / 2
covers = [spot(c['along'], abs(c['offset']), 'lawn' if c['offset'] >= 0 else 'hedge') for c in lane['covers']]
assert len(covers) >= 4
for p in covers:
    assert off_path(p) < lane['path']['tileHalf'] - 0.05, p
    assert not housed(p), p
fittings = [spot(lane['yucca']['along'], lane['yucca']['offset'], lane['yucca']['side']),
            spot(lane['cactus']['along'], lane['cactus']['offset'], lane['cactus']['side'])]
fittings += [spot(p['along'], p['offset'], p['side']) for p in lane['plaques']]
fittings += [spot(d, lane['lamps']['offset'], lane['lamps']['side']) for d in lane['lamps']['along']]
for p in fittings:
    assert off_path(p) > jorge['width'] / 2 + 0.3, p
    assert not housed(p), p
assert off_path(fittings[1]) > lane['boundary']['offset'] + 0.4
src = (ROOT / 'src/jorge-lane.ts').read_text()
for name in ('verge(', 'jorge-hedge', 'jorge-path', 'jorge-yucca', 'jorge-cactus', 'jorge-plaque', 'SANEA', 'SHOWN.from', 'if (scene.userData.layoutOnly) return;', 'decorationClearance', 'clippedHedge('):
    assert name in src, name
print(f'Calle Jorge: {len(benches)} photographed bench, dressing {shown["from"]}-{shown["to"]} m only, planting in Details behind the route guard, {len(covers)} covers, yucca, cactus, plaques and lamps PASS')
