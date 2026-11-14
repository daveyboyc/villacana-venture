"""Evidence work states and graph extension. No image recognition or invented approvals.

build_references calls extend() with freshly evaluated placement states. Missing evidence is
work data, not a generation error. Invalid records and unsupported closure are errors.
"""
from __future__ import annotations

import json
import math
import re
from pathlib import Path

from placement_verification import digest, file_hash, safe_file

PHOTO_KINDS = {'phone-photo', 'own-photo', 'web-photo'}
KINDS = {'placement', 'appearance', 'height', 'completeness'}


def review_digest(review):
    return digest({k: v for k, v in review.items() if k != 'packetDigest'})


def read(root, path, default=None):
    p = root / path
    return json.loads(p.read_text()) if p.exists() else default


def source_snapshot(root, source, catalog):
    if source == 'map:ground':
        return digest({p: file_hash(safe_file(root, p)) for p in ('public/map/ground.jpg', 'public/map/ground.json')})
    entry = catalog[source]
    if source.startswith('ref:'):
        revision = entry.get('sourceRevision')
        if not isinstance(revision, str) or not re.fullmatch('[0-9a-f]{40}', revision):
            raise ValueError(f'{source}: pin the private sourceRevision to an immutable commit before acceptance')
        return digest({'revision': revision, 'path': entry['path']})
    return file_hash(safe_file(root, entry['path']))


def snapshot(root, item, catalog, inventory, standard):
    """Bind acceptance to model/context bytes, camera solves, source bytes and the criterion."""
    poses = read(root, 'data/photo_poses.json', {'photos': {}})['photos']
    return {
        'standard': digest(standard),
        'criterion': digest({k: item.get(k) for k in ('id', 'area', 'kind', 'description', 'sources', 'features', 'task', 'requests')}),
        'models': {f: inventory[f] for f in item['features']},
        'sources': {s: source_snapshot(root, s, catalog) for s in item['sources']},
        'cameras': digest({s: poses.get(s) for s in item['sources'] if s in poses}),
    }


def review_errors(root, item, catalog, inventory, standard, features):
    """Only a current independently reviewed packet can close a tracked discrepancy."""
    errors = []
    review = item.get('review') or {}
    if not item.get('features'):
        errors.append('declare the affected feature IDs before closure')
    author, reviewer = str(review.get('author') or '').strip().casefold(), str(review.get('reviewer') or '').strip().casefold()
    if not author or not reviewer or author == reviewer:
        errors.append('a different reviewer must inspect the actual sources and comparisons')
    if not review.get('date') or review.get('decision') != 'accepted' or not review.get('notes'):
        errors.append('review needs date, accepted decision and notes')
    if review.get('packetDigest') != review_digest(review):
        errors.append('review packet digest missing or changed; independent reviewer must attest this exact packet')
    if set(review.get('sourcesInspected', [])) != set(item['sources']):
        errors.append('review must inspect every declared source at full size')
    try:
        if review.get('snapshot') != snapshot(root, item, catalog, inventory, standard):
            errors.append('acceptance snapshot missing or stale; re-render and re-review')
    except (KeyError, ValueError) as exc:
        errors.append(str(exc))
    for kind in ('render', 'comparison', 'overlay'):
        artifact = review.get(kind) or {}
        try:
            path = safe_file(root, artifact.get('path'))
            if file_hash(path) != artifact.get('sha256'):
                errors.append(f'{kind} artifact hash differs')
            if kind == 'render':
                from PIL import Image
                with Image.open(path) as image:
                    if image.width < 320 or image.height < 200:
                        errors.append('render must be at least 320 x 200')
        except (ValueError, OSError) as exc:
            errors.append(f'{kind}: {exc}')
    if item['kind'] in ('placement', 'completeness'):
        poses = read(root, 'data/photo_poses.json', {'photos': {}})['photos']
        solved = [s for s in item['sources'] if poses.get(s, {}).get('solved')]
        if not (len(solved) >= 2 or solved and 'map:ground' in item['sources']):
            errors.append('placement requires two solved photo cameras, or one solved camera plus the aerial')
        for fid in item['features']:
            placement = features.get(fid, {}).get('placement', {})
            if placement.get('status') != 'verified':
                errors.append(f'{fid}: current placement approval is required')
            if not placement.get('reviewIds'):
                errors.append(f'{fid}: no placement review IDs')
        # Existing policy can allow a larger declared tolerance. That does not pass this standard.
        reviews = read(root, 'data/placement_reviews.json', {'reviews': []})['reviews']
        for fid in item['features']:
            ids = features.get(fid, {}).get('placement', {}).get('reviewIds', [])
            if not any(r['id'] in ids and 0 < r.get('toleranceM', math.inf) <= standard['placementRmsM'] for r in reviews):
                errors.append(f'{fid}: placement tolerance exceeds {standard["placementRmsM"]} m or is absent')
    if item['kind'] in ('appearance', 'completeness'):
        checks = review.get('checklist', {})
        if any(checks.get(k) is not True for k in standard['appearanceChecklist']):
            errors.append('all appearance checklist items must pass in Inspect Details')
    if item['kind'] == 'height':
        measurement = review.get('measurement', {})
        values = [measurement.get(k) for k in ('rmsM', 'uncertaintyM', 'toleranceM')]
        if not all(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) and v >= 0 for v in values):
            errors.append('height review needs finite nonnegative rmsM, uncertaintyM and toleranceM')
        elif values[2] <= 0 or values[0] + values[1] > values[2]:
            errors.append('height error plus uncertainty exceeds its stated tolerance')
        if not measurement.get('basis') or not measurement.get('heldOut'):
            errors.append('height tolerance needs a source-backed basis and held-out measurements')
    return errors


def ref_id(source):
    return source if source.startswith(('ref:', 'map:')) else 'ref:' + source


def extend(root, spec, catalog, features, queue, inventory, nodes, edges, problems, photo_states):
    standard = read(root, 'data/acceptance_standard.json')
    items = read(root, 'data/discrepancies.json', {'discrepancies': []})['discrepancies']
    requests = read(root, 'data/evidence_requests.json', {'requests': []})['requests']
    by_source = {e['id']: e for e in catalog}
    by_feature = {f['id']: f for f in features}
    by_task = {t['id']: t for t in queue}
    areas = {a['id'] for a in spec['areas']}
    photos = {r['id']: r for r in photo_states}
    # Include existing photo spots everywhere without duplicating explicitly linked requests.
    linked_photo_ids = {r.get('photoRequest') for r in requests}
    requests = list(requests) + [
        {'id': 'photo-' + r['id'], 'area': r['area'], 'kind': 'photo', 'ask': r['ask'],
         'why': r['why'], 'photoRequest': r['id'], 'status': 'open', 'sources': [], 'features': [], 'tasks': []}
        for r in photo_states if r['id'] not in linked_photo_ids]
    poses = read(root, 'data/photo_poses.json', {'photos': {}})['photos']
    if not standard or standard.get('placementRmsM') != 0.3 or not standard.get('appearanceChecklist'):
        problems.append('model loop: missing acceptance standard or changed approved placement threshold')
        return {}
    nodes.append({**standard, 'id': 'standard:' + standard['id'], 'kind': 'acceptance-standard'})
    request_rows = []
    for r in requests:
        rid = 'evidence-request:' + r['id']
        if r.get('area') not in areas or r.get('kind') not in ('photo', 'map', 'measurement') or not r.get('ask') or not r.get('why'):
            problems.append(f'{rid}: needs known area, kind, ask and why')
        if r.get('status') not in ('open', 'received', 'answered'):
            problems.append(f'{rid}: invalid status')
        for source in r.get('sources', []):
            if source not in by_source and source != 'map:ground':
                problems.append(f'{rid}: unknown source {source}')
        state = r.get('status', 'open')
        linked = photos.get(r.get('photoRequest'))
        if r.get('photoRequest') and not linked:
            problems.append(f'{rid}: unknown photo request')
        if linked:
            state = linked['state']
        elif state == 'answered' and not (r.get('sources') and r.get('reviewer') and r.get('note')):
            problems.append(f'{rid}: answered requires inspected sources, reviewer and note')
            state = 'received'
        row = {**r, 'state': state, 'sources': sorted(set(r.get('sources', [])) | set((linked or {}).get('photos', [])))}
        request_rows.append(row)
        nodes.append({**row, 'id': rid, 'kind': 'evidence-request', 'evidenceKind': r['kind']})
        edges.append({'from': rid, 'to': 'area:' + r['area'], 'relation': 'in-area'})
        if linked:
            edges.append({'from': rid, 'to': 'photo-request:' + linked['id'], 'relation': 'requests-photo'})
        for f in r.get('features', []):
            edges.append({'from': rid, 'to': 'model:' + f, 'relation': 'needed-for'})
        for t in r.get('tasks', []):
            edges.append({'from': rid, 'to': 'task:' + t, 'relation': 'unblocks'})
        for source in row['sources']:
            edges.append({'from': ref_id(source), 'to': rid, 'relation': 'supplies-evidence'})
    by_request = {r['id']: r for r in request_rows}
    rows = []
    for item in items:
        iid = 'discrepancy:' + item['id']
        if item.get('area') not in areas or item.get('kind') not in KINDS or not item.get('description') or not item.get('sources'):
            problems.append(f'{iid}: needs known area, kind, description and sources')
        if item.get('status') not in ('open', 'fixed', 'closed'):
            problems.append(f'{iid}: invalid status')
        for source in item.get('sources', []):
            if source not in by_source and source != 'map:ground':
                problems.append(f'{iid}: unknown source {source}')
        for request in item.get('requests', []):
            if request not in by_request:
                problems.append(f'{iid}: unknown evidence request {request}')
        blocked = [r for r in item.get('requests', []) if r in by_request and by_request[r]['state'] != 'answered']
        missing = [s for s in item['sources'] if s in by_source and not (root.parent / by_source[s]['path'] if s.startswith('ref:') else root / by_source[s]['path']).is_file()]
        state = 'needs-evidence' if blocked else 'needs-source-access' if missing else 'ready'
        reasons = [by_request[r]['ask'] for r in blocked] + [f'Open the existing source: {s}' for s in missing]
        if item.get('status') in ('fixed', 'closed'):
            failures = review_errors(root, item, by_source, inventory, standard, by_feature)
            state = 'awaiting-review' if failures else 'accepted'
            reasons += failures
            if blocked:
                state = 'needs-evidence'
            if item['status'] == 'closed' and state != 'accepted':
                problems.append(f'{iid}: cannot close: ' + '; '.join(reasons))
        row = {**item, 'state': state, 'blockers': reasons}
        rows.append(row)
        nodes.append({**row, 'id': iid, 'kind': 'model-discrepancy', 'discrepancyKind': item['kind']})
        edges += [{'from': iid, 'to': 'area:' + item['area'], 'relation': 'in-area'},
                  {'from': iid, 'to': 'standard:' + standard['id'], 'relation': 'judged-against'},
                  {'from': iid, 'to': 'task:' + item['task'], 'relation': 'follow-up'}]
        edges += [{'from': iid, 'to': ref_id(s), 'relation': 'observed-in'} for s in item['sources']]
        edges += [{'from': 'model:' + f, 'to': iid, 'relation': 'has-discrepancy'} for f in item['features']]
        edges += [{'from': iid, 'to': 'evidence-request:' + r, 'relation': 'needs-evidence'} for r in item.get('requests', [])]
        for review in item.get('reviewHistory', []) + ([item['review']] if item.get('review') else []):
            review_id = 'loop-review:' + item['id'] + ':' + digest(review)[:16]
            if not any(n['id'] == review_id for n in nodes):
                nodes.append({'id': review_id, 'kind': 'loop-review', 'scope': item['kind'], 'packet': review})
            edges.append({'from': iid, 'to': review_id, 'relation': 'reviewed-by'})
            if state == 'accepted' and review == item.get('review'):
                edges.append({'from': iid, 'to': review_id, 'relation': 'accepted-by', 'scope': 'this tracked discrepancy only'})
    reports = []
    for area in spec['areas']:
        aid = area['id']
        here = [i for i in rows if aid == 'whole-resort' or i['area'] == aid]
        asks = [r for r in request_rows if r['state'] != 'answered' and (aid == 'whole-resort' or r['area'] == aid)]
        cameras = [{'photo': e['id'], 'state': 'solved' if poses.get(e['id'], {}).get('solved') else 'needs-solving',
                    'station': poses.get(e['id'], {}).get('station')} for e in catalog
                   if e['kind'] in PHOTO_KINDS and (aid == 'whole-resort' or aid in e['shows'])]
        ready, waiting = [], []
        for t in queue:
            if t.get('status') != 'open' or (aid != 'whole-resort' and t['area'] != aid):
                continue
            deps = [d for d in t.get('dependsOn', []) if by_task.get(d, {}).get('status') != 'done']
            # Only explicitly scoped task requests block a whole task. A feature gap never freezes an area.
            needs = [r['id'] for r in asks if t['id'] in r.get('tasks', [])]
            entry = {'id': t['id'], 'title': t['title'], 'priority': t['priority'], 'dependencies': deps, 'requests': needs}
            (waiting if deps or needs else ready).append(entry)
        reports.append({'id': aid, 'name': area['name'], 'counts': {s: sum(i['state'] == s for i in here) for s in
                       ('ready', 'needs-evidence', 'needs-source-access', 'awaiting-review', 'accepted')},
                        'discrepancies': here, 'requests': asks, 'cameras': cameras,
                        'readyTasks': sorted(ready, key=lambda t: (t['priority'], t['id'])), 'waitingTasks': waiting})
    report = {'standard': standard['id'], 'scope': standard['scope'], 'areas': reports}
    (root / 'public/photo-loop.json').write_text(json.dumps(report, indent=1, ensure_ascii=False) + '\n')
    lines = ['# Continuous model loop', '', '_Generated by `scripts/build_references.py`._', '', standard['scope'], '',
             'Run `python3 scripts/photo_loop.py --area north-pool`. Missing evidence blocks its declared scope only. '
             'A camera needing solving is processing work, not automatically a request for another photograph.', '']
    for area in reports:
        lines += [f'## {area["name"]}', '', ', '.join(f'{k}: {v}' for k, v in area['counts'].items()), '']
        lines += [f'- **{i["state"]}** `{i["id"]}`: {i["description"]}' for i in area['discrepancies']]
        lines += [f'- **{r["kind"]} {r["state"]}** `{r["id"]}`: {r["ask"]} Why: {r["why"]}' for r in area['requests']]
        lines += [f'- Ready task: `{t["id"]}` — {t["title"]}' for t in area['readyTasks']]
        lines += ['']
    (root / 'refs/LOOP.md').write_text('\n'.join(lines))
    return report
