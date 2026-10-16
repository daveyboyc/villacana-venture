import * as THREE from "three";
import data from "../data/eva_walled_lawn.json";
import { pointInRing } from "./geom";
import { plasterMaterial, surfaceTexture } from "./materials";
import type { Vec2 } from "./types";

export const evaLawn = data;
export const evaLawnRings = [data.lawn.ring, data.evaLawn.ring] as Vec2[][];
export const inEvaLawn = (x: number, z: number): boolean => evaLawnRings.some(r => pointInRing(x, z, r));

/** Procedural walls/props give way to the photo-built bounded lawn fragments. */
export function suppressInEvaLawn<T extends {gardenWalls: Vec2[];gardenGates: Vec2[];props: {x:number;z:number}[]}>(skeleton:T): void {
  skeleton.gardenWalls = skeleton.gardenWalls.filter(([x,z]) => !inEvaLawn(x,z));
  skeleton.gardenGates = skeleton.gardenGates.filter(([x,z]) => !inEvaLawn(x,z));
  skeleton.props = skeleton.props.filter(p => !inEvaLawn(p.x,p.z));
}

/** The existing gateway wing is reused, never duplicated or moved. Only its photographed return is new. */
export function evaWallRings(): Vec2[][] {
  const [a,b] = data.wall.points, t = data.wall.thickness / 2, l = Math.hypot(b[0]-a[0],b[1]-a[1]);
  const nx = (b[1]-a[1])*t/l, nz = -(b[0]-a[0])*t/l;
  return [[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]]];
}
const flat = (ring: Vec2[]) => new THREE.Shape(ring.map(([x,z]) => new THREE.Vector2(x,-z)));
function mesh(g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const o = new THREE.Mesh(g,m);o.position.set(x,y,z);o.name = data.id;o.castShadow = o.receiveShadow = true;return o;
}

/** Original deterministic wall painting: woody horizontal branches, sparse leaves and purple bracts. */
function espalierTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");c.width = 512;c.height = 256;
  const g = c.getContext("2d")!;
  g.lineCap = "round";
  for (let branch=0;branch<5;branch++) {
    const y = 220-branch*39;
    g.strokeStyle = "#66543b";g.lineWidth = 5-branch*.6;
    g.beginPath();g.moveTo(252,250);g.bezierCurveTo(245,y+28,100,y+35,8,y);g.stroke();
    g.beginPath();g.moveTo(252,250);g.bezierCurveTo(260,y+25,410,y-12,505,y-18);g.stroke();
    for(let j=0;j<68;j++) {
      const x=(j*71+branch*53)%510, yy=y+Math.sin(j*2.3+branch)*23;
      g.fillStyle=j%3 ? "#45683b" : "#6d853f";g.beginPath();g.ellipse(x,yy,5,2.8,j,0,Math.PI*2);g.fill();
      if(j%3===0) {g.fillStyle=j%2 ? "#ab438e" : "#cc5ba5";g.beginPath();g.arc(x+4,yy-5,4,0,Math.PI*2);g.fill();}
    }
  }
  const texture = new THREE.CanvasTexture(c);texture.colorSpace = THREE.SRGBColorSpace;return texture;
}

export function addEvaLawn(scene: THREE.Scene): void {
  const wall = mesh(new THREE.ExtrudeGeometry(flat(evaWallRings()[0]),{depth:data.wall.height,bevelEnabled:false}).rotateX(-Math.PI/2),plasterMaterial("#fffdf5"),0,0,0);
  wall.userData.evaStructural = true;scene.add(wall);
  for(const ring of evaLawnRings) {
    const lawn = mesh(new THREE.ShapeGeometry(flat(ring)).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:"#668448",map:surfaceTexture("turf"),roughness:1}),0,.025,0);
    lawn.userData.evaStructural = true;scene.add(lawn);
  }
  if(scene.userData.layoutOnly)return;
  const guard = scene.userData.decorationClearance as ((x:number,z:number,radius:number)=>boolean)|undefined;
  const clear = (p:number[],r:number) => !guard || guard(p[0],p[1],r);
  // A SINGLE plane on each wall face, aligned with that wall, never billboarded/crossed.
  const paint = new THREE.MeshStandardMaterial({map:espalierTexture(),transparent:true,alphaTest:.2,side:THREE.DoubleSide,roughness:1});
  for(const [a,b] of data.espalier.faces) {
    const length=Math.hypot(b[0]-a[0],b[1]-a[1]),p=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    if(!clear(p,length/2))continue;
    const plane=mesh(new THREE.PlaneGeometry(length,data.espalier.height),paint,p[0],data.espalier.height/2+.1,p[1]);
    plane.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);plane.userData.evaEspalier=true;scene.add(plane);
  }
  const green=new THREE.MeshStandardMaterial({color:"#203f31",roughness:.7}),opal=new THREE.MeshStandardMaterial({color:"#e3dfb8",roughness:.45});
  for(const p of data.bollards) if(clear(p,.14)) {
    scene.add(mesh(new THREE.CylinderGeometry(.09,.12,.38,16),green,p[0],.19,p[1]),mesh(new THREE.CylinderGeometry(.09,.09,.18,16),opal,p[0],.47,p[1]));
  }
  const h=data.hedge,mid=[(h.from[0]+h.to[0])/2,(h.from[1]+h.to[1])/2],length=Math.hypot(h.to[0]-h.from[0],h.to[1]-h.from[1]);
  if(clear(mid,Math.hypot(length,h.depth)/2)) {
    const hedge=mesh(new THREE.BoxGeometry(length,h.height,h.depth),new THREE.MeshStandardMaterial({color:"#496c38",map:surfaceTexture("turf"),roughness:1}),mid[0],h.height/2,mid[1]);
    hedge.rotation.y=-Math.atan2(h.to[1]-h.from[1],h.to[0]-h.from[0]);scene.add(hedge);
  }
  const tree=data.evaLawn.tree;
  if(clear(tree,1.05)) {
    scene.add(mesh(new THREE.CylinderGeometry(.1,.14,1.8,9),new THREE.MeshStandardMaterial({color:"#8b8066",roughness:1}),tree[0],.9,tree[1]));
    const crown=mesh(new THREE.SphereGeometry(1,16,12),new THREE.MeshStandardMaterial({color:"#46563a",roughness:1}),tree[0],2.35,tree[1]);crown.scale.set(1,.85,1);scene.add(crown);
  }
  const lamp=data.evaLawn.lamp;
  if(clear(lamp,.25)) scene.add(mesh(new THREE.CylinderGeometry(.035,.05,2.8,8),green,lamp[0],1.4,lamp[1]),mesh(new THREE.CylinderGeometry(.16,.1,.35,4),opal,lamp[0],2.9,lamp[1]),mesh(new THREE.ConeGeometry(.23,.2,4),green,lamp[0],3.16,lamp[1]));
}
