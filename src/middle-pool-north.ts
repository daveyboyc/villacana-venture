import * as THREE from "three";
import data from "../data/middle_pool_north.json";
import { pointInRing } from "./geom";
import { plasterMaterial } from "./materials";
import type { Vec2 } from "./types";

export const middlePoolNorth = data;
export const inMiddlePoolNorthReview = (x: number, z: number): boolean => data.review.rings.some(r => pointInRing(x, z, r as Vec2[]));
const strip = (a: Vec2, b: Vec2, width: number): Vec2[] => {
  const l = Math.hypot(b[0]-a[0], b[1]-a[1]), nx = (b[1]-a[1])/l*width/2, nz = -(b[0]-a[0])/l*width/2;
  return [[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]];
};
export function middlePoolNorthRings(): Vec2[][] {
  const p = data.pergola;
  return [data.cap.ring as Vec2[], strip(...data.wall.points as [Vec2,Vec2],data.wall.thickness), ...p.points.map(([x,z]) => [[x-p.width/2,z-p.width/2],[x+p.width/2,z-p.width/2],[x+p.width/2,z+p.width/2],[x-p.width/2,z+p.width/2]] as Vec2[])];
}
export function middlePoolNorthStepRing(): Vec2[] { return strip(...[data.steps.foot,data.steps.toward] as [Vec2,Vec2],data.steps.width); }
function solid(ring: Vec2[], height: number, material: THREE.Material, id: string): THREE.Mesh {
  const shape = new THREE.Shape(ring.map(([x,z]) => new THREE.Vector2(x,-z)));
  const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false}).rotateX(-Math.PI/2),material);
  mesh.name=id;mesh.castShadow=mesh.receiveShadow=true;
  return mesh;
}
export function addMiddlePoolNorth(scene: THREE.Scene): void {
  const plaster=plasterMaterial("#fffdf5"), brown=new THREE.MeshStandardMaterial({color:"#795239",roughness:.9}), iron=new THREE.MeshStandardMaterial({color:"#36483c",roughness:.7});
  const c=data.cap;
  scene.add(solid(c.ring as Vec2[],c.height,plaster,c.id));
  // A short cap only: the original planter ring is deliberately unchanged.
  const w=data.wall, [a,b]=w.points as Vec2[], l=Math.hypot(b[0]-a[0],b[1]-a[1]), ux=(b[0]-a[0])/l, uz=(b[1]-a[1])/l;
  scene.add(solid(strip(a,b,w.thickness),w.height,plaster,w.id));
  const panel=new THREE.Mesh(new THREE.BoxGeometry(w.door.width,w.door.height,.035),brown);
  panel.position.set(a[0]+ux*w.door.along+uz*(w.thickness/2+.02),w.door.height/2,a[1]+uz*w.door.along-ux*(w.thickness/2+.02));
  panel.rotation.y=-Math.atan2(uz,ux);panel.name=w.id;scene.add(panel);
  const p=data.pergola, [pa,pb]=p.points as Vec2[], span=Math.hypot(pb[0]-pa[0],pb[1]-pa[1]), group=new THREE.Group();
  for(const x of [-span/2,span/2]) {
    const post=new THREE.Mesh(new THREE.BoxGeometry(p.width,p.height,p.width),iron);post.position.set(x,p.height/2,0);group.add(post);
  }
  const shape=new THREE.Shape();shape.moveTo(-span/2-.1,p.height);shape.lineTo(span/2+.1,p.height);shape.lineTo(span/2+.1,p.height+.12);shape.quadraticCurveTo(0,p.height+.42,-span/2-.1,p.height+.12);shape.closePath();
  group.add(new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:p.depth,bevelEnabled:false}).translate(0,0,-p.depth/2),plaster));
  group.position.set((pa[0]+pb[0])/2,0,(pa[1]+pb[1])/2);group.rotation.y=-Math.atan2(pb[1]-pa[1],pb[0]-pa[0]);
  group.traverse(o=>{o.name=p.id;if(o instanceof THREE.Mesh)o.castShadow=o.receiveShadow=true;});scene.add(group);
  // Treads have matching terrain heights; do not drape them onto themselves.
  const s=data.steps, f=s.foot as Vec2, t=s.toward as Vec2;
  for(let i=0;i<s.count;i++) {
    const start:Vec2=[f[0]+(t[0]-f[0])*i/s.count,f[1]+(t[1]-f[1])*i/s.count];
    const block=solid(strip(start,t,s.width),s.rise*(i+1)/s.count,plaster,s.id);block.userData.noDrape=true;scene.add(block);
  }
}
