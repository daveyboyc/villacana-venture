"""Check the bounded garden threshold, its photo heights, and all route clearances."""
import json,math
from pathlib import Path
from check_map import inside
from check_elena_north import distance,sample
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/cervantes_garden_door.json').read_text())
s=json.loads((ROOT/'public/map/skeleton.json').read_text())
survey=json.loads((ROOT/'data/levels_survey.json').read_text())
photos={p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
ns={'__file__':str(ROOT/'scripts/check_terrain.py')}
exec((ROOT/'scripts/check_terrain.py').read_text().split('\nassert')[0],ns)
site_y=ns['site_y']
o,u,n=d['origin'],d['along'],d['inward']
at=lambda a,b:[o[i]+a*u[i]+b*n[i] for i in range(2)]
rect=lambda a,b,c,e:[at(a,b),at(c,b),at(c,e),at(a,e)]
wall=rect(-d['wallWidth']/2,-d['wallThickness']/2,d['wallWidth']/2,d['wallThickness']/2)
steps=rect(-d['stepWidth']/2,-2*d['stepRun'],d['stepWidth']/2,-d['wallThickness']/2)
assert d['risers']==2 and d['rise']/2<.3
assert abs(math.hypot(*u)-1)<1e-6 and abs(sum(u[i]*n[i] for i in range(2)))<1e-6
for f in [d,d['patio'],d['bed']]:assert f['evidence'] and all(p in photos for p in f['evidence'])
for id,h in [('cervantes-junction-door-steps',d['rise']),('cervantes-junction-north-patio',d['rise']),('cervantes-junction-north-bed',d['bed']['height'])]:
 item=next(i for i in survey['items'] if i['id']==id)
 assert item['rise'][0]<=h<=item['rise'][1],f'{id}: outside surveyed range'
assert math.dist(o,next(i for i in survey['items'] if i['id']=='cervantes-junction-door-steps')['at'])<=1.5
foot=at(0,-2*d['stepRun']);datum=site_y(foot)+d['rise']
for ring in [wall,steps,d['patio']['ring'],d['bed']['ring']]:
 for p in sample(ring,True):
  for r in s['boundaryReference']['roads']:
   assert min(distance(p,a,b) for a,b in zip(r['points'],r['points'][1:]))>=r['width']/2+.01,f"Garden feature intrudes into {r['id']}"
  for b in s['buildings']:
   if b['floors']>0:assert not inside(*p,b['ring']),f"Garden feature intersects house {b['id']}"
  for pool in s['pools']:assert not inside(*p,pool['ring'])
for p in sample(d['patio']['ring'],True):assert site_y(p)<=datum+1e-3,'Private floor would be buried by site terrain'
for p in sample(d['bed']['ring'],True):assert site_y(p)<=site_y(foot)+d['bed']['height']+.001,'Bed buried by site terrain'
# Old continuous north wall must not obstruct the replaced step approach.
walls=json.loads((ROOT/'data/cervantes_patio_walls.json').read_text())['walls']
for w in walls:
 if w['side']=='north':
  for p in sample(w['points']):assert not inside(*p,steps),'Old north wall cuts across door treads'
print('Cervantes garden door: two photo-height treads, patio datum, bounded bed and closed wall keep all lanes and houses clear PASS')
