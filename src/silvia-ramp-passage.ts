/** Photo-relative study of the Calle de Silvia 2-20 / 22-44 covered passages (ramp, three steps, double doors). Not placed in the map. */
import * as THREE from 'three';
import data from '../data/silvia_ramp_passages.json';
import {plasterMaterial} from './materials';
import {silviaPavingMaterial,setSilviaPavingUvs} from './silvia-paving';

export const silviaRampPassages=data;
export type RampVariant='2-20'|'22-44';
const d=data.dimensions,f=data.flight,half=d.width/2,cp=d.ceiling;
const top=f.risers*f.riserHeight;

/** Procedural textures only; no photo pixels. */
function tex(n:number,draw:(g:CanvasRenderingContext2D,n:number)=>void,repeat=true){const c=document.createElement('canvas');c.width=c.height=n;draw(c.getContext('2d')!,n);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;if(repeat)t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
const hash=(a:number,b=0)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v);};

/** Red studded rubber ramp tile: 0.5 m squares with a joint, a square grid of raised pyramids. */
function studTexture(){return tex(512,(g,n)=>{
 g.fillStyle='#8f3f38';g.fillRect(0,0,n,n);
 const studs=18,u=(n-8)/studs;
 for(let i=0;i<studs;i++)for(let j=0;j<studs;j++){const x=4+i*u,y=4+j*u,v=hash(i,j);
  g.fillStyle=`rgb(${176+v*14},${88+v*10},${76+v*8})`;g.fillRect(x+1,y+1,u-2,u-2);
  g.fillStyle='#d3806f';g.fillRect(x+1,y+1,u-2,2);g.fillRect(x+1,y+1,2,u-2);
  g.fillStyle='#6e2f2b';g.fillRect(x+1,y+u-3,u-2,2);g.fillRect(x+u-3,y+1,2,u-2);}
 g.fillStyle='#6a2b27';g.fillRect(0,0,n,4);g.fillRect(0,0,4,n);});}

/** Plain terracotta squares with pale joints, for the treads and the lane. */
function plainTexture(tile=.3,span=1.2,joint=.018){return tex(512,(g,n)=>{
 const k=Math.round(span/tile),s=n/k;g.fillStyle='#b9b2a2';g.fillRect(0,0,n,n);
 for(let i=0;i<k;i++)for(let j=0;j<k;j++){const v=hash(i,j+9);g.fillStyle=`rgb(${178+v*26},${100+v*18},${76+v*14})`;const jw=joint/span*n;g.fillRect(i*s+jw,j*s+jw,s-2*jw,s-2*jw);
  for(let q=0;q<22;q++){g.fillStyle=q%2?'#e1b98d22':'#5a3a2a1a';g.fillRect(i*s+hash(i*7+q,j)*s,j*s+hash(i,j*5+q)*s,3+hash(q,i)*9,2);}}});}

function pebbleTexture(){return tex(512,(g,n)=>{g.fillStyle='#7d7a6e';g.fillRect(0,0,n,n);
 for(let i=0;i<9000;i++){g.fillStyle=['#b7b1a0','#4d4b43','#cfc8b4','#6f6b5f','#34352f'][i%5];g.beginPath();g.ellipse(hash(i,1)*n,hash(i,2)*n,2+hash(i,3)*2.5,3+hash(i,4)*3.4,hash(i,5)*3.14,0,6.29);g.fill();}});}

function plaqueTexture(lines:string[],vertical:boolean){const w=vertical?256:1024,h=vertical?1024:256,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d')!;
 g.fillStyle='#f1eee2';g.fillRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';
 const cells=vertical?lines.map((t,i)=>({t,x:0,y:i*h/lines.length,w,h:h/lines.length})):lines.map(t=>{const share=t.length>3?.62:.18;return {t,x:0,y:0,w:w*share,h};});
 let x=0;for(const cell of cells){const cx=vertical?cell.x:x,cy=cell.y;g.fillStyle='#14233f';g.fillRect(cx+3,cy+3,cell.w-6,cell.h-6);g.fillStyle='#f4f0e0';g.font=`bold ${Math.min(cell.h*.62,cell.w/Math.max(cell.t.length,1)*1.4)}px Georgia`;g.fillText(cell.t,cx+cell.w/2,cy+cell.h/2+3,cell.w-14);if(!vertical)x+=cell.w+6;}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}

export function createSilviaRampPassage(variant:RampVariant,details=true){
 const root=new THREE.Group();root.name='silvia-ramp-passage-'+variant;root.userData.noDrape=true;root.userData.sourceFrame=data.frame;
 const plaster=plasterMaterial('#f4f1e6'),white=new THREE.MeshStandardMaterial({color:'#f3f0e6',roughness:.95});
 const wood=new THREE.MeshStandardMaterial({color:'#33211a',roughness:.7}),dark=new THREE.MeshStandardMaterial({color:'#1f2426',roughness:.7}),band=new THREE.MeshStandardMaterial({color:'#3c4349',roughness:.8});
 const plain=plainTexture(.4,1.6,.022),plainMat=()=>{const t=plain.clone();t.needsUpdate=true;return new THREE.MeshStandardMaterial({map:t,roughness:.95});};
 function mesh(geo:THREE.BufferGeometry,mat:THREE.Material|THREE.Material[],name:string,x:number,y:number,z:number,parent:THREE.Object3D=root){const m=new THREE.Mesh(geo,mat);m.name=name;m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function box(name:string,x:number,y:number,z:number,w:number,h:number,l:number,mat:THREE.Material=plaster,parent:THREE.Object3D=root){return mesh(new THREE.BoxGeometry(w,h,l),mat,name,x,y,z,parent);}
 /** Top face tiled at the metre scale of a plain texture; sides stay white render. */
 function tiledTop(name:string,x0:number,x1:number,z0:number,z1:number,y:number,mat:THREE.Material){const p=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),mat);p.rotation.x=-Math.PI/2;p.position.set((x0+x1)/2,y+.002,(z0+z1)/2);p.name=name;p.receiveShadow=true;
  const uv=p.geometry.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)*(x1-x0))/1.6,(uv.getY(i)*(z1-z0))/1.6);root.add(p);return p;}
 const L=d.length,[sx0,sx1]=f.stepsAcross as [number,number],[rx0,rx1]=f.rampAcross as [number,number];

 // Lane stub, a pale granite edge, and the porch slab; the lane is level, the passage floor stands one flight above it.
 tiledTop('lane-terracotta',-half-.6,half+.6,-3,-f.kerb,0,plainMat());
 box('granite-edge',0,.02,-f.kerb/2,d.width+1.2,.04,f.kerb,new THREE.MeshStandardMaterial({color:'#b7b2a4',roughness:1}));
 box('ground-slab',0,-.05,L/2-.2,d.width+.6,.1,L+.6,new THREE.MeshStandardMaterial({color:'#b9ae96',roughness:1}));

 // Three white-nosed steps: stacked rendered blocks, tiled treads and the dark edge bands read in IMG_2657/2574.
 const treads=plainMat();
 for(let i=0;i<f.risers;i++){
  // The third riser carries the landing itself (below), so only two plain treads stand between the lane and the landing.
  if(i===f.risers-1)break;
  const z0=i*f.treadDepth,h=(i+1)*f.riserHeight,zEnd=z0+f.treadDepth;
  box(`step-${i+1}-block`,(sx0+sx1)/2,h/2,(z0+zEnd)/2,sx1-sx0,h,zEnd-z0,white);
  tiledTop(`step-${i+1}-tread`,sx0,sx1,z0,z0+f.treadDepth,h,treads);
  // dark band along the nosing and down the side, set in from the white edge
  box(`step-${i+1}-band-front`,(sx0+sx1)/2,h+.004,z0+.035,sx1-sx0-.1,.004,.018,band);
  box(`step-${i+1}-band-ramp-side`,sx1-.04,h+.004,(z0+zEnd)/2,.018,.004,zEnd-z0-.04,band);
 }
 // Landing: paved in the Silvia offset pattern with blue-and-white inserts; dark band on its near edge.
 const landing=silviaPavingMaterial(),lz0=(f.risers-1)*f.treadDepth;
 const landingBlock=(name:string,x0:number,x1:number,z0:number,z1:number)=>{box(name+'-block',(x0+x1)/2,top/2,(z0+z1)/2,x1-x0,top,z1-z0,white);
  const p=new THREE.Mesh(setSilviaPavingUvs(new THREE.PlaneGeometry(x1-x0,z1-z0),(x,y)=>[x+(x0+x1)/2,-y+(z0+z1)/2]),landing);p.rotation.x=-Math.PI/2;p.position.set((x0+x1)/2,top+.002,(z0+z1)/2);p.name=name+'-floor';p.receiveShadow=true;root.add(p);};
 landingBlock('landing-steps-side',-half,sx1,lz0,L);
 box('landing-band',(sx0+sx1)/2,top+.004,lz0+.07,sx1-sx0-.1,.004,.018,band);
 landingBlock('landing-ramp-side',rx0,half,f.rampLength,L);
 // Beside the ramp the white render rises to the landing level only where the ramp has reached it.
 box('ramp-side-fill',(rx1+half)/2,top/2,f.rampLength/2,half-rx1,top,f.rampLength,white);
 // Red studded rubber ramp: a tilted plane from the lane edge up to the landing, with a pale joint grid every 0.5 m.
 const rampLen=Math.hypot(f.rampLength,top),rampTex=studTexture();rampTex.repeat.set((rx1-rx0)/.5,rampLen/.5);
 const ramp=new THREE.Mesh(new THREE.PlaneGeometry(rx1-rx0,rampLen),new THREE.MeshStandardMaterial({map:rampTex,color:'#c19088',bumpMap:rampTex,bumpScale:1.2,roughness:.85}));
 ramp.name='red-studded-rubber-ramp';ramp.rotation.x=-Math.PI/2-Math.atan2(top,f.rampLength);ramp.position.set((rx0+rx1)/2,top/2+.004,f.rampLength/2);ramp.castShadow=ramp.receiveShadow=true;root.add(ramp);
 // Landing continues flat to the arch, the pebble mat and the garden floor beyond it.
 const floorEnd=L,beyond=new THREE.Mesh(setSilviaPavingUvs(new THREE.PlaneGeometry(d.width,floorEnd-d.ceilingEnd+.6),(x,y)=>[x,-y]),landing);beyond.name='garden-floor';beyond.rotation.x=-Math.PI/2;beyond.position.set(0,top+.001,(d.ceilingEnd-.6+floorEnd)/2);root.add(beyond);
 const [p0,p1]=data.pebbleMat.along,pm=(p0+p1)/2,pt=pebbleTexture();pt.repeat.set(3,2);
 box('pebble-mat-border',0,top+.011,pm,data.pebbleMat.width+.07,.012,p1-p0+.07,new THREE.MeshStandardMaterial({color:'#9d9784',roughness:1}));
 box('pebble-mat',0,top+.019,pm,data.pebbleMat.width,.01,p1-p0,new THREE.MeshStandardMaterial({map:pt,roughness:1}));

 // Walls, flat ceiling and the stepped-base piers at the mouth.
 for(const s of [-1,1]){box('wall-'+s,s*(half+d.wall/2),cp/2,L/2-.1,d.wall,cp,L+.2,plaster);
  box('pier-'+s,s*(half-.02),cp/2,.12,.36,cp,.45,plaster);box('pier-plinth-'+s,s*(half-.04),.09,.12,.44,.18,.53,white);
  box('skirt-'+s,s*(half-.01),.09,L/2+.4,.04,.18,L-.8,white);}
 box('ceiling',0,cp+.15,d.ceilingEnd/2-.1,d.width+d.wall*2,.3,d.ceilingEnd+.2,plaster);
 // The arch with an inner opening narrower than the passage.
 const s=new THREE.Shape(),w=d.archWidth/2,outer=half+d.wall;s.moveTo(-outer,0);s.lineTo(-outer,cp);s.lineTo(outer,cp);s.lineTo(outer,0);s.lineTo(w,0);s.lineTo(w,d.archSpring);
 s.absellipse(0,d.archSpring,w,d.archCrown-d.archSpring,0,Math.PI,false);s.lineTo(-w,0);s.closePath();
 mesh(new THREE.ExtrudeGeometry(s,{depth:d.archDepth,bevelEnabled:false,curveSegments:36}).translate(0,top,-d.archDepth/2),plaster,'arch',0,0,d.ceilingEnd);

 // Brown panelled double doors and barred windows, set in both walls.
 const [a0,a1]=data.doors.along,dh=data.doors.height,span=a1-a0;
 for(const side of [-1,1]){
  const g=new THREE.Group();g.name='double-door-'+side;g.position.set(side*(half-.01),top+dh/2,(a0+a1)/2);g.rotation.y=-side*Math.PI/2;root.add(g);
  box('door-frame',0,dh/2-.02,0,span+.1,.1,.1,wood,g);for(const e of [-1,1])box('door-jamb',e*(span/2+.03),0,0,.08,dh+.06,.09,wood,g);
  for(const e of [-1,1]){const lw=span/2-.02;box('door-leaf',e*(lw/2+.01),0,0,lw,dh,.06,wood,g);
   for(const py of [dh*.2,-dh*.18])box('door-panel',e*(lw/2+.01),py,.04,lw*.66,dh*.3,.02,new THREE.MeshStandardMaterial({color:'#3a241b',roughness:.55}),g);}
  box('door-stile',0,0,.045,.03,dh,.03,new THREE.MeshStandardMaterial({color:'#251610'}),g);
  const [w0,w1]=data.windows.along,wm=(w0+w1)/2,ww=w1-w0;
  box('window-recess-'+side,side*(half-.03),top+data.windows.sill+data.windows.height/2,wm,.1,data.windows.height,ww,dark);
  for(let k=0;k<=6;k++)box('window-bar',side*(half-.09),top+data.windows.sill+data.windows.height/2,w0+.04+k*(ww-.08)/6,.012,data.windows.height,.014,band);
  for(let k=0;k<=8;k++)box('window-rail',side*(half-.09),top+data.windows.sill+k*data.windows.height/8,wm,.012,.014,ww,band);
  box('door-step-'+side,side*(half-.14),top+.022,(a0+a1)/2,.3,.044,span+.1,white);
 }

 // Plaque on the left wall, lanterns.
 const pq=data.plaques[variant],vertical=variant==='22-44',pw=vertical?.3:1.05,ph=vertical?1.2:.28;
 const plaque=mesh(new THREE.PlaneGeometry(pw,ph),new THREE.MeshStandardMaterial({map:plaqueTexture(pq.text,vertical),roughness:.7}),'plaque-'+variant,half-.012,top+pq.height,pq.along);plaque.rotation.y=-Math.PI/2;
 for(const z of data.lanterns[variant]){const l=new THREE.Group();l.name='hanging-lantern';l.position.set(0,top+data.lanterns.bottom,z);root.add(l);
  box('lantern-stem',0,.5,0,.02,.34,.02,dark,l);mesh(new THREE.ConeGeometry(.2,.12,4),dark,'lantern-roof',0,.3,0,l).rotation.y=Math.PI/4;
  box('lantern-glass',0,.14,0,.2,.26,.2,new THREE.MeshStandardMaterial({color:'#c9cdbd',transparent:true,opacity:.4}),l);for(const x of [-.11,.11])for(const zz of [-.11,.11])box('lantern-frame',x,.14,zz,.014,.28,.014,dark,l);}

 // 2-20 garden gate: two black bar leaves either side of a white pier, white lintel; the pier carries the house number.
 if(variant==='2-20'){const g=data.gate['2-20'],gz=g.along,y0=top;
  box('gate-pier',0,y0+g.height/2,gz,g.pierWidth,g.height,g.pierWidth,white);box('gate-pier-cap',0,y0+g.height+.04,gz,g.pierWidth+.08,.08,g.pierWidth+.08,white);
  box('gate-lintel',0,y0+g.height+.2,gz,g.leafWidth*2+g.pierWidth+.3,.12,.26,white);
  for(const side of [-1,1])for(let k=0;k<=9;k++)box('gate-bar',side*(g.pierWidth/2+.02+k*(g.leafWidth-.04)/9),y0+g.height*.45,gz,.014,g.height*.9,.014,dark);
  for(const side of [-1,1])for(const yy of [.12,g.height*.9])box('gate-rail',side*(g.pierWidth/2+g.leafWidth/2),y0+yy,gz,g.leafWidth,.02,.02,dark);
  mesh(new THREE.PlaneGeometry(.12,.1),new THREE.MeshStandardMaterial({map:plaqueTexture(['20'],false),roughness:.7}),'gate-number',0,y0+g.height*.72,gz-g.pierWidth/2-.005).rotation.y=Math.PI;
 }

 if(details)addPlanting(root,variant,box);
 return root;
}

function leafBall(root:THREE.Object3D,name:string,x:number,y:number,z:number,r:number,color:string,count=60,seed=0){
 const m=new THREE.InstancedMesh(new THREE.SphereGeometry(1,7,5),new THREE.MeshStandardMaterial({color,roughness:.9}),count);m.name=name;m.castShadow=true;
 const mat=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3(),sc=new THREE.Vector3();
 for(let i=0;i<count;i++){const a=hash(i,seed)*6.28,u=hash(i,seed+3),c=hash(i,seed+7);const rad=r*(.3+.7*Math.sqrt(u)),s=r*(.09+.08*c);v.set(x+Math.cos(a)*rad,y+(hash(i,seed+11)-.3)*r*.9,z+Math.sin(a)*rad);sc.set(s*1.3,s*.55,s);mat.compose(v,q.setFromEuler(new THREE.Euler(hash(i,2)*3,hash(i,4)*6,0)),sc);m.setMatrixAt(i,mat);}
 root.add(m);return m;
}
function pot(root:THREE.Object3D,name:string,x:number,y:number,z:number,r:number,h:number){
 const clay=new THREE.MeshStandardMaterial({color:'#b0694a',roughness:.96});
 const p=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.72,h,20),clay);p.position.set(x,y+h/2,z);p.name=name;p.castShadow=p.receiveShadow=true;root.add(p);
}
function addPlanting(root:THREE.Group,variant:RampVariant,box:Function){
 const white=new THREE.MeshStandardMaterial({color:'#f3f0e6',roughness:.95}),box2=new THREE.MeshStandardMaterial({color:'#d8cfb9',roughness:1});
 if(variant==='2-20'){
  // two large potted foliage plants beside the gate arch; begonia boxes on the porch ledge and landing (IMG_2669/2670)
  for(const s of [-1,1]){pot(root,'gate-pot-'+s,s*.85,top,5.75,.27,.5);leafBall(root,'gate-foliage-'+s,s*.85,top+1.0,5.75,.62,'#2e5a2c',90,s>0?1:2);}
  box('begonia-box-left',half-.22,top+.14,1.0,.3,.28,.9,box2);
  leafBall(root,'begonia-left',half-.22,top+.38,1.0,.42,'#3d6a35',40,3);leafBall(root,'begonia-flowers-left',half-.22,top+.5,1.0,.36,'#c9372f',14,5);
  leafBall(root,'bougainvillea-green',0,top+2.55,6.4,.9,'#3c6a37',70,12);leafBall(root,'bougainvillea-pink',0,top+2.7,6.3,.8,'#c2428f',60,13);
  pot(root,'begonia-pot-right',-half+.3,top,2.35,.24,.34);leafBall(root,'begonia-right',-half+.3,top+.6,2.35,.4,'#3d6a35',40,4);leafBall(root,'begonia-flowers-right',-half+.3,top+.7,2.35,.34,'#c9372f',14,6);
 }else{
  // rendered planter walls holding jade plants: left beside the ramp, right above the steps (IMG_2656/2657/2574)
  box('planter-wall-left',half-.19,.3,1.15,.38,.6,2.1,white);box('planter-cap-left',half-.19,.625,1.15,.42,.05,2.14,white);leafBall(root,'jade-left',half-.19,.85,1.15,.6,'#2d5a31',80,7);
  box('planter-wall-right',-half+.17,.425,1.45,.34,.85,1.7,white);box('planter-cap-right',-half+.17,.875,1.45,.38,.05,1.74,white);leafBall(root,'jade-right',-half+.17,1.1,1.45,.6,'#2d5a31',80,8);
  for(const s of [-1,1])leafBall(root,'garden-shrub-'+s,s*.9,top+.45,5.8,.5,'#315c2f',50,s>0?9:10);
 }
}
