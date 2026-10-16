#!/usr/bin/env python3
"""Build the data for the photo map page (photos.html): public/photo-map.json.

python3 scripts/build_photo_map.py            # data only (runs in the site build)
python3 scripts/build_photo_map.py --thumbs   # also make missing thumbnails (needs Pillow)

Reads the site plan (public/map/skeleton.json), the reference catalogue
(refs/catalog.json, from build_references.py) and the areas. Coordinates are
written in the turned frame the game's overview uses (sea at the bottom). Lane
coverage counts, for each ~6 m stretch of every lane, how many photos see it: a
ground photo with a heading sees about 20 m along the way it points; a roof or
upper-floor photo sees round the point it is aimed at (its looksAt).
"""
from __future__ import annotations
import argparse
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/photo-map.json'
THUMBS = ROOT / 'public/photos-ref/thumbs'
THUMB_EDGE = 360


def rings(v):
    if isinstance(v, dict):
        for k in ('ring', 'polygon', 'points'):
            if k in v:
                return [v[k]]
        return []
    if isinstance(v, list) and v and isinstance(v[0][0], (int, float)):
        return [v]
    if isinstance(v, list):
        return [x for y in v for x in rings(y)]
    return []


def quality(cam: dict) -> str:
    """The pin's colour on the map: checked by eye, or the phone's GPS accuracy class."""
    if 'x' not in cam:
        return 'none'
    if (cam.get('trust') or 'unplaced') != 'phone location':
        return 'checked'
    acc = cam.get('accuracy')
    if acc is None or acc > 10:
        return 'poor'
    return 'fair' if acc > 5 else 'good'


def build() -> dict:
    sk = json.loads((ROOT / 'public/map/skeleton.json').read_text())
    a = math.radians(sk['viewRotation'])
    C, S = math.cos(a), math.sin(a)
    T = lambda p: [round(p[0] * C - p[1] * S, 1), round(p[0] * S + p[1] * C, 1)]
    catalog = json.loads((ROOT / 'refs/catalog.json').read_text())
    areas = json.loads((ROOT / 'data/areas.json').read_text())['areas']
    geo = {'rotation': sk['viewRotation'],
           'buildings': [{'r': [T(p) for p in b['ring']], 'f': b['floors']} for b in sk['buildings']],
           'pools': [{'id': p['id'], 'r': [T(q) for q in p['ring']]} for p in sk['pools']],
           'roads': [{'id': r['id'], 'p': [T(q) for q in r['points']], 'w': r.get('width', 1.2)} for r in sk['boundaryReference']['roads']]}
    sf = sk['seafront']
    for k in ('beach', 'sea'):
        geo[k] = [[T(p) for p in r] for r in rings(sf[k])]
    geo['paseo'] = [T(p) for p in sf['paseo']['points']]
    photos = []
    for e in catalog:
        if e['kind'] != 'phone-photo':
            continue
        cam = e.get('camera') or {}
        photos.append({'id': e['id'][:-4], 'f': e['id'], 't': e['title'], 'o': e.get('observation') or '', 'n': e.get('note'),
                       's': e['shows'], 'v': e.get('viewpoint'), 'u': e['useFor'], 'sub': e.get('subject'), 'url': e.get('originalUrl'),
                       'c': T([cam['x'], cam['z']]) if 'x' in cam else None, 'h': cam.get('heading'), 'a': cam.get('accuracy'),
                       'q': quality(cam), 'tr': cam.get('trust') or 'unplaced', 'l': T(e['looksAt']) if e.get('looksAt') else None})
    rays = []
    for p in photos:
        if not p['c']:
            continue
        if p['v'] == 'ground' and p['h'] is not None:
            H = math.radians(p['h'] + sk['viewRotation'])
            dx, dz = math.sin(H), -math.cos(H)
            rays.append([[p['c'][0] + dx * d, p['c'][1] + dz * d] for d in range(0, 21, 2)])
        else:
            rays.append([p['l'] or p['c']])
    cov = []
    for r in geo['roads']:
        P, segs = r['p'], []
        for (x0, z0), (x1, z1) in zip(P, P[1:]):
            n = max(1, int(math.hypot(x1 - x0, z1 - z0) // 6))
            for k in range(n):
                ax, az = x0 + (x1 - x0) * k / n, z0 + (z1 - z0) * k / n
                bx, bz = x0 + (x1 - x0) * (k + 1) / n, z0 + (z1 - z0) * (k + 1) / n
                mx, mz = (ax + bx) / 2, (az + bz) / 2
                c = sum(any(math.hypot(q[0] - mx, q[1] - mz) <= 6 for q in ray) for ray in rays)
                segs.append([round(ax, 1), round(az, 1), round(bx, 1), round(bz, 1), c])
        cov.append({'id': r['id'], 's': segs})
    geo['cov'] = cov
    return {'geo': geo, 'photos': photos, 'areas': [{'id': x['id'], 'name': x['name'], 'sum': x.get('summary', '')} for x in areas]}


def thumbnails(photos: list[dict]) -> int:
    from PIL import Image
    THUMBS.mkdir(parents=True, exist_ok=True)
    made = 0
    for p in photos:
        out = THUMBS / p['f']
        if out.exists():
            continue
        with Image.open(ROOT / 'public/photos-ref' / p['f']) as im:
            im = im.convert('RGB')
            im.thumbnail((THUMB_EDGE, THUMB_EDGE))
            im.save(out, 'JPEG', quality=70)
        made += 1
    return made


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--thumbs', action='store_true', help='make missing thumbnails in public/photos-ref/thumbs')
    args = parser.parse_args()
    data = build()
    if args.thumbs:
        print(f'{thumbnails(data["photos"])} thumbnails made')
    missing = [p['f'] for p in data['photos'] if not (THUMBS / p['f']).exists()]
    if missing:
        raise SystemExit(f'{len(missing)} photos have no thumbnail (run with --thumbs): {", ".join(missing[:5])}')
    OUT.write_text(json.dumps(data, separators=(',', ':'), ensure_ascii=False) + '\n')
    print(f"Photo map: {len(data['photos'])} photos, {sum(len(r['s']) for r in data['geo']['cov'])} lane stretches")


if __name__ == '__main__':
    main()
