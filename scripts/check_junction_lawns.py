"""Check photo-supported junction trees and their complete visible footprints."""
import json
from pathlib import Path
from check_map import inside, edge_distance
from assign_photo_map import nearest

ROOT = Path(__file__).resolve().parents[1]
load = lambda name: json.loads((ROOT / name).read_text())
lawns = load('data/junction_lawns.json')
frontages = load('data/frontage_divisions.json')
skeleton = load('public/map/skeleton.json')
photos = {p['file'] for p in load('public/photos-ref/manifest.json')}
regions = {r['id']: r for r in frontages['regions']}
entrance = regions['cervantes-lawn-door-path']['ring']

assert len(lawns['trees']) == 3, 'Roof views show three distinct clipped lawn trees'
assert len({t['id'] for t in lawns['trees']}) == 3
for tree in lawns['trees']:
    p = tree['point']
    # Clipped trees (src/elena-junction-details.ts, 18 Nov 2026): the crown's footprint, or for a crown that overhangs
    # the lane kerb as photographed (canopyOverhangs, as in data/objects.json) only the 0.3 m trunk.
    assert tree['kind'] in ('dome', 'standard') and 0.5 <= tree['trunk'] <= 1.6 and 0.8 <= tree['crown'] <= 2.2, tree['id'] + ': clipped tree size'
    crown = tree['crown'] / 2
    radius = 0.3 if tree.get('canopyOverhangs') else crown
    region = regions[tree['region']]
    assert region['kind'] == 'lawn'
    assert inside(*p, region['ring']) and edge_distance(*p, region['ring']) >= radius, tree['id'] + ' leaves lawn'
    assert tree['evidence'] and all(photo in photos for photo in tree['evidence'])
    assert tree['trust'] and lawns['trust']
    assert not inside(*p, entrance) and edge_distance(*p, entrance) >= radius + .15, 'Tree obscures door approach'
    for road in skeleton['boundaryReference']['roads']:
        assert nearest(p, road['points'])[0] >= road['width'] / 2 + radius + .15, tree['id'] + ' obstructs ' + road['id']
    for house in skeleton['buildings']:
        if house['floors'] > 0:
            assert not inside(*p, house['ring']) and edge_distance(*p, house['ring']) >= radius, 'Tree intersects house'
    for pool in skeleton['pools']:
        assert not inside(*p, pool['ring']) and edge_distance(*p, pool['ring']) >= radius, 'Tree intersects pool'

# Map and scene consume the same retained lawn and kerb edges.
for region in (r for r in frontages['regions'] if r['id'].startswith('cervantes-elena-lawn-')):
    border = next(b for b in frontages['borders'] if b['id'] == region['id'] + '-curb')
    # The kerb is drawn where the photos show it: the whole ring, or a run of its consecutive corners
    # (along the lane and the cross path; the lawn meets a shrub strip at the west wall's foot, 17 Nov 2026).
    ring, kerb = region['ring'], border['points']
    runs = [(ring + ring)[i:i + len(kerb)] for i in range(len(ring))]
    assert kerb == ring + [ring[0]] or kerb in runs, 'Kerb diverges from lawn'
    assert {'IMG_2358.jpg', 'IMG_2367.jpg'} <= set(region['evidence'])
    assert 0 < border['height'] <= .2 and 0 < border['width'] <= .25

print('Junction lawns: three photo-linked trees fit lawns, clear lanes/door approach, house/pool footprints and shared white kerbs PASS')
