import {inDaliThreshold} from "./dali-threshold";
import * as THREE from "three";
import divisions from "../data/frontage_divisions.json";
import { pointInRing } from "./geom";
import { plasterMaterial, surfaceTexture } from "./materials";
import type { Vec2 } from "./types";

export const frontageRegions=divisions.regions.map(r=>({...r,ring:r.ring as Vec2[]}));
export const frontageBorders=divisions.borders.map(b=>({...b,points:b.points as Vec2[]}));
export const FRONTAGE_COLORS:Record<string,string>={patio:"#d9b393",lawn:"#718658",planting:"#405b3d",entrance:"#bba58b"};
/** Suppress invented garden-wall blocks where the reference now defines a surface. */
export const inReviewedFrontage=(x:number,z:number)=>inDaliThreshold(x,z)||frontageRegions.some(r=>pointInRing(x,z,r.ring));
export function addFrontageDivisions(scene:THREE.Scene):void {
  for(const region of frontageRegions) {
    if(region.kind==="patio") continue; // This registry enclosure is already modeled.
    const shape=new THREE.Shape(region.ring.map(([x,z])=>new THREE.Vector2(x,-z)));
    const geometry=new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2);
    const positions=geometry.getAttribute("position"),uv=geometry.getAttribute("uv");
    for(let i=0;i<positions.count;i++)uv.setXY(i,positions.getX(i),positions.getZ(i));
    const material=new THREE.MeshStandardMaterial({color:FRONTAGE_COLORS[region.kind],roughness:1,map:region.kind==="entrance"?surfaceTexture("paving"):surfaceTexture("turf")});
    const mesh=new THREE.Mesh(geometry,material);mesh.position.y=.025;mesh.receiveShadow=true;mesh.userData.referenceSurface=true;scene.add(mesh);
  }
  const stone=plasterMaterial("#fffdf3");
  for(const border of frontageBorders) for(let i=0;i<border.points.length-1;i++) {
    const [ax,az]=border.points[i],[bx,bz]=border.points[i+1],length=Math.hypot(bx-ax,bz-az);
    const curb=new THREE.Mesh(new THREE.BoxGeometry(length,border.height,border.width),stone);
    curb.position.set((ax+bx)/2,border.height/2,(az+bz)/2);curb.rotation.y=-Math.atan2(bz-az,bx-ax);curb.receiveShadow=curb.castShadow=true;scene.add(curb);
  }
}
