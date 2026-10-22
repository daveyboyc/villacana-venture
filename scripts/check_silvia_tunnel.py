#!/usr/bin/env python3
"""Check the bounded photo study's access and stated uncertainty; no placement approval."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/silvia_tunnel.json').read_text());dims=d['dimensions']
assert dims['ceiling']>dims['archCrown']>dims['archSpring']>1.9
assert dims['width']>1.5 and dims['wall']>0
assert 'no world-map transform' in d['frame']
assert len({e['id'] for e in d['entrances']})==len(d['entrances'])
assert all(not e['paired'] for e in d['entrances']), 'Owner requires every entrance to be a single door'
assert .75<=d['doorLeafWidth']<1.0, 'Use normal single-door width rather than double-door proportions'
for side in (-1,1):
 entries=sorted((e for e in d['entrances'] if e['side']==side),key=lambda e:e['along'][0])
 last=0
 for e in entries:
  a,b=e['along'];assert 0<last+.01<a<b<dims['length']
  assert 0<e['depth']<1.5 and 2<=e['doorHeight']<dims['ceiling']
  if not e['paired']:assert 'owner' in e['basis'].lower() and 'estimate' in e['basis']
  last=b
for p in d['pots']:
 radius=max(p['radius']*1.09,p['radius']*1.4+.178)
 assert abs(p['at'][0])>=.84/2+radius+.15, f"Full foliage footprint intrudes into centre route: {p['id']}"
assert set(d['evidence'])=={'IMG_2190.jpg','IMG_2191.jpg'}
print('Silvia study: entrance separation/headroom, full foliage clearance and explicit estimated frame PASS (not world placement)')
