#!/usr/bin/env python3
"""Census completeness and semantic safeguards: software accounting is not survey approval."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
from path_network import extend

ROOT = Path(__file__).resolve().parents[1]

def read(path): return json.loads((ROOT/path).read_text())

class PathNetwork(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.graph = read('refs/graph.json')
        cls.data = read('public/path-network.json')
        cls.rows = cls.data['records']
        cls.ids = {r['id']:r for r in cls.rows}

    def test_every_area_and_private_unplaced_source_accounted(self):
        self.assertEqual({a['id'] for a in read('data/areas.json')['areas']},
                         {r['areas'][0] for r in self.rows if r['kind']=='path-area-coverage'})
        sources = [r['sourceId'] for r in self.rows if r['kind']=='path-source-accounting']
        self.assertEqual(len(sources), len(set(sources)))
        self.assertEqual(set(sources), {r['id'] for r in read('refs/catalog.json')})
        north = self.ids['path-coverage:north-lanes']
        self.assertEqual(north['sourceCoverage'], 'source needed')
        self.assertFalse(north['inventoryComplete'])

    def test_no_invented_physical_edges_or_portals(self):
        for r in self.rows:
            if r['kind']=='path-segment':
                for side in ['left','right']:
                    self.assertIsNone(r[side]['boundary'])
                    self.assertEqual(r[side]['unknownIntervals'], [[0,1]])
            if r['kind']=='path-tunnel':
                self.assertEqual(len(r['portals']),2)
                self.assertTrue(all(p['point'] is None and p['connection'] is None for p in r['portals']))
                self.assertEqual(r['access'], 'unknown')
        self.assertIsNone(self.data['totals']['confirmedUniqueTunnels'])
        self.assertEqual(self.data['totals']['tracedSides'],0)

    def test_legacy_census_and_signed_source_groups_separate(self):
        tunnels = [r for r in self.rows if r['kind']=='path-tunnel']
        aliases = [a for r in tunnels for a in r['aliases']]
        for p in read('data/passages.json')['passages']:
            self.assertEqual(aliases.count(p['id']),1)
        self.assertEqual(self.ids['path-tunnel:silvia']['sourceGroup'],'entrance:T')
        self.assertEqual(self.ids['path-tunnel:jorge']['sourceGroup'],'entrance:J')
        self.assertNotEqual(self.ids['path-tunnel:silvia']['sources'],self.ids['path-tunnel:jorge']['sources'])

    def test_runtime_axes_are_preserved_and_segments_form_chains(self):
        expected = read('public/map/skeleton.json')['boundaryReference']['roads']
        for route in expected:
            row = self.ids['path-route:'+route['id']]
            self.assertEqual(row['axis'],route['points'])
            segments = [self.ids[s] for s in row['segments']]
            self.assertEqual([segments[0]['axis'][0]]+[s['axis'][1] for s in segments],row['axis'])
            for a,b in zip(segments,segments[1:]): self.assertEqual(a['junctions'][1],b['junctions'][0])

    def test_registry_rings_preserved_without_ground_wall_claim(self):
        for b in read('public/map/skeleton.json')['buildings']:
            r = self.ids['path-boundary:registry:'+b['id']]
            self.assertEqual(r['outline'],b['ring'])
            self.assertEqual(r['physicalKind'],'unresolved')
            self.assertEqual(r['baselineKind'],'enclosure-or-parcel' if b['floors']==0 else 'ground-or-roof-unresolved')

    def test_graph_links_are_reachable_and_do_not_grant_approval(self):
        ids = [n['id'] for n in self.graph['nodes']]
        self.assertEqual(len(ids),len(set(ids)))
        self.assertTrue(all(e['from'] in ids and e['to'] in ids for e in self.graph['edges']))
        self.assertFalse(any(e['relation']=='placement-verified-by' and e['from'] in self.ids for e in self.graph['edges']))
        self.assertTrue(any(e['relation']=='represented-by' and e['from']=='path-tunnel:tun-001' for e in self.graph['edges']))

    def test_bad_source_accounting_is_rejected(self):
        # Run the real extension against an isolated copy; output cannot alter the checkout.
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for name in ['public/map/skeleton.json','data/path_network.json','data/dali_cervantes_threshold.json','data/coastal_gate.json','data/barraka_boardwalk.json','data/passages.json']:
                target = root/name; target.parent.mkdir(parents=True,exist_ok=True); target.write_text(json.dumps(read(name)))
            (root/'refs').mkdir()
            authored = read('data/path_network.json')
            authored['sourceAccounting']={'IMG_2190.jpg':{'disposition':'observed'},'bogus':{'disposition':'duplicate'}}
            (root/'data/path_network.json').write_text(json.dumps(authored))
            problems=[]
            extend(root, read('data/areas.json'), read('refs/catalog.json'), [], [], [], problems)
            self.assertTrue(any('unknown accounted source bogus' in p for p in problems))
            self.assertTrue(any('needs reason, reviewer and revision IMG_2190.jpg' in p for p in problems))
            self.assertTrue(any('needs feature links IMG_2190.jpg' in p for p in problems))

if __name__=='__main__': unittest.main()
