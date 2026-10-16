"""Bounded Picasso frontage: photo evidence, route corridors and unchanged registry/terrain."""
import json,math,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/picasso_service_road.json').read_text());s=json.loads((ROOT/'public/map/skeleton.json').read_text())
photos={p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
def distance(p,a,b):
 dx,dz=b[0]-a[0],b[1]-a[1];t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)));return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz)
for f in d['features']:
 assert f['evidence'] and set(f['evidence'])<=photos
 assert f['trust'] and math.dist(*f['points'])<=12.1,'Unbounded frontage'
 a,b=f['points']
 for i in range(101):
  p=[a[j]+(b[j]-a[j])*i/100 for j in range(2)]
  for road in s['boundaryReference']['roads']:
   gap=min(distance(p,a,b) for a,b in zip(road['points'],road['points'][1:]))
   assert gap-f['thickness']/2>=road['width']/2+.14,(f['id'],road['id'],gap)
assert .2 <= d['ramp']['rise'] <= 1,'Ramp rise outside bounded private frontage scope'
assert 'data.ramp.ring as Vec2[]' in (ROOT/'src/picasso-service-road.ts').read_text(),'Private ramp requires solid inaccessible collision footprint'
for p in d['ramp']['ring']:
 for road in s['boundaryReference']['roads']:
  assert min(distance(p,a,b) for a,b in zip(road['points'],road['points'][1:]))>=road['width']/2+.14,'Ramp intrudes into route'
for bin in d['bins']:
 for road in s['boundaryReference']['roads']:
  assert min(distance(bin['position'],a,b) for a,b in zip(road['points'],road['points'][1:]))>=road['width']/2+.85+.15,'Bin footprint crosses route'
print('Picasso service road: bounded evidence-backed frontages and protected corridors retained')
