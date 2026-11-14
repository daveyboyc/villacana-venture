#!/usr/bin/env python3
"""Check the ground plan (docs/SMOOTH_PATHS.md): every data/ground_plan_<area>.json.

Surfaces: known kind and finish, evidence that exists, sane paths (width, no hairpins) and simple
outlines, nothing in pool water or inside a standing house, and no two finishes overlapping unless one
declares it lies `above` the other. Edges: known kind, a height in the kind's range, valid sides or
vertex ranges, openings that fit, evidence and a note, and solid edges (planter walls, walls, hedges,
fences) clear of the mapped lanes. Every surface has a confidence entry (docs/CONFIDENCE.md).
The kinds and finishes are read from src/ground-plan.ts so the two cannot drift apart."""
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / 'src/ground-plan.ts').read_text()
block = lambda name: re.search(name + r' = \{(.*?)\n\} as const', source, re.S).group(1)
FINISHES = set(re.findall(r'^\s*"([a-z-]+)":', block('FINISHES'), re.M))
EDGES = set(re.findall(r'^\s*"([a-z-]+)":', block('EDGES'), re.M))
HEIGHTS = {'none': (0, 0), 'kerb': (0.03, 0.3), 'brick-border': (0, 0.12), 'planter-wall': (0.2, 1.0), 'wall': (0.5, 3.0), 'hedge': (0.3, 2.5), 'fence': (0.6, 2.5)}
DEFAULT_HEIGHT = {k: float(v) for k, v in re.findall(r'^\s*"([a-z-]+)": \{ height: ([0-9.]+)', block('EDGES'), re.M)}
SOLID = set(re.findall(r'^\s*"([a-z-]+)": \{[^}]*solid: true', block('EDGES'), re.M))
assert EDGES == set(HEIGHTS), f'edge kinds in src/ground-plan.ts and this check differ: {EDGES ^ set(HEIGHTS)}'

areas = {a['id'] for a in json.loads((ROOT / 'data/areas.json').read_text())['areas']}
manifest = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
tags = json.loads((ROOT / 'data/reference_tags.json').read_text())
confidence = json.loads((ROOT / 'data/confidence.json').read_text())['features']
skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
houses = [b['ring'] for b in skeleton['buildings'] if b.get('floors', 0) > 0 and not b.get('passage') and not b.get('notStanding')]
pools = [p['ring'] for p in skeleton['pools']]
roads = [(r['points'], r.get('width', 1.2)) for r in skeleton['boundaryReference']['roads']]


def inside(p, ring):
    x, z = p
    hit = False
    for a, b in zip(ring, ring[1:] + ring[:1]):
        if (a[1] > z) != (b[1] > z) and x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1] + 1e-12) + a[0]:
            hit = not hit
    return hit


def to_segment(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    den = dx * dx + dz * dz
    t = 0 if not den else max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / den))
    return math.dist(p, (a[0] + dx * t, a[1] + dz * t))


def to_line(p, pts):
    return min(to_segment(p, a, b) for a, b in zip(pts, pts[1:]))


def along(pts, step=0.25):
    for a, b in zip(pts, pts[1:]):
        n = max(1, math.ceil(math.dist(a, b) / step))
        for i in range(n):
            yield (a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n)
    yield tuple(pts[-1])


def offset(pts, d):
    out = []
    for i, p in enumerate(pts):
        a, b = pts[max(0, i - 1)], pts[min(len(pts) - 1, i + 1)]
        n = math.dist(a, b) or 1
        out.append((p[0] + (b[1] - a[1]) / n * d, p[1] - (b[0] - a[0]) / n * d))
    return out


def crosses(a, b, c, d):
    o = lambda p, q, r: (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
    return o(a, b, c) * o(a, b, d) < 0 and o(c, d, a) * o(c, d, b) < 0


def covers(f):
    """A point test for a surface: within half the width of a path's line, or inside an outline."""
    if f['kind'] == 'path':
        return lambda p: any(to_line(p, line) < f['width'] / 2 for line in f['lines'])
    return lambda p: inside(p, f['outline'])


def bounds(f):
    pts = [p for line in f['lines'] for p in line] if f['kind'] == 'path' else f['outline']
    pad = f.get('width', 0) / 2
    return min(p[0] for p in pts) - pad, min(p[1] for p in pts) - pad, max(p[0] for p in pts) + pad, max(p[1] for p in pts) + pad


files = sorted((ROOT / 'data').glob('ground_plan_*.json'))
assert files, 'no ground plan files'
assert re.search(r'from "\.\./data/ground_plan_', source), 'src/ground-plan.ts imports no ground plan file'
counts = {'surfaces': 0, 'edges': 0, 'solid': 0}
for path in files:
    plan = json.loads(path.read_text())
    area = plan['area']
    assert area in areas, f'{path.name}: unknown area {area}'
    assert path.name == f'ground_plan_{area.replace("-", "_")}.json', f'{path.name}: name it after its area'
    assert f'../data/{path.name}' in source, f'{path.name} is not imported by src/ground-plan.ts'
    assert plan.get('about') and plan.get('trust'), f'{path.name}: about and trust'
    ids = [f['id'] for f in plan['surfaces']]
    assert len(ids) == len(set(ids)), f'{path.name}: duplicate surface ids'
    for f in plan['surfaces']:
        name = f'{path.name}:{f["id"]}'
        counts['surfaces'] += 1
        assert f['kind'] in ('path', 'patio', 'apron', 'green'), f'{name}: kind'
        assert f['finish'] in FINISHES, f'{name}: unknown finish {f["finish"]}'
        assert f.get('name') and (f.get('note') or plan['trust']), f'{name}: name and note'
        # Photos in `evidence`; a surface traced from the georeferenced aerial says so with traced: map:ground.
        assert f['evidence'] or f.get('traced') == 'map:ground', f'{name}: no evidence'
        assert f.get('traced') in (None, 'map:ground'), f'{name}: traced must be map:ground'
        for e in f['evidence']:
            assert e in manifest or e in tags or e.startswith('ref:'), f'{name}: evidence {e} is not a known source'
        assert name in confidence, f'{name}: no confidence entry in data/confidence.json'
        if f['kind'] == 'path':
            assert 0.6 <= f['width'] <= 6, f'{name}: width'
            for k, line in enumerate(f['lines']):
                assert len(line) >= 2, f'{name}: line {k} too short'
                assert all(math.dist(a, b) > 0.05 for a, b in zip(line, line[1:])), f'{name}: repeated point in line {k}'
                for a, b, c in zip(line, line[1:], line[2:]):
                    u, v = (b[0] - a[0], b[1] - a[1]), (c[0] - b[0], c[1] - b[1])
                    turn = math.degrees(math.acos(max(-1, min(1, (u[0] * v[0] + u[1] * v[1]) / (math.hypot(*u) * math.hypot(*v))))))
                    assert turn <= 120, f'{name}: line {k} doubles back by {turn:.0f} degrees at {b}'
            if 'ends' in f:
                assert len(f['ends']) == len(f['lines']) and all(e in ('square', 'round') for pair in f['ends'] for e in pair), f'{name}: ends'
            samples = [p for line in f['lines'] for p in along(line)]
        else:
            ring = f['outline']
            assert len(ring) >= 3, f'{name}: outline too short'
            area_m2 = abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:] + ring[:1]))) / 2
            assert area_m2 >= 0.5, f'{name}: outline area {area_m2:.2f} m2'
            edges = list(zip(ring, ring[1:] + ring[:1]))
            for i, (a, b) in enumerate(edges):
                for j, (c, d) in enumerate(edges):
                    if abs(i - j) > 1 and {i, j} != {0, len(edges) - 1}:
                        assert not crosses(a, b, c, d), f'{name}: outline crosses itself'
            assert 0 <= f.get('corners', 0.3) <= 3 and all(0 <= h < len(ring) for h in f.get('hard', [])), f'{name}: corners'
            samples = [p for p in along(ring + ring[:1])]
        for p in samples:
            assert not any(inside(p, r) for r in pools), f'{name}: in pool water at {p}'
            assert not any(inside(p, r) for r in houses), f'{name}: inside a standing house at {p}'
        for e in f.get('edges', []):
            counts['edges'] += 1
            assert e['kind'] in EDGES, f'{name}: edge kind {e["kind"]}'
            if e['kind'] == 'none':
                continue
            lo, hi = HEIGHTS[e['kind']]
            h = e.get('height', DEFAULT_HEIGHT[e['kind']])
            assert lo <= h <= hi, f'{name}: {e["kind"]} height {h} outside {lo}-{hi} m'
            assert e.get('evidence') and e.get('note'), f'{name}: {e["kind"]} edge needs evidence and a note'
            if f['kind'] == 'path':
                assert e.get('side', 'left') in ('left', 'right', 'both'), f'{name}: edge side'
                off = f['width'] / 2 + 0.1
                def trim(line, lo, hi):
                    pts, run = [], 0
                    for k, q in enumerate(along(line, 0.1)):
                        pts.append((q, run)); run += 0.1
                    return [q for q, d in pts if lo <= d <= hi]
                span = e.get('span', [0, math.inf])
                assert len(span) == 2 and 0 <= span[0] < span[1], f'{name}: edge span'
                lines = [offset(t, s * off) for l in f['lines'] for t in [trim(l, *span)] if len(t) > 1 for s in ({'left': [1], 'right': [-1], 'both': [1, -1]}[e.get('side', 'left')])]
            else:
                n = len(f['outline'])
                fr, to = e.get('from', 0), e.get('to', n)
                assert 0 <= fr < n and 0 <= to <= n, f'{name}: edge vertex range'
                lines = [[f['outline'][k % n] for k in range(fr, (to if to >= fr else to + n) + 1)]]
            length = max(sum(math.dist(a, b) for a, b in zip(l, l[1:])) for l in lines)
            for o in e.get('openings', []):
                assert 0 <= o['at'] <= length and 0.6 <= o['width'] <= 6, f'{name}: opening {o}'
            if e['kind'] in SOLID:
                counts['solid'] += 1
                for line in lines:
                    for p in along(line):
                        for pts, width in roads:
                            assert to_line(p, pts) >= width / 2 + 0.3, f'{name}: {e["kind"]} runs onto a mapped lane at {p}'
                        assert not any(inside(p, r) for r in pools), f'{name}: {e["kind"]} in pool water at {p}'
    # Finishes do not overlap unless one says it lies above the other.
    surfaces = plan['surfaces']
    for i, f in enumerate(surfaces):
        for g in surfaces[i + 1:]:
            if f['finish'] == g['finish'] or g['id'] in f.get('above', []) or f['id'] in g.get('above', []):
                continue
            (ax0, az0, ax1, az1), (bx0, bz0, bx1, bz1) = bounds(f), bounds(g)
            x0, z0, x1, z1 = max(ax0, bx0), max(az0, bz0), min(ax1, bx1), min(az1, bz1)
            if x0 >= x1 or z0 >= z1:
                continue
            cf, cg, hits = covers(f), covers(g), 0
            for k in range(int((x1 - x0) / 0.25) + 1):
                for m in range(int((z1 - z0) / 0.25) + 1):
                    p = (x0 + k * 0.25, z0 + m * 0.25)
                    hits += cf(p) and cg(p)
            assert hits * 0.0625 < 0.3, f'{path.name}: {f["id"]} and {g["id"]} overlap by about {hits * 0.0625:.1f} m2 (mark one `above` the other)'
print(f"Ground plan: {len(files)} area file(s), {counts['surfaces']} surfaces, {counts['edges']} edges ({counts['solid']} solid), "
      "known finishes and edge kinds, evidence and confidence, no pool water, houses or lane crossings, no unmarked overlaps PASS")
