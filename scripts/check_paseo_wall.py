"""Check the paseo retaining wall: photo evidence, the paseo and lanes clear, no house or pool crossed, openings kept, heights as photographed."""
import json
import math
from pathlib import Path
from check_map import inside

ROOT = Path(__file__).resolve().parents[1]
s = json.loads((ROOT / 'public/map/skeleton.json').read_text())
d = json.loads((ROOT / 'data/paseo_wall.json').read_text())
levels = json.loads((ROOT / 'data/main_pool.json').read_text())['levels']
gate = json.loads((ROOT / 'data/coastal_gate.json').read_text())
west = json.loads((ROOT / 'data/terrain.json').read_text())['west']
photos = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
angle = math.radians(s['viewRotation'])
paseo = s['seafront']['paseo']
PLAYER = 0.42


def turned(p):
    return p[0] * math.cos(angle) - p[1] * math.sin(angle), p[0] * math.sin(angle) + p[1] * math.cos(angle)


def distance(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    n = dx * dx + dz * dz
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / n)) if n else 0
    return math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t)


def to_line(p, points):
    return min(distance(p, a, b) for a, b in zip(points, points[1:]))


def to_paseo(p):
    """Signed distance from the paseo centre line (positive inland) and distance along it, as src/seaside.ts measures them."""
    best, signed, arc, run = math.inf, 0, 0, 0
    for a, b in zip(paseo['points'], paseo['points'][1:]):
        dx, dz = b[0] - a[0], b[1] - a[1]
        n = dx * dx + dz * dz
        t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / n))
        q = (a[0] + dx * t, a[1] + dz * t)
        dist = math.dist(p, q)
        if dist < best:
            side = -dz * (p[0] - a[0]) + dx * (p[1] - a[1])
            best, signed, arc = dist, (-dist if side >= 0 else dist), run + math.sqrt(n) * t
        run += math.sqrt(n)
    return signed, arc


def offset(points, dist):
    """The same sideways offset as src/paseo-wall.ts: inland for positive distances."""
    out = []
    for i, (x, z) in enumerate(points):
        a, b = points[max(0, i - 1)], points[min(len(points) - 1, i + 1)]
        n = math.dist(a, b) or 1
        out.append([x + (b[1] - a[1]) / n * dist, z - (b[0] - a[0]) / n * dist])
    return out


def sample(points, step=0.1):
    for a, b in zip(points, points[1:]):
        count = max(1, math.ceil(math.dist(a, b) / step))
        for i in range(count + 1):
            yield [a[j] + (b[j] - a[j]) * i / count for j in range(2)]


def paseo_height(tx):
    pts = levels['seafront']['profile']
    if tx <= pts[0][0]:
        return pts[0][1]
    for a, b in zip(pts, pts[1:]):
        if tx <= b[0]:
            return a[1] + (b[1] - a[1]) * (tx - a[0]) / (b[0] - a[0])
    return pts[-1][1]


def site_y(p):
    """siteY from src/terrain.ts, without local runs (none reach the seafront)."""
    tx, tz = turned(p)
    foot = west['foot']
    edge = foot[-1][0]
    if tz <= foot[0][1]:
        edge = foot[0][0]
    else:
        for a, b in zip(foot, foot[1:]):
            if tz <= b[1]:
                edge = a[0] + (b[0] - a[0]) * (tz - a[1]) / (b[1] - a[1])
                break
    seaward = 1 - max(0, min(1, (tz - west['fade'][0]) / (west['fade'][1] - west['fade'][0])))
    return west['rise'] * max(0, min(1, (edge - tx) / west['run'])) * seaward


def garden_y(p):
    """gardenFallY from src/pool-levels.ts: the garden behind the east end falls to wallHeight above the paseo."""
    fall, tp = levels['gardenFall'], turned(p)
    if not inside(*tp, fall['ring']):
        return 0
    to_face = to_line(tp, fall['face'])
    to_inland = min(distance(tp, a, b) for a, b in fall['inland'])
    return min(0, paseo_height(tp[0]) + fall['wallHeight']) * to_inland / ((to_inland + to_face) or 1)


wall, edge, surface = d['wall'], d['edge'], d['surface']
for f in (wall, edge, surface):
    assert f['evidence'] and all(p in photos for p in f['evidence']), f"{f.get('id', 'surface')} cites a photo that is not indexed"
assert 'IMG_2350.jpg' in wall['evidence'] and 'IMG_2349.jpg' in wall['evidence']
assert 'not a survey' in d['scope'].lower() and 'about 1-2 m' in wall['trust'], 'Trust must say the trace is approximate'
face = wall['face']
assert len(face) >= 2 and all(math.isfinite(v) for p in face for v in p)
assert 0.25 <= wall['thickness'] <= 0.6 and 0 < wall['coping'] <= 0.15
assert 0.8 <= wall['fence']['height'] <= 1.5, 'Fence height outside what IMG_2349/IMG_2350 show'

# The face runs west to east along the paseo, without doubling back.
arcs = [to_paseo(p)[1] for p in face]
assert all(a < b for a, b in zip(arcs, arcs[1:])), 'Wall face doubles back along the paseo'
back = offset(face, wall['thickness'])
body = list(sample(face)) + list(sample(back)) + list(sample([face[0], back[0]])) + list(sample([face[-1], back[-1]]))

# The whole 3 m paseo stays clear, and a player on it is not pushed off by the wall.
for p in body:
    inland, _ = to_paseo(p)
    assert inland >= paseo['width'] / 2 - 0.08, f'Wall stands on the paseo at {p}'
# Pavement meets the wall foot: no artificial sand strip along the traced run.
for p in sample(face):
    inland, _ = to_paseo(p)
    assert inland <= paseo['width'] / 2 + 0.08, f'Sand gap between wall and paseo at {p}'
# Lanes keep their full width; the coastal gate connector keeps room for the player.
for r in s['boundaryReference']['roads']:
    for p in body:
        assert to_line(p, r['points']) >= r['width'] / 2 + 0.1, f"Wall intrudes into {r['id']} at {p}"
for p in body:
    assert to_line(p, gate['route']['points']) >= gate['route']['width'] / 2 + PLAYER, 'Wall blocks the coastal gate connector'
    for w in gate['walls']:
        assert to_line(p, w['points']) > 0.5, 'Wall runs into the coastal gate walls'
# Houses and pools untouched.
for p in body:
    for b in s['buildings']:
        if b['floors'] > 0 and not b.get('passage'):
            assert not inside(*p, b['ring']), f"Wall crosses house {b['id']} at {p}"
    for pool in s['pools']:
        assert not inside(*p, pool['ring']), f"Wall crosses the {pool['id']} pool"


# Openings kept: the wall stops short of the coastal connector in the west, of Guillermo's end and of the lowered pool lawn in the east.
def lowered(p):
    tp = list(turned(p))
    return inside(*tp, levels['lowerArea']) and not any(inside(*tp, r) for r in levels['lowerHoles'])


assert not any(lowered(p) for p in body), 'Wall runs across the opening onto the lowered pool lawn'
guillermo = next(r for r in s['boundaryReference']['roads'] if r['id'] == 'guillermo')
assert min(math.dist(p, guillermo['points'][-1]) for p in body) >= guillermo['width'] / 2 + PLAYER, 'Wall closes the end of Calle Guillermo'
assert to_paseo(face[0])[1] > to_paseo(gate['route']['points'][-1])[1] + 4, 'Wall reaches the coastal gate connector'
assert {o['id'] for o in d['openings']} == {'dali-coastal-access', 'guillermo', 'main-pool-lawn'}

# Heights follow the levels: ground behind minus paseo in front. By the south lawn (IMG_2349, IMG_2350)
# that must be about 1 m, and lower towards the Dalí end (IMG_2352, IMG_2354). Towards the east end the
# garden behind falls with the paseo, so the wall stays about 1 m there too (Dave, 2026-10-21; IMG_2227).
heights = []
for p, q in zip(face, back):
    inland = site_y(q) + garden_y(q)
    assert abs(site_y(q)) < 0.05, f'Ground behind the wall is not at street level at {q}'
    heights.append(inland - paseo_height(turned(p)[0]))
assert all(0.3 <= h <= 1.3 for h in heights), f'Wall height outside 0.3-1.3 m: {min(heights):.2f}-{max(heights):.2f}'
east = [h for p, h in zip(face, heights) if turned(p)[0] > -100]
assert east and all(h <= levels['gardenFall']['wallHeight'] + 0.3 for h in east), 'Wall grows tall at its east end (issue #40)'
south = next(p for p in s['pools'] if p['id'] == 'south')
sx = [turned(p)[0] for p in south['ring']]
by_lawn = [h for p, h in zip(face, heights) if min(sx) - 5 <= turned(p)[0] <= max(sx) + 5]
assert by_lawn and all(0.8 <= h <= 1.3 for h in by_lawn), 'Wall by the south lawn is not about 1 m high'
assert heights[0] <= 0.7, 'Wall at the Dalí end should be low (IMG_2354)'

# Along the south lawn the sea wall is this wall: its seaward stretches must lie on the fence line.
fence = offset(face, wall['fence']['setback'])
shared = [(a, b) for a, b in zip(s['seaWall']['points'], s['seaWall']['points'][1:]) if to_line(a, fence) < 1.2 and to_line(b, fence) < 1.2]
assert len(shared) >= 8, 'Sea wall and paseo wall no longer follow the same line'
print(f"Paseo wall: {len(face)} points, {sum(math.dist(a, b) for a, b in zip(face, face[1:])):.0f} m, photo-linked; paseo, lanes and gate connector clear; houses and pools untouched; "
      f"openings kept; heights {min(heights):.1f}-{max(heights):.1f} m, about 1 m by the south lawn and at the east end PASS")
