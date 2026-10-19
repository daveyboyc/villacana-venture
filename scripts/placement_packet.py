#!/usr/bin/env python3
"""Prepare an unapproved placement packet, or print its digest for a separate reviewer."""
import argparse
import json
from pathlib import Path
from build_references import build, model_features, ROOT
from placement_verification import FRAME, model_inventory, source_snapshot, packet_digest


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    sub=parser.add_subparsers(dest='command',required=True)
    template=sub.add_parser('template');template.add_argument('feature');template.add_argument('--task',required=True)
    status=sub.add_parser('status');status.add_argument('feature')
    sha=sub.add_parser('digest');sha.add_argument('packet',type=Path)
    args=parser.parse_args()
    if args.command=='status':
        graph=json.loads((ROOT/'refs/graph.json').read_text());nodes=[n for n in graph['nodes'] if n.get('featureId')==args.feature or n.get('feature')==args.feature]
        if not nodes:raise SystemExit('Unknown feature; regenerate references first')
        print(json.dumps(nodes,indent=2,ensure_ascii=False));return
    if args.command=='digest':
        print(packet_digest(json.loads(args.packet.read_text())));return
    _,catalog,problems=build(ROOT.parent/'villacana-reference')
    if problems:raise SystemExit('\n'.join(problems))
    features=model_features(catalog);feature=next((f for f in features if f['id']==args.feature),None)
    if feature is None:raise SystemExit('Unknown model feature')
    state=model_inventory(ROOT,[feature['model']])[feature['id']]
    required=set(feature['photos'])|{'map:ground'}
    packet={'id':'REPLACE_WITH_UNIQUE_REVIEW_ID','feature':feature['id'],'task':args.task,'author':'','checked':'','frame':FRAME,'toleranceM':None,'limitations':'',
            'snapshot':{'model':state['modelDigest'],'context':state['contextDigest'],'sources':source_snapshot(ROOT,required,{e['id']:e for e in catalog})},
            'overlay':{'path':'','sha256':''},'comparison':{'path':'','sha256':''},'render':{'path':'','sha256':''},
            'sourceAssessments':[{'source':id,'result':'','canEstablish':'','cannotEstablish':'','cameraStatus':'','comparison':''} for id in sorted(required)],
            'registration':{'method':'','source':'map:ground','transform':[],'controls':[],'validation':[]},
            'measurements':[{'featurePoint':'','source':'map:ground','sourcePixel':None,'sourcePoint':None,'modelPoint':point,'uncertaintyM':None,'basis':''} for point in state['geometry'].get('ring',state['geometry'].get('points',[]))],
            'resolves':[],'supersedes':[],'reviewer':{'id':'','decision':'','reviewedAt':'','packetDigest':'','sourcesInspected':[],'evidence':{'path':'','sha256':''}}}
    print(json.dumps(packet,indent=2,ensure_ascii=False))


if __name__=='__main__':main()
