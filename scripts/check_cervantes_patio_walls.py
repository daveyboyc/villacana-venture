"""Check the Cervantes wall test's photo evidence, route clearance and limits."""
import json, math
from pathlib import Path
from check_map import inside
ROOT=Path(__file__).resolve().parents[1]
s=json.loads((ROOT/'public/map/skeleton.json').read_text())
d=json.loads((ROOT/'data/cervantes_patio_walls.json').read_text())
photos={p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
roads={r['id']:r for r in s['boundaryReference']['roads']}

def distance(p,a,b):
 dx,dz=b[0]-a[0],b[1]-a[1];n=dx*dx+dz*dz
 t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/n)) if n else 0
 return math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dz*t)

def sample(points):
 for a,b in zip(points,points[1:]):
  count=max(1,math.ceil(math.dist(a,b)/.1))
  for i in range(count+1):yield [a[j]+(b[j]-a[j])*i/count for j in range(2)]

assert len(d['walls'])>=2 and len({w['id'] for w in d['walls']})==len(d['walls'])
for w in d['walls']:
 assert w['solid'] and .4<=w['height']<=1.2 and .12<=w['thickness']<=.3
 assert w['streetId']=='cervantes' and all(p in photos for p in w['evidence'])
 for p in sample(w['points']):
  assert min(distance(p,a,b) for a,b in zip(d['review']['points'],d['review']['points'][1:])) < d['review']['width']/2
  for r in roads.values():
   gap=min(distance(p,a,b) for a,b in zip(r['points'],r['points'][1:]))-w['thickness']/2
   assert gap>=r['width']/2-.025,f"Wall intrudes into {r['id']}"
  for opening in d['openings']:assert not inside(*p,opening['ring']),f"Wall closes {opening['name']}"
  for b in s['buildings']:assert not inside(*p,b['ring']),f"Wall crosses house {b['id']}"
  for pool in s['pools']:assert not inside(*p,pool['ring']),"Wall crosses pool"
print('Cervantes photo-linked walls: checked Calle clearances, open approaches, original houses/pools and bounded test scope PASS')
