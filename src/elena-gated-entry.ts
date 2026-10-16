import * as THREE from "three";
import entry from "../data/elena_gated_entry.json";
import { plasterMaterial } from "./materials";
import { addSprites } from "./sprites";
import type { Vec2 } from "./types";

export const elenaEntry = entry;
export const elenaEntryRing = entry.ring as Vec2[];
const [a,b] = entry.points as Vec2[];
const length = Math.hypot(b[0]-a[0],b[1]-a[1]);
const along: Vec2 = [(b[0]-a[0])/length,(b[1]-a[1])/length];
const at = (offset:number):Vec2 => [(a[0]+b[0])/2+along[0]*offset,(a[1]+b[1])/2+along[1]*offset];
function strip(p:Vec2,q:Vec2,width:number):Vec2[] {
 const dx=(q[1]-p[1])/Math.hypot(q[0]-p[0],q[1]-p[1])*width/2;
 const dz=-(q[0]-p[0])/Math.hypot(q[0]-p[0],q[1]-p[1])*width/2;
 return [[p[0]+dx,p[1]+dz],[q[0]+dx,q[1]+dz],[q[0]-dx,q[1]-dz],[p[0]-dx,p[1]-dz]];
}
/** The closed private gates are solid; no wall crosses the covered passage. */
export const elenaEntryRings = ():Vec2[][] => [strip(a,b,entry.thickness)];
export function addElenaGatedEntry(scene:THREE.Scene):void {
 const plaster=plasterMaterial("#fffdf5"),iron=new THREE.MeshStandardMaterial({color:"#202622",roughness:.8});
 const slab=(p:Vec2,q:Vec2,h:number,w:number,y:number,mat:THREE.Material)=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(q[0]-p[0],q[1]-p[1]),h,w),mat);
  mesh.position.set((p[0]+q[0])/2,y+h/2,(p[1]+q[1])/2);mesh.rotation.y=-Math.atan2(q[1]-p[1],q[0]-p[0]);
  mesh.name=entry.id;mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);
 };
 // Two piers and a centre mullion, with a shallow shaped white lintel above.
 for(const offset of [-1.06,0,1.06])slab(at(offset-entry.pierWidth/2),at(offset+entry.pierWidth/2),entry.height,entry.thickness,0,plaster);
 for(const side of [-1,1]){
  const lo=side<0?-.9:.16,hi=side<0?-.16:.9;
  for(let o=lo+.06;o<hi;o+=.14)slab(at(o-.012),at(o+.012),1.8,.025,.12,iron);
  for(const y of [.12,.85,1.9])slab(at(lo),at(hi),.035,.04,y,iron);
 }
 const head=new THREE.Shape();head.moveTo(-length/2,entry.height-.12);head.lineTo(length/2,entry.height-.12);
 head.lineTo(length/2,entry.height+.1);head.quadraticCurveTo(length/4,entry.height+.25,0,entry.height+.1);
 head.quadraticCurveTo(-length/4,entry.height+.25,-length/2,entry.height+.1);head.closePath();
 const lintel=new THREE.Mesh(new THREE.ExtrudeGeometry(head,{depth:entry.thickness,bevelEnabled:false}).translate(0,0,-entry.thickness/2),plaster);
 const c=at(0);lintel.position.set(c[0],0,c[1]);lintel.rotation.y=-Math.atan2(along[1],along[0]);lintel.name=entry.id;scene.add(lintel);
 // Pattern follows the photographed red squares with small white/blue inserts.
 const canvas=document.createElement("canvas");canvas.width=canvas.height=128;const ctx=canvas.getContext("2d")!;
 ctx.fillStyle="#a75c3c";ctx.fillRect(0,0,128,128);ctx.strokeStyle="#d1b595";ctx.lineWidth=3;ctx.strokeRect(0,0,128,128);
 ctx.fillStyle="#eee5cf";ctx.fillRect(53,53,22,22);ctx.strokeStyle="#42616b";ctx.lineWidth=2;ctx.strokeRect(57,57,14,14);ctx.beginPath();ctx.arc(64,64,4,0,Math.PI*2);ctx.stroke();
 const tex=new THREE.CanvasTexture(canvas);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(1/.42,1/.42);tex.colorSpace=THREE.SRGBColorSpace;
 const shape=new THREE.Shape(elenaEntryRing.map(([x,z])=>new THREE.Vector2(x,-z)));
 const paving=new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:tex,roughness:.9}));
 paving.position.y=.075;paving.name=entry.id+"-tiles";paving.receiveShadow=true;scene.add(paving);
 // addSprites enforces Details-only visibility and the shared route-clearance guard.
 addSprites(scene,"bougainvillea",entry.planting);
}
