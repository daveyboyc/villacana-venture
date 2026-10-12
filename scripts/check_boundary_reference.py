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
manifest=json.loads((ROOT/'public/photos-ref/manifest.json').read_text())
photos=[p for p in manifest if 2260<=int(p['file'][4:8])<=2270]
assert len(photos)==11
for photo in photos:
 assert all(k in photo for k in ['x','z','heading','accuracy']), 'Incomplete photo reference'
 assert not Image.open(ROOT/'public/photos-ref'/photo['file']).getexif(), 'Embedded photo metadata was not stripped'
print('Boundary references: clear street routes, solid fence, 11 positioned/heading/accuracy references, stripped embedded metadata PASS')
