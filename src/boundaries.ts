import * as THREE from "three";
import { closestOnSegment } from "./geom";
import { addSprites, type SpritePlacement } from "./sprites";
import type { Boundary, BoundaryReference, Vec2 } from "./types";

/** Collision geometry follows the very same line that is drawn as a fence. */
export function barrierRings(barriers: Boundary[]): Vec2[][] {
  return barriers.filter((b) => b.solid).flatMap((barrier) => barrier.points.slice(1).map((b,i) => {
    const a=barrier.points[i],dx=b[0]-a[0],dz=b[1]-a[1];const length=Math.hypot(dx,dz)||1;
    const nx=dz/length*barrier.thickness/2,nz=-dx/length*barrier.thickness/2;
    return [[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]] as Vec2[];
  }));
}

export function addBoundaryReference(scene: THREE.Scene, reference: BoundaryReference): void {
  const tileCanvas=document.createElement("canvas");tileCanvas.width=tileCanvas.height=64;
  const tileCtx=tileCanvas.getContext("2d")!;tileCtx.fillStyle="#bba48d";tileCtx.fillRect(0,0,64,64);tileCtx.fillStyle="#c48061";tileCtx.fillRect(2,2,60,60);
  const tiles=new THREE.CanvasTexture(tileCanvas);tiles.colorSpace=THREE.SRGBColorSpace;tiles.wrapS=tiles.wrapT=THREE.RepeatWrapping;tiles.repeat.set(1/0.6,1/0.6);
  const flat=(ring:Vec2[],color:string,y:number,map?:THREE.Texture) => {
    const shape=new THREE.Shape(ring.map(([x,z])=>new THREE.Vector2(x,-z)));
    const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color,map,roughness:1}));
    mesh.position.y=y;mesh.receiveShadow=true;scene.add(mesh);
  };
  const ribbon=(points:Vec2[],width:number):Vec2[] => {
    const edge=(sign:number):Vec2[]=>points.map(([x,z],i)=>{
      const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];const length=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
      return [x+sign*(b[1]-a[1])/length*width/2,z-sign*(b[0]-a[0])/length*width/2];
    });return [...edge(1),...edge(-1).reverse()];
  };
  for(const road of reference.roads) {
    flat(ribbon(road.points,road.width+0.35),"#f4f0e5",0.25);
    flat(ribbon(road.points,road.width),road.surface==="asphalt"?"#7f8384":"#ffffff",0.27,road.surface==="terracotta"?tiles:undefined);
  }
  flat(reference.parking.ring,"#888b8b",0.26);
  const white=new THREE.MeshBasicMaterial({color:"#f6f3e8"});
  if (reference.mainParking) {
    const park = reference.mainParking;
    flat(park.ring, "#969995", 0.26);
    const angle = -park.rotation * Math.PI / 180;
    const noses: Record<string, Vec2> = { east: [1, 0], west: [-1, 0], north: [0, -1], south: [0, 1] };
    for (const row of park.rows) {
      const [a, b] = row.points;
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const [tx, tz] = noses[row.nose];
      const nx = tx * Math.cos(angle) - tz * Math.sin(angle), nz = tx * Math.sin(angle) + tz * Math.cos(angle);
      for (let at = 0; at <= length; at += 2.5) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(5, 0.025, 0.08), white);
        stripe.position.set(a[0] + (b[0] - a[0]) * at / length + nx * 2.5, 0.29, a[1] + (b[1] - a[1]) * at / length + nz * 2.5);
        stripe.rotation.y = Math.atan2(-nz, nx); scene.add(stripe);
      }
    }
  }
  const bays=reference.parking;
  for(let i=0;i<bays.bayLine.length-1;i++) {
    const a=bays.bayLine[i],b=bays.bayLine[i+1];const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
    for(let at=0;at<length;at+=bays.spacing) {
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(bays.depth,0.025,0.08),white);
      mesh.position.set(a[0]+dx/length*at+dz/length*bays.depth/2,0.29,a[1]+dz/length*at-dx/length*bays.depth/2);
      mesh.rotation.y=Math.atan2(dx,dz);
      const crossesWalk = reference.roads.filter((r) => r.surface === "terracotta").some((r) => r.points.slice(1).some((b, j) => {
        const a = r.points[j];
        return closestOnSegment(mesh.position.x, mesh.position.z, a[0], a[1], b[0], b[1]).d < r.width / 2 + 0.25;
      }));
      if (!crossesWalk) scene.add(mesh);
    }
  }
  const canvas=document.createElement("canvas");canvas.width=canvas.height=64;const ctx=canvas.getContext("2d")!;
  ctx.strokeStyle="#68756c";ctx.lineWidth=2;
  for(let x=-64;x<=128;x+=16) {ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+64,64);ctx.moveTo(x,0);ctx.lineTo(x-64,64);ctx.stroke();}
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  const wire=new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:0.2,side:THREE.DoubleSide});
  const steel=new THREE.MeshStandardMaterial({color:"#727b72",roughness:0.85});const hedges:SpritePlacement[]=[];
  for(const fence of reference.barriers) for(let i=0;i<fence.points.length-1;i++) {
    const a=fence.points[i],b=fence.points[i+1];const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
    const geometry=new THREE.PlaneGeometry(length,fence.height);const uv=geometry.getAttribute("uv");for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*length/0.4,uv.getY(k)*fence.height/0.4);
    const panel=new THREE.Mesh(geometry,wire);panel.position.set((a[0]+b[0])/2,fence.height/2,(a[1]+b[1])/2);panel.rotation.y=Math.atan2(-dz,dx);scene.add(panel);
    for(let at=0;at<=length;at+=2.5) {const post=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,fence.height+0.15,6),steel);post.position.set(a[0]+dx/length*at,fence.height/2,a[1]+dz/length*at);scene.add(post);}
    for(let at=0;at<length;at+=1.4)hedges.push({x:a[0]+dx/length*at-dz/length*0.3,z:a[1]+dz/length*at+dx/length*0.3});
  }
  addSprites(scene,"hedge",hedges);
}
