"""Bounded photo-backed Cervantes kerb: shared collision line and lane clearance."""
import json, math
from pathlib import Path
from check_cervantes_patio_walls import distance, sample
from check_map import inside
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/cervantes_east_hedge.json').read_text())
s=json.loads((ROOT/'public/map/skeleton.json').read_text())
photos={p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
w=d['walls'][0]
assert len(d['walls'])==1 and w['solid'] and w['side']=='north'
assert set(w['evidence'])=={'IMG_2356.jpg','IMG_2360.jpg'} <= photos
assert .25<=w['height']<=.5 and math.dist(*w['points'])<=8.05
for p in sample(w['points']):
 for r in s['boundaryReference']['roads']:
  gap=min(distance(p,a,b) for a,b in zip(r['points'],r['points'][1:]))-w['thickness']/2
  assert gap>=r['width']/2+.1, f"Kerb intrudes into {r['id']}"
 assert all(not inside(*p,b['ring']) for b in s['buildings']), 'Kerb crosses registry house'
 assert all(not inside(*p,b['ring']) for b in s['pools']), 'Kerb crosses pool'
p=d['planting']
assert all(f in photos for f in p['evidence'])
for q in sample([p['from'],p['to']]):
 for r in s['boundaryReference']['roads']:
  assert min(distance(q,a,b) for a,b in zip(r['points'],r['points'][1:])) >= r['width']/2+p['radius']+.2
print('Cervantes east hedge: bounded photo evidence, original footprints and complete lane/plant radius clearances PASS')
