#!/usr/bin/env python3
"""Pixel-to-map projection round-trips through the renderer's camera, and discrepancy records validate."""
import copy
import json
import math
import unittest
from pathlib import Path

import discrepancies
import pixel_to_map as p2m

ROOT = Path(__file__).resolve().parents[1]
POSE = {'image': [1600, 1200], 'solved': {'pose': {'x': -170.286, 'y': 8.551, 'z': 36.593, 'yaw': 333.29, 'pitch': -16.135, 'roll': 1.352, 'f': 1241.034},
                                           'sigma': {'x': 0.306, 'y': 0.333, 'z': 0.569, 'f': 38.952, 'yaw': 0.504, 'pitch': 0.661, 'roll': 0.594}}}


class RoundTrip(unittest.TestCase):
    def test_known_point_to_pixel_and_back_on_a_stated_height(self):
        pose, size = POSE['solved']['pose'], POSE['image']
        for x, y, z in [(-176.66, 0.82, 20.09), (-172.7, 0.82, 20.2), (-193.0, 1.93, 20.8), (-168.0, 3.0, 5.0)]:
            u, v = p2m.to_pixel(pose, size, [x, y, z])
            self.assertTrue(0 <= u <= size[0] and 0 <= v <= size[1], (x, z, u, v))
            hit = p2m.cast(pose, size, u, v, p2m.flat(y))
            self.assertAlmostEqual(hit[0], x, delta=0.01)
            self.assertAlmostEqual(hit[2], z, delta=0.01)

    def test_known_ground_point_round_trips_on_site_ground(self):
        ground, pose, size = p2m.SiteGround(), POSE['solved']['pose'], POSE['image']
        for x, z in [(-176.66, 20.09), (-168.1, 10.9), (-188.0, 26.0)]:
            u, v = p2m.to_pixel(pose, size, [x, ground(x, z), z])
            hit = p2m.cast(pose, size, u, v, ground)
            self.assertLess(math.dist((hit[0], hit[2]), (x, z)), 0.02)
            self.assertAlmostEqual(hit[1], ground(x, z), delta=0.01)

    def test_matches_the_renderer_convention(self):
        # Straight ahead of a level camera facing compass yaw 90 (east) is +x; facing 180 (south) is +z; up the image is up.
        level = {'x': 0, 'y': 10, 'z': 0, 'yaw': 90, 'pitch': 0, 'roll': 0, 'f': 1000}
        eye, d = p2m.ray(level, [1600, 1200], 800, 600)
        self.assertTrue(abs(d[0] - 1) < 1e-9 and abs(d[1]) < 1e-9 and abs(d[2]) < 1e-9)
        south = dict(level, yaw=180)
        self.assertAlmostEqual(p2m.ray(south, [1600, 1200], 800, 600)[1][2], 1)
        self.assertGreater(p2m.ray(level, [1600, 1200], 800, 100)[1][1], 0)
        # Looking down at 45 degrees from 10 m the image centre meets flat ground 10 m out.
        down = dict(level, pitch=-45)
        hit = p2m.cast(down, [1600, 1200], 800, 600, p2m.flat(0))
        self.assertAlmostEqual(hit[0], 10, delta=0.01)

    def test_same_camera_as_photo_pose(self):
        import photo_pose
        pose, size = POSE['solved']['pose'], POSE['image']
        for point in ([-176.66, 0.82, 20.09], [-190.0, 6.0, 12.0]):
            uv, _ = photo_pose.project(pose, size, [point])
            mine = p2m.to_pixel(pose, size, point)
            self.assertAlmostEqual(mine[0], uv[0][0], places=6)
            self.assertAlmostEqual(mine[1], uv[0][1], places=6)

    def test_sky_gives_no_position(self):
        self.assertIsNone(p2m.locate(POSE, 800, 5, p2m.flat(0)))

    def test_uncertainty_grows_with_range_and_is_repeatable(self):
        near = p2m.locate(POSE, 900, 1000, p2m.flat(0.82))
        far = p2m.locate(POSE, 900, 600, p2m.flat(0.82))
        self.assertGreater(far['uncertaintyM'], near['uncertaintyM'])
        self.assertEqual(near, p2m.locate(POSE, 900, 1000, p2m.flat(0.82)))

    def test_grid_ground(self):
        grid = p2m.GridGround({'x0': 0, 'z0': 0, 'step': 2, 'nx': 3, 'nz': 2, 'heights': [0, 1, 2, 0, 1, 2]})
        self.assertAlmostEqual(grid(1, 1), 0.5)
        self.assertAlmostEqual(grid(3, 0), 1.5)

    def test_combine_keeps_shared_station_uncertainty(self):
        at, sigma, spread = p2m.combine([{'at': [0, 0], 'uncertaintyM': 1.0}, {'at': [0.4, 0], 'uncertaintyM': 1.0}])
        self.assertEqual(at, [0.2, 0.0])
        self.assertEqual(sigma, 1.0)
        self.assertEqual(spread, 0.4)
        self.assertEqual(p2m.combine([{'at': [0, 0], 'uncertaintyM': 0.5}, {'at': [3, 0], 'uncertaintyM': 0.5}])[1], 1.5)


class Records(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.context = discrepancies.context()
        cls.records = discrepancies.load()

    def problems(self, record):
        return discrepancies.validate([record], **self.context)

    def test_committed_records_are_valid_and_positions_current(self):
        self.assertEqual(discrepancies.validate(self.records, **self.context), [])
        self.assertEqual(p2m.update_discrepancies(quiet=True), [])

    def test_north_pool_comparison_covers_what_dave_reported(self):
        ids = {d['id'] for d in self.records if d['area'] == 'north-pool'}
        for required in ('np-pool-east-tongue', 'np-pump-box-position', 'np-parasol-north-patio', 'np-west-terrace-tree', 'np-glass-fence'):
            self.assertIn(required, ids)
        fence = next(d for d in self.records if d['id'] == 'np-glass-fence')
        self.assertEqual(fence['status'], 'wont-fix')

    def test_bad_records_are_caught(self):
        good = copy.deepcopy(next(d for d in self.records if d['id'] == 'np-pump-box-position'))
        self.assertEqual(self.problems(good), [])
        cases = {
            'kind': dict(good, kind='wrong'),
            'area': dict(good, area='nowhere'),
            'feature': dict(good, features=['objects.json:nope']),
            'region': dict(good, photos=[dict(good['photos'][0], region=[0, 0, 2000, 10])]),
            'followUp': dict(good, followUp=None),
            'wont-fix': dict(good, status='wont-fix', followUp=None),
            'closed': dict(good, status='closed', fix={'evidence': ['docs/PHOTO_LOOP_PRD.md'], 'note': 'moved'},
                           reviewer={'id': good['author'], 'date': '2026-11-02'}),
            'date': dict(good, created='yesterday'),
        }
        for name, record in cases.items():
            self.assertTrue(self.problems(record), name)
        closed = dict(good, status='closed', fix={'evidence': ['docs/PHOTO_LOOP_PRD.md'], 'note': 'moved'},
                      reviewer={'id': 'another-agent', 'date': '2026-11-02', 'note': 'overlays agree'})
        self.assertEqual(self.problems(closed), [])

    def test_numbering_is_per_area(self):
        numbered = discrepancies.numbered([{'area': 'a'}, {'area': 'b'}, {'area': 'a'}])
        self.assertEqual([d['n'] for d in numbered], [1, 1, 2])


if __name__ == '__main__':
    unittest.main()
