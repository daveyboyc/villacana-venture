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

# Issue 48: bounded north-west fragments, separate from the unchanged west planter.
n=json.loads((ROOT/'data/middle_pool_north.json').read_text())
for f in [n['cap'],n['wall'],n['pergola'],n['steps']]:
 assert f['evidence'] and all(p in photos for p in f['evidence'])
 assert 'estimated' in f['trust']
def north_clear(p,half,label):
 for r in roads.values():
  assert min(distance(p,a,b) for a,b in zip(r['points'],r['points'][1:]))-half>=r['width']/2-.025,f'{label} blocks {r["id"]} at {p}'
 for h in s['buildings']:
  if h['floors']>0:assert not inside(*p,h['ring']),f'{label} enters house'
 for pool in s['pools']:assert not inside(*p,pool['ring']),f'{label} enters pool'
 assert any(inside(*p,ring) for ring in n['review']['rings']),f'{label} outside review'
for p in sample(n['cap']['ring'],True):north_clear(p,0,'north cap')
for p in sample(n['wall']['points']):north_clear(p,n['wall']['thickness']/2,'brown-door wall')
for p in n['pergola']['points']:north_clear(p,n['pergola']['width']*.71,'pergola post')
st=n['steps'];stair=strip(st['foot'],st['toward'],st['width']/2)
for p in sample(stair,True):north_clear(p,0,'north steps')
assert st['count']==3 and .3<=st['rise']<=.5
terrain=json.loads((ROOT/'data/terrain.json').read_text())['middlePoolNorthSteps']
for key in ('foot','toward','width','count','rise'):assert st[key]==terrain[key],f'step mesh/ground mismatch {key}'
positions=json.loads((ROOT/'data/photo_positions.json').read_text())
for name in ('IMG_2331.HEIC','IMG_2332.HEIC'):
 assert positions[name]['locationBasis'] and positions[name]['gps']['accuracy']>8
assert math.dist(n['cap']['ring'][0],pl['ring'][0])<.01 and math.dist(n['cap']['ring'][-1],pl['ring'][-1])<.01,'Cap must join original planter ends'
assert max(p[1] for p in n['cap']['ring'])<91,'North feature must not replace south-west steps'
print('Middle pool north: independently corrected pins, bounded cap/door wall, open pergola and matching stepped ground PASS')
