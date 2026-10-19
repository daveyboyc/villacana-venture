"""Barraka access: citations, finite photo-supported extent and registry/route clearance."""
import json, math
from pathlib import Path
from check_map import inside
ROOT = Path(__file__).resolve().parents[1]
d = json.loads((ROOT/'data/barraka_boardwalk.json').read_text())
s = json.loads((ROOT/'public/map/skeleton.json').read_text())
photos = {p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
for f in (d['boardwalk'], d['sign'], d['seating']):
 assert f['evidence'] and set(f['evidence']) <= photos
 assert 'estimat' in f['trust'].lower() or 'unknown' in f['trust'].lower()
def distance(p,a,b):
 dx,dz=b[0]-a[0],b[1]-a[1]; n=dx*dx+dz*dz
 t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/n)) if n else 0
 return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz)
def sample(points):
 for a,b in zip(points,points[1:]):
  n=max(1,math.ceil(math.dist(a,b)/.2))
  for i in range(n+1): yield [a[j]+(b[j]-a[j])*i/n for j in range(2)]
w=d['boardwalk']; assert 1.3<=w['width']<=2
assert 15<sum(math.dist(a,b) for a,b in zip(w['points'],w['points'][1:]))<50
for a,b in zip(w['points'],w['points'][1:]):
 length=math.dist(a,b); nx,nz=-(b[1]-a[1])/length*w['width']/2,(b[0]-a[0])/length*w['width']/2
 for centre in sample([a,b]):
  for off in [-1,0,1]:
   p=[centre[0]+off*nx,centre[1]+off*nz]
   for house in s['buildings']:
    if house['floors']>0: assert not inside(*p,house['ring']),f'Boardwalk crosses registry {house["id"]}'
   for pool in s['pools']: assert not inside(*p,pool['ring'])
routes=s['boundaryReference']['roads']+[s['seafront']['paseo'],w]
for p,radius in [(d['sign']['point'],1.25)]+[(p,2.35) for p in d['seating']['parasols']]:
 for route in routes:
  gap=min(distance(p,a,b) for a,b in zip(route['points'],route['points'][1:]))
  assert gap>=route['width']/2+radius+.15, f'Prop enters route at {p}'
 for house in s['buildings']:
  if house['floors']>0:
   assert not inside(*p,house['ring'])
   assert min(distance(p,a,b) for a,b in zip(house['ring'],house['ring'][1:]+house['ring'][:1]))>=radius
 if p != d['sign']['point']: assert not inside(*p,s['seafront']['restaurant']['terrace'])
# Owner and originals establish the flank and side; this does not certify precise coordinates.
a,b=w['points'][0],w['points'][-1]
def left(point):return ((b[1]-a[1])*(point[0]-a[0])-(b[0]-a[0])*(point[1]-a[1]))/math.dist(a,b)
roof=s['seafront']['restaurant']['ring'];centre=[sum(p[j] for p in roof)/len(roof) for j in (0,1)]
assert left(centre)<-w['width']/2,'Restaurant must be right of the seaward aisle, per owner identification'
assert left(d['sign']['point'])>w['width']/2+1.25,'Planter must be left of the aisle, clear of its full width'
assert math.dist(a,min(roof,key=lambda p:math.dist(p,a)))<4,'Landward aisle context must remain beside actual Barraka'
print('Barraka: source-supported flank/side relations, estimated finite access and full prop clearance PASS; metre placement remains unapproved')
