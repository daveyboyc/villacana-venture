#!/usr/bin/env python3
"""A scorecard per area of data/areas.json: what has been measured and what has not.

  python3 scripts/build_scorecard.py measure    survey and scene measures per area
  python3 scripts/build_scorecard.py            write public/scorecard.json and refs/SCORECARD.md
  python3 scripts/build_scorecard.py --check    fail if either is stale

`measure` needs the survey tiles (`python3 scripts/lidar_check.py fetch`) and the scene as built
(`node scripts/shoot_views.cjs --model --kit`); it writes docs/reviews/area-scorecard/measures.json,
which is committed. Building the scorecard needs only the repository, so scripts/build_references.py
rewrites it on every run. It combines those measures with docs/reviews/lidar-levels/measurements.json,
the reference index, data/photo_poses.json, data/facade_kit.json, the build queue and the evidence
graph (refs/graph.json). Each figure is a count or a measurement; nothing is scored out of 100.
The game shows the card for the area under the player (src/scorecard.ts). See docs/SCORECARD.md.
"""
import argparse
import hashlib
import json
import math
import subprocess
import sys
from datetime import date
from pathlib import Path

import area_map

ROOT = Path(__file__).resolve().parents[1]
MEASURES = ROOT / 'docs/reviews/area-scorecard/measures.json'
OUT = ROOT / 'public/scorecard.json'
TABLE = ROOT / 'refs/SCORECARD.md'
BRIEF = 'https://github.com/daveyboyc/villacana-venture/blob/main/refs/areas/{}.md'
# A solved camera holds when the solve places it to within this many metres east and south (one
# sigma) and a held-out check measures the model through it. The Elena roof solves miss this.
HOLDS_M = 1.0
PHOTO_KINDS = ('phone-photo', 'own-photo', 'web-photo')
# Below this correlation the footprints and the surveyed roofs barely agree, so a best shift means nothing.
FITS = 0.2


def load(path):
    return json.loads((ROOT / path).read_text())


def grid_digest(grid):
    return hashlib.sha256(json.dumps(grid, sort_keys=True).encode()).hexdigest()[:16]


def measure():
    """Ground, footprints and the facade kit per area, from the survey tiles and the exported scene."""
    import numpy as np
    from lidar_check import MODEL, Survey, contains, to_utm
    kit_path = ROOT / 'layout-checks.local/kit.json'
    if not MODEL.exists() or not kit_path.exists():
        raise SystemExit('run node scripts/shoot_views.cjs --model --kit first')
    model, kit = json.loads(MODEL.read_text()), json.loads(kit_path.read_text())
    skeleton = load('public/map/skeleton.json')
    area_of = area_map.classifier(skeleton)
    grid = area_map.grid(skeleton, area_of=area_of)
    ids = grid['areas']
    convert = to_utm()
    ground, surface, ground15 = (Survey(name, convert) for name in ('mdt2021', 'mds2015', 'mdt2015'))
    pools = {p['id']: p for p in model['pools']}
    datum = float(np.median(ground.inside([(x, z) for x, _, z in pools['middle']['ring']], 4.0)))

    # Open ground within 15 m of a house, as scripts/lidar_check.py measures it for the whole resort.
    g = model['ground']
    gx, gz = np.meshgrid(g['x0'] + np.arange(g['nx']) * g['step'], g['z0'] + np.arange(g['nz']) * g['step'])
    points = np.c_[gx.ravel(), gz.ravel()]
    miss = np.array(g['heights'], float) - (ground.at(gx, gz).ravel() - datum)
    covered, near = np.zeros(len(points), bool), np.zeros(len(points), bool)
    for shape in [b['ring'] for b in model['buildings']] + [[(x, z) for x, _, z in p['ring']] for p in model['pools']]:
        covered |= contains(shape, points, 0.5)
    for b in model['buildings']:
        near |= contains(b['ring'], points, 15.0)
    keep = np.isfinite(miss) & ~covered & near
    cell_area = np.array([area_of(x, z) for x, z in points[keep]], object)
    misses = miss[keep]

    def ground_stats(values):
        if not len(values):
            return None
        return {'cells': int(len(values)), 'medianMiss': round(float(np.median(values)), 2),
                'within25cm': round(float((np.abs(values) < 0.25).mean()), 2), 'over50cm': round(float((np.abs(values) > 0.5).mean()), 2)}

    houses = [b for b in model['buildings'] if b['floors'] > 0 and not b['passage']]

    def plan_fit(group):
        """Shift of these footprints that best fits the surveyed roofs, by correlation, and how much
        of each footprint (1 m in from its edge) stands on surveyed roof at least 2 m up."""
        if len(group) < 2:
            return {'houses': len(group)}
        rings = np.concatenate([np.array(b['ring']) for b in group])
        x, z = np.meshgrid(np.arange(rings[:, 0].min() - 6, rings[:, 0].max() + 6, 0.5), np.arange(rings[:, 1].min() - 6, rings[:, 1].max() + 6, 0.5))
        pts = np.c_[x.ravel(), z.ravel()]
        local, mask, core = np.zeros(len(pts), bool), np.zeros(len(pts), bool), np.zeros(len(pts), bool)
        for b in group:
            local |= contains(b['ring'], pts, 6.0)
            mask |= contains(b['ring'], pts)
            core |= contains(b['ring'], pts, -1.0)
        pts, mask, core = pts[local], mask[local].astype(float), core[local]
        mask -= mask.mean()

        def fit(dx, dz):
            h = np.clip(np.nan_to_num(surface.at(pts[:, 0] + dx, pts[:, 1] + dz) - ground15.at(pts[:, 0] + dx, pts[:, 1] + dz)), 0, 8)
            h -= h.mean()
            return float(mask @ h / math.sqrt((mask @ mask) * (h @ h)))
        coarse = max((fit(dx, dz), dx, dz) for dx in np.arange(-3, 3.01, 0.5) for dz in np.arange(-3, 3.01, 0.5))
        best = max((fit(dx, dz), dx, dz) for dx in np.arange(coarse[1] - 0.5, coarse[1] + 0.51, 0.25) for dz in np.arange(coarse[2] - 0.5, coarse[2] + 0.51, 0.25))
        roof = surface.at(pts[core, 0], pts[core, 1]) - ground15.at(pts[core, 0], pts[core, 1])
        return {'houses': len(group), 'east': round(float(best[1]), 2), 'south': round(float(best[2]), 2),
                'fit': round(best[0], 3), 'fitUnshifted': round(fit(0, 0), 3),
                'onRoof': round(float((np.nan_to_num(roof) >= 2).mean()), 2)}

    # A house counts toward the footprint fit of every area one of its corners falls in.
    touches = {b['id']: {area_of(x, z) for x, z in b['ring']} | {area_of.houses.get(b['id'])} for b in houses}
    kit_area = [(p, area_of(p['x'], p['z'])) for p in kit]
    areas = {}
    for id in ids + [None]:
        mine = (lambda a: True) if id is None else (lambda a, id=id: a == id)
        parts = [p for p, a in kit_area if mine(a)]
        areas[id or 'whole-resort'] = {
            'ground': ground_stats(misses[np.array([mine(a) for a in cell_area], bool)] if len(misses) else misses),
            'plan': plan_fit([b for b in houses if any(mine(a) for a in touches[b['id']] if a)] if id else houses),
            'kit': {'traced': sum(p['traced'] for p in parts), 'generated': sum(not p['traced'] for p in parts)},
        }
        print(id or 'whole-resort', json.dumps(areas[id or 'whole-resort']))
    commit = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    MEASURES.parent.mkdir(parents=True, exist_ok=True)
    MEASURES.write_text(json.dumps({
        'about': 'Written by python3 scripts/build_scorecard.py measure. ground: model minus 2020-21 survey on a 2 m grid of open '
                 'ground within 15 m of a house. plan: footprint shift (metres east, south) that best fits the 2014-15 surveyed roofs, '
                 'its correlation, and the share of footprint (1 m in from the edge) on surveyed roof at least 2 m up. kit: facade kit '
                 'parts as placed in the Details view, traced from photos (data/facade_kit.json) or generated.',
        'measuredAt': date.today().isoformat(), 'commit': commit, 'areaGrid': grid_digest(grid), 'areas': areas},
        indent=1, ensure_ascii=False) + '\n')
    print(MEASURES.relative_to(ROOT))


def pct(share):
    return f'{round(share * 100)}%'


def build():
    skeleton = load('public/map/skeleton.json')
    spec = load('data/areas.json')
    area_of = area_map.classifier(skeleton)
    grid = area_map.grid(skeleton, area_of=area_of)
    measures = json.loads(MEASURES.read_text()) if MEASURES.exists() else {'areas': {}}
    stale = measures.get('areaGrid') != grid_digest(grid)
    survey = load('docs/reviews/lidar-levels/measurements.json')
    levels = load('data/levels_survey.json')['items']
    index = load('public/reference-index.json')['references']
    catalog = {e['id']: e for e in load('refs/catalog.json')}
    poses = load('data/photo_poses.json')['photos']
    checks = load('data/photo_checks.json')['checks']
    queue = load('data/build_queue.json')['tasks']
    graph = load('refs/graph.json')
    confidence = load('public/confidence.json')
    match = {a['id']: a.get('match', {}) for a in spec['areas']}
    whole = 'whole-resort'
    within = lambda a, id: id == whole or a == id

    # Street survey lines belong to the areas that list the street (matched by their first point).
    road_at = {tuple(round(v, 1) for v in r['points'][0]) + tuple(round(v, 1) for v in r['points'][-1]): r['id']
               for r in skeleton['boundaryReference']['roads']}
    streets = [(road_at.get(tuple(s['from']) + tuple(s['to'])), s) for s in survey['streets']]
    house_area = area_of.houses
    roofs = [(house_area.get(r['id']), r) for r in survey['roofs']['buildings']]
    in_area = {}
    for e in graph['edges']:
        if e['relation'] == 'in-area' and e['from'].startswith('model:'):
            in_area.setdefault(e['from'], set()).add(e['to'][5:])
    features = [n for n in graph['nodes'] if n['kind'] == 'model-feature']
    discrepancies = [n for n in graph['nodes'] if n['kind'] == 'placement-discrepancy' and n.get('status') != 'resolved']

    # Solved cameras, grouped by station: a station solves one position for all its photos.
    groups = {}
    for name, p in poses.items():
        if p.get('solved'):
            groups.setdefault(p.get('station') or name, []).append(name)

    def holds(group):
        s = [poses[n]['solved'] for n in group]
        return all(max(x['sigma']['x'], x['sigma']['z']) <= HOLDS_M for x in s) and any(x.get('rmsCheckM') is not None for x in s)

    cards = []
    for a in spec['areas']:
        id = a['id']
        m = measures['areas'].get(id) or {}
        card = {'id': id, 'name': a['name'], 'brief': BRIEF.format(id)}

        # Plan: registry footprints against the surveyed roofs.
        card['plan'] = m.get('plan')

        # Levels: open ground, streets, pool decks, photo-read steps and roofs, against the survey.
        lines = [s for road, s in streets if id == whole or road in match[id].get('streets', [])]
        worst = max(lines, key=lambda s: s['worstMiss'], default=None)
        pools = [p for p in survey['pools'] if id == whole or p['pool'] in match[id].get('pools', [])]
        steps = [s for s in survey['levelsSurvey'] if within(next((i['area'] for i in levels if i['id'] == s['id']), None), id)]
        roof = sorted(round(r['model'] - r['roofMedian'], 2) for area, r in roofs if within(area, id))
        card['levels'] = {
            'ground': m.get('ground'),
            'streets': {'measured': len(lines), 'worstMiss': worst['worstMiss'], 'worstStreet': worst['street']} if worst else None,
            'poolDecks': [{'pool': p['pool'], 'miss': round(p['model'] - p['survey'], 2)} for p in pools],
            'photoSteps': {'measured': len(steps), 'outside': sum(s['outsideBy'] > 0 for s in steps)} if steps else None,
            'roofs': {'measured': len(roof), 'medianMiss': roof[len(roof) // 2], 'offOver1m': sum(abs(r) > 1 for r in roof)} if roof else None,
        }

        # Photos: catalogued, placed on the map, compared with renders, cameras solved and whether they hold.
        photos = [r for r in index if id in r['areas'] and r['kind'] in PHOTO_KINDS] if id != whole else [r for r in index if r['kind'] in PHOTO_KINDS]
        names = {r['id'] for r in photos}
        mine = [c for c in checks if c.get('photo') in names]
        solved = {g: ns for g, ns in groups.items() if any(n in names for n in ns)}
        card['photos'] = {
            'count': len(photos),
            'tagged': sum(catalog.get(r['id'], {}).get('areasBasis') == 'reviewed' for r in photos),
            'placed': sum(bool(r.get('camera')) for r in photos),
            'checks': {k: sum(c.get('result') == k for c in mine) for k in ('matches', 'differs', 'not-comparable')},
            'camerasSolved': sum(n in names for ns in solved.values() for n in ns),
            'stationsHolding': sorted(g for g, ns in solved.items() if holds(ns)),
            'stationsFailing': sorted(g for g, ns in solved.items() if not holds(ns)),
            'heldOutMisfitM': sorted(poses[n]['solved']['rmsCheckM'] for ns in solved.values() for n in ns
                                     if n in names and poses[n]['solved'].get('rmsCheckM') is not None),
        }

        # Facades: kit parts traced from photos against those generated, as placed in the Details view.
        card['facades'] = m.get('kit')

        # Evidence: placement state, open discrepancies, open tasks.
        here = [f for f in features if id == whole or id in in_area.get(f['id'], ())]
        ids_here = {f['featureId'] for f in here}
        tasks = [t for t in queue if t.get('status') != 'done' and (id == whole or t['area'] == id)]
        card['placement'] = {'features': len(here), 'verified': sum(f['verification'] == 'verified' for f in here),
                             'disputed': sum(f['verification'] == 'disputed' for f in here)}
        card['discrepancies'] = [{'id': d['id'].split(':', 1)[1], 'feature': d['feature']} for d in discrepancies if d['feature'] in ids_here]
        card['tasks'] = {'open': sum(t['status'] == 'open' for t in tasks), 'inProgress': sum(t['status'] == 'in-progress' for t in tasks),
                         'titles': [t['title'] for t in sorted(tasks, key=lambda t: t['priority'])[:3]]}
        # How sure: each feature's level from public/confidence.json (docs/CONFIDENCE.md), and known gaps.
        sure = [f for f in confidence['features'] if id == whole or id in f['areas']]
        card['confidence'] = {l: sum(f['level'] == l for f in sure) for l in ('photographed', 'estimated', 'inferred', 'registry')}
        card['confidence']['gaps'] = sum(1 for g in confidence['gaps'] if id == whole or area_of(*g['at']) == id)
        card['status'] = status(card)
        cards.append(card)
    return {'about': 'Generated by scripts/build_scorecard.py from the repository; survey and scene measures from '
                     'docs/reviews/area-scorecard/measures.json. See docs/SCORECARD.md for what each figure means.',
            'measuredAt': measures.get('measuredAt'), 'measuredCommit': measures.get('commit'),
            'measuresStale': stale, 'holdsWithinM': HOLDS_M, 'grid': grid, 'areas': cards}


def status(card):
    """Plain sentences from the figures: what agrees with the survey and photos, and what is open."""
    out = []
    lv, g = card['levels'], card['levels']['ground']
    street = lv['streets']
    if g:
        text = f"Ground: {pct(g['within25cm'])} of open ground within 0.25 m of the laser survey"
        out.append(text + (f"; streets within {street['worstMiss']:.2f} m." if street else '.'))
    elif street:
        out.append(f"Streets within {street['worstMiss']:.2f} m of the laser survey; open ground not measured.")
    else:
        out.append('Levels not measured against the laser survey.')
    plan = card['plan']
    if plan and 'fit' in plan:
        shift = math.hypot(plan['east'], plan['south'])
        text = f"Footprints: {pct(plan['onRoof'])} stand on surveyed roof"
        if plan['fit'] < FITS:
            out.append(text + '; they barely correlate with the surveyed roofs, so no shift is measured.')
        else:
            out.append(text + f"; best fit moves them {shift:.1f} m" + (' (within the survey grid).' if shift <= 1 else '.'))
    elif plan:
        out.append('Footprints: the houses here count with the neighbouring lanes.' if not plan['houses'] else
                   'Footprints: one house, too few to fit against the survey.')
    else:
        out.append('Footprints not measured against the survey.')
    ph = card['photos']
    holding = len(ph['stationsHolding'])
    out.append(f"Photos: {ph['count']}, {ph['placed']} placed; "
               + (f"{ph['camerasSolved']} cameras solved, " + (f"{holding} station{'s' if holding != 1 else ''} holding." if holding else 'none holding.')
                  if ph['camerasSolved'] else 'no camera solved.'))
    kit = card['facades']
    if kit and kit['traced'] + kit['generated']:
        out.append(f"Facades: {kit['traced']} of {kit['traced'] + kit['generated']} kit parts traced from photos.")
    c = card['confidence']
    if any(c.values()):
        out.append(f"How sure: {c['photographed']} photographed, {c['estimated']} estimated, {c['inferred']} inferred"
                   + (f", {c['gaps']} known gap{'s' if c['gaps'] != 1 else ''}." if c['gaps'] else '.'))
    pl = card['placement']
    if not pl['features']:
        out.append('Placement: no model features registered here yet.')
        return out
    out.append(f"Placement: {pl['verified']} of {pl['features']} features verified"
               + (f", {len(card['discrepancies'])} open discrepanc{'y' if len(card['discrepancies']) == 1 else 'ies'}." if card['discrepancies'] else '.'))
    return out


def text(card):
    return json.dumps(card, indent=1, ensure_ascii=False) + '\n'


def table(card):
    """refs/SCORECARD.md: every area's figures side by side."""
    def cell(c):
        lv, ph, kit, plan = c['levels'], c['photos'], c['facades'], c['plan']
        g = lv['ground']
        return [f"[{c['name']}](areas/{c['id']}.md)",
                f"{pct(g['within25cm'])} ({g['cells']})" if g else 'not measured',
                f"{lv['streets']['worstMiss']:.2f} m" if lv['streets'] else '–',
                ', '.join(f"{p['pool']} {p['miss']:+.2f} m" for p in lv['poolDecks']) or '–',
                (f"{pct(plan['onRoof'])}, " + (f"shift {plan['east']:+.2f} E {plan['south']:+.2f} S" if plan['fit'] >= FITS else 'no fit'))
                if plan and 'fit' in plan else 'not measured',
                f"{ph['count']} / {ph['placed']}",
                f"{ph['camerasSolved']}" + (f" ({', '.join(ph['stationsHolding'])} holds)" if ph['stationsHolding'] else ''),
                ', '.join(f'{m:.2f}' for m in ph['heldOutMisfitM']) or '–',
                f"{kit['traced']} / {kit['traced'] + kit['generated']}" if kit else 'not measured',
                f"{c['placement']['verified']} / {c['placement']['features']}",
                str(len(c['discrepancies'])), f"{c['tasks']['open']} + {c['tasks']['inProgress']}"]
    head = ['Area', 'Open ground within 0.25 m (cells)', 'Worst street miss', 'Pool decks', 'Footprints on surveyed roof, best shift (m)',
            'Photos / placed', 'Cameras solved', 'Held-out misfit (m)', 'Kit parts traced / all', 'Placement verified / features',
            'Open discrepancies', 'Tasks open + in progress']
    rows = ['| ' + ' | '.join(head) + ' |', '|' + '---|' * len(head)] + ['| ' + ' | '.join(cell(c)) + ' |' for c in card['areas']]
    lines = ['# Area scorecard', '',
             'Generated by `scripts/build_scorecard.py`; what each column means is in [docs/SCORECARD.md](../docs/SCORECARD.md). '
             f"Survey and scene measures from {card['measuredAt']} (commit {card['measuredCommit']})"
             + ('; the area boundaries have changed since, so re-run `build_scorecard.py measure`.' if card['measuresStale'] else '.'),
             '', *rows, '']
    for c in card['areas']:
        lines += [f"## {c['name']}", '', *[f'- {line}' for line in c['status']], '']
    return '\n'.join(lines)


def write():
    card = build()
    OUT.write_text(text(card))
    TABLE.write_text(table(card))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('command', nargs='?', choices=['measure', 'build'], default='build')
    parser.add_argument('--check', action='store_true', help='fail if public/scorecard.json is stale')
    args = parser.parse_args()
    if args.command == 'measure':
        return measure()
    card = build()
    if args.check:
        if not OUT.exists() or OUT.read_text() != text(card) or not TABLE.exists() or TABLE.read_text() != table(card):
            sys.exit('public/scorecard.json or refs/SCORECARD.md is stale: run python3 scripts/build_scorecard.py')
        if card['measuresStale']:
            print('warning: area boundaries changed since the survey measures; run python3 scripts/build_scorecard.py measure')
        return
    OUT.write_text(text(card))
    TABLE.write_text(table(card))
    for c in card['areas']:
        print(f"{c['id']}: " + ' '.join(c['status']))


if __name__ == '__main__':
    main()
