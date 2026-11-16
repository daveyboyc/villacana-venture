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
                      'fields': 'nextPageToken,files(id,name,createdTime,mimeType)',
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
                    if chunk:
                        f.write(chunk)


def parse_folder_id(value: str) -> str:
    folder = value.strip()
    if '/folders/' in folder:
        folder = folder.split('/folders/', 1)[1].split('?', 1)[0].strip('/')
    return folder


def drive_id(entry: dict) -> str | None:
    url = entry.get('originalUrl') or ''
    return url.split('/d/')[1].split('/')[0] if '/d/' in url else None


def find_new(listing, manifest: list[dict], annotations: dict | None = None) -> list[dict]:
    """Photos in the listing whose Drive id is not on the map, oldest first, one per id."""
    known = {drive_id(e) for e in manifest} - {None}
    if annotations:
        by_stem = {}
        for key, ann in annotations.items():
            if isinstance(ann, dict) and '.' in key:
                fid = drive_id(ann)
                if fid:
                    by_stem.setdefault(key.rsplit('.', 1)[0].casefold(), fid)
        for e in manifest:
            if not e.get('originalUrl'):
                fid = by_stem.get(e['file'].rsplit('.', 1)[0].casefold())
                if fid:
                    known.add(fid)
    seen, new = set(), []
    for f in sorted(listing, key=lambda f: (f.get('createdTime', ''), f['name'])):
        if f.get('mimeType', '').startswith('application/vnd.google-apps.'):
            continue
        if f['name'].lower().endswith(PHOTO_SUFFIXES) and f['id'] not in known and f['id'] not in seen:
            seen.add(f['id'])
            new.append(f)
    return new


def same_photo(fresh: dict, existing: dict) -> bool:
    """Capture date, camera pin and heading all equal: the same picture uploaded again."""
    gps = existing.get('gps') or {}
    ex_x = gps.get('x', existing.get('x'))
    ex_z = gps.get('z', existing.get('z'))
    if (fresh.get('taken'), fresh.get('x'), fresh.get('z'), fresh.get('heading')) != (
        existing.get('taken'), ex_x, ex_z, existing.get('heading')
    ):
        return False
    # Older manifest entries predate focal35; only compare when both sides recorded it.
    if fresh.get('focal35') is not None and existing.get('focal35') is not None:
        return fresh.get('focal35') == existing.get('focal35')
    return True


def _annotation_key(annotations: dict, name: str) -> str:
    if name in annotations:
        return name
    jpg = f'{Path(name).stem}.jpg'
    return jpg if jpg in annotations else name


def intake(drive, manifest: list[dict], work: Path, annotations: dict) -> tuple[list[str], list[str]]:
    """Download the new photos into `work`; returns (staged file names, notes). Updates annotations."""
    by_stem = {e['file'].rsplit('.', 1)[0].casefold(): e for e in manifest}
    staged, notes = [], []
    for f in find_new(drive.list(), manifest, annotations):
        name = Path(f['name']).name
        if '.' not in name or name.startswith('.'):
            continue
        stem, suffix = name.rsplit('.', 1)
        url = f'https://drive.google.com/file/d/{f["id"]}/view?usp=drivesdk'
        tmp = work / f'.dl-{f["id"]}.{suffix}'
        drive.download(f['id'], tmp)
        fresh = index_photos.metadata(tmp)
        existing = by_stem.get(stem.casefold())
        if existing:
            if same_photo(fresh, existing):
                tmp.unlink()
                if not existing.get('originalUrl'):
                    existing['originalUrl'] = url
                    annotations.setdefault(_annotation_key(annotations, existing['file']), {})['originalUrl'] = url
                notes.append(f'{name}: re-upload of a photo already on the map, skipped')
                continue
            renamed = f'{stem}-{f["id"][:6]}.{suffix}'
            if Path(renamed).stem.casefold() in by_stem:
                renamed = f'{stem}-{f["id"]}.{suffix}'
            notes.append(f'{name}: different photo with an existing name, indexed as {renamed}')
            name = renamed
        dest = tmp.rename(work / name)
        by_stem[dest.stem.casefold()] = {**fresh, 'originalUrl': url}
        annotations.setdefault(_annotation_key(annotations, name), {})['originalUrl'] = url
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
    key = (os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON') or '').strip()
    folder = parse_folder_id(os.environ.get('VILLACANA_DRIVE_FOLDER') or '')
    if not key or not folder:
        raise SystemExit('Set GOOGLE_SERVICE_ACCOUNT_JSON and VILLACANA_DRIVE_FOLDER (see this script\'s docstring).')
    drive = Drive(key, folder)
    manifest = json.loads(MANIFEST.read_text())
    annotations = json.loads(ANNOTATIONS.read_text())
    if args.dry_run:
        for f in find_new(drive.list(), manifest, annotations):
            print('new', f['name'], f.get('createdTime', ''))
        return
    before_urls = [e.get('originalUrl') for e in manifest]
    work = args.keep or Path(tempfile.mkdtemp(prefix='villacana-originals-'))
    work.mkdir(parents=True, exist_ok=True)
    try:
        staged, notes = intake(drive, manifest, work, annotations)
        for n in notes:
            print(n)
        backfilled = [e.get('originalUrl') for e in manifest] != before_urls
        if not staged and not backfilled:
            print('No new photos.')
            return
        ANNOTATIONS.write_text(json.dumps(annotations, indent=2, ensure_ascii=False) + '\n')
        if backfilled:
            MANIFEST.write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + '\n')
        if staged:
            # index_photos reads every photo in the folder: stage only the new ones
            run(sys.executable, 'scripts/index_photos.py', str(work), 'public/photos-ref', '--annotations', 'data/photo_annotations.json')
        run(sys.executable, 'scripts/assign_photo_map.py')
        run(sys.executable, 'scripts/build_references.py')
        run(sys.executable, 'scripts/build_photo_map.py', *(['--thumbs'] if staged else []))
    finally:
        if not args.keep:
            shutil.rmtree(work, ignore_errors=True)
    tags = json.loads(TAGS.read_text())
    untagged = sorted(e['file'] for e in json.loads(MANIFEST.read_text()) if e['file'] not in tags)
    print(f'{len(staged)} new photos on the map; {len(untagged)} photos still untagged (need someone to look at them):')
    print(' '.join(untagged))


if __name__ == '__main__':
    main()
