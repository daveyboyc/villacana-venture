"""Check the photo levels survey (data/levels_survey.json) and compare it with the terrain rule.

Items marked `built` with a `compare` pair must match the model: the terrain's height
difference between the pair falls inside the photographed range. Items marked `missing`
or `differs` are reported, not failed: they are the build queue's work.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
survey = json.loads((ROOT / 'data/levels_survey.json').read_text())
photos = {p['file'] for p in json.loads((ROOT / 'public/photos-ref/manifest.json').read_text())}
areas = {a['id'] for a in json.loads((ROOT / 'data/areas.json').read_text())['areas']}
tasks = {t['id']: t for t in json.loads((ROOT / 'data/build_queue.json').read_text())['tasks']}
ns = {'__file__': str(ROOT / 'scripts/check_terrain.py')}
# Reuse the terrain rule exactly as check_terrain.py states it, without its assertions.
exec((ROOT / 'scripts/check_terrain.py').read_text().split('\nassert')[0], ns)
site_y = ns['site_y']

TYPES = {'ramp', 'steps', 'slope', 'level', 'raised-threshold', 'raised-patio', 'raised-bed', 'retaining-wall'}
MODEL = {'built', 'differs', 'missing', 'none'}
TOLERANCE = 0.05
ids, open_items, lines = set(), 0, []
for item in survey['items']:
    name = item['id']
    assert name not in ids, f'{name}: duplicate id'
    ids.add(name)
    assert item['area'] in areas, f"{name}: unknown area {item['area']}"
    assert item['type'] in TYPES and item['model'] in MODEL, f'{name}: bad type or model state'
    low, high = item['rise']
    assert 0 <= low <= high <= 3, f'{name}: rise range'
    assert item['confidence'] in ('high', 'medium', 'low'), f'{name}: confidence'
    assert item['photos'] and all(p in photos for p in item['photos']), f'{name}: unknown photo'
    assert ('at' in item) == ('atAccuracy' in item), f'{name}: position without its accuracy'
    if item['model'] in ('missing', 'differs'):
        assert item.get('task') in tasks, f'{name}: open level change without a build task'
        open_items += 1
    if item.get('task'):
        assert item['task'] in tasks, f"{name}: unknown task {item['task']}"
    compare = item.get('compare')
    if not compare:
        continue
    model = site_y(compare['high']) - site_y(compare['low'])
    fits = low - TOLERANCE <= model <= high + TOLERANCE
    if item['model'] == 'built':
        assert fits, f'{name}: survey says {low}-{high} m, terrain gives {model:.2f} m'
    lines.append(f"  {name:28} photo {low:.2f}-{high:.2f} m  model {model:.2f} m  {'ok' if fits else 'DIFFERS: ' + item.get('task', '')}")
# Every task the survey points at names the survey in its brief, so the numbers reach the agent.
for name in {i['task'] for i in survey['items'] if i.get('task')}:
    assert 'levels_survey' in tasks[name]['build'] + tasks[name].get('avoid', ''), f'{name}: task does not cite data/levels_survey.json'
print('\n'.join(lines))
print(f"Levels survey: {len(ids)} items, {open_items} level changes queued, built items match the terrain PASS")
