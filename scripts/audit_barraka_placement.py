#!/usr/bin/env python3
"""Public-safe comparison of the old aisle and a labelled, unapproved flank correction."""
import hashlib
import json
import math
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/reviews/barraka-planter-placement'
BASE='b57cd88843e16f3277bca8aaf10a7b199f3975b1'
CANDIDATE={'points':[[31,101],[36,107],[43,115]],'sign':[36,102]}


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    old=json.loads(subprocess.check_output(['git','show',BASE+':data/barraka_boardwalk.json'],cwd=ROOT,text=True))
    skeleton=json.loads((ROOT/'public/map/skeleton.json').read_text())
    bounds=json.loads((ROOT/'public/map/ground.json').read_text())
    aerial=Image.open(ROOT/'public/map/ground.jpg').convert('RGB')
    sx=(bounds['maxX']-bounds['minX'])/aerial.width;sz=(bounds['maxZ']-bounds['minZ'])/aerial.height
    def world(pixel):return [bounds['minX']+pixel[0]*sx,bounds['minZ']+pixel[1]*sz]
    def source(point):return [(point[0]-bounds['minX'])/sx,(point[1]-bounds['minZ'])/sz]
    roof=skeleton['seafront']['restaurant']['ring']
    picks=[('C1 north', [1506,832],1),('C2 east',[1544,876],4),('C3 west',[1467,866],6),('V1 south, held out',[1505,911],5)]
    observations=[{'id':id,'sourcePixel':p,'sourcePoint':world(p),'modelPoint':roof[i],
                   'distanceM':round(math.dist(world(p),roof[i]),3),'uncertaintyM':1.0,
                   'role':'held-out diagnostic' if id.startswith('V') else 'registration diagnostic'} for id,p,i in picks]
    record={'baseline':BASE,'frame':'map-metres-east-south','transform':[sx,0,0,sz,bounds['minX'],bounds['minZ']],
            'about':'Same fixed aerial frame for both panels. No local warp or fit to the proposal. Roof picks diagnose local registration only; no <=2m placement approval.',
            'sources':{'aerial':hashlib.sha256((ROOT/'public/map/ground.jpg').read_bytes()).hexdigest(),
                       'bounds':hashlib.sha256((ROOT/'public/map/ground.json').read_bytes()).hexdigest()},
            'landmarks':observations,'old':{'points':old['boardwalk']['points'],'sign':old['sign']['point']},'candidate':CANDIDATE,
            'candidateDisplacementM':round(math.dist(old['sign']['point'],CANDIDATE['sign']),3),
            'limits':'Candidate axis identity and planter ground corners unresolved; dimensions retained estimates. Independent source review confirms wrong flank/side arrangement only. No precise boat or hut footprint is inferred.'}
    (OUT/'observations.json').write_text(json.dumps(record,indent=2)+'\n')
    crop=(1435,780,1645,1010);scale=4;w=(crop[2]-crop[0])*scale;h=(crop[3]-crop[1])*scale
    canvas=Image.new('RGB',(w*2+36,h+130),'#fffaf0');draw=ImageDraw.Draw(canvas)
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
    small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
    for panel,points,sign,title in [(0,old['boardwalk']['points'],old['sign']['point'],'BEFORE: wrong southwest restaurant flank'),(1,CANDIDATE['points'],CANDIDATE['sign'],'CANDIDATE: northeast flank; exact position unapproved')]:
        offset=panel*(w+36);canvas.paste(aerial.crop(crop).resize((w,h)),(offset,46))
        def at(point):
            u,v=source(point);return (offset+(u-crop[0])*scale,46+(v-crop[1])*scale)
        draw.text((offset+4,12),title,fill='#222222',font=font)
        draw.line([at(p) for p in roof]+[at(roof[0])],fill='#f1e944',width=4)
        draw.line([at(p) for p in points],fill='#00d4ff' if panel==0 else '#ee22bb',width=7)
        x,y=at(sign);draw.ellipse((x-10,y-10,x+10,y+10),fill='#aaff44',outline='black',width=2)
        draw.text((x+12,y-10),'planter centre (estimate)',fill='black',font=small,stroke_width=2,stroke_fill='white')
        x,y=at([25,109]);draw.text((x-45,y-15),'BARRAKA',fill='black',font=font,stroke_width=2,stroke_fill='white')
        x,y=at([47,99]);draw.text((x-40,y),'Photo-left side:\nplanter / cooking hut / boat\n(precise footprints unresolved)',fill='#222222',font=small,stroke_width=2,stroke_fill='white')
        for item in observations:
            x,y=at(item['sourcePoint']);draw.ellipse((x-4,y-4,x+4,y+4),fill='white',outline='black')
        x,y=at([47,137]);draw.line([(x,y),(x+35,y+44)],fill='white',width=4);draw.text((x-5,y-26),'towards sea',font=small,fill='black',stroke_width=2,stroke_fill='white')
    draw.text((8,h+58),'Yellow: unchanged actual restaurant registry ring. Same Esri crop and metre frame in both panels.',font=font,fill='black')
    draw.text((8,h+86),'Proposal corrects the flank; source identification/scale uncertainty remains. No calibrated photographic match.',font=font,fill='black')
    canvas.save(OUT/'alignment-comparison.png')
    print('Saved Barraka comparison and original-pixel diagnostics; candidate remains unapproved.')


if __name__=='__main__':main()
