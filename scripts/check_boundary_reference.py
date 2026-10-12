"""Validate the photo-backed street and boundary geometry against registry buildings."""
import json, math
from pathlib import Path
from PIL import Image
from check_map import inside
ROOT=Path(__file__).resolve().parents[1]
s=json.loads((ROOT/'public/map/skeleton.json').read_text());ref=s['boundaryReference']
for road in ref['roads']:
 for a,b in zip(road['points'],road['points'][1:]):
  length=math.hypot(a[0]-b[0],a[1]-b[1]);assert length>0
  for i in range(math.ceil(length)+1):
   t=min(1,i/length);x=a[0]+(b[0]-a[0])*t;z=a[1]+(b[1]-a[1])*t
   assert not any(h['floors']>0 and inside(x,z,h['ring']) for h in s['buildings']), f'{road["name"]} crosses a house'
   assert not any(inside(x,z,p['ring']) for p in s['pools']), f'{road["name"]} crosses pool water'
assert any(b['solid'] for b in ref['barriers']), 'No solid fence boundary'
if ref.get('connection'):
 route=next(r['points'] for r in ref['roads'] if r['name']=='Calle Cervantes')
 dali=next(r['points'] for r in ref['roads'] if r['name']=='Calle Pintor Dalí')
 # Endpoint connectivity is checked independently against road/area geometry.
 def line_distance(p, line):
  best=math.inf
  for a,b in zip(line,line[1:]):
   dx=b[0]-a[0];dz=b[1]-a[1];t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)))
   best=min(best,math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz))
  return best
 assert line_distance(route[0],dali)<0.05, 'Cervantes does not meet Dali road centre'
 assert inside(*route[-1],ref['mainParking']['ring']), 'Cervantes does not enter the main car park'
 picasso=next(r['points'] for r in s['streets'] if r['name']=='Calle Pintor Picasso')
 assert line_distance(route[-1],picasso)<0.05, 'Cervantes misses the car-park aisle'
 print('Cervantes endpoint connectivity: Dali centreline and main car-park/Picasso aisle PASS')
manifest=json.loads((ROOT/'public/photos-ref/manifest.json').read_text())
photos=[p for p in manifest if 2260<=int(p['file'][4:8])<=2270]
assert len(photos)==11
for photo in photos:
 assert all(k in photo for k in ['x','z','heading','accuracy']), 'Incomplete photo reference'
 assert not Image.open(ROOT/'public/photos-ref'/photo['file']).getexif(), 'Embedded photo metadata was not stripped'
print('Boundary references: clear street routes, solid fence, 11 positioned/heading/accuracy references, stripped embedded metadata PASS')
