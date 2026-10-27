#!/usr/bin/env python3
"""Match new photos to the photo requests in data/photo_requests.json.

  python3 scripts/photo_requests.py            list every request and the photos that answer it
  python3 scripts/photo_requests.py --open     only requests still waiting for photos

A photo answers a request when it was taken on or after the request's `since` date, its camera is
within the request's radius of `at` (plus up to 5 m of the phone's GPS accuracy), and, when the
request has a `look` point, the photo faces it: its reviewed looksAt is within the radius of `look`
or its compass heading is within 60 degrees of the bearing from `at` to `look`. A request with
`viewpoint: roof` (or upper-floor) also needs the phone's altitude above ground level. That makes the
request `received`; it stays so until an agent who has looked at the photos sets `status: answered`
with `answeredBy` and a `note` (or leaves it open and says what is still missing).
build_scorecard.py colours the areas from these states and build_references.py puts them in the
evidence graph.
"""
import argparse
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FACING = 60
GPS_SLACK = 5.0
GROUND_MAX_ALTITUDE = 9.0  # ground shots read 9 m or less (docs/PHOTO_MAP_WORKFLOW.md)


def load():
    return json.loads((ROOT / 'data/photo_requests.json').read_text())['requests']


def matches(request, photo, tag):
    if photo.get('x') is None or (photo.get('taken') or '') < request['since']:
        return False
    slack = min(photo.get('accuracy') or GPS_SLACK, GPS_SLACK)
    if math.dist((photo['x'], photo['z']), request['at']) > request['radius'] + slack:
        return False
    # A roof or upper-floor spot needs a photo taken up there: phone altitude above ground level.
    if request.get('viewpoint') in ('roof', 'upper-floor') and (photo.get('altitude') or 0) <= GROUND_MAX_ALTITUDE:
        return False
    look = request.get('look')
    if not look:
        return True
    if tag.get('looksAt') and math.dist(tag['looksAt'], look) <= request['radius']:
        return True
    if photo.get('heading') is None:
        return False
    bearing = math.degrees(math.atan2(look[0] - request['at'][0], -(look[1] - request['at'][1]))) % 360
    return abs((photo['heading'] - bearing + 180) % 360 - 180) <= FACING


def states(requests=None, manifest=None, tags=None):
    """Each request with its state (open, received, answered) and the photos that answer it."""
    requests = requests if requests is not None else load()
    manifest = manifest if manifest is not None else json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())
    tags = tags if tags is not None else json.loads((ROOT / 'data/reference_tags.json').read_text())
    out = []
    for r in requests:
        found = sorted(p['file'] for p in manifest if matches(r, p, tags.get(p['file'], {})))
        state = 'answered' if r['status'] == 'answered' else 'received' if found else 'open'
        out.append({**r, 'state': state, 'photos': sorted(set(found) | set(r.get('answeredBy', [])))})
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--open', action='store_true', help='only requests still waiting for photos')
    args = parser.parse_args()
    for r in states():
        if args.open and r['state'] != 'open':
            continue
        print(f"{r['state']:9} {r['area']:14} {r['id']:28} {', '.join(r['photos']) or '-'}")


if __name__ == '__main__':
    main()
