#!/usr/bin/env python3
"""Assign camera positions to map context and build a traceable evidence graph.

python3 scripts/assign_photo_map.py
Uses indexed GPS/uncertainty and existing map geometry. Does not snap pins,
recognise image contents, infer subject coordinates, or modify model geometry.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import re
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def inside(p,ring):
    hit=False
    for a,b in zip(ring,ring[1:]+ring[:1]):
        if (a[1]>p[1])!=(b[1]>p[1]) and p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]:hit=not hit
    return hit

def nearest(p,points):
    best=(math.inf,None)
    for a,b in zip(points,points[1:]):
        dx,dz=b[0]-a[0],b[1]-a[1];den=dx*dx+dz*dz
        t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/den)) if den else 0
        q=[a[0]+dx*t,a[1]+dz*t];d=math.dist(p,q)
        if d<best[0]:best=(d,q)
    return best

def features(s):
    result=[]
    def add(id,name,kind,source,**geometry):result.append(dict(id=id,name=name,kind=kind,source=source,**geometry))
    for r in s['boundaryReference']['roads']:add('street:'+r['id'],r['name'],'street','map layout',points=r['points'],width=r['width'])
    for b in s['buildings']:add('building:'+b['id'],b['id'],'building','registry',ring=b['ring'],passage=bool(b.get('passage')),**({'notStanding':True,'evidence':b['notStanding']['evidence']} if b.get('notStanding') else {}))
    for p in s['pools']:add('pool:'+p['id'],p['id']+' pool','pool','registry',ring=p['ring'])
    for p in s.get('areas',[]):
        if p.get('kind')=='car_park':add('parking:'+p['name'],p['name'],'parking','map layout',ring=p['ring'])
    sf=s.get('seafront',{})
    if sf:
        add('area:beach',sf['beach']['name'],'area','OSM/map with independent aerial shoreline review',ring=sf['beach']['ring'],evidence=sf['beach'].get('evidence',[]))
        add('area:sea',sf['sea']['name'],'area','OSM/map',ring=sf['sea']['ring'])
        add('area:paseo',sf['paseo']['name'],'area','OSM/map',points=sf['paseo']['points'],width=sf['paseo']['width'])
        add('area:barraka',sf['restaurant']['name'],'area','map/photo interpretation',ring=sf['restaurant']['ring'])
        # The paseo's sandstone retaining wall and timber edge (data/paseo_wall.json).
        pw=json.loads((ROOT/'data/paseo_wall.json').read_text())
        add('paseo_wall.json:'+pw['wall']['id'],pw['wall']['name'],'reference feature','authored photo/map interpretation',evidence=pw['wall']['evidence'],points=pw['wall']['face'])
        # The timber edge is on the paseo beside the wall: the mapped paseo points along the wall stand in for it.
        add('paseo_wall.json:'+pw['edge']['id'],pw['edge']['name'],'reference feature','authored photo/map interpretation',evidence=pw['edge']['evidence'],points=[q for q in sf['paseo']['points'] if nearest(q,pw['wall']['face'])[0]<8],width=sf['paseo']['width'])
    south=json.loads((ROOT/'data/south_pool.json').read_text())['seawardLevel']
    add('south_pool.json:'+south['id'],south['name'],'reference feature','authored photo/map interpretation',evidence=south['evidence'],points=s['seaWall']['points'])
    for filename,key in [('cervantes_north_patios.json','walls'),('frontage_divisions.json','regions'),('cervantes_patio_walls.json','walls'),('cervantes_east_hedge.json','walls'),('dali_cervantes_threshold.json','zones'),('passages.json','passages'),('coastal_gate.json','walls')]:
        data=json.loads((ROOT/'data'/filename).read_text())
        for f in data[key]:
            # Passages refer to an existing registry part rather than a second footprint.
            id='building:'+f['id'] if key=='passages' else filename+':'+f['id']
            existing=next((r for r in result if r['id']==id),None)
            evidence=re.findall(r'IMG_\d+\.jpg',json.dumps(f.get('evidence',[])))
            if existing:existing.update(name=f['name'],evidence=evidence)
            else:add(id,f['name'],'reference feature','authored photo/map interpretation',evidence=evidence,**{k:f[k] for k in ('ring','points') if k in f})
    def paseo_station(along,inland):
        for a,b in zip(pw['wall']['face'],pw['wall']['face'][1:]):
            length=math.dist(a,b)
            if along<=length:
                t=along/length
                return [a[0]+(b[0]-a[0])*t+(b[1]-a[1])/length*inland,a[1]+(b[1]-a[1])*t-(b[0]-a[0])/length*inland]
            along-=length
        raise ValueError('Paseo detail beyond shared wall')
    for f in json.loads((ROOT/'data/paseo_details.json').read_text())['features']:
        add('paseo_details.json:'+f['id'],f['name'],'reference feature','bounded photo interpretation; wall-relative positions estimated',evidence=f['evidence'],points=[paseo_station(s,f['inland']) for s in f['along']])
    junction=json.loads((ROOT/'data/junction_lawns.json').read_text())
    for tree in junction['trees']:
        add('junction_lawns.json:'+tree['id'],tree['name'],'reference feature','authored photo/map interpretation',evidence=tree['evidence'],points=[tree['point']])
    elena=json.loads((ROOT/'data/elena_north.json').read_text())
    for f in [elena['gateway'],*elena['walls'],*elena['beds'],*elena['planters'],elena['gardenPath']]:
        add('elena_north.json:'+f['id'],f['name'],'reference feature','authored photo/map interpretation',evidence=f['evidence'],**{k:f[k] for k in ('ring','points') if k in f})
    sw=json.loads((ROOT/'data/middle_pool_sw_gateway.json').read_text())
    fl=json.loads((ROOT/'data/middle_pool_steps.json').read_text());L=math.dist(fl['foot'],fl['toward'])
    gate=[fl['foot'][i]+(fl['toward'][i]-fl['foot'][i])/L*sw['gatewayAlong'] for i in range(2)]
    add('middle_pool_sw_gateway.json:'+sw['id'],sw['name'],'reference feature','authored photo/map interpretation',evidence=sw['evidence'],points=[[round(v,2) for v in gate]])
    paving=json.loads((ROOT/'data/seaward_paving.json').read_text())
    for f in paving['features']:
        ring=next((b['ring'] for b in s['buildings'] if b['id']==f.get('building')),None)
        add('seaward_paving.json:'+f['id'],f['id'].replace('-',' '),'reference feature','photo-supported material; estimated extent',evidence=f['evidence'],**({'ring':ring} if ring else {'points':f['points']}))
    entry=json.loads((ROOT/'data/elena_gated_entry.json').read_text())
    add('elena_gated_entry.json:'+entry['id'],entry['name'],'reference feature','authored photo/map interpretation',evidence=entry['evidence'],ring=entry['ring'],points=entry['points'])
    east=json.loads((ROOT/'data/elena_east_patios.json').read_text()) # issue #38
    for f in [*east['walls'],east['pergola']]:
        add('elena_east_patios.json:'+f['id'],f['name'],'reference feature','authored photo/map interpretation',evidence=f['evidence'],**{k:f[k] for k in ('ring','points') if k in f})
    south=json.loads((ROOT/'data/middle_pool_south_gate.json').read_text())
    add('middle_pool_south_gate.json:'+south['id'],south['name'],'reference feature','authored photo/map interpretation',evidence=south['evidence'],points=[south['center']])
    middle=json.loads((ROOT/'data/middle_pool.json').read_text())
    for f in [middle['gateway'],middle['planter']]:
        add('middle_pool.json:'+f['id'],f['name'],'reference feature','authored photo/map interpretation',evidence=f['evidence'],**{k:f[k] for k in ('ring','points') if k in f})
    picasso=json.loads((ROOT/'data/picasso_service_road.json').read_text())
    for f in picasso['features']:
        add('picasso_service_road.json:'+f['id'],f['name'],'reference feature','bounded single-photo estimate',points=f['points'],evidence=f['evidence'])
    north=json.loads((ROOT/'data/middle_pool_north.json').read_text())
    for f in [north['cap'],north['wall'],north['pergola'],north['steps']]:
        add('middle_pool_north.json:'+f['id'],f['name'],'reference feature','authored photo/map interpretation',evidence=f['evidence'],**{k:f[k] for k in ('ring','points') if k in f})
    result[-1]['points']=[north['steps']['foot'],north['steps']['toward']]
    eva=json.loads((ROOT/'data/eva_walled_lawn.json').read_text())
    add('eva_walled_lawn.json:'+eva['id'],eva['name'],'reference feature','authored photo/map interpretation',ring=eva['lawn']['ring'],evidence=eva['evidence']+eva['evaLawn']['evidence'])
    barraka=json.loads((ROOT/'data/barraka_boardwalk.json').read_text())
    for key in ('boardwalk','sign','seating'):
        f=barraka[key]
        points=f.get('points') or ([f['point']] if 'point' in f else f['parasols'])
        add('barraka_boardwalk.json:'+f['id'],f['name'],'reference feature','authored photo/map interpretation',evidence=f['evidence'],points=points)
    garden=json.loads((ROOT/'data/cervantes_garden_door.json').read_text())
    wall_points=[[garden['origin'][i]+a*garden['along'][i] for i in range(2)] for a in [-garden['wallWidth']/2,garden['wallWidth']/2]]
    add('cervantes_garden_door.json:'+garden['id'],garden['name'],'reference feature','authored photo/levels interpretation',points=wall_points,evidence=garden['evidence'])
    for part in ('patio','bed'):
        f=garden[part]
        add('cervantes_garden_door.json:'+f['id'],f['id'],'reference feature','authored photo/levels interpretation',ring=f['ring'],evidence=f['evidence'])
    for t in json.loads((ROOT/'data/raised_terraces.json').read_text())['terraces']:
        add('raised_terraces.json:'+t['id'],t['name'],'reference feature','authored photo/levels interpretation',ring=t['outline'],evidence=t['evidence'])
    for name in ('cervantes_elena_steps','middle_pool_steps'):
        steps=json.loads((ROOT/f'data/{name}.json').read_text())
        add('steps:'+steps['id'],steps['name'],'reference feature','authored photo/map interpretation',points=[steps['foot'],steps['toward']],evidence=steps['evidence'])

    sills=json.loads((ROOT/'data/door_sills.json').read_text())
    for f in sills['sills']+sills['surfaces']+sills['kerbs']+sills['drains']:
        add('door_sills.json:'+f['id'],f['name'],'reference feature',f['trust'],evidence=f['evidence'],**({'ring':f['ring']} if 'ring' in f else {'points':f.get('points',[f.get('center')])}))
    for f in json.loads((ROOT/'data/terrain.json').read_text()).get('localSurfaces',[]):
        add('terrain.json:'+f['id'],f['name'],'reference feature',f['trust'],points=[f['foot'],f['top']],evidence=f['evidence'])

    for r in s['boundaryReference'].get('ramps',[]):add('ramp:'+r['id'],r['name'],'reference feature','authored photo/map interpretation',points=r['points'],evidence=re.findall(r'IMG_\d+\.jpg',json.dumps(r['evidence'])))
    coastal=json.loads((ROOT/'data/coastal_gate.json').read_text())['gate']
    add('gate:'+coastal['id'],coastal['name'],'reference feature','authored photo/map interpretation',points=coastal['points'],evidence=coastal['evidence'])
    assert len({f['id'] for f in result})==len(result),'Duplicate map feature IDs'
    return result

def assign(photo,model,bounds):
    result={'file':photo['file'],'status':'unplaced','reasons':[],'nearby':[],'inViewCandidates':[],'citedBy':[],'geometryReview':photo.get('visualReview','No recorded photo-to-model comparison')}
    if not all(isinstance(photo.get(k),(int,float)) and math.isfinite(photo[k]) for k in ('x','z')):
        result['reasons'].append('No usable camera coordinates');return result
    p=[photo['x'],photo['z']];result['camera']={'x':p[0],'z':p[1],'basis':photo['trust']}
    accuracy=photo.get('accuracy');known=isinstance(accuracy,(int,float)) and math.isfinite(accuracy) and accuracy>0
    radius=accuracy if known else 10
    result['camera']['reportedAccuracy']=round(accuracy,1) if known else None
    flags=[]
    if not bounds['minX']<=p[0]<=bounds['maxX'] or not bounds['minZ']<=p[1]<=bounds['maxZ']:flags.append('Camera is outside the mapped bounds')
    if not known:flags.append('GPS uncertainty is unknown; 10 m search radius is a review heuristic')
    elif radius>8:flags.append('GPS uncertainty exceeds 8 m')
    for f in model:
        if f['kind'] not in ('street','area','parking'):continue
        if 'ring' in f:gap=0 if inside(p,f['ring']) else nearest(p,f['ring']+[f['ring'][0]])[0]
        else:gap=max(0,nearest(p,f['points'])[0]-f.get('width',0)/2)
        if gap<=radius+2: # Map axes/widths are estimated to about 1–2 metres.
            result['nearby'].append({'id':f['id'],'name':f['name'],'kind':f['kind'],'gap':round(gap,1)})
    result['nearby'].sort(key=lambda q:(q['gap'],q['id']))
    streets=[q for q in result['nearby'] if q['kind']=='street']
    # Two parts of one named street do not count as two different street names.
    if len({q['name'] for q in streets})>1:flags.append('Uncertainty reaches more than one named street')
    hint=photo.get('streetHint')
    if hint and 'street:'+hint not in {q['id'] for q in streets}:flags.append('Photo/sign interpretation disagrees with the GPS street candidates')
    area_hint=photo.get('areaHint')
    if area_hint and area_hint not in {q['id'] for q in result['nearby']}:flags.append('Observed camera area disagrees with the GPS/map area candidates')
    if not result['nearby']:flags.append('No mapped street/area within the uncertainty range')
    if known and any(f['kind']=='building' and not f.get('passage') and inside(p,f['ring']) for f in model):flags.append('Camera overlaps a solid registry footprint; check GPS drift or footprint alignment')
    heading=photo.get('heading')
    if isinstance(heading,(int,float)) and math.isfinite(heading):
        result['camera']['heading']=heading
        result['camera']['headingBasis']=photo.get('headingBasis','Existing recorded heading; calibration unknown')
        for f in model:
            if f['kind']!='building':continue
            ring=f['ring'];q=[sum(v[j] for v in ring)/len(ring) for j in (0,1)];distance=math.dist(p,q)
            angle=math.degrees(math.atan2(q[0]-p[0],-(q[1]-p[1])))%360
            delta=abs((angle-heading+180)%360-180)
            if 2<distance<=45 and delta<=35:result['inViewCandidates'].append({'id':f['id'],'distance':round(distance,1),'angleOffset':round(delta,1)})
        result['inViewCandidates'].sort(key=lambda q:q['distance']);result['inViewCandidates']=result['inViewCandidates'][:3]
    result['citedBy']=[f['id'] for f in model if photo['file'] in f.get('evidence',[])]
    result['status']='needs-review' if flags else 'suggested'
    result['reasons']=flags or ['Compatible map context; metadata association remains a suggestion']
    return result

def build(manifest,s,bounds):
    model=features(s);assignments=[assign(p,model,bounds) for p in manifest]
    nodes=[{k:v for k,v in f.items() if k not in ('ring','points','width')} for f in model]
    edges=[]
    for photo,a in zip(manifest,assignments):
        id='photo:'+photo['file'];nodes.append({'id':id,'kind':'photo','name':photo['title'],'file':photo['file'],'status':a['status']})
        for q in a['nearby']:edges.append({'from':id,'to':q['id'],'relation':'camera-nearby','gap':q['gap']})
        for q in a['inViewCandidates']:edges.append({'from':id,'to':q['id'],'relation':'possibly-in-view','distance':q['distance'],'angleOffset':q['angleOffset']})
        for id2 in a['citedBy']:edges.append({'from':id,'to':id2,'relation':'cited-as-source','visualValidation':'not established by citation'})
    summary=dict(Counter(a['status'] for a in assignments));summary.update(photos=len(manifest),features=len(model),photosCitedByModel=sum(bool(a['citedBy']) for a in assignments),modelFeaturesWithPhotoCitations=sum(bool(f.get('evidence')) for f in model))
    # Digest rather than a runtime timestamp makes repeated builds deterministic.
    digest=hashlib.sha256(json.dumps([manifest,s],sort_keys=True).encode()).hexdigest()
    policy={'version':1,'inputDigest':digest,'summary':summary,'method':'GPS camera position, reported uncertainty + 2 m map tolerance; nearby features and heading cone are suggestions. No image recognition, occlusion check, subject-position inference, survey or automatic geometry editing.'}
    return dict(policy,photos=assignments),dict(policy,nodes=nodes,edges=edges)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest',type=Path,default=ROOT/'public/photos-ref/manifest.json')
    parser.add_argument('--skeleton',type=Path,default=ROOT/'public/map/skeleton.json')
    parser.add_argument('--out',type=Path,default=ROOT/'public/photos-ref')
    args=parser.parse_args()
    s=json.loads(args.skeleton.read_text());bounds=json.loads((ROOT/'public/map/villacana.json').read_text())['bounds']
    assignments,graph=build(json.loads(args.manifest.read_text()),s,bounds)
    args.out.mkdir(parents=True,exist_ok=True)
    for name,data in [('assignments.json',assignments),('evidence-graph.json',graph)]:
        (args.out/name).write_text(json.dumps(data,indent=1,ensure_ascii=False)+'\n')
    print(json.dumps(assignments['summary']))
if __name__=='__main__':main()
