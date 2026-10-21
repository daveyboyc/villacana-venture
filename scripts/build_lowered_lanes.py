#!/usr/bin/env python3
"""Derive the lowered Calle Guillermo, the falling corner garden and the moved east steps from data/guillermo_slope.json.

Run once (needs shapely: pip install shapely); the outputs are committed and the
game and checks read them without shapely. It refuses to run twice, because it
edits outlines in place:

  data/street_layout.json  guillermo gets a vertex where the slope starts, one on the paseo, and per-vertex heights
  data/main_pool.json      levels.lowerArea, surfaceRing, terraceRing, steps and a new sheetCut

lowerArea gains the lawn strip between Guillermo and the old wall line and the kiosk at the
lane's foot, and loses the lane corridors, so no street centre line is lowered by the deck.
sheetCut is lowerArea plus the corridors: the hole in the street-level ground sheet.
"""
import json
import math
import re
from pathlib import Path

from shapely.geometry import LineString, Polygon
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
ANGLE = math.radians(26)
STREET = 0.27  # a road's surface height at street level


def turned(p):
    return (p[0] * math.cos(ANGLE) - p[1] * math.sin(ANGLE), p[0] * math.sin(ANGLE) + p[1] * math.cos(ANGLE))


def unturned(p):
    return (p[0] * math.cos(ANGLE) + p[1] * math.sin(ANGLE), -p[0] * math.sin(ANGLE) + p[1] * math.cos(ANGLE))


def ring(polygon):
    assert polygon.geom_type == 'Polygon' and not polygon.interiors, polygon.geom_type
    points = list(polygon.exterior.coords)[:-1]
    return [[round(x, 3), round(z, 3)] for x, z in points]


def replace_array(text, key, value):
    """Swap one top-level-in-levels JSON array or object for value, keeping the file's layout elsewhere."""
    start = text.index(f'"{key}": ') + len(f'"{key}": ')
    opening = text[start]
    closing = {'[': ']', '{': '}'}[opening]
    depth = 0
    for i in range(start, len(text)):
        depth += text[i] == opening
        depth -= text[i] == closing
        if depth == 0:
            return text[:start] + value + text[i + 1:]
    raise ValueError(key)


def points_json(points, indent='      '):
    return '[\n' + ',\n'.join(f'{indent}[{x}, {z}]' for x, z in points) + '\n' + indent[:-2] + ']'


def main():
    spec = json.loads((ROOT / 'data/guillermo_slope.json').read_text())
    pool_text = (ROOT / 'data/main_pool.json').read_text()
    if '"sheetCut"' in pool_text:
        raise SystemExit('Already applied: data/main_pool.json has a sheetCut')
    levels = json.loads(pool_text)['levels']
    street_text = (ROOT / 'data/street_layout.json').read_text()
    streets = json.loads(street_text)
    roads = {r['id']: r for r in streets['streets']}
    guillermo, jorge = roads[spec['guillermo']['road']], roads[spec['jorge']['road']]
    half, foot = spec['corridorHalfWidth'], spec['guillermo']['foot']

    # Guillermo: a vertex where the slope starts, then an even fall to the foot.
    g = [turned(p) for p in guillermo['points']]
    start = tuple(spec['guillermo']['slopeStart'])
    assert LineString(g[:2]).distance(LineString([start, start]).centroid) < 0.05, 'slope start is off the lane'
    g = [g[0], start, *g[1:]]
    along = [0.0]
    for a, b in zip(g, g[1:]):
        along.append(along[-1] + math.dist(a, b))
    run = along[-1] - along[1]
    g_heights = [STREET] + [round(STREET + foot * (s - along[1]) / run, 3) for s in along[1:]]

    # Jorge meets Guillermo on the level (Dave, 2026-10-21): the slope starts just seaward of it.
    j = [turned(p) for p in jorge['points']]
    junction = LineString(g).project(LineString([j[-1], j[-1]]).centroid)
    assert junction <= along[1] + 0.01, 'the slope starts before the Jorge junction'

    # Carried on, level, through the gateway at its foot to the paseo's centre line, where the
    # seaside heights take over: no stretch where both the deck and the road's end lower the ground.
    paseo = [turned(p) for p in json.loads((ROOT / 'public/map/skeleton.json').read_text())['seafront']['paseo']['points']]
    onto = LineString(paseo).interpolate(LineString(paseo).project(LineString([g[-1], g[-1]]).centroid))
    beyond = (onto.x, onto.y)
    g, g_heights = [*g, beyond], [*g_heights, g_heights[-1]]
    corridor_g = LineString(g[1:]).buffer(half, cap_style=2, join_style=2)
    corridors = corridor_g
    # Negative distance: the right-hand side, which is east in these (x east, z south) metres.
    lawn_side = LineString(g[1:]).buffer(-spec['lawnReach'], single_sided=True, cap_style=2, join_style=2)
    assert lawn_side.centroid.x > LineString(g[1:]).centroid.x, 'lawn strip is on the wrong side of the lane'
    skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
    kiosk = Polygon([turned(p) for p in next(b for b in skeleton['buildings'] if b['id'] == spec['kiosk'])['ring']]).buffer(0.05, join_style=2)
    # The old street-level channel that carried the lane past the kiosk to the beach-gate path.
    corners = [[-71.335, 115.46], [-66.312, 125.211], [-68.472329, 125.821994], [-72.383, 118.231]]
    assert all(c in levels['lowerArea'] for c in corners), 'old channel corners not found'
    channel = Polygon(corners)

    # East steps: a narrow flight from the Picasso side between the 90 Miles lobe and the long east building.
    new_steps = STEPS
    steps_area = LineString(new_steps['points']).buffer(new_steps['width'] / 2, cap_style=2, join_style=2)

    # The lobe's facade returns to its registry line where the old flight was cut into it.
    terrace = levels['terraceRing']
    assert terrace[-4:] == [[-40.7, 61.595], [-40.7, 60.2], [-38.1, 60.2], [-38.1, 61.207]], terrace[-4:]
    terrace = terrace[:-4] + [[-40.3, 61.8]]
    terrace_poly = Polygon(terrace)

    lower = unary_union([Polygon(levels['lowerArea']), lawn_side, kiosk, channel, steps_area]).difference(corridors).difference(terrace_poly)
    lower = max(getattr(lower, 'geoms', [lower]), key=lambda p: p.area).buffer(0)
    # Slivers left where outlines nearly touch (the kiosk's curve) are not real islands of street level.
    assert all(hole.area < 0.05 for hole in lower.interiors), [hole.area for hole in lower.interiors]
    lower = Polygon(lower.exterior)
    sheet = unary_union([lower, corridors.difference(terrace_poly)])
    surface = lower.difference(steps_area)
    surface = max(getattr(surface, 'geoms', [surface]), key=lambda p: p.area)

    # The garden behind the east end of the paseo wall falls towards the sea, so the wall stays
    # low (Dave, 2026-10-21: it is not 3 m tall). Bounded by the wall face (carried on to the lane),
    # the house fronts, Calle Guillermo, and the point where the paseo is back to 1 m below street level.
    wall = [turned(p) for p in json.loads((ROOT / 'data/paseo_wall.json').read_text())['wall']['face']]
    fall = spec['gardenFall']
    face = [p for p in wall if p[0] >= fall['fromX'] - 3]
    ex, ez = face[-1][0] - face[-2][0], face[-1][1] - face[-2][1]
    face = face + [(face[-1][0] + ex * 3, face[-1][1] + ez * 3)]
    north = fall['northZ']
    box = Polygon([*face, (face[-1][0], north), (face[0][0], north)]).intersection(Polygon([(fall['fromX'], 0), (0, 0), (0, 200), (fall['fromX'], 200)]))
    houses = unary_union([Polygon([turned(p) for p in b['ring']]) for b in skeleton['buildings'] if b['floors'] > 0])
    garden = box.difference(houses).difference(corridors).difference(lower)
    seaward = LineString(face)
    garden = max(getattr(garden, 'geoms', [garden]), key=lambda p: p.intersection(seaward.buffer(0.3)).area)
    garden = Polygon(garden.exterior)
    # Inland edges (houses, the west cut and the north cut) are at street level; the wall, the lane and the lawn are not.
    lane_edges = unary_union([corridors.boundary, lower.boundary]).buffer(0.05)
    inland = [[[round(v, 3) for v in a], [round(v, 3) for v in b]] for a, b in zip(garden.exterior.coords, garden.exterior.coords[1:])
              if not (seaward.buffer(0.05).contains(LineString([a, b])) or lane_edges.contains(LineString([a, b])))]
    sheet = unary_union([sheet, garden])
    assert sheet.geom_type == 'Polygon', sheet.geom_type

    pool_text = replace_array(pool_text, 'lowerArea', points_json(ring(lower)))
    pool_text = replace_array(pool_text, 'terraceRing', points_json(terrace))
    pool_text = replace_array(pool_text, 'surfaceRing', points_json(ring(surface)))
    pool_text = replace_array(pool_text, 'steps', json.dumps(new_steps, ensure_ascii=False))
    garden_json = json.dumps({'wallHeight': fall['wallHeight'], 'face': [[round(x, 3), round(z, 3)] for x, z in face],
                              'ring': ring(garden), 'inland': inland})
    pool_text = pool_text.replace('    "lowerHoles": [],', '    "sheetCut": ' + points_json(ring(sheet)) + ',\n    "gardenFall": ' + garden_json + ',\n    "lowerHoles": [],', 1)
    (ROOT / 'data/main_pool.json').write_text(pool_text)
    # Write the road changes in raw (skeleton) metres.
    guillermo['points'] = [[round(v, 2) for v in unturned(p)] for p in g]
    guillermo['heights'] = g_heights
    guillermo['maxGrade'] = spec['guillermo']['maxGrade']
    (ROOT / 'data/street_layout.json').write_text(json.dumps(streets, indent=2, ensure_ascii=False) + '\n')

    print(f'Guillermo falls {-foot} m over {run:.1f} m ({-foot / run:.1%}) from just past Jorge; lowerArea {lower.area:.0f} m2, sheetCut {sheet.area:.0f} m2; '
          f'falling garden {garden.area:.0f} m2 with {len(inland)} street-level edges')


STEPS = {
    "points": [[-34.0, 57.6], [-36.9, 62.0]],
    "width": 1.1,
    "count": 18,
    "evidence": "Apple Maps 3D screenshots (Dave, 2026-10-21, apple-maps/12 and 13): a narrow flight comes down from an opening in the white wall along Calle Pintor Picasso, between the curved 90 Miles terrace and the long white building on the east side of the lawn, to the paving north-east of the toddler pool. The aerial shows the gap between the two (about 1.7 m at its foot). Line read off the aerial and the screenshots to about 1 m; width and step count approximate"
}

if __name__ == '__main__':
    main()
