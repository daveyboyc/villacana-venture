"""Calle Jorge: bench, walls, kerb, beds, plants and plaques stay off the walking line; covers stay in the tiles; cross-paths, lawns and beds stay out of houses."""
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
assert len(benches) == 1 and shown['from'] <= lane['benches']['along'][0] <= shown['to'], 'one photographed bench'
# Further benches come only from marks on the aerial, each recorded with its basis; never a regular repeat.
aerial = lane['benches']['aerial']
assert lane['benches']['aerialBasis'] and all(b['side'] in ('lawn', 'hedge') for b in aerial)
stations = sorted(b['along'] for b in aerial) + lane['benches']['along']
assert all(abs(p - q) > 3 for i, p in enumerate(stations) for q in stations[i + 1:]), 'two benches on one spot'
benches += [spot(b['along'], b['offset'], b['side']) for b in aerial]
assert not any(g['from'] - 1 < b['along'] < g['to'] + 1 and g['kind'] == 'threshold' for b in aerial if b['side'] == 'hedge' for g in lane['boundary']['gaps']), 'bench in a patio threshold'
assert shown['from'] <= lane['boundary']['from'] < lane['boundary']['to'] <= shown['to'], 'wall runs outside the photographed stretch'
assert all(shown['from'] <= d <= shown['to'] for d in lane['lamps']['along'] + [c['along'] for c in lane['covers']])
# One lamp post is photographed along the lane (IMG_2234, on the kerb corner); the other stands by the plinth.
assert len(lane['lamps']['along']) == 1, 'only the photographed lamp post'
wall = lane['boundary']
gaps = wall['gaps']
assert all(wall['from'] <= g['from'] < g['to'] <= wall['to'] and g['kind'] in ('open', 'threshold') for g in gaps)
assert all(a['to'] <= b['from'] for a, b in zip(gaps, gaps[1:])), 'wall gaps overlap'
face = wall['offset'] - wall['thickness'] / 2
assert face > lane['path']['edgeHalf'] + 0.1, 'planter wall stands on the path'
for n in wall['niches']:
    assert n['on'] in ('end', 'face')
    if n['on'] == 'end':
        assert any(abs(g['from'] - n['along']) < 1e-6 and g['kind'] == 'threshold' for g in gaps), 'an end niche faces a threshold'
    else:
        assert not any(g['from'] <= n['along'] < g['to'] for g in gaps), 'a face niche needs a wall'
# The kerbed garden lawn lies in the open gap, and nothing stands in it but the kerb.
kerb = lane['kerb']
openings = [g for g in gaps if g['kind'] == 'open']
assert any(g['from'] <= kerb['from'] and kerb['to'] <= g['to'] for g in openings), 'kerb must run along an open gap'
assert kerb['offset'] - kerb['width'] / 2 > lane['path']['edgeHalf'], 'kerb on the path'
for g in lane['grass']:
    assert g['side'] in ('lawn', 'hedge') and shown['from'] <= g['from'] < g['to'] <= shown['to'], g
    assert g.get('inner', lane['verges']['inner']) > lane['path']['edgeHalf']
    if g['side'] == 'hedge':
        assert all(not (r[0] < g['to'] and g['from'] < r[1]) for r in [(wall['from'], gaps[0]['from'])]), 'grass under a planter wall'
# Cross-paths leave the lane at its edge, stay on the lawn side, inside the photographed stretch and out of houses.
cross = lane['crossPaths']
assert cross['edgeHalf'] > cross['tileHalf'] > 0
for path in cross['lines']:
    pts_ = path['points']
    assert abs(pts_[0][1] - lane['path']['edgeHalf']) < 1e-6, 'a cross-path starts at the lane edge'
    for (s0, d0), (s1, d1) in zip(pts_, pts_[1:]):
        for k in range(21):
            s_, d_ = s0 + (s1 - s0) * k / 20, d0 + (d1 - d0) * k / 20
            assert shown['from'] <= s_ <= shown['to'] and d_ > 0
            for e in (-cross['edgeHalf'], cross['edgeHalf']):
                assert not housed(spot(s_, d_ + e, 'lawn')), (path['id'], s_, d_)
bench_at = lane['benches']['along'][0]
assert all(abs(path['points'][0][0] - bench_at) > 1.2 for path in cross['lines']), 'a cross-path runs through the bench'
for bed in lane['beds']:
    (s0, s1), (d0, d1) = bed['along'], bed['offset']
    assert shown['from'] <= s0 < s1 <= shown['to'] and d0 > lane['path']['edgeHalf'] + 1
    for c in ((s0, d0), (s1, d0), (s1, d1), (s0, d1)):
        assert not housed(spot(c[0], c[1], 'lawn')), (bed['id'], c)
    for s_, d_ in bed['shrubs'] + ([bed['strelitzia']] if 'strelitzia' in bed else []):
        assert s0 < s_ < s1 and d0 < d_ < d1, (bed['id'], s_, d_)
    # A bed is not laid across a cross-path.
    for path in cross['lines']:
        for (a0, b0), (a1, b1) in zip(path['points'], path['points'][1:]):
            for k in range(21):
                s_, d_ = a0 + (a1 - a0) * k / 20, b0 + (b1 - b0) * k / 20
                assert not (s0 - cross['edgeHalf'] < s_ < s1 + cross['edgeHalf'] and d0 - cross['edgeHalf'] < d_ < d1 + cross['edgeHalf']), (bed['id'], path['id'])
for c in lane['climbers']:
    assert c['side'] in ('lawn', 'hedge') and shown['from'] <= c['from'] <= shown['to'] and c['offset'] > 3
for zone in lane['plainFronts']:
    assert shown['from'] <= zone['along'][0] < zone['along'][1] <= shown['to'] and all(e in photos for e in zone['evidence']), zone
loose = [spot(lane[k]['along'], lane[k]['offset'], lane[k]['side']) for k in ('plaqueHedge', 'lantana', 'grassCover', 'olive')]
for p in loose:
    assert off_path(p) > jorge['width'] / 2 + 0.3 and not housed(p), p
assert lane['plaqueHedge']['offset'] - lane['plaqueHedge']['depth'] / 2 > lane['path']['edgeHalf'] + 0.3
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
for name in ('grass(', 'jorge-cross-path', 'jorge-threshold', 'jorge-wall-niche', 'jorge-kerb', 'jorge-bed-kerb', 'jorge-climber', 'jorge-plaque-hedge', 'jorge-olive', 'jorgeWallRuns', 'inJorgePlainFront', 'jorge-hedge', 'jorge-path', 'jorge-yucca', 'jorge-cactus', 'jorge-plaque', 'SANEA', 'SHOWN.from', 'if (scene.userData.layoutOnly) return;', 'decorationClearance', 'clippedHedge('):
    assert name in src, name
print(f'Calle Jorge: 1 photographed bench and {len(aerial)} from the aerial, dressing {shown["from"]}-{shown["to"]} m only, {len(cross["lines"])} cross-paths, {len(lane["beds"])} beds, kerbed garden lawn, {len(gaps)} wall gaps, planting in Details behind the route guard, {len(covers)} covers, dragon tree, cactus, plaques and lamp PASS')
