import * as THREE from "three";
import data from "../data/north_west_canopies.json";
import {centroid, closestOnSegment, pointInRing} from "./geom";
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
function tileTexture():THREE.CanvasTexture {
  const canvas=document.createElement("canvas");canvas.width=canvas.height=128;
  const ctx=canvas.getContext("2d")!;
  ctx.fillStyle="#c49378";ctx.fillRect(0,0,128,128);
  for(let x=0;x<128;x+=32){
    const shade=ctx.createLinearGradient(x,0,x+32,0);shade.addColorStop(0,"#936447");shade.addColorStop(.45,"#d8aa89");shade.addColorStop(1,"#ae7452");ctx.fillStyle=shade;ctx.fillRect(x,0,32,128);
  }
  ctx.strokeStyle="#9e7055";ctx.lineWidth=3;
  for(const y of [1,65]){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(128,y);ctx.stroke();}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}
export function addNorthWestCanopies(scene:THREE.Scene,buildings:Pick<SkeletonBuilding,"id"|"ring">[]):void {
  const base=canopyBase(buildings),material=new THREE.MeshStandardMaterial({map:tileTexture(),roughness:1,side:THREE.DoubleSide});
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
