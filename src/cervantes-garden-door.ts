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
/** One ring per tread, bottom step first; the wider bottom step wraps the bed and planter corners. */
export const gardenStepRings = data.steps.map(s=>rectangle(-s.width/2,s.front,s.width/2,s.back));
export const gardenWallRing = rectangle(-data.wallWidth/2,-data.wallThickness/2,data.wallWidth/2,data.wallThickness/2);
export const gardenDoorLeaf = rectangle(-data.doorWidth/2,-.02,data.doorWidth/2,.02);
export const gardenPatioRing = data.patio.ring as Vec2[], gardenBedRing = data.bed.ring as Vec2[], gardenPlanterRing = data.eastPlanter.ring as Vec2[];
export const gardenDoorRings = (): Vec2[][] => [gardenWallRing,gardenBedRing,gardenPlanterRing];
const baseY = (ref: BoundaryReference): number => {const p = gardenPoint(0,data.steps[0].front);return siteY(...p)+referenceGroundHeight(ref,...p);};

/** Private patio and treads share a level datum; the closed door remains solid. */
export function gardenGroundOffset(x: number,z: number,ref?: BoundaryReference): number {
  if(!ref)return 0;
  let rise: number | undefined;
  if(pointInRing(x,z,gardenPatioRing))rise=data.rise;
  for(let i=0;i<gardenStepRings.length;i++)if(pointInRing(x,z,gardenStepRings[i]))rise=data.steps[i].top;
  return rise===undefined?0:Math.max(0,baseY(ref)+rise-siteY(x,z)-referenceGroundHeight(ref,x,z));
}

export function addCervantesGardenDoor(scene: THREE.Scene,ref: BoundaryReference): void {
  const base=baseY(ref),datum=base+data.rise,frame=data.frame,turn=-Math.atan2(along[1],along[0]);
  const white=plasterMaterial("#fffaf1"),timber=new THREE.MeshStandardMaterial({color:"#65432e",roughness:.9});
  // Small square red quarry tiles, two rows per tread; UVs below are in metres.
  const quarry=surfaceTexture("paving").clone();quarry.repeat.setScalar(1/(4*data.tile));quarry.needsUpdate=true;
  const red=new THREE.MeshStandardMaterial({color:"#d47a68",map:quarry,roughness:.85});
  const soil=new THREE.MeshStandardMaterial({color:"#5a4433",roughness:1});
  const add=(mesh:THREE.Mesh,name:string)=>{mesh.name=name;mesh.userData.noDrape=true;mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);};
  const block=(a:number,b:number,width:number,depth:number,bottom:number,top:number,material:THREE.Material|THREE.Material[],name:string)=>{
    const p=gardenPoint(a,b),mesh=new THREE.Mesh(new THREE.BoxGeometry(width,top-bottom,depth),material);
    mesh.position.set(p[0],(bottom+top)/2,p[1]);mesh.rotation.y=turn;add(mesh,name);
  };
  // Treads as extruded outlines (local a, -b), so the bottom step gets its rounded front ends.
  data.steps.forEach((s,i)=>{
    const back=i===data.steps.length-1?data.wallThickness/2:s.back,r=(s as {radius?:number}).radius??0,w=s.width/2,shape=new THREE.Shape();
    shape.moveTo(-w,-back);shape.lineTo(w,-back);shape.lineTo(w,-s.front-r);
    if(r)shape.quadraticCurveTo(w,-s.front,w-r,-s.front);
    shape.lineTo(-w+r,-s.front);
    if(r)shape.quadraticCurveTo(-w,-s.front,-w,-s.front-r);
    shape.closePath();
    const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:s.top,bevelEnabled:false,curveSegments:6}).rotateX(-Math.PI/2),[red,white]);
    mesh.position.set(origin[0],base,origin[1]);mesh.rotation.y=turn;add(mesh,data.id+"-tread-"+(i+1));
  });
  // Wall either side of the opening and a lintel; the leaf is recessed behind the pilaster frame.
  const side=(data.wallWidth-data.doorWidth)/2;
  for(const sign of [-1,1])block(sign*(data.doorWidth+side)/2,0,side,data.wallThickness,base,datum+data.wallHeight,white,data.id+"-wall");
  block(0,0,data.doorWidth,data.wallThickness,datum+data.doorHeight,datum+data.wallHeight,white,data.id+"-lintel");
  block(0,0,data.doorWidth,.04,datum,datum+data.doorHeight,timber,data.id+"-closed-door");
  const face=-data.wallThickness/2-frame.projection/2;
  for(const sign of [-1,1])block(sign*(data.doorWidth+frame.width)/2,face,frame.width,frame.projection,datum,datum+frame.height,white,data.id+"-pilaster");
  block(0,face,data.doorWidth,frame.projection,datum+data.doorHeight,datum+frame.height,white,data.id+"-frame-head");
  // Narrow timber rails/panels on the photographed closed leaf.
  for(const a of [-data.doorWidth/2+.06,data.doorWidth/2-.06])block(a,-.03,.055,.025,datum+.05,datum+data.doorHeight-.05,timber,data.id+"-door-frame");
  for(const h of [.09,.58,data.doorHeight-.09])block(0,-.03,data.doorWidth-.08,.025,datum+h-.035,datum+h+.035,timber,data.id+"-door-rail");
  const c=frame.copingHalfWidth,top=frame.height,cap=new THREE.Shape();
  cap.moveTo(-c,top-.03);cap.quadraticCurveTo(0,top+.2,c,top-.03);cap.lineTo(c,top+.05);cap.quadraticCurveTo(0,top+.28,-c,top+.05);cap.closePath();
  const depth=data.wallThickness+frame.projection+.06;
  const coping=new THREE.Mesh(new THREE.ExtrudeGeometry(cap,{depth,bevelEnabled:false,curveSegments:20}).translate(0,0,-depth/2-frame.projection/2),white);
  coping.position.set(origin[0],datum,origin[1]);coping.rotation.y=turn;add(coping,data.id+"-curved-coping");
  const surface=(ring:Vec2[],y:number,material:THREE.Material,name:string)=>{
    const shape=new THREE.Shape(ring.map(([x,z])=>new THREE.Vector2(x,-z)));
    const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2),material);mesh.position.y=y;add(mesh,name);
  };
  surface(gardenPatioRing,datum,red,data.patio.id);
  // Low white-walled beds either side of the flight; no invented full patio enclosure.
  const bed=(ring:Vec2[],height:number,id:string,from:number,to:number)=>{
    surface(ring,base+height,soil,id);
    for(let i=0;i<ring.length;i++){
      const a=ring[i],b=ring[(i+1)%ring.length],p=[(a[0]+b[0])/2,(a[1]+b[1])/2];
      const bottom=Math.min(siteY(...a),siteY(...b))+referenceGroundHeight(ref,...a),top=base+height;
      if(top<=bottom)continue;
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(b[0]-a[0],b[1]-a[1]),top-bottom,.10),white);
      mesh.position.set(p[0],(bottom+top)/2,p[1]);mesh.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);add(mesh,id+"-kerb");
    }
    // Clipped planting is optional; addSprites applies the shared footprint guard.
    const before=scene.children.length,a=gardenPoint(from,-.55),b=gardenPoint(to,-.55);
    addSprites(scene,"hedge",[.12,.38,.64,.9].map(t=>({x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,y:base+height,scale:.45})));
    for(const child of scene.children.slice(before))child.userData.noDrape=true;
  };
  bed(gardenBedRing,data.bed.height,data.bed.id,.6,3.0);
  bed(gardenPlanterRing,data.eastPlanter.height,data.eastPlanter.id,-.62,-1.42);
}
