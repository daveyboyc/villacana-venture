"""Fail-closed placement evidence policy. This validates records, not image content.

A reviewed placement is bound to model/source/artifact bytes, measured controls,
held-out validation points and a second reviewer's attestation. Open reports win.
Photo diagnostics remain separate and cannot grant placement verification.
"""
from __future__ import annotations
import hashlib
import itertools
import json
import math
import re
import struct
from pathlib import Path

FRAME = 'map-metres-east-south'
MAX_TOLERANCE_M = 2.0
# Frozen historical completions retain their reviews without receiving placement approval.
EXISTING_COMPLETIONS = frozenset('''elena-garden-door elena-east-patios cervantes-east-south-patios
cervantes-north-patios cervantes-east-hedge middle-pool-south-gate middle-pool-sw-steps
middle-pool-north-entrance middle-pool-raised-patios eva-walled-lawn elena-gated-entry
picasso-service-road barraka-boardwalk shoreline-check north-pool-garden-walls
paseo-details paseo-house-clearance paseo-retaining-wall paseo-retrace-line
cervantes-door-steps cervantes-steps-treads door-sills elena-east-patios junction-lawns
raised-terraces seaward-lanes-paving south-pool-seaward-level north-pool-west-frontage
north-pool-alignment-audit unified-reference-map'''.split())
# photo-camera.ts only places the camera for ?photocam= and reads the scene; it builds no geometry.
UI_MODULES = {'app.ts', 'photo-library.ts', 'references.ts', 'asset.ts', 'photo-camera.ts', 'scorecard.ts', 'confidence.ts', 'differences.ts'}
WORKFLOW_DATA = {'areas.json', 'build_queue.json', 'photo_checks.json', 'photo_positions.json',
                 'photo_annotations.json', 'reference_tags.json', 'placement_reviews.json', 'photo_poses.json',
                 'confidence.json', 'discrepancies.json'}


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()


def file_hash(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def safe_file(root, path):
    if not isinstance(path, str) or not path or Path(path).is_absolute():
        raise ValueError('file paths must be relative to the public repository')
    target = (root / path).resolve()
    if not target.is_relative_to(root.resolve()) or not target.is_file():
        raise ValueError(f'file unavailable or outside public repository: {path}')
    return target


def photo_summary(required, checks):
    """An incomplete or non-comparable source set cannot be promoted by one match."""
    relevant = [c for c in checks if c.get('photo') in required]
    results = {c.get('result') for c in relevant}
    if 'differs' in results:
        return 'differs'
    if not relevant:
        return 'unchecked'
    if set(required) - {c.get('photo') for c in relevant}:
        return 'incomplete'
    if 'not-comparable' in results:
        return 'not-comparable'
    return 'matches' if results == {'matches'} else 'incomplete'


def geometry_data(value):
    """Descriptive/citation edits do not move geometry; keep all other model inputs."""
    descriptive={'about','name','trust','evidence','note','notes','source','sources'}
    if isinstance(value,dict):return {k:geometry_data(v) for k,v in value.items() if k not in descriptive}
    if isinstance(value,list):return [geometry_data(v) for v in value]
    return value


def model_inventory(root, models):
    """Per-feature input digests plus a conservative shared renderer context digest."""
    renderers = {p.relative_to(root).as_posix(): file_hash(p) for p in sorted((root/'src').rglob('*.ts')) if p.name not in UI_MODULES}
    data_files = {p.name: p for p in (root/'data').glob('*.json') if p.name not in WORKFLOW_DATA}
    context = digest({'renderers': renderers, 'data':{name:digest(geometry_data(json.loads(path.read_text()))) for name,path in sorted(data_files.items())},
                      'frame': json.loads((root/'public/map/skeleton.json').read_text())['origin'], 'groundFrame': file_hash(root/'public/map/ground.json')})
    modules = {}
    for name in data_files:
        direct = [path for path in renderers if re.search(r'[\'\"][^\'\"]*/'+re.escape(name)+r'[\'\"]', (root/path).read_text())]
        modules[name] = direct
    inventory = {}
    for model in models:
        name = model['id'].split(':')[0]
        inputs = {}
        if name in data_files:
            inputs['data/'+name] = digest(geometry_data(json.loads(data_files[name].read_text())))
            for path in modules[name]:
                inputs[path] = renderers[path]
        else:
            # Registry geometry and built-in features are represented in the semantic model.
            role = {'building':'slice.ts', 'pool':'water.ts', 'street':'boundaries.ts'}.get(model.get('kind'))
            if role and 'src/'+role in renderers:
                inputs['src/'+role] = renderers['src/'+role]
        inventory[model['id']] = {'modelDigest': digest({'model': geometry_data(model), 'inputs': inputs}),
                                  'contextDigest': context, 'inputs': inputs, 'geometry': {k:model[k] for k in ('ring','points') if k in model}}
    return inventory


def source_snapshot(root, required, catalog):
    result = {}
    for id in sorted(required):
        if id == 'map:ground':
            result[id] = {'bounds': file_hash(root/'public/map/ground.json'), 'pixels': file_hash(root/'public/map/ground.jpg')}
            continue
        entry = catalog.get(id)
        if entry is None:
            raise ValueError(f'unknown source {id}')
        result[id] = {'metadata': digest(entry)}
        if id.startswith('ref:'):
            revision = entry.get('sourceRevision')
            if not isinstance(revision, str) or not re.fullmatch('[0-9a-f]{40}', revision):
                raise ValueError(f'{id}: private source needs an immutable sourceRevision in reference_tags.json')
            result[id]['revision'] = revision
        else:
            result[id]['pixels'] = file_hash(safe_file(root, entry['path']))
    return result


def packet_digest(review):
    return digest({k: v for k, v in review.items() if k != 'reviewer'})


def finite(value):
    return isinstance(value, (float, int)) and not isinstance(value, bool) and math.isfinite(value)


def point(value):
    return isinstance(value, list) and len(value) == 2 and all(finite(v) for v in value)


def jpeg_size(path):
    data=path.read_bytes();i=2
    while i+4<len(data):
        if data[i]!=255:
            i+=1;continue
        marker=data[i+1];i+=2
        if marker in (0xd8,0xd9):continue
        size=struct.unpack('>H',data[i:i+2])[0]
        if marker in (0xc0,0xc1,0xc2):
            height,width=struct.unpack('>HH',data[i+3:i+7]);return width,height
        if size<2:break
        i+=size
    raise ValueError('source image dimensions unavailable')


def validate_review(review, feature, inventory, catalog, tasks, root, all_models):
    errors = []
    def require(condition, message):
        if not condition:
            errors.append(message)
    def artifact(item, description):
        if not isinstance(item, dict):
            errors.append(description+' requires path and sha256')
            return
        try:
            require(file_hash(safe_file(root, item.get('path'))) == item.get('sha256'), description+' bytes changed')
        except (ValueError, OSError) as e:
            errors.append(description+': '+str(e))
    require(review.get('task') in tasks, 'unknown review task')
    require(bool(review.get('author')), 'author identity required')
    require(isinstance(review.get('checked'),str) and bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}',review['checked'])), 'review date required')
    require(bool(review.get('limitations')), 'source/measurement limitations required')
    for name in ('supersedes','resolves'):
        items=review.get(name,[])
        require(isinstance(items,list) and all(isinstance(id,str) and id for id in items) and len(items)==len(set(items)), name+' must be a list of unique record IDs')
    require(review.get('frame') == FRAME, 'common metre frame required')
    tolerance = review.get('toleranceM')
    valid_tolerance = finite(tolerance) and 0 < tolerance <= MAX_TOLERANCE_M
    require(valid_tolerance, f'toleranceM must be >0 and <={MAX_TOLERANCE_M}')
    required = set(feature['photos']) | {'map:ground'}
    try:
        current = {'model': inventory['modelDigest'], 'context': inventory['contextDigest'],
                   'sources': source_snapshot(root, required, catalog)}
        require(review.get('snapshot') == current, 'stale model, renderer or source snapshot')
    except (ValueError, OSError) as e:
        errors.append(str(e))
    artifact(review.get('overlay'), 'labelled map overlay')
    artifact(review.get('comparison'), 'source/render comparison')
    artifact(review.get('render'), 'current model render')
    try:
        render=safe_file(root,review.get('render',{}).get('path'));header=render.read_bytes()[:24]
        if header.startswith(b'\x89PNG\r\n\x1a\n') and len(header)>=24:width,height=struct.unpack('>II',header[16:24])
        elif header.startswith(b'\xff\xd8'):width,height=jpeg_size(render)
        else:raise ValueError('current render must be a PNG/JPEG image, not a textual software result')
        require(width>=320 and height>=200,'current render must be at least 320×200 pixels')
    except (ValueError,OSError,TypeError,struct.error) as error:errors.append(str(error))
    assessments = review.get('sourceAssessments', [])
    require(isinstance(assessments, list), 'sourceAssessments must be a list')
    if not isinstance(assessments, list):
        assessments = []
    require(len(assessments) == len({a.get('source') for a in assessments if isinstance(a, dict)}), 'duplicate source assessments')
    require({a.get('source') for a in assessments if isinstance(a, dict)} == required, 'assess every cited source and map:ground')
    registration = review.get('registration', {})
    if not isinstance(registration, dict):
        registration = {}
        errors.append('registration object required')
    require(any(a.get('source')==registration.get('source') and a.get('result')=='supports' for a in assessments if isinstance(a,dict)), 'registered map source must support the placement measurement')
    for assessment in assessments:
        if not isinstance(assessment, dict):
            errors.append('invalid source assessment')
            continue
        require(assessment.get('result') in ('supports', 'limited', 'unusable'), 'assessment result must be supports, limited or unusable')
        require(bool(assessment.get('canEstablish')) and bool(assessment.get('cannotEstablish')), 'each source needs capabilities and limits')
        if assessment.get('source') != 'map:ground':
            camera = assessment.get('cameraStatus')
            require(camera in ('calibrated', 'estimated', 'unavailable', 'not-applicable'), 'camera status required')
            require(assessment.get('comparison') in ('consistent', 'differs', 'not-comparable'), 'explicit photographic comparison result required')
            require(assessment.get('comparison') != 'differs', 'photographic disagreement cannot approve placement')
            if camera == 'calibrated':
                artifact(assessment.get('calibration'), 'camera calibration')
    require(registration.get('method') in ('georeferenced', 'rigid', 'similarity'), 'no local warping; use georeferenced, rigid or similarity registration')
    transform=registration.get('transform',[])
    dimensions=None
    valid_transform=isinstance(transform,list) and len(transform)==6 and all(finite(v) for v in transform)
    require(valid_transform, 'registration needs one global six-value transform [a,b,c,d,tx,tz]')
    if valid_transform:
        a,b,c,d,tx,tz=transform
        if registration.get('method')=='georeferenced':
            bounds=json.loads((root/'public/map/ground.json').read_text())
            try:
                width,height=jpeg_size(root/'public/map/ground.jpg')
                dimensions=(width,height)
                expected=[(bounds['maxX']-bounds['minX'])/width,0,0,(bounds['maxZ']-bounds['minZ'])/height,bounds['minX'],bounds['minZ']]
                require(registration.get('source')=='map:ground' and all(abs(x-y)<1e-8 for x,y in zip(transform,expected)), 'georeferencing must use actual aerial pixel dimensions and ground.json bounds')
            except (ValueError,OSError) as error:errors.append(str(error))
        else:
            require(abs(a*b+c*d)<1e-6 and abs(a*a+c*c-b*b-d*d)<1e-6 and a*d-b*c>0, 'registration transform must be rigid/similarity, never local warp, shear or reflection')
            if registration.get('method')=='rigid':require(abs(a*a+c*c-1)<1e-6,'rigid transform cannot change scale')
            source=catalog.get(registration.get('source'),{})
            require(registration.get('source') in required and source.get('viewpoint') in ('aerial','map'), 'rigid/similarity registration needs an identified map/aerial source, not a ground camera')
    controls, validation = registration.get('controls', []), registration.get('validation', [])
    if not isinstance(controls, list) or not isinstance(validation, list):
        controls, validation = [], []
    require(len(controls) >= 3 and len(validation) >= 2, 'need at least 3 registration controls and 2 held-out validation landmarks')
    landmarks = controls + validation
    ids = [a.get('id') for a in landmarks if isinstance(a, dict)]
    require(len(ids) == len(landmarks) and all(ids) and len(ids) == len(set(ids)), 'controls and validation must have distinct identifiable landmark IDs')
    physical=[tuple(a['mapPoint']) for a in landmarks if isinstance(a,dict) and point(a.get('mapPoint'))]
    require(len(physical)==len(set(physical)), 'held-out validation cannot reuse a control vertex under a different label')
    pixels=[tuple(a['sourcePixel']) for a in landmarks if isinstance(a,dict) and point(a.get('sourcePixel'))]
    require(len(pixels)==len(set(pixels)), 'held-out validation cannot reuse a source pixel')
    require(len({a.get('modelFeature') for a in landmarks if isinstance(a,dict)})>=2, 'landmarks must span at least two identified model features')
    measured_errors = []
    for a in landmarks:
        if not isinstance(a, dict):
            errors.append('invalid landmark')
            continue
        good = point(a.get('sourcePoint')) and point(a.get('mapPoint')) and finite(a.get('uncertaintyM')) and a['uncertaintyM'] >= 0
        require(good and a.get('source') in required and bool(a.get('identification')), 'landmark needs source, identified feature, measured points and uncertainty')
        if good:
            raw=a.get('sourcePixel')
            require(point(raw) and a.get('source')==registration.get('source'), 'landmark needs raw source pixel coordinates from the registered source')
            if point(raw) and dimensions:
                require(all(0<=v<limit for v,limit in zip(raw,dimensions)), 'landmark pixel outside inspected aerial bounds')
            if point(raw) and valid_transform:
                aa,bb,cc,dd,tx,tz=transform
                require(math.dist([aa*raw[0]+bb*raw[1]+tx,cc*raw[0]+dd*raw[1]+tz],a['sourcePoint'])<1e-6,'landmark sourcePoint does not follow the single registered transform')
            geometry=all_models.get(a.get('modelFeature'),{}).get('geometry',{})
            vertices=geometry.get('ring') or geometry.get('points') or []
            require(any(math.dist(a['mapPoint'],p)<1e-6 for p in vertices),'landmark mapPoint must be an actual vertex of its identified modelFeature')
            error = math.dist(a['sourcePoint'], a['mapPoint']) + a['uncertaintyM']
            measured_errors.append(error)
            require(not valid_tolerance or error <= tolerance, f'landmark {a.get("id")} exceeds placement tolerance including uncertainty')
    positions = [a['mapPoint'] for a in controls if isinstance(a, dict) and point(a.get('mapPoint'))]
    spread = max((abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2 for a,b,c in itertools.combinations(positions,3)), default=0)
    require(spread >= 1, 'registration controls must be distributed and non-collinear (triangle area >=1 m²)')
    measurements = review.get('measurements', [])
    require(isinstance(measurements,list) and bool(measurements), 'feature placement measurements required')
    if not isinstance(measurements,list):measurements=[]
    points=inventory.get('geometry',{}).get('ring') or inventory.get('geometry',{}).get('points') or []
    covered=set()
    for measurement in measurements:
        if not isinstance(measurement,dict):
            errors.append('invalid feature measurement');continue
        good = point(measurement.get('sourcePoint')) and point(measurement.get('modelPoint')) and finite(measurement.get('uncertaintyM')) and measurement['uncertaintyM'] >= 0
        require(good and bool(measurement.get('featurePoint')) and bool(measurement.get('basis')), 'feature placement needs independently measured source/model points, point identity, basis and uncertainty')
        if good:
            raw=measurement.get('sourcePixel')
            require(point(raw) and measurement.get('source')==registration.get('source'), 'feature measurement needs pixels in the registered source')
            if point(raw) and dimensions:
                require(all(0<=v<limit for v,limit in zip(raw,dimensions)), 'feature pixel outside inspected aerial bounds')
            if point(raw) and valid_transform:
                aa,bb,cc,dd,tx,tz=transform
                require(math.dist([aa*raw[0]+bb*raw[1]+tx,cc*raw[0]+dd*raw[1]+tz],measurement['sourcePoint'])<1e-6,'feature sourcePoint must follow the single registered transform')
            matches=[i for i,p in enumerate(points) if math.dist(measurement['modelPoint'],p)<1e-6]
            require(bool(matches), 'measurement model point must be an actual feature vertex/point')
            covered.update(matches)
            if valid_tolerance:
                require(math.dist(measurement['sourcePoint'], measurement['modelPoint']) + measurement['uncertaintyM'] <= tolerance, 'feature position exceeds declared tolerance')
    require(bool(points) and len(covered)==len(points), 'measure every represented outline vertex/point; one centre cannot approve orientation or extents')
    reviewer = review.get('reviewer', {})
    if not isinstance(reviewer, dict):
        reviewer = {}
    require(bool(reviewer.get('id')) and reviewer.get('id','').strip().casefold() != str(review.get('author','')).strip().casefold(), 'reviewer must be different from author')
    require(reviewer.get('decision') == 'approved', 'independent approval required')
    require(isinstance(reviewer.get('reviewedAt'),str) and bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}',reviewer['reviewedAt'])) and reviewer['reviewedAt']>=str(review.get('checked','')), 'independent review date must be on or after the measurement date')
    require(reviewer.get('packetDigest') == packet_digest(review), 'reviewer must approve these exact packet bytes')
    require(set(reviewer.get('sourcesInspected', [])) == required, 'reviewer must attest inspecting every required source')
    artifact(reviewer.get('evidence'), 'independent review record')
    return errors, max(measured_errors, default=None)


def photo_report_id(check):
    return 'photo-discrepancy:'+digest({k:check.get(k) for k in ('task','feature','photo')})[:16]


def evaluate(root, features, catalog, tasks, checks, inventory, problems):
    path = root/'data/placement_reviews.json'
    spec = json.loads(path.read_text()) if path.is_file() else {'reviews': [], 'reports': []}
    feature_by = {f['id']:f for f in features}; task_by = {t['id']:t for t in tasks}; sources = {e['id']:e for e in catalog}
    if not isinstance(spec,dict):
        problems.append('placement specification must be an object');spec={}
    reviews, reports = spec.get('reviews', []), spec.get('reports', [])
    for name,items in [('reviews',reviews),('reports',reports)]:
        if not isinstance(items,list) or any(not isinstance(item,dict) for item in items):
            problems.append(f'placement {name} must be a list of objects')
    reviews=[r for r in reviews if isinstance(r,dict)] if isinstance(reviews,list) else []
    reports=[r for r in reports if isinstance(r,dict)] if isinstance(reports,list) else []
    for c in checks:
        if c.get('result') == 'differs':
            id = photo_report_id(c)
            stored=next((r for r in reports if r.get('id')==id),None)
            if stored and (stored.get('feature')!=c['feature'] or c['photo'] not in stored.get('sources',[])):
                problems.append(f'placement report {id}: cannot change the feature/source of its original differing photo check')
            if stored is None:
                reports.append({'id':id, 'feature':c['feature'], 'status':'open', 'followUp':c.get('followUp'),
                                'sources':[c['photo']], 'notes':c.get('notes'), 'reportedBy':c.get('by'), 'origin':'photo-check'})
    valid, review_errors, ids = {}, {}, set()
    for r in reviews:
        if not isinstance(r,dict):problems.append('placement review must be an object');continue
        id, feature = r.get('id'), r.get('feature')
        if not isinstance(id,str) or not id or id in ids:
            problems.append('placement reviews need unique non-empty IDs');continue
        ids.add(id)
        if feature not in feature_by:
            problems.append(f'placement review {id}: unknown feature {feature}');continue
        try:errors, max_error = validate_review(r,feature_by[feature],inventory[feature],sources,task_by,root,inventory)
        except (TypeError,KeyError,ValueError,AttributeError) as error:errors,max_error=['malformed placement packet: '+str(error)],None
        review_errors[id] = errors
        if not errors:
            valid[id] = {**r, 'maxRegistrationErrorM':max_error}
    superseded=set()
    review_by={r.get('id'):r for r in reviews}
    def reaches(start,target,seen=None):
        seen=set() if seen is None else seen
        if start==target:return True
        if start in seen:return False
        seen.add(start)
        return any(reaches(old,target,seen) for old in review_by.get(start,{}).get('supersedes',[]))
    for id,review in list(valid.items()):
        for old in review.get('supersedes',[]):
            previous=review_by.get(old,{})
            if previous.get('feature')!=review['feature'] or str(previous.get('checked',''))>str(review.get('checked','')) or reaches(old,id):
                review_errors[id].append(f'invalid supersession {old}')
                valid.pop(id,None)
            else:superseded.add(old)
    for id,errors in review_errors.items():
        if id not in superseded:problems.extend(f'placement review {id}: {error}' for error in errors)
    for id in superseded:valid.pop(id,None)
    report_ids, opened = set(), {}
    for report in reports:
        id, feature = report.get('id'), report.get('feature')
        if not isinstance(id,str) or not id or id in report_ids:
            problems.append('placement reports need unique non-empty IDs');continue
        report_ids.add(id)
        if feature not in feature_by:
            problems.append(f'placement report {id}: unknown feature {feature}')
        if report.get('evidence'):
            try:safe_file(root,report['evidence'])
            except (ValueError,OSError) as error:problems.append(f'placement report {id}: {error}')
        if not report.get('notes') or not report.get('reportedBy'):
            problems.append(f'placement report {id}: reporter and concrete discrepancy notes required')
        if not report.get('sources') or not set(report['sources']) <= set(sources)|{'map:ground'}:
            problems.append(f'placement report {id}: identified sources required')
        follow = task_by.get(report.get('followUp'))
        resolution = valid.get(report.get('resolutionReview'))
        resolved = report.get('status') == 'resolved' and resolution and resolution['feature'] == feature and id in resolution.get('resolves', [])
        if report.get('status') not in ('open','resolved'):
            problems.append(f'placement report {id}: status must be open or resolved')
        if report.get('status') == 'resolved' and not resolved:
            problems.append(f'placement report {id}: resolution needs a current approved review for the same feature explicitly resolving this report')
        if not resolved:
            opened.setdefault(feature,[]).append(id)
            if follow is None or follow.get('status') == 'done':
                problems.append(f'placement report {id}: unresolved discrepancy needs an open follow-up task')
    states = {}
    for feature in features:
        id = feature['id']; candidates = [r for r in valid.values() if r['feature']==id]
        bad = [e for r in reviews if r.get('feature')==id for e in review_errors.get(r.get('id'),[]) if r.get('id') not in superseded]
        blockers = [f'open discrepancy {r}' for r in opened.get(id, [])]
        if blockers:
            status = 'disputed'
        elif any('stale' in e or 'bytes changed' in e for e in bad):
            status = 'stale';blockers = bad
        elif bad:
            status = 'incomplete';blockers = bad
        elif candidates:
            status = 'verified'
        else:
            status = 'unreviewed';blockers = ['No measured placement packet and independent approval recorded; earlier manual reviews may exist.']
        states[id] = {'status':status, 'scope':'placement only', 'blockers':blockers,
                      'reviewIds':[r['id'] for r in candidates], 'reportIds':opened.get(id,[]),
                      'modelDigest':inventory[id]['modelDigest'], 'contextDigest':inventory[id]['contextDigest']}
        if candidates:
            states[id]['maxRegistrationErrorM']=max(r['maxRegistrationErrorM'] for r in candidates)
            states[id]['toleranceM'] = min(r['toleranceM'] for r in candidates)
    for task in tasks:
        declared = task.get('features', [])
        if not isinstance(declared,list) or any(id not in feature_by for id in declared):
            problems.append(f'task {task["id"]}: features must name known model feature IDs');declared=[]
        tooling = task.get('kind') in ('tooling','audit')
        task['placement'] = {'status': 'not-applicable' if tooling else 'verified' if declared and all(states[id]['status']=='verified' for id in declared) else 'not-verified', 'features':declared}
        if task.get('status')=='done' and not tooling and task['id'] not in EXISTING_COMPLETIONS:
            if not declared or task['placement']['status']!='verified':
                problems.append(f'task {task["id"]}: done geometry task requires declared features with fresh verified placement evidence')
    return states, reviews, reports
