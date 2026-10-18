"""Validate the bounded observed roofs without inventing ground boundaries."""
import json
import math
from pathlib import Path
from check_map import inside

ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/north_west_canopies.json').read_text())
s=json.loads((ROOT/'public/map/skeleton.json').read_text())
tags=json.loads((ROOT/'data/reference_tags.json').read_text())
house=next(b for b in s['buildings'] if b['id']==d['building'])
def gap(p,ring):
    distances=[]
    for a,b in zip(ring,ring[1:]+ring[:1]):
        v=[b[i]-a[i] for i in (0,1)];length=sum(q*q for q in v)
        t=max(0,min(1,sum((p[i]-a[i])*v[i] for i in (0,1))/length))
        distances.append(math.dist(p,[a[i]+t*v[i] for i in (0,1)]))
    return min(distances)
assert house['floors']==2 and len(d['canopies'])==3
areas=[]
for c in d['canopies']:
    r=c['ring'];assert len(r)==4
    assert all(e in tags and e.startswith('ref:apple-maps/') for e in c['evidence']), 'Cite the actual oblique roof sources, not an occluded phone view'
    assert 'Estimated' in c['trust'] and 'Hidden ground' in c['trust']
    assert 4<c['eaveHeight']<c['backHeight']<house['floors']*s['floorHeight']
    assert 0<c['thickness']<.2
    assert all(gap(p,house['ring'])<.1 for p in r[:2]), 'Roof back must meet the unchanged registered facade'
    assert all(not inside(*p,house['ring']) for p in r[2:]), 'Project the canopy outward'
    for p in r:
        assert all(gap(p,pool['ring'])>8 and not inside(*p,pool['ring']) for pool in s['pools'])
        assert all(not inside(*p,b['ring']) for b in s['buildings'] if b['floors']>0 and b['id']!=house['id'])
    area=abs(sum(p[0]*q[1]-q[0]*p[1] for p,q in zip(r,r[1:]+r[:1])))/2
    assert 10<area<25;areas.append(area)
assert max(areas)-min(areas)>4, 'These are three individually traced projections, not repeated roofs'
graph=json.loads((ROOT/'refs/graph.json').read_text());known={n['id'] for n in graph['nodes']}
roof_edges=[e for e in graph['edges'] if e['from'].startswith('north_west_canopies.json:') or e['from']=='task:north-pool-west-frontage']
assert roof_edges and all(e['from'] in known and e['to'] in known for e in roof_edges), 'New roof references must resolve, including private sources'
print('North-west canopies: observed upper roof plans, facade attachment, pool/house clearance and source graph PASS')
