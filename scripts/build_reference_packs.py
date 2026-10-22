#!/usr/bin/env python3
"""Build photo inventories/line overlays and catalogue-driven rollout seeds. No model geometry is written."""
import argparse
import csv
import hashlib
import html
import io
import json
import re
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public/reference-packs'
STATES = {'draft-partial','appearance-corrected','unassessed','identity-unresolved','structure-unmapped','material-only','comparison-only'}
COLORS = {'A':'#e29d25','B':'#1a8c93','T':'#be4869','J':'#765db1'}

def read(path): return json.loads(path.read_text())
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def esc(value): return html.escape(str(value), quote=True)
def json_text(value): return json.dumps(value, ensure_ascii=False, indent=2)+'\n'
def catalogue(): return read(ROOT/'refs/catalog.json')

def validate(pack, root=ROOT):
    assert pack.get('version') == 1 and re.fullmatch(r'[a-z0-9-]+',pack['id']), 'Invalid pack identity'
    assert pack.get('sources') and pack.get('features'), 'Inspect sources and add numbered observations before generating a pack'
    assert pack['placementStatus']=='unapproved', 'Inventory must not grant placement approval'
    areas={a['id'] for a in read(root/'data/areas.json')['areas']}
    assert set(pack['areas'])<=areas and pack['areas'], 'Unknown pack area'
    sources={s['id']:s for s in pack['sources']}; features={f['id']:f for f in pack['features']}
    assert len(sources)==len(pack['sources']) and sources, 'Duplicate/empty source IDs'
    assert len(features)==len(pack['features']) and features, 'Duplicate/empty feature IDs'
    seen=set()
    for s in sources.values():
        assert s['path']=='public/photos-ref/'+s['id'] and re.fullmatch(r'[A-Za-z0-9_-]+\.jpg',s['id']), 'Only existing public phone pixels may be embedded'
        p=root/s['path']; assert p.is_file() and digest(p)==s['sha256'], 'Stale source pixels: '+s['id']
        with Image.open(p) as img: assert img.size==(s['width'],s['height']), 'Incorrect source dimensions'
        assert s['inspectedBy'] and s['inspectedAt'] and s['width']>0 and s['height']>0, 'Missing source inspection'
        for o in s['observations']:
            assert o['feature'] in features and o['kind'] in ('trace','locator'), 'Unknown annotation feature/type'
            x1,y1,x2,y2=o['bbox']; w,h=s['width'],s['height']
            assert 0<=x1<x2<=w and 0<=y1<y2<=h, 'Invalid source locator bounds'
            points=[o['label']]+o.get('polyline',[])
            assert all(len(p)==2 and 0<=p[0]<=w and 0<=p[1]<=h for p in points), 'Annotation outside source image'
            if o['kind']=='trace': assert len(o.get('polyline',[]))>=2, 'Trace requires explicit source points'
            assert s['id'] in features[o['feature']]['evidence'], 'Annotation not cited by feature'
            seen.add(o['feature'])
    for f in features.values():
        assert re.fullmatch(r'[A-Z][0-9]{2}',f['id']) and f['scene']==f['id'][0], 'Invalid feature ID'
        assert f['modelStatus'] in STATES and f['unknown'] and f['observed'] and f['requirements'] and f['followUp'], 'Incomplete observation/model gap'
        assert not f['buildReady'], 'Source-pack completion is not build/placement approval'
        assert set(f['evidence'])<=set(sources) and f['id'] in seen, 'Feature has no visible source locator'
        if f['modelStatus'] in ('draft-partial','appearance-corrected','material-only'):
            assert f['modelFeatureIds'] and f['modelRevision']==pack['modelSnapshot']['revision'], 'Model assessment needs pinned evidence'
    scenes={f['scene'] for f in features.values()}
    for r in pack['relationships']:
        if r['status']=='observed-connection':
            assert r.get('evidence') and set(r['evidence'])<=set(sources) and r.get('identityBasis'), 'Observed connection needs source evidence and physical identity basis'
        assert r['from'] in scenes and r['to'] in scenes and r['status'] in ('unresolved','different-place','observed-connection') and r['note'], 'Invalid scene relationship'
    snap=pack.get('modelSnapshot')
    if snap:
        assert re.fullmatch(r'[a-f0-9]{40}',snap['revision']), 'Model snapshot must be immutable'
        assert re.fullmatch(r'[A-Za-z0-9_-]+\.png',snap['image']), 'Render must remain in public pack folder'
        image=PUBLIC/pack['id']/snap['image']
        assert image.is_file() and digest(image)==snap['sha256'], 'Stale draft render snapshot'
    return True

def svg_source(pack, source):
    color=COLORS.get(source['scene'],'#135e56'); w,h=source['width'],source['height']
    rows=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">', '<rect width="100%" height="100%" fill="#fbfaf6"/>', f'<image class="source-photo" href="../../photos-ref/{esc(source["id"])}" width="{w}" height="{h}"/>']
    features={f['id']:f for f in pack['features']}
    for o in source['observations']:
        x1,y1,x2,y2=o['bbox']; x,y=o['label']; f=features[o['feature']]
        rows.append(f'<g class="annotation" data-feature="{f["id"]}" role="button" tabindex="0" aria-label="{esc(f["id"]+" "+f["name"])}"><title>{esc(f["name"]+": "+f["observed"])}</title>')
        rows.append(f'<rect class="locator" x="{x1}" y="{y1}" width="{x2-x1}" height="{y2-y1}" fill="none" stroke="{color}" stroke-width="4" stroke-dasharray="12 8"/>')
        if o.get('polyline'):
            points=' '.join(','.join(map(str,p)) for p in o['polyline'])
            rows.append(f'<polyline class="source-trace" points="{points}" fill="none" stroke="{color}" stroke-width="6"/>')
        rows.append(f'<rect x="{x-35}" y="{y-23}" width="70" height="46" rx="12" fill="{color}" stroke="white" stroke-width="3"/><text x="{x}" y="{y+11}" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="29" fill="white">{f["id"]}</text></g>')
    rows.append('</svg>'); return '\n'.join(rows)

def entrance_schematic(kind):
    head='<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1060" viewBox="0 0 1500 1060"><rect width="1500" height="1060" fill="#f7f5ef"/><style>text{font-family:Arial,sans-serif;fill:#253835} .h{font-size:27px;font-weight:bold}.s{font-size:19px}.note{font-size:17px;fill:#685e52}.wall{fill:#e5dfd0;stroke:#253835;stroke-width:3}.open{fill:none;stroke:#be4869;stroke-width:4}.uncertain{fill:none;stroke:#a17946;stroke-width:3;stroke-dasharray:12 8}</style>'
    title='Relationship plan' if kind=='plan' else 'Form elevations'
    out=[head,f'<text x="45" y="53" class="h">{title} · schematic, not to scale</text>', '<text x="45" y="86" class="s">Photo order and observed form only. No surveyed coordinates, dimensions or hidden connections.</text>']
    if kind=='plan':
        out += ['<rect x="35" y="115" width="620" height="845" rx="20" fill="white"/>','<text x="60" y="155" class="h">A · gate and lane / IMG_2334</text>',
        '<rect x="150" y="195" width="340" height="125" fill="#d1c7b3"/><text x="185" y="232" class="s">A03 stone forecourt</text><rect x="200" y="260" width="100" height="25" fill="#354746"/><text x="315" y="280" class="s">A04 drain</text>',
        '<rect x="510" y="285" width="90" height="33" fill="#eee8d6" stroke="#253835" stroke-width="2"/><rect x="520" y="272" width="65" height="8" fill="#426b9f"/><text x="500" y="337" class="note">A05 bench / tile panel</text>',
        '<path d="M145 340H250 M390 340H495" stroke="#253835" stroke-width="20"/><path d="M250 340V280 M390 340V280" stroke="#e29d25" stroke-width="7"/><text x="165" y="377" class="s">A01 portal / A02 open leaves</text>',
        '<path d="M235 405V850H430V405" fill="#c58c72" stroke="#ad765d" stroke-width="2"/><path d="M284 405V850 M333 405V850 M382 405V850" stroke="#f2e1c6" stroke-width="3"/><text x="250" y="890" class="s">A11 four tile courses</text>',
        '<rect x="180" y="420" width="45" height="180" fill="#99aa7d"/><path class="uncertain" d="M180 600V840H225V600"/><text x="62" y="522" class="s">A06 low bed</text><text x="55" y="660" class="note">Hidden continuation</text><text x="55" y="684" class="note">unresolved</text>',
        '<rect x="442" y="415" width="57" height="210" fill="#82976b"/><rect x="442" y="735" width="57" height="110" fill="#82976b"/><path class="wall" d="M513 400H535V850H513Z"/><text x="455" y="560" class="s" transform="rotate(90 455 560)">A07 raised bed</text><text x="442" y="675" class="s">A08 break</text><rect x="500" y="464" width="18" height="70" fill="none" stroke="#1a8c93" stroke-width="3"/><text x="540" y="503" class="note">A09 cage</text>',
        '<rect x="690" y="115" width="775" height="845" rx="20" fill="white"/><text x="720" y="155" class="h">T · Silvia passage / IMG_2190–2191</text>',
        '<rect x="925" y="250" width="300" height="580" class="wall"/><rect x="953" y="285" width="244" height="505" fill="#c58c72"/><path d="M953 285H1197 M953 790H1197" stroke="#be4869" stroke-width="7"/><text x="980" y="224" class="s">T01 entrance arch</text><text x="980" y="869" class="s">T04 garden exit</text>',
        '<rect x="925" y="395" width="30" height="95" fill="#675447"/><rect x="1195" y="510" width="30" height="95" fill="#675447"/><text x="760" y="441" class="s">T06 side door</text><rect x="1015" y="565" width="120" height="110" fill="#aaa591"/><text x="1012" y="713" class="note">T05 pebble inset</text><circle cx="1075" cy="407" r="12" fill="#253835"/><text x="1100" y="407" class="note">T07 lantern</text>',
        '<text x="735" y="920" class="s">No measured depth or width. Ceiling spans above.</text>',
        '<rect x="535" y="185" width="315" height="92" rx="12" fill="#fff1dc" stroke="#a17946" stroke-dasharray="8 6"/><text x="555" y="220" class="s">A ↔ T connection unresolved</text><text x="555" y="250" class="note">No connecting route asserted</text>']
    else:
        out += ['<rect x="35" y="125" width="665" height="810" rx="20" fill="white"/><text x="65" y="169" class="h">A09 / B01 · rectangular window cage</text>',
        '<rect x="155" y="295" width="255" height="405" class="wall"/><rect x="183" y="325" width="200" height="350" fill="#76523a"/>',
        '<rect x="173" y="309" width="220" height="375" fill="none" stroke="#263635" stroke-width="7"/>',
        ''.join(f'<path d="M{x} 309V684" stroke="#263635" stroke-width="4"/>' for x in range(187,390,26)),
        '<path d="M173 430H393 M173 555H393" stroke="#263635" stroke-width="5"/><text x="165" y="742" class="s">Front: straight bars and flat frame</text>',
        '<path d="M505 310V684H550V310Z" fill="none" stroke="#263635" stroke-width="6"/><path d="M505 430H550 M505 555H550" stroke="#263635" stroke-width="4"/><text x="470" y="742" class="s">Square return</text><text x="75" y="824" class="note">No bowed belly. Bar count / projection are not measured.</text>',
        '<rect x="735" y="125" width="730" height="810" rx="20" fill="white"/><text x="765" y="169" class="h">T01–T04 · arch opening, flat ceiling</text>',
        '<path d="M858 770V480C858 260 1342 260 1342 480V770H1300V480C1300 330 900 330 900 480V770Z" class="wall"/><path d="M844 481H912 M1288 481H1356" stroke="#253835" stroke-width="10"/><path d="M902 418H1298" stroke="#be4869" stroke-width="5" stroke-dasharray="10 6"/><text x="1010" y="402" class="s">T02 flat ceiling behind</text>',
        '<rect x="930" y="503" width="64" height="207" fill="#675447"/><rect x="1206" y="503" width="64" height="207" fill="#675447"/><path d="M1015 770V612C1015 513 1185 513 1185 612V770" class="open"/><text x="1025" y="685" class="note">T04 exit</text><path d="M846 781H1355" stroke="#b56e50" stroke-width="12"/><text x="860" y="823" class="s">Patterned tiles + pebble inset, not street grid</text><text x="860" y="860" class="note">Jorge’s fanlight gate is a separate observed feature (J03).</text>']
    out.append('<text x="45" y="1004" class="s">B = appearance/count reference with unresolved gateway identity. J = separate Jorge comparison, identified by plaque.</text><text x="45" y="1035" class="note">Solid = observed form/order. Dashed = hidden boundary or unresolved relation. Drawing completion does not approve placement.</text></svg>')
    return '\n'.join(out)

def seed(area, refs):
    return {'version':1,'id':area['id'],'title':area['name']+' reference pack','areas':[area['id']],'scope':'One identified physical scene at a time; split uncertain connections.','sources':[],'relationships':[],'criticalChecks':['Opening/ceiling/wall/level inventory before finishes','Every feature has a pixel locator and stated uncertainty','Model state and placement approval kept separate'],'name':area['name'],'status':'source-needed' if not refs else 'not-started','instructions':'Inspect full sources before adding features. Split distinct views/places. Create observed pixel locators and uncertainties. Never infer world placement from camera GPS.','candidateSources':[{'id':r['id'],'private':r['kind']!='phone-photo','path':r['path']} for r in refs],'features':[],'observations':[],'placementStatus':'unapproved'}

def outputs(pack):
    validate(pack); files={PUBLIC/'schema.json':json_text(read(ROOT/'data/reference_packs/schema.json'))}; base=PUBLIC/pack['id']
    files[base/'pack.json']=json_text(pack)
    template=(ROOT/'scripts/reference-pack-viewer.html').read_text()
    files[base/'index.html']=template.replace('@@TITLE@@',esc(pack['title'])).replace('@@PACK@@',json.dumps(pack,ensure_ascii=False).replace('<','\\u003c'))
    for s in pack['sources']: files[base/(s['id'].replace('.jpg','.svg'))]=svg_source(pack,s)
    
    for kind in ['plan','elevation']:
        authored=ROOT/'data/reference_packs'/(pack['id']+'-'+kind+'.svg')
        if authored.exists(): value=authored.read_text()
        elif pack['id']=='entrance': value=entrance_schematic(kind)
        else: value='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#f7f5ef"/><text x="60" y="100" font-family="sans-serif" font-size="30">'+esc(pack['title'])+': '+kind+' drawing pending source tracing</text><text x="60" y="160" font-family="sans-serif" font-size="22">No dimensions, hidden boundaries or connecting routes have been inferred.</text></svg>'
        files[base/(kind+'.svg')]=value
    snapshot=pack.get('modelSnapshot')
    model_scope='Model states refer to draft snapshot '+snapshot['revision'][:7]+'.' if snapshot else 'No pinned model snapshot is supplied.'
    rows=['# '+pack['title']+' feature inventory','','Source groups remain distinct. '+model_scope+' No row grants placement approval.','','| ID | Feature | Source evidence | Game assessment | Unknown / next check |','| --- | --- | --- | --- | --- |']
    csv_io=io.StringIO(); writer=csv.writer(csv_io,lineterminator="\n");writer.writerow(['id','scene','feature','source_ids','model_status','observed','unknown','follow_up'])
    for f in pack['features']:
        rows.append('| '+' | '.join(str(v).replace('|','/') for v in [f['id'],f['name'],', '.join(f['evidence']),f['modelStatus'],f['unknown']])+' |')
        writer.writerow([f['id'],f['scene'],f['name'],', '.join(f['evidence']),f['modelStatus'],f['observed'],f['unknown'],f['followUp']])
    files[base/'checklist.csv']=csv_io.getvalue();files[ROOT/'docs/reference-packs'/(pack['id']+'-inventory.md')]='\n'.join(rows)+'\n'
    registered=[read(path) for path in sorted((ROOT/'data/reference_packs').glob('*.json')) if path.name!='schema.json']
    for registered_pack in registered: validate(registered_pack)
    areas=read(ROOT/'data/areas.json')['areas']; refs=catalogue(); inspected={s['id'] for p in registered for s in p['sources']}; rollout=[]
    priorities={'middle-pool':1,'seaward-lanes':1,'elena':2,'cervantes':2,'dali':2,'north-pool':3,'main-pool':3,'paseo':3,'barraka-beach':3}
    for a in areas:
        candidates=[r for r in refs if a['id'] in r['shows']]; covered=sorted({r['id'] for r in candidates}&inspected)
        row={'id':a['id'],'name':a['name'],'references':len(candidates),'publicPhotos':sum(r['kind']=='phone-photo' for r in candidates),'privateReferences':sum(r['kind']!='phone-photo' for r in candidates),'annotatedSources':covered,'status':'pilot-partial' if covered else 'source-needed' if not candidates else 'not-started','wave':priorities.get(a['id'],4)}
        rollout.append(row);files[PUBLIC/'templates'/(a['id']+'.json')]=json_text(seed(a,candidates))
    rollout.sort(key=lambda a:(a['wave'],a['id']))
    roll={'about':'Area counts overlap. Pilot source annotation is distinct from complete area inventory or placement approval. Templates are uninspected candidates.','uniqueReferences':len(refs),'uniquePublicPhotos':sum(r['kind']=='phone-photo' for r in refs),'annotatedSources':len(inspected),'areas':rollout,'waves':[{'wave':1,'focus':'Finish pilot identity/placement and missing tunnel structural inventory.'},{'wave':2,'focus':'Street-by-street openings, connections, steps and levels; Elena/Cervantes/Dali.'},{'wave':3,'focus':'Pool courtyards and seafront; each path/opening before decoration.'},{'wave':4,'focus':'Remaining lanes, sparse-source areas and cross-area review. Obtain sources where none exist.'}]}
    files[base/'index.html']=files[base/'index.html'].replace('@@ROLLOUT@@',json.dumps(roll,ensure_ascii=False).replace('<','\\u003c'))
    files[PUBLIC/'rollout.json']=json_text(roll)
    md=['# Map-wide reference-pack rollout','','Generated from the current reference catalogue. Six pilot source sheets do not complete either area; private metadata is listed without pixels. Area totals overlap.','','| Wave | Area | References | Public / private | Pilot sources | State |','| --- | --- | --- | --- | --- | --- |']
    trs=[]
    for a in rollout:
        md.append(f'| {a["wave"]} | {a["name"]} | {a["references"]} | {a["publicPhotos"]} / {a["privateReferences"]} | {len(a["annotatedSources"])} | {a["status"]} |')
        trs.append(f'<tr><td>{a["wave"]}</td><td>{esc(a["name"])}</td><td>{a["references"]}</td><td>{len(a["annotatedSources"])}</td><td>{a["status"]}</td><td><a href="templates/{a["id"]}.json">Start template</a></td></tr>')
    files[ROOT/'docs/reference-packs/rollout.md']='\n'.join(md)+'\n'
    files[PUBLIC/'index.html']='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Villacana reference packs</title><link rel="stylesheet" href="pack.css"><main class="rollout"><p class="eyebrow">VILLACANA · PHOTO → DRAWING → CHECKLIST → MODEL</p><h1>Reference packs across the map</h1><p>Start with <a href="entrance/index.html">the entrance example</a>. Annotate sources, record missing components, resolve connections, then build and compare. Inventory coverage and placement approval are separate.</p><div class="metrics"><strong>176 references</strong><strong>6 pilot source sheets</strong><strong>14 fixed areas</strong><strong>0 areas fully inventoried</strong></div><h2>Rollout queue</h2><p>Wave 1 finishes the entrance/tunnel identity. Wave 2 audits connecting streets. Wave 3 covers pools and seafront. Wave 4 resolves remaining lanes and source gaps. Templates contain candidates, not inspected features.</p><div class="table-scroll"><table><thead><tr><th>Wave</th><th>Area</th><th>References</th><th>Pilot sources</th><th>State</th><th>Next pack</th></tr></thead><tbody>'''+''.join(trs)+'''</tbody></table></div><p>Area reference counts overlap. Private sources remain in the private reference repository; templates expose metadata only. <a href="../?view=map">Open canonical map</a> · <a href="rollout.json">Rollout JSON</a></p></main></html>'''
    files[PUBLIC/'index.html']=files[PUBLIC/'index.html'].replace('176 references',str(len(refs))+' references').replace('6 pilot source sheets',str(len(inspected))+' pilot source sheets').replace('14 fixed areas',str(len(areas))+' fixed areas')
    return files

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--check',action='store_true');p.add_argument('--template',metavar='AREA');p.add_argument('--pack',help='Build only this pack; default builds every registered pack');p.add_argument('--feature',help='Print one numbered component with source pixel locators');args=p.parse_args()
    if args.feature:
        if not args.pack:p.error('--feature requires --pack')
        pack=read(ROOT/'data/reference_packs'/(args.pack+'.json'));validate(pack)
        feature=next((f for f in pack['features'] if f['id']==args.feature),None)
        if feature is None:p.error('Unknown component ID')
        observations=[{'source':s['id'],'path':s['path'],'sha256':s['sha256'],'width':s['width'],'height':s['height'],'locators':[o for o in s['observations'] if o['feature']==feature['id']]} for s in pack['sources'] if s['id'] in feature['evidence']]
        print(json_text({'pack':pack['id'],'feature':feature,'sources':observations,'viewer':'public/reference-packs/'+pack['id']+'/index.html#feature='+feature['id']+'&source='+feature['evidence'][0],'placementStatus':'unapproved'}),end='');return
    if args.template:
        area=next((a for a in read(ROOT/'data/areas.json')['areas'] if a['id']==args.template),None)
        if not area: p.error('Unknown fixed area')
        print(json_text(seed(area,[r for r in catalogue() if area['id'] in r['shows']])),end='');return
    paths=[ROOT/'data/reference_packs'/(args.pack+'.json')] if args.pack else [p for p in sorted((ROOT/'data/reference_packs').glob('*.json')) if p.name!='schema.json']
    packs=[read(path) for path in paths];files={}
    for pack in packs: files.update(outputs(pack))
    stale=[]
    for path,value in files.items():
        if args.check:
            if not path.exists() or path.read_text()!=value:stale.append(str(path.relative_to(ROOT)))
        else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(value)
    if stale:raise SystemExit('Stale reference-pack outputs: '+', '.join(stale))
    print(f'{sum(len(p["sources"]) for p in packs)} inspected source sheets, {sum(len(p["features"]) for p in packs)} numbered features, {len(read(ROOT/"data/areas.json")["areas"])} rollout areas; placement unapproved; outputs '+('current' if args.check else 'generated'))
if __name__=='__main__':main()
