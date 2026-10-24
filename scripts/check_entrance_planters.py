"""Bounded entrance beds: source distinctions, actual host void and route clearances."""
import json, math
from pathlib import Path
from check_map import inside
ROOT=Path(__file__).resolve().parents[1]
load=lambda p:json.loads((ROOT/p).read_text())
data=load('data/entrance_planters.json');gate=load('data/middle_pool_south_gate.json');tunnel=load('data/silvia_tunnel.json');placement=load('data/silvia_map.json');s=load('public/map/skeleton.json')
photos={p['file'] for p in load('public/photos-ref/manifest.json')}
def world(frame,p):
 x,z=p
 if frame=='silvia':
  a,f=placement['entry'],placement['forward'];return [a[0]+f[1]*x+f[0]*z,a[1]-f[0]*x+f[1]*z]
 a,f=gate['center'],gate['forward'];return [a[0]+f[0]*z-f[1]*x,a[1]+f[1]*z+f[0]*x]
def gap(p,a,b):
 dx,dz=b[0]-a[0],b[1]-a[1];n=dx*dx+dz*dz;t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/n)) if n else 0
 return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz)
def samples(ring):
 for a,b in zip(ring,ring[1:]+ring[:1]):
  count=max(1,math.ceil(math.dist(a,b)/.05))
  for i in range(count+1):yield [a[j]+(b[j]-a[j])*i/count for j in range(2)]
def route_clear(p,radius=0):
 for road in s['boundaryReference']['roads']:
  assert all(gap(p,a,b)>=road['width']/2+radius+.15-.001 for a,b in zip(road['points'],road['points'][1:])),f"{p} intrudes on {road['id']}"
for bed in data['beds']:
 assert set(bed['evidence'])<=photos and bed['evidence']
 if bed['kind']=='kerbed-bed':assert 0<bed['wall']<bed['height']<=.2,'These are low kerbs, not tall mirror beds'
 else:assert bed['wall']==bed['height']==0,'Unresolved left base must remain unbuilt'
 ring=[world(bed['frame'],p) for p in bed['ring']]
 for p in samples(ring):
  route_clear(p)
  assert not any(inside(*p,b['ring']) and not any(inside(*p,h) for h in b.get('holes',[])) for b in s['buildings'] if b['floors']>0),f"{bed['id']} overlaps a solid house at {p}"
  assert not any(inside(*p,pool['ring']) for pool in s['pools'])
 for plant in bed['plants']:
  assert inside(*plant['at'],bed['ring'])
  route_clear(world(bed['frame'],plant['at']),plant['radius'])
  assert abs(plant['at'][0])>=.6+plant['radius']+.15,'Full garden foliage radius must clear centre approach'
right,left,pool=data['beds'];assert right['id']=='silvia-exit-right-planter' and left['id']=='silvia-exit-left-planting-fragment'
assert max(p[1] for p in left['ring'])-min(p[1] for p in left['ring']) < (max(p[1] for p in right['ring'])-min(p[1] for p in right['ring']))/2,'Do not mirror the occluded left edge'
assert len(tunnel['pots'])==4 and not any(p['id'].startswith('garden-') for p in tunnel['pots'])
assert gate['planter']['cornerRadius']<min(gate['planter']['across'][1]-gate['planter']['across'][0],gate['bench']['along'][0]-gate['planter']['along'][0])/2
assert gate['planter']['wall']<gate['planter']['cornerRadius']
assert {p[1] for p in pool['ring']}==set(gate['hedge']['along']),'Do not silently extend the kerb across Eva'
print('Silvia/pool entrance planters: asymmetric low fragments, four observed pots, host courtyard, unchanged pool and full route radii PASS (placement provisional)')
