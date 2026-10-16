import * as THREE from "three";
import data from "../data/cervantes_garden_door.json";
import { pointInRing } from "./geom";
import { referenceGroundHeight } from "./boundaries";
import { plasterMaterial, surfaceTexture } from "./materials";
import { siteY } from "./terrain";
import { addSprites } from "./sprites";
import type { BoundaryReference, Vec2 } from "./types";

export const gardenDoor = data;
const origin = data.origin as Vec2, along = data.along as Vec2, inward = data.inward as Vec2;
export const gardenPoint = (a: number, b: number): Vec2 => [origin[0] + a * along[0] + b * inward[0], origin[1] + a * along[1] + b * inward[1]];
const rectangle = (a: number, b: number, c: number, d: number): Vec2[] => [gardenPoint(a,b),gardenPoint(c,b),gardenPoint(c,d),gardenPoint(a,d)];
export const gardenStepRings = [rectangle(-data.stepWidth/2,-data.stepRun*2,data.stepWidth/2,-data.stepRun),rectangle(-data.stepWidth/2,-data.stepRun,data.stepWidth/2,-data.wallThickness/2)];
export const gardenWallRing = rectangle(-data.wallWidth/2,-data.wallThickness/2,data.wallWidth/2,data.wallThickness/2);
export const gardenDoorLeaf = rectangle(-data.doorWidth/2,-data.wallThickness/2-.045,data.doorWidth/2,-data.wallThickness/2-.005);
export const gardenPatioRing = data.patio.ring as Vec2[], gardenBedRing = data.bed.ring as Vec2[];
export const gardenDoorRings = (): Vec2[][] => [gardenWallRing,gardenBedRing];
const baseY = (ref: BoundaryReference): number => {const p = gardenPoint(0,-data.stepRun*2);return siteY(...p)+referenceGroundHeight(ref,...p);};

/** Private patio and treads share a level datum; the closed door remains solid. */
export function gardenGroundOffset(x: number,z: number,ref?: BoundaryReference): number {
  if(!ref)return 0;
  let rise: number | undefined;
  if(pointInRing(x,z,gardenPatioRing))rise=data.rise;
  for(let i=0;i<gardenStepRings.length;i++)if(pointInRing(x,z,gardenStepRings[i]))rise=data.rise*(i+1)/data.risers;
  return rise===undefined?0:Math.max(0,baseY(ref)+rise-siteY(x,z)-referenceGroundHeight(ref,x,z));
}

export function addCervantesGardenDoor(scene: THREE.Scene,ref: BoundaryReference): void {
  const base=baseY(ref),datum=base+data.rise;
  const white=plasterMaterial("#fffaf1"),red=new THREE.MeshStandardMaterial({color:"#a75d43",map:surfaceTexture("paving"),roughness:1});
  const timber=new THREE.MeshStandardMaterial({color:"#65432e",roughness:.9});
  const soil=new THREE.MeshStandardMaterial({color:"#5a4433",roughness:1});
  const add=(mesh:THREE.Mesh,name:string)=>{mesh.name=name;mesh.userData.noDrape=true;mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);};
  const block=(a:number,b:number,width:number,depth:number,bottom:number,top:number,material:THREE.Material|THREE.Material[],name:string)=>{
    const p=gardenPoint(a,b),mesh=new THREE.Mesh(new THREE.BoxGeometry(width,top-bottom,depth),material);
    mesh.position.set(p[0],(bottom+top)/2,p[1]);mesh.rotation.y=-Math.atan2(along[1],along[0]);add(mesh,name);
  };
  for(let i=0;i<2;i++){
    const start=-data.stepRun*(2-i),end=-data.wallThickness/2;
    block(0,(start+end)/2,data.stepWidth,end-start,base,base+data.rise*(i+1)/2,[white,white,red,white,white,white],data.id+"-tread-"+(i+1));
  }
  block(0,0,data.wallWidth,data.wallThickness,base,datum+data.wallHeight,white,data.id+"-wall");
  block(0,-data.wallThickness/2-.025,data.doorWidth,.04,datum,datum+data.doorHeight,timber,data.id+"-closed-door");
  // Narrow timber rails/panels on the photographed closed leaf.
  for(const a of [-data.doorWidth/2+.06,data.doorWidth/2-.06])block(a,-data.wallThickness/2-.05,.055,.025,datum+.05,datum+data.doorHeight-.05,timber,data.id+"-door-frame");
  for(const h of [.09,.58,data.doorHeight-.09])block(0,-data.wallThickness/2-.05,data.doorWidth-.08,.025,datum+h-.035,datum+h+.035,timber,data.id+"-door-rail");
  const cap=new THREE.Shape();cap.moveTo(-.72,data.wallHeight-.03);cap.quadraticCurveTo(0,data.wallHeight+.27,.72,data.wallHeight-.03);cap.lineTo(.72,data.wallHeight+.06);cap.quadraticCurveTo(0,data.wallHeight+.36,-.72,data.wallHeight+.06);cap.closePath();
  const coping=new THREE.Mesh(new THREE.ExtrudeGeometry(cap,{depth:data.wallThickness+.08,bevelEnabled:false,curveSegments:20}).translate(0,0,-(data.wallThickness+.08)/2),white);
  coping.position.set(origin[0],datum,origin[1]);coping.rotation.y=-Math.atan2(along[1],along[0]);add(coping,data.id+"-curved-coping");
  const surface=(ring:Vec2[],y:number,material:THREE.Material,name:string)=>{
    const shape=new THREE.Shape(ring.map(([x,z])=>new THREE.Vector2(x,-z)));
    const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2),material);mesh.position.y=y;add(mesh,name);
  };
  surface(gardenPatioRing,datum,red,data.patio.id);
  surface(gardenBedRing,base+data.bed.height,soil,data.bed.id);
  // Clipped planting is optional; addSprites applies the shared footprint guard.
  const before=scene.children.length;
  const hedge=[.12,.38,.64,.9].map(t=>{
    const a=gardenBedRing[0],b=gardenBedRing[1],c=gardenBedRing[3];
    return {x:a[0]+(b[0]-a[0])*t+(c[0]-a[0])/2,z:a[1]+(b[1]-a[1])*t+(c[1]-a[1])/2,y:base+data.bed.height,scale:.45};
  });
  addSprites(scene,"hedge",hedge);
  for(const child of scene.children.slice(before))child.userData.noDrape=true;
  // Low retaining faces around the bounded west bed. No invented full patio enclosure.
  for(let i=0;i<gardenBedRing.length;i++){
    const a=gardenBedRing[i],b=gardenBedRing[(i+1)%gardenBedRing.length],p=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    const bottom=Math.min(siteY(...a),siteY(...b))+referenceGroundHeight(ref,...a),top=base+data.bed.height;
    if(top<=bottom)continue;
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(b[0]-a[0],b[1]-a[1]),top-bottom,.10),white);
    mesh.position.set(p[0],(bottom+top)/2,p[1]);mesh.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);add(mesh,data.bed.id+"-kerb");
  }
}
