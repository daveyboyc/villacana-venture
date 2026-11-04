#!/usr/bin/env python3
"""Merge reviewed photo tags from patch files into the tag and annotation data.

  python3 scripts/apply_photo_tags.py PATCH.json [PATCH.json ...] [--build-notes OUT.md]

A patch is {"IMG_xxxx.jpg": {title, observation, shows, viewpoint, useFor, looksAt?, subject?,
note?, buildOpportunity?}} written by an agent that looked at the photo (docs/PHOTO_MAP_WORKFLOW.md,
step 3). Entries are validated against data/areas.json and public/photos-ref/manifest.json: unknown
files, area ids, topic ids or viewpoints stop the run without writing anything. Existing tags are
never overwritten. title/shows/viewpoint/useFor/looksAt/subject/note go to data/reference_tags.json;
title/observation go to data/photo_annotations.json. buildOpportunity lines are not stored in the data:
they go to --build-notes for a person or agent to turn into queue tasks.
"""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TAGS = ROOT / 'data/reference_tags.json'
NOTES = ROOT / 'data/photo_annotations.json'
VIEWPOINTS = {'ground', 'upper-floor', 'roof', 'aerial', 'map'}
TAG_KEYS = ('title', 'shows', 'viewpoint', 'useFor', 'looksAt', 'subject', 'note')


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('patches', type=Path, nargs='+')
    parser.add_argument('--build-notes', type=Path)
    args = parser.parse_args()

    areas = json.loads((ROOT / 'data/areas.json').read_text())
    area_ids = {a['id'] for a in areas['areas']}
    topic_ids = {t['id'] for t in areas.get('topics', [])}
    files = {e['file'] for e in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
    tags = json.loads(TAGS.read_text())
    notes = json.loads(NOTES.read_text())

    errors, added, build = [], 0, []
    for path in args.patches:
        for name, p in json.loads(path.read_text()).items():
            if name not in files:
                errors.append(f'{name}: not in the manifest')
                continue
            if name in tags:
                continue
            bad = [s for s in p.get('shows', []) if s not in area_ids] + [u for u in p.get('useFor', []) if u not in topic_ids and u not in area_ids]
            if bad or not p.get('shows') or p.get('viewpoint') not in VIEWPOINTS or not p.get('title'):
                errors.append(f'{name}: invalid shows/useFor/viewpoint/title {bad}')
                continue
            if 'looksAt' in p and not (isinstance(p['looksAt'], list) and len(p['looksAt']) == 2):
                errors.append(f'{name}: looksAt must be [x, z]')
                continue
            tags[name] = {k: p[k] for k in TAG_KEYS if p.get(k)}
            ann = notes.setdefault(name, {})
            ann.setdefault('title', p['title'])
            if p.get('observation'):
                ann.setdefault('observation', p['observation'])
            ann.setdefault('visualReview', 'observed')
            if p.get('buildOpportunity'):
                build.append(f"- {name} ({', '.join(p['shows'])}): {p['buildOpportunity']}")
            added += 1
    if errors:
        raise SystemExit('Nothing written:\n  ' + '\n  '.join(errors))
    TAGS.write_text(json.dumps(tags, indent=1, ensure_ascii=False) + '\n')
    NOTES.write_text(json.dumps(notes, indent=2, ensure_ascii=False) + '\n')
    if args.build_notes:
        args.build_notes.write_text('# Build opportunities from newly tagged photos\n\n' + '\n'.join(sorted(build)) + '\n')
    print(f'{added} photos tagged, {len(build)} build opportunities')


if __name__ == '__main__':
    main()
