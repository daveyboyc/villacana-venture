"""Check photographed parking/path/frontage separation and usable approaches."""
import json, math
from pathlib import Path
from check_map import inside
from check_cervantes_patio_walls import distance, sample
ROOT=Path(__file__).resolve().parents[1]
s=json.loads((ROOT/'public/map/skeleton.json').read_text())
d=json.loads((ROOT/'data/dali_cervantes_threshold.json').read_text())
walls=json.loads((ROOT/'data/cervantes_patio_walls.json').read_text())['walls']
photos={p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
assert {z['kind'] for z in d['zones']}=={'bays','lawn','footpath','crossing'}
assert len({z['id'] for z in d['zones']})==len(d['zones'])
solid=[b for b in s['buildings'] if not b.get('passage')]
for zone in d['zones']:
 assert all(p in photos for p in zone['evidence'])
 assert len(zone['ring'])>=3 and all(math.isfinite(v) for p in zone['ring'] for v in p)
 for p in sample(zone['ring']+[zone['ring'][0]]):
  for b in solid:assert not inside(*p,b['ring']),f"{zone['id']} overlaps {b['id']}"
for p in sample(d['footpathCentreline']):
 for b in solid:
  gap=min(distance(p,a,c) for a,c in zip(b['ring'],b['ring'][1:]+[b['ring'][0]]))
  assert not inside(*p,b['ring']) and gap>=.43, f"House obstructs shared footpath: {b['id']}"
 for w in walls:
  assert min(distance(p,a,c) for a,c in zip(w['points'],w['points'][1:]))>=w['thickness']/2+.43, 'Patio wall closes shared footpath'
for k in d['kerbs']:
 for p in sample(k['points']):assert not inside(*p,d['crossingRing']), 'Kerb closes tiled crossing'
print('Dalí threshold: distinct photo-linked bays, grass, shared path and crossing; facade/wall clearances and open kerbs PASS')
