"""Validate scoped source inventories and project safe observations into the reference graph.

A pixel trace is never converted to map metres. Inventory review cannot grant
placement approval. Private source pixels and annotations stay in the private repo.
"""
import hashlib
import json
import shutil
import re
from PIL import Image
from pathlib import Path


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_inventories(root, authored, catalog, features, problems):
    known = {s['id']: s for s in catalog}
    known['map:ground'] = {'id': 'map:ground', 'path': 'public/map/ground.jpg', 'shows': ['whole-resort']}
    models = {f['id']: f for f in features}
    queue_path=root/'data/build_queue.json'
    tasks={t['id']:t for t in json.loads(queue_path.read_text())['tasks']} if queue_path.exists() else {}
    def task_link(id):
        return dict(id=id, url=('https://github.com/daveyboyc/villacana-venture/issues/'+str(tasks[id]['issue'])) if tasks.get(id, {}).get('issue') else 'https://github.com/daveyboyc/villacana-venture/blob/main/refs/issues/'+id+'.md')
    observations, accounting, summaries = [], {}, {}
    for entry in authored.get('inventories', []):
        initial_problems = len(problems)
        area, path = entry['area'], root / entry['path']
        if not path.is_file():
            problems.append('path inventory: missing '+entry['path']); continue
        inventory = json.loads(path.read_text())
        all_sources = inventory.get('sources', []) + inventory.get('supplementalSources', [])
        sources = {s['id']: s for s in all_sources}
        if len(sources) != len(all_sources):
            problems.append('path inventory: duplicate source '+area)
        ids = {f['id'] for f in inventory.get('features', [])}
        if len(ids) != len(inventory.get('features', [])):
            problems.append('path inventory: duplicate feature '+area)
        by_source = {id: [] for id in sources}
        for feature in inventory.get('features', []):
            id = 'path-observation:' + feature['id']
            for source in feature.get('sources', []):
                if source not in sources:
                    problems.append(f'path inventory: {id} references uninspected source {source}')
                by_source.setdefault(source, []).append(id)
            if not feature.get('observed'):
                problems.append('path inventory: missing observation '+id)
            for trace in feature.get('traces', []):
                if trace.get('source') in known and not known[trace['source']]['path'].startswith('public/'):
                    problems.append('path inventory: private pixel annotations must remain private '+id)
                source = sources.get(trace.get('source'))
                if not source:
                    problems.append('path inventory: trace source missing '+id); continue
                ps = trace.get('points', [])
                if len(ps) < 2 or any(not isinstance(p, list) or len(p) != 2 or
                    any(not isinstance(v, (float, int)) or isinstance(v, bool) for v in p) or
                    not (0 <= p[0] <= source['width'] and 0 <= p[1] <= source['height']) for p in ps):
                    problems.append('path inventory: invalid pixel trace '+id)
                if not trace.get('role'):
                    problems.append('path inventory: trace role missing '+id)
            if feature.get('mapGeometry') is not None:
                problems.append('path inventory: source-relative inventory cannot author world geometry '+id)
            model_context = []
            for model in feature.get('modelFeatureIds', []):
                if model not in models:
                    problems.append('path inventory: unknown model '+model); continue
                f = models[model]
                model_context.append(dict(id='model:'+model, placement=f['placement'], photoVerification=f['photoVerification']))
            observations.append(dict(id=id, kind='path-observation', name=feature['name'], areas=[area],
                componentKind=feature.get('kind', 'unresolved'), observed=feature['observed'],
                unknowns=feature.get('unknowns', []) if isinstance(feature.get('unknowns', []), list) else [feature['unknowns']], sources=feature.get('sources', []),
                traces=[t for t in feature.get('traces', []) if t.get('source') in known and known[t['source']]['path'].startswith('public/')], mapGeometry=None, modelContext=model_context,
                states=dict(source='inspected', identity=feature.get('identityState', 'observed'),
                    model='partial' if model_context else 'absent', placement='unreviewed', runtime='unchecked'),
                drawing=f'/path-network/{area}/index.html?feature='+feature['id'],
                sourceFrame='source pixels; no registered world transform',
                nextAction=feature.get('nextAction', 'Resolve source limitations and compare the declared component to the current game.'),
                nextTask=task_link(entry['featureFollowUps'][feature['id']]) if feature['id'] in entry.get('featureFollowUps', {}) else None,
                inventoryRevision=sha(path)))
        safe_sources = []
        for source in sources.values():
            id = source['id']
            if id not in known:
                problems.append('path inventory: unknown source '+id); continue
            original = root / known[id]['path']
            is_public = known[id]['path'].startswith('public/')
            if not is_public: original = root.parent / known[id]['path']
            if (is_public or original.is_file()) and (not original.is_file() or source.get('sha256') != sha(original)):
                problems.append('path inventory: source bytes stale '+id)
            if original.is_file():
                with Image.open(original) as image:
                    if image.size != (source.get('width'), source.get('height')):
                        problems.append('path inventory: source dimensions stale '+id)
            if not all(source.get(k) for k in ('reason', 'disposition', 'limitations')):
                problems.append('path inventory: source accounting lacks disposition/reason/limitations '+id)
            if source.get('disposition') == 'observed' and not by_source[id]:
                problems.append('path inventory: observed source has no feature accounting '+id)
            if id != 'map:ground':
                previous=accounting.get(id)
                accounting[id] = dict(areasInspected=[area], disposition=source.get('disposition'), reason=source.get('reason'),
                    reviewer=source.get('reviewer', inventory.get('inspectedBy', 'Codex:elena_photo_inventory')),
                    revision=source.get('sha256') or source.get('revision'), features=by_source[id],
                    limitations=source.get('limitations'), inventory=entry['path'],
                    **({'retainedSource':source['retainedSource']} if source.get('retainedSource') else {}))
                accounting[id]['scopedReviews']=[dict(area=area, disposition=source.get('disposition'), reason=source.get('reason'), limitations=source.get('limitations'), inventory=entry['path'])]
                if previous:
                    if previous['revision']!=accounting[id]['revision']:
                        problems.append('path inventory: conflicting scoped source revisions '+id)
                    accounting[id]['areasInspected']=sorted(set(previous['areasInspected']+[area]))
                    accounting[id]['features']=sorted(set(previous['features']+accounting[id]['features']))
                    accounting[id]['scopedReviews']=previous['scopedReviews']+accounting[id]['scopedReviews']
                    if accounting[id]['features']: accounting[id]['disposition']='observed'
            safe_sources.append(dict(id=id, image=('../../map/ground.jpg' if id=='map:ground' else '../../photos-ref/'+id) if is_public else None,
                disposition=source.get('disposition'), reason=source.get('reason'), limitations=source.get('limitations'),
                width=source.get('width'), height=source.get('height'), sha256=source.get('sha256'),
                private=not is_public))
        review = None
        if entry.get('review') and (root/entry['review']).is_file():
            review = json.loads((root/entry['review']).read_text())
        assessments_path=root/entry['assessments'] if entry.get('assessments') else None
        drawing_hashes={drawing['path']:sha(path.parent/drawing['path']) for drawing in inventory.get('drawings', []) if (path.parent/drawing['path']).is_file()}
        current_review = bool(review and review.get('inventorySha256') == sha(path) and
                              review.get('status') == 'reviewed' and bool(review.get('reviewer')) and
                              review.get('drawingSha256') == drawing_hashes and
                              (not assessments_path or (assessments_path.is_file() and review.get('assessmentSha256')==sha(assessments_path))) and
                              set(sources).issubset(review.get('inspectedSourceIds', [])) and not review.get('blockers'))
        required = {s['id'] for s in catalog if area in s['shows']}
        missing = sorted(required - sources.keys())
        source_reviewed = all(s.get('disposition') in ('observed','unusable','duplicate') for s in sources.values())
        summaries[area] = dict(inventoryPath=entry['path'], revision=sha(path), sources=list(sources),
            missingCatalogueSources=missing, observations=[f['id'] for f in inventory.get('features', [])],
            sourceCoverage='inspected' if not missing and source_reviewed else 'partial',
            inventoryComplete=bool(current_review and not missing and source_reviewed and len(problems)==initial_problems),
            reviewCurrent=current_review, limits=inventory.get('scope', inventory.get('scopeLimit', 'Available-source inventory only; world placement remains unresolved.')),
            drawing=f'/path-network/{area}/index.html', tunnels=inventory.get('tunnels', []),
            evidenceRequests=[{**gap, **({'followUp':entry['followUps'][gap['id']]} if gap['id'] in entry.get('followUps', {}) else {})} for gap in inventory.get('evidenceRequests', [])])
        target = root/'public/path-network'/area
        target.mkdir(parents=True, exist_ok=True)
        drawings = []
        for drawing in inventory.get('drawings', []):
            src = path.parent/drawing['path']
            if not src.is_file():
                problems.append('path inventory: missing drawing '+str(src)); continue
            text = src.read_text()
            if '<image' in text or '<script' in text or 'data:image' in text:
                problems.append('path inventory: drawings must be public-safe vector observations '+str(src)); continue
            shutil.copyfile(src, target/src.name)
            drawings.append(dict(name=drawing.get('name', src.stem), path=src.name))
            if src.with_suffix('.png').is_file(): shutil.copyfile(src.with_suffix('.png'), target/src.with_suffix('.png').name)
        assessments = []
        if entry.get('assessments') and (root/entry['assessments']).is_file():
            assessment_doc = json.loads((root/entry['assessments']).read_text())
            for item in assessment_doc.get('assessments', []):
                if not set(item.get('featureIds', [])).issubset(ids):
                    problems.append('path inventory: assessment has unknown feature '+area)
                if not re.fullmatch('[a-f0-9]{40}', item.get('modelRevision', '')):
                    problems.append('path inventory: assessment needs immutable model revision '+area)
                image = path.parent / item['image'] if item.get('image') else None
                if image:
                    if not image.is_file() or item.get('imageSha256') != sha(image):
                        problems.append('path inventory: assessment render is stale '+str(image)); continue
                    if image.suffix.lower() not in ('.png','.jpg','.jpeg'):
                        problems.append('path inventory: assessment must use a render image '+str(image)); continue
                    shutil.copyfile(image, target/image.name)
                assessments.append({**item, **({'image': image.name} if image else {})})
        if assessments_path and assessments_path.is_file() and ids-set(id for item in assessments for id in item.get('featureIds', [])):
            problems.append('path inventory: every component needs an assessment or explicit not-comparable result '+area)
        if len(problems)>initial_problems: summaries[area]['inventoryComplete']=False
        safe_features = []
        for f in inventory.get('features', []):
            safe_features.append({**{k:f.get(k) for k in ['id','name','kind','sources','observed','unknowns','modelFeatureIds','nextAction']}, 'traces':[t for t in f.get('traces', []) if t.get('source') in known and known[t['source']]['path'].startswith('public/')]})
        safe = dict(area=area, scope=inventory.get('scope', inventory.get('scopeLimit')), revision=sha(path), sources=safe_sources,
            features=safe_features, drawings=drawings, assessments=assessments,
            tasks={id:task_link(id) for id in set(entry.get('featureFollowUps', {}).values())},
            inventoryComplete=summaries[area]['inventoryComplete'])
        (target/'inventory.json').write_text(json.dumps(safe, indent=1, ensure_ascii=False)+'\n')
        shutil.copyfile(root/'scripts/path_network_inventory_viewer.html', target/'index.html')
    return observations, accounting, summaries
