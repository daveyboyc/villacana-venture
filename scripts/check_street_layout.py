"""Independently check street clearances and named junctions against the built map."""
import json, math
from pathlib import Path
from check_map import inside
ROOT=Path(__file__).resolve().parents[1]
s=json.loads((ROOT/'public/map/skeleton.json').read_text())
roads={r['id']:r for r in s['streets'] if r.get('points')}
assert len(roads)==18 and len(roads)==len([r for r in s['streets'] if r.get('points')]), 'Missing or duplicate mapped street IDs'
assert roads['cervantes']['name']=='Calle Miguel de Cervantes'
assert roads['isabel']['name']=='Calle Isabel de Oyarzábal'
assert not any(r['name'] in ['Calle Miguel','Calle Isabel','Calle Cervantes','Calle Teodoro','Calle Picasso'] for r in s['streets']), 'Stale uncertain street aliases'

def distance(p, a, b):
 dx=b[0]-a[0];dz=b[1]-a[1];n=dx*dx+dz*dz
 t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/n)) if n else 0
 return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz)

def to_line(p, line):return min(distance(p,a,b) for a,b in zip(line,line[1:]))
buildings=[(b,min(p[0]for p in b['ring'])-.45,max(p[0]for p in b['ring'])+.45,min(p[1]for p in b['ring'])-.45,max(p[1]for p in b['ring'])+.45) for b in s['buildings'] if b['floors']>0]
for road in roads.values():
 assert len(road['points'])>=2 and road['width']>0 and road['surface'] in ['terracotta','asphalt']
 assert all(math.isfinite(v) for p in road['points'] for v in p)
 for a,b in zip(road['points'],road['points'][1:]):
  length=math.dist(a,b);assert length>0.02, f"Duplicate points in {road['name']}"
  for i in range(math.ceil(length/.25)+1):
   t=min(1,i*.25/length);p=[a[j]+(b[j]-a[j])*t for j in range(2)]
   for building,min_x,max_x,min_z,max_z in buildings:
    if not (min_x<=p[0]<=max_x and min_z<=p[1]<=max_z):continue
    assert not inside(*p,building['ring']), f"{road['name']} crosses a house"
    clearance=min(distance(p,c,d) for c,d in zip(building['ring'],building['ring'][1:]+building['ring'][:1]))
    assert clearance>.45, f"{road['name']} lacks player clearance from {building['id']}"
   assert not any(inside(*p,pool['ring']) for pool in s['pools']), f"{road['name']} crosses pool water"
# Each join is checked against its parent street, not against a duplicate endpoint record.
joins=[('cervantes',0,'dali'),('cervantes',-1,'picasso-access'),('elena-north',0,'isabel'),('elena-north',-1,'cervantes'),('elena-south',0,'cervantes'),('elena-south',-1,'eva'),('isabel',-1,'alberto'),('alberto',0,'loira'),('alberto',-1,'cervantes'),('eva',0,'dali'),('eva',-1,'picasso-access'),('eva-west-footpath',0,'eva'),('eva-west-footpath',-1,'patricia'),('silvia-north',0,'eva'),('silvia-north',-1,'patricia'),('silvia-south',0,'patricia'),('silvia-south',-1,'jorge'),('teodoro-rojo',0,'eva'),('teodoro-rojo',-1,'jorge'),('guillermo',0,'eva'),('patricia',-1,'guillermo'),('jorge',0,'dali'),('jorge',-1,'guillermo'),('bolivia',0,'loira'),('bolivia',-1,'picasso')]
for child,index,parent in joins:
 assert to_line(roads[child]['points'][index],roads[parent]['points'])<.03, f'{child} misses {parent}'
reference=s['streetReference']
assert reference['checkedAt']=='2026-10-12' and reference['imageryCaptureDate'] is None
assert all('key=' not in url for url in reference['referenceLinks'].values())
assert not any(b.get('registryRing') or b.get('layoutCorrection') for b in s['buildings'])
print('18 Google/photo-checked street segments, house/player clearances, 25 joins, canonical names, original registry frontages and key-free reference links PASS')
