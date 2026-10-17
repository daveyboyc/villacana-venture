import * as THREE from "three";
import data from "../data/cervantes_east_south_patios.json";
import { barrierRings, roadHeight } from "./boundaries";
import { pointInRing } from "./geom";
import { plasterMaterial } from "./materials";
import { addSprites, type SpriteKind } from "./sprites";
import type { Boundary, BoundaryReference, Vec2 } from "./types";

/** Bounded photographed lane frontage; concealed enclosure returns are not inferred. */
export const cervantesEastSouthWalls = data.walls.map(w => ({ ...w, points: w.points as Vec2[] }));
export const cervantesEastSouthDoor = data.door;
export const cervantesEastSouthPergola = { ...data.pergola, ring: data.pergola.ring as Vec2[] };
export const inCervantesEastSouthPatios = (x: number, z: number): boolean => pointInRing(x, z, data.review.ring as Vec2[]);
export const cervantesEastSouthPostRings = (): Vec2[][] => data.pergola.ring.map(([x,z]) => {
  const r=data.pergola.post/2;return [[x-r,z-r],[x+r,z-r],[x+r,z+r],[x-r,z+r]];
});
/** The closed door shares the continuous solid wall. Pergola posts share map/mesh coordinates. */
export const cervantesEastSouthRings = (): Vec2[][] => [...barrierRings(cervantesEastSouthWalls as Boundary[]), ...cervantesEastSouthPostRings()];

export function addCervantesEastSouthPatios(scene: THREE.Scene, reference: BoundaryReference): void {
  const road=reference.roads.find(r=>r.id==="cervantes");if(!road)return;
  const white=plasterMaterial("#fffdf5"), timber=new THREE.MeshStandardMaterial({color:"#62432d",roughness:.9}), cane=new THREE.MeshStandardMaterial({color:"#a8976b",roughness:1});
  const base=roadHeight(road,...data.origin as Vec2).height;
  // Lane is .27 m above the scene datum, courtyard cover about .06 m: extend faces/posts down, preserving the lane-relative wall top.
  const foot=.04-base;
  const add=(mesh:THREE.Mesh,id:string)=>{mesh.name=id;mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);};
  const beam=(a:Vec2,b:Vec2,bottom:number,width:number,height:number,material:THREE.Material,id:string)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(b[0]-a[0],b[1]-a[1]),height,width),material);
    mesh.position.set((a[0]+b[0])/2,base+bottom+height/2,(a[1]+b[1])/2);mesh.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);add(mesh,id);
  };
  for(const w of cervantesEastSouthWalls){beam(w.points[0],w.points[1],foot,w.thickness,w.height-foot,white,w.id);beam(w.points[0],w.points[1],w.height,w.thickness+.06,.055,white,w.id+"-coping");}
  const d=data.door, u=data.along, inward=data.inward;
  const doorPoint=(a:number,b:number):Vec2=>[d.at[0]+u[0]*a+inward[0]*b,d.at[1]+u[1]*a+inward[1]*b];
  beam(doorPoint(-d.width/2,-.125),doorPoint(d.width/2,-.125),.025,.035,d.height,timber,d.id);
  for(const h of [.12,.58,d.height-.12])beam(doorPoint(-d.width/2+.045,-.15),doorPoint(d.width/2-.045,-.15),h,.025,.045,timber,d.id+"-rail");
  const cap=new THREE.Shape(),half=d.copingWidth/2,wall=data.walls[0];
  cap.moveTo(-half,wall.height-.01);cap.lineTo(half,wall.height-.01);cap.lineTo(half,wall.height+.07);cap.quadraticCurveTo(0,wall.height+2*d.copingRise+.07,-half,wall.height+.07);cap.closePath();
  const coping=new THREE.Mesh(new THREE.ExtrudeGeometry(cap,{depth:wall.thickness+.08,bevelEnabled:false,curveSegments:20}).translate(0,0,-(wall.thickness+.08)/2),white);
  coping.position.set(d.at[0],base,d.at[1]);coping.rotation.y=-Math.atan2(u[1],u[0]);add(coping,d.id+"-curved-coping");
  const p=cervantesEastSouthPergola,[a,b,c,d0]=p.ring;
  for(const [x,z] of p.ring){const post=new THREE.Mesh(new THREE.BoxGeometry(p.post,p.height-foot,p.post),timber);post.position.set(x,base+(p.height+foot)/2,z);add(post,p.id+"-post");}
  beam(a,b,p.height-p.beam,p.beam,p.beam,timber,p.id);beam(d0,c,p.height-p.beam,p.beam,p.beam,timber,p.id);
  const lerp=(a:Vec2,b:Vec2,t:number):Vec2=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const rafters=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/p.rafterSpacing);
  for(let i=0;i<=rafters;i++)beam(lerp(a,b,i/rafters),lerp(d0,c,i/rafters),p.height,.07,.1,timber,p.id+"-rafter");
  // Closely laid cane slats form the photographed continuous shade cover in Layout too.
  const canes=Math.ceil(Math.hypot(d0[0]-a[0],d0[1]-a[1])/p.caneSpacing);
  for(let i=0;i<=canes;i++)beam(lerp(a,d0,i/canes),lerp(b,c,i/canes),p.height+.1,p.caneSpacing*1.02,.025,cane,p.id+"-cane");
  for(const q of data.planting)addSprites(scene,q.kind as SpriteKind,[{x:q.at[0],z:q.at[1],y:base+q.y,scale:q.scale}]);
}
