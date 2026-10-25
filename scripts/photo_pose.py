#!/usr/bin/env python3
"""Solve where a photo was taken from points matched between the photo and the model.

A phone pin is good to a few metres and its compass to tens of degrees, too loose to put a
render beside a photo and measure anything. This finds the camera (position, compass yaw,
pitch, roll and focal length) that best projects known model points onto the pixels where the
photo shows them, then measures every held-out point against the photo in pixels and metres.

  python3 scripts/photo_pose.py init IMG_2204            starting pose from the pin and looksAt
  node scripts/shoot_views.cjs IMG_2204 --pose           render through it; writes the model export
  python3 scripts/photo_pose.py guide IMG_2204           photo with numbered model corners and pool edges
  (record matches under "points" in data/photo_poses.json)
  python3 scripts/photo_pose.py solve IMG_2204 --write   fit the camera, report residuals
  node scripts/shoot_views.cjs IMG_2204 --pose           render through the solved camera
  python3 scripts/photo_pose.py overlay IMG_2204 [--task=<id>]

Each point is {"pixel": [u, v], "ref": ..., "use": "control" | "check"}. Controls fit the
camera; checks are held out and measure the model. {"vertical": [[u, v], [u, v]]} marks two
pixels on any upright edge (a wall corner, door frame, post): it fixes tilt without any model
geometry. Photos given the same "station" were taken from one spot and are solved together,
sharing position and lens. "heightPrior": [y, sigma] on a photo holds the camera's height
(for instance a surveyed roof plus eye level). A ref names a model point or line:
  building:<id>:<i>:top|base       a footprint corner at roof or ground height
  building:<id>:<i>:corner         the vertical edge at that corner (pixel anywhere on it)
  building:<id>:<i>-<j>:top|base   the footprint edge between two corners
  pool:<id>                        the traced water edge (pixel anywhere on it)
  world:x,y,z                      any point in scene metres
Footprints are registry outlines; roof heights are floors x 3 m, so top corners also test that.
The model export comes from the running scene (src/photo-camera.ts) so heights match the render.
Needs numpy and Pillow.
"""
import argparse
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
POSES = ROOT / 'data/photo_poses.json'
MODEL = ROOT / 'layout-checks.local/model.json'
VIEWS = ROOT / 'layout-checks.local/views'
OUT = ROOT / 'layout-checks.local/pose'
# Full-frame diagonal: a 35 mm-equivalent focal length f35 is f35 / 43.27 of the image diagonal.
DIAGONAL_35 = 43.27
# Phone main cameras are about 24-26 mm equivalent; the prior is loose so zoomed shots still fit.
F35_PRIOR, F35_SIGMA = 24.0, 0.15
EYE = {'ground': 1.6, 'upper-floor': 5.0, 'roof': 7.5}
# A match is weighted by how far off it may be: picking the pixel, plus the model's own uncertainty
# in metres seen at that distance. Pool outlines were traced from a 0.24 m/px aerial; footprints are
# registry outlines; an upright edge uses no model geometry at all.
PICK_SIGMA = 3.0
# Traced walls, steps and beds were placed from photos and the aerial, so are trusted less than
# registry corners; mapped street edges are centre lines plus an approximate width.
MODEL_SIGMA = {'pool': 0.3, 'building': 0.2, 'world': 0.1, 'vertical': 0.0, 'edge': 0.3, 'road': 0.6}
ROLL_SIGMA = 5.0


def file_id(name):
    return name if name.endswith('.jpg') else name + '.jpg'


def load_poses():
    return json.loads(POSES.read_text())


def save_poses(data):
    POSES.write_text(json.dumps(data, indent=1, ensure_ascii=False) + '\n')


def rotation(yaw, pitch, roll):
    """World-from-camera rotation, matching three.js Euler order YXZ with (pitch, -yaw, roll)."""
    a, b, c = math.radians(-yaw), math.radians(pitch), math.radians(roll)
    ry = np.array([[math.cos(a), 0, math.sin(a)], [0, 1, 0], [-math.sin(a), 0, math.cos(a)]])
    rx = np.array([[1, 0, 0], [0, math.cos(b), -math.sin(b)], [0, math.sin(b), math.cos(b)]])
    rz = np.array([[math.cos(c), -math.sin(c), 0], [math.sin(c), math.cos(c), 0], [0, 0, 1]])
    return ry @ rx @ rz


def to_camera(pose, points):
    """Camera-space coordinates (three.js looks down -z, y up)."""
    r = rotation(pose['yaw'], pose['pitch'], pose['roll'])
    return (np.asarray(points, float) - [pose['x'], pose['y'], pose['z']]) @ r


def project(pose, size, points):
    """Pixels and depth in front of the camera; depth <= 0 is behind it."""
    c = to_camera(pose, points)
    depth = -c[:, 2]
    safe = np.where(depth > 1e-6, depth, np.nan)
    u = size[0] / 2 + pose['f'] * c[:, 0] / safe
    v = size[1] / 2 - pose['f'] * c[:, 1] / safe
    return np.stack([u, v], 1), depth


def project_segments(pose, size, segments, near=0.3):
    """Segments (two arrays of end points) cut to the part in front of the camera, as pixels and depths."""
    a, b = (to_camera(pose, ends) for ends in segments)
    da, db = -a[:, 2], -b[:, 2]
    keep = (da >= near) | (db >= near)
    a, b, da, db = a[keep], b[keep], da[keep], db[keep]
    with np.errstate(divide='ignore', invalid='ignore'):
        ta = np.where(da < near, (near - da) / (db - da), 0)[:, None]
        tb = np.where(db < near, (near - db) / (da - db), 0)[:, None]
    a, b = a + (b - a) * ta, b + (a - b) * tb
    pixels = lambda c: np.stack([size[0] / 2 + pose['f'] * c[:, 0] / -c[:, 2], size[1] / 2 - pose['f'] * c[:, 1] / -c[:, 2]], 1)
    return pixels(a), pixels(b), -a[:, 2], -b[:, 2]


def model_index():
    if not MODEL.exists():
        raise SystemExit(f'{MODEL.relative_to(ROOT)} is missing: run node scripts/shoot_views.cjs <photo> --pose first')
    model = json.loads(MODEL.read_text())
    EXTRA['edges'] = {f['id']: np.array(f['segments'], float).reshape(-1, 6) for f in model.get('features', [])}
    EXTRA['roads'] = {r['id']: np.array(r['line'], float) for r in model.get('roads', [])}
    return model, {b['id']: b for b in model['buildings']}, {p['id']: p for p in model['pools']}


# Traced features and street edges from the export, filled in by model_index().
EXTRA = {'edges': {}, 'roads': {}}


def target(point, buildings, pools):
    """What a recorded point is matched to, and its pixel (two pixels for an upright edge)."""
    if 'vertical' in point:
        return ('vertical', None), np.array(point['vertical'], float)
    return resolve(point['ref'], buildings, pools), np.array(point['pixel'], float)


def resolve(ref, buildings, pools):
    """A ref as ('point', xyz) or ('line', (start points, end points))."""
    kind, _, rest = ref.partition(':')
    if kind == 'world':
        return 'point', np.array([float(v) for v in rest.split(',')])
    if kind == 'pool':
        ring = np.array(pools[rest]['ring'], float)
        return 'line', (ring, np.roll(ring, -1, 0))
    if kind == 'edge':
        # edge:<feature> is any rendered edge of that feature; edge:<feature>@<k> one segment of it.
        feature, _, k = rest.partition('@')
        segments = EXTRA['edges'][feature][[int(k)] if k else slice(None)]
        return 'line', (segments[:, :3], segments[:, 3:])
    if kind == 'road':
        line = EXTRA['roads'][rest]
        return 'line', (line[:-1], line[1:])
    if kind != 'building':
        raise SystemExit(f'unknown ref {ref}')
    bid, corner, level = rest.rsplit(':', 2)
    b = buildings[bid]
    at = lambda i, y: np.array([b['ring'][i][0], y, b['ring'][i][1]], float)
    height = {'top': b['top'], 'base': b['base']}
    if level == 'corner':
        i = int(corner)
        return 'line', (np.array([at(i, b['base'])]), np.array([at(i, b['top'])]))
    if corner == '*':
        # building:<id>:*:top|base is anywhere on that building's roofline or base.
        ring = np.array([at(i, height[level]) for i in range(len(b['ring']))])
        return 'line', (ring, np.roll(ring, -1, 0))
    if '-' in corner:
        i, j = (int(v) for v in corner.split('-'))
        return 'line', (np.array([at(i, height[level])]), np.array([at(j, height[level])]))
    return 'point', at(int(corner), height[level])


def residual(pose, size, target, pixel):
    """Image error in pixels (vector for points, distance for lines) and the depth it sits at."""
    kind, geometry = target
    if kind == 'vertical':
        # The image of an upright line runs to the vanishing point of verticals; measure the second pixel off it.
        d = rotation(pose['yaw'], pose['pitch'], pose['roll'])[1]
        vanish = np.array([size[0] / 2 * -d[2] + pose['f'] * d[0], size[1] / 2 * -d[2] - pose['f'] * d[1], -d[2]])
        line = np.cross([*pixel[0], 1.0], vanish)
        return np.array([abs(line @ [*pixel[1], 1.0]) / max(math.hypot(line[0], line[1]), 1e-12)]), math.nan
    if kind == 'point':
        uv, depth = project(pose, size, [geometry])
        if not depth[0] > 0.3:
            return np.array([1e3, 1e3]), 1.0
        return uv[0] - pixel, depth[0]
    ua, ub, da, db = project_segments(pose, size, geometry)
    if not len(ua):
        return np.array([1e3]), 1.0
    d = ub - ua
    t = np.clip(np.einsum('ij,ij->i', pixel - ua, d) / np.maximum(np.einsum('ij,ij->i', d, d), 1e-9), 0, 1)
    distance = np.linalg.norm(ua + d * t[:, None] - pixel, axis=1)
    k = int(np.argmin(distance))
    return np.array([distance[k]]), da[k] + (db[k] - da[k]) * t[k]


def f_from_f35(f35, size):
    return f35 / DIAGONAL_35 * math.hypot(*size)


def solve(group):
    """Fits the cameras of a station: photos taken from one spot share position and lens, each keeps its own aim.

    group is a list of (record, targets, manifest entry). Returns a (pose, sigma) per photo.
    """
    for record, targets, _ in group:
        controls = [t for (t, _), p in zip(targets, record['points']) if p.get('use', 'control') == 'control']
        if sum(1 if t[0] == 'point' else 0.5 for t in controls) < (4 if len(group) == 1 else 3):
            raise SystemExit('need at least four control points per photo, or three at a shared station (a line counts as half)')
    lenses = {m['focal35'] for _, _, m in group if 'focal35' in m}
    # A focal length read from the original's EXIF is held tightly; otherwise a phone main camera is assumed loosely.
    f35_prior, f_sigma = (lenses.pop(), 0.02) if len(lenses) == 1 else (F35_PRIOR, F35_SIGMA)
    pins = [(m['x'], m['z'], max(3.0, 2 * (m.get('accuracy') or 5.0))) for _, _, m in group if 'x' in m]
    heights = [tuple(record['heightPrior']) for record, _, _ in group if 'heightPrior' in record][:1]
    controls = [[(*t, MODEL_SIGMA[p.get('ref', 'vertical').split(':')[0]]) for t, p in zip(targets, record['points']) if p.get('use', 'control') == 'control']
                for record, targets, _ in group]

    # Shared x, y, z and log 35 mm-equivalent focal length (logarithm keeps it positive), then yaw, pitch, roll per photo.
    def poses(vector):
        return [{'x': vector[0], 'y': vector[1], 'z': vector[2], 'yaw': vector[4 + 3 * k], 'pitch': vector[5 + 3 * k],
                 'roll': vector[6 + 3 * k], 'f': f_from_f35(math.exp(vector[3]), record['image'])} for k, (record, _, _) in enumerate(group)]

    def weigh(vector):
        """Pixel uncertainty of each match, from the distances seen through these cameras. It is held fixed
        while fitting, so the fit cannot shed matches by moving the camera up close to them."""
        return [[math.hypot(PICK_SIGMA, sigma_m * pose['f'] / residual(pose, record['image'], t, px)[1]) if sigma_m else PICK_SIGMA
                 for t, px, sigma_m in points] for pose, (record, _, _), points in zip(poses(vector), group, controls)]

    weights = None

    def residuals(vector):
        out = []
        for pose, (record, _, _), points, sigmas in zip(poses(vector), group, controls, weights):
            for (t, px, _), sigma in zip(points, sigmas):
                out.append(residual(pose, record['image'], t, px)[0] / sigma)
            out.append(np.array([pose['roll'] / ROLL_SIGMA]))
        out.append(np.array([(vector[3] - math.log(f35_prior)) / f_sigma]))
        # A measured eye height, e.g. the surveyed roof the photos were taken from plus eye level.
        out += [np.array([(vector[1] - h) / sigma]) for h, sigma in heights]
        out += [np.array([(vector[0] - x) / sigma, (vector[2] - z) / sigma]) for x, z, sigma in pins]
        return np.concatenate(out)

    def fit(start, rounds=300):
        nonlocal weights
        x = np.array(start, float)
        weights = weigh(x)
        steps = np.array([0.01, 0.01, 0.01, 0.0001] + [0.01] * 3 * len(group))
        lam, r = 1e-3, residuals(x)
        cost = float(r @ r)
        for _ in range(rounds):
            jac = np.stack([(residuals(x + e) - residuals(x - e)) / (2 * e.sum()) for e in np.diag(steps)], 1)
            a, g = jac.T @ jac, jac.T @ r
            while True:
                dx = -np.linalg.solve(a + lam * np.diag(np.diag(a) + 1e-9), g)
                trial = residuals(x + dx)
                if trial @ trial < cost:
                    x, r, cost, lam = x + dx, trial, float(trial @ trial), max(lam / 3, 1e-9)
                    break
                lam *= 4
                if lam > 1e9:
                    return x, cost, jac
            if np.abs(dx).max() < 1e-6:
                break
        return x, cost, jac

    first = [record.get('solved', {}).get('pose') or record['initial'] for record, _, _ in group]
    position = [float(np.mean([pose[k] for pose in first])) for k in ('x', 'y', 'z')]
    f35 = float(np.mean([pose['f'] / math.hypot(*record['image']) * DIAGONAL_35 for pose, (record, _, _) in zip(first, group)]))
    starts = [position + [math.log(f35)] + [v for pose in first for v in (pose['yaw'] + dy, pose['pitch'] + dp, 0)]
              for dy in (0, -15, 15, -30, 30) for dp in (0, -15, 15)]
    # A short fit from each start, then the best one to convergence, then again with weights from that result.
    x, cost, jac = fit(fit(min((fit(s, 25) for s in starts), key=lambda result: result[1])[0])[0])
    dof = max(1, len(residuals(x)) - len(x))
    spread = np.sqrt(np.clip(np.diag(np.linalg.pinv(jac.T @ jac) * max(1.0, cost / dof)), 0, None))
    results = []
    for k, pose in enumerate(poses(x)):
        sigma = {'x': spread[0], 'y': spread[1], 'z': spread[2], 'f': spread[3] * pose['f'],
                 'yaw': spread[4 + 3 * k], 'pitch': spread[5 + 3 * k], 'roll': spread[6 + 3 * k]}
        results.append((pose, sigma))
    return results


def report(record, targets, pose):
    size = record['image']
    rows = []
    for (t, pixel), point in zip(targets, record['points']):
        error, depth = residual(pose, size, t, pixel)
        px = float(np.linalg.norm(error))
        row = {'ref': point.get('ref', 'vertical'), 'use': point.get('use', 'control'), 'px': round(px, 1)}
        if math.isfinite(depth):
            row.update(m=round(px * depth / pose['f'], 2), depth=round(float(depth), 1))
        rows.append(row)
    rms = lambda use, key: (round(math.sqrt(sum(r[key] ** 2 for r in measured) / len(measured)), 2)
                            if (measured := [r for r in rows if r['use'] == use and key in r]) else None)
    return rows, rms('control', 'px'), rms('check', 'px'), rms('check', 'm')


def manifest():
    return {p['file']: p for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}


def command_init(ids, force):
    data, photos = load_poses(), manifest()
    catalog = {e['id']: e for e in json.loads((ROOT / 'refs/catalog.json').read_text())}
    for name in map(file_id, ids):
        if name in data['photos'] and not force:
            print(name, 'already has a pose; --force replaces its starting pose only')
            continue
        p, entry = photos[name], catalog.get(name, {})
        size = list(Image.open(ROOT / 'public/photos-ref' / name).size)
        look = entry.get('looksAt') if entry.get('looksAtBasis') == 'reviewed' else None
        yaw = math.degrees(math.atan2(look[0] - p['x'], -(look[1] - p['z']))) if look else p.get('heading', 0)
        viewpoint = entry.get('viewpoint', 'ground')
        initial = {'x': p['x'], 'y': EYE.get(viewpoint, 1.6), 'z': p['z'], 'yaw': round(yaw % 360, 1),
                   'pitch': 0.0 if viewpoint == 'ground' else -20.0, 'roll': 0.0, 'f': round(f_from_f35(p.get('focal35', F35_PRIOR), size), 1)}
        record = data['photos'].setdefault(name, {'image': size, 'points': []})
        lens = f"{p['focal35']:g} mm-equivalent lens from EXIF" if 'focal35' in p else f"assumed {F35_PRIOR:g} mm-equivalent lens"
        record.update(image=size, initial=initial, initialBasis=f"phone pin; {'reviewed looksAt' if look else 'phone heading'}; {viewpoint} eye height; {lens}")
        print(name, initial)
    save_poses(data)


def font(size):
    try:
        return ImageFont.truetype('DejaVuSans-Bold.ttf', size)
    except OSError:
        return ImageFont.load_default()


def command_guide(name, initial):
    data = load_poses()
    record = data['photos'][file_id(name)]
    pose = record['initial'] if initial or 'solved' not in record else record['solved']['pose']
    model, buildings, pools = model_index()
    size = record['image']
    image = Image.open(ROOT / 'public/photos-ref' / file_id(name)).convert('RGB')
    draw, small = ImageDraw.Draw(image), font(15)
    legend = {}
    for pool in model['pools']:
        for a, b in zip(*project_segments(pose, size, resolve('pool:' + pool['id'], buildings, pools)[1])[:2]):
            draw.line([tuple(a), tuple(b)], fill=(0, 220, 255), width=3)
    # Traced features (E<n>, any colour) and street edges (R<n>, yellow) within 40 m, labelled on their longest visible segment.
    lines = [(f'E{n}', 'edge:' + f['id'], f['id']) for n, f in enumerate(model.get('features', []))] + \
            [(f'R{n}', 'road:' + r['id'], r['id']) for n, r in enumerate(model.get('roads', []))]
    for code, ref, feature in lines:
        ua, ub, da, db = project_segments(pose, size, resolve(ref, buildings, pools)[1])
        keep = (np.maximum(da, db) < 40) & ((np.abs(ua - [size[0] / 2, size[1] / 2]) < size).all(1) | (np.abs(ub - [size[0] / 2, size[1] / 2]) < size).all(1))
        if not keep.any():
            continue
        colour = (255, 230, 0) if code[0] == 'R' else tuple(int(v) for v in np.random.default_rng(abs(hash(feature)) % 2**32).integers(60, 255, 3))
        for a, b in zip(ua[keep], ub[keep]):
            draw.line([tuple(a), tuple(b)], fill=colour, width=2)
        longest = np.argmax(np.where(keep, np.hypot(*(ub - ua).T), -1))
        mid = (ua[longest] + ub[longest]) / 2
        if 0 <= mid[0] < size[0] and 0 <= mid[1] < size[1]:
            legend[code] = ref
            draw.text(tuple(mid + [4, -8]), code, fill=colour, font=small, stroke_width=2, stroke_fill=(0, 0, 0))
    for n, b in enumerate(model['buildings']):
        for i in range(len(b['ring'])):
            for level, colour in (('top', (255, 40, 40)), ('base', (255, 200, 0))):
                if b['floors'] == 0 and level == 'top':
                    continue
                uv, depth = project(pose, size, [resolve(f"building:{b['id']}:{i}:{level}", buildings, pools)[1]])
                u, v = uv[0]
                if not (depth[0] > 0.5 and depth[0] < 90 and 0 <= u < size[0] and 0 <= v < size[1]):
                    continue
                code = f'{n}.{i}{level[0]}'
                legend[code] = f"building:{b['id']}:{i}:{level}"
                draw.ellipse([u - 4, v - 4, u + 4, v + 4], outline=colour, width=2)
                draw.text((u + 5, v - 8), code, fill=colour, font=small, stroke_width=2, stroke_fill=(0, 0, 0))
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{file_id(name)[:-4]}-guide.jpg"
    image.save(path, quality=90)
    (OUT / f"{file_id(name)[:-4]}-guide.json").write_text(json.dumps(legend, indent=1))
    print(path.relative_to(ROOT), f'{len(legend)} labels: <building>.<corner><t=top|b=base>, E<n> traced features, R<n> street edges; refs in', (OUT / f"{file_id(name)[:-4]}-guide.json").relative_to(ROOT))
    # The same labels on a plan, north up, to tell which corner is which.
    plan_lines = []
    seen = {int(code.split('.')[0]) for code in legend if code[0].isdigit()}
    for code, ref in legend.items():
        if code[0] in 'ER':
            ua_ = resolve(ref, buildings, pools)[1]
            plan_lines += [(code, [(a[0], a[2]), (b[0], b[2])]) for a, b in zip(*ua_)]
    scale, span = 12, 70
    plan = Image.new('RGB', (2 * span * scale, 2 * span * scale), (245, 245, 240))
    pd = ImageDraw.Draw(plan)
    to_plan = lambda x, z: ((x - pose['x'] + span) * scale, (z - pose['z'] + span) * scale)
    for code, pts in plan_lines:
        pd.line([to_plan(*q) for q in pts], fill=(200, 160, 0) if code[0] == 'R' else (120, 60, 160), width=1)
    for code in {c for c, _ in plan_lines}:
        pd.text(to_plan(*[pts for c, pts in plan_lines if c == code][0][0]), code, fill=(120, 0, 120) if code[0] == 'E' else (150, 110, 0), font=font(11))
    at = lambda x, z: ((x - pose['x'] + span) * scale, (z - pose['z'] + span) * scale)
    for pool in model['pools']:
        pd.line([at(x, z) for x, _, z in pool['ring'] + pool['ring'][:1]], fill=(0, 160, 220), width=3)
    for n in sorted(seen):
        b = model['buildings'][n]
        pd.polygon([at(*p) for p in b['ring']], outline=(90, 90, 90), fill=(222, 222, 215))
        cx, cz = np.mean(b['ring'], 0)
        pd.text(at(cx, cz), f"{n} ({b['top'] - b['base']:.1f} m)", fill=(0, 0, 160), font=font(16), anchor='mm')
        for i, p in enumerate(b['ring']):
            pd.text(at(*p), str(i), fill=(200, 0, 0), font=font(12), anchor='mm')
    half = math.atan(size[0] / 2 / pose['f'])
    for turn in (-half, 0, half):
        a = math.radians(pose['yaw']) + turn
        pd.line([at(pose['x'], pose['z']), at(pose['x'] + 60 * math.sin(a), pose['z'] - 60 * math.cos(a))], fill=(255, 0, 0), width=2)
    pd.text((10, 10), f"{file_id(name)}: plan, north up, {scale} px/m; camera and field of view in red; <building> (height) and corner numbers", fill=(0, 0, 0), font=font(16))
    plan.save(OUT / f"{file_id(name)[:-4]}-plan.png")
    print((OUT / f"{file_id(name)[:-4]}-plan.png").relative_to(ROOT))


def command_solve(ids, write):
    data, photos = load_poses(), manifest()
    _, buildings, pools = model_index()
    names = list(dict.fromkeys(map(file_id, ids)))
    # Photos naming the same station are solved together, with the rest of that station.
    stations = {}
    for name in names:
        station = data['photos'][name].get('station')
        members = [n for n, r in data['photos'].items() if station and r.get('station') == station] or [name]
        stations.setdefault(station or name, members)
    for members in stations.values():
        group = [(data['photos'][n], [target(p, buildings, pools) for p in data['photos'][n]['points']], photos.get(n, {})) for n in members]
        for name, (record, targets, pin), (pose, sigma) in zip(members, group, solve(group)):
            rows, control, check, check_m = report(record, targets, pose)
            together = f" (station {record['station']}, solved with {', '.join(m for m in members if m != name)})" if len(members) > 1 else ''
            print(f"\n{name}{together}: x {pose['x']:.2f}±{sigma['x']:.2f}  y {pose['y']:.2f}±{sigma['y']:.2f}  z {pose['z']:.2f}±{sigma['z']:.2f}  "
                  f"yaw {pose['yaw'] % 360:.1f}°  pitch {pose['pitch']:.1f}°  roll {pose['roll']:.1f}°  f {pose['f']:.0f} px "
                  f"({pose['f'] / math.hypot(*record['image']) * DIAGONAL_35:.1f} mm eq.)")
            if 'x' in pin:
                print(f"  pin was {math.hypot(pose['x'] - pin['x'], pose['z'] - pin['z']):.1f} m away (reported ±{pin.get('accuracy')} m)")
            for r in rows:
                where = f"{r['m']:5.2f} m at {r['depth']:5.1f} m" if 'm' in r else 'upright edge   '
                print(f"  {r['use']:7} {r['px']:6.1f} px {where}  {r['ref']}")
            print(f'  rms controls {control} px; held-out checks {check} px, {check_m} m')
            if write:
                record['solved'] = {'pose': {k: round(float(v) % 360 if k == 'yaw' else float(v), 3) for k, v in pose.items()},
                                    'sigma': {k: round(float(v), 3) for k, v in sigma.items()},
                                    'rmsControlPx': control, 'rmsCheckPx': check, 'rmsCheckM': check_m, 'residuals': rows}
    if write:
        save_poses(data)


def command_overlay(name, task):
    data = load_poses()
    record = data['photos'][file_id(name)]
    stem = file_id(name)[:-4]
    render_path = VIEWS / f'{stem}.png'
    if not render_path.exists():
        raise SystemExit(f'{render_path.relative_to(ROOT)} is missing: run node scripts/shoot_views.cjs {stem} --pose')
    _, buildings, pools = model_index()
    pose = record['solved']['pose']
    photo = Image.open(ROOT / 'public/photos-ref' / file_id(name)).convert('RGB')
    render = Image.open(render_path).convert('RGB').resize(photo.size)
    # Softened first, so grass and paving texture do not swamp the outlines.
    edges = render.convert('L').filter(ImageFilter.GaussianBlur(1.5)).filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 12 else 0)
    traced = photo.copy()
    traced.paste((0, 230, 255), mask=edges)
    draw = ImageDraw.Draw(traced)
    for p in record['points']:
        (kind, geometry), pixel = target(p, buildings, pools)
        colour = (40, 255, 80) if p.get('use', 'control') == 'control' else (255, 60, 200)
        if kind == 'vertical':
            draw.line([tuple(pixel[0]), tuple(pixel[1])], fill=colour, width=4)
            continue
        if kind == 'point':
            uv, _ = project(pose, record['image'], [geometry])
            draw.line([tuple(pixel), tuple(uv[0])], fill=(255, 255, 0), width=3)
            draw.ellipse([*(uv[0] - 6), *(uv[0] + 6)], outline=(255, 255, 0), width=3)
        elif len(geometry[0]) <= 2:
            for a, b in zip(*project_segments(pose, record['image'], geometry)[:2]):
                draw.line([tuple(a), tuple(b)], fill=(255, 255, 0), width=3)
        draw.ellipse([*(pixel - 7), *(pixel + 7)], outline=colour, width=3)
    caption = (f"{stem}: render edges (cyan) through the solved camera. Matched pixels: green control, magenta held-out check; "
               f"yellow = model point or edge. Checks {record['solved']['rmsCheckPx']} px / {record['solved']['rmsCheckM']} m rms")
    draw.rectangle([0, 0, photo.size[0], 30], fill=(0, 0, 0))
    draw.text((8, 5), caption, fill=(255, 255, 255), font=font(15))
    blend = Image.blend(photo, render, 0.5)
    sheet = Image.new('RGB', (photo.size[0] * 2, photo.size[1]))
    sheet.paste(traced, (0, 0))
    sheet.paste(blend, (photo.size[0], 0))
    sheet = sheet.resize((sheet.size[0] * 3 // 4, sheet.size[1] * 3 // 4))
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f'{stem}-overlay.jpg'
    sheet.save(path, quality=85)
    print(path.relative_to(ROOT))
    if task:
        review = ROOT / 'docs/reviews' / task
        review.mkdir(parents=True, exist_ok=True)
        sheet.save(review / f'{stem}-overlay.jpg', quality=85)
        print((review / f'{stem}-overlay.jpg').relative_to(ROOT))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('command', choices=['init', 'guide', 'solve', 'overlay'])
    parser.add_argument('photos', nargs='+')
    parser.add_argument('--write', action='store_true', help='solve: store the solved camera in data/photo_poses.json')
    parser.add_argument('--force', action='store_true', help='init: replace an existing starting pose')
    parser.add_argument('--initial', action='store_true', help='guide: project through the starting pose even if solved')
    parser.add_argument('--task', help='overlay: also save under docs/reviews/<task>/')
    args = parser.parse_args()
    if args.command == 'init':
        command_init(args.photos, args.force)
    elif args.command == 'solve':
        command_solve(args.photos, args.write)
    else:
        for name in args.photos:
            command_guide(name, args.initial) if args.command == 'guide' else command_overlay(name, args.task)


if __name__ == '__main__':
    main()
