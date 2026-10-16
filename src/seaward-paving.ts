import * as THREE from "three";
import data from "../data/seaward_paving.json";
import {pavingCanvas} from "./materials";
import type {Skeleton} from "./types";

/** Original drawings, never sampled imagery. Approximate 40 cm octagons and 30 cm indoor tiles. */
export function seawardPavingCanvas(kind:"octagonal"|"patterned",size=512):HTMLCanvasElement {
 const c=document.createElement("canvas");c.width=c.height=size;const g=c.getContext("2d")!;
 const u=size/4,j=size/180;
 g.fillStyle="#b4aa94";g.fillRect(0,0,size,size);
 for(let row=-1;row<5;row++)for(let col=-1;col<5;col++){
  const x=col*u,y=row*u,t=((row*7+col*13+100)%7)*2;
  g.fillStyle=`rgb(${169+t},${112+t},${85+t})`;
  if(kind==="octagonal"){
   const cut=u*.27;
   g.beginPath();g.moveTo(x+cut,y+j);g.lineTo(x+u-cut,y+j);g.lineTo(x+u-j,y+cut);g.lineTo(x+u-j,y+u-cut);g.lineTo(x+u-cut,y+u-j);g.lineTo(x+cut,y+u-j);g.lineTo(x+j,y+u-cut);g.lineTo(x+j,y+cut);g.closePath();g.fill();
   g.fillStyle="#9e7661";g.beginPath();g.moveTo(x,y-u*.21);g.lineTo(x+u*.21,y);g.lineTo(x,y+u*.21);g.lineTo(x-u*.21,y);g.closePath();g.fill();
  }else{
   // Small cream/blue decorated inserts at clipped corners, as in IMG_2185/2190.
   g.fillRect(x+j,y+j,u-2*j,u-2*j);
   const q=u*.22;g.fillStyle="#ede4c9";g.fillRect(x-q/2,y-q/2,q,q);
   g.strokeStyle="#203c62";g.lineWidth=j;g.strokeRect(x-q*.32,y-q*.32,q*.64,q*.64);
   g.beginPath();g.moveTo(x,y-q*.3);g.lineTo(x+q*.3,y);g.lineTo(x,y+q*.3);g.lineTo(x-q*.3,y);g.closePath();g.stroke();
  }
 }
 return c;
}

/** Paint only existing ground pixels; this creates no surfaces or collision. */
export function paintSeawardPaving(ctx:CanvasRenderingContext2D,skeleton:Pick<Skeleton,"buildings"|"viewRotation">,centre:{x:number;z:number},span:number,size:number):void {
 const scale=size/(span*2),px=(x:number)=>(x-centre.x+span)*scale,pz=(z:number)=>(z-centre.z+span)*scale;
 for(const f of data.features){
  ctx.save();ctx.beginPath();
  if(f.points){
   ctx.lineWidth=f.width!*scale;ctx.lineJoin="round";
   f.points.forEach(([x,z],i)=>i?ctx.lineTo(px(x),pz(z)):ctx.moveTo(px(x),pz(z)));
   // Stroke into a separate mask so adjacent lawn pixels are untouched by callers.
  }else{
   const ring=skeleton.buildings.find(b=>b.id===f.building)?.ring;
   if(!ring){ctx.restore();continue;}
   ring.forEach(([x,z],i)=>i?ctx.lineTo(px(x),pz(z)):ctx.moveTo(px(x),pz(z)));ctx.closePath();ctx.clip();
  }
  const swatch=document.createElement("canvas");swatch.width=swatch.height=Math.max(8,Math.round(scale*(f.kind==="octagonal"?1.6:1.2)));
  swatch.getContext("2d")!.drawImage(seawardPavingCanvas(f.kind as "octagonal"|"patterned"),0,0,swatch.width,swatch.height);
  const pattern=ctx.createPattern(swatch,"repeat")!;pattern.setTransform(new DOMMatrix().rotate(-skeleton.viewRotation));
  if(f.points){ctx.strokeStyle=pattern;ctx.stroke();}else{ctx.fillStyle=pattern;ctx.fillRect(0,0,size,size);}
  ctx.restore();
 }
}

export function seawardRoadTexture(road:{id?:string;points:number[][]}):THREE.CanvasTexture|undefined {
 if(road.id!=="teodoro-rojo")return;
 // World-aligned atlas changes only the photographed run, not the whole street.
 const minX=Math.min(...road.points.map(p=>p[0]))-2,minZ=Math.min(...road.points.map(p=>p[1]))-2;
 const extent=Math.max(...road.points.map(p=>p[0]-minX),...road.points.map(p=>p[1]-minZ))+2;
 const c=document.createElement("canvas");c.width=c.height=2048;const g=c.getContext("2d")!;
 const swatch=document.createElement("canvas");swatch.width=swatch.height=Math.round(2048/extent*1.6);swatch.getContext("2d")!.drawImage(pavingCanvas(),0,0,swatch.width,swatch.height);
 g.fillStyle=g.createPattern(swatch,"repeat")!;g.fillRect(0,0,2048,2048);
 paintSeawardPaving(g,{buildings:[],viewRotation:0},{x:minX+extent/2,z:minZ+extent/2},extent/2,2048);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.setScalar(1/extent);t.offset.set(-minX/extent,(minZ+extent)/extent);t.anisotropy=4;return t;
}
