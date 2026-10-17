"""Check the individually traced lower north-pool frontage; not the NW six-riser."""
import json
import math
from pathlib import Path
from check_map import inside
from check_raised_terraces import ring_gap, seg
ROOT = Path(__file__).resolve().parents[1]
s = json.loads((ROOT / 'public/map/skeleton.json').read_text())
d = json.loads((ROOT / 'data/raised_terraces.json').read_text())
t = next(t for t in d['terraces'] if t['id'] == 'north-pool-north-patios')
w = next(t for t in d['terraces'] if t['id'] == 'north-pool-west-terrace')
p = json.loads((ROOT / 'data/north_pool_gardens.json').read_text())
assert t['rise'] == .325 and len(t['openings']) == 3
assert w['rise'] == 1 and w['openings'][0]['stair']['risers'] == 6
assert all(o['stair']['risers'] == 2 and o['stair']['riserFinish'] == 'render' and o['stair']['nosing'] and o['stair']['handrail'] == 'none' for o in t['openings'])
assert [o['edge'] for o in t['openings']] == [0, 1, 2], 'each irregular plinth stretch has its own opening'
assert all(e['kind'] == 'end' and 'Unseen' in e['note'] for e in t['edges'][3:]), 'do not assert hidden garden boundaries'
assert min(q[0] for q in t['outline']) > max(q[0] for q in w['outline']), 'central alley must separate the low band from NW terrace'
assert 'continuous' in t['trust'] and 'hidden' in t['trust'] and 'Calle Isabel' in t['trust']
photos = {x['file'] for x in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
assert all(f in photos for f in p['evidence']) and len(p['trust']) > 120
for q in p['ring']:
    assert all(not inside(*q, pool['ring']) and ring_gap(q, pool['ring']) > 2 for pool in s['pools']), 'paving must preserve pool and lawn/deck ring'
    assert not any(b['floors'] > 0 and inside(*q, b['ring']) and ring_gap(q, b['ring']) > .15 for b in s['buildings']), 'path cannot enter a registry house'
source = (ROOT / 'src/north-pool-gardens.ts').read_text()
assert 'siteY(x, z) + .073' in source and 'noDrape = true' in source, 'path stays at lawn ground level'
assert 'addNorthPoolGardenPath(scene)' in (ROOT / 'src/slice.ts').read_text()
assert 'northPoolGardenPathBlueprint()' in (ROOT / 'src/blueprint.ts').read_text()
assert 's.riserFinish === "render" ? white' in (ROOT / 'src/raised-terraces.ts').read_text()
print('North pool gardens: three white-nosed low openings, NW/alley/Isabel separate, ground-level photo-traced paving PASS')
