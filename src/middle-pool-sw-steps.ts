import * as THREE from "three";
import feature from "../data/middle_pool_sw_steps.json";
import terrain from "../data/terrain.json";
import { plasterMaterial, surfaceTexture } from "./materials";
import { addSprites } from "./sprites";
import type { Vec2 } from "./types";

export const middleSwRun = terrain.localAccessRuns.find(r => r.id === feature.terrainId)!;
const r = middleSwRun, length = Math.hypot(r.toward[0]-r.foot[0], r.toward[1]-r.foot[1]);
const up: Vec2 = [(r.toward[0]-r.foot[0])/length,(r.toward[1]-r.foot[1])/length];
export const middleSwAt = (along: number, across = 0): Vec2 => [r.foot[0]+up[0]*along-up[1]*across,r.foot[1]+up[1]*along+up[0]*across];
export function middleSwGround(x: number,z: number): number {
  const dx=x-r.foot[0], dz=z-r.foot[1], along=dx*up[0]+dz*up[1], across=-dx*up[1]+dz*up[0];
  if(along<0 || along>r.tieInEnd || across<r.across[0] || across>r.across[1]) return 0;
  if(along<=r.end) {
    if(across>=r.stepsAcross[0] && across<=r.stepsAcross[1]) return r.rise*r.risers.filter(a=>along>=a).length/r.risers.length;
    return r.rise*Math.min(1,along/r.end);
  }
  return r.rise*(1-Math.max(0,(along-r.landingEnd)/(r.tieInEnd-r.landingEnd)));
}
export function middleSwRings(): Vec2[][] {
  const g=feature.gatewayAlong, w=feature.opening/2, p=feature.pierWidth;
  const strip=(a:number,b:number,c:number,d:number):Vec2[]=>[middleSwAt(a,c),middleSwAt(b,c),middleSwAt(b,d),middleSwAt(a,d)];
  return [-1,1].flatMap(side=>{
    const c=side*(w+p/2);
    return [strip(g-p/2,g+p/2,c-p/2,c+p/2),strip(g+.1,g+w,c-.025,c+.025)];
  });
}
export function addMiddleSwSteps(scene:THREE.Scene):void {
  const plaster=plasterMaterial("#fffdf5"), stone=plasterMaterial("#aaa18d"), tile=new THREE.MeshStandardMaterial({color:"#cf9a7a",map:surfaceTexture("paving"),roughness:1}), iron=new THREE.MeshStandardMaterial({color:"#26342b",roughness:.65});
  const add=(mesh:THREE.Mesh)=>{mesh.name=feature.id;mesh.castShadow=mesh.receiveShadow=true;mesh.userData.noDrape=true;scene.add(mesh);};
  const block=(along:number,across:number,w:number,h:number,depth:number,y:number,mat:THREE.Material|THREE.Material[])=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,depth),mat),p=middleSwAt(along,across);m.position.set(p[0],y+h/2,p[1]);m.rotation.y=Math.atan2(up[0],up[1]);add(m);
  };
  // Three independent blocks preserve visible white risers and rough stone tops.
  r.risers.forEach((start,i)=>block((start+r.end)/2,(r.stepsAcross[0]+r.stepsAcross[1])/2,r.stepsAcross[1]-r.stepsAcross[0],r.rise*(i+1)/3,r.end-start,.06,[plaster,plaster,stone,plaster,plaster,plaster]));
  const surface=(a:number,b:number,c:number,d:number,ya:number,yb:number)=>{
    const pts=[middleSwAt(a,c),middleSwAt(a,d),middleSwAt(b,c),middleSwAt(a,d),middleSwAt(b,d),middleSwAt(b,c)],ys=[ya,ya,yb,ya,yb,yb];
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pts.flatMap((p,i)=>[p[0],ys[i]+.065,p[1]]),3));g.setAttribute("uv",new THREE.Float32BufferAttribute([0,0,d-c,0,0,b-a,d-c,0,d-c,b-a,0,b-a],2));g.computeVertexNormals();add(new THREE.Mesh(g,tile));
  };
  surface(0,r.end,r.across[0],r.stepsAcross[0],0,r.rise);
  surface(r.end,r.landingEnd,...r.across as [number,number],r.rise,r.rise);
  surface(r.landingEnd,r.tieInEnd,...r.across as [number,number],r.rise,0);
  const g=feature.gatewayAlong,w=feature.opening/2,p=feature.pierWidth,base=.06+r.rise;
  for(const side of [-1,1]) {
    block(g,side*(w+p/2),p,feature.height+feature.headHeight,p,base,plaster);
    // Two leaves stand open along the landing edges, keeping the opening clear.
    for(const y of [.05,1,1.95])block(g+w/2,side*(w+.03),.035,.035,w,base+y,iron);
    for(let a=.08;a<w;a+=.12)block(g+a,side*(w+.03),.018,1.95,.018,base,iron);
  }
  block(g,0,feature.opening,feature.headHeight,p,base+feature.height,plaster);
  block(g,0,feature.opening+2*p+.12,.07,p+.1,base+feature.height+feature.headHeight,plaster);
  if(!scene.userData.layoutOnly) {
    const p=middleSwAt(g,1.25);addSprites(scene,"bougainvillea",[{x:p[0],z:p[1],y:r.rise+1.5,scale:.75}]);
  }
}
