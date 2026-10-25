"""Graph extension for PATH_NETWORK_PRD phase 0. No runtime geometry is authored.

Existing route buffers, content tags and passage trust labels are imported as
context, never promoted to traced edges, source inspection or placement approval.
"""
import hashlib
import json
from pathlib import Path
from path_network_inventory import load_inventories


def read(root, path):
    return json.loads((root / path).read_text())


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()


def extend(root, spec, catalog, features, nodes, edges, problems):
    skeleton = read(root, 'public/map/skeleton.json')
    authored = read(root, 'data/path_network.json')
    records = []
    def add(id, kind, name, **fields):
        row = dict(id=id, kind=kind, name=name, **fields)
        records.append(row)
        return row
    def link(a, b, relation):
        edges.append(dict(from_=a, to=b, relation=relation))
        edges[-1]['from'] = edges[-1].pop('from_')
    def in_areas(row, areas):
        row['areas'] = areas
        for area in areas:
            link(row['id'], 'area:' + area, 'in-area')
    def states(model='absent'):
        return dict(source='uninspected', identity='unresolved', model=model,
                    placement='unreviewed', runtime='unchecked')
    area_ids = {a['id'] for a in spec['areas']}
    model_by_id = {f['id']:f for f in features}
    def model_context(row, ids):
        row['modelContext'] = []
        for id in ids:
            if id not in model_by_id: continue
            f = model_by_id[id]
            row.setdefault('sources', list(f['photos']))
            row['modelContext'].append(dict(id='model:'+id, placement=f['placement'], photoVerification=f['photoVerification']))
            link(row['id'], 'model:'+id, 'represented-by')
    route_areas = {s: [a['id']] for a in spec['areas'] for s in a.get('match', {}).get('streets', [])}
    routes = list(skeleton['boundaryReference']['roads'])
    threshold = read(root, 'data/dali_cervantes_threshold.json')
    routes += [dict(id='dali-shared-footpath', name='Dalí house-side footpath', points=threshold['footpathCentreline'], width=1.3)]
    route_areas['dali-shared-footpath'] = ['dali']
    for route in skeleton['seafront']['paseo']['protect']:
        routes.append(route)
        route_areas[route['id']] = ['paseo']
    for file, key, areas in [('data/coastal_gate.json', 'route', ['dali','paseo']), ('data/barraka_boardwalk.json', 'boardwalk', ['barraka-beach'])]:
        route = read(root, file)[key]
        routes.append(route)
        route_areas[route['id']] = areas
    junctions = {}
    for route in routes:
        rid = 'path-route:' + route['id']
        row = add(rid, 'path-route', route['name'], axis=route['points'],
                  nominalClearanceM=route['width'], physicalWidthM=None,
                  widthBasis='Existing runtime clearance guide; neither physical paving nor measured usable width.',
                  states=states('partial'), access='unknown', levels=None, segments=[],
                  nextAction='Inspect full sources; trace each edge and reconcile cross-route junctions, materials, levels and access.')
        in_areas(row, route_areas.get(route['id'], ['whole-resort']))
        model_context(row, ['street:'+route['id']])
        for i, (a, b) in enumerate(zip(route['points'], route['points'][1:])):
            ends = []
            for p in [a, b]:
                jid = 'path-junction:' + digest(p)[:16]
                ends.append(jid)
                if jid not in junctions:
                    junctions[jid] = add(jid, 'path-junction', 'Imported axis vertex', point=p,
                        connectionState='unresolved', basis='Exact shared runtime coordinate only; crossings and nearby ends are not automatically joined.')
            sid = rid.replace('path-route:', 'path-segment:') + ':' + str(i+1)
            seg = add(sid, 'path-segment', route['name'] + ' · segment ' + str(i+1),
                      axis=[a,b], junctions=ends, states=states('partial'),
                      left={'boundary':None,'unknownIntervals':[[0,1]]},
                      right={'boundary':None,'unknownIntervals':[[0,1]]},
                      intervalUnits='normalised axis fraction', surface=None, floorDatum=None,
                      connectionState='unresolved')
            row['segments'].append(sid)
            link(sid, rid, 'segment-of')
            for jid in ends:
                link(sid, jid, 'ends-at')
    # IDs are intentionally independent of host IDs. Keep aliases; no dedup by proximity/name.
    passages = {p['id']:p for p in read(root, 'data/passages.json')['passages']}
    covered = []
    for t in authored['tunnels']:
        legacy = t.get('legacyPassage')
        old = passages.get(legacy)
        if legacy: covered.append(legacy)
        row = add('path-tunnel:'+t['id'], 'path-tunnel', t['name'],
            aliases=t.get('aliases', []), hostIds=[legacy] if legacy else [],
            sourceGroup=t.get('sourceGroup'), drawing='/reference-packs/entrance/index.html' if t.get('sourceGroup') else None, legacyTrust=old.get('trust') if old else None,
            states=states('partial' if legacy or t['id']=='silvia' else 'absent'),
            access='unknown', portals=[{'id':t['id']+':a','point':None,'connection':None},
                                      {'id':t['id']+':b','point':None,'connection':None}],
            direction=None, coveredLengthM=None, clearWidthM=None, headroomM=None, floorDatum=None,
            components={k: 'unassessed' for k in ['ceiling','sideWalls','recesses','sideDoors','steps','gates','signage','pavingTransitions']},
            sources=t.get('sources', []), location=None,
            nextAction=t['nextAction'], identityNote=t['identityNote'])
        in_areas(row, t['areas'])
        for source in row['sources']:
            link(row['id'], source if source.startswith('ref:') else 'ref:'+source, 'candidate-source')
        model_context(row, ['building:'+legacy] if legacy else ['silvia_tunnel.json:silvia-tunnel-study'] if t['id']=='silvia' else [])
    if sorted(covered) != sorted(passages):
        problems.append('path network: legacy passage census must cover each existing record exactly once')
    # Classify the registry *interpretation*, never assert these outlines are ground walls.
    for b in skeleton['buildings']:
        row = add('path-boundary:registry:'+b['id'], 'path-boundary', b['id'],
            baselineKind='enclosure-or-parcel' if b['floors']==0 else 'ground-or-roof-unresolved',
            physicalKind='unresolved', outline=b['ring'], baselineRevision=digest(b),
            states=states(), heightM=None, thicknessM=None, unknownReturns=True,
            confidence={'existence':'unresolved','location':'unresolved','dimensions':'unresolved'},
            nextAction='Inspect aerial and full photos to distinguish ground wall, roof overhang and enclosure; do not extrude this inventory outline.')
        model_context(row, ['building:'+b['id']])
    # Existing model fragments remain context, not claims of exhaustive boundary tracing.
    for f in features:
        if ':' not in f['id'] or f['id'].startswith(('building:', 'street:', 'pool:', 'area:', 'parking:')): continue
        if not any(word in f['name'].lower() for word in ['wall', 'gate', 'door', 'kerb', 'hedge', 'fence', 'opening']): continue
        row = add('path-fragment:'+f['id'], 'path-model-fragment', f['name'],
            states=states('partial'), sources=f['photos'],
            nextAction='Inspect cited full sources; inventory openings, finite extents and hidden returns. Existing model context does not establish a complete boundary trace.')
        in_areas(row, f['areas'])
        model_context(row, [f['id']])
        for source in f['photos']:
            link(row['id'], source if source.startswith('ref:') else 'ref:'+source, 'cites')
    observed, inspected_accounting, area_inventories = load_inventories(root, authored, catalog, features, problems)
    for area, inventory in area_inventories.items():
        for update in inventory.get('tunnels', []):
            row = next((r for r in records if r['id']=='path-tunnel:'+update['id']), None)
            if not row:
                problems.append('path inventory: unknown tunnel '+update['id']); continue
            row['sourceObservations'] = update
            row['states']['source'] = 'inspected'
            row['states']['identity'] = 'candidate'
            row['identityNote'] = update['identity']
            row['accessObservation'] = update['access']
            row['nextAction'] = update['nextAction']
            row['portals'] = [{'connection':None, **p} for p in update['portals']]
            row['sources'] = sorted(set(row['sources'] + update['sources']))
            row['drawing'] = inventory['drawing']
            for portal in update['portals']:
                if portal.get('observation'):
                    link(row['id'], 'path-observation:'+portal['observation'], 'portal-observed-as')
        for gap in inventory.get('evidenceRequests', []):
            row = add('path-gap:'+gap['id'], 'path-evidence-gap', gap['id'].replace('-', ' '),
                      needed=gap['needed'], nextAction=gap['needed'], states={**states(), 'source':'source needed'})
            in_areas(row, [area])
            if gap.get('followUp'): link(row['id'], 'task:'+gap['followUp'], 'follow-up')
    for row in observed:
        records.append(row)
        for area in row['areas']: link(row['id'], 'area:'+area, 'in-area')
        for source in row['sources']:
            link(row['id'], source if source.startswith(('ref:','map:')) else 'ref:'+source, 'observed-in')
        if row.get('nextTask'): link(row['id'], 'task:'+row['nextTask']['id'], 'follow-up')
        for model in row['modelContext']: link(row['id'], model['id'], 'compared-with')
    source_ids = {e['id'] for e in catalog}
    accounting = {**authored.get('sourceAccounting', {}), **inspected_accounting}
    for source in accounting:
        if source not in source_ids: problems.append('path network: unknown accounted source '+source)
    for e in catalog:
        record = accounting.get(e['id'], {})
        disposition = record.get('disposition', 'not-yet-inspected')
        if disposition not in ['not-yet-inspected','observed','unusable','duplicate']:
            problems.append('path network: invalid source disposition '+e['id'])
        if disposition != 'not-yet-inspected' and not all(record.get(k) for k in ['reason','reviewer','revision']):
            problems.append('path network: inspected source needs reason, reviewer and revision '+e['id'])
        if disposition == 'observed' and not record.get('features'):
            problems.append('path network: observed source needs feature links '+e['id'])
        if disposition == 'duplicate' and record.get('retainedSource') not in source_ids - {e['id']}:
            problems.append('path network: duplicate needs distinct retained source '+e['id'])
        row = add('path-source:'+e['id'], 'path-source-accounting', e['title'], sourceId=e['id'],
            disposition=disposition, inspectionScopes=record.get('areasInspected', []), review=record or None,
            nextAction=('Source inspection recorded for '+', '.join(record.get('areasInspected', []))+'. Follow the linked observations and evidence requests; other area scopes and world placement remain separate.') if disposition!='not-yet-inspected' else 'Inspect full source for path edges, covered connections and openings; content tags alone do not complete this inventory.')
        in_areas(row, e['shows'])
        link(row['id'], e['id'] if e['id'].startswith('ref:') else 'ref:'+e['id'], 'accounts-for')
        for feature in record.get('features', []): link(row['id'], feature, 'observed-feature')
        if disposition == 'duplicate':
            target = record.get('retainedSource', '')
            link(row['id'], target if target.startswith('ref:') else 'ref:'+target, 'duplicate-of')
    for a in spec['areas']:
        sources = [r for r in records if r['kind']=='path-source-accounting' and a['id'] in r.get('areas', [])]
        area_routes = [r['id'] for r in records if r['kind']=='path-route' and a['id'] in r['areas']]
        tunnels = [r['id'] for r in records if r['kind']=='path-tunnel' and a['id'] in r['areas']]
        row = add('path-coverage:'+a['id'], 'path-area-coverage', a['name'],
            states=states(), sourceCoverage=area_inventories.get(a['id'], {}).get('sourceCoverage', 'uninspected' if sources else 'source needed'),
            sourceCount=len(sources), uninspectedSources=sum(a['id'] not in r['inspectionScopes'] for r in sources),
            routes=area_routes, tunnels=tunnels, inventoryComplete=area_inventories.get(a['id'], {}).get('inventoryComplete', False),
            inventory=area_inventories.get(a['id']),
            drawing=area_inventories.get(a['id'], {}).get('drawing'),
            limits=area_inventories.get(a['id'], {}).get('limits', 'Catalogue association only. Full-source feature inventory, additional tunnel search and boundary traces remain outstanding.'),
            nextAction='Obtain opposite-end portal photos, path-edge views and ground/roof anchors.' if sources else 'Request ground views along every lane, both ends of covered connections and an aerial with independent anchors.')
        row['states']['source'] = row['sourceCoverage']
        in_areas(row, [a['id']])
        link(row['id'], 'task:path-network-inventory-'+a['id'], 'follow-up')
    for row in records:
        for area in row.get('areas', []):
            if area not in area_ids: problems.append('path network: unknown area '+area)
    nodes.extend(records)
    totals = dict(areas=len(spec['areas']), inventoryCompleteAreas=sum(r['kind']=='path-area-coverage' and r['inventoryComplete'] for r in records),
        sourceObservations=len(observed), sourcePixelTraces=sum('locator' not in t.get('role','').lower() for r in observed for t in r['traces']),
        sourcePixelLocators=sum('locator' in t.get('role','').lower() for r in observed for t in r['traces']), sources=len(catalog),
        uninspectedSources=sum(r['kind']=='path-source-accounting' and r['disposition']=='not-yet-inspected' for r in records),
        routes=len(routes), segments=sum(r['kind']=='path-segment' for r in records),
        tracedSides=0, tunnelCandidates=len(authored['tunnels']), confirmedUniqueTunnels=None,
        registryOutlines=len(skeleton['buildings']))
    data = dict(version=1, scope='Phase 0 source inventory; full resort survey and world placement remain open.',
        frame=dict(axes='+x east, +z south', units='metres', displayRotationApplied=False),
        inputDigests={name: hashlib.sha256((root/name).read_bytes()).hexdigest() for name in ['data/path_network.json','public/map/skeleton.json','data/passages.json']},
        totals=totals, inventories=area_inventories, records=records)
    (root/'public/path-network.json').write_text(json.dumps(data, indent=1, ensure_ascii=False)+'\n')
    lines = ['# Path network baseline', '', '_Generated from the reference graph inputs. Not a completed survey._', '',
        'Canonical inspector: `/?view=map&network=1`. Source content tags, citations and legacy trust labels do not establish traced edges or placement approval.', '',
        '## Counts', '', *(f'- {k}: {v if v is not None else "unresolved"}' for k,v in totals.items()), '',
        '## Area gaps', '', '| Area | Sources / uninspected | Routes | Tunnel candidates | Coverage |', '| --- | --- | --- | --- | --- |']
    for r in records:
        if r['kind']=='path-area-coverage':
            lines.append(f'| {r["name"]} | {r["sourceCount"]} / {r["uninspectedSources"]} | {len(r["routes"])} | {len(r["tunnels"])} | {r["sourceCoverage"]} |')
    lines += ['', 'Inspection is scoped to its named area; inspecting a shared source for Elena does not complete another area. Source-pixel traces remain separate from registered map edges. Source totals deduplicate IDs globally; area totals overlap. Unknown intervals are not traced sides. Tunnel candidates may overlap; this is not a count of unique real tunnels. All portal positions and physical widths remain unresolved.', '',
        'Registry outlines retain their original rings and hashes; they are not physical wall traces. Route junctions share exact imported coordinates only; intersections, near misses and dead ends need source review. Existing model discrepancies remain in the reference graph.', '',
        '## Next work', '', 'Area inventories and their correction/evidence tasks are listed in QUEUE.md. A reviewed source scope does not close registration or model gaps. Complete source accounting in data/path_network.json only after full-source inspection, linking observations and retaining unusable/duplicate reasons and revisions. Do not infer unseen geometry. See docs/PATH_NETWORK_PRD.md for later tracing, drawing, runtime and release gates.']
    (root/'refs/PATH_NETWORK.md').write_text('\n'.join(lines)+'\n')
    return totals
