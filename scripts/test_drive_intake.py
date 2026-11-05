#!/usr/bin/env python3
"""Offline tests for scripts/drive_intake.py: a stub Drive and generated photos with EXIF GPS."""
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import drive_intake  # noqa: E402
import index_photos  # noqa: E402


def photo(path: Path, lat: float, lon: float, taken: str = '2026:11:05 10:00:00', heading: float = 90.0):
    exif = Image.Exif()
    gps = {1: 'N', 2: (int(lat), int((lat % 1) * 60), ((lat % 1) * 60 % 1) * 60),
           3: 'W', 4: (int(-lon), int((-lon % 1) * 60), ((-lon % 1) * 60 % 1) * 60), 16: 'T', 17: heading}
    exif[0x8825] = gps
    exif[0x8769] = {0x9003: taken}
    Image.new('RGB', (40, 30), 'white').save(path, exif=exif)


class StubDrive:
    def __init__(self, files: dict[str, Path]):
        self.files = files  # drive id -> local fixture

    def list(self):
        for i, (fid, p) in enumerate(self.files.items()):
            yield {'id': fid, 'name': p.name, 'createdTime': f'2026-11-05T10:00:0{i}Z'}
        yield {'id': 'doc1', 'name': 'notes.txt', 'createdTime': '2026-11-05T09:00:00Z'}

    def download(self, file_id, dest):
        dest.write_bytes(self.files[file_id].read_bytes())


class DriveIntake(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        (self.tmp / 'src').mkdir()
        (self.tmp / 'work').mkdir()

    def make(self, name, **kw):
        p = self.tmp / 'src' / name
        photo(p, **kw)
        return p

    def test_find_new_skips_known_ids_non_photos_and_repeats(self):
        manifest = [{'file': 'IMG_1.jpg', 'originalUrl': 'https://drive.google.com/file/d/known/view?usp=drivesdk'}]
        listing = [{'id': 'known', 'name': 'IMG_1.HEIC', 'createdTime': 'a'},
                   {'id': 'n1', 'name': 'IMG_2.HEIC', 'createdTime': 'b'},
                   {'id': 'n1', 'name': 'IMG_2.HEIC', 'createdTime': 'b'},
                   {'id': 'd', 'name': 'notes.txt', 'createdTime': 'c'}]
        self.assertEqual([f['id'] for f in drive_intake.find_new(listing, manifest)], ['n1'])

    def test_new_reupload_and_name_clash(self):
        existing = self.make('IMG_9001.jpg', lat=36.4552, lon=-5.0500)
        index_meta = index_photos.metadata(existing)
        index_meta['originalUrl'] = 'https://drive.google.com/file/d/old1/view?usp=drivesdk'
        manifest = [index_meta]
        files = {
            'old1': existing,  # already on the map by id
            'new1': self.make('IMG_9002.jpg', lat=36.4553, lon=-5.0501),
        }
        (self.tmp / 'again').mkdir()
        again = self.tmp / 'again' / 'IMG_9001.jpg'
        photo(again, lat=36.4552, lon=-5.0500)  # same name, same capture: a re-upload
        clash = self.tmp / 'clash' / 'IMG_9001.jpg'
        clash.parent.mkdir()
        photo(clash, lat=36.4600, lon=-5.0400, taken='2026:11:05 11:30:00')  # same name, other photo
        files.update({'again1abc': again, 'clash2def': clash})
        notes_ann: dict = {}
        staged, notes = drive_intake.intake(StubDrive(files), manifest, self.tmp / 'work', notes_ann)
        self.assertEqual(sorted(staged), ['IMG_9001-clash2.jpg', 'IMG_9002.jpg'])
        self.assertTrue(any('re-upload' in n for n in notes))
        self.assertTrue(any('IMG_9001-clash2.jpg' in n for n in notes))
        self.assertTrue(notes_ann['IMG_9002.jpg']['originalUrl'].endswith('/d/new1/view?usp=drivesdk'))
        self.assertNotIn('IMG_9001.jpg', notes_ann)
        self.assertFalse((self.tmp / 'work' / 'IMG_9001.jpg').exists())
        # the staged originals index under their own names and never touch the existing pin
        out = self.tmp / 'out'
        entries = index_photos.index(self.tmp / 'work', out, notes_ann)
        self.assertEqual(sorted(e['file'] for e in entries), ['IMG_9001-clash2.jpg', 'IMG_9002.jpg'])
        self.assertTrue(all('x' in e and 'z' in e for e in entries))


if __name__ == '__main__':
    unittest.main()
