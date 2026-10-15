import * as THREE from "three";
import layout from "../data/cervantes_east_hedge.json";
import { roadHeight } from "./boundaries";
import type { BoundaryReference } from "./types";

/** Plumbago in IMG_2356: low white kerb is shared with the map/wall collision;
 * this bounded foliage is optional and keeps its complete visible radius off lanes. */
export function addCervantesEastHedge(scene: THREE.Scene, reference: BoundaryReference): void {
  if (scene.userData.layoutOnly) return;
  const road=reference.roads.find(r=>r.id==="cervantes");if(!road)return;
  const guard=scene.userData.decorationClearance as ((x:number,z:number,radius:number)=>boolean)|undefined;
  const p=layout.planting, [a,b]=[p.from,p.to], length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const leaves=new THREE.MeshStandardMaterial({color:"#53743b",roughness:1});
  const flowers=new THREE.MeshStandardMaterial({color:"#b6c8ed",roughness:1});
  const leafGeometry=new THREE.SphereGeometry(1,8,6),flowerGeometry=new THREE.SphereGeometry(.045,5,4);
  const count=Math.ceil(length/p.spacing);
  for(let i=0;i<=count;i++) {
    const x=a[0]+(b[0]-a[0])*i/count,z=a[1]+(b[1]-a[1])*i/count;
    if(!guard?.(x,z,p.radius+.05))continue;
    const ground=roadHeight(road,x,z).height,base=layout.walls[0].height;
    const plant=new THREE.Mesh(leafGeometry,leaves);
    plant.scale.set(p.radius,(p.height-base)/2,p.radius);
    plant.position.set(x,ground+base+(p.height-base)/2,z);
    plant.name="cervantes-east-plumbago";plant.castShadow=true;scene.add(plant);
    // Small pale-blue flower clusters, observed rather than generic pink climbers.
    for(let j=0;j<4;j++) {
      const angle=i*1.7+j*2.4,flower=new THREE.Mesh(flowerGeometry,flowers);
      flower.position.set(x+Math.cos(angle)*p.radius*.8,ground+p.height-.15-j*.2,z+Math.sin(angle)*p.radius*.8);
      flower.name="cervantes-east-plumbago-flowers";scene.add(flower);
    }
  }
}
