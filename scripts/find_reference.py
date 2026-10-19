#!/usr/bin/env python3
"""Find photo IDs, paths and stable map links. Example: python3 scripts/find_reference.py boat"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]


def find(query: str, area: str | None = None) -> list[dict]:
    index = json.loads((ROOT / 'public/reference-index.json').read_text())
    words = query.casefold().split()
    return [r for r in index['references'] if (not area or area in r['areas']) and all(
        word in ' '.join(str(r.get(k) or '') for k in ('id', 'label', 'areas', 'subject', 'observation', 'note')).casefold()
        for word in words)]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('query', nargs='*', help='ID, place or visible subject; all words must match')
    parser.add_argument('--area', help='Area ID from data/areas.json')
    parser.add_argument('--json', action='store_true', help='Return complete evidence records')
    args = parser.parse_args()
    rows = find(' '.join(args.query), args.area)
    if args.json:
        print(json.dumps(rows, indent=2, ensure_ascii=False))
        return
    for r in rows:
        print(f"{r['id']} — {r['label']}")
        print(f"  Source: {r['sourcePath']}")
        print(f"  Map: https://daveyboyc.github.io/villacana-venture/?view=map&photo={quote(r['id'], safe='')}")
        if r.get('sourceUrl'):
            print(f"  Private source: {r['sourceUrl']}")
        print(f"  Areas: {', '.join(r['areas'])}; viewpoint: {r.get('viewpoint') or 'unknown'}")
        camera = r.get('camera')
        if camera:
            print(f"  Camera: [{camera['x']}, {camera['z']}] m; uncertainty: {str(camera['accuracy'])+' m' if 'accuracy' in camera else 'unknown'}. Camera is not subject.")
        else:
            print('  No camera position; inspect the area brief and visible landmarks.')
        if r.get('looksAt'):
            print(f"  Look-at: {r['looksAt']} ({r['looksAtBasis']}); subject: {r.get('subject') or 'unspecified'}")
        for key in ('locationBasis', 'observation', 'note'):
            if r.get(key):
                print(f"  {key}: {r[key]}")
        print(f"  Model citations: {', '.join(f['id'] for f in r['features']) or 'none recorded (not proof of absence)'}")
        for feature in r['features']:
            placement=feature.get('placement',{})
            print(f"    {feature['id']}: placement {placement.get('status','unreviewed')}"+(f" (tolerance {placement['toleranceM']} m)" if 'toleranceM' in placement else '')+f"; photo diagnostics {feature.get('photoVerification','unchecked')}")
            for blocker in placement.get('blockers',[]):print(f"      Blocker: {blocker}")
        print(f"  Recorded checks: {', '.join(c['result'] for c in r['checks']) or 'none in current records; earlier manual reviews may exist'}")
        print()
    print(f'{len(rows)} reference(s). Inspect full images before editing; citations do not prove a photographic match.')


if __name__ == '__main__':
    main()
