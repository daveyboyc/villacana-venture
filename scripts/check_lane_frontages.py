"""Bounded frontage build: protect real routes/registry solids and keep the source doorway gap open."""
import json
import math
from pathlib import Path
from assign_photo_map import inside, nearest

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT/'data/middle_pool_lane_frontages.json').read_text())
gate = json.loads((ROOT/'data/middle_pool_south_gate.json').read_text())
skeleton = json.loads((ROOT/'public/map/skeleton.json').read_text())
photos = {p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
ux, uz = gate['forward']; cx, cz = gate['center']
def at(a, c): return [cx+ux*a-uz*c, cz+uz*a+ux*c]
def sample(ring):
    for a,b in zip(ring,ring[1:]+ring[:1]):
        n=max(1,math.ceil(math.dist(a,b)/.05))
        for i in range(n+1): yield [a[k]+(b[k]-a[k])*i/n for k in (0,1)]
def route_clear(p,radius=0,margin=0):
    for road in skeleton['boundaryReference']['roads']:
        assert nearest(p,road['points'])[0]>=road['width']/2+radius+margin-.001, f'Frontage intrudes on {road["id"]}: {p}'

for bed in data['beds']:
    assert bed['evidence'] and set(bed['evidence'])<=photos
    assert 'estimat' in bed['trust'].lower()
    ring=[at(*p) for p in bed['outline']]
    for p in sample(ring):
        route_clear(p)
        assert not any(inside(p,b['ring']) for b in skeleton['buildings'] if b['floors']>0),f'{bed["id"]} enters registry house'
        assert not any(inside(p,b['ring']) for b in skeleton['pools']),f'{bed["id"]} enters pool'
    plant=bed['planting']; a=plant['along'][0]
    while a<=plant['along'][1]+1e-6:
        radius=max(1.7*plant['scale']/2,.55*plant['scale']*2.8/2 if plant['kind']=='mixed' else 0)
        route_clear(at(a,plant['across']),radius,.15)
        assert inside(at(a,plant['across']),ring),'Plant centre escapes its bed'
        a+=plant['spacing']

houses={b['id']:b for b in skeleton['buildings']}
for opening in data['openings']:
    assert opening['profile']=='rectangular','Photo-backed grilles must have straight rectangular profiles'
    assert set(opening['evidence'])<=photos and 'estimat' in opening['trust'].lower()
    a,b=opening['facade']; house=houses[opening['building']]
    assert any(math.dist(a,p)<1e-6 and math.dist(b,q)<1e-6 for p,q in zip(house['ring'],house['ring'][1:]+house['ring'][:1])),'Opening anchor no longer uses original registry edge'
    length=math.dist(a,b);dx,dz=[(b[i]-a[i])/length for i in (0,1)];t=opening['at'];center=[a[i]+t*(b[i]-a[i]) for i in (0,1)]
    assert opening['width']/2+.12<min(t,1-t)*length,'Opening extends past facade corner'
    outward=[center[0]+dz*opening['projection'],center[1]-dx*opening['projection']]
    assert not inside(outward,house['ring']),'Grille points into the house'
    route_clear(outward,opening['width']/2,.15)

gap=data['doorway']['along']; station=sum(gap)/2
for c in [i*.1 for i in range(17)]:
    p=at(station,c)
    for bed in data['beds']:
        ring=[at(*q) for q in bed['outline']]
        assert not inside(p,ring) and nearest(p,ring+[ring[0]])[0]>=.42,'Doorway approach blocks a player'
assert max(p[0] for p in data['beds'][0]['outline'])<3.33,'Left fragment must stop before unresolved house/route conflict'
paving=data['paving']
assert paving['columns']==4 and set(paving['evidence'])<=photos
assert 'estimat' in paving['trust'] and paving['tilePitch']>0
for first,last in zip(paving['sections'],paving['sections'][1:]):
    if last[0]==first[0]:continue
    steps=max(1,math.ceil((last[0]-first[0])/.05))
    for i in range(steps):
        # Sample each strip interior; duplicate stations encode zero-area bed-front steps.
        t=(i+.5)/steps;a,left,right=[first[k]+(last[k]-first[k])*t for k in range(3)]
        assert left<-.6 and right>.6,'Four-course surface no longer covers protected through lane'
        # Check just inside its perimeter: shared bed edges are legitimate touching boundaries.
        for across in [left+.001,(left+right)/2,right-.001]:
            p=at(a,across)
            assert not any(inside(p,b['ring']) for b in skeleton['buildings'] if b['floors']>0),'Paving enters an original house'
            assert not any(inside(p,[at(*q) for q in bed['outline']]) for bed in data['beds']),f'Paving enters a planted bed at local {[a,across]}'
assert paving['sections'][0][0]>=gate['forecourt']['along'][1],'Lane tiles cover courtyard crazy paving'
print('Lane frontages: bounded beds and four-course paving clear original houses; plant footprints clear streets; rectangular grilles face lane; doorway stays open PASS')
