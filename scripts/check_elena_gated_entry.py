"""Private gates must remain outside both the registry passage and public routes."""
import json,math
from pathlib import Path
from check_elena_north import distance,sample
from check_map import inside
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/elena_gated_entry.json').read_text())
s=json.loads((ROOT/'public/map/skeleton.json').read_text())
photos={p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
assert set(d['evidence'])<=photos and len(d['evidence'])==3 and d['trust']
passage=next(b for b in s['buildings'] if b['id']==d['passageId'])
assert passage['passage']['trust']=='photo'
for p in sample(d['points']):
 assert not inside(*p,passage['ring']),'Gate blocks covered passage'
 for b in s['buildings']:
  if b['floors']>0 and not b.get('passage'):assert not inside(*p,b['ring']),f"Gate crosses house {b['id']}"
 for road in s['boundaryReference']['roads']:
  assert min(distance(p,a,b) for a,b in zip(road['points'],road['points'][1:]))>road['width']/2+d['thickness']/2,'Gate blocks public lane'
 for a,b in zip(d['walkwayProbe'],d['walkwayProbe'][1:]):assert distance(p,a,b)>1,'Gate blocks end-to-end walkway'
assert d['opening']>=1.5 and d['height']>=2
for p in sample(d['ring'],True):
 for b in s['buildings']:
  if b['floors']>0 and not b.get('passage'):assert not inside(*p,b['ring']),f"Tiled entry crosses house {b['id']}"
print('Elena gated entry: evidence, adjacent houses, public lanes and end-to-end passage clearance PASS')
