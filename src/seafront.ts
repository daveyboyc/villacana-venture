import * as THREE from "three";
import { centroid } from "./geom";
import type { Seaside } from "./seaside";
import type { Seafront, Vec2 } from "./types";

function flat(scene: THREE.Scene, ring: Vec2[], color: string, height: number): void {
  const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
  mesh.position.y = height; mesh.receiveShadow = true; scene.add(mesh);
}

function outline(scene: THREE.Scene, points: Vec2[], color: string, height: number, closed = false): void {
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints((closed ? [...points, points[0]] : points).map(([x, z]) => new THREE.Vector3(x, height, z))), new THREE.LineBasicMaterial({ color }));
  scene.add(line);
}

/** Shared seaside geometry: the blueprint and walk use the same outlines. */
export function addSeafrontOutlines(scene: THREE.Scene, sf: Seafront, restaurant = true, seaside?: Seaside): void {
  // With seaside heights the sand and paseo are drawn by addSeaside; only the sea is flat.
  flat(scene, [...sf.coast, [1500, 1500], [-1500, 1500]], "#147ba8", seaside ? seaside.seaY : 0.12);
  if (!seaside) {
    flat(scene, sf.beach.ring, "#e1c99c", 0.14);
    outline(scene, sf.coast, "#e2f9f5", 0.17);
    // A continuous ribbon along the mapped paseo, with joined corners.
    const points = sf.paseo.points;
    const side = (sign: number): Vec2[] => points.map(([x,z], i) => {
      const a = points[Math.max(0,i-1)], b = points[Math.min(points.length-1,i+1)];
      const length = Math.hypot(b[0]-a[0],b[1]-a[1]) || 1;
      return [x + sign*(b[1]-a[1])/length*sf.paseo.width/2, z-sign*(b[0]-a[0])/length*sf.paseo.width/2];
    });
    const path = [...side(1), ...side(-1).reverse()];
    flat(scene,path,"#ce9878",0.18);
    outline(scene,path,"#f2debb",0.2,true);
  }
  if (!restaurant) return;
  // The restaurant stands on the sand, at whatever height the beach has there.
  const c = centroid(sf.restaurant.ring), base = seaside ? seaside.y(c.x, c.z) : 0;
  flat(scene,sf.restaurant.terrace,"#b89c7b",base+0.22);
  outline(scene,sf.restaurant.terrace,"#784f3b",base+0.24,true);
  addBarrakaRoof(scene,sf.restaurant.ring,sf.restaurant.name,base);
}

/** The registry building is already drawn; add its low thatched roof. */
function addBarrakaRoof(scene: THREE.Scene, ring: Vec2[], name: string, base = 0): void {
  const centre = centroid(ring);
  const positions: number[] = [], uvs: number[] = [];
  for(let i=0;i<ring.length;i++) {
    const a=ring[i],b=ring[(i+1)%ring.length];
    positions.push(a[0],base+3.1,a[1],centre.x,base+4.7,centre.z,b[0],base+3.1,b[1]);
    uvs.push(a[0]/2,a[1]/2,centre.x/2,centre.z/2,b[0]/2,b[1]/2);
  }
  const canvas=document.createElement("canvas");canvas.width=canvas.height=128;
  const ctx=canvas.getContext("2d")!;ctx.fillStyle="#8b7756";ctx.fillRect(0,0,128,128);
  for(let i=0;i<250;i++) { const x=(i*43)%128,y=(i*71)%128;ctx.strokeStyle=i%2?"#ab9670":"#665941";ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+4,y+18);ctx.stroke(); }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));geometry.computeVertexNormals();
  const roof=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map:texture,roughness:1,side:THREE.DoubleSide}));roof.castShadow=true;scene.add(roof);
  const signCanvas=document.createElement("canvas");signCanvas.width=512;signCanvas.height=96;
  const g=signCanvas.getContext("2d")!;g.fillStyle="#fff9ed";g.fillRect(0,0,512,96);g.fillStyle="#753e36";g.font="bold 48px sans-serif";g.textAlign="center";g.fillText(name,256,64);
  const signTexture=new THREE.CanvasTexture(signCanvas);signTexture.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Sprite(new THREE.SpriteMaterial({map:signTexture}));sign.scale.set(10,1.9,1);sign.position.set(centre.x,base+6,centre.z);scene.add(sign);
}
