"""South pool remains level above the paseo; one photographed sandstone boundary."""
import json
import math
from pathlib import Path
from check_terrain import site_y, turned
from check_paseo_wall import paseo_height, to_line, offset

ROOT = Path(__file__).resolve().parents[1]
s = json.loads((ROOT / 'public/map/skeleton.json').read_text())
south = json.loads((ROOT / 'data/south_pool.json').read_text())
level = south['seawardLevel']
wall = json.loads((ROOT / 'data/paseo_wall.json').read_text())['wall']
assert set(level['evidence']) == {'IMG_2349.jpg', 'IMG_2188.jpg'}
assert 'estimated' in level['trust'] and 'not surveyed' in level['trust']
pool = next(p for p in s['pools'] if p['id'] == 'south')
assert all(site_y(p) == 0 for p in pool['ring']), 'Do not tilt or lift the pool'
# Entire traced south lawn retains the pool datum, including its seaward edge.
a = math.radians(s['viewRotation'])
for ring in south['lawns']:
    for x, z in ring:
        p = [x * math.cos(a) + z * math.sin(a), -x * math.sin(a) + z * math.cos(a)]
        assert abs(site_y(p)) < 1e-6, f'Lawn is no longer level at {p}'
        assert abs(paseo_height(x) + 1) < 1e-6, 'Paseo below this lawn must retain the photographed approx 1 m drop'
fence = offset(wall['face'], wall['fence']['setback'])
shared = [(a, b) for a, b in zip(s['seaWall']['points'], s['seaWall']['points'][1:]) if to_line(a, fence) < 1.2 and to_line(b, fence) < 1.2]
assert len(shared) >= 8, 'Legacy south boundary no longer reconciles with sandstone'
print('South pool: level pool/lawns at 0 m, paseo about 1 m below; sandstone replaces shared sea-wall stretches PASS')
