#!/usr/bin/env python3
"""Pure-code intake of new photos from the Google Drive folder. No agent, no vision.

  python3 scripts/drive_intake.py [--dry-run] [--keep DIR]

Needs two environment values (never committed):
  GOOGLE_SERVICE_ACCOUNT_JSON  service-account key; share the Drive folder with its email (Viewer)
  VILLACANA_DRIVE_FOLDER       the folder id

It lists the folder, finds photos not yet on the map, downloads each original to a temporary
folder outside the repository (originals keep their GPS and are never committed), and runs the
deterministic steps of docs/PHOTO_MAP_WORKFLOW.md: write each Drive link to
data/photo_annotations.json, index_photos.py (EXIF-free web copy + camera pin), assign_photo_map.py,
build_references.py and build_photo_map.py --thumbs. New photos appear on the map as pins at once.
Describing and tagging what they show (`shows`, `viewpoint`, `useFor`) needs someone to look at the
picture, so it stays a separate step: the tail of the output lists the photos still untagged.

A photo is new when its Drive file id is not on the map. If its name is already on the map but it is a
different file, it is compared by capture date, GPS and heading: same values means a re-upload (skipped),
different values means a real name clash (phones reuse IMG numbers), and it is indexed under
<name>-<first 6 of the file id> so an existing pin is never overwritten.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import index_photos  # noqa: E402

PHOTO_SUFFIXES = ('.heic', '.heif', '.jpg', '.jpeg', '.png')
MANIFEST = ROOT / 'public/photos-ref/manifest.json'
ANNOTATIONS = ROOT / 'data/photo_annotations.json'
TAGS = ROOT / 'data/reference_tags.json'
API = 'https://www.googleapis.com/drive/v3/files'


class Drive:
    """The two Drive calls needed; tests substitute a stub with the same two methods."""

    def __init__(self, key_json: str, folder: str):
        from google.oauth2 import service_account
        from google.auth.transport.requests import AuthorizedSession
        creds = service_account.Credentials.from_service_account_info(
            json.loads(key_json), scopes=['https://www.googleapis.com/auth/drive.readonly'])
        self.session, self.folder = AuthorizedSession(creds), folder

    def list(self):
        token = None
        while True:
            params = {'q': f"'{self.folder}' in parents and trashed=false", 'pageSize': 1000,
                      'fields': 'nextPageToken,files(id,name,createdTime)',
                      'supportsAllDrives': 'true', 'includeItemsFromAllDrives': 'true'}
            if token:
                params['pageToken'] = token
            r = self.session.get(API, params=params, timeout=60)
            r.raise_for_status()
            body = r.json()
            yield from body['files']
            token = body.get('nextPageToken')
            if not token:
                return

    def download(self, file_id: str, dest: Path):
        with self.session.get(f'{API}/{file_id}', params={'alt': 'media', 'supportsAllDrives': 'true'},
                              stream=True, timeout=300) as r:
            r.raise_for_status()
            with open(dest, 'wb') as f:
                for chunk in r.iter_content(1 << 20):
                    f.write(chunk)


def drive_id(entry: dict) -> str | None:
    url = entry.get('originalUrl') or ''
    return url.split('/d/')[1].split('/')[0] if '/d/' in url else None


def find_new(listing, manifest: list[dict]) -> list[dict]:
    """Photos in the listing whose Drive id is not on the map, oldest first, one per id."""
    known = {drive_id(e) for e in manifest} - {None}
    seen, new = set(), []
    for f in sorted(listing, key=lambda f: (f['createdTime'], f['name'])):
        if f['name'].lower().endswith(PHOTO_SUFFIXES) and f['id'] not in known and f['id'] not in seen:
            seen.add(f['id'])
            new.append(f)
    return new


def same_photo(fresh: dict, existing: dict) -> bool:
    """Capture date, camera pin and heading all equal: the same picture uploaded again."""
    return all(fresh.get(k) == existing.get(k) for k in ('taken', 'x', 'z', 'heading', 'focal35'))


def intake(drive, manifest: list[dict], work: Path, annotations: dict) -> tuple[list[str], list[str]]:
    """Download the new photos into `work`; returns (staged file names, notes). Updates annotations."""
    by_stem = {e['file'].rsplit('.', 1)[0].casefold(): e for e in manifest}
    staged, notes = [], []
    for f in find_new(drive.list(), manifest):
        name = Path(f['name']).name
        stem, suffix = name.rsplit('.', 1)
        dest = work / name
        drive.download(f['id'], dest)
        existing = by_stem.get(stem.casefold())
        if existing:
            if same_photo(index_photos.metadata(dest), existing):
                dest.unlink()
                notes.append(f'{name}: re-upload of a photo already on the map, skipped')
                continue
            renamed = f'{stem}-{f["id"][:6]}.{suffix}'
            dest = dest.rename(work / renamed)
            notes.append(f'{name}: different photo with an existing name, indexed as {renamed}')
            name = renamed
        annotations.setdefault(name, {})['originalUrl'] = f'https://drive.google.com/file/d/{f["id"]}/view?usp=drivesdk'
        staged.append(name)
    return staged, notes


def run(*cmd: str) -> None:
    print('$', *cmd, flush=True)
    subprocess.run(cmd, cwd=ROOT, check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--dry-run', action='store_true', help='list what is new, download nothing')
    parser.add_argument('--keep', type=Path, help='keep the downloaded originals in this private folder')
    args = parser.parse_args()
    key, folder = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON'), os.environ.get('VILLACANA_DRIVE_FOLDER')
    if not key or not folder:
        raise SystemExit('Set GOOGLE_SERVICE_ACCOUNT_JSON and VILLACANA_DRIVE_FOLDER (see this script\'s docstring).')
    drive = Drive(key, folder)
    manifest = json.loads(MANIFEST.read_text())
    if args.dry_run:
        for f in find_new(drive.list(), manifest):
            print('new', f['name'], f['createdTime'])
        return
    work = args.keep or Path(tempfile.mkdtemp(prefix='villacana-originals-'))
    work.mkdir(parents=True, exist_ok=True)
    try:
        annotations = json.loads(ANNOTATIONS.read_text())
        staged, notes = intake(drive, manifest, work, annotations)
        for n in notes:
            print(n)
        if not staged:
            print('No new photos.')
            return
        ANNOTATIONS.write_text(json.dumps(annotations, indent=2, ensure_ascii=False) + '\n')
        # index_photos reads every photo in the folder: stage only the new ones
        run(sys.executable, 'scripts/index_photos.py', str(work), 'public/photos-ref', '--annotations', 'data/photo_annotations.json')
        run(sys.executable, 'scripts/assign_photo_map.py')
        run(sys.executable, 'scripts/build_references.py')
        run(sys.executable, 'scripts/build_photo_map.py', '--thumbs')
    finally:
        if not args.keep:
            shutil.rmtree(work, ignore_errors=True)
    tags = json.loads(TAGS.read_text())
    untagged = sorted(e['file'] for e in json.loads(MANIFEST.read_text()) if e['file'] not in tags)
    print(f'{len(staged)} new photos on the map; {len(untagged)} photos still untagged (need someone to look at them):')
    print(' '.join(untagged))


if __name__ == '__main__':
    main()
