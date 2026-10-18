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
With --sheets, contact sheets of thumbnails go to <reference>/contact-sheets/,
because they include private images and this repo is public.
--check fails if a reference has no area, or a tag names an unknown area,
topic or file, or a done task was never checked against its photos.

A feature citing a photo ('cites') only says an author used it. Whether the
build was compared with the photo is recorded in data/photo_checks.json: an
after-render from the photo's camera, a result (matches, differs or
not-comparable) and notes. Those become 'checked-against' edges and a
'verification' state on features and tasks. A done task must have a check for
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
        if 'looksAt' in tag and not (isinstance(tag['looksAt'],list) and len(tag['looksAt'])==2 and all(isinstance(v,(int,float)) for v in tag['looksAt'])):problems.append(f'{key}: looksAt must be [x, z] in map metres')
    for e in catalog:
        if not e['shows']:problems.append(f'{e["id"]}: no area (tag it in data/reference_tags.json)')
    return spec,catalog,problems

ALTITUDE_SPLIT=9.0
HEADING_TOLERANCE=45
CHECK_RESULTS=('matches','differs','not-comparable')
# Done tasks that were never rendered against their photos when photo checks began (18 October).
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

def load_checks(catalog,queue,features,problems):
    """Render-versus-photo checks from data/photo_checks.json, validated against the queue, features and tags."""
    spec=load(ROOT/'data/photo_checks.json',{'checks':[],'legacyUnchecked':[]})
    checks,legacy=spec.get('checks',[]),spec.get('legacyUnchecked',[])
    by={e['id']:e for e in catalog};tasks={t['id']:t for t in queue};feats={f['id'] for f in features}
    for c in checks:
        name=f"photo check {c.get('task')} / {c.get('photo')}";res=c.get('result')
        if c.get('task') not in tasks:problems.append(f'{name}: unknown task')
        if c.get('feature') not in feats:problems.append(f"{name}: feature {c.get('feature')!r} does not cite photos in the evidence graph")
        e=by.get(c.get('photo'))
        if e is None:problems.append(f'{name}: photo not in the catalogue')
        elif e.get('camera') and e.get('looksAtBasis')!='reviewed':problems.append(f'{name}: set looksAt and subject for the photo in data/reference_tags.json, so the render faces what the photo shows')
        if res not in CHECK_RESULTS:problems.append(f'{name}: result must be one of {", ".join(CHECK_RESULTS)}')
        if res!='not-comparable' and not (c.get('render') and (ROOT/c['render']).is_file()):problems.append(f"{name}: after render {c.get('render')!r} is not committed")
        if c.get('before') and not (ROOT/c['before']).is_file():problems.append(f"{name}: before render {c['before']!r} is not committed")
        if not c.get('notes'):problems.append(f'{name}: notes must say what matches and what differs')
        follow=tasks.get(c.get('followUp'))
        if res=='differs' and (follow is None or follow.get('status')=='done'):problems.append(f'{name}: differs, so followUp must name an open task in data/build_queue.json')
    checked={(c.get('task'),c.get('photo')) for c in checks}
    for t in queue:
        missing=[p for p in t['photos'] if (t['id'],p) not in checked]
        t['verification']=verdict([c for c in checks if c.get('task')==t['id']]) if not missing else ('legacy-unchecked' if t['id'] in legacy else 'unchecked')
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
    photos=', '.join(f'[{Path(p).stem}]({up}../public/photos-ref/{p})' for p in t['photos'])
    deps=f" (after {', '.join(t['dependsOn'])})" if t.get('dependsOn') else ''
    owner=f" · {t['owner']}" if t.get('owner') else ''
    issue=f" [#{t['issue']}](https://github.com/daveyboyc/villacana-venture/issues/{t['issue']})" if t.get('issue') else ''
    checked=f" · photos: {t['verification']}" if t.get('status')=='done' and t.get('verification') else ''
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
        out+=['','## Verification backlog','',f'{len(backlog)} tasks were marked done before render-versus-photo checks were recorded, so nobody has confirmed the build matches their photos. '
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
            '- [ ] Before/after renders from each photo\'s camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them']
    if t.get('dependsOn'):lines+=['',f"Depends on: {', '.join('`'+d+'`' for d in t['dependsOn'])}"]
    return '\n'.join(lines)+'\n'

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
        out.append(f'  A --> F{i}["{safe(f["name"])} · {f.get("verification","unchecked")}"]')
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
    ids={t['id'] for t in queue if t['area']==area['id']}
    here=[c for c in checks if c.get('task') in ids]
    if here:
        out+=['## Photo checks','','Renders from each photo\'s camera compared with the photo (`data/photo_checks.json`).','','| Task | Photo | Result | Render | Notes |','| --- | --- | --- | --- | --- |']
        out+=[f"| `{c['task']}` | [{Path(c['photo']).stem}](../../public/photos-ref/{c['photo']}) | **{c['result']}**{' → `'+c['followUp']+'`' if c.get('followUp') else ''} | "+(f"[after](../../{c['render']})" if c.get('render') else '')+(f" · [before](../../{c['before']})" if c.get('before') else '')+f" | {c.get('notes','')} |" for c in here]+['']
    never=[t for t in queue if t['area']==area['id'] and t.get('status')=='done' and t.get('verification') in ('unchecked','legacy-unchecked')]
    if never:out+=['**Built but never checked against its photos:** '+', '.join(f"`{t['id']}`" for t in never)+'. Treat their geometry as unconfirmed; see the verification backlog in `refs/QUEUE.md`.','']
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
    reviewed=sum(e['areasBasis']=='reviewed' for e in catalog)
    out+=['',f'{len(catalog)} references: {reviewed} reviewed, {len(catalog)-reviewed} with areas suggested only from the camera position.','']
    done=[t for t in queue if t.get('status')=='done'];results=[c.get('result') for c in checks]
    out+=[f"Photo checks (`data/photo_checks.json`): {len(checks)} renders compared with their photos, {results.count('matches')} match, {results.count('differs')} differ. "
          f"{sum(t.get('verification') in ('unchecked','legacy-unchecked') for t in done)} of {len(done)} done tasks have never been checked against their photos (QUEUE.md, verification backlog).",'']
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
    queue=load_queue(spec,catalog,problems)
    checks,legacy=load_checks(catalog,queue,features,problems)
    for f in features:f['verification']=verdict([c for c in checks if c.get('feature')==f['id']])
    for a in spec['areas']:
        (refs/'areas'/f'{a["id"]}.md').write_text(brief(a,[e for e in catalog if a['id'] in e['shows']],spec['topics'],spec,features,queue,checks))
    (refs/'QUEUE.md').write_text(queue_page(queue,spec,legacy))
    issues=refs/'issues';issues.mkdir(exist_ok=True)
    for old in issues.glob('*.md'):old.unlink()
    for t in queue:
        if t.get('status')!='done':(issues/f"{t['id']}.md").write_text(issue_body(t,spec,catalog))
    nodes=[{'id':'area:'+a['id'],'kind':'area','name':a['name']} for a in spec['areas']]+[{'id':'topic:'+t['id'],'kind':'topic','name':t['name']} for t in spec['topics']]
    nodes+=[{'id':'ref:'+e['id'] if not e['id'].startswith('ref:') else e['id'],'kind':e['kind'],'name':e['title'],'path':e['path'],'viewpoint':e['viewpoint']} for e in catalog]
    nodes+=[{'id':f['id'],'kind':'model-feature','name':f['name'],'verification':f['verification']} for f in features]
    key=lambda e:'ref:'+e['id'] if not e['id'].startswith('ref:') else e['id']
    edges=[{'from':key(e),'to':'area:'+a,'relation':'shows'} for e in catalog for a in e['shows']]
    edges+=[{'from':key(e),'to':'topic:'+t,'relation':'useful-for'} for e in catalog for t in e['useFor']]
    edges+=[{'from':f['id'],'to':'ref:'+p,'relation':'cites'} for f in features for p in f['photos']]
    edges+=[{'from':f['id'],'to':'area:'+a,'relation':'in-area'} for f in features for a in f['areas']]
    edges+=[{'from':c['feature'],'to':'ref:'+c['photo'],'relation':'checked-against','result':c['result'],'task':c['task'],'checked':c.get('checked'),**({'render':c['render']} if c.get('render') else {})} for c in checks]
    edges+=[{'from':key(e),'to':m,'relation':'looks-at','basis':e['looksAtBasis']} for e in catalog for m in e.get('looksAtFeatures',[])]
    nodes+=[{'id':'task:'+t['id'],'kind':'build-task','name':t['title'],'priority':t['priority'],'status':t.get('status','open'),'verification':t['verification'],**({'issue':t['issue']} if t.get('issue') else {})} for t in queue]
    edges+=[{'from':'task:'+t['id'],'to':'area:'+t['area'],'relation':'in-area'} for t in queue]
    edges+=[{'from':'task:'+t['id'],'to':'ref:'+p,'relation':'builds-from'} for t in queue for p in t['photos']]
    edges+=[{'from':'task:'+t['id'],'to':'task:'+d,'relation':'depends-on'} for t in queue for d in t.get('dependsOn',[])]
    (refs/'graph.json').write_text(json.dumps({'about':'Generated by scripts/build_references.py. shows/useful-for come from reviewed tags; cites from feature evidence (an author used the photo, not proof it matches); checked-against from data/photo_checks.json (rendered from the photo\'s camera and compared, with its result); verification on features and tasks summarises those checks; in-area is the area most of a feature\'s cited photos show.','nodes':nodes,'edges':edges},indent=1,ensure_ascii=False)+'\n')
    for t in spec['topics']:
        (refs/'topics'/f'{t["id"]}.md').write_text(topic_brief(t,[e for e in catalog if t['id'] in e['useFor']],spec))
    (refs/'README.md').write_text(index(spec,catalog,problems,queue,checks))
    if args.sheets:sheets(spec,catalog,args.reference)
    reviewed=sum(e['areasBasis']=='reviewed' for e in catalog)
    print(f'{len(catalog)} references, {reviewed} reviewed, {len(problems)} problems')
    for p in problems:print(' -',p)
    if args.check and problems:sys.exit(1)
if __name__=='__main__':main()
