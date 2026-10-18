#!/usr/bin/env python3
"""Reproduce the north-pool audit without editing runtime geometry.

Public output contains only vector plans, measurements and source hashes.
--reference ../villacana-reference --private-out <outside-public-repo>
adds source-image overlays. Never publish those private comparisons here.
Requires numpy, Pillow, matplotlib (same Python environment as map tooling).
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import numpy as np
from PIL import Image
import matplotlib
matplotlib.use('Agg')
matplotlib.rcParams.update({'svg.hashsalt':'north-pool-audit-2026-10-18','svg.fonttype':'none'})
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.patches import Polygon

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/reviews/north-pool-alignment-audit'
OBS = json.loads((OUT / 'observations.json').read_text())
S = json.loads((ROOT / 'public/map/skeleton.json').read_text())
G = json.loads((ROOT / 'public/map/ground.json').read_text())
B = {b['id']:b for b in S['buildings']}
W, H = Image.open(ROOT / 'public/map/ground.jpg').size
DX, DZ = (G['maxX']-G['minX'])/W, (G['maxZ']-G['minZ'])/H
BOX = (-240, -85, -35, 70)
DETAIL = (-217, -18, -135, 64)
# Stable feature IDs in this saved audit, independent of building array order.
IDS = {b['id']:'B'+str(i) for i,b in enumerate(S['buildings'])}

def world(p):
    return np.array([G['minX']+p[0]*DX, G['minZ']+p[1]*DZ])

def pixel(p):
    return np.array([(p[0]-G['minX'])/DX, (p[1]-G['minZ'])/DZ])

def fit_similarity(ties):
    a=[]; b=[]
    for t in ties:
        u,v=t['google']; x,y=t['esri']
        a.extend(([u,-v,1,0], [v,u,0,1])); b.extend((x,y))
    return np.linalg.lstsq(a,b,rcond=None)[0]

FIT = fit_similarity(OBS['googleControls'])
AA, BB, TX, TY = FIT
MAT = np.array([[AA,-BB],[BB,AA]])

def google_to_esri(p):
    return MAT @ p + [TX,TY]

def esri_to_google(p):
    return np.linalg.solve(MAT,np.asarray(p)-[TX,TY])

def nearest(p,a,b):
    p,a,b=map(np.asarray,(p,a,b)); d=b-a
    t=np.clip(np.dot(p-a,d)/np.dot(d,d),0,1)
    return float(np.linalg.norm(p-a-t*d))

def ring_distance(p,ring):
    return min(nearest(p,a,ring[(i+1)%len(ring)]) for i,a in enumerate(ring))

def gap(a,b):
    return min(*(ring_distance(p,b) for p in a),*(ring_distance(p,a) for p in b))

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def measurements():
    d={'baseline':OBS['baseline'],'frame':{'origin':S['origin'],'axes':'+x east, +z south, metres','esriMetresPerPixel':[DX,DZ]},
       'similarityGooglePixelToEsriPixel':{'a':AA,'b':BB,'tx':TX,'ty':TY,'scale':math.hypot(AA,BB),'rotationDeg':math.degrees(math.atan2(BB,AA))},
       'googleControls':[],'googleValidation':[],'roofChecks':[],'waterEdgeChecks':[],'gapChecks':[],
       'sourceHashes':{p:sha(ROOT/p) for p in ['public/map/ground.jpg','public/map/ground.json','public/map/skeleton.json','data/catastro/buildingpart.gml.gz','data/catastro/otherconstruction.gml.gz']}}
    for key in ('googleControls','googleValidation'):
        for t in OBS[key]:
            delta=world(google_to_esri(t['google']))-world(t['esri'])
            d[key].append({**t,'localEsri':world(t['esri']).tolist(),'residualXZMetres':delta.tolist(),'residualMetres':float(np.linalg.norm(delta))})
        vals=[v['residualMetres'] for v in d[key]]
        d[key+'Summary']={'rmsM':float(np.sqrt(np.mean(np.square(vals)))),'maxM':max(vals)}
    for t in OBS['roofChecks']:
        model=B[t['building']]['ring'][t['vertex']]; delta=world(t['esri'])-model
        d['roofChecks'].append({**t,'model':model,'observedLocal':world(t['esri']).tolist(),'deltaXZMetres':delta.tolist(),'distanceM':float(np.linalg.norm(delta))})
    pool=next(p for p in S['pools'] if p['id']=='north')
    for t in OBS['waterEdgeChecks']:
        p=world(t['esri']); d['waterEdgeChecks'].append({**t,'observedLocal':p.tolist(),'nearestRegistryOutlineM':ring_distance(p,pool['ring'])})
    for t in OBS['gapChecks']:
        d['gapChecks'].append({**t,'modelGapM':gap(B[t['a']]['ring'],B[t['b']]['ring'])})
    r2,r3=d['roofChecks'][1:3]
    model=np.array(r3['model'])-r2['model']; obs=np.array(r3['observedLocal'])-r2['observedLocal']
    d['standaloneHouseEdge']={'modelLengthM':float(np.linalg.norm(model)),'observedRoofLengthM':float(np.linalg.norm(obs)),'orientationDifferenceDeg':math.degrees(math.atan2((model[0]*obs[1]-model[1]*obs[0]),np.dot(model,obs)))}
    a=json.loads((ROOT/'data/elena_north.json').read_text())['gateway']['points']
    c=json.loads((ROOT/'data/elena_gated_entry.json').read_text())['points']
    d['modeledElenaOpeningSeparationM']=float(np.linalg.norm(np.mean(a,axis=0)-np.mean(c,axis=0)))
    return d

LEGEND=[Line2D([0],[0],color='#ed4264',label='Registry nominal house plan (ground wall not surveyed)'),
 Line2D([0],[0],color='#a637ae',ls='--',label='Elevated registry passage (open below)'),
 Line2D([0],[0],color='#888888',ls=':',label='Zero-storey enclosure (not an asserted wall)'),
 Line2D([0],[0],color='#00cdd7',label='Registry pool construction outline'),
 Line2D([0],[0],color='#e6a52c',lw=3,label='Projecting upper roofs, PR #97 (not ground collision)'),
 Line2D([0],[0],color='#77b536',label='Existing estimated terrace limits'),
 Line2D([0],[0],color='#309a73',label='Existing photo-traced path'),
 Line2D([0],[0],color='#b08800',label='Street/path axis (widths mostly estimated)')]

def draw_features(ax,project,box,label=True):
    for b in S['buildings']:
        r=np.array(b['ring']); c=r.mean(axis=0)
        if not (box[0]-25<c[0]<box[2]+25 and box[1]-25<c[1]<box[3]+25):continue
        pts=np.array([project(p) for p in r]); col='#888888' if not b['floors'] else '#a637ae' if b.get('passage') else '#ed4264'
        ax.add_patch(Polygon(pts,closed=True,fill=False,ec=col,lw=.8,ls=':' if not b['floors'] else '--' if b.get('passage') else '-'))
        if label and box[0]<c[0]<box[2] and box[1]<c[1]<box[3]:
            p=project(c);ax.text(*p,IDS[b['id']],fontsize=6,color='#241d24',ha='center',va='center',bbox=dict(facecolor='white',alpha=.75,pad=.5,edgecolor='none'))
    for p in S['pools']:
        ax.add_patch(Polygon([project(q) for q in p['ring']],closed=True,fill=False,ec='#00cdd7',lw=1.2))
    for st in S['streets']:
        if not any(box[0]<p[0]<box[2] and box[1]<p[1]<box[3] for p in st['points']):continue
        pp=np.array([project(p) for p in st['points']]);ax.plot(pp[:,0],pp[:,1],color='#b08800',lw=1,marker='.',ms=3)
        # Label in view, near centre of the visible line.
        visible=[p for p in st['points'] if box[0]<p[0]<box[2] and box[1]<p[1]<box[3]]
        p=project(visible[len(visible)//2]);ax.text(*p,st['id'],fontsize=6,color='#6e4b00',bbox=dict(facecolor='white',alpha=.8,pad=1,edgecolor='none'))
    for filename,key,col in [('north_west_canopies.json','canopies','#e6a52c'),('raised_terraces.json','terraces','#77b536'),('north_pool_gardens.json',None,'#309a73')]:
        data=json.loads((ROOT/'data'/filename).read_text());data=data[key] if key else [data]
        for item in data:
            ring=item.get('ring',item.get('outline'))
            ax.add_patch(Polygon([project(p) for p in ring],closed=True,fill=False,ec=col,lw=1.1))
    for name,coords,col in [('Lawn arch',np.mean(json.loads((ROOT/'data/elena_north.json').read_text())['gateway']['points'],axis=0),'#0356ab'),('Private 36/34',np.mean(json.loads((ROOT/'data/elena_gated_entry.json').read_text())['points'],axis=0),'#0356ab')]:
        p=project(coords);ax.plot(*p,'o',color=col,ms=3);ax.annotate(name,p,xytext=(4,4),textcoords='offset points',fontsize=7,color=col,bbox=dict(facecolor='white',alpha=.8,pad=1,edgecolor='none'))

def public_plan():
    fig,ax=plt.subplots(figsize=(15,12));draw_features(ax,lambda p:p,BOX)
    for t in OBS['roofChecks']:
        p=world(t['esri']);ax.plot(*p,'+',color='black',ms=6);ax.annotate(t['id'],p,xytext=(4,5),textcoords='offset points',fontsize=7)
    ax.set(xlim=(BOX[0],BOX[2]),ylim=(BOX[3],BOX[1]),xlabel='x east (m)',ylabel='z south (m)',title='North-pool audit: unchanged baseline plans and measurement locations')
    ax.set_aspect('equal');ax.grid(alpha=.15);ax.legend(handles=LEGEND,loc='upper right',fontsize=7)
    fig.tight_layout();fig.savefig(OUT/'layout.svg',metadata={'Date':None});fig.savefig(OUT/'layout.png',dpi=140);plt.close(fig)

def residual_plot(d):
    fig,ax=plt.subplots(figsize=(8,7))
    for key,col in [('googleControls','#8b5cb3'),('googleValidation','#138f85')]:
        for p in d[key]:
            x,z=p['residualXZMetres'];ax.arrow(0,0,x,z,color=col,length_includes_head=True,head_width=.07);ax.text(x,z,' '+p['id']+f" {p['residualMetres']:.2f}m",fontsize=9)
    ax.set(xlim=(-2.5,2.5),ylim=(2.5,-2.5),xlabel='Google registered to Esri: east residual (m)',ylabel='South residual (m)',title='Single global similarity; held-out V landmarks were not fitted')
    ax.set_aspect('equal');ax.grid(alpha=.3);fig.tight_layout();fig.savefig(OUT/'alignment-residuals.svg',metadata={'Date':None});plt.close(fig)

def private_overlays(reference,out,d):
    if out.resolve().is_relative_to(ROOT):raise ValueError('Private outputs must be outside public repository')
    out.mkdir(parents=True,exist_ok=True)
    for name,source,box,project in [
      ('esri-context',ROOT/'public/map/ground.jpg',BOX,pixel),
      ('esri-courtyard',ROOT/'public/map/ground.jpg',DETAIL,pixel),
      ('google-satellite-overlay',reference/'google-maps/02-satellite-lane-names.png',BOX,lambda p:esri_to_google(pixel(p)))]:
        im=Image.open(source);fig,ax=plt.subplots(figsize=(15,12));ax.imshow(im);draw_features(ax,project,box)
        if name.startswith('google'):
            for key,col in [('googleControls','#bf56e6'),('googleValidation','#02fbcb')]:
                for t in d[key]:
                    pp=t['google'];ax.plot(*pp,'+',color=col,ms=10);ax.annotate(t['id']+f" {t['residualMetres']:.2f}m",pp,xytext=(5,-8),textcoords='offset points',fontsize=8,color=col,bbox=dict(facecolor='black',alpha=.8,pad=1,edgecolor='none'))
        else:
            for t in OBS['roofChecks']+OBS['waterEdgeChecks']:
                p=t['esri'];ax.plot(*p,'+',color='#ffff33',ms=6);ax.annotate(t['id'],p,xytext=(3,-6),textcoords='offset points',fontsize=7,color='white',bbox=dict(facecolor='black',alpha=.7,pad=1,edgecolor='none'))
        corners=np.array([project(p) for p in [(box[0],box[1]),(box[2],box[1]),(box[2],box[3]),(box[0],box[3])]])
        ax.set(xlim=(corners[:,0].min()-10,corners[:,0].max()+10),ylim=(corners[:,1].max()+10,corners[:,1].min()-10),title=name+' — source image unchanged; geometry projected globally')
        ax.legend(handles=LEGEND,loc='upper right',fontsize=7);fig.tight_layout();fig.savefig(out/(name+'.png'),dpi=160);plt.close(fig)
    # Whole-site controls/validation on both sources, distinct from scope-specific corrections.
    for name,source,which in [('esri-landmarks',ROOT/'public/map/ground.jpg','esri'),('google-landmarks',reference/'google-maps/02-satellite-lane-names.png','google')]:
        fig,ax=plt.subplots(figsize=(9,12));ax.imshow(Image.open(source))
        for key,col in [('googleControls','#f344ef'),('googleValidation','#00f8df')]:
            for t in d[key]:
                p=t[which];ax.plot(*p,'+',color=col,ms=12);ax.annotate(t['id'],p,xytext=(5,-8),textcoords='offset points',color=col,fontsize=11,bbox=dict(facecolor='black',alpha=.7,pad=1,edgecolor='none'))
        ax.set_title('C = fitted; V = held out; source pixels, no image warping');fig.tight_layout();fig.savefig(out/(name+'.png'),dpi=140);plt.close(fig)
    d['privateSourceHashes']={str(p.relative_to(reference)):sha(p) for p in [reference/'google-maps/02-satellite-lane-names.png',reference/'google-maps/01-street-map-lane-names.png']}
    (out/'measurements.json').write_text(json.dumps(d,indent=2)+'\n')
    (out/'index.html').write_text('''<!doctype html><meta charset="utf-8"><title>North pool private comparison</title><style>body{font:16px system-ui;background:#eee;margin:24px}img{max-width:100%}section{margin:30px 0}a{color:#135f96}</style><h1>North pool — private comparison</h1><p>Baseline e043c0e. C1–C3 fitted once globally; V1–V3 held out. No imagery is warped locally. Roof projections are not ground walls. See the public audit report for uncertainty and the full photo assessment.</p>'''+''.join(f'<section><h2>{name}</h2><a href="{name}.png"><img src="{name}.png"></a></section>' for name in ['esri-context','esri-courtyard','google-satellite-overlay','esri-landmarks','google-landmarks'])+'<p><a href="photo-comparisons.html">Photo/source comparability pairs</a></p><p>Original Google <a href="../../google-maps/02-satellite-lane-names.png">satellite</a> and <a href="../../google-maps/01-street-map-lane-names.png">standard</a>; <a href="../../contact-sheets/north-pool.jpg">north-pool contact sheet</a>. These originals remain private.</p>')

def validate_water_landmarks(reference):
    # Extract independently from image pixels, never from registry geometry.
    from trace_pools import components
    expected={'esri':{'north':[640.12,498.49],'middle':[843.09,792.72],'south':[1005.04,1195.35],'toddler':[1336.65,756.17]},
              'google':{'north':[359.30,875.84],'middle':[440.40,1339.61],'south':[410.57,1908.46],'toddler':[1052.84,1567.21]}}
    result={}
    for source,path in [('esri',ROOT/'public/map/ground.jpg'),('google',reference/'google-maps/02-satellite-lane-names.png')]:
        if not path.exists():
            result[source]={'status':'source unavailable; retained observed picks only'}
            continue
        im=Image.open(path).convert('RGB'); values={}
        for name,box in OBS['waterCentroids'][source].items():
            cells=components(im,tuple(box))[0]
            point=[sum(p[k] for p in cells)/len(cells) for k in range(2)]
            if np.linalg.norm(np.asarray(point)-expected[source][name])>.02:
                raise ValueError(f'{source} {name}: source pixel centroid changed; review registration')
            values[name]={'pixel':point,'componentPixels':len(cells)}
        result[source]=values
    return result

def main():
    p=argparse.ArgumentParser();p.add_argument('--reference',type=Path,default=ROOT.parent/'villacana-reference');p.add_argument('--private-out',type=Path);a=p.parse_args()
    d=measurements();d['reproducedWaterLandmarks']=validate_water_landmarks(a.reference);public_plan();residual_plot(d)
    for svg in (OUT/'layout.svg',OUT/'alignment-residuals.svg'):
        svg.write_text('\n'.join(line.rstrip() for line in svg.read_text().splitlines())+'\n')
    (OUT/'measurements.json').write_text(json.dumps(d,indent=2)+'\n')
    (OUT/'building-labels.json').write_text(json.dumps({v:k for k,v in IDS.items()},indent=2)+'\n')
    if a.private_out:private_overlays(a.reference,a.private_out,d)
    print(json.dumps({k:d[k] for k in ['googleControlsSummary','googleValidationSummary','roofChecks','waterEdgeChecks','gapChecks','standaloneHouseEdge','modeledElenaOpeningSeparationM']},indent=2))

if __name__=='__main__': main()
