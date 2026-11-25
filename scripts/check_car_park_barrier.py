"""Car-park security barrier (src/car-park-barrier.ts, data/picasso_car_park.json barriers): one shared asset built
from IMG_3131, placed closed at the main car park's north entrance, with collision for its fixed posts, a map drawing,
a confidence grade that is not photographed or measured, and a photo check."""
import json, math, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
asset = (ROOT / 'src/car-park-barrier.ts').read_text()
module = (ROOT / 'src/picasso-car-park.ts').read_text()
blueprint = (ROOT / 'src/blueprint.ts').read_text()
data = json.loads((ROOT / 'data/picasso_car_park.json').read_text())
photos = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}

assert 'IMG_3131' in asset[:asset.index('export const BOOM_HEIGHT')], 'asset must cite the photo it is modelled on'
for part in ('-boom`', '-boom-edges`', '-rest-post`', '-photocell`', '-cabinet`', '-red`', '-white`'):
    assert part in asset, f'barrier part missing: {part}'
assert 'kit ??= materials()' in asset, 'materials must be built once and shared'
boom = float(re.search(r'BOOM_HEIGHT = ([\d.]+)', asset).group(1))
assert 0.85 <= boom <= 1.15, 'the photographed boom rests at about 1 m'
assert 'carParkBarrier(' in module and 'barrierBollard(' in module, 'src/picasso-car-park.ts must place the asset'
assert 'picassoCarParkPlan().barriers' in blueprint, 'the map must draw the barrier'

barriers = data['barriers']
assert {b['id'] for b in barriers} == {'picasso-car-park-north-barrier', 'picasso-car-park-exit-barrier'}, 'entry and exit barriers'
for b in barriers:
    assert b['evidence'] and all(e in photos for e in b['evidence']), f"{b['id']}: evidence must be indexed photos"
    span = math.dist(b['pivot'], b['restPost'])
    assert abs(span - b['armLength']) < 0.05, f"{b['id']}: pivot and rest post are {span:.2f} m apart, armLength {b['armLength']}"
    assert 2.5 <= span <= 6.5, f"{b['id']}: boom of {span:.2f} m is not a single-lane barrier"
    assert b['bollard'] is None or 0.3 <= math.dist(b['bollard'], b['restPost']) <= 2.0, f"{b['id']}: the bollard stands just beside the rest post"
    assert b['cabinetSide'] in ('north', 'south')
    assert 'Estimated' in b['trust'] and 'Imagery © Google' in b['trust'], 'trust must say it is estimated and credit the Google imagery'

confidence = json.loads((ROOT / 'data/confidence.json').read_text())
for b in barriers:
    assert confidence['features']['picasso_car_park.json:' + b['id']]['level'] in ('estimated', 'inferred'), 'no camera is solved: never photographed or measured'
feature = 'picasso_car_park.json:' + barriers[0]['id']
checks = [c for c in json.loads((ROOT / 'data/photo_checks.json').read_text())['checks'] if c['feature'] == feature]
assert any(c['photo'] == 'IMG_3131.jpg' and (ROOT / c['render']).exists() for c in checks), 'IMG_3131 photo check with a committed render'
print(f'Car-park barriers: shared asset, entry and exit placed ({", ".join(str(b["armLength"]) for b in barriers)} m booms), collision, map, confidence and photo check PASS')
