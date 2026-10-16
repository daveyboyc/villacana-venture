#!/usr/bin/env python3
"""Apply photo reviews from the photo map page to the repo.

python3 scripts/apply_photo_reviews.py <reviews.json | folder of exported review files>

The input is the review documents exported from the photo map's
`reviews` collection (one per photo): {photo, verdict, x, z, heading, note,
pinBefore, gpsAccuracy, updatedAt}. Verdicts:
  correct  the pin is right: the position is kept and marked checked
  moved    Dave placed the camera himself: x, z (map metres) and, if given, heading
  unsure / note   only the note is recorded
Positions go to data/photo_positions.json (keyed by the original HEIC name, the
original GPS kept under `gps`) and straight into public/photos-ref/manifest.json,
so no re-index is needed. Notes go into the photo's `note` in
data/reference_tags.json. Running it twice changes nothing.
Then run assign_photo_map.py and build_references.py.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSITIONS = ROOT / 'data/photo_positions.json'
MANIFEST = ROOT / 'public/photos-ref/manifest.json'
TAGS = ROOT / 'data/reference_tags.json'
CHECKED_ACCURACY = 3.0  # a pin someone who was there has checked, as for the content-checked pins


def apply(reviews: list[dict]) -> list[str]:
    positions = json.loads(POSITIONS.read_text())
    manifest = json.loads(MANIFEST.read_text())
    by_file = {e['file']: e for e in manifest}
    tags = json.loads(TAGS.read_text())
    done = []
    for r in reviews:
        photo, verdict = r['photo'], r.get('verdict')
        jpg = photo + '.jpg'
        entry = by_file.get(jpg)
        if entry is None:
            raise SystemExit(f'{photo}: not in the manifest')
        day = (r.get('updatedAt') or '')[:10]
        if verdict in ('correct', 'moved'):
            gps = entry.get('gps') or {k: entry[k] for k in ('x', 'z', 'accuracy') if k in entry}
            if verdict == 'correct':
                x, z = entry['x'], entry['z']
                basis = f'Confirmed on the photo map by Dave ({day}): the camera pin is right.'
            else:
                x, z = round(r['x'], 1), round(r['z'], 1)
                basis = f'Placed on the photo map by Dave ({day}), who was there; the phone pin was {gps.get("accuracy", "?")} m accuracy.'
            update = {'x': x, 'z': z, 'accuracy': CHECKED_ACCURACY, 'trust': 'checked against photo content', 'locationBasis': basis, 'gps': gps}
            if verdict == 'moved' and r.get('heading') is not None:
                update.update(heading=round(r['heading']) % 360, headingBasis=f'Set on the photo map by Dave ({day})')
            positions[photo + '.HEIC'] = {**positions.get(photo + '.HEIC', {}), **update}
            entry.update(update)
            done.append(f'{photo}: {verdict}')
        note = (r.get('note') or '').strip()
        if note:
            tag = tags.setdefault(jpg, {})
            line = f'Dave ({day}): {note}'
            if note not in (tag.get('note') or ''):
                tag['note'] = f"{tag['note']} {line}" if tag.get('note') else line
                done.append(f'{photo}: note')
    POSITIONS.write_text(json.dumps(positions, indent=1, ensure_ascii=False) + '\n')
    MANIFEST.write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + '\n')
    TAGS.write_text(json.dumps(tags, indent=1, ensure_ascii=False) + '\n')
    return done


if __name__ == '__main__':
    source = Path(sys.argv[1])
    files = sorted(source.rglob('*.json')) if source.is_dir() else [source]
    rows = []
    for f in files:
        data = json.loads(f.read_text())
        for d in data if isinstance(data, list) else [data]:
            rows.append(d.get('data', d))
    for line in apply(rows) or ['nothing to apply']:
        print(line)
