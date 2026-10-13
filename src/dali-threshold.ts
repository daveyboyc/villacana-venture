import * as THREE from "three";
import threshold from "../data/dali_cervantes_threshold.json";
import {closestOnSegment,pointInRing} from "./geom";
import {plasterMaterial,surfaceTexture} from "./materials";
import type {Vec2} from "./types";

export const daliThresholdZones=threshold.zones.map(z=>({...z,ring:z.ring as Vec2[]}));
export const daliThresholdKerbs=threshold.kerbs.map(k=>({...k,points:k.points as Vec2[]}));
export const daliPrivateEdge=threshold.privateFrontageEdge as Vec2[];
export const DALI_THRESHOLD_COLORS:Record<string,string>={bays:"#858a88",lawn:"#718658",footpath:"#c7977c",crossing:"#d8ad91"};
export const inDaliThreshold=(x:number,z:number)=>daliThresholdZones.some(q=>pointInRing(x,z,q.ring));

/** Clip bay paint to reviewed asphalt; leave the rest of Dalí unchanged. */
export function daliBayStripeParts(a:Vec2,b:Vec2):[Vec2,Vec2][] {
  const [u,v]=threshold.reviewAxis as Vec2[];
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(length/.08);
  const point=(t:number):Vec2=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const parts:[Vec2,Vec2][]=[];let start:number|undefined;
  for(let i=0;i<steps;i++) {
    const [x,z]=point((i+.5)/steps),hit=closestOnSegment(x,z,...u,...v);
    const reviewed=hit.d<9 && Math.hypot(hit.x-u[0],hit.z-u[1])>.05 && Math.hypot(hit.x-v[0],hit.z-v[1])>.05;
    const keep=!reviewed||daliThresholdZones.some(q=>q.kind==="bays"&&pointInRing(x,z,q.ring));
    if(keep&&start===undefined)start=i/steps;
    if(start!==undefined&&(!keep||i===steps-1)) {parts.push([point(start),point(keep?(i+1)/steps:i/steps)]);start=undefined;}
  }
  return parts;
}

export function addDaliThreshold(scene:THREE.Scene):void {
  for(const zone of daliThresholdZones) {
    const shape=new THREE.Shape(zone.ring.map(([x,z])=>new THREE.Vector2(x,-z)));
    const geometry=new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2);
    const positions=geometry.getAttribute("position"),uv=geometry.getAttribute("uv");
    for(let i=0;i<positions.count;i++)uv.setXY(i,positions.getX(i),positions.getZ(i));
    const map=zone.kind==="bays"?undefined:surfaceTexture(zone.kind==="lawn"?"turf":"paving");
    const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:zone.kind==="footpath"||zone.kind==="crossing"?"#ffffff":DALI_THRESHOLD_COLORS[zone.kind],map,roughness:1}));
    mesh.position.y=.278;mesh.receiveShadow=true;mesh.userData.referenceSurface=zone.id;scene.add(mesh);
  }
  const white=plasterMaterial("#fffdf3");
  for(const kerb of daliThresholdKerbs)for(let i=1;i<kerb.points.length;i++) {
    const a=kerb.points[i-1],b=kerb.points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if(length<.01)continue;
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(length,kerb.height,kerb.width),white);
    mesh.position.set((a[0]+b[0])/2,.275+kerb.height/2,(a[1]+b[1])/2);mesh.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);
    mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);
  }
}
