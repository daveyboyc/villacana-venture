#!/usr/bin/env python3
"""Calle de Picasso's raised grass strip and its retaining wall (data/picasso_west_lawn.json, src/picasso-west-lawn.ts).

  python3 scripts/check_picasso_west_lawn.py

Checks, every metre along each span: the grass stands level with the path beside it, the car park keeps its
own level right up to the wall's foot (the terrain hold in scripts/lidar_check.py grid), the wall is as high
as the laser survey's step between the two, the car-park outline stops at the wall's face, and the strip
is wired into the scene, collision, map and feature inventory with a confidence level.
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
load = lambda p: json.loads((ROOT / p).read_text())
data = load('data/picasso_west_lawn.json')
layout = load('data/street_layout.json')
ns = {'__file__': str(ROOT / 'scripts/check_terrain.py')}
exec((ROOT / 'scripts/check_terrain.py').read_text().split('\nassert')[0], ns)
site_y = ns['site_y']

(ox, oz), (tx, tz) = data['frame']['origin'], data['frame']['toward']
L = math.hypot(tx - ox, tz - oz); U = ((tx - ox) / L, (tz - oz) / L); W = (-U[1], U[0])
at = lambda s, w: (ox + U[0] * s + W[0] * w, oz + U[1] * s + W[1] * w)
west_of = lambda p: (p[0] - ox) * W[0] + (p[1] - oz) * W[1]
path = next(r for r in layout['streets'] if r['id'] == 'picasso-access')
wall = data['wall']

assert data['trust'].startswith('Inferred') and data['evidence'] == [], 'the strip is not photographed: inferred, no photo evidence'
assert 0.15 <= wall['thickness'] <= 0.3 and 2.5 <= wall['offset'] <= 4.0, 'wall size and line'
heights = []
for s0, s1 in data['spans']:
    assert 0 <= s0 < s1 <= 110
    for i in range(int(s1 - s0) + 1):
        s = s0 + i
        # The path's centreline here (the street is straight along the strip).
        a, b = path['points'][0], path['points'][1]
        p = at(s, 0)
        d = (b[0] - a[0], b[1] - a[1]); den = W[0] * d[1] - W[1] * d[0]
        t = ((a[0] - p[0]) * d[1] - (a[1] - p[1]) * d[0]) / den
        path_y = site_y(at(s, t))
        assert t - path['width'] / 2 > wall['offset'] + wall['thickness'] + 2, f's {s}: grass narrower than 2 m'
        # Grass at the path's level: the ground under it (the survey) agrees within 0.12 m away from the wall's blur.
        mid = (t - path['width'] / 2 + wall['offset'] + wall['thickness']) / 2 + 0.5
        assert abs(site_y(at(s, mid)) - path_y) < 0.15, f's {s}: grass strip is not at the path level ({site_y(at(s, mid)):.2f} vs {path_y:.2f})'
        # The car park is level up to the wall's foot: no bank of asphalt up the wall.
        car, foot = site_y(at(s, data['hold']['carParkAt'])), site_y(at(s, wall['offset'] - 0.05))
        edge = min(s - s0, s1 - s) >= data['hold']['blend']
        assert not edge or abs(foot - car) < 0.12, f's {s}: car park rises {foot - car:.2f} m to the wall foot'
        heights.append((s, path_y - car))
# The wall's height follows the survey's step: about 0.84 m at its highest, 30 m along, and low south of Cervantes.
assert max(h for _, h in heights) > 0.7 and max(h for s, h in heights if 24 <= s <= 34) > 0.7, 'wall is not about 0.8 m high 30 m along'
assert all(h < 0.4 for s, h in heights if s >= 80), 'wall south of Cervantes is too high'
assert all(h > -0.1 for _, h in heights), 'grass below the car park'
# The car-park outline's west edge is the wall's face, apart from the gap where Cervantes comes in.
ring = layout['mainParkingRing']
west_edge = [p for p in ring if abs(west_of(p) - wall['offset']) < 0.05]
assert len(west_edge) >= 4, 'car-park outline does not stop at the wall face'
gap = [p for p in ring if west_of(p) > wall['offset'] + 0.5]
assert len(gap) == 2 and all(data['spans'][0][1] - 0.05 <= (p[0] - ox) * U[0] + (p[1] - oz) * U[1] <= data['spans'][1][0] + 0.05 for p in gap), 'outline gap is not where the grass is broken for Cervantes'

src = (ROOT / 'src/slice.ts').read_text()
assert 'addPicassoWestLawn(scene)' in src and 'picassoWestLawnRings()' in src, 'slice.ts: grass strip not drawn or wall not solid'
assert 'picassoWestLawnPlan' in (ROOT / 'src/blueprint.ts').read_text(), 'blueprint.ts: grass strip not on the map'
assert 'picasso_west_lawn.json' in (ROOT / 'scripts/assign_photo_map.py').read_text(), 'grass strip not in the feature inventory'
assert load('data/confidence.json')['features'].get('picasso_west_lawn.json:' + data['id'], {}).get('level') == 'inferred', 'grass strip needs an inferred confidence level'
print(f"Calle de Picasso grass strip: {len(heights)} stations at the path level, car park level to the wall foot, wall up to {max(h for _, h in heights):.2f} m PASS")
