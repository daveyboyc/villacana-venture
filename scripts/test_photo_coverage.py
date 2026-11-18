#!/usr/bin/env python3
"""The photo coverage report (scripts/photo_coverage.py, docs/PHOTO_COVERAGE_PRD.md) is consistent and
reproduces the known Elena junction gaps (docs/HANDOVER_ELENA_JUNCTION.md).

Reads JSON only, so it runs without numpy or the scene export. Each expected gap holds only while the
photo request that would settle it is open: once the photo is in and its camera solved, re-run
scripts/photo_coverage.py and the feature may rise to `fixed`.
"""
import hashlib
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GRADES = ['unseen', 'seen', 'located', 'fixed', 'measured']
RANK = {g: i for i, g in enumerate(GRADES)}

# docs/HANDOVER_ELENA_JUNCTION.md "Open, and what settles each": feature (and part) that must be below
# `fixed`, and the photo request that settles it.
EXPECTED_GAPS = [
    ('the near lawn\'s north edge (the Cervantes kerb)', 'cervantes_patio_walls.json:cervantes-patio-south-2', None, 'cervantes-elena-junction-square'),
    ('the near lawn\'s north edge (its north side)', 'frontage_divisions.json:cervantes-elena-lawn-1', 'north side', 'cervantes-elena-junction-square'),
    ('the cypress wall', 'lane_walls.json:elena-south-cypress-wall', None, 'elena-south-cypress-wall-gate'),
    ('the east patio wall behind the hedge', 'lane_walls.json:elena-south-mouth-patio-wall', None, 'elena-south-east-patio-wall-square'),
]
# Measured with a second-agent approval (data/placement_reviews.json measured-elena-junction-lawns-west-wall):
# must not be flagged.
NOT_FLAGGED = [
    'frontage_divisions.json:cervantes-elena-lawn-1',
    'frontage_divisions.json:cervantes-elena-lawn-2',
    'lane_walls.json:elena-south-lawn-west-wall',
]


def load(path):
    return json.loads((ROOT / path).read_text())


class PhotoCoverage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load('data/photo_coverage.json')
        cls.public = load('public/photo-coverage.json')
        cls.by_id = {f['id']: f for f in cls.data['features']}
        cls.requests = {r['id']: r for r in load('data/photo_requests.json')['requests']}

    def test_inputs_are_current(self):
        h = hashlib.sha256()
        for p in self.data['inputs']['files']:
            h.update(p.encode())
            h.update((ROOT / p).read_bytes())
        if h.hexdigest()[:16] != self.data['inputs']['digest']:
            print('\nWARNING: data/photo_coverage.json is older than its inputs: run node scripts/shoot_views.cjs --model '
                  'and python3 scripts/photo_coverage.py')

    def test_public_copy_matches(self):
        self.assertEqual(self.public['inputs'], self.data['inputs'], 'public/photo-coverage.json is stale')
        pub = {f['id']: f for f in self.public['features']}
        for f in self.data['features']:
            if f['kind'] == 'street':
                continue
            self.assertIn(f['id'], pub)
            self.assertEqual(pub[f['id']]['grade'], f['grade'], f['id'])
            self.assertTrue(pub[f['id']].get('ring') or pub[f['id']].get('points'), f['id'])
        self.assertEqual(len(self.public['requests']), len(self.requests))

    def test_grades_are_known_and_explained(self):
        for f in self.data['features']:
            self.assertIn(f['grade'], GRADES, f['id'])
            self.assertIn(f['computed'], GRADES, f['id'])
            if f['grade'] == 'measured':
                self.assertTrue(f.get('measuredApproval'), f['id'])
            if RANK[f['grade']] < RANK['fixed']:
                self.assertTrue(f['why'], f['id'])
            for p in f['parts']:
                self.assertIn(p['grade'], GRADES)

    def test_single_camera_depth_stays_close(self):
        # PRD acceptance: nothing is fixed on one camera's depth beyond about 12 m.
        limit = self.data['rules']['singleCameraM']
        self.assertLessEqual(limit, 12.5)
        for f in self.data['features']:
            for p in f['parts']:
                if 'singleCameraM' in p:
                    self.assertLessEqual(p['singleCameraM'], limit, f['id'])

    def test_known_elena_gaps_are_flagged(self):
        for what, fid, part, request in EXPECTED_GAPS:
            if self.requests[request]['status'] != 'open':
                continue  # the photo is in: the gap may have closed
            f = self.by_id[fid]
            if part is None:
                self.assertLess(RANK[f['grade']], RANK['fixed'], f'{what}: {fid} is {f["grade"]}')
            else:
                got = {p['part']: p['grade'] for p in f['parts']}
                self.assertIn(part, got, fid)
                self.assertLess(RANK[got[part]], RANK['fixed'], f'{what}: {fid} {part} is {got[part]}')
                self.assertIn(part, f['weakParts'])

    def test_measured_lawns_and_west_wall_are_not_flagged(self):
        for fid in NOT_FLAGGED:
            self.assertGreaterEqual(RANK[self.by_id[fid]['grade']], RANK['fixed'], fid)
            self.assertNotIn(fid, self.data['areas']['elena']['belowFixed'])

    def test_areas_count_their_structure(self):
        for id, card in self.data['areas'].items():
            self.assertEqual(sum(card['grades'].values()), card['structural'], id)
            self.assertEqual(card['enough'], not card['belowFixed'] and not card['noHeightView'], id)


if __name__ == '__main__':
    unittest.main()
