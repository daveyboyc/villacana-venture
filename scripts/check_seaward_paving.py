"""Evidence and scope checks for local material masks (no geometry edits)."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'data/seaward_paving.json').read_text())
skeleton=json.loads((ROOT/'public/map/skeleton.json').read_text())
features=data['features']
assert len(features)==3
assert {p for f in features for p in f['evidence']}=={'IMG_2235.jpg','IMG_2237.jpg','IMG_2239.jpg','IMG_2185.jpg','IMG_2190.jpg'}
for f in features:
    assert f['kind'] in ('octagonal','patterned')
    for p in f['evidence']:assert (ROOT/'public/photos-ref'/p).exists()
    if 'building' in f:assert any(b['id']==f['building'] for b in skeleton['buildings'])
    else:
        road=next(r for r in skeleton['boundaryReference']['roads'] if r.get('id')==f['road'])
        assert road['surface']=='terracotta'
        assert f['width']<=2.4
        assert f['road']=='teodoro-rojo', 'Do not replace square paving across the whole area'
print('Seaward paving: 3 local material features, evidence and existing supports valid')
