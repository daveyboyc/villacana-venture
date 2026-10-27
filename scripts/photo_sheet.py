#!/usr/bin/env python3
"""A reading sheet per photo: everything needed to place it, in one image.

  python3 scripts/photo_sheet.py IMG_2559 IMG_2600 [--out layout-checks.local/sheets] [--span 70]

Left, the web copy with a grid labelled in its own pixels (the pixels photo_pose.py matches use).
Right, a north-up aerial crop round the camera: registry outlines, mapped streets with names, the
camera pin with its GPS accuracy circle and field of view along the compass heading, the reviewed
looksAt if any, other photos' pins, and photo-request spots. Above, the facts: date, GPS accuracy,
heading, phone altitude (ground or above), the area under the pin, and the requests it answers.
A pin and a compass are suggestions; the sheet shows them so they can be checked against the
picture, not to say where the subject is. Sheets go to an ignored folder (layout-checks.local).
"""
import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

import area_map
import photo_requests

ROOT = Path(__file__).resolve().parents[1]
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
H = 1200


def font(size, bold=False):
    try:
        return ImageFont.truetype(BOLD if bold else FONT, size)
    except OSError:
        return ImageFont.load_default()


def gridded(path):
    """The photo at H pixels tall, with a grid every tenth labelled in the web copy's pixels."""
    im = Image.open(path).convert('RGB')
    w0, h0 = im.size
    im = im.resize((round(w0 * H / h0), H))
    d, small = ImageDraw.Draw(im, 'RGBA'), font(15)
    for i in range(1, 10):
        x, y = im.width * i / 10, H * i / 10
        d.line((x, 0, x, H), fill=(255, 255, 0, 110), width=1)
        d.line((0, y, im.width, y), fill=(255, 255, 0, 110), width=1)
        d.text((x + 3, 3), str(round(w0 * i / 10)), font=small, fill=(255, 255, 0), stroke_width=2, stroke_fill=(0, 0, 0))
        d.text((3, y + 3), str(round(h0 * i / 10)), font=small, fill=(255, 255, 0), stroke_width=2, stroke_fill=(0, 0, 0))
    return im, (w0, h0)


def aerial(photo, size, span, skeleton, manifest, tags, requests, ground):
    """North-up aerial crop `span` metres wide round the camera."""
    full = Image.open(ROOT / 'public/map/ground.jpg').convert('RGB')
    gx = lambda x: (x - ground['minX']) / (ground['maxX'] - ground['minX']) * full.width
    gz = lambda z: (z - ground['minZ']) / (ground['maxZ'] - ground['minZ']) * full.height
    x0, z0 = photo['x'] - span / 2, photo['z'] - span / 2
    crop = full.crop((round(gx(x0)), round(gz(z0)), round(gx(x0 + span)), round(gz(z0 + span)))).resize((size, size), Image.BICUBIC)
    s = size / span
    P = lambda x, z: ((x - x0) * s, (z - z0) * s)
    d, small, mid = ImageDraw.Draw(crop, 'RGBA'), font(14), font(17, True)
    for b in skeleton['buildings']:
        d.polygon([P(*p) for p in b['ring']], outline=(255, 230, 0, 220))
    for r in skeleton['streets']:
        d.line([P(*p) for p in r['points']], fill=(0, 170, 255, 230), width=3)
        inside = [p for p in r['points'] if abs(p[0] - photo['x']) < span / 2 and abs(p[1] - photo['z']) < span / 2]
        mx, mz = inside[len(inside) // 2] if inside else min(r['points'], key=lambda p: math.dist(p, (photo['x'], photo['z'])))
        if abs(mx - photo['x']) < span / 2 and abs(mz - photo['z']) < span / 2:
            d.text(P(mx, mz), r.get('name') or r['id'], font=small, fill=(255, 255, 255), stroke_width=2, stroke_fill=(0, 60, 120))
    for q in manifest:
        if q is photo or q.get('x') is None or abs(q['x'] - photo['x']) > span / 2 or abs(q['z'] - photo['z']) > span / 2:
            continue
        u, v = P(q['x'], q['z'])
        d.ellipse((u - 3, v - 3, u + 3, v + 3), fill=(255, 255, 255, 200))
        d.text((u + 4, v - 7), q['file'][4:8], font=small, fill=(255, 255, 255), stroke_width=2, stroke_fill=(0, 0, 0))
    for i, r in enumerate(requests, 1):
        if r['state'] == 'answered' or abs(r['at'][0] - photo['x']) > span / 2 or abs(r['at'][1] - photo['z']) > span / 2:
            continue
        u, v = P(*r['at'])
        d.ellipse((u - 11, v - 11, u + 11, v + 11), fill=(200, 53, 43, 230), outline=(255, 255, 255))
        d.text((u, v), str(i), font=font(13, True), fill=(255, 255, 255), anchor='mm')
    u, v = P(photo['x'], photo['z'])
    acc = (photo.get('accuracy') or 10) * s
    d.ellipse((u - acc, v - acc, u + acc, v + acc), outline=(255, 80, 80, 230), width=2)
    if photo.get('heading') is not None:
        half = math.degrees(math.atan(12 / (photo.get('focal35') or 26)))  # portrait: 24 mm across
        for a in (photo['heading'] - half, photo['heading'], photo['heading'] + half):
            r = math.radians(a)
            d.line((u, v, u + math.sin(r) * size * .45, v - math.cos(r) * size * .45), fill=(255, 60, 60, 255 if a == photo['heading'] else 150), width=3 if a == photo['heading'] else 2)
    look = tags.get(photo['file'], {}).get('looksAt')
    if look:
        lu, lv = P(*look)
        d.line((lu - 9, lv - 9, lu + 9, lv + 9), fill=(255, 0, 255), width=3)
        d.line((lu - 9, lv + 9, lu + 9, lv - 9), fill=(255, 0, 255), width=3)
    d.ellipse((u - 6, v - 6, u + 6, v + 6), fill=(255, 40, 40), outline=(255, 255, 255), width=2)
    d.text((8, 6), f'N up · {span:.0f} m across · red: camera, GPS circle, view · white: other photos · red discs: photo spots',
           font=small, fill=(255, 255, 255), stroke_width=2, stroke_fill=(0, 0, 0))
    d.text((8, size - 26), f'{photo["x"]:.1f}, {photo["z"]:.1f}', font=mid, fill=(255, 255, 255), stroke_width=2, stroke_fill=(0, 0, 0))
    return crop


def sheet(name, out, span):
    manifest = json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())
    manifest = manifest if isinstance(manifest, list) else manifest['photos']
    tags = json.loads((ROOT / 'data/reference_tags.json').read_text())
    skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
    ground = json.loads((ROOT / 'public/map/ground.json').read_text())
    file = name if name.endswith('.jpg') else name + '.jpg'
    photo = next(p for p in manifest if p['file'] == file)
    requests = photo_requests.states()
    pic, (w0, h0) = gridded(ROOT / 'public/photos-ref' / file)
    facts = [f"{file}  taken {photo.get('taken', '?')}  {w0}x{h0} px  lens {photo.get('focal35') or '?'} mm (35 mm equiv.)"]
    if photo.get('x') is None:
        facts.append('No camera pin.')
        side = Image.new('RGB', (H, H), (60, 60, 60))
    else:
        alt = photo.get('altitude')
        where = area_map.classifier(skeleton)(photo['x'], photo['z'])
        facts.append(f"pin {photo['x']:.1f}, {photo['z']:.1f} ±{photo.get('accuracy', '?')} m · heading {photo.get('heading', '?')}° · "
                     f"altitude {alt if alt is not None else '?'} m ({'ground' if alt is not None and alt <= photo_requests.GROUND_MAX_ALTITUDE else 'above ground' if alt is not None else '?'}) · area under pin: {where or 'none'}")
        answers = [f"{r['id']} ({r['state']})" for r in requests if file in r['photos']]
        tag = tags.get(file, {})
        facts.append('answers: ' + (', '.join(answers) or 'no photo request') + (f" · tagged: {tag.get('title')}" if tag.get('title') else ' · not tagged yet'))
        side = aerial(photo, H, span, skeleton, manifest, tags, requests, ground)
    top = 30 * len(facts) + 16
    out_im = Image.new('RGB', (pic.width + side.width + 12, H + top), 'white')
    out_im.paste(pic, (0, top))
    out_im.paste(side, (pic.width + 12, top))
    d = ImageDraw.Draw(out_im)
    for i, line in enumerate(facts):
        d.text((10, 8 + 30 * i), line, font=font(20, i == 0), fill=(0, 0, 0))
    out.mkdir(parents=True, exist_ok=True)
    target = out / file
    out_im.save(target, quality=86)
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('photos', nargs='+')
    parser.add_argument('--out', type=Path, default=ROOT / 'layout-checks.local/sheets')
    parser.add_argument('--span', type=float, default=70, help='metres across the aerial crop')
    args = parser.parse_args()
    for name in args.photos:
        print(sheet(name, args.out, args.span))


if __name__ == '__main__':
    main()
