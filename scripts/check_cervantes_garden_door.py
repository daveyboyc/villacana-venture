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
local=lambda p:(sum((p[i]-o[i])*u[i] for i in range(2)),sum((p[i]-o[i])*n[i] for i in range(2)))
rect=lambda a,b,c,e:[at(a,b),at(c,b),at(c,e),at(a,e)]
wall=rect(-d['wallWidth']/2,-d['wallThickness']/2,d['wallWidth']/2,d['wallThickness']/2)
steps=d['steps'];treads=[rect(-t['width']/2,t['front'],t['width']/2,t['back']) for t in steps]
# IMG_2196/2287/2327: three equal white risers, the top tread meeting the wall under the door.
assert d['risers']==len(steps)==3
for i,t in enumerate(steps):
 assert abs(t['top']-d['rise']*(i+1)/d['risers'])<1e-6 and t['top']-(steps[i-1]['top'] if i else 0)<.2,'Uneven or steep door risers'
 assert .25<=t['back']-t['front']<=.4,'Tread is not about two rows of small quarry tiles'
 if i:assert t['front']==steps[i-1]['back'] and t['width']<=steps[i-1]['width']
assert steps[-1]['back']==-d['wallThickness']/2 and steps[0]['width']>steps[1]['width']
assert d['frame']['width']*2+d['doorWidth']<=steps[1]['width']+.01,'Pilaster frame wider than the upper flight'
# The west bed front is flush with the bottom riser and both beds abut the upper flight.
bed=[local(p) for p in d['bed']['ring']];planter=[local(p) for p in d['eastPlanter']['ring']]
assert abs(min(b for a,b in bed)-steps[0]['front'])<.05,'Bottom step not flush with the west bed front'
assert abs(min(a for a,b in bed)-steps[1]['width']/2)<.01 and abs(max(a for a,b in planter)+steps[1]['width']/2)<.01,'Beds do not frame the flight'
assert steps[0]['front']<min(b for a,b in planter)<steps[0]['back']+.1,'East planter should stand behind the bottom step'
for t in steps:
 for p in sample(rect(-t['width']/2+.01,t['front']+.01,t['width']/2-.01,t['back']-.01),True):
  assert not inside(*p,d['bed']['ring']) and not inside(*p,d['eastPlanter']['ring']),'Tread overlaps a bed'
assert abs(math.hypot(*u)-1)<1e-6 and abs(sum(u[i]*n[i] for i in range(2)))<1e-6
for f in [d,d['patio'],d['bed'],d['eastPlanter']]:assert f['evidence'] and all(p in photos for p in f['evidence'])
for id,h in [('cervantes-junction-door-steps',d['rise']),('cervantes-junction-north-patio',d['rise']),('cervantes-junction-north-bed',d['bed']['height'])]:
 item=next(i for i in survey['items'] if i['id']==id)
 assert item['rise'][0]<=h<=item['rise'][1],f'{id}: outside surveyed range'
 if id=='cervantes-junction-door-steps':assert item['risers']==d['risers']
assert math.dist(o,next(i for i in survey['items'] if i['id']=='cervantes-junction-door-steps')['at'])<=1.5
foot=at(0,steps[0]['front']);datum=site_y(foot)+d['rise']
for ring in [wall,*treads,d['patio']['ring'],d['bed']['ring'],d['eastPlanter']['ring']]:
 for p in sample(ring,True):
  for r in s['boundaryReference']['roads']:
   assert min(distance(p,a,b) for a,b in zip(r['points'],r['points'][1:]))>=r['width']/2+.01,f"Garden feature intrudes into {r['id']}"
  for b in s['buildings']:
   if b['floors']>0:assert not inside(*p,b['ring']),f"Garden feature intersects house {b['id']}"
  for pool in s['pools']:assert not inside(*p,pool['ring'])
for p in sample(d['patio']['ring'],True):assert site_y(p)<=datum+1e-3,'Private floor would be buried by site terrain'
for f in ('bed','eastPlanter'):
 for p in sample(d[f]['ring'],True):assert site_y(p)<=site_y(foot)+d[f]['height']+.001,f'{f} buried by site terrain'
# Old continuous north wall must not obstruct the replaced step approach.
walls=json.loads((ROOT/'data/cervantes_patio_walls.json').read_text())['walls']
for w in walls:
 if w['side']=='north':
  for p in sample(w['points']):
   for t in treads:assert not inside(*p,t),'Old north wall cuts across door treads'
print('Cervantes garden door: three photo-read treads framed by the west bed and east planter, patio datum and closed wall keep all lanes and houses clear PASS')
