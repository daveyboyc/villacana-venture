#!/usr/bin/env python3
"""The 'Sure / unsure' overlay data is current, covers every feature and only uses known levels."""
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import assign_photo_map  # noqa: E402
import build_confidence  # noqa: E402


class Confidence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.out, cls.problems = build_confidence.build()

    def test_committed_file_is_current(self):
        self.assertEqual((ROOT / 'public/confidence.json').read_text(), build_confidence.text(self.out),
                         'public/confidence.json is stale: run python3 scripts/build_confidence.py')

    def test_authored_entries_are_valid(self):
        self.assertEqual(self.problems, [])

    def test_every_feature_has_a_level_and_outline(self):
        skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
        ids = {f['id'] for f in assign_photo_map.features(skeleton)}
        got = {f['id']: f for f in self.out['features']}
        self.assertEqual(set(got), ids)
        for f in got.values():
            self.assertIn(f['level'], build_confidence.LEVELS)
            self.assertTrue(f['why'])
            self.assertTrue(f.get('ring') or f.get('points'), f['id'])

    def test_overrides_never_claim_registry_or_approval(self):
        spec = json.loads((ROOT / 'data/confidence.json').read_text())
        for id, entry in spec['features'].items():
            self.assertNotEqual(entry.get('level'), 'registry', id)
            self.assertNotIn('verified', entry.get('level', ''), id)

    def test_gaps_have_a_place_photos_and_reason(self):
        for g in self.out['gaps']:
            self.assertTrue(g['id'].startswith('gap:'))
            self.assertEqual(len(g['at']), 2)
            self.assertTrue(g['photos'] and g['why'])


if __name__ == '__main__':
    unittest.main()
