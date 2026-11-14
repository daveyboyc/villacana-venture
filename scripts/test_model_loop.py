#!/usr/bin/env python3
"""Evidence gaps must not freeze unrelated work or masquerade as acceptance.

All approvals here are synthetic fixtures, never reviews of the resort.
"""
import copy
import json
import tempfile
import unittest
from pathlib import Path

from PIL import Image

import model_loop
from check_placement_changes import change_errors, geometry_path


class ModelLoop(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for directory in ('data', 'public', 'refs', 'docs'):
            (self.root / directory).mkdir()
        self.standard = {'id': 'fixture-v1', 'placementRmsM': .3,
                         'appearanceChecklist': ['presence', 'shape', 'materials', 'visible-details'], 'scope': 'Synthetic fixture'}
        self.write('data/acceptance_standard.json', self.standard)
        self.write('data/photo_poses.json', {'photos': {'P.jpg': {'solved': {'pose': {'x': 0}}, 'station': 'fixture'}}})
        self.write('data/placement_reviews.json', {'reviews': [{'id': 'p', 'toleranceM': .3}]})
        (self.root / 'public/P.jpg').write_bytes(b'synthetic source, not actual photo evidence')
        Image.new('RGB', (320, 240)).save(self.root / 'docs/render.png')
        (self.root / 'docs/overlay.svg').write_text('<svg/>')
        (self.root / 'docs/comparison.md').write_text('Synthetic comparison only')
        self.spec = {'areas': [{'id': 'north-pool', 'name': 'North pool'}]}
        self.catalog = [{'id': 'P.jpg', 'kind': 'phone-photo', 'path': 'public/P.jpg', 'shows': ['north-pool']}]
        self.features = [{'id': 'f', 'placement': {'status': 'verified', 'reviewIds': ['p']}}]
        self.inventory = {'f': {'modelDigest': 'fixture-model', 'contextDigest': 'fixture-context'}}
        self.tasks = [{'id': 'fix', 'area': 'north-pool', 'status': 'open', 'priority': 1, 'title': 'Fix'},
                      {'id': 'other', 'area': 'north-pool', 'status': 'open', 'priority': 1, 'title': 'Unrelated work'}]
        self.item = {'id': 'd', 'area': 'north-pool', 'kind': 'appearance', 'description': 'Fixture visible mismatch',
                     'sources': ['P.jpg'], 'features': ['f'], 'task': 'fix', 'status': 'open', 'requests': []}
        self.request = {'id': 'r', 'area': 'north-pool', 'kind': 'map', 'ask': 'Fixture ground corner plan',
                        'why': 'Fixture concealed corner', 'status': 'open', 'sources': [], 'tasks': [], 'features': ['f']}

    def write(self, path, value):
        (self.root / path).write_text(json.dumps(value))

    def artifact(self, name):
        return {'path': 'docs/' + name, 'sha256': model_loop.file_hash(self.root / 'docs' / name)}

    def review(self):
        review = {'author': 'fixture-maker', 'reviewer': 'fixture-reviewer', 'date': '2026-11-14',
                'decision': 'accepted', 'notes': 'Synthetic fixture, not real approval', 'sourcesInspected': ['P.jpg'],
                'snapshot': model_loop.snapshot(self.root, self.item, {e['id']: e for e in self.catalog}, self.inventory, self.standard),
                'render': self.artifact('render.png'), 'overlay': self.artifact('overlay.svg'),
                'comparison': self.artifact('comparison.md'),
                'checklist': {k: True for k in self.standard['appearanceChecklist']}}
        review['packetDigest'] = model_loop.review_digest(review)
        return review

    def build(self, requests=None, photos=None):
        self.write('data/discrepancies.json', {'discrepancies': [self.item]})
        self.write('data/evidence_requests.json', {'requests': requests or []})
        nodes, edges, errors = [], [], []
        report = model_loop.extend(self.root, self.spec, self.catalog, self.features, self.tasks, self.inventory,
                                   nodes, edges, errors, photos or [])
        return report['areas'][0], nodes, edges, errors

    def test_missing_map_blocks_only_its_finding(self):
        self.item['requests'] = ['r']
        area, _, _, errors = self.build([self.request])
        self.assertEqual(errors, [])
        self.assertEqual(area['discrepancies'][0]['state'], 'needs-evidence')
        self.assertEqual({t['id'] for t in area['readyTasks']}, {'fix', 'other'})
        self.request['tasks'] = ['fix']
        area, _, _, _ = self.build([self.request])
        self.assertEqual([t['id'] for t in area['readyTasks']], ['other'])

    def test_receipt_does_not_approve_evidence(self):
        self.item['requests'] = ['r']
        self.request.update(kind='photo', photoRequest='spot')
        area, _, edges, errors = self.build([self.request], [{'id': 'spot', 'state': 'received', 'photos': ['P.jpg']}])
        self.assertEqual(errors, [])
        self.assertEqual(area['discrepancies'][0]['state'], 'needs-evidence')
        self.assertTrue(any(e['relation'] == 'supplies-evidence' for e in edges))
        self.request.pop('photoRequest')
        self.request.update(status='answered')
        _, _, _, errors = self.build([self.request])
        self.assertTrue(any('answered requires' in e for e in errors))

    def test_empty_work_and_citations_never_auto_accept(self):
        area, _, _, errors = self.build()
        self.assertFalse(errors)
        self.assertEqual(area['counts']['accepted'], 0)
        self.item['status'] = 'closed'
        area, _, _, errors = self.build()
        self.assertEqual(area['counts']['accepted'], 0)
        self.assertTrue(any('cannot close' in e for e in errors))

    def test_current_independent_appearance_packet_can_close(self):
        self.item['review'] = self.review()
        self.item['status'] = 'closed'
        area, _, _, errors = self.build()
        self.assertEqual(errors, [])
        self.assertEqual(area['counts']['accepted'], 1)

    def test_self_review_missing_check_and_changed_pixels_rejected(self):
        packet = self.review()
        self.item['status'] = 'closed'
        for field in ('self', 'checklist', 'artifact', 'source', 'camera', 'model'):
            with self.subTest(field=field):
                (self.root / 'public/P.jpg').write_bytes(b'synthetic source, not actual photo evidence')
                self.write('data/photo_poses.json', {'photos': {'P.jpg': {'solved': {'pose': {'x': 0}}, 'station': 'fixture'}}})
                self.inventory['f']['contextDigest'] = 'fixture-context'
                self.item['review'] = copy.deepcopy(packet)
                if field == 'self':
                    self.item['review']['reviewer'] = ' FIXTURE-MAKER '
                elif field == 'checklist':
                    self.item['review']['checklist']['shape'] = False
                elif field == 'artifact':
                    self.item['review']['render']['sha256'] = 'wrong'
                elif field == 'source':
                    (self.root / 'public/P.jpg').write_bytes(b'changed pixels')
                elif field == 'camera':
                    self.write('data/photo_poses.json', {'photos': {}})
                elif field == 'model':
                    self.inventory['f']['contextDigest'] = 'changed renderer'
                area, _, _, errors = self.build()
                self.assertEqual(area['counts']['accepted'], 0)
                self.assertTrue(errors)

    def test_loose_placement_and_missing_camera_do_not_pass(self):
        self.item['kind'] = 'placement'
        self.item['status'] = 'closed'
        self.item['review'] = self.review()
        _, _, _, errors = self.build()
        self.assertTrue(any('two solved' in e for e in errors))
        self.write('data/placement_reviews.json', {'reviews': [{'id': 'p', 'toleranceM': 2}]})
        _, _, _, errors = self.build()
        self.assertTrue(any('tolerance exceeds' in e for e in errors))

    def test_height_needs_measurement_with_uncertainty(self):
        self.item['kind'] = 'height'
        self.item['status'] = 'closed'
        self.item['review'] = self.review()
        self.item['review']['measurement'] = {'rmsM': .2, 'uncertaintyM': .2, 'toleranceM': .3,
                                               'basis': 'synthetic survey', 'heldOut': [1, 2]}
        _, _, _, errors = self.build()
        self.assertTrue(any('plus uncertainty' in e for e in errors))
        self.item['review']['measurement']['uncertaintyM'] = .05
        self.item['review']['packetDigest'] = model_loop.review_digest(self.item['review'])
        _, _, _, errors = self.build()
        self.assertFalse(errors)

    def test_missing_source_is_access_work_not_new_photo_request(self):
        (self.root / 'public/P.jpg').unlink()
        area, _, _, errors = self.build()
        self.assertFalse(errors)
        self.assertEqual(area['discrepancies'][0]['state'], 'needs-source-access')
        self.assertEqual(area['requests'], [])

    def test_dependency_and_other_owner_not_claimed(self):
        self.tasks[0]['dependsOn'] = ['other']
        self.tasks[1]['status'] = 'in-progress'
        area, _, _, errors = self.build()
        self.assertFalse(errors)
        self.assertEqual(area['readyTasks'], [])
        self.assertEqual(area['waitingTasks'][0]['dependencies'], ['other'])

    def test_history_cannot_be_erased_or_reassigned(self):
        _, nodes, edges, _ = self.build()
        before = {'nodes': nodes, 'edges': edges}
        self.assertTrue(change_errors(before, {'nodes': [], 'edges': []}, []))
        after = copy.deepcopy(before)
        node = next(n for n in after['nodes'] if n['kind'] == 'model-discrepancy')
        node['sources'] = []
        self.assertTrue(change_errors(before, after, []))

    def test_workflow_records_are_not_geometry(self):
        for name in ('acceptance_standard', 'discrepancies', 'evidence_requests'):
            self.assertFalse(geometry_path(f'data/{name}.json'))
        self.assertTrue(geometry_path('data/pool_decks.json'))

    def test_existing_photo_spots_are_included_without_duplicate_requests(self):
        photo = {'id': 'spot', 'area': 'north-pool', 'ask': 'Take fixture photo', 'why': 'Fixture', 'state': 'open', 'photos': []}
        area, _, _, errors = self.build(photos=[photo])
        self.assertEqual(errors, [])
        self.assertEqual(len(area['requests']), 1)
        self.request.update(kind='photo', photoRequest='spot')
        area, _, _, errors = self.build([self.request], [photo])
        self.assertEqual(errors, [])
        self.assertEqual(len(area['requests']), 1)


if __name__ == '__main__':
    unittest.main()
