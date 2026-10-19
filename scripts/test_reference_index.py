#!/usr/bin/env python3
"""Discovery completeness, privacy boundary and stable source links for agents."""
import json
import unittest
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from find_reference import find
from build_references import task_verification

ROOT = Path(__file__).resolve().parents[1]


class ReferenceDiscovery(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.index = json.loads((ROOT / 'public/reference-index.json').read_text())
        cls.catalog = json.loads((ROOT / 'refs/catalog.json').read_text())

    def test_every_catalog_source_has_a_stable_link(self):
        rows = self.index['references']
        self.assertEqual(len({r['id'] for r in rows}), len(rows))
        self.assertEqual({r['id'] for r in rows}, {r['id'] for r in self.catalog})
        for r in rows:
            self.assertEqual(parse_qs(urlparse(r['mapUrl']).query)['photo'], [r['id']])
            if r['private']:
                self.assertIsNone(r['image'])
                self.assertIsNone(r['thumbnail'])
                self.assertTrue(r['sourceUrl'].startswith('https://github.com/daveyboyc/villacana-reference/blob/main/'))
            else:
                self.assertTrue((ROOT / 'public' / r['image']).is_file(), r['id'])
                self.assertTrue((ROOT / 'public' / r['thumbnail']).is_file(), r['id'])

    def test_boat_is_discoverable_with_location_caveat(self):
        rows = find('boat')
        self.assertEqual({r['id'] for r in rows}, {'IMG_2223.jpg', 'IMG_2346.jpg', 'IMG_2347.jpg'})
        for r in rows:
            self.assertIn('barbecue', r['label'])
            self.assertIn('not a traced boat footprint', r['locationBasis'])
            self.assertEqual(r['looksAtBasis'], 'reviewed')
            self.assertNotEqual([r['camera']['x'], r['camera']['z']], r['looksAt'])

    def test_private_and_unplaced_are_searchable(self):
        for r in self.index['references']:
            if r['private'] or not r['camera']:
                self.assertIn(r['id'], {row['id'] for row in find(r['id'])})

    def test_tooling_does_not_claim_a_photographic_match(self):
        task={'id':'ui','kind':'tooling','photos':[]}
        self.assertEqual(task_verification(task,[]),'not-applicable (tooling)')
        self.assertEqual(task_verification({**task,'photos':['IMG_2223.jpg']},[]),'unchecked')
        self.assertEqual(task_verification({**task,'kind':'structure'},[]),'unchecked')
        checked=[{'task':'ui','photo':'IMG_2223.jpg','result':'not-comparable'}]
        self.assertEqual(task_verification({**task,'photos':['IMG_2223.jpg']},checked),'not-comparable')

    def test_graph_has_every_model_with_unique_reachable_ids(self):
        graph=json.loads((ROOT/'refs/graph.json').read_text())
        self.assertEqual(graph['version'],2)
        ids=[n['id'] for n in graph['nodes']]
        self.assertEqual(len(ids),len(set(ids)))
        self.assertTrue(all(e['from'] in ids and e['to'] in ids for e in graph['edges']))
        models={n['featureId']:n for n in graph['nodes'] if n['kind']=='model-feature'}
        self.assertEqual(set(models),set(graph['modelState']))
        for row in self.index['references']:
            for f in row['features']:
                self.assertEqual(f['placement'],models[f['id']]['placement'])

    def test_real_planter_report_blocks_promotion(self):
        graph=json.loads((ROOT/'refs/graph.json').read_text())
        planter=next(n for n in graph['nodes'] if n.get('featureId')=='barraka_boardwalk.json:barraka-sign-planter')
        self.assertEqual(planter['verification'],'disputed')
        self.assertIn('barraka-planter-position',planter['placement']['reportIds'])
        self.assertFalse(any(e['from']==planter['id'] and e['relation']=='placement-verified-by' for e in graph['edges']))
        report=next(n for n in graph['nodes'] if n['id']=='placement-discrepancy:barraka-planter-position')
        self.assertEqual(report['followUp'],'barraka-planter-placement')

    def test_frame_and_camera_positions_not_silently_transformed(self):
        skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
        self.assertEqual(self.index['frame']['viewRotation'], skeleton['viewRotation'])
        manifest = {p['file']: p for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
        for r in self.index['references']:
            if r['camera']:
                self.assertEqual([r['camera']['x'], r['camera']['z']], [manifest[r['id']]['x'], manifest[r['id']]['z']])


if __name__ == '__main__':
    unittest.main()
