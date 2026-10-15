"""Check the Elena north features: photo evidence, lane clearance, open gateway, houses and pools untouched."""
import json, math
from pathlib import Path
from check_map import inside
ROOT=Path(__file__).resolve().parents[1]
s=json.loads((ROOT/'public/map/skeleton.json').read_text())
d=json.loads((ROOT/'data/elena_north.json').read_text())
photos={p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
roads={r['id']:r for r in s['boundaryReference']['roads']}
PLAYER=0.42

def distance(p,a,b):
 dx,dz=b[0]-a[0],b[1]-a[1];n=dx*dx+dz*dz
 t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/n)) if n else 0
 return math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dz*t)

def sample(points,closed=False):
 pts=points+[points[0]] if closed else points
 for a,b in zip(pts,pts[1:]):
  count=max(1,math.ceil(math.dist(a,b)/.1))
  for i in range(count+1):yield [a[j]+(b[j]-a[j])*i/count for j in range(2)]

def clear_of_everything(p,half,what):
 for r in roads.values():
  gap=min(distance(p,a,b) for a,b in zip(r['points'],r['points'][1:]))-half
  assert gap>=r['width']/2-.025,f"{what} intrudes into {r['id']}"
 for b in s['buildings']:
  # Zero-storey registry parts are yards, not houses; covered walkways stay open below.
  if b['floors']>0:assert not inside(*p,b['ring']),f"{what} crosses house {b['id']}"
 for pool in s['pools']:assert not inside(*p,pool['ring']),f"{what} crosses a pool"
 assert inside(*p,d['review']['ring']),f"{what} leaves the reviewed Elena band"

features=[d['gateway'],*d['walls'],*d['beds']]
assert len({f['id'] for f in features})==len(features)
for f in features:
 assert f['evidence'] and all(p in photos for p in f['evidence']),f"{f['id']} cites a missing photo"

g=d['gateway'];a,b=g['points'];length=math.dist(a,b)
lo,hi=g['opening'];lane=roads['elena-north']
assert hi-lo>=lane['width']+.05 and hi-lo>=2*PLAYER+.3,'Gateway too narrow to walk through'
assert g['archSpring']<g['archCrown']<g['top'] and g['archCrown']>=2.1,'Gateway arch too low to walk under'
# The opening is measured along the wall from where the lane crosses it; the solid
# parts either side are rebuilt here exactly as src/elena-north.ts builds them.
ux,uz=(b[0]-a[0])/length,(b[1]-a[1])/length
la,lb=lane['points'][0],lane['points'][-1]
t=((a[0]-la[0])*uz-(a[1]-la[1])*ux)/((lb[0]-la[0])*uz-(lb[1]-la[1])*ux)
assert 0<t<1,'Gateway does not cross the lane'
cross=[la[0]+(lb[0]-la[0])*t,la[1]+(lb[1]-la[1])*t]
at=lambda o:[cross[0]+ux*o,cross[1]+uz*o]
assert math.dist(a,cross)>-lo and math.dist(b,cross)>hi,'Opening runs past the wall ends'
west=[a,at(lo)];east=[at(hi),b]
for part in (west,east):
 for p in sample(part):clear_of_everything(p,g['thickness']/2,g['id'])
for w in d['walls']:
 assert .6<=w['height']<=2.2 and .12<=w['thickness']<=.35
 for p in sample(w['points']):clear_of_everything(p,w['thickness']/2,w['id'])
for bed in d['beds']:
 assert 0<bed['kerb']<=.45
 for p in sample(bed['ring'],True):clear_of_everything(p,0,bed['id'])
for box in d['planters']:
 assert .3<=box['height']<=1 and box['evidence'] and all(p in photos for p in box['evidence'])
 for p in sample(box['ring'],True):clear_of_everything(p,0,box['id'])
print('Elena north: photo-linked gateway, patio wall and beds keep the lanes clear, gateway open and walkable, houses and pools untouched PASS')
