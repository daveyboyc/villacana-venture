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

# Issue 31: the south-west gateway sits in the frame of the stone steps (data/middle_pool_steps.json), above their top.
sw=json.loads((ROOT/'data/middle_pool_sw_gateway.json').read_text())
r=json.loads((ROOT/'data/middle_pool_steps.json').read_text())
assert sw['evidence'] and all(p in photos for p in sw['evidence'])
length=math.dist(r['foot'],r['toward']); ux,uz=[(r['toward'][i]-r['foot'][i])/length for i in range(2)]
at=lambda a,c:[r['foot'][0]+ux*a-uz*c,r['foot'][1]+uz*a+ux*c]
assert sw['gatewayAlong']-sw['pierWidth']/2>r['end'],'Gateway stands on the ramp instead of the upper landing'
for side in [-1,1]:
 c=side*(sw['opening']/2+sw['pierWidth']/2); g=sw['gatewayAlong'];p=sw['pierWidth']
 for pt in [at(g+a,c+b) for a in [-p/2,p/2] for b in [-p/2,p/2]]:
  for road in roads.values():assert min(distance(pt,a,b) for a,b in zip(road['points'],road['points'][1:]))>=road['width']/2-.025,'SW pier intrudes on route'
  assert not any(inside(*pt,b['ring']) for b in s['buildings'] if b['floors']>0),'SW pier inside house'
 assert not any(inside(*at(g,c),pool['ring']) for pool in s['pools'])
assert sw['opening']>=2*PLAYER+.5 and sw['height']>=2
print('Middle pool southwest: photo-backed open gateway above the steps clears houses, pools and route PASS')

# The steps' footprint stays out of the planter, houses and pools.
for along in [i*.1 for i in range(int(r['end']*10)+1)]:
 for across in r['across']:
  pt=at(along,across)
  assert not inside(*pt,pl['ring']),'SW steps overlap the unchanged planter'
  assert not any(inside(*pt,b['ring']) for b in s['buildings'] if b['floors']>0),'SW steps overlap a registry house'
  assert not any(inside(*pt,pool['ring']) for pool in s['pools']),'SW steps overlap a pool'
print('Middle pool southwest: steps footprint avoids unchanged planter, houses and pools PASS')
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
assert len(st['risers'])==3 and 0<st['risers'][0]<st['risers'][1]<st['risers'][2]<st['end']
assert abs(math.dist(st['foot'],st['toward'])-st['end'])<1e-6
assert 'middlePoolNorth.steps' in (ROOT/'src/ramp-steps.ts').read_text(),'North steps must use existing terrain flight mechanism'
assert 'middlePoolNorthSteps' not in (ROOT/'data/terrain.json').read_text(),'Do not add an isolated north plateau'
ns={'__file__':str(ROOT/'scripts/check_terrain.py')}
exec((ROOT/'scripts/check_terrain.py').read_text().split('\nassert')[0],ns)
base=ns['site_y'](st['foot']);top=ns['site_y'](st['toward'])
fl=next(r for r in ns['grid']['ramps'] if r['id']==st['id'])
assert abs(base-fl['base'])<1e-6 and abs(top-base-fl['rise'])<1e-6,'North steps must join the surveyed foot to the upper lane'
assert .3<=top-base<=.55
for i,r in enumerate(st['risers']):
 t=(r+.01)/st['end'];p=[st['foot'][j]+(st['toward'][j]-st['foot'][j])*t for j in range(2)]
 tread=base+(top-base)*(i+1)/len(st['risers'])
 offset=max(0,tread-ns['site_y'](p))
 assert abs(ns['site_y'](p)+offset-max(tread,ns['site_y'](p)))<1e-8
assert abs(max(top,base+(top-base))-top)<1e-8,'No extra rise at upper endpoint'
positions=json.loads((ROOT/'data/photo_positions.json').read_text())
for name in ('IMG_2331.HEIC','IMG_2332.HEIC'):
 assert positions[name]['locationBasis'] and positions[name]['gps']['accuracy']>8
assert math.dist(n['cap']['ring'][0],pl['ring'][0])<.01 and math.dist(n['cap']['ring'][-1],pl['ring'][-1])<.01,'Cap must join original planter ends'
assert max(p[1] for p in n['cap']['ring'])<91,'North feature must not replace south-west steps'
print('Middle pool north: independently corrected pins, bounded cap/door wall, open pergola and matching stepped ground PASS')
# Issue 39: distinct level south entrance; every outline is shared with rendering.
south=json.loads((ROOT/'data/middle_pool_south_gate.json').read_text())
assert {'IMG_2334.jpg','IMG_2335.jpg'}<=set(south['evidence']) and all(p in photos for p in south['evidence'])
assert south['opening']>=2*PLAYER+.5 and south['height']>=2
assert abs(math.hypot(*south['forward'])-1)<1e-5
ux,uz=south['forward'];cx,cz=south['center'];at=lambda a,c:[cx+ux*a-uz*c,cz+uz*a+ux*c]
def south_rect(a,b,c,d):return [at(a,c),at(b,c),at(b,d),at(a,d)]
w=south['opening']/2;p=south['pier'];bed=south['planter'];bench=south['bench'];panel=south['panel']
rings=[]
for side in [-1,1]:
 c=side*(w+p/2);rings.extend([south_rect(-p/2,p/2,c-p/2,c+p/2),south_rect(-south['leafLength'],0,side*w-.025,side*w+.025)])
rings.extend([south_rect(bed['along'][0],bench['along'][0],*bed['across']),south_rect(bench['along'][1],bed['along'][1],*bed['across']),south_rect(*bench['along'],bench['plinth']['across'][0],bench['seat']['across'][1]),south_rect(*panel['wallAlong'],panel['across'],panel['across']+.16)])
for ring in rings:
 for pt in sample(ring,True):
  for road in roads.values():assert min(distance(pt,a,b) for a,b in zip(road['points'],road['points'][1:]))>=road['width']/2-.025,f'South entrance intrudes on {road["id"]}'
  assert not any(inside(*pt,b['ring']) for b in s['buildings'] if b['floors']>0),'South entrance overlaps registry house'
  assert not any(inside(*pt,pool['ring']) for pool in s['pools']),'South entrance overlaps pool'
# Collision-free straight traversal between the open leaves; no grade change is authored.
for pt in sample([at(-2.8,0),at(1.8,0)]):
 assert not any(inside(*pt,ring) or min(distance(pt,a,b) for a,b in zip(ring,ring[1:]+ring[:1]))<PLAYER for ring in rings),'South entrance blocks a player'
 assert not any(inside(*pt,b['ring']) for b in s['buildings'] if b['floors']>0),'South traversal crosses house'
# IMG_2334/2335 (corrected 18 Oct): the open right leaf lies against planter, and the wall bench starts past its swing.
seat,plinth=bench['seat'],bench['plinth']
assert bed['along'][0]<bench['along'][0]<bench['along'][1]<bed['along'][1],'Bench must be recessed into the planter, with planter on both sides'
assert bench['along'][1]<=-(south['leafLength']+.5),'Wall bench must sit past the open gate leaf, not behind it'
assert 1.4<=-bench['along'][1]<=2.2,'IMG_2334: about 1.7 m of planter between the gate and the bench'
assert .35<=seat['height']<=.5 and .03<=plinth['height']<=.15,'IMG_2335: a seat-height bench with a low plinth in front'
assert plinth['across'][0]<=bed['across'][0]+.05 and plinth['across'][1]==seat['across'][0] and seat['across'][1]==panel['across'],'Plinth, seat and tiled back wall must stack without gaps'
assert panel['wallAlong'][0]<=panel['along'][0] and panel['along'][1]<=panel['wallAlong'][1] and panel['bottom']>=seat['height']+.3
assert bed['along'][0]<=-3.0,'IMG_2334: the planter continues past the bench towards the courtyard'
assert -3.1<=south['drain']['along']<=-2.2,'IMG_2334: the drain sits level with the bench, about 2.3-3 m in from the gate'
assert math.dist(south['center'],[-135.63,100.42])>8,'South gate duplicates southwest entrance'
print('Middle pool south: separate open double gate, planter, wall bench past the leaf and tiled panel preserve routes and registry PASS')

# Bounded south forecourt: materials can cross a route, planting must clear its full width.
court,hedge=south['forecourt'],south['hedge']
assert {'IMG_2334.jpg','IMG_2335.jpg'}<=set(court['evidence'])<=set(south['evidence']) and hedge['evidence']==['IMG_2334.jpg']
assert 'estimated' in court['trust'] and 'estimated' in hedge['trust']
assert court['along'][0]<south['paving']['along'][0] and court['along'][1]==south['paving']['along'][1]
assert court['across']==south['paving']['across'],'Keep the photographed narrow width; do not widen across private boundaries'
for pt in sample(south_rect(*court['along'],*court['across']),True):
 assert not any(inside(*pt,b['ring']) for b in s['buildings'] if b['floors']>0),'Forecourt enters registry house'
 assert not any(inside(*pt,p['ring']) for p in s['pools']),'Forecourt enters pool'
radius=1.7*hedge['spriteScale']/2
for along in (hedge['along'][0]+hedge['spacing']*i for i in range(1+round((hedge['along'][1]-hedge['along'][0])/hedge['spacing']))):
 pt=at(along,hedge['across'])
 for road in roads.values():
  gap=min(distance(pt,a,b) for a,b in zip(road['points'],road['points'][1:]))
  assert gap>=road['width']/2+radius+.15,f'Visible hedge footprint blocks {road["id"]}'
print('Middle pool south forecourt: bounded photo-cited stone avoids registry solids; Details hedge footprint clears Eva/Silvia PASS')
