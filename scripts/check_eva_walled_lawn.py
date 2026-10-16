"""Eva corner geometry, shared gateway, evidence and protected routes (not a survey)."""
import json, math
from pathlib import Path
from check_map import inside
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/eva_walled_lawn.json').read_text());s=json.loads((ROOT/'public/map/skeleton.json').read_text());g=json.loads((ROOT/'data/middle_pool.json').read_text())['gateway']
photos={p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
assert all(p in photos for p in d['evidence']+d['evaLawn']['evidence'])
assert d['wall']['points'][0]==g['points'][0], 'Return must join unchanged NW wing'
assert d['wall']['height']==g['northWestWing']['low']
assert .15<=d['wall']['thickness']<=.3 and math.dist(*d['wall']['points'])<4.3

def points(line,closed=False):
 for a,b in zip(line,line[1:]+(line[:1] if closed else [])):
  for i in range(101):yield [a[j]+(b[j]-a[j])*i/100 for j in range(2)]
def distance(p,a,b):
 dx,dz=b[0]-a[0],b[1]-a[1];t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)))
 return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz)
for geometry,half in [(d['wall']['points'],d['wall']['thickness']/2),(d['lawn']['ring'],0),(d['evaLawn']['ring'],0)]:
 for p in points(geometry,len(geometry)>2):
  for r in s['boundaryReference']['roads']:
   assert min(distance(p,a,b) for a,b in zip(r['points'],r['points'][1:]))>=r['width']/2+half-.025, f"Eva feature crosses {r['id']}: {p}"
  for b in s['buildings']:
   assert b['floors']==0 or not inside(*p,b['ring']),f"Eva feature crosses {b['id']}: {p}"
  for pool in s['pools']:assert not inside(*p,pool['ring'])
source=(ROOT/'src/eva-walled-lawn.ts').read_text()
assert 'evaWallRings()[0]' in source and 'if(scene.userData.layoutOnly)return;' in source
assert 'new THREE.PlaneGeometry(length,data.espalier.height)' in source and 'addSprites' not in source
assert 'decorationClearance' in source and 'clear(p,length/2)' in source
assert 'evaWallRings' in (ROOT/'src/blueprint.ts').read_text() and '...evaWallRings()' in (ROOT/'src/slice.ts').read_text()
print('Eva walled lawn: evidence, bounded return, shared map/mesh/collision, route clearance and Details-only flat espalier PASS')
