#!/usr/bin/env python3
"""Differences between the model and the photos: data/discrepancies.json (docs/DISCREPANCIES.md).

  python3 scripts/discrepancies.py              list every record, numbered per area
  python3 scripts/discrepancies.py --check      validate the records (build_references.py --check runs this too)

One record per difference seen when the model is rendered through a photo's solved camera and laid
beside and over the photo. A record names the photos and pixel regions that show it, what kind of
difference it is, the model features it concerns (or the feature it proposes), and, where a pixel
shows the thing meeting the ground or a known height, a map position cast through the camera by
scripts/pixel_to_map.py. Fixing and closing them is the photo-to-model loop (docs/PHOTO_LOOP_PRD.md).
"""
import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'data/discrepancies.json'
KINDS = ('missing', 'extra', 'shape', 'position', 'look')
STATUSES = ('open', 'fixed', 'closed', 'wont-fix')
ID = re.compile(r'^[a-z0-9]+(-[a-z0-9]+)*$')
# A feature reference: a model feature in the evidence graph (pool:north, raised_terraces.json:...),
# a prop in data/objects.json (objects.json:o4), a known gap (gap:...) or a proposed new feature (proposed:...).
PREFIXES = ('objects.json:', 'gap:', 'proposed:')


def load(path=PATH):
    return json.loads(Path(path).read_text())['discrepancies']


def numbered(records):
    """Each record with its number within its area (D1, D2...), in file order."""
    count = {}
    out = []
    for d in records:
        count[d['area']] = count.get(d['area'], 0) + 1
        out.append({**d, 'n': count[d['area']]})
    return out


def is_box(region, size):
    return (isinstance(region, list) and len(region) == 4 and all(isinstance(v, (int, float)) for v in region)
            and 0 <= region[0] < region[2] <= size[0] and 0 <= region[1] < region[3] <= size[1])


def is_pixel(p, size):
    return isinstance(p, list) and len(p) == 2 and all(isinstance(v, (int, float)) for v in p) and 0 <= p[0] <= size[0] and 0 <= p[1] <= size[1]


def validate(records, *, areas, references, model_features, objects, gaps, tasks, poses):
    """Problems with the records, as sentences (empty when all is well)."""
    problems, seen = [], set()
    for d in records:
        name = f"discrepancy {d.get('id')!r}"
        if not isinstance(d.get('id'), str) or not ID.match(d['id']):
            problems.append(f'{name}: id must be lower-case words joined by hyphens')
        if d.get('id') in seen:
            problems.append(f'{name}: duplicate id')
        seen.add(d.get('id'))
        if d.get('area') not in areas:
            problems.append(f"{name}: unknown area {d.get('area')!r}")
        if d.get('kind') not in KINDS:
            problems.append(f"{name}: kind must be one of {', '.join(KINDS)}")
        if not (isinstance(d.get('description'), str) and len(d['description']) >= 20):
            problems.append(f'{name}: description must say what differs')
        status = d.get('status')
        if status not in STATUSES:
            problems.append(f"{name}: status must be one of {', '.join(STATUSES)}")
        photos = d.get('photos')
        if not isinstance(photos, list) or not photos:
            problems.append(f'{name}: needs at least one photo with a pixel region')
            photos = []
        for entry in photos:
            photo = entry.get('photo')
            if photo not in references:
                problems.append(f'{name}: photo {photo!r} is not in the catalogue')
                continue
            size = (poses.get(photo) or {}).get('image') or references[photo]
            if not size:
                problems.append(f'{name}: {photo} has no known image size (add it to data/photo_poses.json)')
                continue
            if not is_box(entry.get('region'), size):
                problems.append(f'{name}: {photo} region must be [left, top, right, bottom] pixels inside the {size[0]}x{size[1]} image')
            for p in entry.get('points', []):
                if not is_pixel(p, size):
                    problems.append(f'{name}: {photo} point {p} is not a pixel of the image')
            if 'contact' in entry:
                if not is_pixel(entry['contact'], size):
                    problems.append(f'{name}: {photo} contact {entry["contact"]} is not a pixel of the image')
                if not (poses.get(photo) or {}).get('solved'):
                    problems.append(f'{name}: {photo} contact pixel needs a solved camera in data/photo_poses.json')
                height = entry.get('contactHeight', 'ground')
                if height != 'ground' and not isinstance(height, (int, float)):
                    problems.append(f"{name}: {photo} contactHeight must be 'ground' or a height in metres")
        at = d.get('at')
        if at is not None:
            if not (isinstance(at, list) and len(at) == 2 and all(isinstance(v, (int, float)) for v in at)):
                problems.append(f'{name}: at must be [x, z] map metres or null')
            if not isinstance(d.get('uncertaintyM'), (int, float)) or d['uncertaintyM'] <= 0:
                problems.append(f'{name}: a map position needs uncertaintyM in metres')
        if not d.get('positionBasis'):
            problems.append(f'{name}: positionBasis must say how the position was found, or why there is none')
        if any(e.get('contact') for e in photos) and at is None:
            problems.append(f'{name}: has a contact pixel but no map position: run python3 scripts/pixel_to_map.py --discrepancies --write')
        features = d.get('features')
        if not isinstance(features, list) or not features:
            problems.append(f'{name}: features must list the model features it concerns, or proposed:<what>')
            features = []
        for f in features:
            if f.startswith('objects.json:'):
                if f.split(':', 1)[1] not in objects:
                    problems.append(f'{name}: no object {f} in data/objects.json')
            elif f.startswith('gap:'):
                if f not in gaps:
                    problems.append(f'{name}: no known gap {f} in data/confidence.json')
            elif f.startswith('proposed:'):
                if len(f) < 12:
                    problems.append(f'{name}: {f} must name the proposed feature')
            elif f not in model_features:
                problems.append(f'{name}: {f} is not a model feature in the evidence graph (or objects.json:, gap:, proposed:)')
        if d.get('followUp') is not None and d['followUp'] not in tasks:
            problems.append(f"{name}: followUp {d['followUp']!r} is not a task in data/build_queue.json")
        if status == 'open' and not d.get('followUp'):
            problems.append(f'{name}: an open discrepancy needs a followUp task')
        if status == 'wont-fix' and not d.get('reason'):
            problems.append(f'{name}: wont-fix needs a reason (whose decision and why)')
        fix = d.get('fix') or {}
        if status in ('fixed', 'closed') and not (fix.get('evidence') and fix.get('note')):
            problems.append(f'{name}: {status} needs fix.evidence (re-renders, residuals) and fix.note')
        for path in fix.get('evidence', []):
            if not (ROOT / path).exists():
                problems.append(f'{name}: fix evidence {path} is not committed')
        reviewer = d.get('reviewer')
        if status == 'closed':
            if not (isinstance(reviewer, dict) and reviewer.get('id') and reviewer.get('date')):
                problems.append(f'{name}: closed needs a reviewer {{id, date, note}}')
            elif reviewer['id'] == d.get('author'):
                problems.append(f'{name}: the reviewer must not be the author')
        try:
            date.fromisoformat(d.get('created', ''))
        except (TypeError, ValueError):
            problems.append(f'{name}: created must be a YYYY-MM-DD date')
        if not d.get('author'):
            problems.append(f'{name}: author is required')
    return problems


def context():
    """What the records are checked against, read from the repository."""
    load_json = lambda p: json.loads((ROOT / p).read_text())
    graph = load_json('refs/graph.json')
    catalog = load_json('refs/catalog.json')
    return {
        'areas': {a['id'] for a in load_json('data/areas.json')['areas']},
        'references': {e['id']: None for e in catalog},
        'model_features': {n['featureId'] for n in graph['nodes'] if n['kind'] == 'model-feature'},
        'objects': {o['id'] for o in load_json('data/objects.json')},
        'gaps': {g['id'] for g in load_json('data/confidence.json')['gaps']},
        'tasks': {t['id'] for t in load_json('data/build_queue.json')['tasks']},
        'poses': load_json('data/photo_poses.json')['photos'],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    records = load()
    problems = validate(records, **context())
    import pixel_to_map
    problems += pixel_to_map.update_discrepancies(quiet=True)
    if not args.check:
        for d in numbered(records):
            where = f"{d['at']} ± {d['uncertaintyM']} m" if d.get('at') else 'no position'
            print(f"{d['area']} D{d['n']:<3} {d['status']:8} {d['kind']:8} {d['id']:44} {where}")
    for p in problems:
        print(' -', p)
    if problems:
        sys.exit(1)


if __name__ == '__main__':
    main()
