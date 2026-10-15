"""Check the middle pool features: photo evidence, lane clearance, open walkable gateway, houses and pools untouched."""
import json, math
from pathlib import Path
from check_map import inside
ROOT=Path(__file__).resolve().parents[1]
s=json.loads((ROOT/'public/map/skeleton.json').read_text())
d=json.loads((ROOT/'data/middle_pool.json').read_text())
photos={p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
catalog={e['id'] for e in json.loads((ROOT/'refs/catalog.json').read_text())}
roads={r['id']:r for r in s['boundaryReference']['roads']}
PLAYER=0.42

def distance(p,a,b):
 dx,dz=b[0]-a[0],b[1]-a[1];n=dx*dx+dz*dz
 t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/n)) if n else 0
 return math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dz*t)

def sample(points,closed=False):
 pts=points+[points[0]] if closed else points
 for a,b in zip(pts,pts[1:]):
  count=max(1,math.ceil(math.dist(a,b)/.1))
  for i in range(count+1):yield [a[j]+(b[j]-a[j])*i/count for j in range(2)]

def clear_of_everything(p,half,what):
 for r in roads.values():
  gap=min(distance(p,a,b) for a,b in zip(r['points'],r['points'][1:]))-half
  assert gap>=r['width']/2-.025,f"{what} intrudes into {r['id']} at {p}"
 for b in s['buildings']:
  if b['floors']>0:assert not inside(*p,b['ring']),f"{what} crosses house {b['id']}"
 for pool in s['pools']:assert not inside(*p,pool['ring']),f"{what} crosses a pool"
 assert any(inside(*p,ring) for ring in d['review']['rings']),f"{what} leaves its reviewed band at {p}"

def strip(a,b,half):
 """The four corners of a wall of half-thickness `half` between a and b."""
 l=math.dist(a,b);nx,nz=(b[1]-a[1])/l*half,-(b[0]-a[0])/l*half
 return [[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]]

g,pl=d['gateway'],d['planter']
for f in (d['lane'],g,pl):
 assert f['evidence'] and all(p in photos for p in f['evidence']),f"{f.get('id','lane')} cites a photo missing from the manifest"
 assert all(r in catalog for r in f.get('references',[])),f"{f.get('id','lane')} cites a reference missing from refs/catalog.json"
assert g['id']!=pl['id']

# Gateway: the lane crosses the wall line between its ends; the opening sits on the lane.
a,b=g['points'];length=math.dist(a,b);ux,uz=(b[0]-a[0])/length,(b[1]-a[1])/length
lane=roads[d['lane']['street']];la,lb=d['lane']['from'],d['lane']['to']
assert any(math.dist(la,p)<.01 for p in lane['points']) and any(math.dist(lb,p)<.01 for p in lane['points']),'Lane segment is not part of the route'
t=((a[0]-la[0])*uz-(a[1]-la[1])*ux)/((lb[0]-la[0])*uz-(lb[1]-la[1])*ux)
assert 0<t<1,'Gateway does not cross the lane'
cross=[la[0]+(lb[0]-la[0])*t,la[1]+(lb[1]-la[1])*t]
lo,hi=g['opening']
assert hi-lo>=lane['width']+.05 and hi-lo>=2*PLAYER+.3,'Gateway too narrow to walk through'
assert g['height']>=2.0 and g['pier']['height']>g['height'] and g['coping']['crown']>g['coping']['top']>g['coping']['bottom'],'Gateway head too low or coping inverted'
assert math.dist(a,cross)>-lo+g['pier']['width'] and math.dist(b,cross)>hi+g['pier']['width'],'Opening and piers run past the wall ends'
at=lambda o:[cross[0]+ux*o,cross[1]+uz*o]
for part in ([a,at(lo)],[at(hi),b]):
 for p in sample(part):clear_of_everything(p,g['thickness']/2,g['id'])
# Piers stand either side of the opening, proud of the wall faces.
for o in (lo-g['pier']['width']/2,hi+g['pier']['width']/2):
 c=at(o);ring=strip([c[0]-ux*g['pier']['width']/2,c[1]-uz*g['pier']['width']/2],[c[0]+ux*g['pier']['width']/2,c[1]+uz*g['pier']['width']/2],g['pier']['depth']/2)
 for p in sample(ring,True):clear_of_everything(p,0,g['id']+' pier')
# The open leaf stands along the courtyard side of the jamb it hangs from, clear of the lane.
lf=g['leaf'];assert lf['hinge']=='south-east' and 85<=lf['openDegrees']<=100
inward=[-uz,ux] if ((-uz)*(lb[0]-la[0])+ux*(lb[1]-la[1]))>0 else [uz,-ux]
hinge=[at(hi+.02)[0]+inward[0]*(g['pier']['depth']/2+.02),at(hi+.02)[1]+inward[1]*(g['pier']['depth']/2+.02)];w=hi-lo;ang=math.radians(lf['openDegrees'])
tip=[hinge[0]+(inward[0]*math.sin(ang)+ux*-math.cos(ang))*w,hinge[1]+(inward[1]*math.sin(ang)+uz*-math.cos(ang))*w]
for p in sample([hinge,tip]):clear_of_everything(p,lf['thickness']/2,g['id']+' leaf')
for sign in g['signs']:assert lo-g['pier']['width']-.6<=sign['along']<=lo and .6<=sign['y']<sign['y']+sign['height']<=g['height']
# Walking through: a player-sized circle fits through the opening along the lane.
assert (hi-lo)/2-PLAYER>=.2,'Too little room either side of a player in the opening'

# Planter: a raised bed beside the path, solid, about 0.8 m high.
assert .6<=pl['height']<=1.0 and .12<=pl['wall']<=.3
for p in sample(pl['ring'],True):clear_of_everything(p,0,pl['id'])
assert all(any(math.dist(f,r)<.01 for r in pl['ring']) for f in pl['face']),'Planter face is not on its outline'
# The path between planter and pool deck stays at least a lane wide.
pool=next(p for p in s['pools'] if p['id']=='middle')['ring']
gap=min(distance(p,a,b) for p in sample(pl['face'][:2]) for a,b in zip(pool,pool[1:]+pool[:1]))
assert gap>=roads['elena-south']['width'],f'Path between planter and pool too narrow ({gap:.2f} m)'
print('Middle pool: photo-linked east gateway and west planter keep the lanes clear, gateway open and walkable, houses and pools untouched PASS')

# Issue 31: gateway piers/open leaves use the same frame as the terrain flight.
sw=json.loads((ROOT/'data/middle_pool_sw_steps.json').read_text())
r=next(r for r in json.loads((ROOT/'data/terrain.json').read_text())['localAccessRuns'] if r['id']==sw['terrainId'])
assert sw['evidence'] and all(p in photos for p in sw['evidence'])
length=math.dist(r['foot'],r['toward']); ux,uz=[(r['toward'][i]-r['foot'][i])/length for i in range(2)]
at=lambda a,c:[r['foot'][0]+ux*a-uz*c,r['foot'][1]+uz*a+ux*c]
for side in [-1,1]:
 c=side*(sw['opening']/2+sw['pierWidth']/2); g=sw['gatewayAlong'];p=sw['pierWidth']
 for pt in [at(g+a,c+b) for a in [-p/2,p/2] for b in [-p/2,p/2]]:
  for road in roads.values():assert min(distance(pt,a,b) for a,b in zip(road['points'],road['points'][1:]))>=road['width']/2-.025,'SW pier intrudes on route'
  assert not any(inside(*pt,b['ring']) for b in s['buildings'] if b['floors']>0),'SW pier inside house'
 assert not any(inside(*at(g,c),pool['ring']) for pool in s['pools'])
assert sw['opening']>=2*PLAYER+.5 and sw['height']>=2
assert len(r['risers'])==3 and r['rise']/3<=.2
print('Middle pool southwest: photo-backed three risers and open gateway clear houses, pools and route PASS')
