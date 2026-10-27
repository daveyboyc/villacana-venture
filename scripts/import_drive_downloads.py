#!/usr/bin/env python3
"""Turn Google Drive downloads into original photo files, ready for index_photos.py.

  python3 scripts/import_drive_downloads.py /private/originals DOWNLOAD.json [DOWNLOAD.json ...]
  python3 scripts/import_drive_downloads.py /private/originals --titles titles.json BLOB=DRIVE_ID ...

An agent downloads each new photo with the Drive connector (download_file_content); the
connector saves either a JSON file {content: base64, id, mimeType, title} or the raw file
(a .bin blob), with the Drive id only in its reply. For raw files pass BLOB=DRIVE_ID and a
--titles JSON of {title: drive id} from the folder listing, so each original keeps its name.
This writes each original to /private/originals/<title> (outside both repositories: originals
keep their GPS and metadata and are never committed) and records its Drive link as `originalUrl` in
data/photo_annotations.json, so the photo map can open the original. Then run
`python3 scripts/index_photos.py /private/originals public/photos-ref --annotations
data/photo_annotations.json` as in docs/PHOTO_MAP_WORKFLOW.md.
"""
import argparse
import base64
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ANNOTATIONS = ROOT / 'data/photo_annotations.json'


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('out', type=Path, help='private folder for the originals')
    parser.add_argument('downloads', nargs='+', help='Drive connector download files (JSON), or BLOB=DRIVE_ID')
    parser.add_argument('--titles', type=Path, help='JSON {title: drive id} naming raw downloads')
    args = parser.parse_args()
    names = {i: t for t, i in json.loads(args.titles.read_text()).items()} if args.titles else {}
    args.out.mkdir(parents=True, exist_ok=True)
    notes = json.loads(ANNOTATIONS.read_text())
    for item in args.downloads:
        if '=' in item:
            blob, id = item.split('=', 1)
            d = {'id': id, 'title': names[id], 'raw': Path(blob).read_bytes()}
        else:
            d = json.loads(Path(item).read_text())
            d['raw'] = base64.b64decode(d['content'])
        name = Path(d['title']).name
        if not name.upper().endswith(('.HEIC', '.JPG', '.JPEG', '.PNG')):
            raise SystemExit(f'{item}: {name} is not a photo')
        (args.out / name).write_bytes(d['raw'])
        notes.setdefault(name, {}).setdefault('originalUrl', f"https://drive.google.com/file/d/{d['id']}/view?usp=drivesdk")
        print(name, (args.out / name).stat().st_size // 1024, 'kB')
    ANNOTATIONS.write_text(json.dumps(notes, indent=2, ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
