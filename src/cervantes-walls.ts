import * as THREE from "three";
import layout from "../data/cervantes_patio_walls.json";
import east from "../data/cervantes_east_hedge.json";
import { closestOnSegment } from "./geom";
import { barrierRings, roadHeight } from "./boundaries";
import { plasterMaterial } from "./materials";
import type { Boundary, BoundaryReference, Vec2 } from "./types";

export const cervantesPatioWalls=[...layout.walls,...east.walls].map(w=>({...w,points:w.points as Vec2[]}));
export const cervantesWallOpenings=layout.openings.map(o=>({...o,ring:o.ring as Vec2[]}));
export function inCervantesWallReview(x:number,z:number):boolean {
  const [a,b]=layout.review.points;
  const [c,d]=east.walls[0].points;
  return closestOnSegment(x,z,a[0],a[1],b[0],b[1]).d<=layout.review.width/2 || closestOnSegment(x,z,c[0],c[1],d[0],d[1]).d<1.3;
}
export const cervantesPatioWallRings=():Vec2[][]=>barrierRings(cervantesPatioWalls as Boundary[]);

/** Ground levels follow the checked ramp; geometry and collision use the same lines. */
export function addCervantesPatioWalls(scene:THREE.Scene,reference:BoundaryReference):void {
  const road=reference.roads.find(r=>r.id==="cervantes");if(!road)return;
  const plaster=plasterMaterial("#fffdf5");plaster.side=THREE.DoubleSide;
  for(const wall of cervantesPatioWalls) for(let i=0;i<wall.points.length-1;i++) {
    const a=wall.points[i],b=wall.points[i+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const cuts=Math.max(1,Math.ceil(length)); // Preserve the ramp's slope under the wall.
    const nx=(b[1]-a[1])/length*wall.thickness/2,nz=-(b[0]-a[0])/length*wall.thickness/2;
    const positions:number[]=[],uvs:number[]=[];
    const quad=(p:number[],q:number[],r:number[],s:number[])=>{for(const v of [p,q,r,p,r,s]){positions.push(...v);uvs.push(v[0]+v[2],v[1]);}};
    for(let j=0;j<cuts;j++) {
      const t=j/cuts,u=(j+1)/cuts,ax=a[0]+(b[0]-a[0])*t,az=a[1]+(b[1]-a[1])*t,bx=a[0]+(b[0]-a[0])*u,bz=a[1]+(b[1]-a[1])*u;
      const topA=roadHeight(road,ax,az).height+wall.height,topB=roadHeight(road,bx,bz).height+wall.height;
      const bottomA=Math.min(0,topA-wall.height),bottomB=Math.min(0,topB-wall.height);
      quad([ax+nx,bottomA,az+nz],[bx+nx,bottomB,bz+nz],[bx+nx,topB,bz+nz],[ax+nx,topA,az+nz]);
      quad([bx-nx,bottomB,bz-nz],[ax-nx,bottomA,az-nz],[ax-nx,topA,az-nz],[bx-nx,topB,bz-nz]);
      quad([ax+nx,topA,az+nz],[bx+nx,topB,bz+nz],[bx-nx,topB,bz-nz],[ax-nx,topA,az-nz]);
      if(j===0)quad([ax-nx,bottomA,az-nz],[ax+nx,bottomA,az+nz],[ax+nx,topA,az+nz],[ax-nx,topA,az-nz]);
      if(j===cuts-1)quad([bx+nx,bottomB,bz+nz],[bx-nx,bottomB,bz-nz],[bx-nx,topB,bz-nz],[bx+nx,topB,bz+nz]);
    }
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,plaster);mesh.name=wall.id;mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);
  }
}
