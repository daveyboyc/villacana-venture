#!/usr/bin/env python3
"""The per-area scorecard is current, covers every area and finds the right area on the map."""
import json
import math
import unittest
from pathlib import Path

import build_scorecard
import photo_requests

ROOT = Path(__file__).resolve().parents[1]


class Scorecard(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.card = json.loads((ROOT / 'public/scorecard.json').read_text())

    def test_committed_scorecard_is_current(self):
        card = build_scorecard.build()
        stale = 'stale: run python3 scripts/build_scorecard.py'
        self.assertEqual((ROOT / 'public/scorecard.json').read_text(), build_scorecard.text(card), 'public/scorecard.json is ' + stale)
        self.assertEqual((ROOT / 'refs/SCORECARD.md').read_text(), build_scorecard.table(card), 'refs/SCORECARD.md is ' + stale)

    def test_every_area_has_a_card(self):
        areas = [a['id'] for a in json.loads((ROOT / 'data/areas.json').read_text())['areas']]
        self.assertEqual([c['id'] for c in self.card['areas']], areas)
        for c in self.card['areas']:
            self.assertTrue(c['status'])
            self.assertNotIn('score', json.dumps(c).lower())

    def test_grid_finds_known_places(self):
        grid = self.card['grid']

        def area_at(x, z):
            c = grid['rows'][math.floor((z - grid['z0']) / grid['step'])][math.floor((x - grid['x0']) / grid['step'])]
            return None if c == '.' else grid['areas'][ord(c) - ord('a')]
        pools = {p['id']: p['ring'] for p in json.loads((ROOT / 'public/map/skeleton.json').read_text())['pools']}
        for pool, area in [('north', 'north-pool'), ('middle', 'middle-pool'), ('south', 'south-pool'), ('main', 'main-pool')]:
            ring = pools[pool]
            self.assertEqual(area_at(sum(p[0] for p in ring) / len(ring), sum(p[1] for p in ring) / len(ring)), area)
        self.assertEqual(area_at(-158.8, 41.2), 'elena')  # the Elena passage
        self.assertEqual(area_at(-153.7, 57.8), 'elena')  # the ramp up from Cervantes, on the Elena side

    def test_lights_follow_photo_requests(self):
        cards = {c['id']: c for c in self.card['areas']}
        states = photo_requests.states()
        for c in self.card['areas']:
            self.assertIn(c['light']['colour'], ('red', 'amber', 'green'))
            mine = [r for r in states if c['id'] == 'whole-resort' or r['area'] == c['id']]
            # Red exactly while a request here still waits for photos.
            self.assertEqual(c['light']['colour'] == 'red', any(r['state'] == 'open' for r in mine), c['id'])
        self.assertEqual(len(cards['whole-resort']['light']['requests']), sum(r['state'] != 'answered' for r in states))

    def test_matcher_picks_up_new_photos(self):
        request = {'id': 'x', 'area': 'elena', 'at': [0, 0], 'look': [0, -10], 'ask': '', 'why': '', 'priority': 1, 'radius': 6, 'since': '2026-10-27', 'status': 'open'}
        photo = lambda **kw: {'file': 'IMG_9999.jpg', 'x': 2, 'z': 1, 'accuracy': 3, 'heading': 10, 'taken': '2026-10-28', **kw}
        state = lambda p, tags=None: photo_requests.states([request], [p], tags or {})[0]
        self.assertEqual(state(photo())['state'], 'received')
        self.assertEqual(state(photo(taken='2026-10-20'))['state'], 'open', 'older photos do not answer a new request')
        self.assertEqual(state(photo(x=20))['state'], 'open', 'too far from the spot')
        self.assertEqual(state(photo(heading=180))['state'], 'open', 'facing away')
        self.assertEqual(state(photo(heading=180), {'IMG_9999.jpg': {'looksAt': [0, -9]}})['state'], 'received', 'a reviewed looksAt overrides the compass')
        roof = {**request, 'look': None, 'viewpoint': 'roof'}
        self.assertEqual(photo_requests.states([roof], [photo(altitude=7)], {})[0]['state'], 'open', 'a ground photo does not answer a roof spot')
        self.assertEqual(photo_requests.states([roof], [photo(altitude=14)], {})[0]['state'], 'received')
        self.assertEqual(photo_requests.states([{**request, 'notAnswering': ['IMG_9999.jpg']}], [photo()], {})[0]['state'], 'open',
                         'a reviewed photo that does not show the spot leaves it open')
        done = photo_requests.states([{**request, 'status': 'answered', 'answeredBy': ['IMG_1.jpg']}], [], {})[0]
        self.assertEqual((done['state'], done['photos']), ('answered', ['IMG_1.jpg']))
        for r in photo_requests.load():
            self.assertTrue(r['ask'] and r['why'] and len(r['at']) == 2 and r['status'] in ('open', 'answered'), r['id'])


if __name__ == '__main__':
    unittest.main()
