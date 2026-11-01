#!/usr/bin/env python3
"""Comparison artifacts for photos with a solved camera: render, 50% blend and a labelled side-by-side.

  node scripts/shoot_views.cjs IMG_2204 IMG_2205 IMG_2206 --pose --details     render through each solved camera
  python3 scripts/compare_photo.py IMG_2204 IMG_2205 IMG_2206 --task loop-discrepancies

For each photo it reads the render layout-checks.local/views/<photo>.png (the photo's own size, so
pixels line up) and writes to docs/reviews/<task>/:
  <photo>-render.jpg    the model through the solved camera
  <photo>-blend.jpg     photo and render at 50% each
  <photo>-compare.jpg   photo (left) and render (right) with every data/discrepancies.json region seen
                        in that photo outlined and numbered (D<n>, numbered per area, colour by kind),
                        and a key of the numbers below
With --sheet <path> it also writes one image stacking the three side-by-sides, for a quick look.
The photo itself is public/photos-ref/<photo>.jpg. Only public photos can be compared this way:
private references stay in villacana-reference.
"""
import argparse
import json
import sys
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
import discrepancies  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
VIEWS = ROOT / 'layout-checks.local/views'
PHOTOS = ROOT / 'public/photos-ref'
COLOURS = {'missing': (255, 60, 60), 'extra': (255, 170, 0), 'shape': (40, 220, 255), 'position': (255, 60, 230), 'look': (120, 255, 90)}
STATUS_MARK = {'open': '', 'fixed': ' (fixed)', 'closed': ' (closed)', 'wont-fix': " (won't fix)"}
SCALE = 0.75


def font(size, bold=False):
    for name in (('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf'), 'Arial.ttf'):
        for folder in ('/usr/share/fonts/truetype/dejavu', '/usr/share/fonts', '/Library/Fonts'):
            path = Path(folder) / name
            if path.exists():
                return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def mark(image, records, photo):
    """Outline and number each record's region in this photo."""
    draw = ImageDraw.Draw(image)
    label_font = font(26, bold=True)
    for d in records:
        for entry in d['photos']:
            if entry['photo'] != photo:
                continue
            colour = COLOURS[d['kind']]
            box = entry['region']
            dash = d['status'] != 'open'
            if dash:
                for i in range(int(box[0]), int(box[2]), 16):
                    draw.line([(i, box[1]), (min(i + 8, box[2]), box[1])], fill=colour, width=3)
                    draw.line([(i, box[3]), (min(i + 8, box[2]), box[3])], fill=colour, width=3)
                for j in range(int(box[1]), int(box[3]), 16):
                    draw.line([(box[0], j), (box[0], min(j + 8, box[3]))], fill=colour, width=3)
                    draw.line([(box[2], j), (box[2], min(j + 8, box[3]))], fill=colour, width=3)
            else:
                draw.rectangle(box, outline=colour, width=4)
            for p in entry.get('points', []):
                draw.ellipse([p[0] - 5, p[1] - 5, p[0] + 5, p[1] + 5], outline=colour, width=3)
            if entry.get('contact'):
                u, v = entry['contact']
                draw.line([(u - 9, v), (u + 9, v)], fill=(255, 255, 255), width=3)
                draw.line([(u, v - 9), (u, v + 9)], fill=(255, 255, 255), width=3)
                draw.line([(u - 8, v), (u + 8, v)], fill=colour, width=1)
            text = f"D{d['n']}"
            w = draw.textlength(text, font=label_font)
            x, y = box[0], max(0, box[1] - 31)
            draw.rectangle([x, y, x + w + 10, y + 31], fill=(0, 0, 0))
            draw.text((x + 5, y + 1), text, fill=colour, font=label_font)


def key(records, photo, width):
    """The numbers seen in this photo, one line each."""
    lines = []
    for d in records:
        if any(e['photo'] == photo for e in d['photos']):
            where = f" [{d['at'][0]:.1f}, {d['at'][1]:.1f}] ±{d['uncertaintyM']:.1f} m" if d.get('at') else ''
            lines.append((d, f"D{d['n']} {d['kind']}{STATUS_MARK[d['status']]}: {d['description']}"[:400] + where))
    body = font(19)
    wrapped = []
    for d, line in lines:
        for k, part in enumerate(textwrap.wrap(line, width=int(width / 11.2 / 2) - 2)):
            wrapped.append((d, ('    ' if k else '') + part))
    half = (len(wrapped) + 1) // 2
    height = 54 + 25 * half
    sheet = Image.new('RGB', (width, height), (20, 20, 20))
    draw = ImageDraw.Draw(sheet)
    draw.text((12, 10), f'{photo[:-4]}: photo (left) and the model through its solved camera (right). Colour: '
                        'red missing, orange extra, cyan shape, magenta position, green look; dashed = no longer open. '
                        '+ marks the ground-contact pixel cast to the map.', fill=(255, 255, 255), font=font(19, bold=True))
    for i, (d, text) in enumerate(wrapped):
        col, row = divmod(i, half)
        draw.text((12 + col * width // 2, 44 + row * 25), text, fill=COLOURS[d['kind']] if not text.startswith(' ') else (220, 220, 220), font=body)
    return sheet


def compare(photo, task, records):
    stem = photo[:-4]
    render_path = VIEWS / f'{stem}.png'
    if not render_path.exists():
        raise SystemExit(f'{render_path.relative_to(ROOT)} is missing: run node scripts/shoot_views.cjs {stem} --pose --details')
    original = Image.open(PHOTOS / photo).convert('RGB')
    render = Image.open(render_path).convert('RGB')
    if render.size != original.size:
        raise SystemExit(f'{render_path.relative_to(ROOT)} is {render.size}, the photo {original.size}: render with --pose')
    out = ROOT / 'docs/reviews' / task
    out.mkdir(parents=True, exist_ok=True)
    render.save(out / f'{stem}-render.jpg', quality=85)
    Image.blend(original, render, 0.5).save(out / f'{stem}-blend.jpg', quality=85)
    left, right = original.copy(), render.copy()
    mark(left, records, photo)
    mark(right, records, photo)
    w, h = original.size
    pair = Image.new('RGB', (w * 2 + 12, h), (20, 20, 20))
    pair.paste(left, (0, 0))
    pair.paste(right, (w + 12, 0))
    legend = key(records, photo, pair.size[0])
    sheet = Image.new('RGB', (pair.size[0], h + legend.size[1]), (20, 20, 20))
    sheet.paste(pair, (0, 0))
    sheet.paste(legend, (0, h))
    sheet = sheet.resize((int(sheet.size[0] * SCALE), int(sheet.size[1] * SCALE)), Image.LANCZOS)
    sheet.save(out / f'{stem}-compare.jpg', quality=85)
    for name in ('render', 'blend', 'compare'):
        print((out / f'{stem}-{name}.jpg').relative_to(ROOT))
    return sheet


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('photos', nargs='+')
    parser.add_argument('--task', required=True, help='write into docs/reviews/<task>/')
    parser.add_argument('--sheet', type=Path, help='also stack the side-by-sides into this image')
    args = parser.parse_args()
    poses = json.loads((ROOT / 'data/photo_poses.json').read_text())['photos']
    records = discrepancies.numbered(discrepancies.load())
    sheets = []
    for name in args.photos:
        photo = name if name.endswith('.jpg') else name + '.jpg'
        if not (poses.get(photo) or {}).get('solved'):
            raise SystemExit(f'{photo} has no solved camera in data/photo_poses.json')
        sheets.append(compare(photo, args.task, records))
    if args.sheet:
        width = max(s.size[0] for s in sheets)
        stack = Image.new('RGB', (width, sum(s.size[1] for s in sheets)), (20, 20, 20))
        y = 0
        for s in sheets:
            stack.paste(s, (0, y))
            y += s.size[1]
        stack.save(args.sheet, quality=85)
        print(args.sheet)


if __name__ == '__main__':
    main()
