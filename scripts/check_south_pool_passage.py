"""Calle de Jorge 39–67: the passage axis opens both faces of its host and stays off the pool."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
passage = json.loads((ROOT / 'data/south_pool_passage.json').read_text())
approach = json.loads((ROOT / 'data/door_sills.json').read_text())['approach']
skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
photos = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
arch, outward = approach['arch'], approach['outward']
forward, right = [-outward[0], -outward[1]], [outward[1], -outward[0]]
def at(s, q):
    return (arch[0] + forward[0] * s + right[0] * q, arch[1] + forward[1] * s + right[1] * q)
def inside(x, z, ring):
    inn = False
    for i, (x1, z1) in enumerate(ring):
        x2, z2 = ring[(i + 1) % len(ring)]
        if (z1 > z) != (z2 > z) and x < (x2 - x1) * (z - z1) / (z2 - z1 or 1e-12) + x1:
            inn = not inn
    return inn
host = next(b for b in skeleton['buildings'] if b['id'] == passage['hostBuilding'])
L, H, over = passage['length'], passage['halfWidth'], passage['overrun']
assert passage['evidence'] and all(p in photos for p in passage['evidence'])
assert abs(forward[0] * right[0] + forward[1] * right[1]) < 1e-9
assert inside(*at(L / 2, 0), host['ring']) and inside(*at(2, 0), host['ring'])
assert not inside(*at(-0.3, 0), host['ring']), 'street overrun must leave the host'
assert not inside(*at(L + 0.4, 0), host['ring']), 'lawn overrun must leave the host'
pool = next(p for p in skeleton['pools'] if p['id'] == 'south')['ring']
for s in (i / 5 for i in range(int((-over) * 5), int((L + over) * 5))):
    for q in (-H, 0, H):
        assert not inside(*at(s, q), pool), f'passage meets the pool at s={s}'
        for b in skeleton['buildings']:
            if b['floors'] > 0 and b['id'] != host['id']:
                assert not inside(*at(s, q), b['ring']), f"passage enters {b['id']} at s={s}"
src = (ROOT / 'src/south-pool-passage.ts').read_text()
assert 'addSouthPoolPassage(scene)' in (ROOT / 'src/slice.ts').read_text()
assert 'southPoolGroundParts' in (ROOT / 'src/slice.ts').read_text()
assert 'inSouthPoolPassage' in (ROOT / 'src/facade-kit.ts').read_text()
assert 'data-passage-id' in (ROOT / 'src/blueprint.ts').read_text()
assert 'if (scene.userData.layoutOnly) return;' in src
print('Calle de Jorge 39-67 passage: axis opens both faces of', host['id'], f'over {L} m, clear of the pool PASS')
