#!/usr/bin/env python3
"""Build the reference catalogue and one brief per area for agents.

python3 scripts/build_references.py [--reference ../villacana-reference] [--sheets] [--check]

Reads every indexed phone photo (public/photos-ref/manifest.json), its map
assignment, the hand-reviewed tags in data/reference_tags.json and the private
reference repo, and writes:
  refs/catalog.json        every reference, its areas, viewpoint and uses
  refs/README.md           the index: areas, topics, counts, what is untagged
  refs/areas/<id>.md       the brief an agent reads before working on an area
  refs/topics/<id>.md      the same, by topic (levels and slopes, materials...)
  refs/graph.json          areas, topics, references and model features, and how they link
With --sheets, contact sheets of thumbnails go to <reference>/contact-sheets/,
because they include private images and this repo is public.
--check fails if a reference has no area, or a tag names an unknown area,
topic or file.

A camera position only suggests areas. 'shows' in reference_tags.json is what
a person or agent saw in the picture, and replaces the suggestion.
"""
from __future__ import annotations
import argparse
import importlib.util
import json
import math
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VIEWPOINTS=('ground','upper-floor','roof','aerial','map')
spec=importlib.util.spec_from_file_location('assign',ROOT/'scripts/assign_photo_map.py')
assign=importlib.util.module_from_spec(spec);spec.loader.exec_module(assign)

def load(path:Path,default=None):
    return json.loads(path.read_text()) if path.exists() else default

def centroid(ring):
    return [sum(p[0] for p in ring)/len(ring),sum(p[1] for p in ring)/len(ring)]

def area_matchers(areas,skeleton):
    """Map each map feature id used by assign_photo_map.py to the areas it belongs to."""
    by_feature={};near_points=[]
    pools={p['id']:centroid(p['ring']) for p in skeleton['pools']}
    seafront={'beach':'area:beach','sea':'area:sea','paseo':'area:paseo','restaurant':'area:barraka'}
    for area in areas:
        m=area.get('match',{})
        for s in m.get('streets',[]):by_feature.setdefault('street:'+s,[]).append(area['id'])
        for s in m.get('parking',[]):by_feature.setdefault('parking:'+s,[]).append(area['id'])
        for s in m.get('seafront',[]):by_feature.setdefault(seafront[s],[]).append(area['id'])
        for p in m.get('pools',[]):near_points.append((pools[p],m.get('radius',30),area['id']))
        for x,z,r in m.get('points',[]):near_points.append(([x,z],r,area['id']))
    return by_feature,near_points

def camera_areas(photo,assignment,by_feature,near_points,streets):
    """Areas suggested by where the camera stood. Returns (areas, basis)."""
    if not all(isinstance(photo.get(k),(int,float)) for k in ('x','z')):return [],'no camera position'
    p=[photo['x'],photo['z']];found=[]
    for n in (assignment or {}).get('nearby',[]):
        for a in by_feature.get(n['id'],[]):
            if a not in found:found.append(a)
    for centre,radius,a in near_points:
        if math.dist(p,centre)<=radius and a not in found:found.append(a)
    if found:return found,'camera position'
    # A camera on a roof or in a courtyard can be far from any lane axis.
    best=min(((max(0,assign.nearest(p,s['points'])[0]-s['width']/2),s['id']) for s in streets),default=(math.inf,None))
    if best[0]<=30:
        areas=by_feature.get('street:'+best[1],[])
        if areas:return areas,f'nearest lane, {best[0]:.0f} m from the camera (weak)'
    return [],'camera not near any area'

def reference_files(reference:Path):
    if not reference.is_dir():return []
    keep=('.jpg','.jpeg','.png')
    # photos/drive/ duplicates public/photos-ref/; contact sheets are our own output.
    rel=(p.relative_to(reference) for p in reference.rglob('*') if p.suffix.lower() in keep)
    return sorted(str(r) for r in rel if r.parts[0] not in ('.git','contact-sheets','uploads') and r.parts[:2]!=('photos','drive'))

def build(reference:Path):
    spec=load(ROOT/'data/areas.json');areas=spec['areas'];topics=spec['topics']
    area_ids={a['id'] for a in areas};topic_ids={t['id'] for t in topics}
    skeleton=load(ROOT/'public/map/skeleton.json')
    manifest=load(ROOT/'public/photos-ref/manifest.json',[])
    assignments={a['file']:a for a in load(ROOT/'public/photos-ref/assignments.json',{'photos':[]})['photos']}
    labels=load(ROOT/'public/photos-ref/labels.json',{})
    tags={k:v for k,v in load(ROOT/'data/reference_tags.json',{}).items() if k!='about'}
    by_feature,near_points=area_matchers(areas,skeleton)
    streets=skeleton['boundaryReference']['roads']
    problems=[];catalog=[]
    for photo in manifest:
        f=photo['file'];tag=tags.get(f,{});a=assignments.get(f)
        suggested,basis=camera_areas(photo,a,by_feature,near_points,streets)
        title=labels.get(f) or (photo['title'] if photo.get('title')!=Path(f).stem else None)
        entry={'id':f,'kind':'phone-photo','path':'public/photos-ref/'+f,
               'title':tag.get('title') or title or Path(f).stem,
               'shows':tag.get('shows') or suggested,
               'areasBasis':'reviewed' if tag.get('shows') else basis,
               'viewpoint':tag.get('viewpoint'),'useFor':tag.get('useFor',[]),
               'note':tag.get('note'),'observation':photo.get('observation'),
               'taken':photo.get('taken'),'originalUrl':photo.get('originalUrl')}
        if 'x' in photo:entry['camera']={k:photo[k] for k in ('x','z','heading','accuracy','altitude') if k in photo}
        entry['citedBy']=(a or {}).get('citedBy',[])
        catalog.append(entry)
    files=set(reference_files(reference))
    for key,tag in tags.items():
        if not key.startswith('ref:'):continue
        path=key[4:]
        if reference.is_dir() and path not in files:problems.append(f'{key}: no such file in {reference.name}')
        catalog.append({'id':key,'kind':tag.get('kind','reference'),'path':f'{reference.name}/{path}',
                        'title':tag.get('title',path),'shows':tag.get('shows',[]),'areasBasis':'reviewed' if tag.get('shows') else 'untagged',
                        'viewpoint':tag.get('viewpoint'),'useFor':tag.get('useFor',[]),'note':tag.get('note'),'citedBy':[]})
    for path in sorted(files-{k[4:] for k in tags if k.startswith('ref:')}):
        problems.append(f'ref:{path}: in {reference.name} but has no entry in data/reference_tags.json')
        catalog.append({'id':'ref:'+path,'kind':'reference','path':f'{reference.name}/{path}','title':path,'shows':[],'areasBasis':'untagged','viewpoint':None,'useFor':[],'note':None,'citedBy':[]})
    known={e['id'] for e in catalog}
    for key,tag in tags.items():
        if key not in known:problems.append(f'{key}: tagged but not indexed')
        for s in tag.get('shows',[]):
            if s not in area_ids:problems.append(f'{key}: unknown area {s!r}')
        for u in tag.get('useFor',[]):
            if u not in topic_ids:problems.append(f'{key}: unknown topic {u!r}')
        if tag.get('viewpoint') not in (None,*VIEWPOINTS):problems.append(f'{key}: unknown viewpoint {tag["viewpoint"]!r}')
    for e in catalog:
        if not e['shows']:problems.append(f'{e["id"]}: no area (tag it in data/reference_tags.json)')
    return spec,catalog,problems

def model_features(catalog):
    """Model features from the evidence graph, each placed in the areas its cited photos mostly show."""
    graph=load(ROOT/'public/photos-ref/evidence-graph.json',{'nodes':[],'edges':[]})
    names={n['id']:n.get('name',n['id']) for n in graph['nodes']}
    shows={e['id']:e['shows'] for e in catalog}
    features={}
    for edge in graph['edges']:
        if edge['relation']!='cited-as-source':continue
        features.setdefault(edge['to'],{'id':edge['to'],'name':names.get(edge['to'],edge['to']),'photos':[]})['photos'].append(edge['from'][len('photo:'):])
    for f in features.values():
        votes={}
        for photo in f['photos']:
            for a in shows.get(photo,[])[:1]:votes[a]=votes.get(a,0)+1
        top=max(votes.values(),default=0);f['areas']=sorted(a for a,v in votes.items() if v==top)
        f['photos'].sort()
    return sorted(features.values(),key=lambda f:f['id'])

def mermaid(area,features):
    """A small diagram: the area, the model features built from its photos, and those photos."""
    here=[f for f in features if area['id'] in f['areas']]
    if not here:return []
    safe=lambda t:t.replace('"',"'")
    out=['```mermaid','graph LR',f'  A["{safe(area["name"])}"]']
    for i,f in enumerate(here):
        out.append(f'  A --> F{i}["{safe(f["name"])}"]')
        for photo in f['photos']:out.append(f'  F{i} --> P{photo.replace(".","_").replace("-","_")}(["{Path(photo).stem}"])')
    return out+['```','']

def rank(e,area=None):
    # Reviewed first, then pictures mainly of this area, then ones the model already cites.
    main=bool(e['shows']) and e['shows'][0]==area
    return (e['areasBasis']!='reviewed',not main,-len(e.get('citedBy',[])),-len(e['useFor']),e['id'])

def link(e,depth):
    up='../'*depth
    if e['path'].startswith('public/'):return f'[{e["id"]}]({up}../{e["path"]})'
    return f'`{e["path"]}`'

def row(e,depth):
    use=', '.join(e['useFor']) or 'not reviewed'
    view=e['viewpoint'] or 'not reviewed'
    extra=f' **Note:** {e["note"]}' if e.get('note') else ''
    cited=f' _Used by: {", ".join(e["citedBy"])}._' if e.get('citedBy') else ''
    return f'| {link(e,depth)} | {view} | {use} | {e["title"]}{extra}{cited} |'

def table(entries,depth,area=None):
    lines=['| Reference | Viewpoint | Use for | What it shows |','| --- | --- | --- | --- |']
    return lines+[row(e,depth) for e in sorted(entries,key=lambda e:rank(e,area))]

def brief(area,entries,topics,spec,features=()):
    reviewed=[e for e in entries if e['areasBasis']=='reviewed']
    guessed=[e for e in entries if e['areasBasis']!='reviewed']
    out=[f'# {area["name"]}','',f'_Generated by `scripts/build_references.py`. Do not edit: change `data/areas.json` or `data/reference_tags.json` and rebuild._','',area['summary'],'']
    if area.get('notes'):
        out+=['## Known facts and open questions','']+[f'- {n}' for n in area['notes']]+['']
    out+=['## Read first','']
    for kind in ('docs','data','src'):
        if area.get(kind):out.append(f'- {kind}: '+', '.join(f'`{p}`' for p in area[kind]))
    out+=['- contact sheet: `villacana-reference/contact-sheets/'+area['id']+'.jpg` (thumbnails of everything below, numbered in this order)','']
    counts={t['id']:sum(t['id'] in e['useFor'] for e in entries) for t in topics}
    out+=['## Coverage','',', '.join(f'{t["name"]}: {counts[t["id"]]}' for t in topics if counts[t['id']])+('' if any(counts.values()) else 'No references reviewed by topic yet.'),
          f'{len(reviewed)} reviewed, {len(guessed)} suggested only by camera position.','']
    if any(area['id'] in f['areas'] for f in features):
        out+=['## Built from these photos','','Model features that cite photos of this area, from `public/photos-ref/evidence-graph.json`. A citation records what a feature was traced from; it does not prove the feature matches.','']+mermaid(area,features)
    if reviewed:out+=['## Reviewed references','']+table(reviewed,1,area['id'])+['']
    if guessed:out+=['## Suggested by camera position, not yet reviewed','','The camera stood in or near this area. Check what the picture actually shows before relying on it.','']+table(guessed,1,area['id'])+['']
    return '\n'.join(out)

def topic_brief(topic,entries,spec):
    names={a['id']:a['name'] for a in spec['areas']}
    out=[f'# {topic["name"]}','',f'_Generated by `scripts/build_references.py`. Do not edit._','',topic['summary'],'']
    for a in spec['areas']:
        here=[e for e in entries if a['id'] in e['shows']]
        if here:out+=[f'## {names[a["id"]]}','']+table(here,1,a['id'])+['']
    if not entries:out.append('No references reviewed for this topic yet.')
    return '\n'.join(out)

def index(spec,catalog,problems):
    out=['# Villacana references','','_Generated by `scripts/build_references.py`. Do not edit._','',
         'Start here. Pick the area you are working on and read its brief: it lists every photo, map and doc for that area, best first. Photos live in `public/photos-ref/` (public web copies) and in the private `villacana-reference` repo. Full-size originals stay in Google Drive.','',
         '| Area | References | Reviewed | Brief |','| --- | --- | --- | --- |']
    for a in spec['areas']:
        here=[e for e in catalog if a['id'] in e['shows']]
        out.append(f'| {a["name"]} | {len(here)} | {sum(e["areasBasis"]=="reviewed" for e in here)} | [areas/{a["id"]}.md](areas/{a["id"]}.md) |')
    out+=['','| Topic | Reviewed references | Brief |','| --- | --- | --- |']
    for t in spec['topics']:
        out.append(f'| {t["name"]} | {sum(t["id"] in e["useFor"] for e in catalog)} | [topics/{t["id"]}.md](topics/{t["id"]}.md) |')
    reviewed=sum(e['areasBasis']=='reviewed' for e in catalog)
    out+=['',f'{len(catalog)} references: {reviewed} reviewed, {len(catalog)-reviewed} with areas suggested only from the camera position.','']
    if problems:out+=['## Needs attention','']+[f'- {p}' for p in problems]+['']
    return '\n'.join(out)

def sheets(spec,catalog,reference:Path):
    from PIL import Image,ImageDraw,ImageFont,ImageOps
    out=reference/'contact-sheets';out.mkdir(exist_ok=True)
    cell,cols=300,5
    try:font=ImageFont.truetype('DejaVuSans-Bold.ttf',17)
    except OSError:font=ImageFont.load_default()
    for a in spec['areas']:
        here=sorted((e for e in catalog if a['id'] in e['shows']),key=lambda e:rank(e,a['id']))
        if not here:continue
        rows=math.ceil(len(here)/cols);sheet=Image.new('RGB',(cols*cell,rows*(cell+26)),'white');draw=ImageDraw.Draw(sheet)
        for i,e in enumerate(here):
            path=ROOT/e['path'] if e['path'].startswith('public/') else reference.parent/e['path']
            x,y=(i%cols)*cell,(i//cols)*(cell+26)
            try:
                with Image.open(path) as im:
                    im=ImageOps.exif_transpose(im).convert('RGB');im.thumbnail((cell-6,cell-6))
                    sheet.paste(im,(x+3+(cell-6-im.width)//2,y+3+(cell-6-im.height)//2))
            except OSError:draw.text((x+10,y+10),'missing',fill='red')
            mark='' if e['areasBasis']=='reviewed' else ' ?'
            draw.text((x+4,y+cell+2),f'{i+1}. {Path(e["id"]).stem[:24]}{mark}',fill='black',font=font)
        sheet.save(out/f'{a["id"]}.jpg',quality=80)

def main():
    parser=argparse.ArgumentParser(description=__doc__,formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--reference',type=Path,default=ROOT.parent/'villacana-reference')
    parser.add_argument('--sheets',action='store_true',help='write contact sheets into the reference repo')
    parser.add_argument('--check',action='store_true',help='exit non-zero if anything is untagged or unknown')
    args=parser.parse_args()
    spec,catalog,problems=build(args.reference)
    refs=ROOT/'refs';(refs/'areas').mkdir(parents=True,exist_ok=True);(refs/'topics').mkdir(exist_ok=True)
    (refs/'catalog.json').write_text(json.dumps(catalog,indent=1,ensure_ascii=False)+'\n')
    features=model_features(catalog)
    for a in spec['areas']:
        (refs/'areas'/f'{a["id"]}.md').write_text(brief(a,[e for e in catalog if a['id'] in e['shows']],spec['topics'],spec,features))
    nodes=[{'id':'area:'+a['id'],'kind':'area','name':a['name']} for a in spec['areas']]+[{'id':'topic:'+t['id'],'kind':'topic','name':t['name']} for t in spec['topics']]
    nodes+=[{'id':'ref:'+e['id'] if not e['id'].startswith('ref:') else e['id'],'kind':e['kind'],'name':e['title'],'path':e['path'],'viewpoint':e['viewpoint']} for e in catalog]
    nodes+=[{'id':f['id'],'kind':'model-feature','name':f['name']} for f in features]
    key=lambda e:'ref:'+e['id'] if not e['id'].startswith('ref:') else e['id']
    edges=[{'from':key(e),'to':'area:'+a,'relation':'shows'} for e in catalog for a in e['shows']]
    edges+=[{'from':key(e),'to':'topic:'+t,'relation':'useful-for'} for e in catalog for t in e['useFor']]
    edges+=[{'from':f['id'],'to':'ref:'+p,'relation':'cites'} for f in features for p in f['photos']]
    edges+=[{'from':f['id'],'to':'area:'+a,'relation':'in-area'} for f in features for a in f['areas']]
    (refs/'graph.json').write_text(json.dumps({'about':'Generated by scripts/build_references.py. shows/useful-for come from reviewed tags; cites from feature evidence; in-area is the area most of a feature\'s cited photos show.','nodes':nodes,'edges':edges},indent=1,ensure_ascii=False)+'\n')
    for t in spec['topics']:
        (refs/'topics'/f'{t["id"]}.md').write_text(topic_brief(t,[e for e in catalog if t['id'] in e['useFor']],spec))
    (refs/'README.md').write_text(index(spec,catalog,problems))
    if args.sheets:sheets(spec,catalog,args.reference)
    reviewed=sum(e['areasBasis']=='reviewed' for e in catalog)
    print(f'{len(catalog)} references, {reviewed} reviewed, {len(problems)} problems')
    for p in problems:print(' -',p)
    if args.check and problems:sys.exit(1)
if __name__=='__main__':main()
