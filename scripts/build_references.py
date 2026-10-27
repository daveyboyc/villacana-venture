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
  refs/graph.json          areas, topics, references, model features and build tasks, and how they link
  refs/QUEUE.md            the build queue from data/build_queue.json, by priority
  refs/issues/<task>.md    one ready-to-file issue body per open task
  public/scorecard.json    the per-area scorecard (scripts/build_scorecard.py)
  public/confidence.json   how sure each feature is (scripts/build_confidence.py)
With --sheets, contact sheets of thumbnails go to <reference>/contact-sheets/,
because they include private images and this repo is public.
--check fails if a reference has no area, or a tag names an unknown area,
topic or file, or a done task lacks required photo-check records.

A feature citing a photo ('cites') only says an author used it. Whether the
build was compared with the photo is recorded in data/photo_checks.json: an
after-render from the photo's camera, a result (matches, differs or
not-comparable) and notes. Those become 'checked-against' edges and a
'photoVerification' diagnostic on features and tasks. Strict placement approval
is separate (docs/PLACEMENT_VERIFICATION.md). A done task must have a check for
every photo it builds from (tasks done before this rule are listed in
legacyUnchecked, a list that may only shrink), a 'differs' needs an open
follow-up task, and a checked photo needs a reviewed looksAt so the render
faced its subject.

A camera position only suggests areas. 'shows' in reference_tags.json is what
a person or agent saw in the picture, and replaces the suggestion.
"""
from __future__ import annotations
import argparse
import importlib.util
import json
import math
import re
import sys
from placement_verification import evaluate as evaluate_placements, model_inventory, photo_summary
from pathlib import Path
from path_network import extend as extend_path_network
import photo_requests
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
    model=[m for m in assign.features(skeleton) if m['kind'] in ('reference feature','street','pool','area','parking')]
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
        if 'x' in photo:entry['camera']={k:photo[k] for k in ('x','z','heading','accuracy','altitude','trust') if k in photo}
        entry['citedBy']=(a or {}).get('citedBy',[])
        entry.update(subject_of(photo,tag,model))
        # Phone altitude separates the two: ground shots read 9 m or less, roof and upper-floor shots more.
        alt=photo.get('altitude')
        if alt is not None and tag.get('viewpoint')=='ground' and alt>ALTITUDE_SPLIT:problems.append(f'{f}: tagged ground but altitude {alt} m suggests a roof or upper floor')
        if alt is not None and tag.get('viewpoint') in ('roof','upper-floor') and alt<=ALTITUDE_SPLIT:problems.append(f'{f}: tagged {tag["viewpoint"]} but altitude {alt} m suggests ground level')
        catalog.append(entry)
    files=set(reference_files(reference))
    for key,tag in tags.items():
        if not key.startswith('ref:'):continue
        path=key[4:]
        if reference.is_dir() and path not in files:problems.append(f'{key}: no such file in {reference.name}')
        catalog.append({'id':key,'kind':tag.get('kind','reference'),'path':f'{reference.name}/{path}',
                        'title':tag.get('title',path),'shows':tag.get('shows',[]),'areasBasis':'reviewed' if tag.get('shows') else 'untagged',
                        'viewpoint':tag.get('viewpoint'),'useFor':tag.get('useFor',[]),'sourceRevision':tag.get('sourceRevision'),'note':tag.get('note'),'citedBy':[f['id'] for f in model if key in f.get('evidence',[])]})
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
        if 'looksAt' in tag and not (isinstance(tag['looksAt'],list) and len(tag['looksAt'])==2 and all(isinstance(v,(int,float)) for v in tag['looksAt'])):problems.append(f'{key}: looksAt must be [x, z] in map metres')
    for e in catalog:
        if not e['shows']:problems.append(f'{e["id"]}: no area (tag it in data/reference_tags.json)')
    return spec,catalog,problems

ALTITUDE_SPLIT=9.0
HEADING_TOLERANCE=45
CHECK_RESULTS=('matches','differs','not-comparable')
# Tasks missing complete modern photo-check records when recording began (18 October).
# Earlier manual reviews may exist in docs/reviews and task documentation.
# data/photo_checks.json legacyUnchecked may only hold these; check one and remove it from there.
LEGACY_CEILING=frozenset('''barraka-boardwalk cervantes-door-steps cervantes-east-hedge cervantes-east-south-patios
 cervantes-north-patios cervantes-steps-treads door-sills elena-east-patios elena-garden-door elena-gated-entry eva-walled-lawn
 junction-lawns middle-pool-north-entrance middle-pool-raised-patios middle-pool-sw-steps north-pool-garden-walls paseo-details
 paseo-house-clearance paseo-retaining-wall paseo-retrace-line picasso-service-road raised-terraces seaward-lanes-paving
 shoreline-check south-pool-seaward-level'''.split())
LOOK_DISTANCE={'ground':6,'upper-floor':10,'roof':12}

def subject_of(photo,tag,model):
    """Where the picture is pointed: hand-set in the tags, else estimated along the compass heading."""
    if 'looksAt' in tag:point,basis=tag['looksAt'],'reviewed'
    elif all(k in photo for k in ('x','z','heading')):
        d=LOOK_DISTANCE.get(tag.get('viewpoint'),6);h=math.radians(photo['heading'])
        point,basis=[round(photo['x']+math.sin(h)*d,1),round(photo['z']-math.cos(h)*d,1)],f'estimated {d} m along the heading'
    else:return {}
    near=[]
    for m in model:
        if 'ring' in m:gap=0 if assign.inside(point,m['ring']) else assign.nearest(point,m['ring']+[m['ring'][0]])[0]
        else:gap=max(0,assign.nearest(point,m['points'])[0]-m.get('width',0)/2)
        if gap<=2.5:near.append((gap,m['id']))
    out={'looksAt':point,'looksAtBasis':basis,'looksAtFeatures':[i for _,i in sorted(near)[:4]]}
    if tag.get('subject'):out['subject']=tag['subject']
    if basis=='reviewed' and all(k in photo for k in ('x','z','heading')) and math.dist(point,[photo['x'],photo['z']])>1:
        # A phone compass can be well off; say so when the subject is not where the heading points.
        bearing=math.degrees(math.atan2(point[0]-photo['x'],-(point[1]-photo['z'])))%360
        off=abs((bearing-photo['heading']+180)%360-180)
        if off>HEADING_TOLERANCE:out['headingOff']=round(off)
    return out

STATUSES=('open','in-progress','done')

def load_queue(spec,catalog,problems):
    queue=load(ROOT/'data/build_queue.json',{'tasks':[]})['tasks']
    areas={a['id'] for a in spec['areas']};refs={e['id'] for e in catalog};ids={t['id'] for t in queue}
    for t in queue:
        if t['area'] not in areas:problems.append(f"task {t['id']}: unknown area {t['area']!r}")
        if t.get('status','open') not in STATUSES:problems.append(f"task {t['id']}: unknown status {t.get('status')!r}")
        for ph in t['photos']:
            if ph not in refs:problems.append(f"task {t['id']}: photo {ph} is not in the catalogue")
        for d in t.get('dependsOn',[]):
            if d not in ids:problems.append(f"task {t['id']}: depends on unknown task {d}")
    return queue

def task_verification(task,checks,legacy=()):
    """Tooling without model-photo inputs is not a photographic claim or a backlog item."""
    if task.get('kind')=='tooling' and not task['photos']:
        return 'not-applicable (tooling)'
    related=[c for c in checks if c.get('task')==task['id']]
    checked={c.get('photo') for c in related}
    if any(p not in checked for p in task['photos']):
        return 'legacy-unchecked' if task['id'] in legacy else 'unchecked'
    return photo_summary(task['photos'], related)

def load_checks(catalog,queue,features,problems):
    """Render-versus-photo checks from data/photo_checks.json, validated against the queue, features and tags."""
    spec=load(ROOT/'data/photo_checks.json',{'checks':[],'legacyUnchecked':[]})
    checks,legacy=spec.get('checks',[]),spec.get('legacyUnchecked',[])
    by={e['id']:e for e in catalog};tasks={t['id']:t for t in queue};feats={f['id']:f for f in features}
    for c in checks:
        name=f"photo check {c.get('task')} / {c.get('photo')}";res=c.get('result')
        if c.get('task') not in tasks:problems.append(f'{name}: unknown task')
        if c.get('feature') not in feats:problems.append(f"{name}: feature {c.get('feature')!r} does not cite photos in the evidence graph")
        if c.get('feature') in feats and c.get('photo') not in feats[c['feature']]['photos']:problems.append(f'{name}: photo is not cited by this specific feature')
        e=by.get(c.get('photo'))
        if e is None:problems.append(f'{name}: photo not in the catalogue')
        elif e.get('camera') and e.get('looksAtBasis')!='reviewed':problems.append(f'{name}: set looksAt and subject for the photo in data/reference_tags.json, so the render faces what the photo shows')
        if res not in CHECK_RESULTS:problems.append(f'{name}: result must be one of {", ".join(CHECK_RESULTS)}')
        if res!='not-comparable' and not (c.get('render') and (ROOT/c['render']).is_file()):problems.append(f"{name}: after render {c.get('render')!r} is not committed")
        if c.get('before') and not (ROOT/c['before']).is_file():problems.append(f"{name}: before render {c['before']!r} is not committed")
        if not c.get('notes'):problems.append(f'{name}: notes must say what matches and what differs')
        follow=tasks.get(c.get('followUp'))
        if res=='differs' and follow is None:problems.append(f'{name}: differs, so followUp must name an open task in data/build_queue.json')
    checked={(c.get('task'),c.get('photo')) for c in checks}
    for t in queue:
        missing=[p for p in t['photos'] if (t['id'],p) not in checked]
        t['verification']=task_verification(t,checks,legacy)
        if t.get('status')!='done':continue
        if t['id'] in legacy:
            if not missing:problems.append(f"legacyUnchecked {t['id']}: every photo is checked now, remove it from the list")
        elif missing:problems.append(f"task {t['id']}: done but not checked against {', '.join(missing)}: render from the photo's camera (scripts/shoot_views.cjs --task={t['id']} --as=after) and record it in data/photo_checks.json")
    for l in legacy:
        if l not in LEGACY_CEILING:problems.append(f'legacyUnchecked {l}: only tasks done before photo checks began may be listed; check it instead')
        elif tasks.get(l,{}).get('status')!='done':problems.append(f'legacyUnchecked {l}: not a done task')
    return checks,legacy

def verdict(checks):
    results={c.get('result') for c in checks}
    return 'differs' if 'differs' in results else 'matches' if 'matches' in results else 'not-comparable' if results else 'unchecked'

def task_line(t,depth):
    up='../'*depth
    photos=', '.join(f'`{p[4:]}`' if p.startswith('ref:') else f'[{Path(p).stem}]({up}../public/photos-ref/{p})' for p in t['photos'])
    deps=f" (after {', '.join(t['dependsOn'])})" if t.get('dependsOn') else ''
    owner=f" · {t['owner']}" if t.get('owner') else ''
    issue=f" [#{t['issue']}](https://github.com/daveyboyc/villacana-venture/issues/{t['issue']})" if t.get('issue') else ''
    checked=f" · photos: {t['verification']}" if t.get('status')=='done' and t.get('verification') else ''
    if t.get('placement'):checked+=f" · placement: {t['placement']['status']}"
    return f"| P{t['priority']} | `{t['id']}`{issue} | {t['title']}{deps} | {t.get('status','open')}{owner}{checked} | {photos} |"

def queue_page(queue,spec,legacy=()):
    names={a['id']:a['name'] for a in spec['areas']}
    out=['# Build queue','','_Generated from `data/build_queue.json` by `scripts/build_references.py`. Edit the JSON, not this page._','',
         'How to take a task: `docs/HANDOVER.md`. Each task has a ready issue body in `refs/issues/<id>.md`.','',
         '| Priority | Task | What | Status | Photos |','| --- | --- | --- | --- | --- |']
    order=sorted(queue,key=lambda t:(t.get('status')=='done',t['priority'],t['area'],t['id']))
    out+=[task_line(t,0) for t in order]
    backlog=[t for t in order if t['id'] in legacy]
    if backlog:
        out+=['','## Verification backlog','',f'{len(backlog)} tasks lack complete entries in the newer render-versus-photo check records. Earlier manual reviews may exist in task docs and committed review pairs; this backlog does not mean the work was never reviewed. '
              'Check one: `node scripts/shoot_views.cjs <photos> --task=<id> --as=after`, compare each render with its photo, record the result in `data/photo_checks.json` '
              '(a `differs` needs a new open task as `followUp`) and remove the task from `legacyUnchecked`.','']
        out+=[f"- `{t['id']}` ({names[t['area']]}): "+', '.join(t['photos']) for t in backlog]
    out+=['','## By area','']
    for a in spec['areas']:
        here=[t for t in order if t['area']==a['id']]
        if here:out.append(f"- **{names[a['id']]}** ([brief](areas/{a['id']}.md)): "+', '.join(f"`{t['id']}`" for t in here))
    return '\n'.join(out)+'\n'

def survey_items():
    return load(ROOT/'data/levels_survey.json',{'items':[]})['items']

def level_line(i):
    rise=f"{i['rise'][0]:g}-{i['rise'][1]:g} m" if i['rise'][0]!=i['rise'][1] else f"{i['rise'][0]:g} m"
    where=f" at ({i['at'][0]:g}, {i['at'][1]:g}) ±{i['atAccuracy']:g} m" if i.get('at') else ''
    task=f", task `{i['task']}`" if i.get('task') else ''
    return f"- `{i['id']}` ({i['type']}): {rise}{' above '+i['from'] if i.get('from') else ''}, {i['confidence']} confidence{where}. Model: **{i['model']}**{task}. {i['note']} ({', '.join(i['photos'])})"

def issue_body(t,spec,catalog):
    area=next(a for a in spec['areas'] if a['id']==t['area']);by={e['id']:e for e in catalog}
    lines=[f"# {t['title']}",'',f"Task `{t['id']}` · area **{area['name']}** · priority P{t['priority']} · {t['kind']}",'',
      '## Read first','',f"- `AGENTS.md`, `docs/HANDOVER.md`",f"- `refs/areas/{area['id']}.md` and the contact sheet `villacana-reference/contact-sheets/{area['id']}.jpg`"]
    lines+=[f"- {kind}: "+', '.join(f'`{p}`' for p in area[kind]) for kind in ('docs','data','src') if area.get(kind)]
    lines+=['','## Photos to build from','']
    for ph in t['photos']:
        e=by[ph];cam=e.get('camera',{})
        pin=f" — pin ±{cam['accuracy']} m" if cam.get('accuracy') else ''
        look=f"; looks at {e['subject']}" if e.get('subject') else ''
        lines.append(f"- `public/photos-ref/{ph}`: {e['title']} ({e.get('viewpoint') or 'viewpoint not reviewed'}{pin}{look})")
    levels=[i for i in survey_items() if i.get('task')==t['id']]
    if levels:lines+=['','## Levels from the photos','','From `data/levels_survey.json` (check with `scripts/check_levels.py`).','']+[level_line(i) for i in levels]
    lines+=['','## Build','',t['build'],'','## Do not','',t['avoid'],'','## Done when','']
    lines+=[f'- [ ] {a}' for a in t['accept']]
    lines+=['- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)',
            '- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes',
            f"- [ ] `data/build_queue.json`: `{t['id']}` set to done",
            '- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`',
            '- [ ] Before/after renders from each photo\'s camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them']
    if t.get('dependsOn'):lines+=['',f"Depends on: {', '.join('`'+d+'`' for d in t['dependsOn'])}"]
    return '\n'.join(lines)+'\n'

def model_features(catalog):
    """Read current geometry, including uncited features, rather than a possibly stale graph."""
    shows={e['id']:e['shows'] for e in catalog}
    features=[]
    for model in assign.features(load(ROOT/'public/map/skeleton.json')):
        photos=sorted(set(model.get('evidence',[])))
        votes={}
        for photo in photos:
            for area in shows.get(photo,[])[:1]:votes[area]=votes.get(area,0)+1
        top=max(votes.values(),default=0)
        features.append({'id':model['id'],'name':model['name'],'photos':photos,
                         'areas':sorted(a for a,v in votes.items() if v==top),'model':model})
    return sorted(features,key=lambda f:f['id'])


def graph_integrity(nodes,edges,problems):
    ids=[n['id'] for n in nodes]
    if len(ids)!=len(set(ids)):problems.append('reference graph contains duplicate node IDs')
    known=set(ids)
    for edge in edges:
        if edge['from'] not in known or edge['to'] not in known:
            problems.append(f"graph edge {edge['relation']} has unknown endpoint {edge['from']} -> {edge['to']}")


def mermaid(area,features):
    """A small diagram: the area, the model features built from its photos, and those photos."""
    here=[f for f in features if area['id'] in f['areas']]
    if not here:return []
    safe=lambda t:t.replace('"',"'")
    out=['```mermaid','graph LR',f'  A["{safe(area["name"])}"]']
    for i,f in enumerate(here):
        out.append(f'  A --> F{i}["{safe(f["name"])} · {f.get("verification","unchecked")}"]')
        for photo in f['photos']:
            node=re.sub(r'[^A-Za-z0-9_]','_',photo)
            out.append(f'  F{i} --> P{node}(["{Path(photo).stem}"])')
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
    if e.get('subject'):extra=f' **Looks at:** {e["subject"]}.'+extra
    if e.get('headingOff'):extra+=f' **Compass:** the subject is {e["headingOff"]}° from the phone heading; trust looksAt, not the heading.'
    cited=f' _Used by: {", ".join(e["citedBy"])}._' if e.get('citedBy') else ''
    return f'| {link(e,depth)} | {view} | {use} | {e["title"]}{extra}{cited} |'

def table(entries,depth,area=None):
    lines=['| Reference | Viewpoint | Use for | What it shows |','| --- | --- | --- | --- |']
    return lines+[row(e,depth) for e in sorted(entries,key=lambda e:rank(e,area))]

def brief(area,entries,topics,spec,features=(),queue=(),checks=()):
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
    levels=[i for i in survey_items() if i['area']==area['id']]
    if levels:out+=['## Levels','','Ground and floor levels read from the photos, from `data/levels_survey.json` (see `docs/LEVELS.md`).','']+[level_line(i) for i in levels]+['']
    tasks=sorted((t for t in queue if t['area']==area['id'] and t.get('status')!='done'),key=lambda t:(t['priority'],t['id']))
    if tasks:out+=['## Open build tasks','','From `data/build_queue.json`; issue bodies in `refs/issues/`.','','| Priority | Task | What | Status | Photos |','| --- | --- | --- | --- | --- |']+[task_line(t,1) for t in tasks]+['']
    if any(area['id'] in f['areas'] for f in features):
        out+=['## Built from these photos','','Model features that cite photos of this area, from `public/photos-ref/evidence-graph.json`, with their photo-check state. A citation records what a feature was traced from; only a check in `data/photo_checks.json` says someone rendered it from the photo\'s camera and compared.','']+mermaid(area,features)
    placement_here=[f for f in features if area['id'] in f['areas'] and f.get('placement')]
    if placement_here:
        out+=['## Placement evidence','','`verification` is placement status, separate from photographic diagnostics. Earlier manual reviews may exist. Only a fresh measured packet and independent approval can grant `verified`.','','| Feature | Placement | Photo diagnostics | Blockers |','| --- | --- | --- | --- |']
        for f in placement_here:
            out.append(f"| `{f['id']}` | {f['verification']}"+(f" (≤{f['placement']['toleranceM']} m)" if 'toleranceM' in f['placement'] else '')+f" | {f['photoVerification']} | {'; '.join(f['placement']['blockers'])} |")
        out+=['']
    ids={t['id'] for t in queue if t['area']==area['id']}
    here=[c for c in checks if c.get('task') in ids]
    if here:
        out+=['## Photo checks','','Renders from each photo\'s camera compared with the photo (`data/photo_checks.json`).','','| Task | Photo | Result | Render | Notes |','| --- | --- | --- | --- | --- |']
        out+=[f"| `{c['task']}` | [{Path(c['photo']).stem}](../../public/photos-ref/{c['photo']}) | **{c['result']}**{' → `'+c['followUp']+'`' if c.get('followUp') else ''} | "+(f"[after](../../{c['render']})" if c.get('render') else '')+(f" · [before](../../{c['before']})" if c.get('before') else '')+f" | {c.get('notes','')} |" for c in here]+['']
    never=[t for t in queue if t['area']==area['id'] and t.get('status')=='done' and t.get('verification') in ('unchecked','legacy-unchecked')]
    if never:out+=['**Built without complete newer photo-check records:** '+', '.join(f"`{t['id']}`" for t in never)+'. Earlier manual reviews may exist; this record does not establish photographic fidelity. See the verification backlog in `refs/QUEUE.md`.','']
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

def index(spec,catalog,problems,queue=(),checks=()):
    out=['# Villacana references','','_Generated by `scripts/build_references.py`. Do not edit._','',
         'Start here. Pick the area you are working on and read its brief: it lists every photo, map and doc for that area, best first. Photos live in `public/photos-ref/` (public web copies) and in the private `villacana-reference` repo. Full-size originals stay in Google Drive.','',
         'Work to do: [QUEUE.md](QUEUE.md) lists the build tasks by priority; `docs/HANDOVER.md` explains how to take one. The full link graph (areas, photos, features, tasks) is [graph.json](graph.json).','',
         '| Area | References | Reviewed | Brief |','| --- | --- | --- | --- |']
    for a in spec['areas']:
        here=[e for e in catalog if a['id'] in e['shows']]
        out.append(f'| {a["name"]} | {len(here)} | {sum(e["areasBasis"]=="reviewed" for e in here)} | [areas/{a["id"]}.md](areas/{a["id"]}.md) |')
    out+=['','| Topic | Reviewed references | Brief |','| --- | --- | --- |']
    for t in spec['topics']:
        out.append(f'| {t["name"]} | {sum(t["id"] in e["useFor"] for e in catalog)} | [topics/{t["id"]}.md](topics/{t["id"]}.md) |')
    out+=['','## Find one reference','','Use the canonical app root (`/?view=map`) and search a photo ID, place or visible subject. The same complete index, including private and unplaced sources, is `public/reference-index.json`. Agents can run `python3 scripts/find_reference.py boat` or `python3 scripts/find_reference.py --area north-pool --json`. Each entry gives a stable map link, source path, camera uncertainty, separate subject context, citations and current checks. Open full images before editing; private pixels stay in the private repo.','']
    reviewed=sum(e['areasBasis']=='reviewed' for e in catalog)
    out+=['',f'{len(catalog)} references: {reviewed} reviewed, {len(catalog)-reviewed} with areas suggested only from the camera position.','']
    out+=['Here “reviewed references” means content/area tags were inspected; it does not certify model placement. Placement approval is separate from photo diagnostics: see [graph.json](graph.json) v2, [placement records](../data/placement_reviews.json) and [placement policy](../docs/PLACEMENT_VERIFICATION.md). Citation links and software results do not grant placement approval. Open discrepancies block it.','']
    done=[t for t in queue if t.get('status')=='done'];results=[c.get('result') for c in checks]
    out+=[f"Photo checks (`data/photo_checks.json`): {len(checks)} photo-check records, {results.count('matches')} match, {results.count('differs')} differ. "
          f"{sum(t.get('verification') in ('unchecked','legacy-unchecked') for t in done)} of {len(done)} done tasks lack complete newer photo-check records (earlier manual reviews may exist) (QUEUE.md, verification backlog).",'']
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

def public_reference_index(catalog,features,checks,spec):
    """One published discovery index for the map and agents; private pixels stay private."""
    from urllib.parse import quote
    tags=load(ROOT/'data/reference_tags.json',{})
    positions=load(ROOT/'data/photo_positions.json',{})
    assignments={a['file']:a for a in load(ROOT/'public/photos-ref/assignments.json',{'photos':[]})['photos']}
    skeleton=load(ROOT/'public/map/skeleton.json')
    entries=[]
    for e in catalog:
        private=e['id'].startswith('ref:')
        source=e['path']
        entry={
            'id':e['id'], 'label':e['title'], 'kind':e['kind'], 'private':private,
            'sourcePath':source, 'sourceUrl':('https://github.com/daveyboyc/villacana-reference/blob/'+(e.get('sourceRevision') or 'main')+'/'+quote(e['id'][4:],safe='/') if private else None),
            'image':None if private else e['path'].removeprefix('public/'),
            'thumbnail':None if private else 'photos-ref/thumbs/'+e['id'],
            'areas':e['shows'], 'viewpoint':e.get('viewpoint'), 'useFor':e['useFor'],
            'observation':e.get('observation') or '', 'note':e.get('note') or '',
            'camera':e.get('camera'), 'subject':e.get('subject'),
            'looksAt':e.get('looksAt'), 'looksAtBasis':e.get('looksAtBasis'),
            'locationBasis':tags.get(e['id'],{}).get('locationBasis') or positions.get(e['id'].removesuffix('.jpg')+'.HEIC',{}).get('locationBasis'),
            'association':assignments.get(e['id']),
            'originalUrl':e.get('originalUrl'),
            'mapUrl':'./?view=map&photo='+quote(e['id'],safe=''),
            'features':[{'id':f['id'],'name':f['name'],'verification':f['verification'],'photoVerification':f['photoVerification'],'placement':f['placement']} for f in features if e['id'] in f['photos']],
            'checks':[c for c in checks if c['photo']==e['id']]
        }
        entries.append(entry)
    return {'version':1,'frame':{'origin':skeleton['origin'],'viewRotation':skeleton['viewRotation'],'axes':'+x east, +z south, metres'},
            'about':'Generated by build_references.py. Camera position is not subject position; citations and checks are distinct. Private images are linked to their private repository, never copied here.',
            'areas':[{'id':a['id'],'name':a['name']} for a in spec['areas']], 'references':entries}

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
    queue=load_queue(spec,catalog,problems)
    checks,legacy=load_checks(catalog,queue,features,problems)
    inventory=model_inventory(ROOT,[f['model'] for f in features])
    placements,reviews,reports=evaluate_placements(ROOT,features,catalog,queue,checks,inventory,problems)
    for f in features:
        f['photoVerification']=photo_summary(f['photos'],[c for c in checks if c.get('feature')==f['id']])
        f['placement']=placements[f['id']]
        f['verification']=f['placement']['status']
    for f in features:
        for photo in f['photos']:
            if photo not in {e['id'] for e in catalog}:problems.append(f"feature {f['id']}: unknown cited source {photo}")
    for a in spec['areas']:
        (refs/'areas'/f'{a["id"]}.md').write_text(brief(a,[e for e in catalog if a['id'] in e['shows']],spec['topics'],spec,features,queue,checks))
    (refs/'QUEUE.md').write_text(queue_page(queue,spec,legacy))
    issues=refs/'issues';issues.mkdir(exist_ok=True)
    for old in issues.glob('*.md'):old.unlink()
    for t in queue:
        if t.get('status')!='done':(issues/f"{t['id']}.md").write_text(issue_body(t,spec,catalog))
    nodes=[{'id':'area:'+a['id'],'kind':'area','name':a['name']} for a in spec['areas']]+[{'id':'topic:'+t['id'],'kind':'topic','name':t['name']} for t in spec['topics']]
    nodes.append({'id':'map:ground','kind':'georeferenced-aerial','name':'Esri georeferenced aerial','path':'public/map/ground.jpg','bounds':'public/map/ground.json'})
    nodes+=[{'id':'ref:'+e['id'] if not e['id'].startswith('ref:') else e['id'],'kind':e['kind'],'name':e['title'],'path':e['path'],'viewpoint':e['viewpoint']} for e in catalog]
    nodes+=[{'id':'model:'+f['id'],'featureId':f['id'],'kind':'model-feature','name':f['name'],'verification':f['verification'],'photoVerification':f['photoVerification'],'placement':f['placement']} for f in features]
    key=lambda e:'ref:'+e['id'] if not e['id'].startswith('ref:') else e['id']
    edges=[{'from':key(e),'to':'area:'+a,'relation':'shows'} for e in catalog for a in e['shows']]
    edges+=[{'from':key(e),'to':'topic:'+t,'relation':'useful-for'} for e in catalog for t in e['useFor']]
    edges+=[{'from':'model:'+f['id'],'to':p if p.startswith('ref:') else 'ref:'+p,'relation':'cites'} for f in features for p in f['photos']]
    edges+=[{'from':'model:'+f['id'],'to':'area:'+a,'relation':'in-area'} for f in features for a in f['areas']]
    edges+=[{'from':'model:'+c['feature'],'to':c['photo'] if c['photo'].startswith('ref:') else 'ref:'+c['photo'],'relation':'checked-against','scope':'photographic diagnostic, not placement approval','result':c['result'],'task':c['task'],'checked':c.get('checked'),**({'render':c['render']} if c.get('render') else {})} for c in checks]
    edges+=[{'from':key(e),'to':'model:'+m,'relation':'looks-at','basis':e['looksAtBasis']} for e in catalog for m in e.get('looksAtFeatures',[])]
    nodes+=[{'id':'task:'+t['id'],'kind':'build-task','name':t['title'],'priority':t['priority'],'status':t.get('status','open'),'verification':t['placement']['status'],'photoVerification':t['verification'],'placement':t['placement'],**({'issue':t['issue']} if t.get('issue') else {})} for t in queue]
    edges+=[{'from':'task:'+t['id'],'to':'area:'+t['area'],'relation':'in-area'} for t in queue]
    edges+=[{'from':'task:'+t['id'],'to':p if p.startswith('ref:') else 'ref:'+p,'relation':'builds-from'} for t in queue for p in t['photos']]
    edges+=[{'from':'task:'+t['id'],'to':'task:'+d,'relation':'depends-on'} for t in queue for d in t.get('dependsOn',[])]
    for review in reviews:
        if not isinstance(review,dict) or not review.get('id') or review.get('feature') not in placements:continue
        id='placement-review:'+review['id']
        nodes.append({'id':id,'kind':'placement-review','feature':review['feature'],'task':review.get('task'),'recordPath':'data/placement_reviews.json',
                      **{k:review.get(k) for k in ('author','checked','frame','snapshot','toleranceM','limitations','sourceAssessments','overlay','comparison','render','registration','measurements','reviewer','supersedes','resolves')}})
        edges.append({'from':'model:'+review['feature'],'to':id,'relation':'placement-reviewed-by'})
        for source in (review.get('snapshot') or {}).get('sources',{}):
            edges.append({'from':id,'to':source if source.startswith(('ref:','map:')) else 'ref:'+source,'relation':'placement-source'})
        if placements.get(review['feature'],{}).get('status')=='verified' and review['id'] in placements[review['feature']]['reviewIds']:
            edges.append({'from':'model:'+review['feature'],'to':id,'relation':'placement-verified-by','scope':'placement within declared tolerance','toleranceM':review['toleranceM']})
        registration=review.get('registration',{})
        if not isinstance(registration,dict):continue
        for group,relation in [('controls','registered-with'),('validation','validated-with')]:
            landmarks=registration.get(group,[])
            if not isinstance(landmarks,list):continue
            for landmark in landmarks:
                if not isinstance(landmark,dict) or not landmark.get('id'):continue
                lid=id+':landmark:'+landmark['id']
                nodes.append({'id':lid,'kind':'registration-landmark','role':group,**{k:landmark.get(k) for k in ('source','sourcePixel','sourcePoint','mapPoint','uncertaintyM','identification','modelFeature')}})
                nodes[-1]['id']=lid  # Preserve globally namespaced ID, not the local landmark label.
                edges.append({'from':id,'to':lid,'relation':relation})
                if landmark.get('modelFeature'):edges.append({'from':lid,'to':'model:'+landmark['modelFeature'],'relation':'anchors-to'})
    for report in reports:
        id='placement-discrepancy:'+report['id']
        nodes.append({'id':id,'kind':'placement-discrepancy',**{k:report.get(k) for k in ('feature','status','notes','reportedBy','reportedAt','evidence','followUp','resolutionReview')}})
        edges.append({'from':'model:'+report['feature'],'to':id,'relation':'has-discrepancy'})
        if report.get('followUp'):edges.append({'from':id,'to':'task:'+report['followUp'],'relation':'follow-up'})
        for photo in report.get('sources',[]):
            edges.append({'from':id,'to':photo if photo.startswith(('ref:','map:')) else 'ref:'+photo,'relation':'discrepancy-source'})
        if report.get('status')=='resolved':edges.append({'from':id,'to':'placement-review:'+report['resolutionReview'],'relation':'resolved-by'})
    for task in queue:
        for feature in task.get('features',[]):edges.append({'from':'task:'+task['id'],'to':'model:'+feature,'relation':'changes-feature'})
    # Photo requests (data/photo_requests.json): where photos are wanted, and the photos that answer them.
    # A matched photo 'answers' a request (basis: position); an agent's review makes it 'answered'.
    task_ids={t['id'] for t in queue}
    for r in photo_requests.states():
        rid='photo-request:'+r['id']
        nodes.append({'id':rid,'kind':'photo-request','label':r['ask'],'area':r['area'],'state':r['state'],'at':r['at'],'look':r.get('look'),'why':r['why']})
        edges.append({'from':rid,'to':'area:'+r['area'],'relation':'in-area'})
        if r['area'] not in {a['id'] for a in spec['areas']}:problems.append(f"photo request {r['id']}: unknown area {r['area']}")
        for task in re.findall(r'task ([a-z0-9-]+)',r['why']):
            if task in task_ids:edges.append({'from':rid,'to':'task:'+task,'relation':'unblocks'})
            else:problems.append(f"photo request {r['id']}: unknown task {task}")
        for photo in r['photos']:
            edges.append({'from':'ref:'+photo,'to':rid,'relation':'answers','basis':'reviewed' if photo in r.get('answeredBy',[]) else 'position'})
        if r['status']=='answered' and not (r.get('answeredBy') and r.get('note')):problems.append(f"photo request {r['id']}: answered needs answeredBy photos and a note")
    path_totals=extend_path_network(ROOT,spec,catalog,features,nodes,edges,problems)
    graph_integrity(nodes,edges,problems)
    (refs/'graph.json').write_text(json.dumps({'version':2,'about':'Generated by scripts/build_references.py. All model nodes use model:<feature ID>. verification is strict placement status; photoVerification and checked-against retain photographic diagnostics separately. Only placement-verified-by edges grant placement approval within their stated tolerance. Open discrepancies block approval. Earlier manual reviews are not erased. Record validation does not inspect pixels or authenticate reviewer identity.',
         'pathNetwork':path_totals,'modelState':inventory,'nodes':nodes,'edges':edges},indent=1,ensure_ascii=False)+'\n')
    for t in spec['topics']:
        (refs/'topics'/f'{t["id"]}.md').write_text(topic_brief(t,[e for e in catalog if t['id'] in e['useFor']],spec))
    (refs/'README.md').write_text(index(spec,catalog,problems,queue,checks)+'\nPath-network baseline and per-area gaps: [PATH_NETWORK.md](PATH_NETWORK.md). Canonical inspector: `/?view=map&network=1`.\n')
    (ROOT/'public/reference-index.json').write_text(json.dumps(public_reference_index(catalog,features,checks,spec),indent=1,ensure_ascii=False)+'\n')
    if args.sheets:sheets(spec,catalog,args.reference)
    import build_confidence;problems+=build_confidence.write()  # public/confidence.json: the 'Sure / unsure' overlay
    import build_scorecard;build_scorecard.write()  # public/scorecard.json reads what was just written
    reviewed=sum(e['areasBasis']=='reviewed' for e in catalog)
    print(f'{len(catalog)} references, {reviewed} reviewed, {len(problems)} problems')
    for p in problems:print(' -',p)
    if args.check and problems:sys.exit(1)
if __name__=='__main__':main()
