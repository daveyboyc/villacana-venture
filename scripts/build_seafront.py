"""Build seaside outlines from the existing OSM extract and registry footprint."""
import gzip
import json
import math
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def build_seafront(buildings, rotation):
    source = json.loads((ROOT / 'public/map/villacana.json').read_text())
    root = ET.fromstring(gzip.open(ROOT / 'data/villacana.osm.gz', 'rt').read())
    nodes = {n.get('id'): n for n in root.findall('node')}
    angle = math.radians(rotation)
    def unturn(p):
        x,z=p;return [round(x*math.cos(angle)+z*math.sin(angle),2),round(-x*math.sin(angle)+z*math.cos(angle),2)]
    def project(n):
        return [math.radians(float(n.get('lon'))+5.05)*6378137*math.cos(math.radians(36.4552)), -math.radians(float(n.get('lat'))-36.4552)*6378137]
    # Keep an uninterrupted mapped route across the resort frontage, including
    # the unnamed connector toward the eastern wooden boardwalk.
    route=[]
    for ident in ['1136517334','1156611374']:
        way=next(w for w in root.findall('way') if w.get('id')==ident)
        pts=[project(nodes[nd.get('ref')]) for nd in way.findall('nd')]
        route.extend(pts if not route else pts[1:])
    route=[[round(x,2),round(z,2)] for x,z in route]
    # Clip coastal polygons to a bounded planning window, in the map's turned frame.
    bounds=(-225,85,95,265)
    shore_trace=json.loads((ROOT / 'data/shoreline_trace.json').read_text())
    low,high=shore_trace['replaceXRange']
    def corrected(points):
        # Same independent aerial trace for the sea edge and beach polygon.
        before=[p for p in points if p[0] <= low]
        after=[p for p in points if p[0] >= high]
        return before + shore_trace['points'] + after
    coast=corrected(source['coast'])
    beach=source['beaches'][0]['ring']
    # The OSM beach's seaward edge runs west-to-east between these anchors.
    first=beach.index([-131.2,330.9])+1
    last=beach.index([129.0,105.5])
    beach=beach[:first] + shore_trace['points'] + beach[last:]
    # Ocean side is south of the mapped coastline.
    # Local view extent is separate from natural outlines, so screen cropping
    # never appears as a beach edge or ocean boundary.
    footprint=next(b for b in buildings if b['id']=='6364501UF1366S_part8')
    # Covered terrace extension is approximate, checked against aerial and official photos.
    terrace=[unturn(p) for p in [(-27,120),(-14,117),(-9,135),(-27,140),(-33,130)]]
    return {
        'paseo':{'name':'Paseo · Senda Litoral','width':3,'points':route,'trust':'OSM route; width approximate'},
        'viewBounds':[unturn(p) for p in [(bounds[0],bounds[2]),(bounds[1],bounds[2]),(bounds[1],bounds[3]),(bounds[0],bounds[3])]],
        'beach':{'name':'Villacana beach','ring':beach,'evidence':shore_trace['evidence'],'trust':shore_trace['trust']},
        'sea':{'name':'Mediterranean Sea','ring':coast+[[1500,1500],[-1500,1500]],'trust':shore_trace['trust']+' Outer edge is display extent.'},
        'coast':[[round(x,2),round(z,2)] for x,z in coast],
        'restaurant':{'name':'Barraka Beach','buildingId':footprint['id'],'ring':footprint['ring'],'terrace':terrace,
                      'trust':'Registry footprint matched to aerial and official photos; terrace approximate'},
        'sources':[
            {'title':'OpenStreetMap seaside route','url':'https://www.openstreetmap.org/way/1136517334'},
            {'title':'Barraka Beach official photos and virtual tour','url':'https://barrakabeach.com/'},
            {'title':'Estepona tourism: Barraka Beach','url':'https://turismo.estepona.es/lugares/barraka-beach/'}
        ]
    }
