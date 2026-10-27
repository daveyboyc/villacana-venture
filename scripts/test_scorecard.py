#!/usr/bin/env python3
"""The per-area scorecard is current, covers every area and finds the right area on the map."""
import json
import math
import unittest
from pathlib import Path

import build_scorecard

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


if __name__ == '__main__':
    unittest.main()
