import {plasterMaterial,surfaceTexture} from "./materials";
import * as THREE from "three";
import layout from "../data/main_pool.json";
import { closestOnSegment, pointInRing } from "./geom";
import type { Vec2 } from "./types";

const levels = layout.levels;
const angle = 26 * Math.PI / 180;
export const poolLevelPoint = ([x,z]: number[]): Vec2 => [x*Math.cos(angle)+z*Math.sin(angle),-x*Math.sin(angle)+z*Math.cos(angle)];
export const LOWER_POOL_Y = -levels.drop;
export const POOL_TERRACE_ID = levels.terraceId;
export const poolTerraceRing = levels.terraceRing.map(poolLevelPoint);
export const lowerPoolHoles = (levels.lowerHoles as number[][][]).map(r=>r.map(poolLevelPoint));
export const lowerPoolRing = levels.lowerArea.map(poolLevelPoint);
export const poolAccess = [
  { id:"main-pool-steps",name:"Steps to big pool",...levels.steps,kind:"steps" },
  { id:"main-pool-ramp",name:"Pool ramp · paseo end",...levels.ramp,kind:"ramp",count:0 },
].map(a=>({...a,points:a.points.map(poolLevelPoint)}));

/** The access meshes and movement share one source of elevations. */
export function lowerTerrainY(_x:number,_z:number):number {
  // The pool lawn is level all the way to the paseo and the beach (src/seaside.ts takes over there).
  return LOWER_POOL_Y;
}

export function poolGroundY(x:number,z:number):number {
  for(const access of poolAccess) {
    const [a,b]=access.points,hit=closestOnSegment(x,z,...a,...b);
    if(hit.d<=access.width/2) {
      let t=Math.hypot(hit.x-a[0],hit.z-a[1])/Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(access.kind==="steps") t=Math.floor(t*access.count)/access.count;
      return LOWER_POOL_Y*t;
    }
  }
  if(!pointInRing(x,z,lowerPoolRing)||lowerPoolHoles.some(r=>pointInRing(x,z,r))) return 0;
  return lowerTerrainY(x,z);
}

export function addPoolAccess(scene:THREE.Scene,open:(x:number,z:number)=>boolean=()=>false):void {
  const stone=plasterMaterial("#fff7e7");stone.side=THREE.DoubleSide;
  const tile=new THREE.MeshStandardMaterial({color:"#ffffff",map:surfaceTexture("paving"),roughness:0.9,side:THREE.DoubleSide});
  // Retain the elevated streets beside the lowered pool and lawn.
  for(const ring of [lowerPoolRing,...lowerPoolHoles]) for(let i=0;i<ring.length;i++) {
    const start=ring[i],end=ring[(i+1)%ring.length],pieces=Math.max(1,Math.ceil(Math.hypot(end[0]-start[0],end[1]-start[1])));
    for(let k=0;k<pieces;k++) {
      const a:Vec2=[start[0]+(end[0]-start[0])*k/pieces,start[1]+(end[1]-start[1])*k/pieces],b:Vec2=[start[0]+(end[0]-start[0])*(k+1)/pieces,start[1]+(end[1]-start[1])*(k+1)/pieces];
      // No wall where the lawn runs out level onto the paseo and beach.
      if(open((a[0]+b[0])/2,(a[1]+b[1])/2)) continue;
      const ay=lowerTerrainY(a[0],a[1]),by=lowerTerrainY(b[0],b[1]);
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute([
        a[0],0,a[1],b[0],by,b[1],a[0],ay,a[1],a[0],0,a[1],b[0],0,b[1],b[0],by,b[1]
      ],3));const positions=g.getAttribute("position"),uvs:number[]=[];for(let v=0;v<positions.count;v++)uvs.push(positions.getX(v)+positions.getY(v),positions.getZ(v)+positions.getY(v));g.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();scene.add(new THREE.Mesh(g,stone));
    }
  }
  for(const access of poolAccess) {
    const [a,b]=access.points,dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
    const count=access.kind==="steps"?access.count:1;
    const nx=dz/length*access.width/2,nz=-dx/length*access.width/2;
    for(let i=0;i<count;i++) {
      const t=i/count,u=(i+1)/count,y=LOWER_POOL_Y*t,by=access.kind==="steps"?y:LOWER_POOL_Y*u;
      const ax=a[0]+dx*t,az=a[1]+dz*t,bx=a[0]+dx*u,bz=a[1]+dz*u;
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute([
        ax+nx,y,az+nz,bx+nx,by,bz+nz,ax-nx,y,az-nz,ax-nx,y,az-nz,bx+nx,by,bz+nz,bx-nx,by,bz-nz,
        bx+nx,by,bz+nz,bx+nx,LOWER_POOL_Y*u,bz+nz,bx-nx,by,bz-nz,bx-nx,by,bz-nz,bx+nx,LOWER_POOL_Y*u,bz+nz,bx-nx,LOWER_POOL_Y*u,bz-nz
      ],3));const positions=g.getAttribute("position"),uvs:number[]=[];for(let v=0;v<positions.count;v++)uvs.push(positions.getX(v)+positions.getY(v),positions.getZ(v)+positions.getY(v));g.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();const mesh=new THREE.Mesh(g,access.kind==="steps"?stone:tile);mesh.receiveShadow=true;mesh.userData.referenceSurface=true;scene.add(mesh);
    }
  }
}

/** Subdivide the lower lawn so its final grading joins the existing paseo terrain. */
export function lowerPoolSurface(holes:Vec2[][]):THREE.BufferGeometry {
  const shape=new THREE.Shape(levels.surfaceRing.map(poolLevelPoint).map(([x,z])=>new THREE.Vector2(x,-z)));
  [...holes,...(levels.surfaceHoles as number[][][]).map(r=>r.map(poolLevelPoint))].forEach(r=>shape.holes.push(new THREE.Path(r.map(([x,z])=>new THREE.Vector2(x,-z)))));
  const base=new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2).toNonIndexed();
  const pos=base.getAttribute("position"),out:number[]=[];
  const triangle=(a:Vec2,b:Vec2,c:Vec2,depth:number)=>{
    if(depth && Math.max(Math.hypot(a[0]-b[0],a[1]-b[1]),Math.hypot(b[0]-c[0],b[1]-c[1]),Math.hypot(c[0]-a[0],c[1]-a[1]))>2) {
      const ab:Vec2=[(a[0]+b[0])/2,(a[1]+b[1])/2],bc:Vec2=[(b[0]+c[0])/2,(b[1]+c[1])/2],ca:Vec2=[(c[0]+a[0])/2,(c[1]+a[1])/2];
      triangle(a,ab,ca,depth-1);triangle(ab,b,bc,depth-1);triangle(ca,bc,c,depth-1);triangle(ab,bc,ca,depth-1);
    } else for(const [x,z] of [a,b,c]) out.push(x,lowerTerrainY(x,z),z);
  };
  for(let i=0;i<pos.count;i+=3) triangle([pos.getX(i),pos.getZ(i)],[pos.getX(i+1),pos.getZ(i+1)],[pos.getX(i+2),pos.getZ(i+2)],7);
  base.dispose();const result=new THREE.BufferGeometry();result.setAttribute("position",new THREE.Float32BufferAttribute(out,3));result.computeVertexNormals();return result;
}
