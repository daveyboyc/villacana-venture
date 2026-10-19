#!/usr/bin/env python3
"""Adversarial fixtures for graph promotion; fixture approvals are never real reviews."""
import copy
import json
import struct
import tempfile
import unittest
import zlib
from pathlib import Path
from unittest.mock import patch
import build_references as refs
from placement_verification import (evaluate, model_inventory, source_snapshot, packet_digest,
                                     file_hash, photo_summary, FRAME, photo_report_id)
from check_placement_changes import change_errors


class PlacementPolicy(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
        for directory in ['data','src','public/map','public/photos-ref','docs']:(self.root/directory).mkdir(parents=True,exist_ok=True)
        self.write('public/map/skeleton.json',{'origin':{'lat':0,'lon':0}})
        self.write('public/map/ground.json',{'minX':0,'minZ':0,'maxX':100,'maxZ':100})
        # Minimal JPEG SOF header: dimensions only, no photographic content or actual approval.
        (self.root/'public/map/ground.jpg').write_bytes(b'\xff\xd8\xff\xc0'+struct.pack('>HBHH',8,8,100,100)+b'\x00\xff\xd9')
        self.write('data/sample.json',{'id':'object','point':[5,5]})
        (self.root/'src/sample.ts').write_text('import data from "../data/sample.json"; // fixture\n')
        for name in ['P1.jpg','P2.jpg','EXTRA.jpg']:(self.root/'public/photos-ref'/name).write_bytes(b'fixture pixels '+name.encode())
        for name in ['overlay.svg','comparison.md','independent.md']:(self.root/'docs'/name).write_text('Synthetic policy test fixture, not an actual review: '+name)
        def chunk(kind,data):return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
        png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',320,240,8,2,0,0,0))+chunk(b'IDAT',zlib.compress((b'\0'+b'\0'*960)*240))+chunk(b'IEND',b'')
        (self.root/'docs/render.png').write_bytes(png)
        self.catalog=[{'id':name,'path':'public/photos-ref/'+name,'kind':'phone-photo','viewpoint':'ground'} for name in ['P1.jpg','P2.jpg','EXTRA.jpg']]
        self.models=[{'id':'sample.json:object','kind':'reference feature','name':'Fixture object','points':[[5,5]],'evidence':['P1.jpg','P2.jpg']},
                     {'id':'building:control','kind':'building','name':'Control landmark fixture','ring':[[0,0],[10,0],[0,10]]},
                     {'id':'building:validation','kind':'building','name':'Held-out fixture','ring':[[10,10],[5,8],[9,8]]}]
        self.features=[{'id':m['id'],'name':m['name'],'photos':m.get('evidence',[])} for m in self.models]
        self.tasks=[{'id':'fix','kind':'layout','status':'in-progress','features':['sample.json:object'],'photos':['P1.jpg','P2.jpg']},
                    {'id':'follow-up','kind':'layout','status':'open','photos':[]}]
        self.inventory=model_inventory(self.root,self.models)

    def write(self,path,value):
        (self.root/path).write_text(json.dumps(value))

    def artifact(self,name):
        return {'path':'docs/'+name,'sha256':file_hash(self.root/'docs'/name)}

    def review(self,id='review-one'):
        required={'P1.jpg','P2.jpg','map:ground'}
        def anchor(id,point,feature):
            return {'id':id,'source':'map:ground','sourcePixel':point,'sourcePoint':point,'mapPoint':point,
                    'uncertaintyM':.1,'identification':'Fixture named corner '+id,'modelFeature':feature}
        p=self.models[0]['points'][0];source=[p[0]+.1,p[1]+.1]
        r={'id':id,'feature':'sample.json:object','task':'fix','author':'fixture-builder','checked':'2026-10-18','frame':FRAME,
           'toleranceM':.5,'limitations':'Synthetic test only; plan position within declared tolerance, not photographic match.',
           'snapshot':{'model':self.inventory['sample.json:object']['modelDigest'],'context':self.inventory['sample.json:object']['contextDigest'],
                       'sources':source_snapshot(self.root,required,{s['id']:s for s in self.catalog})},
           'overlay':self.artifact('overlay.svg'),'comparison':self.artifact('comparison.md'),'render':self.artifact('render.png'),
           'sourceAssessments':[{'source':id,'result':'supports' if id!='P2.jpg' else 'unusable','canEstablish':'Fixture topology',
                                 'cannotEstablish':'No real pixels or calibrated pose in this synthetic fixture','cameraStatus':'estimated','comparison':'consistent' if id=='P1.jpg' else 'not-comparable'} for id in sorted(required)],
           'registration':{'source':'map:ground','method':'georeferenced','transform':[1,0,0,1,0,0],
                           'controls':[anchor('c1',[0,0],'building:control'),anchor('c2',[10,0],'building:control'),anchor('c3',[0,10],'building:control')],
                           'validation':[anchor('v1',[10,10],'building:validation'),anchor('v2',[5,8],'building:validation')]},
           'measurements':[{'featurePoint':'Fixture centre','source':'map:ground','sourcePixel':source,'sourcePoint':source,'modelPoint':p,
                          'uncertaintyM':.1,'basis':'Synthetic fixture measurement'}],'resolves':[],'supersedes':[]}
        r['reviewer']={'id':'fixture-independent','decision':'approved','reviewedAt':'2026-10-18','sourcesInspected':sorted(required),
                       'packetDigest':packet_digest(r),'evidence':self.artifact('independent.md')}
        return r

    def run_policy(self,reviews=None,reports=None,checks=None):
        self.write('data/placement_reviews.json',{'reviews':reviews or [],'reports':reports or []})
        errors=[];states,_,_=evaluate(self.root,self.features,self.catalog,copy.deepcopy(self.tasks),checks or [],self.inventory,errors)
        return states['sample.json:object'],errors

    def report(self):
        return {'id':'wrong-place','feature':'sample.json:object','status':'open','sources':['P1.jpg'],
                'notes':'Fixture reports the wrong location','reportedBy':'fixture-owner','followUp':'follow-up'}

    def assert_rejected(self,review,needle):
        state,errors=self.run_policy([review]);self.assertNotEqual(state['status'],'verified');self.assertTrue(any(needle in e for e in errors),errors)

    def test_positive_packet_has_scoped_approval(self):
        state,errors=self.run_policy([self.review()]);self.assertEqual(errors,[]);self.assertEqual(state['status'],'verified');self.assertEqual(state['toleranceM'],.5)

    def test_citations_and_software_success_are_not_approval(self):
        state,errors=self.run_policy(checks=[{'feature':'sample.json:object','photo':'P1.jpg','result':'matches'}])
        self.assertEqual(errors,[]);self.assertEqual(state['status'],'unreviewed')

    def test_partial_and_noncomparable_photo_sets_do_not_match(self):
        c=[{'photo':'P1.jpg','result':'matches'}]
        self.assertEqual(photo_summary(['P1.jpg','P2.jpg'],c),'incomplete')
        self.assertEqual(photo_summary(['P1.jpg','P2.jpg'],c+[{'photo':'P2.jpg','result':'not-comparable'}]),'not-comparable')
        self.assertEqual(photo_summary(['P1.jpg','P2.jpg'],c+[{'photo':'P2.jpg','result':'differs'}]),'differs')

    def test_self_review_rejected(self):
        r=self.review();r['reviewer']['id']=' FIXTURE-BUILDER ';self.assert_rejected(r,'different from author')

    def test_reviewer_must_inspect_all_sources(self):
        r=self.review();r['reviewer']['sourcesInspected']=['P1.jpg'];self.assert_rejected(r,'every required source')

    def test_packet_edit_after_approval_rejected(self):
        r=self.review();r['toleranceM']=1;self.assert_rejected(r,'exact packet bytes')

    def test_missing_and_reused_validation_rejected(self):
        for mutation in ('missing','alias'):
            r=self.review()
            if mutation=='missing':r['registration']['validation']=[]
            else:r['registration']['validation'][0]={**r['registration']['controls'][0],'id':'renamed-control'}
            r['reviewer']['packetDigest']=packet_digest(r)
            self.assert_rejected(r,'held-out' if mutation=='missing' else 'reuse a control')

    def test_single_global_transform_cannot_warp_or_fake_pixels(self):
        for mutation in ('warp','pixels'):
            r=self.review()
            if mutation=='warp':r['registration']['method']='local-warp'
            else:r['registration']['validation'][0]['sourcePixel']=[90,90]
            r['reviewer']['packetDigest']=packet_digest(r)
            self.assert_rejected(r,'no local warping' if mutation=='warp' else 'single registered transform')

    def test_feature_outside_source_image_cannot_be_approved(self):
        self.models[0]['points']=[[150,5]];self.inventory=model_inventory(self.root,self.models)
        self.assert_rejected(self.review(),'outside inspected aerial bounds')

    def test_independent_model_landmarks_and_actual_feature_point_required(self):
        r=self.review();r['registration']['validation'][0]['mapPoint']=[10.1,10]
        r['reviewer']['packetDigest']=packet_digest(r);self.assert_rejected(r,'actual vertex')
        r=self.review();r['measurements'][0]['modelPoint']=[5.1,5.1]
        r['reviewer']['packetDigest']=packet_digest(r);self.assert_rejected(r,'actual feature')

    def test_outline_requires_all_vertices_not_one_matching_centre(self):
        self.models[0]['points']=[[5,5],[8,5],[8,8],[5,8]]
        self.inventory=model_inventory(self.root,self.models)
        r=self.review();self.assert_rejected(r,'every represented outline')
        template=r['measurements'][0]
        r['measurements']=[{**template,'featurePoint':'Corner '+str(i),'sourcePixel':[p[0]+.1,p[1]+.1],
                            'sourcePoint':[p[0]+.1,p[1]+.1],'modelPoint':p} for i,p in enumerate(self.models[0]['points'])]
        r['reviewer']['packetDigest']=packet_digest(r)
        state,errors=self.run_policy([r]);self.assertEqual(errors,[]);self.assertEqual(state['status'],'verified')

    def test_malformed_records_report_errors(self):
        self.write('data/placement_reviews.json',{'reviews':[None],'reports':[False]})
        problems=[]
        evaluate(self.root,self.features,self.catalog,self.tasks,[],self.inventory,problems)
        self.assertEqual(len(problems),2)

    def test_cyclic_supersession_rejected(self):
        reviews=[self.review(id) for id in ['a','b','c']]
        for r,old in zip(reviews,['b','c','a']):
            r['supersedes']=[old];r['reviewer']['packetDigest']=packet_digest(r)
        state,errors=self.run_policy(reviews)
        self.assertNotEqual(state['status'],'verified')
        self.assertTrue(any('invalid supersession' in e for e in errors),errors)

    def test_measured_error_and_uncertainty_enforced(self):
        r=self.review();r['registration']['validation'][0]['uncertaintyM']=1
        r['reviewer']['packetDigest']=packet_digest(r);self.assert_rejected(r,'exceeds placement tolerance')
        r=self.review();r['toleranceM']=100
        r['reviewer']['packetDigest']=packet_digest(r);self.assert_rejected(r,'toleranceM')

    def test_stale_geometry_and_renderer_context_rejected(self):
        r=self.review();self.models[0]['points']=[[8,5]];self.inventory=model_inventory(self.root,self.models)
        self.assert_rejected(r,'stale model')
        r=self.review();(self.root/'src/sample.ts').write_text('// changed renderer')
        self.inventory=model_inventory(self.root,self.models);self.assert_rejected(r,'stale model')

    def test_changed_source_pixels_and_overlay_bytes_rejected(self):
        r=self.review();(self.root/'public/photos-ref/P1.jpg').write_bytes(b'replaced source')
        self.assert_rejected(r,'stale model')
        r=self.review();(self.root/'docs/overlay.svg').write_text('changed comparison')
        self.assert_rejected(r,'bytes changed')

    def test_software_text_cannot_stand_in_for_current_render(self):
        r=self.review();r['render']=self.artifact('comparison.md');r['reviewer']['packetDigest']=packet_digest(r)
        self.assert_rejected(r,'PNG/JPEG')

    def test_descriptive_note_alone_does_not_move_geometry(self):
        before=self.inventory['sample.json:object']['modelDigest']
        self.write('data/sample.json',{'id':'object','point':[5,5],'trust':'New candid description, no coordinate change'})
        after=model_inventory(self.root,self.models)
        self.assertEqual(before,after['sample.json:object']['modelDigest'])

    def test_private_sources_require_immutable_version(self):
        self.features[0]['photos'].append('ref:photos/private.png')
        self.catalog.append({'id':'ref:photos/private.png','path':'villacana-reference/photos/private.png'})
        self.assert_rejected(self.review(),'immutable sourceRevision')

    def test_open_discrepancy_overrides_positive_packet(self):
        state,errors=self.run_policy([self.review()],[self.report()]);self.assertEqual(errors,[]);self.assertEqual(state['status'],'disputed')

    def test_closing_followup_or_toggling_status_cannot_resolve(self):
        self.tasks[1]['status']='done';state,errors=self.run_policy([self.review()],[self.report()])
        self.assertEqual(state['status'],'disputed');self.assertTrue(any('open follow-up' in e for e in errors))
        report=self.report();report['status']='resolved';report['resolutionReview']='missing'
        state,errors=self.run_policy([self.review()],[report]);self.assertEqual(state['status'],'disputed');self.assertTrue(any('same feature' in e for e in errors))

    def test_same_feature_current_review_can_resolve(self):
        r=self.review();r['resolves']=['wrong-place'];r['reviewer']['packetDigest']=packet_digest(r)
        report=self.report();report.update(status='resolved',resolutionReview=r['id'])
        state,errors=self.run_policy([r],[report]);self.assertEqual(errors,[]);self.assertEqual(state['status'],'verified')

    def test_other_feature_approval_cannot_close_report(self):
        r=self.review();r['resolves']=['wrong-place'];r['reviewer']['packetDigest']=packet_digest(r)
        report={**self.report(),'feature':'building:control','status':'resolved','resolutionReview':r['id']}
        _,errors=self.run_policy([r],[report])
        self.assertTrue(any('same feature' in e for e in errors),errors)

    def test_photo_difference_is_never_erased_by_later_match(self):
        check={'task':'fix','feature':'sample.json:object','photo':'P1.jpg','result':'differs','notes':'Fixture mismatch','by':'fixture-reviewer','followUp':'follow-up'}
        state,errors=self.run_policy([self.review()],checks=[check,{**check,'result':'matches'}])
        self.assertEqual(errors,[]);self.assertEqual(state['status'],'disputed');self.assertIn(photo_report_id(check),state['reportIds'])

    def test_new_done_geometry_task_needs_all_declared_features(self):
        self.tasks[0].update(status='done',features=['sample.json:object','building:control'])
        _,errors=self.run_policy([self.review()]);self.assertTrue(any('done geometry task' in e for e in errors))

    def test_historical_packet_requires_explicit_valid_supersession(self):
        old=self.review('old');self.models[0]['points']=[[6,5]];self.inventory=model_inventory(self.root,self.models)
        new=self.review('new');new['supersedes']=['old'];new['reviewer']['packetDigest']=packet_digest(new)
        state,errors=self.run_policy([old,new]);self.assertEqual(errors,[]);self.assertEqual(state['reviewIds'],['new'])

    def test_wrong_feature_photo_check_is_rejected(self):
        self.write('data/photo_checks.json',{'checks':[{'task':'fix','feature':'sample.json:object','photo':'EXTRA.jpg','result':'not-comparable','notes':'Fixture only'}]})
        errors=[]
        with patch.object(refs,'ROOT',self.root):refs.load_checks(self.catalog,copy.deepcopy(self.tasks),self.features,errors)
        self.assertTrue(any('not cited by this specific feature' in e for e in errors),errors)

    def test_graph_has_no_duplicate_or_dangling_ids(self):
        errors=[];refs.graph_integrity([{'id':'a'},{'id':'a'}],[{'from':'a','to':'missing','relation':'test'}],errors)
        self.assertEqual(len(errors),2)

    def test_ci_rejects_unapproved_geometry_but_allows_tooling(self):
        before={'modelState':{'f':{'modelDigest':'old','contextDigest':'old'}}}
        after={'modelState':{'f':{'modelDigest':'new','contextDigest':'new'}},'nodes':[{'id':'model:f','kind':'model-feature','featureId':'f','placement':{'status':'disputed'}}]}
        self.assertTrue(change_errors(before,after,['data/sample.json']))
        self.assertEqual(change_errors(before,after,['scripts/build_references.py']),[])
        after['nodes'][0]['placement']['status']='verified';self.assertEqual(change_errors(before,after,['data/sample.json']),[])

    def test_ci_shared_helper_needs_declared_current_review(self):
        before={'modelState':{'f':{'modelDigest':'same','contextDigest':'old'}}}
        after={'modelState':{'f':{'modelDigest':'same','contextDigest':'new'}},'nodes':[{'id':'model:f','kind':'model-feature','featureId':'f','placement':{'status':'verified','contextDigest':'new'}}]}
        self.assertTrue(change_errors(before,after,['src/helper.ts']))
        after['nodes'].append({'id':'task:fix','kind':'build-task','placement':{'features':['f']}})
        self.assertEqual(change_errors(before,after,['src/helper.ts']),[])

    def test_ci_keeps_history_even_without_geometry_edits(self):
        report={'id':'report:r','kind':'placement-discrepancy','feature':'f'}
        review={'id':'review:a','kind':'placement-review','snapshot':{'model':'original'}}
        before={'nodes':[report,review],'edges':[{'from':'report:r','to':'ref:p','relation':'discrepancy-source'}]}
        self.assertTrue(change_errors(before,{'nodes':[]},['data/placement_reviews.json']))
        after=copy.deepcopy(before);after['nodes'][0]['feature']='other'
        self.assertTrue(change_errors(before,after,['data/placement_reviews.json']))
        after=copy.deepcopy(before);after['nodes'][1]['snapshot']['model']='rewritten'
        self.assertTrue(change_errors(before,after,['data/placement_reviews.json']))
        after=copy.deepcopy(before);after['edges']=[]
        self.assertTrue(change_errors(before,after,['data/placement_reviews.json']))
        after=copy.deepcopy(before);after['nodes'][0]['status']='resolved'
        self.assertEqual(change_errors(before,after,['data/placement_reviews.json']),[])


if __name__=='__main__':unittest.main()
