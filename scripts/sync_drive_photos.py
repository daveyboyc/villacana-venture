#!/usr/bin/env python3
"""Compare a Google Drive folder listing with the photo map, and prepare intake.

  python3 scripts/sync_drive_photos.py LISTING.json [LISTING.json ...] [--originals DIR]
                                       [--stage DIR] [--record-links]

A listing is the JSON an agent gets from the Drive connector's search_files on the
"Villacana" folder ({files: [{id, title, ...}]}); pass every page. The script is
deterministic: it lists the photos Drive has that public/photos-ref/manifest.json does not
(the intake backlog), says which of them still need downloading (not in --originals),
copies the ones already downloaded into --stage (a private folder outside both repos, ready
for index_photos.py), and with --record-links writes each Drive link into
data/photo_annotations.json as `originalUrl`. Download missing ones with
download_file_content and scripts/import_drive_downloads.py, then follow
docs/PHOTO_MAP_WORKFLOW.md ("Intake for a new Drive batch").
"""
import argparse
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'public/photos-ref/manifest.json'
ANNOTATIONS = ROOT / 'data/photo_annotations.json'
PHOTO_SUFFIXES = ('.heic', '.heif', '.jpg', '.jpeg', '.png')


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('listings', type=Path, nargs='+')
    parser.add_argument('--originals', type=Path, help='private folder of downloaded originals')
    parser.add_argument('--stage', type=Path, help='copy downloaded, not-yet-indexed originals here')
    parser.add_argument('--record-links', action='store_true', help='write Drive links to photo_annotations.json')
    args = parser.parse_args()

    drive = {}
    for path in args.listings:
        for f in json.loads(path.read_text())['files']:
            if f['title'].lower().endswith(PHOTO_SUFFIXES):
                drive[f['title']] = f['id']
    indexed = {e['file'].rsplit('.', 1)[0].casefold() for e in json.loads(MANIFEST.read_text())}
    backlog = sorted(t for t in drive if t.rsplit('.', 1)[0].casefold() not in indexed)
    have = {p.name for p in args.originals.iterdir()} if args.originals else set()
    todo = [t for t in backlog if t not in have]
    print(f'{len(drive)} photos in Drive, {len(indexed)} indexed, {len(backlog)} not yet indexed, {len(todo)} still to download')
    for t in todo:
        print('  download', t, drive[t])

    if args.stage and args.originals:
        args.stage.mkdir(parents=True, exist_ok=True)
        for t in backlog:
            if t in have:
                shutil.copy2(args.originals / t, args.stage / t)
        print(f'staged {len(backlog) - len(todo)} originals in {args.stage}')

    if args.record_links:
        notes = json.loads(ANNOTATIONS.read_text())
        for t in backlog:
            notes.setdefault(t, {}).setdefault('originalUrl', f'https://drive.google.com/file/d/{drive[t]}/view?usp=drivesdk')
        ANNOTATIONS.write_text(json.dumps(notes, indent=2, ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
