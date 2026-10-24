import * as THREE from 'three';
import type {Vec2} from './types';

/** Rounded corners stay inside the original rectangle; no footprint expansion. */
export function roundedBedRing(x0:number,z0:number,x1:number,z1:number,r:number):Vec2[]{
 const ring:Vec2[]=[];
 for(const [x,z,start] of [[x1-r,z1-r,0],[x0+r,z1-r,Math.PI/2],[x0+r,z0+r,Math.PI],[x1-r,z0+r,Math.PI*1.5]])
  for(let i=0;i<=5;i++){const a=start+i*Math.PI/10;ring.push([x+r*Math.cos(a),z+r*Math.sin(a)]);}
 return ring;
}

function inset(ring:Vec2[],amount:number):Vec2[]{
 const area=ring.reduce((s,p,i)=>{const q=ring[(i+1)%ring.length];return s+p[0]*q[1]-q[0]*p[1];},0),sign=area>0?1:-1;
 const edges=ring.map((p,i)=>{const q=ring[(i+1)%ring.length],length=Math.hypot(q[0]-p[0],q[1]-p[1]),dx=-(q[1]-p[1])/length*amount*sign,dz=(q[0]-p[0])/length*amount*sign;return [[p[0]+dx,p[1]+dz],[q[0]+dx,q[1]+dz]] as Vec2[];});
 return edges.map(([r,s],i)=>{const [p,q]=edges[(i+edges.length-1)%edges.length],u=[q[0]-p[0],q[1]-p[1]],v=[s[0]-r[0],s[1]-r[1]],den=u[0]*v[1]-u[1]*v[0];if(Math.abs(den)<1e-9)return r;const t=((r[0]-p[0])*v[1]-(r[1]-p[1])*v[0])/den;return [p[0]+u[0]*t,p[1]+u[1]*t];});
}

/** A hollow rendered kerb with exposed soil, rather than a solid planter block. */
export function planterBed(parent:THREE.Object3D,ring:Vec2[],height:number,wall:number,material:THREE.Material,id:string,base=.06){
 const inner=inset(ring,wall);
 const shape=new THREE.Shape(ring.map(([x,z])=>new THREE.Vector2(x,-z)));
 shape.holes.push(new THREE.Path(inner.map(([x,z])=>new THREE.Vector2(x,-z))));
 const sides=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false}).rotateX(-Math.PI/2),material);
 sides.position.y=base;sides.name=id;sides.userData.planterPart='rendered-kerb';
 const soil=new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(inner.map(([x,z])=>new THREE.Vector2(x,-z)))).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:'#514333',roughness:1}));
 soil.position.y=base+height-.045;soil.name=id+'-soil';
 for(const mesh of [sides,soil]){mesh.castShadow=mesh.receiveShadow=true;mesh.userData.noDrape=true;parent.add(mesh);}
 return sides;
}
