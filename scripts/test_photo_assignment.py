"""Exercise GPS placement and uncertain/contradictory photo associations."""
import json
import tempfile
import unittest
from pathlib import Path
from PIL import Image
from assign_photo_map import assign, features, ROOT
from index_photos import index, project, metadata

class PhotoAssignmentTests(unittest.TestCase):
    def setUp(self):
        self.bounds={'minX':-100,'maxX':100,'minZ':-100,'maxZ':100}
        self.model=[{'id':'street:a','name':'Calle A','kind':'street','points':[[0,-30],[0,30]],'width':2},
                    {'id':'street:b','name':'Calle B','kind':'street','points':[[20,-30],[20,30]],'width':2}]
    def photo(self,**kwargs):return {'file':'p.jpg','title':'p','trust':'phone location','x':0,'z':0,'accuracy':2,**kwargs}
    def test_geographic_projection(self):
        self.assertEqual(project(36.4552,-5.05),(0,0))
        self.assertGreater(project(36.4552,-5.0499)[0],0)
        self.assertLess(project(36.4553,-5.05)[1],0)
    def test_does_not_snap_camera_to_street(self):
        a=assign(self.photo(x=3),self.model,self.bounds)
        self.assertEqual(a['camera']['x'],3)
        self.assertEqual(a['status'],'suggested')
        self.assertEqual(a['nearby'][0]['gap'],2)
    def test_uncertainty_reaches_two_streets(self):
        a=assign(self.photo(x=10,accuracy=14),self.model,self.bounds)
        self.assertEqual(a['status'],'needs-review')
        self.assertEqual(len(a['nearby']),2)
    def test_unknown_accuracy_is_review_not_fake_confidence(self):
        a=assign(self.photo(accuracy=None),self.model,self.bounds)
        self.assertEqual(a['status'],'needs-review')
        self.assertIsNone(a['camera']['reportedAccuracy'])
    def test_subject_sign_is_not_a_camera_location(self):
        a=assign(self.photo(streetHint='b'),self.model,self.bounds)
        self.assertEqual(a['status'],'needs-review')
        self.assertEqual(a['camera']['x'],0)
    def test_observed_beach_map_conflict_is_flagged(self):
        sea={'id':'area:sea','name':'Sea','kind':'area','ring':[[-10,-10],[10,-10],[10,10],[-10,10]]}
        a=assign(self.photo(areaHint='area:beach'),[sea],self.bounds)
        self.assertEqual(a['status'],'needs-review')
    def test_distant_unplaced_and_out_of_bounds(self):
        self.assertEqual(assign(self.photo(x=None),self.model,self.bounds)['status'],'unplaced')
        self.assertEqual(assign(self.photo(x=200),self.model,self.bounds)['status'],'needs-review')
    def test_heading_candidates_are_not_evidence(self):
        north={'id':'building:n','kind':'building','ring':[[-1,-12],[1,-12],[1,-10],[-1,-10]]}
        south={'id':'building:s','kind':'building','ring':[[-1,10],[1,10],[1,12],[-1,12]]}
        a=assign(self.photo(heading=0),self.model+[north,south],self.bounds)
        self.assertEqual([q['id']for q in a['inViewCandidates']],['building:n'])
        self.assertEqual(a['citedBy'],[])
    def test_import_keeps_existing_annotations_and_strips_metadata(self):
        with tempfile.TemporaryDirectory() as tmp:
            source=Path(tmp)/'originals';source.mkdir();out=Path(tmp)/'web';out.mkdir()
            exif=Image.Exif();exif[0x010E]='private source text'
            Image.new('RGB',(20,20),'red').save(source/'new.jpg',exif=exif)
            previous=[{'file':'older.jpg','title':'keep older','x':1,'z':2,'trust':'placed by eye'},
                      {'file':'new.jpg','title':'human title','observation':'human note','x':3,'z':4,'trust':'placed by eye'}]
            (out/'manifest.json').write_text(json.dumps(previous))
            result=index(source,out)
            self.assertEqual(len(result),2)
            entry=next(p for p in result if p['file']=='new.jpg')
            self.assertEqual((entry['x'],entry['title'],entry['observation']),(3,'human title','human note'))
            with Image.open(out/'new.jpg') as web:self.assertFalse(web.getexif())
    def test_source_photo_citations_remain_distinct(self):
        s=json.loads((ROOT/'public/map/skeleton.json').read_text())
        model=features(s)
        a=assign(self.photo(file='IMG_2267.jpg'),model,self.bounds)
        self.assertTrue(a['citedBy'])
        self.assertIn('No recorded',a['geometryReview'])

if __name__=='__main__':unittest.main()
