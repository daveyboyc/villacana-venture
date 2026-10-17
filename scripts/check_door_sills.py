"""Finite photographed thresholds, map/registry placement and bounded gentle approach."""
import json
import math
from pathlib import Path
from check_map import inside
from check_cervantes_patio_walls import distance, sample
ROOT=Path(__file__).resolve().parents[1]
load=lambda p:json.loads((ROOT/p).read_text())
d=load('data/door_sills.json');s=load('public/map/skeleton.json');terrain=load('data/terrain.json')
photos={p['file'] for p in load('public/photos-ref/manifest.json')}
for f in d['sills']+d['surfaces']+d['kerbs']+d['drains']+terrain['localSurfaces']:
 assert f['evidence'] and set(f['evidence'])<=photos and len(f['trust'])>80,f['id']
assert len(d['sills'])==2,'Only two garden doors are visible in 2260/2261/2330'
front=load('data/frontage_divisions.json')
entrance=next(r['ring'] for r in front['regions'] if r['id']=='cervantes-lawn-door-path')
gap=lambda p,r:min(distance(p,a,b) for a,b in zip(r,r[1:]+[r[0]]))
assert gap(d['sills'][0]['center'],entrance)<.3,'First sill must finish the existing photographed door approach'
lawn2=next(r['ring'] for r in front['regions'] if r['id']=='cervantes-elena-lawn-2')
assert gap(d['sills'][1]['center'],lawn2)<.6,'Second white sill must stay by the photographed second lawn frontage'
assert [f['finish'] for f in d['sills']]==['terracotta','white']
assert all(.1<=f['rise']<=.15 and .8<=f['width']<=1.1 and .25<=f['depth']<=.5 for f in d['sills'])
buildings=[b['ring'] for b in s['buildings'] if b['floors']>0 and not b.get('passage')]
# Only two short closed-door surrounds, sharing each photographed sill's axis.
g=d['gardenDoor'];assert g['width']==1.55 and g['leafWidth']<g['width'] and 1.8<=g['height']<=2.2
for f in d['sills']:
 a=[v/math.hypot(*f['along']) for v in f['along']];n=[a[1]*g["inwardSign"],-a[0]*g["inwardSign"]];offset=f['depth']/2+g['backGap']
 center=[f['center'][i]+n[i]*offset for i in [0,1]]
 ring=[[center[i]+a[i]*w*g['width']/2+n[i]*t*g['thickness']/2 for i in [0,1]] for w,t in [(-1,-1),(1,-1),(1,1),(-1,1)]]
 for p in sample(ring+[ring[0]]):
  assert not any(inside(*p,b) for b in buildings),f['id']+': door surround intrudes into registry house'
  for road in s['boundaryReference']['roads']:
   assert min(distance(p,a,b) for a,b in zip(road['points'],road['points'][1:]))>road['width']/2+.42,f['id']+': closed door blocks named lane'
 # A radius-.42 player can stand on the outer toe without passing the closed leaf.
 assert offset-g['thickness']/2+f['depth']/2-.015>.42
for f in d['surfaces']:
 for p in sample(f['ring']+[f['ring'][0]]):assert not any(inside(*p,b) for b in buildings),f['id']+': intrudes into house'
 assert .1<=f['rise']<=.15
path,lawn=[f['ring'] for f in d['surfaces']];kerb=d['kerbs'][0]['points']
assert min(gap(p,lawn) for p in path)<.001
assert all(gap(p,lawn)<.001 and gap(p,path)>.8 for p in sample(kerb)),'Parking kerb must be outside lawn, not at footpath edge'
r=terrain['localSurfaces'][0];length=math.dist(r['foot'],r['top']);assert 5<=length<=6 and .15<=r['rise']<=.35
assert r['rise']/length<.07 and .15<=r['kerbHeight']<=.25
assert min(gap(r['top'],b) for b in buildings)>.35,'External approach stops before unresolved solid registry passage'
u=[(r['top'][i]-r['foot'][i])/length for i in [0,1]];n=[-u[1],u[0]]
at=lambda a,c:[r['foot'][i]+u[i]*a+n[i]*c for i in [0,1]]
ring=[at(0,-r['width']/2-r['flare']),at(length+r['landing'],-r['width']/2),at(length+r['landing'],r['width']/2),at(0,r['width']/2+r['flare'])]
for p in sample(ring+[ring[0]]):
 assert not any(inside(*p,b) for b in buildings),'Approach must not raise a house footprint'
 for road in s['boundaryReference']['roads']:
  if road['id']=='dali':assert min(distance(p,a,b) for a,b in zip(road['points'],road['points'][1:]))>road['width']/2,'Approach blocks Dali'
 for pool in s['pools']:assert not inside(*p,pool['ring']) and gap(p,pool['ring'])>2
print('Door sills: two photographed doors, Dali path/lawn/outer kerb ordering, bounded 5.61 m gentle approach and unchanged house/pool footprints PASS')
