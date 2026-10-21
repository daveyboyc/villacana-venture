"""Plot the observed frontage edges and a source-relative plan; never infer world coordinates."""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Rectangle
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
trace = json.loads((HERE / 'observations.json').read_text())
image = Image.open(ROOT / trace['source'])
colours = {'left': '#e69b19', 'right': '#00a9cc'}
fig, (photo, plan) = plt.subplots(1, 2, figsize=(16, 10), gridspec_kw={'width_ratios': [1.16, 1]})
fig.patch.set_facecolor('#f7f5ef')
photo.imshow(image)
photo.set_xlim(155, 635); photo.set_ylim(825, 225)
photo.axis('off'); photo.set_title('Planters and window bars · IMG_2334', loc='left', fontsize=17, pad=16)
for run in trace['frontages']:
    colour = colours[run['sideInPhoto']]
    for segment in run['visibleSegments']:
        points = segment['pixelPoints']
        x, y = zip(*points)
        photo.plot(x, y, color='white', lw=6, alpha=.9)
        photo.plot(x, y, color=colour, lw=3)
    for point in run['occludedBeyondPixels']:
        photo.scatter(*point, s=55, facecolors='white', edgecolors=colour, linewidths=2, zorder=6)
photo.annotate('1  LOW KERB + PLANTING', xy=(236, 625), xytext=(170, 752),
               fontsize=11, weight='bold', color='#8f5900', bbox={'facecolor':'white','alpha':.96,'edgecolor':'none','pad':7},
               arrowprops={'arrowstyle':'->','color':'#e69b19','lw':2})
photo.annotate('2  RAISED WHITE BED', xy=(495, 627), xytext=(355, 335),
               fontsize=11, weight='bold', color='#00748d', bbox={'facecolor':'white','alpha':.96,'edgecolor':'none','pad':7},
               arrowprops={'arrowstyle':'->','color':'#00a9cc','lw':2})
photo.annotate('Doorway break', xy=(414, 534), xytext=(285, 390),
               fontsize=11, color='#243238', bbox={'facecolor':'white','alpha':.96,'edgecolor':'none','pad':5},
               arrowprops={'arrowstyle':'->','color':'#243238','lw':1.5})
photo.annotate('3  WINDOW BARS', xy=(507, 393), xytext=(175, 310),
               fontsize=11, weight='bold', color='#8247a6', bbox={'facecolor':'white','alpha':.96,'edgecolor':'none','pad':7},
               arrowprops={'arrowstyle':'->','color':'#9555bb','lw':2})
photo.scatter(507,393,s=70,facecolors='none',edgecolors='#9555bb',linewidths=2)

plan.set_xlim(-1.5, 5.8); plan.set_ylim(-2.7, 7.7); plan.set_aspect('equal'); plan.axis('off')
plan.set_title('Plan of the same arrangement', loc='left', fontsize=17, pad=16)
plan.add_patch(Rectangle((.95, .1), 2.1, 6.4, facecolor='#d6a17e', edgecolor='none'))
for y in [.6,1.3,2,2.7,3.4,4.1,4.8,5.5,6.2]:
    plan.plot([.95,3.05],[y,y],color='#f5d7bb',lw=1)
for x in [1.65,2.35]: plan.plot([x,x],[.1,6.5],color='#f5d7bb',lw=1)
plan.plot([.2,.2],[.1,6.5],color='#8f9596',lw=5)
plan.plot([4,4],[.1,3.9],color='#8f9596',lw=5)
plan.plot([4.5,4.5],[3.9,4.6],color='#8f9596',lw=5)
plan.plot([4,4.5],[3.9,3.9],color='#8f9596',lw=3)
plan.plot([4.5,4],[4.6,4.6],color='#8f9596',lw=3)
plan.plot([4,4],[4.6,6.5],color='#8f9596',lw=5)

def bed(x, y, w, h, side, unknown=False):
    colour=colours[side]
    plan.add_patch(Rectangle((x,y),w,h,facecolor=colour,alpha=.2,edgecolor=colour,lw=2,linestyle='--' if unknown else '-'))
    if not unknown:
        for at in [.15,.45,.75]:
            plan.add_patch(Rectangle((x+w*.17,y+h*at),w*.66,min(.38,h*.2),facecolor='#5d8054',edgecolor='none',alpha=.85))
bed(.25,.35,.65,2.4,'left')
bed(.25,2.75,.65,3.5,'left',True)
bed(3.1,.35,.7,3.55,'right')
bed(3.1,4.65,.7,1.6,'right')
for x in [.25,3.1]: plan.plot([x,x+.7],[6.25,6.25],color='#555',linestyle='--',lw=2)
plan.text(-1.32,1.2,'1  LEFT\nLow border\n+ mixed plants',fontsize=11,color='#8f5900',va='center')
plan.text(-1.32,4.6,'Hidden by\nladder/cart;\ncontinuity open',fontsize=10,color='#6b6860',va='center')
plan.text(4.15,1.9,'2  RIGHT\nRaised white\nplanter + hedge',fontsize=11,color='#00748d',va='center')
plan.add_patch(Polygon([[4,2.6],[3.55,2.7],[3.55,3.5],[4,3.6]],closed=True,facecolor='#9555bb',alpha=.18,edgecolor='#8247a6',lw=2))
for y in [2.75,2.95,3.15,3.35]:plan.plot([3.55,4],[y,y],color='#8247a6',lw=1)
plan.text(4.15,3.2,'3  Window grille\nprojects above bed',fontsize=10,color='#8247a6',va='center')
plan.text(4.72,4.25,'Door',fontsize=10,color='#444',va='center')
plan.text(2,6.92,'Ends hidden · no end wall inferred',fontsize=10,ha='center',color='#626662')
plan.annotate('Along the tiled lane',xy=(2,5.8),xytext=(2,2.4),ha='center',rotation=90,va='center',
              fontsize=11,color='#614b3e',arrowprops={'arrowstyle':'->','color':'#614b3e','lw':1.5})
plan.plot([.9,3.1],[0,0],color='#353f42',lw=4)
for x in [.9,3.1]: plan.plot([x,x],[0,-.7],color='#353f42',lw=3)
plan.text(2,-.43,'GATE',ha='center',fontsize=11,weight='bold',bbox={'facecolor':'#f7f5ef','edgecolor':'none'})
plan.add_patch(Rectangle((.8,-2.2),2.4,1.45,facecolor='#c9c1b0',edgecolor='none'))
plan.text(2,-1.65,'Stone forecourt',ha='center',fontsize=11,color='#4d514c')
plan.text(3.45,-1.55,'Existing\nbench / panel',fontsize=10,color='#6b6860')
plan.text(2,-2.5,'Source-relative schematic · not to scale',ha='center',fontsize=11,weight='bold',color='#444')
fig.text(.055,.035,'Approximate source traces. Dashed marks = hidden continuation. Purple = window grille above bed. Left/right follow IMG_2334.',fontsize=11,color='#3a4447')
fig.subplots_adjust(left=.035,right=.985,top=.91,bottom=.07,wspace=.16)
fig.savefig(HERE/'lane-planters-map.png',dpi=160,facecolor=fig.get_facecolor())
fig.savefig(HERE/'lane-planters-map.svg',facecolor=fig.get_facecolor())
