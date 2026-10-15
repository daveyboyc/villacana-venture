import * as THREE from "three";
import data from "../data/north_pool.json";
import terrain from "../data/terrain.json";
import { pointInRing } from "./geom";
import { plasterMaterial, surfaceTexture } from "./materials";
import type { Vec2 } from "./types";

export const northPoolWalls=data.walls.map(w=>({...w,points:w.points as Vec2[]}));
export const northPoolPath={...data.path,points:data.path.points as Vec2[]};
export const northPoolSteps=data.stairs;
export const northPoolPatio=terrain.localPatios.find(p=>p.id==="north-pool-raised-patio")!;
export const northPoolRoutes=[northPoolPath,{id:northPoolSteps.id,name:northPoolSteps.name,points:[northPoolSteps.from,northPoolSteps.to] as Vec2[],width:northPoolSteps.width}];
const strip=(a:Vec2,b:Vec2,width:number):Vec2[]=>{
 const length=Math.hypot(b[0]-a[0],b[1]-a[1]), nx=(b[1]-a[1])/length*width/2,nz=-(b[0]-a[0])/length*width/2;
 return [[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]];
};
export const northPoolWallRings=()=>northPoolWalls.flatMap(w=>w.points.slice(1).map((b,i)=>strip(w.points[i],b,w.thickness)));
export const northPoolPathRings=()=>northPoolPath.points.slice(1).map((b,i)=>strip(northPoolPath.points[i],b,northPoolPath.width));
export const inNorthPoolReview=(x:number,z:number)=>data.review.rings.some(r=>pointInRing(x,z,r as Vec2[]));
export function suppressInNorthPoolReview<T extends {gardenWalls:Vec2[];gardenGates:Vec2[]}>(s:T):void {
 s.gardenWalls=s.gardenWalls.filter(([x,z])=>!inNorthPoolReview(x,z));
 s.gardenGates=s.gardenGates.filter(([x,z])=>!inNorthPoolReview(x,z));
}
const shape=(ring:Vec2[])=>new THREE.Shape(ring.map(([x,z])=>new THREE.Vector2(x,-z)));
/** The same flight rectangles are used by the ground sampler, mesh and blueprint. */
export function northPoolTreads():{ring:Vec2[];height:number}[]{
 const f=northPoolSteps, a=f.from as Vec2,b=f.to as Vec2;
 const at=(t:number):Vec2=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 return Array.from({length:f.count},(_,i)=>({ring:strip(at(i/f.count),at((i+1)/f.count),f.width),height:f.rise*(i+1)/f.count}));
}
export function addNorthPoolGarden(scene:THREE.Scene):void {
 const plaster=plasterMaterial("#fffdf5");
 const add=(ring:Vec2[],height:number,material:THREE.Material,id:string,y=0)=>{
  const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape(ring),{depth:height,bevelEnabled:false}).rotateX(-Math.PI/2),material);
  mesh.position.y=y;mesh.castShadow=mesh.receiveShadow=true;mesh.name=id;
  // Heights here are absolute local surfaces, not objects lifted a second time by terrain.
  mesh.userData.noDrape=true;scene.add(mesh);
 };
 for(const wall of northPoolWalls)for(let i=1;i<wall.points.length;i++)add(strip(wall.points[i-1],wall.points[i],wall.thickness),wall.height,plaster,wall.id);
 const paving=new THREE.MeshStandardMaterial({color:"#c4b396",map:surfaceTexture("paving"),roughness:1});
 for(const ring of northPoolPathRings())add(ring,.02,paving,northPoolPath.id,.012);
 const patio=northPoolPatio;
 add(patio.ring as Vec2[],patio.height+.025,paving,patio.id);
 const tile=new THREE.MeshStandardMaterial({color:"#bb7759",map:surfaceTexture("paving"),roughness:1});
 for(const tread of northPoolTreads()){
  add(tread.ring,tread.height,plaster,northPoolSteps.id);
  add(tread.ring,.025,tile,northPoolSteps.id+"-tile",tread.height);
 }
}
