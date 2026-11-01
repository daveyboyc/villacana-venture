#!/usr/bin/env python3
"""Turn a pixel in a photo with a solved camera into a map position, with its uncertainty.

  python3 scripts/pixel_to_map.py IMG_2204 1290 815                 ray to the model ground (src/terrain.ts siteY)
  python3 scripts/pixel_to_map.py IMG_2204 1290 815 --height 0.82   ray to a stated height (metres, scene datum)
  python3 scripts/pixel_to_map.py IMG_2204 1290 815 --ground model  ray to the exported scene ground
                                                                    (layout-checks.local/model.json, shoot_views.cjs --pose)
  python3 scripts/pixel_to_map.py --discrepancies [--write]         every data/discrepancies.json position from its
                                                                    contact pixels; --write stores them, --check fails if stale

The camera is the photo's solved pose in data/photo_poses.json, with the renderer's convention
(src/photo-camera.ts apply): position (x, y, z) in scene metres, +x east, +z south, y up; three.js
Euler order YXZ with rotation (pitch, -yaw, roll); focal length f in pixels of the photo, the image
centre as principal point. The ray through pixel (u, v) is walked out until it meets the ground or
the stated height, then refined by bisection.

Uncertainty: the solve stores a one-sigma `sigma` for x, y, z, f, yaw, pitch and roll. The pixel is
re-cast through 400 cameras drawn from those (independently; fixed seed, so the result is
repeatable), with a pick error of 3 px (--pick-sigma) and, for a stated height, its own sigma
(--height-sigma). The reported uncertainty is the rms horizontal distance of those hits from the
nominal one, in metres. Drawing the parameters independently ignores how the solve ties them
together (height against pitch, for instance), so near the solve's own control points it overstates
the error; it is a conservative figure. A pixel on the sky or beyond 300 m gives no position.
Several photos of one thing give an inverse-variance mean. Photos from one station share its
position and lens errors, so the combined uncertainty is the best single photo's, or half the
largest disagreement between the cameras when that is larger.

Only a pixel where the thing meets the ground (or a known height) gives its map position: a tree's
trunk foot, a parasol's base, a box's bottom edge. A pixel on a crown or a roof casts past the thing.
"""
import argparse
import json
import math
import sys
from pathlib import Path

# Pure Python, so scripts/build_references.py (run by npm run build) can check positions without numpy;
# only the Monte Carlo of --write needs numpy.

ROOT = Path(__file__).resolve().parents[1]
POSES = ROOT / 'data/photo_poses.json'
TERRAIN = ROOT / 'data/terrain.json'
MODEL = ROOT / 'layout-checks.local/model.json'
DISCREPANCIES = ROOT / 'data/discrepancies.json'
PICK_SIGMA = 3.0
SAMPLES = 400
SEED = 20261101
MAX_RANGE = 300.0
# Positions in data/discrepancies.json are stored to the centimetre; --check allows this much drift.
STALE_M = 0.05


class SiteGround:
    """src/terrain.ts siteY: the surveyed 2 m grid as two triangles per cell, photographed flights, seaward fade."""

    COS, SIN = math.cos(math.radians(26)), math.sin(math.radians(26))
    RAMP_BLEND = 3.0

    def __init__(self, data=None):
        g = data or json.loads(TERRAIN.read_text())
        self.x0, self.z0, self.step, self.nx, self.nz = g['x0'], g['z0'], g['step'], g['nx'], g['nz']
        self.cm = g['cm']
        self.fade = g['fade']
        self.ramps = []
        for r in g['ramps']:
            dx, dz = r['toward'][0] - r['foot'][0], r['toward'][1] - r['foot'][1]
            length = math.hypot(dx, dz)
            self.ramps.append({**r, 'up': (dx / length, dz / length)})

    def surveyed(self, x, z):
        u = min(max((x - self.x0) / self.step, 0), self.nx - 1.001)
        v = min(max((z - self.z0) / self.step, 0), self.nz - 1.001)
        i, j = int(math.floor(u)), int(math.floor(v))
        fu, fv = u - i, v - j
        row, nxt = self.cm[j], self.cm[j + 1]
        if fu >= fv:
            y = row[i] + fu * (row[i + 1] - row[i]) + fv * (nxt[i + 1] - row[i + 1])
        else:
            y = row[i] + fv * (nxt[i] - row[i]) + fu * (nxt[i + 1] - nxt[i])
        return y / 100

    def __call__(self, x, z):
        clamp = lambda v, a, b: min(max(v, a), b)
        tz = x * self.SIN + z * self.COS
        seaward = 1 - clamp((tz - self.fade[0]) / (self.fade[1] - self.fade[0]), 0, 1)
        if not seaward:
            return 0.0
        y = self.surveyed(x, z)
        for r in self.ramps:
            dx, dz = x - r['foot'][0], z - r['foot'][1]
            along = dx * r['up'][0] + dz * r['up'][1]
            across = abs(dz * r['up'][0] - dx * r['up'][1])
            below = max(-1 - along, 0) / r['behind']
            beyond = max(along - (r['run'] + 1.5), 0) / self.RAMP_BLEND
            aside = max(across - r['halfWidth'], 0) / self.RAMP_BLEND
            weight = (1 - clamp(max(below, beyond), 0, 1)) * (1 - clamp(aside, 0, 1))
            if weight > 0:
                y += (r['base'] + r['rise'] * clamp((along - r['start']) / (r['run'] - r['start']), 0, 1) - y) * weight
        return y * seaward


class GridGround:
    """A ground grid {x0, z0, step, nx, nz, heights} (the scene export's walkable ground), bilinear."""

    def __init__(self, grid):
        self.x0, self.z0, self.step, self.nx, self.nz = grid['x0'], grid['z0'], grid['step'], grid['nx'], grid['nz']
        heights = grid['heights']
        self.h = [heights[k * self.nx:(k + 1) * self.nx] for k in range(self.nz)]

    def __call__(self, x, z):
        u = min(max((x - self.x0) / self.step, 0), self.nx - 1.001)
        v = min(max((z - self.z0) / self.step, 0), self.nz - 1.001)
        i, j = int(u), int(v)
        fu, fv = u - i, v - j
        h = self.h
        return float((h[j][i] * (1 - fu) + h[j][i + 1] * fu) * (1 - fv) + (h[j + 1][i] * (1 - fu) + h[j + 1][i + 1] * fu) * fv)


def flat(height):
    return lambda x, z: height


def ground(kind='site', height=None):
    """The surface a ray stops on: a stated height, the exported scene ground, or siteY (default)."""
    if height is not None:
        return flat(float(height))
    if kind == 'model':
        if not MODEL.exists():
            raise SystemExit(f'{MODEL.relative_to(ROOT)} is missing: run node scripts/shoot_views.cjs <photo> --pose first')
        return GridGround(json.loads(MODEL.read_text())['ground'])
    return SiteGround()


class Vec(tuple):
    """A 3-vector with the little arithmetic the ray walk needs."""

    def __add__(self, o):
        return Vec(a + b for a, b in zip(self, o))

    def __mul__(self, k):
        return Vec(a * k for a in self)


def rotation(yaw, pitch, roll):
    """World-from-camera rotation rows, three.js Euler order YXZ with (pitch, -yaw, roll), as photo_pose.rotation."""
    a, b, c = math.radians(-yaw), math.radians(pitch), math.radians(roll)
    ry = [[math.cos(a), 0, math.sin(a)], [0, 1, 0], [-math.sin(a), 0, math.cos(a)]]
    rx = [[1, 0, 0], [0, math.cos(b), -math.sin(b)], [0, math.sin(b), math.cos(b)]]
    rz = [[math.cos(c), -math.sin(c), 0], [math.sin(c), math.cos(c), 0], [0, 0, 1]]
    mul = lambda m, n: [[sum(m[i][k] * n[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
    return mul(mul(ry, rx), rz)


def ray(pose, size, u, v):
    """Eye and unit direction (world) of the ray through pixel (u, v); the inverse of photo_pose.project."""
    r = rotation(pose['yaw'], pose['pitch'], pose['roll'])
    c = ((u - size[0] / 2) / pose['f'], -(v - size[1] / 2) / pose['f'], -1.0)
    d = [sum(r[i][k] * c[k] for k in range(3)) for i in range(3)]
    n = math.sqrt(sum(x * x for x in d))
    return Vec((pose['x'], pose['y'], pose['z'])), Vec(x / n for x in d)


def intersect(eye, d, surface, step=0.25, limit=MAX_RANGE):
    """First point where the ray meets the surface (y <= surface(x, z)), or None."""
    above = lambda t: eye[1] + d[1] * t - surface(eye[0] + d[0] * t, eye[2] + d[2] * t)
    if above(0.0) <= 0:
        return None
    a, t = 0.0, step
    while t <= limit:
        if above(t) <= 0:
            for _ in range(40):
                m = (a + t) / 2
                if above(m) > 0:
                    a = m
                else:
                    t = m
            return eye + d * t
        a, t = t, t + step * (1 + t / 20)
    return None


def cast(pose, size, u, v, surface):
    eye, d = ray(pose, size, u, v)
    hit = intersect(eye, d, surface)
    return None if hit is None else hit


def to_pixel(pose, size, point):
    """Pixel of a scene point through the camera (photo_pose.project), or None behind the camera."""
    r = rotation(pose['yaw'], pose['pitch'], pose['roll'])
    rel = [point[i] - pose[k] for i, k in enumerate('xyz')]
    c = [sum(rel[k] * r[k][j] for k in range(3)) for j in range(3)]  # camera space: rel @ r
    if not -c[2] > 0:
        return None
    return (size[0] / 2 + pose['f'] * c[0] / -c[2], size[1] / 2 - pose['f'] * c[1] / -c[2])


def locate(record, u, v, surface, pick_sigma=PICK_SIGMA, height=None, height_sigma=0.0, samples=SAMPLES, seed=SEED):
    """Map position of pixel (u, v) in a pose record with its rms uncertainty from the solve's sigma."""
    solved = record['solved']
    pose, size, sigma = solved['pose'], record['image'], solved.get('sigma', {})
    hit = cast(pose, size, u, v, surface)
    if hit is None:
        return None
    import numpy as np
    rng = np.random.default_rng(seed)
    keys = ('x', 'y', 'z', 'yaw', 'pitch', 'roll', 'f')
    spread = []
    for _ in range(samples):
        p = {k: pose[k] + rng.normal() * sigma.get(k, 0.0) for k in keys}
        du, dv = rng.normal(size=2) * pick_sigma
        s = surface if height is None or not height_sigma else flat(height + rng.normal() * height_sigma)
        h = cast(p, size, u + du, v + dv, s)
        if h is not None:
            spread.append(math.hypot(h[0] - hit[0], h[2] - hit[2]))
    rms = math.sqrt(sum(s * s for s in spread) / len(spread)) if spread else None
    return {'at': [round(float(hit[0]), 2), round(float(hit[2]), 2)], 'y': round(float(hit[1]), 2),
            'range': round(float(math.dist(hit, [pose['x'], pose['y'], pose['z']])), 1),
            'uncertaintyM': None if rms is None else round(rms, 2), 'samples': len(spread)}


def combine(fixes):
    """One position from several cameras: inverse-variance mean, its uncertainty, and how far apart they lie."""
    w = [1 / max(f['uncertaintyM'], 0.05) ** 2 for f in fixes]
    xz = [f['at'] for f in fixes]
    mean = [sum(p[i] * k for p, k in zip(xz, w)) / sum(w) for i in (0, 1)]
    spread = max((math.dist(a, b) for i, a in enumerate(xz) for b in xz[i + 1:]), default=0.0)
    # Photos from one station share its position and lens errors, so a second photo does not shrink
    # the uncertainty: keep the best single one, or half the spread if the cameras disagree by more.
    sigma = min(f['uncertaintyM'] for f in fixes)
    return [round(float(mean[0]), 2), round(float(mean[1]), 2)], round(max(sigma, spread / 2), 2), round(spread, 2)


def poses():
    return json.loads(POSES.read_text())['photos']


def surface_for(entry, cache):
    """A discrepancy photo entry's contact surface: 'ground' (siteY) or a stated height in metres."""
    contact = entry.get('contactHeight', 'ground')
    if contact == 'ground':
        cache.setdefault('site', SiteGround())
        return cache['site'], None
    return flat(float(contact)), float(contact)


def discrepancy_position(d, all_poses, cache=None, quick=False):
    """The map position of a discrepancy record from the contact pixels of its photos, or None.

    Each contact photo's own cast is returned under 'casts' (stored as entry['cast']). With quick, only the
    nominal ray is re-cast and the stored per-photo uncertainties are reused, so a check stays fast."""
    cache = {} if cache is None else cache
    fixes, used, casts = [], [], {}
    for i, entry in enumerate(d.get('photos', [])):
        if not entry.get('contact'):
            continue
        record = all_poses.get(entry['photo'])
        if not record or not record.get('solved'):
            continue
        surface, height = surface_for(entry, cache)
        if quick:
            hit = cast(record['solved']['pose'], record['image'], *entry['contact'], surface)
            stored = entry.get('cast') or {}
            fix = None if hit is None else {'at': [round(float(hit[0]), 2), round(float(hit[2]), 2)], 'uncertaintyM': stored.get('uncertaintyM')}
        else:
            fix = locate(record, *entry['contact'], surface, height=height, height_sigma=entry.get('heightSigma', 0.0))
        if fix and fix['uncertaintyM'] is not None:
            fix = {'at': fix['at'], 'uncertaintyM': fix['uncertaintyM']}
            casts[i] = fix
            fixes.append(fix)
            used.append(entry['photo'].removesuffix('.jpg'))
    if not fixes:
        return None
    at, sigma, spread = combine(fixes)
    surface = sorted({str(e.get('contactHeight', 'ground')) for e in d['photos'] if e.get('contact')})
    basis = (f"camera ray to {'the model ground (siteY)' if surface == ['ground'] else 'y = ' + ', '.join(surface) + ' m'} through "
             + ', '.join(used) + (f'; cameras agree to {spread:.2f} m' if len(fixes) > 1 else ''))
    return {'at': at, 'uncertaintyM': sigma, 'positionBasis': basis, 'casts': casts}


def update_discrepancies(write=False, check=False, quiet=False):
    """Recompute positions (write: store them); return a sentence for every record whose stored position is stale.

    A check (write False) re-casts only the nominal rays: a moved camera, contact pixel or ground shows up there.
    Uncertainties come from the Monte Carlo of a --write run and are stored per photo."""
    data = json.loads(DISCREPANCIES.read_text())
    all_poses, cache, stale = poses(), {}, []
    for d in data['discrepancies']:
        found = discrepancy_position(d, all_poses, cache, quick=not write)
        if found is None:
            if d.get('at') is not None and d.get('positionBasis', '').startswith('camera ray'):
                stale.append(f"discrepancy {d['id']}: stored camera-ray position but no contact pixel casts")
            continue
        casts = found.pop('casts')
        missing = [i for i, e in enumerate(d['photos']) if e.get('contact') and i not in casts]
        old = d.get('at')
        moved = [i for i, fix in casts.items() if not d['photos'][i].get('cast') or math.dist(d['photos'][i]['cast']['at'], fix['at']) > STALE_M]
        if missing or moved or old is None or math.dist(old, found['at']) > STALE_M or d.get('positionBasis') != found['positionBasis'] \
                or found['uncertaintyM'] is None or abs((d.get('uncertaintyM') or 0) - found['uncertaintyM']) > STALE_M:
            stale.append(f"discrepancy {d['id']}: stored {old} ± {d.get('uncertaintyM')}, cameras give {found['at']} ± {found['uncertaintyM']}")
        if write:
            for i, fix in casts.items():
                d['photos'][i]['cast'] = fix
            d.update(found)
        if not quiet:
            print(f"{d['id']:44} {found['at']} ± {found['uncertaintyM']}  {found['positionBasis']}")
    if write:
        DISCREPANCIES.write_text(json.dumps(data, indent=1, ensure_ascii=False) + '\n')
        print(DISCREPANCIES.relative_to(ROOT))
        return []
    if check and stale:
        for line in stale:
            print(' -', line)
        sys.exit('map positions in data/discrepancies.json are stale: run python3 scripts/pixel_to_map.py --discrepancies --write')
    return [s + ': run python3 scripts/pixel_to_map.py --discrepancies --write' for s in stale]


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('photo', nargs='?')
    parser.add_argument('u', nargs='?', type=float)
    parser.add_argument('v', nargs='?', type=float)
    parser.add_argument('--height', type=float, help='intersect the ray with this height (scene metres) instead of the ground')
    parser.add_argument('--height-sigma', type=float, default=0.0, help='one-sigma uncertainty of --height, metres')
    parser.add_argument('--ground', choices=['site', 'model'], default='site', help='site: src/terrain.ts siteY; model: the exported scene ground')
    parser.add_argument('--pick-sigma', type=float, default=PICK_SIGMA, help='pixel pick error, one sigma')
    parser.add_argument('--discrepancies', action='store_true', help='recompute every position in data/discrepancies.json')
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.discrepancies:
        update_discrepancies(args.write, args.check)
        return
    if args.photo is None or args.u is None or args.v is None:
        parser.error('give a photo and a pixel, or --discrepancies')
    name = args.photo if args.photo.endswith('.jpg') else args.photo + '.jpg'
    record = poses().get(name)
    if not record or not record.get('solved'):
        raise SystemExit(f'{name} has no solved camera in data/photo_poses.json')
    fix = locate(record, args.u, args.v, ground(args.ground, args.height), args.pick_sigma, args.height, args.height_sigma)
    print(json.dumps(fix) if fix else 'null  (the ray meets no ground within 300 m)')


if __name__ == '__main__':
    main()
