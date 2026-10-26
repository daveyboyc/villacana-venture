#!/usr/bin/env python3
"""Source inventories must not promote pixels, stale artifacts or private traces to map evidence."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from PIL import Image
from path_network_inventory import load_inventories

ROOT=Path(__file__).resolve().parents[1]

def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()

class InventoryValidation(unittest.TestCase):
    def fixture(self, root):
        for name in ['public/photos-ref','docs/inventory','scripts']:(root/name).mkdir(parents=True,exist_ok=True)
        image=root/'public/photos-ref/fixture.jpg';Image.new('RGB',(20,30)).save(image)
        (root/'scripts/path_network_inventory_viewer.html').write_text('<!doctype html>')
        path=root/'docs/inventory/inventory.json'
        data=dict(area='elena',scope='Fixture source-relative scope',sources=[dict(id='fixture.jpg',width=20,height=30,sha256=digest(image),disposition='observed',reason='Visible finite edge',limitations='No metric transform')],
            features=[dict(id='elena:edge',name='Finite observed edge',sources=['fixture.jpg'],observed='Visible edge ends at crop',unknowns=['Hidden return'],traces=[dict(source='fixture.jpg',points=[[1,2],[5,10]],role='visible finite edge')],mapGeometry=None)],drawings=[])
        path.write_text(json.dumps(data))
        entry=dict(area='elena',path='docs/inventory/inventory.json',review='docs/inventory/review.json')
        catalog=[dict(id='fixture.jpg',path='public/photos-ref/fixture.jpg',shows=['elena'])]
        self.review(root,path)
        return path,data,entry,catalog
    def review(self,root,path,**overrides):
        review=dict(status='reviewed',reviewer='Independent source reviewer',inventorySha256=digest(path),inspectedSourceIds=['fixture.jpg'],blockers=[],drawingSha256={})
        review.update(overrides);(root/'docs/inventory/review.json').write_text(json.dumps(review))
    def project(self,root,entry,catalog):
        problems=[];rows,accounting,summaries=load_inventories(root,dict(inventories=[entry]),catalog,[],problems)
        return rows,accounting,summaries,problems
    def test_reviewed_source_pixels_never_become_map_geometry(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);path,data,entry,catalog=self.fixture(root)
            rows,accounting,areas,problems=self.project(root,entry,catalog)
            self.assertEqual(problems,[]);self.assertTrue(areas['elena']['inventoryComplete'])
            self.assertIsNone(rows[0]['mapGeometry']);self.assertNotIn('axis',rows[0]);self.assertEqual(rows[0]['states']['placement'],'unreviewed')
            self.assertEqual(accounting['fixture.jpg']['features'],['path-observation:elena:edge'])
    def test_stale_inspection_or_drawing_review_cannot_complete_area(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);path,data,entry,catalog=self.fixture(root)
            self.review(root,path,inventorySha256='0'*64)
            self.assertFalse(self.project(root,entry,catalog)[2]['elena']['inventoryComplete'])
            self.review(root,path,drawingSha256={'missing.svg':'0'*64})
            self.assertFalse(self.project(root,entry,catalog)[2]['elena']['inventoryComplete'])
    def test_every_available_area_source_is_required(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);path,data,entry,catalog=self.fixture(root)
            catalog.append(dict(id='uninspected.jpg',path='public/photos-ref/uninspected.jpg',shows=['elena']))
            areas=self.project(root,entry,catalog)[2]
            self.assertFalse(areas['elena']['inventoryComplete']);self.assertEqual(areas['elena']['missingCatalogueSources'],['uninspected.jpg'])
    def test_pixel_bounds_world_geometry_and_dimensions_are_validated(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);path,data,entry,catalog=self.fixture(root)
            data['features'][0]['traces'][0]['points'][1]=[1000,1000]
            data['features'][0]['mapGeometry']=[[0,0],[1,1]]
            data['sources'][0]['width']=99;path.write_text(json.dumps(data));self.review(root,path)
            _,_,areas,problems=self.project(root,entry,catalog)
            self.assertTrue(any('invalid pixel trace' in p for p in problems))
            self.assertTrue(any('cannot author world geometry' in p for p in problems))
            self.assertTrue(any('dimensions stale' in p for p in problems))
            self.assertFalse(areas['elena']['inventoryComplete'])
    def test_changed_source_bytes_are_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);path,data,entry,catalog=self.fixture(root)
            Image.new('RGB',(20,30),color='red').save(root/'public/photos-ref/fixture.jpg')
            self.assertTrue(any('source bytes stale' in p for p in self.project(root,entry,catalog)[3]))
    def test_private_pixel_annotations_are_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);path,data,entry,catalog=self.fixture(root)
            catalog[0]['path']='villacana-reference/private.jpg'
            self.assertTrue(any('private pixel annotations' in p for p in self.project(root,entry,catalog)[3]))
            public=json.loads((root/'public/path-network/elena/inventory.json').read_text())
            self.assertIsNone(public['sources'][0]['image'])
            self.assertEqual(public['features'][0]['traces'],[])
    def test_shared_source_preserves_each_area_scope(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);path,data,entry,catalog=self.fixture(root)
            other=json.loads(json.dumps(data));other['features'][0]['id']='cervantes:edge'
            (root/'docs/inventory/other.json').write_text(json.dumps(other))
            problems=[];rows,accounting,areas=load_inventories(root,{'inventories':[entry,{**entry,'area':'cervantes','path':'docs/inventory/other.json'}]},catalog,[],problems)
            self.assertEqual(accounting['fixture.jpg']['areasInspected'],['cervantes','elena'])
            self.assertEqual(set(accounting['fixture.jpg']['features']),{'path-observation:elena:edge','path-observation:cervantes:edge'})
            self.assertEqual(len(accounting['fixture.jpg']['scopedReviews']),2)
    def test_new_comparison_requires_review_and_preserves_baseline(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);path,data,entry,catalog=self.fixture(root)
            base=root/'docs/inventory/base.json';base.write_text(json.dumps({'assessments':[dict(featureIds=['elena:edge'],modelRevision='1'*40,result='not-comparable')]}))
            baseline_hash=digest(base);entry['assessments']='docs/inventory/base.json'
            extra=root/'docs/inventory/new.json';review=root/'docs/inventory/material-review.md';review.write_text('Independent scoped material review fixture')
            payload=dict(scope='Material correction',review=dict(path='docs/inventory/material-review.md',sha256='0'*64),assessments=[dict(featureIds=['elena:edge'],modelRevision='2'*40,result='partial')])
            extra.write_text(json.dumps(payload));entry['additionalAssessments']=['docs/inventory/new.json'];self.review(root,path,assessmentSha256=baseline_hash)
            self.assertTrue(any('current scoped review' in p for p in self.project(root,entry,catalog)[3]))
            payload['review']['sha256']=digest(review);extra.write_text(json.dumps(payload))
            self.assertEqual(self.project(root,entry,catalog)[3],[])
            public=json.loads((root/'public/path-network/elena/inventory.json').read_text())
            self.assertEqual(len(public['assessments']),2)
            self.assertEqual(public['assessments'][0]['modelRevision'],'2'*40)
            self.assertEqual(public['assessments'][1]['modelRevision'],'1'*40)
            self.assertEqual(digest(base),baseline_hash)
    def test_current_real_inventory_retains_unknowns_and_hashes(self):
        data=json.loads((ROOT/'public/path-network.json').read_text())
        rows=[r for r in data['records'] if r['kind']=='path-observation' and 'elena' in r['areas']]
        self.assertGreaterEqual(len(rows),29)
        self.assertTrue(all(r['mapGeometry'] is None and r['unknowns'] for r in rows))
        ids={r['id'] for r in rows}
        graph=json.loads((ROOT/'refs/graph.json').read_text())
        self.assertTrue(any(e['relation']=='observed-in' and e['from'] in ids for e in graph['edges']))
        self.assertFalse(any(e['relation']=='placement-verified-by' and e['from'] in ids for e in graph['edges']))

if __name__=='__main__':unittest.main()
