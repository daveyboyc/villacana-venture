"""South pool remains level above the paseo; one photographed sandstone boundary."""
import json
import math
from pathlib import Path
from check_terrain import grid, site_y, turned
from check_paseo_wall import paseo_height, to_line, offset

ROOT = Path(__file__).resolve().parents[1]
s = json.loads((ROOT / 'public/map/skeleton.json').read_text())
south = json.loads((ROOT / 'data/south_pool.json').read_text())
level = south['seawardLevel']
wall = json.loads((ROOT / 'data/paseo_wall.json').read_text())['wall']
assert set(level['evidence']) == {'IMG_2349.jpg', 'IMG_2188.jpg'}
assert 'estimated' in level['trust'] and 'not surveyed' in level['trust']
pool = next(p for p in s['pools'] if p['id'] == 'south')
deck = grid['decks']['south']
assert all(abs(site_y(p) - deck) < 0.01 for p in pool['ring']), 'Do not tilt the pool off its surveyed deck'
# The traced south lawn follows the laser survey from the deck (up to about 0.6 m towards Dalí) without a step;
# its seaward edge stays at the pool datum, about 1 m above the paseo as photographed.
a = math.radians(s['viewRotation'])
for ring in south['lawns']:
    pts = [[x * math.cos(a) + z * math.sin(a), -x * math.sin(a) + z * math.cos(a)] for x, z in ring]
    for (x, z), p in zip(ring, pts):
        assert -0.01 <= site_y(p) <= 0.7, f'Lawn off the surveyed ground at {p}'
        assert abs(paseo_height(x) + 1) < 1e-6, 'Paseo below this lawn must retain the photographed approx 1 m drop'
        if z >= grid['fade'][0]:
            assert abs(site_y(p) - deck) <= 0.15, f'Seaward lawn edge is not at the pool datum at {p}'
    for p, q in zip(pts, pts[1:]):
        for i in range(1, 11):
            m = [p[j] + (q[j] - p[j]) * i / 10 for j in range(2)]
            n = [p[j] + (q[j] - p[j]) * (i - 1) / 10 for j in range(2)]
            assert abs(site_y(m) - site_y(n)) <= 0.15 * max(math.dist(m, n), 0.1), f'Lawn has a step at {m}'
fence = offset(wall['face'], wall['fence']['setback'])
shared = [(a, b) for a, b in zip(s['seaWall']['points'], s['seaWall']['points'][1:]) if to_line(a, fence) < 1.2 and to_line(b, fence) < 1.2]
assert len(shared) >= 8, 'Legacy south boundary no longer reconciles with sandstone'
print('South pool: level pool at its surveyed deck, lawns on the survey, seaward edge about 1 m above the paseo; sandstone replaces shared sea-wall stretches PASS')
