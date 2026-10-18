import * as THREE from "three";
import data from "../data/door_sills.json";
import terrain from "../data/terrain.json";
import skeleton from "../public/map/skeleton.json";
import { closestOnSegment, pointInRing } from "./geom";
import { plasterMaterial, surfaceTexture } from "./materials";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

export const photographedSills = data.sills;
export const doorSillSurfaces = data.surfaces.map(s => ({...s, ring:s.ring as Vec2[]}));
export const doorSillAprons = data.aprons.map(s=>({...s,ring:s.ring as Vec2[]}));
export const doorSillKerbs = data.kerbs.map(k => ({...k, points:k.points as Vec2[]}));
export const doorSillDrains = data.drains;
export const southApproach = terrain.localSurfaces[0];
export const sillBase=data.datums.sillBase, roadBase=data.datums.roadBase;
const forbiddenGround=[...skeleton.buildings.filter(b=>b.floors>0&&!b.passage).map(b=>b.ring as Vec2[]),...skeleton.pools.map(p=>p.ring as Vec2[])];
const unit = (a:number[]) => { const l=Math.hypot(...a); return [a[0]/l,a[1]/l] as Vec2; };
const u=unit(southApproach.top.map((v,i)=>v-southApproach.foot[i])), n:Vec2=[-u[1],u[0]];
export const approachLength=Math.hypot(southApproach.top[0]-southApproach.foot[0],southApproach.top[1]-southApproach.foot[1]);
export const approachPoint=(along:number,across=0):Vec2=>[southApproach.foot[0]+u[0]*along+n[0]*across,southApproach.foot[1]+u[1]*along+n[1]*across];
export const approachHalfWidth=(s:number)=>southApproach.width/2+southApproach.flare*Math.max(0,1-s/1.2);
export const approachOutline:Vec2[]=[approachPoint(0,-approachHalfWidth(0)),approachPoint(1.2,-approachHalfWidth(1.2)),approachPoint(approachLength+southApproach.landing,-approachHalfWidth(approachLength)),approachPoint(approachLength+southApproach.landing,approachHalfWidth(approachLength)),approachPoint(1.2,approachHalfWidth(1.2)),approachPoint(0,approachHalfWidth(0))];
export const approachKerbLines:Vec2[][]=[-1,1].map(side=>Array.from({length:25},(_,i)=>{const a=(approachLength+southApproach.landing)*i/24;return approachPoint(a,side*approachHalfWidth(a));}));
export function sillOutline(s:typeof photographedSills[number]):Vec2[] {
  const a=unit(s.along),normal:Vec2=[-a[1],a[0]];
  return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>[s.center[0]+a[0]*i*s.width/2+normal[0]*j*s.depth/2,s.center[1]+a[1]*i*s.width/2+normal[1]*j*s.depth/2]);
}
/** Closed finite garden-door surrounds; these share their exact map and collision ring. */
export const sillDoorCenters=photographedSills.map(s=>{const a=unit(s.along),inward:Vec2=[a[1]*data.gardenDoor.inwardSign,-a[0]*data.gardenDoor.inwardSign],offset=s.depth/2+data.gardenDoor.backGap;return {...s,center:[s.center[0]+inward[0]*offset,s.center[1]+inward[1]*offset] as Vec2};});
export function sillDoorRings():Vec2[][] {return sillDoorCenters.map(s=>sillOutline({...s,width:data.gardenDoor.width,depth:data.gardenDoor.thickness}));}
export const sillToePoint=(s:typeof photographedSills[number]):Vec2=>{const a=unit(s.along),outward:Vec2=[-a[1]*data.gardenDoor.inwardSign,a[0]*data.gardenDoor.inwardSign],toe=s.depth/2-.015;return [s.center[0]+outward[0]*toe,s.center[1]+outward[1]*toe];};
// Reject remote routes before polygon/segment work; local correction remains finite.
const datumPoints=[...approachOutline,...photographedSills.flatMap(sillOutline),...doorSillSurfaces.flatMap(s=>s.ring),...doorSillAprons.flatMap(s=>s.ring),...doorSillDrains.map(d=>d.center)];
const datumReach=data.datums.fullApron+data.datums.blendApron;
const datumBounds={minX:Math.min(...datumPoints.map(p=>p[0]))-datumReach,maxX:Math.max(...datumPoints.map(p=>p[0]))+datumReach,minZ:Math.min(...datumPoints.map(p=>p[1]))-datumReach,maxZ:Math.max(...datumPoints.map(p=>p[1]))+datumReach};
export const approachOffset=(x:number,z:number):number=>{
  if(!pointInRing(x,z,approachOutline))return 0;
  const s=(x-southApproach.foot[0])*u[0]+(z-southApproach.foot[1])*u[1];
  return southApproach.rise*Math.max(0,Math.min(1,s/approachLength));
};
/** Low lips are stepped ground, never a new solid wall or a raised house floor. */
export function doorSillRise(x:number,z:number):number {
  let height=approachOffset(x,z);
  for(const s of doorSillSurfaces)if(pointInRing(x,z,s.ring))height=Math.max(height,s.rise);
  for(const s of photographedSills)if(pointInRing(x,z,sillOutline(s)))height=Math.max(height,s.rise);
  for(const k of doorSillKerbs)for(let i=1;i<k.points.length;i++)if(closestOnSegment(x,z,...k.points[i-1],...k.points[i]).d<k.width/2)height=Math.max(height,k.rise);
  if(Math.hypot(x-southApproach.top[0],z-southApproach.top[1])<approachLength+3)for(const side of [-1,1])for(let i=0;i<24;i++) {
    const a=(approachLength+southApproach.landing)*i/24,b=(approachLength+southApproach.landing)*(i+1)/24;
    const hit=closestOnSegment(x,z,...approachPoint(a,side*approachHalfWidth(a)),...approachPoint(b,side*approachHalfWidth(b)));
    if(hit.d<=southApproach.kerbWidth/2) {
      const along=(hit.x-southApproach.foot[0])*u[0]+(hit.z-southApproach.foot[1])*u[1];
      height=Math.max(height,southApproach.rise*Math.min(1,along/approachLength)+southApproach.kerbHeight);
    }
  }
  return height;
}
/** Reconcile only the new photographed surfaces and a finite adjacent apron.
 * The outer blend retains the inherited road/player mismatch as an explicit limit. */
export function doorSillGroundOffset(x:number,z:number):number {
  if(x<datumBounds.minX||x>datumBounds.maxX||z<datumBounds.minZ||z>datumBounds.maxZ)return 0;
  const gap=(ring:Vec2[])=>pointInRing(x,z,ring)?0:Math.min(...ring.map((a,i)=>closestOnSegment(x,z,...a,...ring[(i+1)%ring.length]).d));
  const weight=(d:number)=>Math.max(0,Math.min(1,1-(d-data.datums.fullApron)/data.datums.blendApron));
  const sillDistance=Math.min(...photographedSills.map(s=>gap(sillOutline(s))));
  const roadDistance=Math.min(gap(approachOutline),...doorSillSurfaces.map(s=>gap(s.ring)),...doorSillAprons.map(s=>gap(s.ring)),...doorSillDrains.map(d=>Math.hypot(x-d.center[0],z-d.center[1])));
  if(Math.min(sillDistance,roadDistance)>=data.datums.fullApron+data.datums.blendApron||forbiddenGround.some(r=>pointInRing(x,z,r)))return 0;
  const datum=roadDistance<sillDistance?weight(roadDistance)*(roadBase-data.datums.legacyPlayerBase):weight(sillDistance)*(sillBase-data.datums.legacyPlayerBase);
  return datum+doorSillRise(x,z);
}
/** Suppress illustrative objects on the finite photographed surfaces. */
export function inDoorSillReview(x:number,z:number):boolean {
  return pointInRing(x,z,approachOutline)||[...doorSillSurfaces,...doorSillAprons].some(s=>pointInRing(x,z,s.ring))||photographedSills.some(s=>Math.hypot(x-s.center[0],z-s.center[1])<1);
}
/** Original irregular flagstone drawing; never sampled from reference imagery. */
function flagstoneTexture():THREE.CanvasTexture {
  const canvas=document.createElement("canvas");canvas.width=canvas.height=256;const g=canvas.getContext("2d")!;
  g.fillStyle="#9b9a8c";g.fillRect(0,0,256,256);g.lineWidth=3;g.strokeStyle="#a6a495";
  for(let row=-1;row<5;row++)for(let col=-1;col<5;col++){
    const x=col*64+(row%2)*26,y=row*64,v=Math.abs((row*17+col*13)%6)*4;
    g.fillStyle=`rgb(${151+v},${152+v},${140+v})`;g.beginPath();g.moveTo(x+7,y+4);g.lineTo(x+51,y+1);g.lineTo(x+70,y+33);g.lineTo(x+52,y+61);g.lineTo(x+3,y+65);g.lineTo(x-8,y+28);g.closePath();g.fill();g.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.setScalar(.65);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export function addDoorSills(scene:THREE.Scene,details:boolean):void {
  const white=plasterMaterial("#fffdf3"), stone=flagstoneTexture();
  const surface=(ring:Vec2[],height:(x:number,z:number)=>number,finish:string,id:string)=>{
    const geometry=new THREE.ShapeGeometry(new THREE.Shape(ring.map(([x,z])=>new THREE.Vector2(x,-z)))).rotateX(-Math.PI/2);
    const p=geometry.getAttribute("position"),uv=geometry.getAttribute("uv");
    for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,height(x,z)+siteY(x,z));uv.setXY(i,x,z);}
    geometry.computeVertexNormals();
    const material=new THREE.MeshStandardMaterial({color:finish==="lawn"?"#718658":finish==="asphalt"?"#7f8384":"#ffffff",map:finish==="white"||finish==="asphalt"?undefined:finish==="flagstone"?stone:surfaceTexture(finish==="lawn"?"turf":"paving"),roughness:1,side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;mesh.userData.noDrape=true;mesh.userData.referenceSurface=id;mesh.userData.doorSillFeature=id;scene.add(mesh);
  };
  const bar=(a:Vec2,b:Vec2,width:number,depth:number,y:number,material:THREE.Material,id:string)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(b[0]-a[0],b[1]-a[1]),depth,width),material);
    mesh.position.set((a[0]+b[0])/2,y+siteY((a[0]+b[0])/2,(a[1]+b[1])/2),(a[1]+b[1])/2);mesh.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);mesh.receiveShadow=mesh.castShadow=true;mesh.userData.noDrape=true;mesh.userData.doorSillFeature=id;scene.add(mesh);
  };
  // The continuous walkable slope is structural in both views; no stair treads.
  for(let i=0;i<24;i++) {
    const a=approachLength*i/24,b=approachLength*(i+1)/24;
    surface([approachPoint(a,-approachHalfWidth(a)),approachPoint(b,-approachHalfWidth(b)),approachPoint(b,approachHalfWidth(b)),approachPoint(a,approachHalfWidth(a))],(x,z)=>roadBase+southApproach.rise*((x-southApproach.foot[0])*u[0]+(z-southApproach.foot[1])*u[1])/approachLength,"flagstone",southApproach.id);
  }
  surface([approachPoint(approachLength,-approachHalfWidth(approachLength)),approachPoint(approachLength+southApproach.landing,-approachHalfWidth(approachLength)),approachPoint(approachLength+southApproach.landing,approachHalfWidth(approachLength)),approachPoint(approachLength,approachHalfWidth(approachLength))],()=>roadBase+southApproach.rise,"flagstone",southApproach.id+"-landing");
  // Restore the photographed kerb-to-asphalt contact only over this finite frontage.
  for(const apron of doorSillAprons)surface(apron.ring,()=>roadBase,"asphalt",apron.id);
  // Only the two photographed closed doors, each in a short finite white surround.
  const wood=new THREE.MeshStandardMaterial({color:"#704d34",roughness:1});
  for(const s of sillDoorCenters){
    const a=unit(s.along),width=data.gardenDoor.width,leaf=data.gardenDoor.leafWidth,height=data.gardenDoor.height,leafHeight=data.gardenDoor.leafHeight;
    const segment=(lo:number,hi:number,depth:number,y:number,h:number,material:THREE.Material,suffix:string)=>bar([s.center[0]+a[0]*lo,s.center[1]+a[1]*lo],[s.center[0]+a[0]*hi,s.center[1]+a[1]*hi],depth,h,y,material,s.id+suffix);
    for(const side of [-1,1])segment(side*leaf/2,side*width/2,data.gardenDoor.thickness,sillBase+height/2,height,white,"-door-jamb");
    segment(-leaf/2,leaf/2,data.gardenDoor.thickness,sillBase+leafHeight+(height-leafHeight)/2,height-leafHeight,white,"-door-head");
    segment(-leaf/2,leaf/2,data.gardenDoor.thickness,sillBase+s.rise+leafHeight/2,leafHeight,wood,"-closed-door");
  }
  if(!details)return;
  for(const s of photographedSills){
    const a=unit(s.along),end=(sign:number):Vec2=>[s.center[0]+a[0]*sign*s.width/2,s.center[1]+a[1]*sign*s.width/2];
    bar(end(-1),end(1),s.depth,s.rise,sillBase+s.rise/2,white,s.id);
    if(s.finish==="terracotta")surface(sillOutline(s),()=>sillBase+.001+s.rise,"terracotta",s.id+"-red-tread");
  }
  for(const s of doorSillSurfaces)surface(s.ring,()=>roadBase+s.rise,s.finish,s.id);
  for(const k of doorSillKerbs)for(let i=1;i<k.points.length;i++)bar(k.points[i-1],k.points[i],k.width,k.rise,roadBase+k.rise/2,white,k.id);
  const dark=new THREE.MeshStandardMaterial({color:"#39403e",roughness:.9});
  for(const d of doorSillDrains){const a=unit(d.along),at=(sign:number):Vec2=>[d.center[0]+a[0]*sign*d.width/2,d.center[1]+a[1]*sign*d.width/2];bar(at(-1),at(1),d.depth,.012,roadBase-.004+(d.id.includes("arch")?.12:0),dark,d.id);}
  // Exact slope at both ends; horizontal bars would float above their ground sampler.
  for(const side of [-1,1])for(let i=0;i<24;i++){
    const a=(approachLength+southApproach.landing)*i/24,b=(approachLength+southApproach.landing)*(i+1)/24;
    const p=approachPoint(a,side*approachHalfWidth(a)),q=approachPoint(b,side*approachHalfWidth(b));
    const len=Math.hypot(q[0]-p[0],q[1]-p[1]),nx=-(q[1]-p[1])/len*southApproach.kerbWidth/2,nz=(q[0]-p[0])/len*southApproach.kerbWidth/2;
    const ring:Vec2[]=[[p[0]+nx,p[1]+nz],[q[0]+nx,q[1]+nz],[q[0]-nx,q[1]-nz],[p[0]-nx,p[1]-nz]];
    surface(ring,(x,z)=>roadBase+southApproach.rise*Math.min(1,((x-southApproach.foot[0])*u[0]+(z-southApproach.foot[1])*u[1])/approachLength)+southApproach.kerbHeight,"white",southApproach.id+"-kerb");
    for(let j=0;j<4;j++){
      const c=ring[j],d=ring[(j+1)%4],height=(p:Vec2)=>roadBase+siteY(...p)+southApproach.rise*Math.min(1,((p[0]-southApproach.foot[0])*u[0]+(p[1]-southApproach.foot[1])*u[1])/approachLength);
      const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute([c[0],height(c),c[1],d[0],height(d),d[1],c[0],height(c)+southApproach.kerbHeight,c[1],c[0],height(c)+southApproach.kerbHeight,c[1],d[0],height(d),d[1],d[0],height(d)+southApproach.kerbHeight,d[1]],3));geometry.computeVertexNormals();
      const mesh=new THREE.Mesh(geometry,white);mesh.userData.noDrape=true;mesh.userData.doorSillFeature=southApproach.id+"-kerb";scene.add(mesh);
    }
  }
  const toe=[approachPoint(0,-approachHalfWidth(0)),approachPoint(southApproach.groovedToe,-approachHalfWidth(southApproach.groovedToe)),approachPoint(southApproach.groovedToe,approachHalfWidth(southApproach.groovedToe)),approachPoint(0,approachHalfWidth(0))];
  surface(toe,(x,z)=>roadBase+.004+southApproach.rise*((x-southApproach.foot[0])*u[0]+(z-southApproach.foot[1])*u[1])/approachLength,"white",southApproach.id+"-concrete-toe");
  for(let s=.07;s<southApproach.groovedToe;s+=.09)bar(approachPoint(s,-approachHalfWidth(s)+.10),approachPoint(s,approachHalfWidth(s)-.10),.018,.003,roadBase+.008+southApproach.rise*s/approachLength,new THREE.MeshStandardMaterial({color:"#777970"}),southApproach.id+"-toe-groove");
}
