import * as THREE from "three";
import data from "../data/north_west_canopies.json";
import {centroid, closestOnSegment, pointInRing} from "./geom";
import {photoMetres, photoTexture} from "./materials";
import {siteY} from "./terrain";
import type {SkeletonBuilding, Vec2} from "./types";

/** Individually observed upper balcony roofs, not generated ground enclosures. */
export const northWestCanopies=data.canopies;
export const canopyRing=(c:typeof northWestCanopies[number]):Vec2[]=>c.ring as Vec2[];
export function inNorthWestCanopy(x:number,z:number,radius=0):boolean {
  return northWestCanopies.some(c=>{const r=canopyRing(c);return pointInRing(x,z,r)||r.some((a,i)=>closestOnSegment(x,z,...a,...r[(i+1)%r.length]).d<radius);});
}
export function canopyBase(buildings:Pick<SkeletonBuilding,"id"|"ring">[]):number {
  const house=buildings.find(b=>b.id===data.building);
  if(!house)throw Error("Missing registered north-west canopy house");
  const c=centroid(house.ring);return siteY(c.x,c.z);
}
/** Photo barrel tiles; this geometry's UV units are 1.12 m across and 0.9 m down the slope. */
function tileMaterial():THREE.MeshStandardMaterial {
  const scaled=(t:THREE.Texture)=>{const c=t.clone();c.repeat.set(1.12/photoMetres("roof-tiles"),.9/photoMetres("roof-tiles"));return c;};
  return new THREE.MeshStandardMaterial({map:scaled(photoTexture("roof-tiles")),normalMap:scaled(photoTexture("roof-tiles",true)),roughness:1,side:THREE.DoubleSide});
}
export function addNorthWestCanopies(scene:THREE.Scene,buildings:Pick<SkeletonBuilding,"id"|"ring">[]):void {
  const base=canopyBase(buildings),material=tileMaterial();
  for(const c of northWestCanopies){
    const ring=canopyRing(c),ys=[c.backHeight,c.backHeight,c.eaveHeight,c.eaveHeight],positions:number[]=[],uvs:number[]=[];
    const width=Math.hypot(ring[1][0]-ring[0][0],ring[1][1]-ring[0][1]);
    const depth=Math.hypot(ring[3][0]-ring[0][0],ring[3][1]-ring[0][1]);
    const topUv=[[0,0],[width/1.12,0],[width/1.12,depth/.9],[0,depth/.9]];
    const emit=(indices:number[],lower=0)=>{for(const i of indices){positions.push(ring[i][0],base+ys[i]-lower,ring[i][1]);uvs.push(...topUv[i]);}};
    emit([0,3,2,0,2,1]);emit([0,1,2,0,2,3],c.thickness);
    for(let i=0;i<4;i++){
      const j=(i+1)%4;
      for(const [k,lower] of [[i,0],[j,0],[j,c.thickness],[i,0],[j,c.thickness],[i,c.thickness]]){positions.push(ring[k][0],base+ys[k]-lower,ring[k][1]);uvs.push(...topUv[k]);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));geometry.computeVertexNormals();
    const roof=new THREE.Mesh(geometry,material);roof.name=c.id;roof.userData.noDrape=true;roof.userData.structural=true;roof.userData.overheadCanopy=true;roof.castShadow=roof.receiveShadow=true;scene.add(roof);
  }
}
/** Roof plans are shared with the map; none is a ground-level collision ring. */
export function northWestCanopyBlueprint(){return northWestCanopies.map(c=>({id:c.id,points:canopyRing(c),closed:true,fill:"#c49378",stroke:"#8e624a",width:.12,title:`${c.name} · upper balcony canopy. ${c.trust} · ${c.evidence.join(", ")}`}));}
