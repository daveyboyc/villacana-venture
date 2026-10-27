#!/usr/bin/env python3
"""Which area of data/areas.json a point on the map belongs to.

Uses the same `match` rules as scripts/build_references.py: an area owns its streets (by their
mapped width), car parks and seafront shapes, and a circle around its pools. A point goes to
the nearest area within REACH metres, so a house beside a lane belongs to that lane's area;
ties go to the area listed first. A pool courtyard owns the ground within COURTYARD metres of its
water outright and competes by distance beyond that, out to its matching radius, so lanes that
run past a courtyard keep their own area. Further out a point belongs to none.
"""
import json
import math
from pathlib import Path

import assign_photo_map as assign
from build_references import area_matchers

ROOT = Path(__file__).resolve().parents[1]
REACH = 15.0
COURTYARD = 8.0
STEP = 4.0


def load_areas():
    spec = json.loads((ROOT / 'data/areas.json').read_text())
    return [a for a in spec['areas'] if a.get('match')]


def classifier(skeleton=None, areas=None):
    """A function (x, z) -> area id or None, in model metres (+x east, +z south)."""
    skeleton = skeleton or json.loads((ROOT / 'public/map/skeleton.json').read_text())
    areas = areas or load_areas()
    by_feature, near_points = area_matchers(areas, skeleton)
    shapes = {a['id']: [] for a in areas}
    for f in assign.features(skeleton):
        for area in by_feature.get(f['id'], []):
            shapes[area].append(f)
    circles = {a['id']: [(c, r) for c, r, owner in near_points if owner == a['id']] for a in areas}
    pools = {p['id']: p['ring'] for p in skeleton['pools']}
    waters = {a['id']: [pools[p] for p in a['match'].get('pools', [])] for a in areas}
    order = [a['id'] for a in areas]

    def distance(area, p):
        best = math.inf
        for f in shapes[area]:
            if 'ring' in f:
                d = 0.0 if assign.inside(p, f['ring']) else assign.nearest(p, f['ring'] + f['ring'][:1])[0]
            elif 'points' in f:
                d = max(0.0, assign.nearest(p, f['points'])[0] - f.get('width', 0) / 2)
            else:
                continue
            best = min(best, d)
        if any(math.dist(p, centre) <= radius for centre, radius in circles[area]):
            for ring in waters[area]:
                d = 0.0 if assign.inside(p, ring) else assign.nearest(p, ring + ring[:1])[0]
                best = min(best, max(0.0, d - COURTYARD))
            if not waters[area]:
                best = 0.0  # an extra point of the area (main-pool's 'points'), owned outright within its radius
        return best

    def area_of(x, z):
        d, area = min((distance(a, (x, z)), i, a) for i, a in enumerate(order))[::2]
        return area if d <= REACH else None
    return area_of


def grid(skeleton=None, areas=None):
    """The area of every STEP-metre cell over the resort, compactly: one character per cell."""
    skeleton = skeleton or json.loads((ROOT / 'public/map/skeleton.json').read_text())
    areas = areas or load_areas()
    area_of = classifier(skeleton, areas)
    xs = [p[0] for b in skeleton['buildings'] for p in b['ring']]
    zs = [p[1] for b in skeleton['buildings'] for p in b['ring']]
    x0, z0 = math.floor(min(xs) / STEP) * STEP - 20, math.floor(min(zs) / STEP) * STEP - 20
    nx, nz = int((max(xs) + 20 - x0) / STEP) + 1, int((max(zs) + 20 - z0) / STEP) + 1
    ids = [a['id'] for a in areas]
    code = lambda a: '.' if a is None else chr(ord('a') + ids.index(a))
    rows = [''.join(code(area_of(x0 + (i + 0.5) * STEP, z0 + (k + 0.5) * STEP)) for i in range(nx)) for k in range(nz)]
    return {'x0': x0, 'z0': z0, 'step': STEP, 'nx': nx, 'nz': nz, 'areas': ids, 'rows': rows,
            'about': "Area of each cell: a letter indexes 'areas' (a = first), '.' is between areas."}
