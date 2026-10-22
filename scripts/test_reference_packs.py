"""Reject stale/unsupported source packs and keep the rollout candid about coverage."""
import copy
import unittest
from build_reference_packs import ROOT, catalogue, read, seed, validate

class ReferencePacks(unittest.TestCase):
    def setUp(self):self.pack=read(ROOT/'data/reference_packs/entrance.json')
    def test_pilot_has_tunnel_components_and_distinct_identity(self):
        self.assertTrue(validate(self.pack))
        self.assertGreaterEqual(len(self.pack['features']),32)
        self.assertTrue({'J05','J06','T11','T12'}<={f['id'] for f in self.pack['features']})
        self.assertTrue({f'T{i:02}' for i in range(1,11)}<={f['id'] for f in self.pack['features']})
        self.assertTrue(any(r['from']=='T' and r['to']=='J' and r['status']=='different-place' for r in self.pack['relationships']))
    def test_source_bytes_are_bound(self):
        self.pack['sources'][0]['sha256']='0'*64
        with self.assertRaisesRegex(AssertionError,'Stale source'):validate(self.pack)
    def test_private_or_traversed_pixels_rejected(self):
        self.pack['sources'][0]['path']='../villacana-reference/photos/drive/IMG_2334.jpg'
        with self.assertRaisesRegex(AssertionError,'public phone'):validate(self.pack)
    def test_bad_pixel_locator_rejected(self):
        self.pack['sources'][0]['observations'][0]['bbox']=[-1,0,1200,1600]
        with self.assertRaisesRegex(AssertionError,'bounds'):validate(self.pack)
    def test_trace_must_reference_known_feature(self):
        self.pack['sources'][0]['observations'][0]['feature']='T99'
        with self.assertRaisesRegex(AssertionError,'Unknown annotation'):validate(self.pack)
    def test_inventory_cannot_approve_build(self):
        self.pack['features'][0]['buildReady']=True
        with self.assertRaisesRegex(AssertionError,'not build'):validate(self.pack)
    def test_inferred_connection_needs_more_than_a_note(self):
        self.pack['relationships'][0]['status']='observed-connection'
        with self.assertRaisesRegex(AssertionError,'physical identity'):validate(self.pack)
    def test_draft_model_state_needs_pinned_feature(self):
        self.pack['features'][0]['modelFeatureIds']=[]
        with self.assertRaisesRegex(AssertionError,'pinned evidence'):validate(self.pack)
    def test_area_templates_are_uninspected_and_every_reference_is_listed(self):
        refs=catalogue();areas=read(ROOT/'data/areas.json')['areas'];seen=set()
        for area in areas:
            subset=[r for r in refs if area['id'] in r['shows']];template=seed(area,subset)
            self.assertEqual(template['features'],[]);self.assertEqual(template['sources'],[])
            self.assertIn(template['status'],['not-started','source-needed'])
            seen.update(r['id'] for r in template['candidateSources'])
        self.assertEqual(seen,{r['id'] for r in refs})

if __name__=='__main__':unittest.main()
