import json,math
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
root=Path(__file__).resolve().parents[1];s=json.load(open(root/'public/map/skeleton.json'));b=json.load(open(root/'public/map/ground.json'));g=json.load(open(root/'data/middle_pool_south_gate.json'));orig=Image.open(root/'public/map/ground.jpg').convert('RGB')
bounds=[-150,76,-100,141];w=1000;scale=w/(bounds[2]-bounds[0]);h=round((bounds[3]-bounds[1])*scale)
def native(p):return ((p[0]-b['minX'])/(b['maxX']-b['minX'])*orig.width,(p[1]-b['minZ'])/(b['maxZ']-b['minZ'])*orig.height)
im=orig.crop((*native(bounds[:2]),*native(bounds[2:]))).resize((w,h));d=ImageDraw.Draw(im);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
def pt(p):return ((p[0]-bounds[0])*scale,(p[1]-bounds[1])*scale)
def line(points,color,width=3):d.line([pt(p) for p in points],fill=color,width=width)
def ring(points,color,width=3):line(points+[points[0]],color,width)
def text(p,t,color='white'):d.text(pt(p),t,font=font,fill=color,stroke_width=3,stroke_fill='black')
def at(along,across=0):
 fx,fz=g['forward'];return [g['center'][0]+fx*along-fz*across,g['center'][1]+fz*along+fx*across]
for bb in s['buildings']:
 if any(bounds[0]<p[0]<bounds[2] and bounds[1]<p[1]<bounds[3] for p in bb['ring']):
  ring(bb['ring'],'#ffde55',2)
  for hole in bb.get('holes',[]):ring(hole,'#ffde55',2)
pool=next(p for p in s['pools'] if p['id']=='middle');ring(pool['ring'],'#00ffff',4)
line([at(0,-g['opening']/2),at(0,g['opening']/2)],'#ff5555',6);text(at(0),'current gate', '#ff7777')
for key,color in [('planter','#b8ff71'),('bench','#ff88ff')]:
 v=g[key];r=v.get('across',v.get('seat',{}).get('across'));a0,a1=v['along'];x0,x1=r;ring([at(a0,x0),at(a0,x1),at(a1,x1),at(a1,x0)],color,5)
p=json.load(open(root/'data/silvia_map.json'));a=p['entry'];f=p['forward'];end=[a[0]+f[0]*7.2,a[1]+f[1]*7.2];line([a,end],'#c488ff',5);text(a,'tunnel candidate','#d5aaff')
# Source image stays in its original common frame; overlays are model diagnostics.
frontages=json.load(open(root/'data/middle_pool_lane_frontages.json'))
for bed in frontages['beds']:ring([at(*p) for p in bed['outline']],'#b8ff71',3)
from sys import path as sys_path
sys_path.insert(0,str(root/'scripts'))
from assign_photo_map import nearest
water_gap,water_pt=nearest(g['center'],pool['ring']+[pool['ring'][0]])
line([g['center'],water_pt],'#70ffff',2);text([-139,100],f'{water_gap:.1f} m gate to water (MODEL)', '#70ffff')
text([-148,77],'SATELLITE CHECK: existing positions retained')
text([-148,79],'Cyan pool / red gate / green planter / pink bench')
text([-148,81],'Yellow registry / purple approximate tunnel')
text([-148,83],'Model overlay; small bed edges hidden by foliage')
planters=json.load(open(root/'data/entrance_planters.json'))
def sw(x,z):return [a[0]+f[1]*x+f[0]*z,a[1]-f[0]*x+f[1]*z]
for bed in planters['beds']:
 if bed['kind']!='kerbed-bed':continue
 points=[sw(*v) if bed['frame']=='silvia' else at(v[1],v[0]) for v in bed['ring']]
 ring(points,'#ff9d35',5)
text([-141,116],'Orange: NEW low bed fragments (estimated)','#ffb756')
im.save(root/'docs/reviews/silvia-entrance-planters/satellite-planters-overlay.png')
