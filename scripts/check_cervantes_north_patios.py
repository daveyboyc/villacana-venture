"""Verify only visible fragments, evidence, registry/route separation and shared consumers."""
import json, math
from pathlib import Path
from check_map import inside
from check_cervantes_patio_walls import distance, sample
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/cervantes_north_patios.json').read_text())
s=json.loads((ROOT/'public/map/skeleton.json').read_text())
photos={p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
assert len(d['walls'])==3
for w in d['walls']:
 assert set(w['evidence'])=={'IMG_2368.jpg','IMG_2369.jpg','IMG_2359.jpg'} and set(w['evidence'])<=photos
 assert 'estimated' in w['trust'] and 'occluded' in w['trust']
 assert 1.4<w['height']<1.8 and 3<math.dist(*w['points'])<5
 for p in sample(w['points']):
  for r in s['boundaryReference']['roads']:
   assert min(distance(p,a,b) for a,b in zip(r['points'],r['points'][1:]))-w['thickness']/2>=r['width']/2, r['id']
  assert not any(inside(*p,b['ring']) for b in s['buildings']),w['id']
  assert not any(inside(*p,pool['ring']) for pool in s['pools'])
for p in d['planting']:
 assert not any(inside(*p['at'],b['ring']) for b in s['buildings'])
assert 'cervantesNorthPartitionRings()' in (ROOT/'src/slice.ts').read_text()
assert 'cervantesNorthPartitions' in (ROOT/'src/blueprint.ts').read_text()
print('Cervantes north partial partitions: evidence, honest limits, route clearances, unchanged registry and shared map/collision PASS')
