#!/usr/bin/env python3
"""Refresh the evidence graph, show actionable work and optionally render/validate an area.

  python3 scripts/photo_loop.py --area north-pool
  python3 scripts/photo_loop.py --area north-pool --render --task loop-discrepancies
  python3 scripts/photo_loop.py --area north-pool --validate
  python3 scripts/photo_loop.py --snapshot north-deck-shape

Agents inspect sources, correct geometry and independently review the results; this command
does not guess image content, approve itself, close tasks or generate geometry from citations.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

from model_loop import read, snapshot, review_digest

ROOT = Path(__file__).resolve().parents[1]


def run(args):
    subprocess.run(args, cwd=ROOT, check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--area', default='north-pool')
    parser.add_argument('--render', action='store_true', help='capture solved public photo cameras with a temporary Vite server')
    parser.add_argument('--task', help='known task for committed comparison renders')
    parser.add_argument('--as', dest='phase', choices=['before', 'after'], default='after')
    parser.add_argument('--validate', action='store_true', help='run evidence tests, production build and Inspect browser checks')
    parser.add_argument('--snapshot', metavar='DISCREPANCY', help='print snapshot template; grants no approval')
    parser.add_argument('--review-digest', type=Path, metavar='PACKET_JSON', help='digest a review object for independent attestation')
    parser.add_argument('--json', action='store_true', help='print the selected area as JSON')
    args = parser.parse_args()
    if args.review_digest:
        print(review_digest(json.loads(args.review_digest.read_text())))
        return
    areas = {a['id'] for a in read(ROOT, 'data/areas.json')['areas']}
    if args.area not in areas:
        parser.error('unknown area: ' + args.area)
    queue = read(ROOT, 'data/build_queue.json')['tasks']
    if args.render and (not args.task or args.task not in {t['id'] for t in queue}):
        parser.error('--render requires --task with an existing queue task ID')
    if args.render and next(t for t in queue if t['id'] == args.task)['area'] not in (args.area, 'whole-resort'):
        parser.error('--task must belong to the selected area or be a whole-resort task')
    # New intake can be present before its sources have been tagged. Report schema errors, but do
    # not let this command treat a broken evidence graph as successful validation.
    result = subprocess.run([sys.executable, 'scripts/build_references.py', '--check'], cwd=ROOT,
                            capture_output=True, text=True)
    if result.returncode:
        print(result.stdout + result.stderr, file=sys.stderr)
        raise SystemExit(result.returncode)
    if args.snapshot:
        item = next((i for i in read(ROOT, 'data/discrepancies.json')['discrepancies'] if i['id'] == args.snapshot), None)
        if not item:
            parser.error('unknown discrepancy: ' + args.snapshot)
        graph = read(ROOT, 'refs/graph.json')
        catalog = {e['id']: e for e in read(ROOT, 'refs/catalog.json')}
        print(json.dumps(snapshot(ROOT, item, catalog, graph['modelState'], read(ROOT, 'data/acceptance_standard.json')), indent=2))
        return
    report = read(ROOT, 'public/photo-loop.json')
    area = next(a for a in report['areas'] if a['id'] == args.area)
    if args.json:
        print(json.dumps(area, indent=2))
    else:
        print(f"{area['name']} — {report['standard']}")
        print(report['scope'])
        for item in area['discrepancies']:
            print(f"{item['state']:20} {item['id']}: {item['description']}")
            for blocker in item['blockers']:
                print('  ', blocker)
        for request in area['requests']:
            print(f"NEEDED {request['kind']} ({request['state']}): {request['ask']}")
        solved = [c for c in area['cameras'] if c['state'] == 'solved']
        print(f"Cameras: {len(solved)} solved; {len(area['cameras']) - len(solved)} need solving or a recorded limitation.")
        for task in area['readyTasks']:
            print(f"READY P{task['priority']} {task['id']}: {task['title']}")
        for task in area['waitingTasks']:
            print(f"WAITING {task['id']}: dependencies={task['dependencies']}, requests={task['requests']}")
    if args.render:
        names = [c['photo'] for c in area['cameras'] if c['state'] == 'solved' and not c['photo'].startswith('ref:')]
        if not names:
            raise SystemExit('No solved public cameras for this area; solve existing photos before requesting new ones.')
        run(['node', 'scripts/shoot_views.cjs', *names, '--pose', '--details', f'--task={args.task}', f'--as={args.phase}'])
        for name in names:
            run([sys.executable, 'scripts/photo_pose.py', 'overlay', name, f'--task={args.task}'])
            directory = ROOT / 'docs/reviews' / args.task
            overlay = directory / f'{Path(name).stem}-overlay.jpg'
            shutil.copyfile(overlay, directory / f'{Path(name).stem}-{args.phase}-overlay.jpg')
        print('Renders and overlays created. Inspect them against the photos and record findings; no automatic match is claimed.')
    if args.validate:
        os.environ.setdefault('VILLACANA_TEST_DEVICE_SCALE', '0.5')
        if Path('/usr/bin/chromium').exists():
            os.environ.setdefault('PLAYWRIGHT_CHROMIUM_EXECUTABLE', '/usr/bin/chromium')
        for script in ('test_model_loop.py', 'test_photo_assignment.py', 'test_reference_index.py', 'test_placement_verification.py'):
            run([sys.executable, 'scripts/' + script])
        run(['npm', 'run', 'build'])
        run(['node', 'scripts/test_scorecard_browser.cjs'])
        run(['node', 'scripts/test_inspection_browser.cjs'])
        run(['node', 'scripts/test_photo_map_browser.cjs'])
        print('Software validation passed. Evidence gaps remain work items; software results do not grant visual or placement acceptance.')


if __name__ == '__main__':
    main()
