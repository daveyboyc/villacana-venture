#!/usr/bin/env python3
"""How well the photos pin down each feature: the coverage report (docs/PHOTO_COVERAGE_PRD.md, slice 1).

  node scripts/shoot_views.cjs --model                 writes layout-checks.local/model.json (the scene export)
  python3 scripts/photo_coverage.py                    computes coverage, writes data/photo_coverage.json and
                                                       public/photo-coverage.json (the map layer)
  python3 scripts/photo_coverage.py --area elena --area cervantes     computes, then prints the grades for those areas
  python3 scripts/photo_coverage.py --report-only --area elena        prints from the saved file, no recompute

For every feature in the shared inventory (scripts/assign_photo_map.py) with a ring or points, it
samples the feature's rendered edges from the scene export (wall feet and tops, bed kerbs, lawn
edges, roof edges) every half metre, and asks which photos can see each sample:

- a solved camera (data/photo_poses.json, position sigma within SOLVED_SIGMA_M and yaw within
  SOLVED_YAW_DEG) sees a sample when it projects inside the photo, and the straight line from the
  camera to it clears every building, modelled wall and planted bed in a height field built from
  the export (OCCLUDER_CELL_M cells; trees and climbers are not occluders) by the combined
  uncertainty of the occluder's top, the camera's height and its pitch at that range, so a grazing
  view does not count; occluders within EYE_CLEAR_M of the camera (its parapet) are ignored;
- any other photo is a wedge from its pin (refs/catalog.json looksAt, or the phone heading) of
  +-WEDGE_HALF_DEG out to UNSOLVED_RANGE_M, eye at ground + 1.6 m (roof 7.5, upper floor 5.0); it
  can only make a feature `seen`, since its position and aim are guesses.

Samples are grouped along each feature in BIN_M stretches, and each stretch is graded
(section 3 of the PRD):

  unseen    no photo sees it
  seen      a photo shows it: an unsolved wedge, or a solved camera beyond LOCATED_M
  located   a solved camera sees it within LOCATED_M: its direction is fixed
  fixed     depth too: two solved cameras whose rays to it are 30-150 degrees apart in plan; or one
            solved camera within SINGLE_M (3D) that sees its foot on the ground, with the ground
            cast good to CAST_ERROR_M for that camera's pitch sigma; or one solved camera plus a
            shape the aerial shows sharply (registry roof edges, pool rings, lawns)
  measured  a recorded measured approval (data/placement_reviews.json measuredApprovals)

A feature's parts are its plan edges (a ring's north/east/south/west sides; a line's ends and
middle). A part, and the feature as a whole, takes the grade at least PART_SHARE of its stretches
reach; parts below `fixed` are listed as weak parts (a lawn's hidden north side). A registry
outline is rigid, so it takes its best side. A photo cited in a feature's evidence keeps it at least
`seen`; a measured approval makes it `measured`, and its weak parts are still listed. Height-critical features (walls,
steps, ramps, raised beds: upright edges of 0.3 m or more in the export) also need a height view:
a camera within HEIGHT_RANGE_M that sees both foot and top within HEIGHT_SIDE_DEG of level, or two
solved cameras 30 degrees apart on the top. Registry roofs take their height from the laser survey.

An area is `enough` when every structural feature in it is at least `fixed` and every
height-critical one has a height view. Coverage says what the photos could support. It is not a
measurement and grants no placement approval (docs/PLACEMENT_VERIFICATION.md).
Needs numpy and Pillow (through scripts/photo_pose.py).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import assign_photo_map as assign  # noqa: E402
import area_map  # noqa: E402
from photo_pose import EYE, project  # noqa: E402

MODEL = ROOT / 'layout-checks.local/model.json'
OUT = ROOT / 'data/photo_coverage.json'
PUBLIC = ROOT / 'public/photo-coverage.json'

GRADES = ['unseen', 'seen', 'located', 'fixed', 'measured']
RANK = {g: i for i, g in enumerate(GRADES)}
COLOURS = {'unseen': '#8a1c1c', 'seen': '#e8590c', 'located': '#e0a800', 'fixed': '#2f8a3e', 'measured': '#1f5fa8'}
MEANING = {
    'unseen': 'No photo sees it: hidden in every view, or nobody has stood where it shows.',
    'seen': 'A photo shows it, but no solved camera within 25 m: what it looks like, not where it is.',
    'located': 'A solved camera sees it within 25 m: its direction is fixed, its depth is not.',
    'fixed': 'Position and depth: two solved views at least 30 degrees apart, one solved view close by of its foot, or one plus the aerial.',
    'measured': 'A recorded measured approval: two solved cameras or one plus the aerial, 0.3 m rms, second-agent review.',
}

SOLVED_SIGMA_M = 1.5      # a solve looser than this in plan is treated like a pin
SOLVED_YAW_DEG = 3.0
LOCATED_M = 25.0          # a solved camera fixes direction out to this distance (3D)
SEEN_M = 40.0             # beyond this a solved camera does not count at all
SINGLE_M = 12.5           # one solved camera fixes depth only this close ("about 12 m")
CAST_ERROR_M = 0.5        # and only if a ground cast through it is this good
GROUND_SIGMA_M = 0.1      # terrain height uncertainty under a cast foot
MIN_PITCH_SIGMA = 0.5     # degrees: no solve is better than this in practice
SEPARATION = (30.0, 150.0)  # plan angle between two rays that triangulate a point
UNSOLVED_RANGE_M = 30.0
WEDGE_HALF_DEG = 45.0     # half the phone's field of view (about 27-34 degrees) plus heading slack
HEIGHT_RANGE_M = 15.0
HEIGHT_SIDE_DEG = 25.0
SAMPLE_M = 0.5
BIN_M = 1.0
PART_SHARE = 0.6
OCCLUDER_CELL_M = 0.1
FOOT_M = 0.3              # a sample within this of the lowest edge near it is on the ground
UPRIGHT_M = 0.3           # an upright edge this tall makes a feature height-critical
TARGET_CLEAR_M = 0.15     # occluders this close to the target in plan are its own faces
EYE_CLEAR_M = 1.0         # and this close to a camera are the parapet or sill the phone is held over
OCCLUDER_SIGMA_M = 0.25   # wall, hedge and roof tops are estimates to about this
PIN_EYE_SIGMA_M = 0.3     # eye height of a photo whose camera is not solved
FRAME_MARGIN = 0.02       # and fall this share of the frame inside its edges
OUTLINE_M = 0.25          # export edges further than this from the feature's outline are inside it (lawn tile lines)
SAMPLE_CAP = 600

# Ground shapes the aerial shows sharply (PRD section 3: lawn edge, roof edge). Walls and kerbs are not.
AERIAL_SHARP = re.compile(r'lawn|grass')
NOT_AERIAL = re.compile(r'wall|kerb|door|path|tree|bed|pollard|sill|hedge')
HEIGHT_WORDS = re.compile(r'step|ramp|terrace|sill|raised|parapet')
# Detail (PRD stage 5): planting, fittings and ornament placed on reviewed structure.
DETAIL_FILES = ('elena_junction_details.json', 'north_pool_frontages.json', 'paseo_details.json',
                'junction_lawns.json', 'backdrop.json')
DETAIL_WORDS = re.compile(r'shrub|climber|bougainvillea|tree|cypress|palm|plant|lamp|sign|plaque|furniture|awning|lantern|window|bench|parasol')
STRUCTURE_WORDS = re.compile(r'wall|bed|kerb|patio|path|lawn|step|ramp|terrace|planter|gate|door|floor|paving|deck|front|parapet|pergola|hedge|fence|tunnel|passage|entry|threshold|apron|bays|footpath|crossing|strip')
SKIP_KINDS = {'area', 'parking'}
SKIP_FILES = ('backdrop.json',)


def load(path):
    return json.loads((ROOT / path).read_text())


def digest(paths):
    h = hashlib.sha256()
    for p in paths:
        h.update(p.encode())
        h.update((ROOT / p).read_bytes())
    return h.hexdigest()[:16]


INPUTS = ['data/photo_poses.json', 'public/photos-ref/manifest.json', 'refs/catalog.json', 'public/map/skeleton.json',
          'data/placement_reviews.json', 'data/photo_requests.json', 'data/discrepancies.json']


# ---------------------------------------------------------------- scene export

class Scene:
    """Ground, feature edges and an occluder height field from the scene export."""

    def __init__(self, model):
        g = model['ground']
        self.g = g
        self.H = np.array(g['heights'], float).reshape(g['nz'], g['nx'])
        self.buildings = {b['id']: b for b in model['buildings']}
        self.pools = {p['id']: np.array(p['ring'], float) for p in model['pools']}
        self.edges = {}
        for f in model['features']:
            seg = np.array(f['segments'], float).reshape(-1, 6)
            self.edges.setdefault(f['id'], []).append(seg)
        self.edges = {k: np.concatenate(v) for k, v in self.edges.items()}
        self.x0, self.z0 = g['x0'], g['z0']
        self.x1, self.z1 = g['x0'] + g['step'] * (g['nx'] - 1), g['z0'] + g['step'] * (g['nz'] - 1)
        c = OCCLUDER_CELL_M
        self.nx, self.nz = int((self.x1 - self.x0) / c) + 1, int((self.z1 - self.z0) / c) + 1
        self.top = np.full((self.nz, self.nx), -100.0, np.float32)

    def ground(self, x, z):
        g = self.g
        x = np.clip(np.asarray(x, float), self.x0, self.x1 - 1e-6)
        z = np.clip(np.asarray(z, float), self.z0, self.z1 - 1e-6)
        fx, fz = (x - g['x0']) / g['step'], (z - g['z0']) / g['step']
        i, j = fx.astype(int), fz.astype(int)
        a, b = fx - i, fz - j
        H = self.H
        return H[j, i] * (1 - a) * (1 - b) + H[j, i + 1] * a * (1 - b) + H[j + 1, i] * (1 - a) * b + H[j + 1, i + 1] * a * b

    def cell(self, x, z):
        i = np.clip(((np.asarray(x) - self.x0) / OCCLUDER_CELL_M).astype(int), 0, self.nx - 1)
        j = np.clip(((np.asarray(z) - self.z0) / OCCLUDER_CELL_M).astype(int), 0, self.nz - 1)
        return j, i

    def raise_line(self, a, b):
        """Mark the cells under a 3D segment with its height (the higher wins)."""
        n = max(2, int(math.dist((a[0], a[2]), (b[0], b[2])) / (OCCLUDER_CELL_M / 2)) + 2)
        t = np.linspace(0, 1, n)
        x, y, z = (a[k] + (b[k] - a[k]) * t for k in range(3))
        j, i = self.cell(x, z)
        np.maximum.at(self.top, (j, i), y.astype(np.float32))

    def raise_polygon(self, ring, height):
        ring = np.asarray(ring, float)
        lo, hi = ring.min(0), ring.max(0)
        j0, i0 = self.cell(lo[0], lo[1])
        j1, i1 = self.cell(hi[0], hi[1])
        xs = self.x0 + (np.arange(i0, i1 + 1) + .5) * OCCLUDER_CELL_M
        zs = self.z0 + (np.arange(j0, j1 + 1) + .5) * OCCLUDER_CELL_M
        X, Z = np.meshgrid(xs, zs)
        inside = np.zeros(X.shape, bool)
        for (ax, az), (bx, bz) in zip(ring, np.roll(ring, -1, 0)):
            if az == bz:
                continue
            cross = ((az > Z) != (bz > Z)) & (X < (bx - ax) * (Z - az) / (bz - az) + ax)
            inside ^= cross
        block = self.top[j0:j1 + 1, i0:i1 + 1]
        np.maximum(block, np.where(inside, height, -100.0).astype(np.float32), out=block)
        for a, b in zip(ring, np.roll(ring, -1, 0)):
            self.raise_line((a[0], height, a[1]), (b[0], height, b[1]))

    def build_occluders(self, planting):
        for b in self.buildings.values():
            if b.get('passage') or b['top'] - b['base'] < 0.5:
                continue
            self.raise_polygon(b['ring'], b['top'])
        for seg in self.edges.values():
            for s in seg:
                a, b = s[:3], s[3:]
                if math.dist((a[0], a[2]), (b[0], b[2])) < 0.02:
                    continue  # an upright edge; its top is drawn by the edges beside it
                if max(a[1], b[1]) < self.ground((a[0] + b[0]) / 2, (a[2] + b[2]) / 2) + 0.25:
                    continue  # tile lines and lawn edges block nothing
                self.raise_line(a, b)
        for ring, top in planting:
            self.raise_polygon(ring, top)

    def clear(self, eye, targets, skip_eye, eye_sigma=PIN_EYE_SIGMA_M, pitch_sigma=0.0):
        """Which targets the eye sees past the occluders (bool per target). A line of sight must clear
        each occluder top by the combined uncertainty of that top, the eye height and the pitch at that range."""
        eye = np.asarray(eye, float)
        targets = np.asarray(targets, float)
        out = np.ones(len(targets), bool)
        if not len(targets):
            return out
        d = targets - eye
        plan = np.hypot(d[:, 0], d[:, 2])
        step = OCCLUDER_CELL_M / 2
        for lo in range(0, len(targets), 1500):
            sl = slice(lo, lo + 1500)
            L = plan[sl]
            n = int(L.max() / step) + 1
            s = np.arange(n) * step  # metres from the eye along the plan ray
            t = s[None, :] / np.maximum(L[:, None], 1e-6)
            valid = (s[None, :] > skip_eye) & (s[None, :] < L[:, None] - TARGET_CLEAR_M)
            x = eye[0] + d[sl, 0:1] * t
            z = eye[2] + d[sl, 2:3] * t
            y = eye[1] + d[sl, 1:2] * t
            j, i = self.cell(x, z)
            reach = s[None, :] * np.sqrt(1 + (d[sl, 1:2] / np.maximum(L[:, None], 1e-6)) ** 2)
            margin = np.sqrt(OCCLUDER_SIGMA_M ** 2 + eye_sigma ** 2 + (reach * math.radians(pitch_sigma)) ** 2)
            blocked = valid & (self.top[j, i] > y - margin)
            out[sl] = ~blocked.any(1)
        return out


def planting_occluders(scene):
    """Planted beds and hedges from the data files: [(ring, top height)]. Planting is not in the export."""
    found = []

    def walk(node):
        if isinstance(node, dict):
            p = node.get('planting')
            if isinstance(node.get('ring'), list) and isinstance(p, dict) and isinstance(p.get('height'), (int, float)):
                ring = node['ring']
                seg = scene.edges.get(node.get('id', ''))
                if seg is not None and len(seg):
                    base = float(np.r_[seg[:, 1], seg[:, 4]].max())
                else:
                    xs, zs = zip(*ring)
                    base = float(scene.ground(np.mean(xs), np.mean(zs))) + float(node.get('height', 0) or 0)
                found.append((ring, base + p['height']))
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)

    for path in sorted((ROOT / 'data').glob('*.json')):
        if path.name in ('reference_tags.json', 'build_queue.json', 'areas.json'):
            continue
        walk(json.loads(path.read_text()))
    return found


# ---------------------------------------------------------------- cameras

def bearing(dx, dz):
    """Compass degrees of a plan direction (+x east, +z south)."""
    return np.degrees(np.arctan2(dx, -dz)) % 360


def cameras(scene):
    poses = load('data/photo_poses.json')['photos']
    manifest = {p['file']: p for p in load('public/photos-ref/manifest.json')}
    catalog = {e['id']: e for e in load('refs/catalog.json')}
    cams = []
    for file in sorted(set(manifest) | set(poses)):
        rec, pin, entry = poses.get(file, {}), manifest.get(file, {}), catalog.get(file, {})
        solved = rec.get('solved')
        if solved:
            sig = solved['sigma']
            good = max(sig['x'], sig['z']) <= SOLVED_SIGMA_M and sig['yaw'] <= SOLVED_YAW_DEG
            p = solved['pose']
            if good:
                cams.append({'id': file, 'kind': 'solved', 'pose': p, 'image': rec['image'], 'eye': [p['x'], p['y'], p['z']],
                             'sigma': max(sig['x'], sig['z']), 'pitchSigma': max(MIN_PITCH_SIGMA, sig.get('pitch', 1.0)), 'ySigma': sig.get('y', 0.3),
                             'station': rec.get('station')})
                continue
        viewpoint = entry.get('viewpoint', 'ground')
        if viewpoint in ('aerial', 'map'):
            continue
        if rec.get('initial'):  # a hand-set or pin-seeded starting pose: better aim than the bare pin
            p = rec['initial']
            x, z, y = p['x'], p['z'], p['y']
            heading = p['yaw']
            basis = 'starting pose (not solved)' if not solved else 'loose solve (sigma %.1f m)' % max(solved['sigma']['x'], solved['sigma']['z'])
            if solved:
                x, z, y, heading = solved['pose']['x'], solved['pose']['z'], solved['pose']['y'], solved['pose']['yaw']
        elif isinstance(pin.get('x'), (int, float)):
            x, z = pin['x'], pin['z']
            y = float(scene.ground(x, z)) + EYE.get(viewpoint, 1.6)
            look = entry.get('looksAt')
            heading = float(bearing(look[0] - x, look[1] - z)) if look else pin.get('heading')
            basis = 'pin and reviewed looksAt' if look else 'pin and phone heading'
        else:
            continue
        if heading is None:
            continue
        cams.append({'id': file, 'kind': 'pin', 'eye': [x, y, z], 'heading': heading, 'basis': basis,
                     'accuracy': pin.get('accuracy') or 3.0})
    return cams


# ---------------------------------------------------------------- features and samples

def feature_key(fid):
    return fid.split(':', 1)[1] if ':' in fid else fid


def classify(f):
    fid, name = f['id'], f['name'].lower()
    file = fid.split(':', 1)[0]
    if f['kind'] in ('building', 'pool'):
        return 'registry'
    if file in DETAIL_FILES:
        return 'detail'
    if STRUCTURE_WORDS.search(feature_key(fid)) or STRUCTURE_WORDS.search(name):
        return 'structure'
    return 'detail' if DETAIL_WORDS.search(feature_key(fid)) or DETAIL_WORDS.search(name) else 'structure'


def parts_of(f):
    """Plan edges a feature is graded by: [(name, [(a, b), ...])]."""
    if 'ring' in f and len(f['ring']) >= 3:
        ring = [tuple(p) for p in f['ring']]
        area2 = sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:] + ring[:1]))
        sides = defaultdict(list)
        for a, b in zip(ring, ring[1:] + ring[:1]):
            if math.dist(a, b) < 1e-6:
                continue
            dx, dz = b[0] - a[0], b[1] - a[1]
            # Outward normal: for a ring whose signed area (x, z) is positive, outward is (dz, -dx).
            nx, nz = (dz, -dx) if area2 > 0 else (-dz, dx)
            b_ = float(bearing(nx, nz))
            side = ['north', 'east', 'south', 'west'][int(((b_ + 45) % 360) // 90)]
            sides[side].append((a, b))
        return [(s + ' side', segs) for s, segs in sides.items()]
    pts = [tuple(p) for p in f.get('points', [])]
    if len(pts) == 1:
        return [('point', [(pts[0], pts[0])])]
    segs = [(a, b) for a, b in zip(pts, pts[1:]) if math.dist(a, b) > 1e-6]
    total = sum(math.dist(a, b) for a, b in segs)
    if total <= 6 or not segs:
        return [('whole', segs or [(pts[0], pts[0])])]
    # Cut the line in three: two ends named by their compass side, and the middle.
    cuts, out, run = [total / 3, 2 * total / 3], [[], [], []], 0.0
    for a, b in segs:
        L = math.dist(a, b)
        stops = [0.0] + [(c - run) / L for c in cuts if run < c < run + L] + [1.0]
        for t0, t1 in zip(stops, stops[1:]):
            p = (a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0)
            q = (a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1)
            k = min(2, int((run + L * (t0 + t1) / 2) / (total / 3)))
            out[k].append((p, q))
        run += L

    def end(segs_):
        cx = sum(p[0] + q[0] for p, q in segs_) / (2 * len(segs_)) - sum(p[0] for p in pts) / len(pts)
        cz = sum(p[1] + q[1] for p, q in segs_) / (2 * len(segs_)) - sum(p[1] for p in pts) / len(pts)
        b_ = float(bearing(cx, cz))
        return ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][int(((b_ + 22.5) % 360) // 45)] + ' end'
    return [(end(out[0]), out[0]), ('middle', out[1]), (end(out[2]), out[2])]


def seg_samples(seg):
    """Points every SAMPLE_M along 3D segments (N x 6) -> (N x 3)."""
    out = []
    for s in seg:
        a, b = s[:3], s[3:]
        n = max(1, int(np.linalg.norm(b - a) / SAMPLE_M))
        t = (np.arange(n) + .5) / n
        out.append(a + (b - a) * t[:, None])
    return np.concatenate(out) if out else np.zeros((0, 3))


def samples_of(f, scene):
    """3D sample points for a feature, a foot flag for each, and whether it has upright edges."""
    key, upright = feature_key(f['id']), False
    pts = None
    if f['kind'] == 'building' and key in scene.buildings:
        b = scene.buildings[key]
        ring = np.array(b['ring'], float)
        segs = []
        for a, c in zip(ring, np.roll(ring, -1, 0)):
            for y in (b['base'], b['top']):
                segs.append([a[0], y, a[1], c[0], y, c[1]])
        pts = seg_samples(np.array(segs))
        foot = np.isclose(pts[:, 1], b['base'])
        return pts, foot, False
    if f['kind'] == 'pool' and key in scene.pools:
        r = scene.pools[key]
        pts = seg_samples(np.concatenate([r, np.roll(r, -1, 0)], 1))
        return pts, np.ones(len(pts), bool), False
    seg = scene.edges.get(key)
    if seg is not None and len(seg):
        plan = np.hypot(seg[:, 3] - seg[:, 0], seg[:, 5] - seg[:, 2])
        rise = np.abs(seg[:, 4] - seg[:, 1])
        upright = bool(((plan < 0.05) & (rise >= UPRIGHT_M)).any())
        flat = seg[plan >= 0.02]
        pts = seg_samples(flat if len(flat) else seg)
        on = near_outline(pts, f)
        if on.any():
            pts = pts[on]
    else:
        geo = []
        if 'ring' in f:
            r = f['ring']
            geo = [(a, b) for a, b in zip(r, r[1:] + r[:1])]
        elif len(f.get('points', [])) > 1:
            geo = list(zip(f['points'], f['points'][1:]))
        elif f.get('points'):
            geo = [(f['points'][0], f['points'][0])]
        rows = []
        for a, b in geo:
            ya, yb = float(scene.ground(*a)), float(scene.ground(*b))
            rows.append([a[0], ya, a[1], b[0], yb, b[1]])
        if not rows:
            return np.zeros((0, 3)), np.zeros(0, bool), False
        rows = np.array(rows, float)
        pts = seg_samples(rows) if np.abs(rows[:, [0, 2]] - rows[:, [3, 5]]).sum() > 0 else rows[:, :3]
        if f['kind'] == 'reference feature' and len(f.get('points', [])) == 1:
            pts = np.concatenate([pts, pts + [0, 1.5, 0]])  # a tree or post: its foot and its body
    if len(pts) > SAMPLE_CAP:
        pts = pts[np.linspace(0, len(pts) - 1, SAMPLE_CAP).astype(int)]
    # On the ground: within FOOT_M of the lowest sample within 1.5 m in plan.
    P = pts[:, [0, 2]]
    foot = np.zeros(len(pts), bool)
    for k in range(0, len(pts), 400):
        d = np.hypot(*(P[k:k + 400, None, :] - P[None, :, :]).transpose(2, 0, 1))
        low = np.where(d < 1.5, pts[None, :, 1], np.inf).min(1)
        foot[k:k + 400] = pts[k:k + 400, 1] <= low + FOOT_M
    return pts, foot, upright


def near_outline(pts, f):
    """Samples within OUTLINE_M of the feature's plan outline (ring edges or line)."""
    geo = f.get('ring') or f.get('points') or []
    if len(geo) < 2:
        return np.ones(len(pts), bool)
    segs = list(zip(geo, geo[1:] + (geo[:1] if 'ring' in f else [])))
    P = pts[:, [0, 2]]
    best = np.full(len(pts), np.inf)
    for a, b in segs:
        a, b = np.array(a, float), np.array(b, float)
        ab = b - a
        L2 = float(ab @ ab)
        t = np.clip(((P - a) @ ab) / L2, 0, 1) if L2 > 0 else np.zeros(len(P))
        best = np.minimum(best, np.hypot(*(P - (a + t[:, None] * ab)).T))
    return best <= OUTLINE_M


def assign_to_parts(pts, parts):
    """Part index and distance along it (m) for each sample."""
    best_k, best_d, along = np.zeros(len(pts), int), np.full(len(pts), np.inf), np.zeros(len(pts))
    P = pts[:, [0, 2]]
    for k, (_, segs) in enumerate(parts):
        run = 0.0
        for a, b in segs:
            a, b = np.array(a, float), np.array(b, float)
            ab = b - a
            L2 = float(ab @ ab)
            t = np.clip(((P - a) @ ab) / L2, 0, 1) if L2 > 0 else np.zeros(len(P))
            q = a + t[:, None] * ab
            d = np.hypot(*(P - q).T)
            better = d < best_d - 1e-9
            best_k[better], best_d[better], along[better] = k, d[better], run + t[better] * math.sqrt(L2)
            run += math.sqrt(L2)
    return best_k, along


# ---------------------------------------------------------------- grading

def visible_hits(cams, scene, all_pts):
    """For each camera, the sample indices it sees, with 3D distance. Returns {cam index: (idx, dist)}."""
    hits = {}
    P = all_pts
    for ci, cam in enumerate(cams):
        eye = np.array(cam['eye'], float)
        d = P - eye
        dist = np.sqrt((d ** 2).sum(1))
        if cam['kind'] == 'solved':
            near = np.flatnonzero(dist <= SEEN_M)
            if not len(near):
                continue
            uv, depth = project(cam['pose'], cam['image'], P[near])
            w, h = cam['image']
            mw, mh = w * FRAME_MARGIN, h * FRAME_MARGIN
            ok = (depth > 0.5) & (uv[:, 0] >= mw) & (uv[:, 0] <= w - mw) & (uv[:, 1] >= mh) & (uv[:, 1] <= h - mh)
            idx = near[ok]
            skip = EYE_CLEAR_M
        else:
            plan = np.hypot(d[:, 0], d[:, 2])
            near = np.flatnonzero((plan <= UNSOLVED_RANGE_M) & (plan > 0.5))
            if not len(near):
                continue
            off = (bearing(d[near, 0], d[near, 2]) - cam['heading'] + 180) % 360 - 180
            idx = near[np.abs(off) <= WEDGE_HALF_DEG]
            skip = max(EYE_CLEAR_M, min(float(cam['accuracy']), 4.0))  # the pin can sit inside a wall or house it was beside
        if not len(idx):
            continue
        seen = scene.clear(eye, P[idx], skip, cam.get('ySigma', PIN_EYE_SIGMA_M), cam.get('pitchSigma', 0.0) if cam['kind'] == 'solved' else 0.0)
        idx = idx[seen]
        if len(idx):
            hits[ci] = (idx, dist[idx])
    return hits


def cast_error(cam, pt):
    """Plan error of a ground point cast through a solved camera: pitch and terrain terms, plus the camera's own."""
    eye = cam['eye']
    D = math.hypot(pt[0] - eye[0], pt[2] - eye[2])
    h = max(0.3, eye[1] - pt[1])
    return (D * D + h * h) / h * math.radians(cam['pitchSigma']) + GROUND_SIGMA_M * D / h + cam['sigma']


def grade_bin(sample_ids, per_sample, cams, pts, foot, aerial):
    """Grade one stretch of a feature from every camera hit on its samples."""
    solved, any_hit = [], False
    for s in sample_ids:
        for ci, dist in per_sample.get(s, ()):
            any_hit = True
            if cams[ci]['kind'] == 'solved' and dist <= LOCATED_M:
                solved.append((ci, s, dist))
    why = []
    if not any_hit:
        return 'unseen', why, set(), None, None
    if not solved:
        return 'seen', why, set(), None, None
    centre = pts[list(sample_ids)].mean(0)
    angle = {}
    for ci, _, _ in solved:
        e = cams[ci]['eye']
        angle[ci] = float(bearing(centre[0] - e[0], centre[2] - e[2]))
    grade, single = 'located', None
    triangulated = False
    ids = sorted(angle)
    widest = 0.0
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            sep = abs((angle[ids[i]] - angle[ids[j]] + 180) % 360 - 180)
            widest = max(widest, min(sep, 180 - sep))  # rays 180 degrees apart are one line in plan
            if SEPARATION[0] <= sep <= SEPARATION[1]:
                triangulated = True
    if triangulated:
        grade, why = 'fixed', ['two solved views at least 30 degrees apart']
    else:
        for ci, s, dist in solved:
            if foot[s] and dist <= SINGLE_M and cast_error(cams[ci], pts[s]) <= CAST_ERROR_M:
                grade, why, single = 'fixed', ['one solved view close by, its foot on the ground'], dist
                break
        if grade != 'fixed' and aerial:
            grade, why = 'fixed', ['one solved view plus the aerial']
    return grade, why, {ci for ci, _, _ in solved}, single, widest


def height_view(sample_ids, per_sample, cams, pts, foot):
    """A camera near enough and level enough to read the height off foot and top; or two solved on the top."""
    tops = [s for s in sample_ids if not foot[s]]
    feet = [s for s in sample_ids if foot[s]]
    if not tops:
        return None
    seen_top = defaultdict(list)
    for s in tops:
        for ci, dist in per_sample.get(s, ()):
            seen_top[ci].append((s, dist))
    seen_foot = {ci for s in feet for ci, _ in per_sample.get(s, ())}
    for ci, items in seen_top.items():
        if ci not in seen_foot:
            continue
        e = cams[ci]['eye']
        for s, dist in items:
            if dist > HEIGHT_RANGE_M:
                continue
            p = pts[s]
            elev = math.degrees(math.atan2(abs(e[1] - p[1]), math.hypot(p[0] - e[0], p[2] - e[2])))
            if elev <= HEIGHT_SIDE_DEG:
                return cams[ci]['id']
    solved = [ci for ci in seen_top if cams[ci]['kind'] == 'solved' and min(d for _, d in seen_top[ci]) <= LOCATED_M]
    centre = pts[tops].mean(0)
    for i in range(len(solved)):
        for j in range(i + 1, len(solved)):
            a, b = (float(bearing(centre[0] - cams[c]['eye'][0], centre[2] - cams[c]['eye'][2])) for c in (solved[i], solved[j]))
            if SEPARATION[0] <= abs((a - b + 180) % 360 - 180) <= SEPARATION[1]:
                return cams[solved[i]]['id'] + ' + ' + cams[solved[j]]['id']
    return False


def part_grade(bin_grades):
    """The grade at least PART_SHARE of the stretches reach."""
    if not bin_grades:
        return 'unseen'
    ranks = sorted((RANK[g] for g in bin_grades), reverse=True)
    return GRADES[ranks[max(0, math.ceil(PART_SHARE * len(ranks)) - 1)]]


def explain(grade, hits, cams, pins_seen, stretches=()):
    """Why a feature is below fixed, in words. hits: [(camera index, distance, on the ground)] from solved cameras."""
    near = sorted({cams[c]['id'] for c, d, _ in hits if d <= LOCATED_M})
    far = sorted({cams[c]['id'] for c, d, _ in hits if d > LOCATED_M} - set(near))
    pins = sorted(pins_seen)
    pin_text = (', '.join(pins[:5]) + (f' and {len(pins) - 5} more' if len(pins) > 5 else '')) if pins else ''
    if grade == 'unseen':
        return 'No photo sees it: hidden behind walls, hedges or houses in every view, or out of every frame.'
    if grade == 'seen':
        bits = []
        reach = sum(RANK[g] >= RANK['located'] for g in stretches)
        if near and reach:
            bits.append(f'solved cameras ({", ".join(near)}) see only {reach} of its {len(stretches)} one-metre stretches within 25 m; '
                        'the rest is hidden behind walls, hedges or houses, or out of frame')
        if pin_text:
            bits.append('seen in photos whose cameras are not solved (' + pin_text + ')')
        if far:
            bits.append('solved cameras see it only beyond 25 m (' + ', '.join(far) + ')')
        if not bits:
            bits.append('only cited: no camera position sees most of it')
        return 'Seen, not located: ' + '; '.join(bits) + '. Solve one of those cameras, or take a solved view within 25 m.'
    if grade == 'located':
        eyes = [cams[c]['eye'] for c, d, _ in hits if d <= LOCATED_M]
        spread = max((math.dist((a[0], a[2]), (b[0], b[2])) for a in eyes for b in eyes), default=0)
        close_foot = any(foot and d <= SINGLE_M for _, d, foot in hits)
        why = 'Direction only: '
        why += (f'the only solved view ({near[0]}) gives no depth' if len(near) == 1 else
                'every solved view (' + ', '.join(near) + f') stands within {spread:.1f} m of the others, so they cannot triangulate it'
                if spread < 3 else 'the solved views (' + ', '.join(near) + ') do not look at it from 30 degrees apart')
        why += '; ' + ('its foot is seen close by, but a ground cast through that camera is not good to 0.5 m' if close_foot
                       else 'no solved view within 12 m sees its foot (hidden, or seen only from the roof)')
        return why + '. A solved ground view 30 degrees round, or one within about 6 m of its foot, would fix it.'
    return ''


def compute(scene):
    skeleton = load('public/map/skeleton.json')
    area_of = area_map.classifier(skeleton)
    cams = cameras(scene)
    reviews = load('data/placement_reviews.json')
    measured = {}
    for m in reviews.get('measuredApprovals', []):
        for fid in ([m['feature']] if isinstance(m['feature'], str) else m['feature']) + m.get('alsoAffects', []):
            measured[fid] = m['id']
    discrepancies, discrepancy_features = defaultdict(list), {}
    for d in load('data/discrepancies.json')['discrepancies']:
        discrepancy_features[d['id']] = d.get('features', [])
        if d.get('status') == 'open':
            for fid in d.get('features', []):
                discrepancies[fid].append(d['id'])
    requests = [r for r in load('data/photo_requests.json')['requests']]

    feats = [f for f in assign.features(skeleton)
             if f['kind'] not in SKIP_KINDS and not f['id'].startswith(SKIP_FILES) and ('ring' in f or f.get('points'))]
    all_pts, foots = [], []
    info = []
    for f in feats:
        pts, foot, upright = samples_of(f, scene)
        start = sum(len(p) for p in all_pts)
        all_pts.append(pts)
        foots.append(foot)
        info.append({'f': f, 'range': (start, start + len(pts)), 'upright': upright})
    P = np.concatenate(all_pts)
    FOOT = np.concatenate(foots)
    hits = visible_hits(cams, scene, P)
    per_sample = defaultdict(list)
    for ci, (idx, dist) in hits.items():
        for s, d in zip(idx.tolist(), dist.tolist()):
            per_sample[s].append((ci, d))

    out = []
    for item in info:
        f, (lo, hi) = item['f'], item['range']
        fid = f['id']
        category = classify(f)
        geo_pts = f.get('ring') or f.get('points')
        votes = Counter(a for a in (area_of(x, z) for x, z in geo_pts[:: max(1, len(geo_pts) // 12)]) if a)
        areas = [a for a, n in votes.most_common() if n >= max(1, votes.most_common(1)[0][1] // 3)] if votes else []
        parts = parts_of(f)
        ids = np.arange(lo, hi)
        pts = P[lo:hi]
        k, along = assign_to_parts(pts, parts) if len(pts) else (np.zeros(0, int), np.zeros(0))
        aerial = f['kind'] in ('building', 'pool') or (bool(AERIAL_SHARP.search(feature_key(fid))) and not NOT_AERIAL.search(feature_key(fid)))
        height_critical = f['kind'] != 'building' and (item['upright'] or bool(HEIGHT_WORDS.search(feature_key(fid))))
        part_out, solved_seen, pins_seen, solved_hits = [], set(), set(), []
        heights = []
        for pk, (pname, _) in enumerate(parts):
            mine = ids[k == pk]
            if not len(mine):
                continue
            bins = defaultdict(list)
            for s, a in zip(mine.tolist(), along[k == pk].tolist()):
                bins[int(a // BIN_M)].append(s)
            grades, why, cams_here, singles, widest = [], Counter(), set(), [], 0.0
            for b in sorted(bins):
                g, w, cs, single, wide = grade_bin(bins[b], per_sample, cams, P, FOOT, aerial)
                widest = max(widest, wide or 0.0)
                if single is not None:
                    singles.append(single)
                grades.append(g)
                why.update(w)
                cams_here |= cs
                if height_critical:
                    heights.append(height_view(bins[b], per_sample, cams, P, FOOT))
            for s in mine.tolist():
                for ci, dist in per_sample.get(s, ()):
                    if cams[ci]['kind'] == 'solved':
                        solved_seen.add(cams[ci]['id'])
                        solved_hits.append((ci, dist, bool(FOOT[s])))
                    else:
                        pins_seen.add(cams[ci]['id'])
            pg = part_grade(grades)
            part_out.append({'part': pname, 'grade': pg, 'stretches': len(grades), '_grades': grades,
                             '_line': [[round(c, 2) for c in (*a, *b)] for a, b in parts[pk][1]],
                             'share': {g: round(grades.count(g) / len(grades), 2) for g in GRADES if g in grades},
                             'solvedCameras': sorted(cams[c]['id'] for c in cams_here),
                             **({'basis': why.most_common(1)[0][0]} if pg == 'fixed' and why else {}),
                             **({'singleCameraM': round(max(singles), 2)} if singles else {}),
                             **({'widestSolvedAngle': round(widest, 1)} if len(cams_here) > 1 else {})})
        every = [g for p in part_out for g in p['_grades']]
        # A registry outline is rigid and reliable in shape: one well-seen side pins it. Anything
        # else takes the grade most of its length reaches; its hidden sides stay listed as weak parts.
        computed = (max((p['grade'] for p in part_out), key=RANK.get, default='unseen') if category == 'registry'
                    else part_grade(every))
        for p in part_out:
            del p['_grades']
        cited = sorted(e for e in f.get('evidence', []) if e.endswith('.jpg'))
        grade = computed
        notes = []
        if cited and RANK[grade] < RANK['seen']:
            grade = 'seen'
            notes.append('cited photos show it, though no camera position can see it')
        if fid in measured:
            grade = 'measured'
        weak = [p['part'] for p in part_out if RANK[p['grade']] < RANK['fixed']]
        if height_critical:
            have = [h for h in heights if h is not None]
            height = 'none' if not have else ('view' if sum(bool(h) for h in have) >= PART_SHARE * len(have) else 'partial')
            height_from = sorted({h for h in have if h})[:4]
        else:
            height, height_from = ('survey' if f['kind'] == 'building' else 'n/a'), []
        rec = {'id': fid, 'name': f['name'], 'kind': f['kind'], 'category': category, 'areas': areas,
               'grade': grade, 'computed': computed, 'aerialSharp': aerial, 'heightCritical': height_critical,
               'height': height, **({'heightFrom': height_from} if height_from else {}),
               'parts': part_out, 'weakParts': weak,
               'solvedCameras': sorted(solved_seen), 'nearestSolvedM': round(min((d for _, d, _ in solved_hits), default=0), 1) or None,
               'widestSolvedAngle': max((p.get('widestSolvedAngle', 0) for p in part_out), default=0),
               'pinCameras': sorted(pins_seen)[:20], 'pinCameraCount': len(pins_seen),
               'cited': cited}
        if fid in measured:
            rec['measuredApproval'] = measured[fid]
        if discrepancies.get(fid):
            rec['openDiscrepancies'] = discrepancies[fid]
        rec['why'] = explain(computed, solved_hits, cams, pins_seen, every) if RANK[grade] < RANK['fixed'] else (
            'Measured approval ' + measured[fid] + (('; parts outside it: ' + ', '.join(weak)) if weak else '') if fid in measured
            else 'Fixed: ' + ', '.join(sorted({p['basis'] for p in part_out if p.get('basis')})) + (('; weak parts: ' + ', '.join(weak)) if weak else ''))
        if notes:
            rec['notes'] = notes
        if 'ring' in f:
            rec['ring'] = [[round(x, 2), round(z, 2)] for x, z in f['ring']]
        else:
            rec['points'] = [[round(x, 2), round(z, 2)] for x, z in f['points']]
            if f.get('width'):
                rec['width'] = f['width']
        out.append(rec)

    # Requests that serve a feature: its text names the feature or a discrepancy listing it, or it looks
    # at a point within 3 m of it.
    known = {rec['id'] for rec in out}
    for r in requests:
        r_feats = []
        text = r.get('why', '') + ' ' + r.get('ask', '')
        for did, fids in discrepancy_features.items():
            if re.search(r'(?<![\w-])' + re.escape(did) + r'(?![\w-])', text):
                r_feats += [fid for fid in fids if fid in known and fid not in r_feats]
        for rec in out:
            key = feature_key(rec['id'])
            if rec['id'] not in r_feats and '-' in key and re.search(r'(?<![\w-])' + re.escape(key) + r'(?![\w-])', text):
                r_feats.append(rec['id'])
        if r.get('look'):
            a, b = np.array(r['at'], float), np.array(r['look'], float)
            for rec in out:
                if rec['id'] in r_feats or rec['kind'] in ('building', 'street'):
                    continue
                geo = np.array(rec.get('ring') or rec.get('points'), float)
                d = np.min(np.hypot(*(geo - b).T))
                if d <= 3.0:
                    r_feats.append(rec['id'])
        for fid in r_feats:
            rec = next(x for x in out if x['id'] == fid)
            rec.setdefault('requests', []).append(r['id'])

    areas_out = {}
    for a in load('data/areas.json')['areas']:
        here = [r for r in out if a['id'] in r['areas']] if a['id'] != 'whole-resort' else out
        structural = [r for r in here if r['category'] != 'detail' and r['kind'] != 'street']
        below = sorted(r['id'] for r in structural if RANK[r['grade']] < RANK['fixed'])
        no_height = sorted(r['id'] for r in structural if r['heightCritical'] and r['height'] != 'view')
        areas_out[a['id']] = {
            'name': a['name'], 'features': len(here), 'structural': len(structural),
            'grades': {g: sum(r['grade'] == g for r in structural) for g in GRADES},
            'enough': not below and not no_height,
            'belowFixed': below, 'noHeightView': no_height,
        }
    cam_out = [{'id': c['id'], 'kind': c['kind'], 'x': round(c['eye'][0], 2), 'z': round(c['eye'][2], 2), 'y': round(c['eye'][1], 2),
                **({'yaw': round(c['pose']['yaw'], 1), 'sigma': round(c['sigma'], 2)} if c['kind'] == 'solved' else {'heading': round(c['heading'], 1), 'basis': c['basis']})}
               for c in cams]
    return {
        'about': 'Photo coverage (docs/PHOTO_COVERAGE_PRD.md, scripts/photo_coverage.py): for every feature, how well the photos can pin it down. '
                 'Grades: unseen, seen, located (direction), fixed (position and depth), measured (a recorded measured approval). '
                 '`computed` is what the photos alone support; `grade` adds cited photos and measured approvals. '
                 'Coverage says what the photos could support. It is not a measurement and grants no placement approval.',
        'inputs': {'digest': digest(INPUTS), 'files': INPUTS, 'sceneExport': 'layout-checks.local/model.json (node scripts/shoot_views.cjs --model)'},
        'rules': {'solvedSigmaM': SOLVED_SIGMA_M, 'solvedYawDeg': SOLVED_YAW_DEG, 'locatedM': LOCATED_M, 'seenM': SEEN_M,
                  'singleCameraM': SINGLE_M, 'castErrorM': CAST_ERROR_M, 'separationDeg': list(SEPARATION),
                  'unsolvedRangeM': UNSOLVED_RANGE_M, 'wedgeHalfDeg': WEDGE_HALF_DEG, 'heightRangeM': HEIGHT_RANGE_M,
                  'heightSideDeg': HEIGHT_SIDE_DEG, 'binM': BIN_M, 'partShare': PART_SHARE,
                  'occluders': 'registry buildings, exported wall/step/bed edges, planted beds from data/*.json; not trees or climbers',
                  'clearance': f'a line of sight clears each occluder by hypot({OCCLUDER_SIGMA_M} m, camera height sigma, range x pitch sigma)'},
        'grades': [{'id': g, 'colour': COLOURS[g], 'meaning': MEANING[g], 'count': sum(r['grade'] == g for r in out)} for g in GRADES],
        'cameras': {'solved': sum(c['kind'] == 'solved' for c in cams), 'pins': sum(c['kind'] == 'pin' for c in cams), 'list': cam_out},
        'areas': areas_out,
        'features': sorted(out, key=lambda r: r['id']),
    }


def dump(data):
    """The data file: one line per feature and camera, so a re-run diffs feature by feature."""
    rows = lambda items: '[\n' + ',\n'.join('  ' + json.dumps(x, ensure_ascii=False) for x in items) + '\n ]'
    head = {k: v for k, v in data.items() if k not in ('features', 'cameras')}
    text = json.dumps(head, indent=1, ensure_ascii=False)[:-2]
    cams = {k: v for k, v in data['cameras'].items() if k != 'list'}
    text += ',\n "cameras": ' + json.dumps(cams, ensure_ascii=False)[:-1] + ', "list": ' + rows(data['cameras']['list']) + '}'
    return text + ',\n "features": ' + rows(data['features']) + '\n}\n'


def public_copy(data):
    """What the map layer needs: grades, outlines, why, and the photo requests with their look arrows."""
    reqs = load('data/photo_requests.json')['requests']
    keep = ('id', 'name', 'kind', 'category', 'areas', 'grade', 'computed', 'height', 'heightFrom', 'heightCritical', 'weakParts', 'why',
            'nearestSolvedM', 'widestSolvedAngle',
            'solvedCameras', 'cited', 'measuredApproval', 'openDiscrepancies', 'requests', 'ring', 'points', 'width')
    return {
        'about': data['about'],
        'inputs': data['inputs'],
        'grades': data['grades'],
        'areas': {k: {kk: v[kk] for kk in ('name', 'structural', 'grades', 'enough')} | {'belowFixed': len(v['belowFixed']), 'noHeightView': len(v['noHeightView'])}
                  for k, v in data['areas'].items()},
        'features': [{k: f[k] for k in keep if k in f} | {'parts': [{'part': p['part'], 'grade': p['grade'], 'line': p['_line']} for p in f['parts']]}
                     for f in data['features'] if f['kind'] != 'street'],
        'requests': [{k: r[k] for k in ('id', 'area', 'at', 'look', 'ask', 'why', 'status', 'priority') if k in r} for r in reqs],
    }


def report(data, areas):
    rows = []
    for a in areas:
        card = data['areas'].get(a)
        if not card:
            print(f'unknown area {a}')
            continue
        print(f"\n== {card['name']} ({a}): {'ENOUGH' if card['enough'] else 'not enough'} ==")
        print('   structural features by grade: ' + ', '.join(f'{g} {n}' for g, n in card['grades'].items()))
        here = [f for f in data['features'] if a in f['areas'] and f['kind'] != 'street']
        for f in sorted(here, key=lambda f: (f['category'] == 'detail', RANK[f['grade']], f['id'])):
            flag = '!' if RANK[f['grade']] < RANK['fixed'] and f['category'] != 'detail' else ' '
            parts = ' '.join(f"{p['part'].replace(' side', '').replace(' end', '')}:{p['grade'][:3]}" for p in f['parts'])
            h = f" height:{f['height']}" if f['heightCritical'] else ''
            extra = f" (computed {f['computed']})" if f['computed'] != f['grade'] else ''
            print(f" {flag} {f['grade']:<9}{extra:<21} {f['category'][:6]:<6} {f['id']}{h}")
            print(f"      parts {parts}")
            if RANK[f['grade']] < RANK['fixed'] or f['weakParts']:
                print(f"      {f['why']}")
            if f.get('openDiscrepancies'):
                print(f"      open: {', '.join(f['openDiscrepancies'])}")
            rows.append(f)
    return rows


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--area', action='append', default=[], help='print the grades for this area (repeatable)')
    ap.add_argument('--report-only', action='store_true', help='print from data/photo_coverage.json without recomputing')
    args = ap.parse_args()
    if args.report_only:
        data = json.loads(OUT.read_text())
    else:
        if not MODEL.exists():
            raise SystemExit(f'{MODEL.relative_to(ROOT)} is missing: run node scripts/shoot_views.cjs --model first')
        scene = Scene(json.loads(MODEL.read_text()))
        scene.build_occluders(planting_occluders(scene))
        data = compute(scene)
        PUBLIC.write_text(json.dumps(public_copy(data), separators=(',', ':'), ensure_ascii=False) + '\n')
        # The data file keeps the grades and reasons; outlines are in the map copy and the inventory.
        for f in data['features']:
            for k in ('ring', 'points', 'width'):
                f.pop(k, None)
            for p in f['parts']:
                p.pop('_line', None)
        OUT.write_text(dump(data))
        counts = Counter(f['grade'] for f in data['features'])
        print(f"{len(data['features'])} features; " + ', '.join(f'{g} {counts[g]}' for g in GRADES)
              + f"; {data['cameras']['solved']} solved cameras, {data['cameras']['pins']} pins")
        print(f'wrote {OUT.relative_to(ROOT)} and {PUBLIC.relative_to(ROOT)}')
    if args.area:
        report(data, args.area)


if __name__ == '__main__':
    main()
