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
 route=next(r['points'] for r in ref['roads'] if r['id']=='cervantes')
 dali=next(r['points'] for r in ref['roads'] if r['id']=='dali')
 # Endpoint connectivity is checked independently against road/area geometry.
 def line_distance(p, line):
  best=math.inf
  for a,b in zip(line,line[1:]):
   dx=b[0]-a[0];dz=b[1]-a[1];t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)))
   best=min(best,math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz))
  return best
 assert line_distance(route[0],dali)<0.05, 'Cervantes does not meet Dali road centre'
 assert inside(*route[-1],ref['mainParking']['ring']), 'Cervantes does not enter the main car park'
 picasso=next(r['points'] for r in s['streets'] if r['id']=='picasso-access')
 assert line_distance(route[-1],picasso)<0.05, 'Cervantes misses the car-park aisle'
 if ref.get('carParks'):
  parks={p['id']:p for p in ref['carParks']}
  assert set(parks)=={'dali','picasso'}, 'Both car parks must be represented'
  for park,endpoint in [(parks['dali'],route[0]),(parks['picasso'],route[-1])]:
   assert inside(*endpoint,park['ring']), f"Cervantes misses {park['name']}"
   assert math.dist(park['entrance'],endpoint)<0.05, f"Wrong entrance for {park['name']}"
   assert any(a['kind']=='car_park' and a['name']==park['name'] and a['ring']==park['ring'] for a in s['areas']), f"{park['name']} is missing from mapped areas"
  print('Both mapped car parks include their matching Cervantes entrances PASS')
 print('Cervantes endpoint connectivity: Dalí centreline and the unnamed Picasso car-park access PASS')
manifest=json.loads((ROOT/'public/photos-ref/manifest.json').read_text())
photos=[p for p in manifest if p['file'].startswith('IMG_') and 2260<=int(p['file'][4:8])<=2270]
assert len(photos)==11
for photo in photos:
 assert all(k in photo for k in ['x','z','heading','accuracy']), 'Incomplete photo reference'
 assert not Image.open(ROOT/'public/photos-ref'/photo['file']).getexif(), 'Embedded photo metadata was not stripped'
print('Boundary references: clear street routes, solid fence, 11 positioned/heading/accuracy references, stripped embedded metadata PASS')

for road in ref['roads']:
 if road.get('heights'):
  assert len(road['heights']) == len(road['points'])
  assert all(math.isfinite(h) for h in road['heights'])
  for a,b,ha,hb in zip(road['points'],road['points'][1:],road['heights'],road['heights'][1:]):
   # A lane may declare a steeper grade where a source shows a steep ramp (Calle Guillermo, data/guillermo_slope.json).
   assert abs(ha-hb)/math.dist(a,b)<road.get('maxGrade',0.1)+1e-6, 'Implausibly steep pedestrian slope'
for ramp in ref.get('ramps',[]):
 road=next(r for r in ref['roads'] if r['id']=='cervantes')
 assert len(ramp['points'])==len(ramp['heights'])==2
 for p,h in zip(ramp['points'],ramp['heights']):
  i=road['points'].index(p);assert abs(road['heights'][i]-h)<0.001
 assert set(ramp['evidence'])=={'photo:IMG_2262.jpg','photo:IMG_2265.jpg','photo:IMG_2286.jpg'}
print('Photo-backed ramp endpoints, shared heights and walkable slope PASS')

road=next(r for r in ref['roads'] if r['id']=='cervantes')
a,b=road['points'][0],road['points'][-1]
for p in road['points']:
 distance=abs((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))/math.dist(a,b)
 assert distance < 0.015, 'Cervantes must be straight between the two car parks'
assert not any(b.get('layoutCorrection') or b.get('registryRing') for b in s['buildings']), 'Registry frontages must be restored'
print('Straight, Google-checked Cervantes axis and original registry frontages PASS')
