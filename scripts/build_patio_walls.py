#!/usr/bin/env python3
"""Reproducible wall-marking inventory. Does not author physical geometry."""
import argparse
import json
import math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def load(path):
    return json.loads((ROOT / path).read_text())

# Explicit wall axes in map metres, including adjacent kerbs for comparison.
SOURCES = ['cervantes_patio_walls.json', 'cervantes_north_patios.json',
           'cervantes_east_south_patios.json', 'elena_east_patios.json',
           'elena_north.json', 'lane_walls.json']

def build():
    confidence = load('public/confidence.json')
    lookup = {f['id']: f for f in confidence['features']}
    graph = {n['featureId']: n for n in load('refs/graph.json')['nodes'] if n.get('featureId')}
    poses = load('data/photo_poses.json')['photos']
    levels = load('data/levels_survey.json')['items']
    rows = []
    for filename in SOURCES:
        data = load('data/' + filename)
        for wall in data['walls']:
            if wall.get('retired'): continue
            fid = filename + ':' + wall['id']
            info = lookup.get(fid, {})
            points = wall['points']
            height = wall['height']
            length = sum(math.dist(a, b) for a, b in zip(points, points[1:]))
            photos = wall.get('evidence', [])
            areas = info.get('areas', [])
            # Preserve each opening; totals are gross, not a net material take-off.
            doors = wall.get('doors', [])
            if data.get('door') and len(data['walls']) == 1:
                doors = doors + [data['door']]
            rows.append(dict(id=fid, name=wall['name'], kind='wall' if height > .3 else 'kerb',
                points=points, areas=areas, heightM=height, thicknessM=wall['thickness'],
                lengthM=round(length, 2), grossFaceM2=round(length * height, 2),
                openings=doors, routeOpenings=data.get('openings', []), evidence=photos, confidence=info.get('level', 'estimated'),
                basis=wall.get('trust', wall.get('basis', data.get('trust', ''))),
                placement=graph.get(fid, {}).get('verification', 'unreviewed'),
                solvedCameras=[p for p in photos if poses.get(p, {}).get('solved')],
                levelState='Unresolved wall-top datum; model height is not a surveyed elevation.',
                levelRefs=[dict(id=l['id'], rise=l.get('rise'), confidence=l.get('confidence'),
                               from_=l.get('from'), model=l.get('model'), photos=l.get('photos', []))
                           for l in levels if l.get('area') in areas and ('patio' in json.dumps(l).lower() or 'terrace' in json.dumps(l).lower())]))
    # Remaining wall/patio groups may use station coordinates, composite rings or
    # suppression boxes. Show context, never pretend these are traced wall axes.
    imported = {r['id'] for r in rows}
    for f in confidence['features']:
        if f['id'] in imported or f['id'].split(':')[0] in SOURCES: continue
        if f['id'].split(':')[0] in {'elena_junction_details.json', 'elena_north_corner_details.json', 'door_sills.json'}: continue
        if f['id'].startswith('north_pool_frontages.json:') and 'gate' not in f['id']: continue
        if f['id'] in {'main_pool_lawn.json:enrique-shop-front', 'elena_walkway.json:elena-walkway-wall-details'}: continue
        if '.json:' not in f['id'] or not any(t in (f['id']+' '+f['name']).lower() for t in ['wall', 'patio', 'terrace', 'partition']): continue
        rows.append(dict(id=f['id'], name=f['name'], kind='context',
                         points=f.get('ring', f.get('points', [])), closed='ring' in f,
                         areas=f.get('areas', []), evidence=f.get('evidence', []),
                         confidence=f['level'], placement=graph.get(f['id'], {}).get('verification', 'unreviewed'),
                         basis='Model group context, not a traced wall axis or quantity. '+f['why'],
                         levelState='Resolve individual wall runs, openings, floor and wall-top datums from this group before estimating.'))
    for b in load('public/map/skeleton.json')['buildings']:
        if b['floors'] != 0 or b.get('notStanding'): continue
        fid = 'building:' + b['id']
        rows.append(dict(id=fid, name='Untraced enclosure ' + b['id'], kind='enclosure',
                         points=b['ring'], areas=lookup.get(fid, {}).get('areas', []),
                         evidence=[], confidence='registry', placement='unreviewed',
                         basis='Registry zero-storey outline only. Each edge may be wall, building face, opening or no boundary. Do not extrude this polygon into walls.',
                         levelState='Floor and wall-top datums unresolved.'))
    for gap in confidence['gaps']:
        if not any(t in (gap['name']+' '+gap['why']).lower() for t in ['patio','wall','partition']): continue
        rows.append(dict(id=gap['id'], name=gap['name'], kind='gap', points=[gap['at']] if gap.get('at') else [],
                         areas=[], evidence=gap.get('photos', []), confidence='gap', placement='unreviewed',
                         basis=gap['why'], levelState='Evidence required before tracing or levelling.'))
    # Some legacy gap entries share an ID; retain both notes under one marker.
    unique = {}
    for row in rows:
        if row['id'] in unique:
            previous = unique[row['id']]
            previous['basis'] += ' ' + row['basis']
            previous['evidence'] = sorted(set(previous['evidence'] + row['evidence']))
        else: unique[row['id']] = row
    rows = list(unique.values())
    return dict(version=1, scope='Existing explicit patio/garden wall axes in six source files, all standing zero-storey registry enclosures, and wall-related recorded gaps. Other renderer-specific retaining walls, planter rims and generated filler are not patio-wall traces. Other wall/patio/terrace model groups are included as context only, without wall quantities. Physical resort-wide wall survey remains incomplete.',
                totals={k:sum(r['kind']==k for r in rows) for k in ['wall','kerb','enclosure','gap','context']}, records=rows)

if __name__ == '__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check', action='store_true');args=parser.parse_args()
    out=ROOT/'public/patio-walls.json';text=json.dumps(build(), ensure_ascii=False, indent=2)+'\n'
    if args.check:
        assert out.exists() and out.read_text()==text, 'Patio inventory stale: run python3 scripts/build_patio_walls.py'
    else: out.write_text(text)
    print('Patio wall inventory', build()['totals'])
