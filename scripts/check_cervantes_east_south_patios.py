"""Issue #89: bounded photo-supported south Cervantes wall, closed door and cane pergola."""
import json, math
from pathlib import Path
from check_map import inside
from check_elena_east_patios import distance, sample, ring_gap
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/cervantes_east_south_patios.json').read_text());s=json.loads((ROOT/'public/map/skeleton.json').read_text())
photos={p['file'] for p in json.loads((ROOT/'public/photos-ref/manifest.json').read_text())}
roads=s['boundaryReference']['roads'];cerv=next(r for r in roads if r['id']=='cervantes');house=next(b for b in s['buildings'] if b['id']=='6265601UF1366N_part1')
assert 'No internal patio partitions' in d['scope'] and 'Camera pins' in d['trust']
assert len(d['walls'])==1 and d['walls'][0]['solid']
wall=d['walls'][0];a,b=wall['points'];u=d['along'];n=d['inward']
def local(p):return [sum((p[j]-d['origin'][j])*v[j] for j in range(2)) for v in [u,n]]
def axis(p):return min(distance(p,a,b) for a,b in zip(cerv['points'],cerv['points'][1:]))
for f in [wall,d['door'],d['pergola'],*d['planting']]:
 assert f['evidence'] and set(f['evidence'])<=photos
 assert 'estimat' in f['trust'].lower(),f['id']
assert set(wall['evidence'])=={'IMG_2366.jpg','IMG_2360.jpg','IMG_2197.jpg'}
assert 12<math.dist(a,b)<22 and 1.6<wall['height']<2.1
for p in sample(wall['points']):
 assert 1.2<local(p)[1]<1.5,'south of Cervantes, near lane edge'
 for r in roads:assert min(distance(p,a,b) for a,b in zip(r['points'],r['points'][1:]))-wall['thickness']/2>=r['width']/2+.42,(r['id'],p)
 assert not any(inside(*p,b['ring']) for b in s['buildings'] if b['floors']>0)
 assert not any(inside(*p,pool['ring']) for pool in s['pools'])
 assert inside(*p,d['review']['ring'])
door=d['door'];assert distance(door['at'],a,b)<.001 and .8<=door['width']<=1.2
assert -.5<local(door['at'])[0]<2 and .1<=door['copingRise']<=.35,'door near Elena end, before pergola'
p=d['pergola'];assert 2.1<p['height']<2.7 and p['caneSpacing']<.1
for q in p['ring']:
 assert inside(*q,d['review']['ring']) and 1.6<local(q)[1]<5.3
 assert not any(inside(*q,b['ring']) for b in s['buildings'] if b['floors']>0)
 assert all(min(distance(q,a,b) for a,b in zip(r['points'],r['points'][1:]))-p['post']/2>r['width']/2+.42 for r in roads)
assert max(ring_gap(q,house['ring']) for q in p['ring'][2:])<.5,'pergola rear near unchanged registry front'
for q in d['planting']:
 assert inside(*q['at'],d['review']['ring'])
 assert axis(q['at'])>.6+.42+.5,'Details-only vegetation clear of the lane'
for r in roads:assert not any(inside(*q,d['review']['ring']) for q in sample(r['points'],.25))
sl=(ROOT/'src/slice.ts').read_text();bp=(ROOT/'src/blueprint.ts').read_text()
assert 'cervantesEastSouthRings()' in sl and 'addCervantesEastSouthPatios(scene,skeleton.boundaryReference)' in sl
assert sl.count('!inCervantesEastSouthPatios(')>=3 and bp.count('!inCervantesEastSouthPatios(')>=2
assert 'cervantesEastSouthWalls' in bp and 'cervantesEastSouthPostRings()' in bp
assert 'cervantes_east_south_patios.json' in (ROOT/'scripts/assign_photo_map.py').read_text()
assert 'cervantesEastSouthDoor' in (ROOT/'scripts/test_layout_browser.cjs').read_text()
print('Cervantes east south patios: bounded evidence, south frontage, closed door, registry-front pergola, route clearance and shared map/collision PASS')
