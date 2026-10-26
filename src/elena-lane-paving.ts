import * as THREE from 'three';
import data from '../data/elena_lane_paving.json';
import {pavingCanvas} from './materials';
import {closestOnSegment} from './geom';
import type {Vec2} from './types';

type Lane = {id?:string;points:Vec2[];width:number};
export const elenaPavingFor=(road:Pick<Lane,'id'>)=>data.features.find(f=>f.roadId===road.id);
let texture:THREE.CanvasTexture|undefined;
/** Crop a three-by-three repeat from the original plain square swatch. No indoor inserts. */
export function elenaPavingTexture():THREE.CanvasTexture {
 if(texture)return texture;
 const base=pavingCanvas(768),canvas=document.createElement('canvas');canvas.width=canvas.height=576;
 canvas.getContext('2d')!.drawImage(base,0,0);
 texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=8;
 return texture;
}
/** Arc length follows the path. Cross-path coordinates fit three cells to the existing width.
 * The resulting model pitch is not a measured tile dimension. */
export function elenaPavingUv(road:Lane,x:number,z:number):[number,number]{
 let best=Infinity,along=0,found:[number,number]=[0,0];
 for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1],b=road.points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(!length)continue;
  const hit=closestOnSegment(x,z,...a,...b);
  if(hit.d<best){best=hit.d;const cross=(-(x-hit.x)*dz+(z-hit.z)*dx)/length;
   found=[cross/road.width+.5,(along+Math.hypot(hit.x-a[0],hit.z-a[1]))/road.width];}
  along+=length;
 }
 return found;
}
export function applyElenaPavingUv(geometry:THREE.BufferGeometry,road:Lane):void{
 const p=geometry.getAttribute('position'),uv=[];
 for(let i=0;i<p.count;i++)uv.push(...elenaPavingUv(road,p.getX(i),p.getZ(i)));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
}
/** Same two longitudinal joints and square-course pitch in the canonical map. */
export function elenaGridLines(road:Lane):Vec2[][]{
 const lines:Vec2[][]=[];
 for(const side of [-1,1])lines.push(road.points.map((p,i)=>{
  const a=road.points[Math.max(0,i-1)],b=road.points[Math.min(road.points.length-1,i+1)],l=Math.hypot(b[0]-a[0],b[1]-a[1]);
  return [p[0]-(b[1]-a[1])/l*road.width/6*side,p[1]+(b[0]-a[0])/l*road.width/6*side];
 }));
 const pitch=road.width/3;let distance=0,next=pitch;
 for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1],b=road.points[i],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);if(!l)continue;
  for(;next<distance+l;next+=pitch){const t=(next-distance)/l,x=a[0]+dx*t,z=a[1]+dz*t;
   lines.push([[x-dz/l*road.width/2,z+dx/l*road.width/2],[x+dz/l*road.width/2,z-dx/l*road.width/2]]);}
  distance+=l;
 }
 return lines;
}
/** Repaint only the existing paving mask beneath these ribbons, so visible terrain agrees. */
export function paintElenaPaving(ctx:CanvasRenderingContext2D,roads:Lane[],centre:{x:number;z:number},span:number,size:number):void{
 const scale=size/(span*2),image=elenaPavingTexture().image as HTMLCanvasElement;
 for(const road of roads){const spec=elenaPavingFor(road);if(!spec)continue;
  const swatch=document.createElement('canvas');swatch.width=swatch.height=Math.max(3,Math.round(road.width*scale));
  swatch.getContext('2d')!.drawImage(image,0,0,swatch.width,swatch.height);const pattern=ctx.createPattern(swatch,'repeat')!;
  let along=0;
  for(let i=1;i<road.points.length;i++){
   const a=road.points[i-1],b=road.points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
   ctx.save();ctx.translate((a[0]-centre.x+span)*scale,(a[1]-centre.z+span)*scale);ctx.rotate(Math.atan2(b[1]-a[1],b[0]-a[0]));
   ctx.fillStyle=spec.marginColor;ctx.fillRect(0,-(road.width+.12)/2*scale,length*scale,(road.width+.12)*scale);
   ctx.translate(-along*scale,-road.width/2*scale);ctx.fillStyle=pattern;ctx.fillRect(along*scale,0,length*scale,road.width*scale);ctx.restore();along+=length;
  }
 }
}
/** Opt-in scene diagnostic: inspect the actual first ground hit, including overlaps. */
export function elenaSurfaceSamples(scene:THREE.Scene,roads:Lane[],standY:(x:number,z:number)=>number){
 scene.updateMatrixWorld(true);const ray=new THREE.Raycaster(),samples=[],surfaces:THREE.Object3D[]=[];
 scene.traverseVisible(o=>{if((o as THREE.Mesh).isMesh&&!o.name.startsWith('route:'))surfaces.push(o);});
 for(const road of roads){if(!elenaPavingFor(road))continue;
  const lengths=road.points.slice(1).map((b,i)=>Math.hypot(b[0]-road.points[i][0],b[1]-road.points[i][1]));
  const total=lengths.reduce((a,b)=>a+b,0);
  for(const fraction of [.1,.5,.9]){
   let distance=total*fraction,index=0;while(index<lengths.length-1&&distance>lengths[index])distance-=lengths[index++];
   const a=road.points[index],b=road.points[index+1],t=distance/lengths[index],x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,ground=standY(x,z);
   ray.set(new THREE.Vector3(x,ground+1.2,z),new THREE.Vector3(0,-1,0));ray.far=3;
   const hit=ray.intersectObjects(surfaces,false)[0];
   samples.push({road:road.id,fraction,x,z,firstHit:hit?.object.name??null,paving:!!hit?.object.userData.elenaPaving,uv:hit?.uv?.toArray(),visibleFloorY:hit?.point.y??null,playerFloorY:ground});
  }
 }
 return samples;
}
