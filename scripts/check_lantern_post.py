"""Lantern post asset: one shared model, used wherever the resort's traditional lamp stands; no stand-in lamps left."""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
asset = (ROOT / 'src/lantern-post.ts').read_text()
photos = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
cited = set(re.findall(r'IMG_\d{4}', asset[:asset.index('export const LANTERN_HEIGHT')]))
assert cited >= {'IMG_2552', 'IMG_2336', 'IMG_2597', 'IMG_2503'} and all(c + '.jpg' in photos for c in cited), 'asset must cite the photos it is modelled on'
for part in ('"post"', '"frame"', '"roof"', '"lamp"', '"glass"'):
    assert part in asset, f'lantern part missing: {part}'
assert 'kit ??= build()' in asset, 'geometry and materials must be built once and shared'
height = float(re.search(r'LANTERN_HEIGHT = ([\d.]+)', asset).group(1)); radius = float(re.search(r'LANTERN_RADIUS = ([\d.]+)', asset).group(1))
assert 3.5 <= height <= 4.0 and 0.18 <= radius <= 0.3
users = {'src/jorge-lane.ts': 'jorge-lamp', 'src/eva-lane.ts': 'lamp.id', 'src/eva-walled-lawn.ts': '-lantern', 'src/dali-street.ts': 'street.lanterns.id', 'src/slice.ts': 'lamp_post'}
for path, marker in users.items():
    src = (ROOT / path).read_text()
    assert 'lanternPost(' in src and marker in src, f'{path} does not use the lantern post'
# The old stand-ins: a thin cylinder with a box, cone or four-sided cylinder head.
old = [r'function lampMesh', r'CylinderGeometry\(\.035,\s*\.05,\s*2\.8', r'CylinderGeometry\(0\.05, 0\.07, 2\.8', r'ConeGeometry\(head \* 0\.62']
for path in users:
    src = (ROOT / path).read_text()
    for pattern in old:
        assert not re.search(pattern, src), f'{path} still builds a stand-in lamp ({pattern})'
dali = json.loads((ROOT / 'data/dali_street.json').read_text())['lanterns']
assert dali['radius'] >= radius, 'Dali route guard radius is smaller than the lantern'
print(f'Lantern post: one shared asset ({height} m model, {radius} m footprint) used by Jorge, Eva lane, Eva lawn, Dali and the lamp_post prop; no stand-in lamps left PASS')
