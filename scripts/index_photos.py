#!/usr/bin/env python3
"""Upsert originals into map camera pins and EXIF-free web photos.

python3 scripts/index_photos.py /private/downloaded-originals public/photos-ref
GPS is the camera position. This does not infer the subject's coordinates.
"""
from __future__ import annotations
import argparse
import json
import math
from pathlib import Path
from PIL import Image, ImageOps
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass
ROOT=Path(__file__).resolve().parents[1]
MANUAL=ROOT/'data/photo_positions.json'
LAT0=36.4552
LON0=-5.0500
R_EARTH=6_378_137.0
WEB_EDGE=1600

def project(lat:float,lon:float)->tuple[float,float]:
    return math.radians(lon-LON0)*R_EARTH*math.cos(math.radians(LAT0)),-math.radians(lat-LAT0)*R_EARTH

def degrees(value,ref:str)->float:
    d,m,s=(float(v) for v in value)
    result=d+m/60+s/3600
    return -result if ref in ('S','W') else result

def number(value):
    try:
        result=float(value)
        return result if math.isfinite(result) else None
    except (ValueError,TypeError,ZeroDivisionError):
        return None

def metadata(path:Path)->dict:
    with Image.open(path) as image:
        exif=image.getexif()
        gps=exif.get_ifd(0x8825) if exif else {}
        entry={'file':path.stem+'.jpg','title':path.stem.replace('-',' '),'trust':'unplaced'}
        if 2 in gps and 4 in gps:
            lat,lon=degrees(gps[2],gps.get(1,'N')),degrees(gps[4],gps.get(3,'E'))
            if not (-90<=lat<=90 and -180<=lon<=180):raise ValueError(f'Invalid GPS: {path.name}')
            x,z=project(lat,lon)
            entry.update(x=round(x,1),z=round(z,1),trust='phone location',locationBasis='Original phone GPS; camera position retained without snapping')
            accuracy=number(gps.get(31))
            if accuracy is not None and accuracy>0:entry['accuracy']=round(accuracy,1)
            # Phone altitude is rough (several metres) but separates roof shots from lane shots.
            altitude=number(gps.get(6))
            if altitude is not None:entry['altitude']=round(-altitude if gps.get(5) in (1,b'\x01') else altitude,1)
        heading=number(gps.get(17))
        if heading is not None and gps.get(16)=='T':entry.update(heading=round(heading)%360,headingBasis='EXIF true north')
        elif heading is not None:entry['headingBasis']='Magnetic/unknown direction; no true-north wedge inferred'
        taken=exif.get_ifd(0x8769).get(0x9003) if exif else None
        if taken:entry['taken']=str(taken)[:10].replace(':','-')
        return entry

def index(source:Path,out:Path,annotations:dict|None=None)->list[dict]:
    paths=sorted(p for p in source.iterdir() if p.suffix.lower() in ('.jpg','.jpeg','.png','.heic','.heif'))
    names=[p.stem.casefold() for p in paths]
    if len(set(names))!=len(names):raise ValueError('Duplicate photo stems: rename duplicates before indexing')
    if not paths:raise ValueError('No supported photos found')
    out.mkdir(parents=True,exist_ok=True)
    manifest=out/'manifest.json'
    entries={e['file']:e for e in json.loads(manifest.read_text())} if manifest.exists() else {}
    manual=json.loads(MANUAL.read_text()) if MANUAL.exists() else {}
    for path in paths:
        fresh=metadata(path)
        previous=entries.get(fresh['file'],{})
        # Refresh phone metadata while retaining human notes and corrected locations.
        merged={**previous,**fresh}
        for key in ('title','observation','originalUrl','visualReview','streetHint','areaHint'):
            if key in previous:merged[key]=previous[key]
        if previous.get('trust') not in (None,'phone location','unplaced'):
            for key in ('x','z','heading','accuracy','trust','locationBasis','headingBasis','gps'):
                if key in previous:merged[key]=previous[key]
        elif 'heading' not in fresh:
            merged.pop('heading',None)
        fresh=merged
        fresh.update(manual.get(path.name,{}))
        fresh.update((annotations or {}).get(path.name,(annotations or {}).get(fresh['file'],{})))
        if ('x' in fresh)!=('z' in fresh):raise ValueError(f'Incomplete position: {path.name}')
        with Image.open(path) as image:
            web=ImageOps.exif_transpose(image).convert('RGB')
            web.thumbnail((WEB_EDGE,WEB_EDGE))
            # A fresh pixel-only image strips EXIF, XMP and source info blobs.
            Image.frombytes('RGB',web.size,web.tobytes()).save(out/fresh['file'],quality=82)
        entries[fresh['file']]=fresh
    result=sorted(entries.values(),key=lambda e:e['file'])
    manifest.write_text(json.dumps(result,indent=1,ensure_ascii=False)+'\n')
    return result

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source',type=Path)
    parser.add_argument('out',type=Path)
    parser.add_argument('--annotations',type=Path,help='Reviewed titles/descriptions and original Drive links')
    args=parser.parse_args()
    annotations=json.loads(args.annotations.read_text()) if args.annotations else {}
    entries=index(args.source,args.out,annotations)
    placed=sum('x' in e for e in entries)
    print(f'{len(entries)} indexed photos, {placed} camera pins, {len(entries)-placed} unplaced; existing entries preserved')
if __name__=='__main__':main()
