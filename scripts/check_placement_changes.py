#!/usr/bin/env python3
"""Reject PR geometry changes without fresh placement approval. Run reference generation first."""
import argparse
import json
import subprocess
from pathlib import Path
from placement_verification import UI_MODULES, WORKFLOW_DATA

ROOT=Path(__file__).resolve().parents[1]


def geometry_path(path):
    p=Path(path)
    return (path.startswith('src/') and p.suffix=='.ts' and p.name not in UI_MODULES or
            path.startswith('data/') and p.suffix=='.json' and p.name not in WORKFLOW_DATA or
            path.startswith('public/map/') and p.suffix=='.json')


def change_errors(before, after, changed):
    errors=[]
    old_nodes={n['id']:n for n in before.get('nodes',[])}
    new_nodes={n['id']:n for n in after.get('nodes',[])}
    for id,node in old_nodes.items():
        kind=node.get('kind');current=new_nodes.get(id)
        if kind not in ('placement-review','placement-discrepancy'):continue
        if current is None:
            errors.append(f'{id}: evidence/discrepancy history cannot be deleted; retain and explicitly supersede or resolve it')
        elif kind=='placement-review' and any(current.get(key)!=value for key,value in node.items()):
            errors.append(f'{id}: historical placement packet cannot be rewritten; record a new independently approved supersession')
        elif kind=='placement-discrepancy':
            if current.get('feature')!=node.get('feature') or current.get('kind')!=kind:
                errors.append(f'{id}: discrepancy cannot be reassigned to another feature')
            previous_sources={e['to'] for e in before.get('edges',[]) if e['from']==id and e['relation']=='discrepancy-source'}
            current_sources={e['to'] for e in after.get('edges',[]) if e['from']==id and e['relation']=='discrepancy-source'}
            if not previous_sources<=current_sources:errors.append(f'{id}: original discrepancy sources cannot be removed')
    geometry=[p for p in changed if geometry_path(p)]
    if not geometry:
        return errors
    if 'modelState' not in before:
        return errors+['Base graph has no placement fingerprints; geometry changes require a separate evidence-policy migration first.']
    old,new=before['modelState'],after['modelState']
    removed=set(old)-set(new)
    errors += [f'{id}: removal requires a reviewed retirement record; keep a graph tombstone until that evidence is recorded' for id in sorted(removed)]
    affected={id for id,state in new.items() if id not in old or state['modelDigest']!=old[id]['modelDigest']}
    nodes={n['featureId']:n for n in after['nodes'] if n.get('kind')=='model-feature'}
    # A shared entry/helper edit can affect placement even if feature data stayed identical.
    if not affected and not removed and not any(p.startswith('src/') for p in geometry) and not any(state['contextDigest']!=old.get(id,{}).get('contextDigest') for id,state in new.items()):
        return errors  # Names, citations and trust notes alone do not move a feature.
    if not affected:
        tasks=[n for n in after['nodes'] if n.get('kind')=='build-task' and n.get('placement',{}).get('features')]
        affected={id for t in tasks for id in t['placement']['features'] if id in nodes and nodes[id]['placement']['contextDigest']!=old.get(id,{}).get('contextDigest')}
        if not affected:
            errors.append('Renderer/geometry inputs changed without declared affected features and a current independent placement review.')
    for id in sorted(affected):
        node=nodes.get(id,{})
        if node.get('placement',{}).get('status')!='verified':
            errors.append(f'{id}: changed geometry has no fresh verified placement packet')
    return errors


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--base',required=True);args=parser.parse_args()
    before=json.loads(subprocess.check_output(['git','show',args.base+':refs/graph.json'],cwd=ROOT,text=True))
    after=json.loads((ROOT/'refs/graph.json').read_text())
    changed=subprocess.check_output(['git','diff','--name-only',args.base,'--'],cwd=ROOT,text=True).splitlines()
    errors=change_errors(before,after,changed)
    for error in errors:print('FAIL:',error)
    print('Placement change gate:', 'FAIL' if errors else 'PASS (no unapproved geometry changes)')
    raise SystemExit(bool(errors))


if __name__=='__main__':main()
