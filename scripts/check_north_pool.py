"""Bounded north-pool wall, paving and stepped patio source/clearance checks.
These test internal consistency, not surveyed photographic fidelity.
"""
import json,math
from pathlib import Path
from check_map import inside
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/north_pool.json').read_text());s=json.loads((ROOT/'public/map/skeleton.json').read_text());t=json.loads((ROOT/'data/terrain.json').read_text())
photos={p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}

def distance(p,a,b):
 dx,dz=b[0]-a[0],b[1]-a[1];n=dx*dx+dz*dz
 f=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/n)) if n else 0
 return math.dist(p,[a[0]+dx*f,a[1]+dz*f])
def sample(a,b):
 n=max(1,math.ceil(math.dist(a,b)/.1))
 return [[a[j]+(b[j]-a[j])*i/n for j in range(2)] for i in range(n+1)]
for feature in [*d['walls'],d['path'],d['stairs']]:
 assert feature['evidence'] and all(p in photos for p in feature['evidence'])
 assert len(feature['trust'])>100
for w in d['walls']:
 assert .7<=w['height']<=1.1 and .15<=w['thickness']<=.3
 assert len(w['points'])>=4,'Curved wall must retain its traced bends'
 for a,b in zip(w['points'],w['points'][1:]):
  for p in sample(a,b):
   assert any(inside(*p,r) for r in d['review']['rings'])
   assert not any(inside(*p,b['ring']) for b in s['buildings'] if b['floors']>0),'Wall crosses registry house'
   assert not any(inside(*p,pool['ring']) for pool in s['pools']),'Wall crosses pool'
   for road in s['boundaryReference']['roads']:
    assert min(distance(p,a,b) for a,b in zip(road['points'],road['points'][1:]))>=road['width']/2+w['thickness']/2,'Wall intrudes into protected lane'
f=d['stairs'];p=next(p for p in t['localPatios'] if p['id']=='north-pool-raised-patio')
assert p['flight']==f,'Ground and visible treads must use identical flight data'
assert f['count']==5 and .12<=f['rise']/f['count']<=.18 and f['width']>=1.5
assert p['height']==f['rise']
for point in sample(f['from'],f['to']):
 for w in d['walls']:
  assert min(distance(point,a,b) for a,b in zip(w['points'],w['points'][1:]))>.42+w['thickness']/2,'Player cannot pass through stair opening'
for pool in s['pools']:
 assert not any(inside(*v,p['ring']) for v in pool['ring']),'Local patio must not raise pool'
for a,b in zip(d['path']['points'],d['path']['points'][1:]):
 for point in sample(a,b):
  for w in d['walls']:
   assert min(distance(point,a,b) for a,b in zip(w['points'],w['points'][1:]))>.42+w['thickness']/2,'Perimeter path blocked by wall'
print('North pool: photo citations, bounded curves, protected lanes, open steps, shared ground and pool datum pass (placement remains approximate)')
