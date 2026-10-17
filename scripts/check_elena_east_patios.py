"""Issue #38: the photographed enclosure of the patios behind the Elena garden wall.

python3 scripts/check_elena_east_patios.py
Checks evidence and honest limits, that the walls continue the existing garden wall
and close on the registry face, keep every lane clear, stay off houses and pools,
and that map, mesh and collision consume the same records.
"""
import json, math
from pathlib import Path
from check_map import inside
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/elena_east_patios.json').read_text())
s=json.loads((ROOT/'public/map/skeleton.json').read_text())
elena=json.loads((ROOT/'data/elena_north.json').read_text())
hedge=json.loads((ROOT/'data/cervantes_east_hedge.json').read_text())
photos={p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
PLAYER=.42

def distance(p,a,b):
    dx,dz=b[0]-a[0],b[1]-a[1];n=dx*dx+dz*dz
    t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/n)) if n else 0
    return math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dz*t)
def sample(points,step=.1):
    for a,b in zip(points,points[1:]):
        n=max(1,math.ceil(math.dist(a,b)/step))
        for i in range(n+1):yield [a[j]+(b[j]-a[j])*i/n for j in range(2)]
def ring_gap(p,ring):return min(distance(p,a,b) for a,b in zip(ring,ring[1:]+ring[:1]))
def unit(a,b):l=math.dist(a,b);return ((b[0]-a[0])/l,(b[1]-a[1])/l)

# Evidence and honest trust: every feature cites indexed photos and says what is estimated.
assert {'IMG_2366.jpg','IMG_2362.jpg','IMG_2360.jpg'}<=set(d['sources'])<=photos,'task photos must be reviewed sources'
for f in [*d['walls'],d['pergola']]:
    assert f['evidence'] and set(f['evidence'])<=photos,f['id']
    assert 'estimate' in f['trust'],f['id']
assert 'hidden' in d['trust'] or 'under the magnolia' in d['trust'],'say that the roof shots do not show the patio insides'
walls={w['id']:w for w in d['walls']}
west,south=walls['elena-east-patios-west-wall'],walls['elena-east-patios-cervantes-wall']
assert all(w['solid'] for w in d['walls']),'private patio walls are solid (no gate photographed)'

# The west wall continues the existing garden wall from its door surround, on the same line.
garden=next(w for w in elena['walls'] if w['id']=='elena-north-garden-wall')
assert math.dist(west['points'][0],garden['points'][-1])<.01,'west wall must start at the garden wall end'
gu,wu=unit(*garden['points']),unit(*west['points'])
assert abs(gu[0]*wu[1]-gu[1]*wu[0])<.02,'west wall must stay on the garden wall line'
assert 1.5<math.dist(*west['points'])<3.2 and abs(west['height']-garden['height'])<.05
bed=next(b for b in elena['beds'] if b['id']=='elena-north-tree-bed-2')
assert max(ring_gap(p,bed['ring']) for p in sample(west['points']))<.45,'west wall stands behind the second hedged bed'

# The Cervantes wall closes the band: shares the west wall's corner and ends on the registry face.
assert south['points'][0]==west['points'][-1],'corner must be shared'
part3=next(b for b in s['buildings'] if b['id']=='6265401UF1366N_part3')
assert ring_gap(south['points'][-1],part3['ring'])<.05,'Cervantes wall ends on the house front'
road={r['id']:r for r in s['boundaryReference']['roads']}
cerv=road['cervantes']['points']
axis=lambda p:min(distance(p,a,b) for a,b in zip(cerv,cerv[1:]))
kerb=hedge['walls'][0]
for p in sample(south['points']):
    assert 1.8<=axis(p)<=2.3,('Cervantes wall runs behind the kerb and hedge',p,axis(p))
assert all(axis(p)+.3<axis(q) for p in kerb['points'] for q in [south['points'][0]]),'wall stays behind the photographed kerb'
assert 4<math.dist(*south['points'])<8 and 1.6<south['height']<2.2

# Every lane keeps its width plus a player's radius; walls stay off houses and pools.
for w in d['walls']:
    pts=list(sample(w['points']))
    for r in s['boundaryReference']['roads']:
        gap=min(distance(p,a,b) for p in pts for a,b in zip(r['points'],r['points'][1:]))-w['thickness']/2
        assert gap>=r['width']/2+PLAYER,(w['id'],r['id'],gap)
    for p in pts:
        if math.dist(p,w['points'][-1])<.15 and w is south:continue # meets the house front
        assert not any(inside(*p,b['ring']) for b in s['buildings']),(w['id'],p)
        assert not any(inside(*p,pool['ring']) for pool in s['pools']),(w['id'],p)

# Pergola: inside the walled band, east of the garden wall, clear of the houses.
review=d['review']['ring']
pg=d['pergola']
for p in pg['ring']:
    assert inside(*p,review),('pergola inside the patio band',p)
    assert not any(inside(*p,b['ring']) for b in s['buildings'])
    assert distance(p,garden['points'][0],garden['points'][1])-garden['thickness']/2>=.2,'pergola clear of the wall'
assert 2.1<=pg['height']<=2.6 and pg['post']<=.2

# Bougainvillea is Details only, inside the patio band and well off the lanes (runtime guard also applies).
for q in d['planting']:
    assert q['kind']=='bougainvillea' and q['evidence'] in photos
    assert inside(*q['at'],review),q
    assert all(min(distance(q['at'],a,b) for a,b in zip(r['points'],r['points'][1:]))>=r['width']/2+.9 for r in s['boundaryReference']['roads']),q

# The review band suppresses generated clutter only inside the patios, never on a lane.
for r in s['boundaryReference']['roads']:
    assert not any(inside(*p,review) for p in sample(r['points'],.25)),r['id']

# Map, mesh and collision consume the same records; the photo map cites them.
slice_ts=(ROOT/'src/slice.ts').read_text();blueprint=(ROOT/'src/blueprint.ts').read_text()
assert 'elenaEastPatioRings()' in slice_ts and 'addElenaEastPatios(scene)' in slice_ts
assert slice_ts.count('!inElenaEastPatios(')>=3 and blueprint.count('!inElenaEastPatios(')>=2
assert 'elenaEastPatioWalls' in blueprint and 'elenaEastPergola' in blueprint
assert 'elena_east_patios.json' in (ROOT/'scripts/assign_photo_map.py').read_text()
assert 'elena-east-patios' in (ROOT/'scripts/test_layout_browser.cjs').read_text()
task=next(t for t in json.loads((ROOT/'data/build_queue.json').read_text())['tasks'] if t['id']=='elena-east-patios')
assert task['status']=='done'
print('Elena east patios: evidence, garden-wall continuation, closed Cervantes frontage, lane clearances, registry, pergola and shared map/collision PASS')
