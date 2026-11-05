#!/usr/bin/env python3
"""Check the photo-relative Silvia 2-20 / 22-44 ramp-passage study's data; no placement approval."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/silvia_ramp_passages.json').read_text())
dims,f=d['dimensions'],d['flight']
assert 'no world-map transform' in d['frame'], 'the study must stay unplaced until measured'
assert dims['ceiling']>dims['archCrown']>dims['archSpring']>1.9 and dims['width']>2.4
# Three risers: two plain treads then the landing; the ramp runs beside the whole flight and ends on the landing.
assert f['risers']==3 and .1<=f['riserHeight']<=.2 and .4<=f['treadDepth']<=.7
flight=(f['risers']-1)*f['treadDepth']
assert f['rampLength']>=flight, 'ramp must reach the landing'
assert f['rampAcross'][0]>=f['stepsAcross'][1]-1e-9, 'ramp and steps must not overlap'
half=dims['width']/2
for a,b in (f['stepsAcross'],f['rampAcross']):assert -half<=a<b<=half
lo,hi=d['doors']['along'];assert 0<lo<hi<dims['ceilingEnd'] and d['doors']['height']<dims['ceiling'] and d['doors']['paired']
w0,w1=d['windows']['along'];assert hi<w0<w1<dims['ceilingEnd']
p0,p1=d['pebbleMat']['along'];assert hi<=p0<p1<dims['ceilingEnd']
assert d['pebbleMat']['width']<dims['width']-.6
assert flight<lo, 'doors stand beyond the flight'
assert 0<d['gate']['2-20']['along']<dims['length'] and d['gate']['2-20']['along']>dims['ceilingEnd']
assert set(d['plaques'])>={'2-20','22-44'} and set(d['lanterns'])>={'2-20','22-44'}
for photo in d['evidence']:assert (ROOT/'public/photos-ref'/photo).is_file(),photo
assert {'IMG_2669.jpg','IMG_2670.jpg','IMG_2656.jpg','IMG_2657.jpg','IMG_2574.jpg'}<=set(d['evidence'])
assert '2-20' in d['identity'] and '22-44' in d['identity']
# The main map's west tunnel is untouched by this study.
placement=json.loads((ROOT/'data/silvia_map.json').read_text())
assert placement['entry']==[-121.79,118.12] and placement['hostBuilding']=='6264401UF1366S_part3'
print('Silvia ramp passages: flight/ramp arithmetic, door/mat/arch order, evidence files and unplaced status PASS (study only, no placement)')
