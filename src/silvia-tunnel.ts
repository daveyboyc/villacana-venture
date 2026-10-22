import * as THREE from "three";
import data from "../data/silvia_tunnel.json";
import {routeClearance} from "./route-clearance";
import {plasterMaterial} from "./materials";
import type {Vec2} from "./types";

export const silviaTunnel=data;
const d=data.dimensions, half=d.width/2;
const rect=(x:number,z:number,w:number,l:number):Vec2[]=>[[x-w/2,z-l/2],[x+w/2,z-l/2],[x+w/2,z+l/2],[x-w/2,z+l/2]];
export function tunnelWallParts(){
 const parts:{id:string;x:number;z:number;w:number;l:number}[]=[];
 for(const side of [-1,1]){
  let start=0;
  for(const e of data.entrances.filter(e=>e.side===side).sort((a,b)=>a.along[0]-b.along[0])){
   const [a,b]=e.along;
   if(a>start)parts.push({id:`wall-${side}-${start}`,x:side*(half+d.wall/2),z:(start+a)/2,w:d.wall,l:a-start});
   for(const t of [a,b])parts.push({id:`${e.id}-return-${t}`,x:side*(half+e.depth/2),z:t,w:e.depth+d.wall,l:d.wall});
   parts.push({id:`${e.id}-closed-door`,x:side*(half+e.depth),z:(a+b)/2,w:.1,l:b-a});start=b;
  }
  parts.push({id:`wall-${side}-end`,x:side*(half+d.wall/2),z:(start+d.length)/2,w:d.wall,l:d.length-start});
 }
 return parts;
}
export const silviaTunnelRings=()=>tunnelWallParts().map(p=>rect(p.x,p.z,p.w,p.l));

/** Original procedural textures: no source-photo pixels are used. */
function texture(draw:(g:CanvasRenderingContext2D,n:number)=>void,n=1024){const c=document.createElement('canvas');c.width=c.height=n;draw(c.getContext('2d')!,n);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
function tileTexture(){return texture((g,n)=>{
 const u=n/8;g.fillStyle='#b8ae96';g.fillRect(0,0,n,n);
 for(let j=-1;j<9;j++)for(let i=-1;i<9;i++){
  const x=i*u,y=j*u,cut=u*.115,v=(i*23+j*17+300)%9;
  g.fillStyle=`rgb(${163+v*4},${82+v*3},${49+v*2})`;
  g.beginPath();g.moveTo(x+cut,y+2);g.lineTo(x+u-cut,y+2);g.lineTo(x+u-2,y+cut);g.lineTo(x+u-2,y+u-cut);g.lineTo(x+u-cut,y+u-2);g.lineTo(x+cut,y+u-2);g.lineTo(x+2,y+u-cut);g.lineTo(x+2,y+cut);g.closePath();g.fill();
  for(let k=0;k<24;k++){g.fillStyle=k%2?'#ffffff07':'#381b1709';g.fillRect(x+5+(k*17%110),y+5+(k*29%110),18,2);}
  const q=cut*1.45;g.fillStyle='#eee9d8';g.fillRect(x-q,y-q,q*2,q*2);g.strokeStyle='#224c75';g.lineWidth=1.7;g.strokeRect(x-q*.8,y-q*.8,q*1.6,q*1.6);
  g.save();g.translate(x,y);g.rotate((i+j)%2?Math.PI/4:0);g.fillStyle='#254b6a';for(let k=0;k<4;k++){g.rotate(Math.PI/2);g.beginPath();g.ellipse(q*.35,0,q*.31,q*.13,0,0,Math.PI*2);g.fill();}g.restore();
 }
 });}
function pebbleTexture(){return texture((g,n)=>{g.fillStyle='#9d9987';g.fillRect(0,0,n,n);for(let j=0;j<100;j++)for(let i=0;i<85;i++){const x=(i+.5*(j%2))*n/85,y=j*n/100;g.fillStyle=['#c9c4af','#4c5149','#e7e0c9','#818574'][(i*7+j*3)%4];g.beginPath();g.ellipse(x,y,3.1,4.7,(i+j)*.9,0,Math.PI*2);g.fill();}});}
function woodTexture(){return texture((g,n)=>{g.fillStyle='#775a40';g.fillRect(0,0,n,n);for(let i=0;i<550;i++){g.strokeStyle=i%2?'#b79c6a12':'#1b160e18';g.lineWidth=i%3+1;const x=(i*31.7)%n;g.beginPath();g.moveTo(x,0);g.bezierCurveTo(x+9,n*.3,x-8,n*.7,x,n);g.stroke();}},512);}

export function createSilviaTunnel(details=true){
 const root=new THREE.Group();root.name=data.id;root.userData.noDrape=true;root.userData.sourceFrame=data.frame;
 const plaster=plasterMaterial('#f4f2e9');plaster.bumpScale=.006;
 const trim=new THREE.MeshStandardMaterial({color:'#f8f5e9',roughness:.88});
 const wood=new THREE.MeshStandardMaterial({color:'#d2bfa1',map:woodTexture(),roughness:.83});
 const dark=new THREE.MeshStandardMaterial({color:'#22282a',roughness:.7});
 const brass=new THREE.MeshStandardMaterial({color:'#a79b6e',metalness:.65,roughness:.35});
 function mesh(geo:THREE.BufferGeometry,mat:THREE.Material,name:string,x=0,y=0,z=0,parent:THREE.Object3D=root){const m=new THREE.Mesh(geo,mat);m.name=name;m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function box(name:string,x:number,y:number,z:number,w:number,h:number,l:number,mat:THREE.Material=plaster,parent:THREE.Object3D=root){return mesh(new THREE.BoxGeometry(w,h,l),mat,name,x,y,z,parent);}
 // A level slab, flat ceiling and actual U-shaped recess returns, not doors painted on a wall.
 const tiles=tileTexture();tiles.wrapS=tiles.wrapT=THREE.RepeatWrapping;tiles.repeat.set((d.width+2.2)/2.4,(d.length+2.5)/2.4);
 const floor=new THREE.MeshStandardMaterial({map:tiles,roughness:.83});
 box('T05-patterned-floor',0,.025,d.length/2,d.width+2.2,.05,d.length+2.5,floor);
 box('T02-flat-ceiling',0,d.ceiling+.15,d.length/2,d.width+2.1,.3,d.length);
 for(const p of tunnelWallParts()){
  if(p.id.endsWith('closed-door'))continue;
  box('T03-'+p.id,p.x,d.ceiling/2,p.z,p.w,d.ceiling,p.l);
  box('T03-belt-'+p.id,p.x-(Math.sign(p.x)*.025),1.08,p.z,p.w+.075,.085,p.l,trim);
  box('T03-skirt-'+p.id,p.x,.11,p.z,p.w+.035,.15,p.l,trim);
 }
 for(const e of data.entrances){
  const [a,b]=e.along,span=b-a,x=e.side*(half+e.depth),z=(a+b)/2;
  box(e.id+'-soffit',e.side*(half+e.depth/2),(e.doorHeight+d.ceiling)/2,z,e.depth+d.wall,d.ceiling-e.doorHeight,span);
  box(e.id+'-threshold',e.side*(half+e.depth/2),.065,z,e.depth,.045,span,trim);
  const door=new THREE.Group();door.name=e.id+'-brown-wooden-door';door.position.set(x,e.doorHeight/2+.06,z);door.rotation.y=Math.PI/2;root.add(door);
  // Every entrance uses one normal-width leaf, including the wider near bays.
  const leafWidth=Math.min(data.doorLeafWidth,span-.1),infill=(span-leafWidth)/2;
  box(e.id+'-leaf',0,0,0,leafWidth,e.doorHeight,.085,wood,door);
  for(const side of [-1,1])box(e.id+'-door-side-infill',side*(leafWidth+infill)/2,0,0,infill,e.doorHeight+.05,.1,plaster,door);
  const gold=new THREE.MeshStandardMaterial({color:'#d8ad42',metalness:.72,roughness:.26});
  const knobX=leafWidth*.34*e.knobSide,inward=-e.side;
  const plate=mesh(new THREE.CylinderGeometry(.047,.047,.012,24),gold,'round-gold-backplate',knobX,-e.doorHeight/2+1.02,inward*.053,door);plate.rotation.x=Math.PI/2;
  const stem=mesh(new THREE.CylinderGeometry(.012,.012,.04,16),gold,'gold-knob-stem',knobX,-e.doorHeight/2+1.02,inward*.078,door);stem.rotation.x=Math.PI/2;
  mesh(new THREE.SphereGeometry(.043,24,16),gold,'round-gold-knob',knobX,-e.doorHeight/2+1.02,inward*.107,door);
  for(const u of [-leafWidth/2,leafWidth/2])box('door-frame',u,0,0,.055,e.doorHeight+.1,.14,wood,door);
  box('door-head',0,e.doorHeight/2,0,leafWidth+.06,.065,.14,wood,door);
 }
 // Arched portals with straight jambs, thick reveals and square horizontal impost bands.
 for(const [id,z] of [['T01',0],['T04',d.length]] as const){
  const s=new THREE.Shape(),w=half,outer=half+d.wall;
  s.moveTo(-outer,0);s.lineTo(-outer,d.ceiling);s.lineTo(outer,d.ceiling);s.lineTo(outer,0);s.lineTo(w,0);s.lineTo(w,d.archSpring);
  s.absellipse(0,d.archSpring,w,d.archCrown-d.archSpring,0,Math.PI,false);s.lineTo(-w,0);s.closePath();
  mesh(new THREE.ExtrudeGeometry(s,{depth:d.archDepth,bevelEnabled:false,curveSegments:40}).translate(0,0,-d.archDepth/2),plaster,id+'-arch',0,0,z);
  for(const side of [-1,1])box(id+'-impost',side*(half+d.wall/2),d.archSpring,z,d.wall+.12,.09,d.archDepth+.1,trim);
 }
 // One observed pebble rectangle, distinct from the patterned terracotta field.
 const inset=data.pebbleInset,mid=(inset.along[0]+inset.along[1])/2,len=inset.along[1]-inset.along[0];
 box('T05-pebble-border',0,.056,mid,inset.width+.1,.015,len+.1,trim);
 box('T05-pebble-inset',0,.067,mid,inset.width,.012,len,new THREE.MeshStandardMaterial({map:pebbleTexture(),roughness:1}));
 // Plaque and services remain on the entry's right wall, not a mirrored extra door.
 const sign=texture((g,n)=>{g.fillStyle='#eee8d8';g.fillRect(0,0,n,n);const words=['CALLE','SILVIA','1','15'],widths=[.25,.35,.12,.16];let x=n*.02;g.textAlign='center';g.textBaseline='middle';for(let i=0;i<4;i++){const w=widths[i]*n;g.fillStyle='#183a58';g.fillRect(x,n*.35,w,n*.3);g.strokeStyle='#faf5dd';g.lineWidth=3;g.strokeRect(x+4,n*.35+4,w-8,n*.3-8);g.fillStyle='#faf5dd';g.font=`${i<2?115:160}px Georgia`;g.fillText(words[i],x+w/2,n*.51,w-10);x+=w+n*.02;}});
 const plaque=mesh(new THREE.PlaneGeometry(1.25,1.25),new THREE.MeshStandardMaterial({map:sign,transparent:false,side:THREE.DoubleSide,roughness:.9}),'T09-CALLE-SILVIA-1-15',-half+.008,1.48,.9);plaque.rotation.y=Math.PI/2;
 box('T10-service-hatch',-half+.025,.36,.28,.045,.44,.34,trim);
 const hatchText=texture((g,n)=>{g.fillStyle='#dddccf';g.fillRect(0,0,n,n);g.strokeStyle='#a9a99e';g.lineWidth=15;g.strokeRect(30,30,n-60,n-60);g.fillStyle='#909487';g.font='100px Georgia';g.textAlign='center';g.fillText('AGUA',n/2,n*.46);g.fillText('POTABLE',n/2,n*.64);});
 const hatch=mesh(new THREE.PlaneGeometry(.32,.4),new THREE.MeshStandardMaterial({map:hatchText}),'T10-AGUA-POTABLE',-half+.051,.36,.28);hatch.rotation.y=Math.PI/2;
 for(let k=0;k<8;k++)box('T10-high-vent',-half+.015,2.68+k*.023,.6,.04,.011,.17,dark);
 // Hanging lantern: dark tapered roof, four frame posts, glass panes, lower finial.
 const lamp=new THREE.Group();lamp.name='T07-hanging-lantern';lamp.position.set(0,data.lantern.bottom,data.lantern.along);root.add(lamp);
 box('lantern-stem',0,.58,0,.025,.39,.025,dark,lamp);
 mesh(new THREE.ConeGeometry(.22,.12,4),dark,'lantern-roof',0,.36,0,lamp).rotation.y=Math.PI/4;
 mesh(new THREE.ConeGeometry(.12,.1,4),dark,'lantern-base',0,.025,0,lamp).rotation.z=Math.PI;
 const glass=new THREE.MeshStandardMaterial({color:'#c0c6b8',transparent:true,opacity:.38,roughness:.25,side:THREE.DoubleSide});
 box('lantern-glass',0,.2,0,.23,.27,.23,glass,lamp);
 for(const x of [-.13,.13])for(const z of [-.13,.13])box('lantern-frame',x,.2,z,.016,.3,.016,dark,lamp);
 mesh(new THREE.SphereGeometry(.04,8,6),brass,'lantern-bulb',0,.2,0,lamp);
 if(details){for(const p of data.pots){
  const radius=Math.max(p.radius*1.09,p.radius*1.4+.178);
  if(!routeClearance([{id:'silvia-study-axis',name:'Silvia study centre route',points:[[0,-1],[0,d.length+2]],width:.84}],p.at[0],p.at[1],radius))throw Error('Planting intrudes on tunnel route: '+p.id);
  addPot(root,p.at[0],p.at[1],p.radius,p.height,p.foliage,p.id);
 }}
 return root;
}

function addPot(root:THREE.Group,x:number,z:number,r:number,h:number,foliage:number,id:string){
 const group=new THREE.Group();group.name='T08-pot-'+id;group.position.set(x,.065,z);root.add(group);
 const clay=new THREE.MeshStandardMaterial({color:'#b16f4b',roughness:.96});
 const profile=[new THREE.Vector2(r*.67,0),new THREE.Vector2(r*.7,.04),new THREE.Vector2(r*.9,h*.82),new THREE.Vector2(r,h*.86),new THREE.Vector2(r,h*.98),new THREE.Vector2(r*.89,h),new THREE.Vector2(r*.83,h*.88)];
 const pot=new THREE.Mesh(new THREE.LatheGeometry(profile,28),clay);pot.castShadow=pot.receiveShadow=true;group.add(pot);
 const saucer=new THREE.Mesh(new THREE.CylinderGeometry(r*1.09,r*1.04,.05,28),clay);saucer.position.y=.015;group.add(saucer);
 const soil=new THREE.Mesh(new THREE.CylinderGeometry(r*.85,r*.85,.02,24),new THREE.MeshStandardMaterial({color:'#3b3022',roughness:1}));soil.position.y=h*.88;group.add(soil);
 // Woody branches and irregular rosettes, rather than horizontal leaf layers.
 const stemMaterial=new THREE.MeshStandardMaterial({color:'#6d6541',roughness:1});
 for(let b=0;b<7;b++){
  const a=b*2.399,top=new THREE.Vector3(Math.cos(a)*r*.9,h+foliage*(.55+(b%3)*.13),Math.sin(a)*r*.9),base=new THREE.Vector3(0,h*.65,0),delta=top.clone().sub(base);
  const branch=new THREE.Mesh(new THREE.CylinderGeometry(.012,.024,delta.length(),5),stemMaterial);branch.position.copy(base.add(top).multiplyScalar(.5));branch.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());group.add(branch);
 }
 const leaves=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,5),new THREE.MeshStandardMaterial({color:'#cad6b4',roughness:.94}),420);leaves.castShadow=leaves.receiveShadow=true;
 const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3(),euler=new THREE.Euler();
 for(let i=0;i<420;i++){
  const cluster=Math.floor(i/7),a=cluster*2.39996,u=((cluster*37)%61)/61,rad=Math.sqrt(Math.max(.05,1-Math.pow(u*1.8-.8,2)))*(r*1.4),spread=(i%7)*Math.PI*2/7;
  const bx=Math.cos(a)*rad,bz=Math.sin(a)*rad;
  v.set(bx+Math.cos(spread)*.08,h+.02+foliage*u,bz+Math.sin(spread)*.08);
  if(z>=0&&z<=d.length)v.x=THREE.MathUtils.clamp(v.x,-half+.13-x,half-.13-x);
  euler.set((i%5-2)*.28,spread,(i%3-1)*.35);q.setFromEuler(euler);matrix.compose(v,q,new THREE.Vector3(.098,.011,.039));leaves.setMatrixAt(i,matrix);leaves.setColorAt(i,new THREE.Color().setHSL(.22+(i%6)*.012,.19+(i%4)*.04,.29+(i%7)*.033));
 }
 group.add(leaves);
}
