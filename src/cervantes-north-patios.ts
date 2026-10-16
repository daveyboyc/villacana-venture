import * as THREE from "three";
import data from "../data/cervantes_north_patios.json";
import { barrierRings, roadHeight } from "./boundaries";
import { closestOnSegment } from "./geom";
import { plasterMaterial } from "./materials";
import { addSprites, type SpriteKind } from "./sprites";
import type { Boundary, BoundaryReference, Vec2 } from "./types";

/** Partial traced spans only: concealed joins are deliberately left unasserted. */
export const cervantesNorthPartitions = data.walls.map(w => ({...w, points:w.points as Vec2[]}));
export const inCervantesNorthPatios = (x:number,z:number):boolean => cervantesNorthPartitions.some(w=>closestOnSegment(x,z,...w.points[0],...w.points[1]).d<1.5);
export const cervantesNorthPartitionRings = ():Vec2[][] => barrierRings(cervantesNorthPartitions as Boundary[]);
export function addCervantesNorthPatios(scene:THREE.Scene, reference:BoundaryReference):void {
 const road=reference.roads.find(r=>r.id==="cervantes"); if(!road)return;
 const material=plasterMaterial("#fffdf5");
 for(const w of cervantesNorthPartitions) {
  const [a,b]=w.points, length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  // Short slabs follow the existing ground datum without modifying site levels.
  const cuts=Math.ceil(length/.5);
  for(let j=0;j<cuts;j++) {
   const t=(j+.5)/cuts,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
   const mesh=new THREE.Mesh(new THREE.BoxGeometry(length/cuts+.005,w.height,w.thickness),material);
   mesh.position.set(x,roadHeight(road,x,z).height+w.height/2,z);
   mesh.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);
   mesh.name=w.id;mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);
  }
 }
 for(const p of data.planting) addSprites(scene,p.kind as SpriteKind,[{x:p.at[0],z:p.at[1],y:roadHeight(road,p.at[0],p.at[1]).height+p.y,scale:p.scale}]);
}
