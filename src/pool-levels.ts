import {plasterMaterial,surfaceTexture} from "./materials";
import { addSprites } from "./sprites";
import * as THREE from "three";
import layout from "../data/main_pool.json";
import { closestOnSegment, pointInRing } from "./geom";
import type { Vec2 } from "./types";

const levels = layout.levels;
const angle = 26 * Math.PI / 180;
export const poolLevelPoint = ([x,z]: number[]): Vec2 => [x*Math.cos(angle)+z*Math.sin(angle),-x*Math.sin(angle)+z*Math.cos(angle)];
export const LOWER_POOL_Y = -levels.drop;
export const POOL_TERRACE_ID = levels.terraceId;
export const poolTerraceRing = levels.terraceRing.map(poolLevelPoint);
export const lowerPoolHoles = (levels.lowerHoles as number[][][]).map(r=>r.map(poolLevelPoint));
export const lowerPoolRing = levels.lowerArea.map(poolLevelPoint);
/** The hole in the street-level ground: the lowered area and the lowered lanes beside it. */
export const sheetCutRing = levels.sheetCut.map(poolLevelPoint);
export const poolAccess = [
  { id:"main-pool-steps",name:"Steps to big pool",...levels.steps,kind:"steps" },
  { id:"main-pool-ramp",name:"Steps to Enrique’s",...levels.enriqueSteps,kind:"steps" },
].map(a=>({...a,points:a.points.map(poolLevelPoint)}));

/**
 * The garden behind the east end of the paseo wall, falling from street level at the house fronts
 * to `wallHeight` above the paseo at the wall (data/guillermo_slope.json gardenFall).
 */
const garden = levels.gardenFall;
export const gardenFallRing = garden.ring.map(poolLevelPoint);
const gardenFace = garden.face.map(poolLevelPoint), gardenInland = garden.inland.map(e=>e.map(poolLevelPoint));
const paseoAt = (tx:number):number => {
  const profile = levels.seafront.profile;
  if (tx <= profile[0][0]) return profile[0][1];
  for (let i = 1; i < profile.length; i++) if (tx <= profile[i][0]) return profile[i-1][1] + (profile[i][1]-profile[i-1][1]) * (tx-profile[i-1][0]) / (profile[i][0]-profile[i-1][0]);
  return profile[profile.length-1][1];
};
export function gardenFallY(x:number,z:number):number {
  const tx = x*Math.cos(angle) - z*Math.sin(angle);
  const toFace = Math.min(...gardenFace.slice(1).map((b,i)=>closestOnSegment(x,z,...gardenFace[i],...b).d));
  const toInland = Math.min(...gardenInland.map(([a,b])=>closestOnSegment(x,z,...a,...b).d));
  return Math.min(0, paseoAt(tx) + garden.wallHeight) * toInland / ((toInland + toFace) || 1);
}

/** The access meshes and movement share one source of elevations. */
export function lowerTerrainY(_x:number,_z:number):number {
  // The pool lawn is level all the way to the paseo and the beach (src/seaside.ts takes over there).
  return LOWER_POOL_Y;
}

export function poolGroundY(x:number,z:number):number {
  for(const access of poolAccess) {
    // A flight may bend: find the nearest stretch of its centre line and how far down it that is.
    let nearest=Infinity,walked=0,before=0;
    for(let i=0;i<access.points.length-1;i++) {
      const a=access.points[i],b=access.points[i+1],hit=closestOnSegment(x,z,...a,...b);
      if(hit.d<nearest) {nearest=hit.d;walked=before+Math.hypot(hit.x-a[0],hit.z-a[1]);}
      before+=Math.hypot(b[0]-a[0],b[1]-a[1]);
    }
    if(nearest<=access.width/2) {
      let t=walked/before;
      if(access.kind==="steps") t=Math.floor(t*access.count)/access.count;
      return LOWER_POOL_Y*t;
    }
  }
  if(pointInRing(x,z,gardenFallRing)) return gardenFallY(x,z);
  if(!pointInRing(x,z,lowerPoolRing)||lowerPoolHoles.some(r=>pointInRing(x,z,r))) return 0;
  return lowerTerrainY(x,z);
}

/** The centre and both edges of a flight, a fraction `t` of the way down its centre line. */
export function accessSection(access:{points:Vec2[];width:number},t:number):{c:Vec2;l:Vec2;r:Vec2} {
  const pts=access.points,lengths=pts.slice(1).map((p,i)=>Math.hypot(p[0]-pts[i][0],p[1]-pts[i][1])),total=lengths.reduce((a,b)=>a+b,0);
  let left=Math.min(Math.max(t,0),1)*total,i=0;
  while(i<lengths.length-1&&left>lengths[i]) left-=lengths[i++];
  const a=pts[i],b=pts[i+1],f=left/lengths[i],c:Vec2=[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];
  // At a bend the edge turns half-way between the two stretches, so treads fan round it.
  const dirAt=(k:number):Vec2=>{const p=pts[Math.max(0,Math.min(pts.length-2,k))],q=pts[Math.max(1,Math.min(pts.length-1,k+1))],n=Math.hypot(q[0]-p[0],q[1]-p[1])||1;return [(q[0]-p[0])/n,(q[1]-p[1])/n];};
  const here=dirAt(i),blend=f<0.5?dirAt(i-1):dirAt(i+1),w=Math.abs(f-0.5);
  let dx=here[0]*(0.5+w)+blend[0]*(0.5-w),dz=here[1]*(0.5+w)+blend[1]*(0.5-w);const n=Math.hypot(dx,dz)||1;dx/=n;dz/=n;
  const nx=dz*access.width/2,nz=-dx*access.width/2;
  return {c,l:[c[0]+nx,c[1]+nz],r:[c[0]-nx,c[1]-nz]};
}

/** Solid footprints of the walls down each side of every flight, so the player cannot step off the side. */
export function accessWallRings():Vec2[][] {
  const rings:Vec2[][]=[];
  for(const access of poolAccess) {
    const pieces=Math.max(access.count,8);
    for(let i=0;i<pieces;i++) {
      const A=accessSection(access,i/pieces),B=accessSection(access,(i+1)/pieces);
      for(const side of ["l","r"] as const) {
        // From the edge of the treads outward, a little longer than the piece so bends leave no gap.
        const a=A[side],b=B[side],ox=(a[0]-A.c[0])*0.3,oz=(a[1]-A.c[1])*0.3,px=(b[0]-B.c[0])*0.3,pz=(b[1]-B.c[1])*0.3;
        const ex=(b[0]-a[0])*0.15,ez=(b[1]-a[1])*0.15;
        rings.push([[a[0]-ex,a[1]-ez],[b[0]+ex,b[1]+ez],[b[0]+px+ex,b[1]+pz+ez],[a[0]+ox-ex,a[1]+oz-ez]]);
      }
    }
  }
  return rings;
}

export function addPoolAccess(scene:THREE.Scene,open:(x:number,z:number)=>boolean=()=>false):void {
  const stone=plasterMaterial("#fff7e7");stone.side=THREE.DoubleSide;
  const tile=new THREE.MeshStandardMaterial({color:"#ffffff",map:surfaceTexture("paving"),roughness:0.9,side:THREE.DoubleSide});
  // Retain the elevated streets beside the lowered pool and lawn.
  for(const ring of [lowerPoolRing,...lowerPoolHoles]) for(let i=0;i<ring.length;i++) {
    const start=ring[i],end=ring[(i+1)%ring.length],pieces=Math.max(1,Math.ceil(Math.hypot(end[0]-start[0],end[1]-start[1])));
    for(let k=0;k<pieces;k++) {
      const a:Vec2=[start[0]+(end[0]-start[0])*k/pieces,start[1]+(end[1]-start[1])*k/pieces],b:Vec2=[start[0]+(end[0]-start[0])*(k+1)/pieces,start[1]+(end[1]-start[1])*(k+1)/pieces];
      // No wall where the lawn runs out level onto the paseo and beach.
      if(open((a[0]+b[0])/2,(a[1]+b[1])/2)) continue;
      const ay=lowerTerrainY(a[0],a[1]),by=lowerTerrainY(b[0],b[1]);
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute([
        a[0],0,a[1],b[0],by,b[1],a[0],ay,a[1],a[0],0,a[1],b[0],0,b[1],b[0],by,b[1]
      ],3));const positions=g.getAttribute("position"),uvs:number[]=[];for(let v=0;v<positions.count;v++)uvs.push(positions.getX(v)+positions.getY(v),positions.getZ(v)+positions.getY(v));g.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();scene.add(new THREE.Mesh(g,stone));
    }
  }
  for(const access of poolAccess) {
    const count=access.kind==="steps"?access.count:1;
    // A flight of steps is closed in by a white wall down each side.
    const tall=(access as {tallWall?:{side:string;top:number;hedge?:boolean}}).tallWall,tallSide=tall?.side==="west"?-1:1;
    const hedge:{x:number;y:number;z:number;scale:number}[]=[];
    if(access.kind==="steps") for(const side of [1,-1]) {
      const cheek:number[]=[];
      for(let i=0;i<count;i++) {
        const t=i/count,u=(i+1)/count,y=LOWER_POOL_Y*t;
        const A=accessSection(access,t),B=accessSection(access,u),[ax,az]=side>0?A.l:A.r,[bx,bz]=side>0?B.l:B.r;
        // One side may be a tall wall with a level top; the other follows the steps down.
        const top=tall&&side===tallSide?tall.top:y+0.5;
        cheek.push(ax,top,az,bx,top,bz,ax,LOWER_POOL_Y,az,ax,LOWER_POOL_Y,az,bx,top,bz,bx,LOWER_POOL_Y,bz);
        if(tall?.hedge&&side===tallSide&&i%2===0) hedge.push({x:(ax+bx)/2,y:tall.top-0.1,z:(az+bz)/2,scale:0.8});
      }
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(cheek,3));
      const positions=g.getAttribute("position"),uvs:number[]=[];for(let v=0;v<positions.count;v++)uvs.push(positions.getX(v)+positions.getY(v),positions.getZ(v)+positions.getY(v));g.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
      g.computeVertexNormals();const wall=new THREE.Mesh(g,stone);wall.castShadow=wall.receiveShadow=true;scene.add(wall);
    }
    if(hedge.length) addSprites(scene,"hedge",hedge);
    // A planting bed beside the steps, held by a low curved white wall.
    const bed=(access as {bed?:{wall:number[][];height:number}}).bed;
    if(bed) {
      const line=bed.wall.map(poolLevelPoint),wall:number[]=[];
      for(let i=0;i<line.length-1;i++) {
        const [ax,az]=line[i],[bx,bz]=line[i+1],top=LOWER_POOL_Y+bed.height;
        wall.push(ax,top,az,bx,top,bz,ax,LOWER_POOL_Y,az,ax,LOWER_POOL_Y,az,bx,top,bz,bx,LOWER_POOL_Y,bz);
      }
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(wall,3));
      const positions=g.getAttribute("position"),uvs:number[]=[];for(let v=0;v<positions.count;v++)uvs.push(positions.getX(v)+positions.getY(v),positions.getZ(v)+positions.getY(v));g.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
      g.computeVertexNormals();const kerb=new THREE.Mesh(g,stone);kerb.castShadow=kerb.receiveShadow=true;scene.add(kerb);
      // Soil inside the wall, up against the side of the steps.
      const edge=[accessSection(access,0.25).l,accessSection(access,0.6).l,accessSection(access,1).l];
      const shape=new THREE.Shape([...line,...edge].map(([x,z])=>new THREE.Vector2(x,-z)));
      const soil=new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:"#3f5a34",roughness:1}));
      soil.position.y=LOWER_POOL_Y+bed.height-0.15;soil.receiveShadow=true;scene.add(soil);
    }
    for(let i=0;i<count;i++) {
      const t=i/count,u=(i+1)/count,y=LOWER_POOL_Y*t,by=access.kind==="steps"?y:LOWER_POOL_Y*u;
      const A=accessSection(access,t),B=accessSection(access,u);
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute([
        A.l[0],y,A.l[1],B.l[0],by,B.l[1],A.r[0],y,A.r[1],A.r[0],y,A.r[1],B.l[0],by,B.l[1],B.r[0],by,B.r[1],
        B.l[0],by,B.l[1],B.l[0],LOWER_POOL_Y*u,B.l[1],B.r[0],by,B.r[1],B.r[0],by,B.r[1],B.l[0],LOWER_POOL_Y*u,B.l[1],B.r[0],LOWER_POOL_Y*u,B.r[1]
      ],3));const positions=g.getAttribute("position"),uvs:number[]=[];for(let v=0;v<positions.count;v++)uvs.push(positions.getX(v)+positions.getY(v),positions.getZ(v)+positions.getY(v));g.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();const mesh=new THREE.Mesh(g,tile);mesh.receiveShadow=true;mesh.userData.referenceSurface=true;scene.add(mesh);
    }
  }
}

/** Subdivide the lower lawn so its final grading joins the existing paseo terrain. */
export function lowerPoolSurface(holes:Vec2[][]):THREE.BufferGeometry {
  return loweredSurface(levels.surfaceRing.map(poolLevelPoint),[...holes,...(levels.surfaceHoles as number[][][]).map(r=>r.map(poolLevelPoint))],lowerTerrainY);
}

/**
 * The falling garden's ground: a grid of square cells clipped to its outline. Neighbouring cells
 * share every vertex, so the slope has no hairline seams (which the lawn's split triangles can leave).
 */
export function gardenFallSurface(cell=1):THREE.BufferGeometry {
  const ring=gardenFallRing,xs=ring.map(p=>p[0]),zs=ring.map(p=>p[1]),out:number[]=[];
  // Keep the part of a polygon on one side of an axis line (Sutherland-Hodgman; the cell is convex).
  const clip=(poly:Vec2[],axis:0|1,at:number,keepBelow:boolean):Vec2[]=>{
    const inside=(p:Vec2)=>keepBelow?p[axis]<=at:p[axis]>=at,result:Vec2[]=[];
    poly.forEach((p,i)=>{const q=poly[(i+1)%poly.length];
      if(inside(p))result.push(p);
      if(inside(p)!==inside(q)){const t=(at-p[axis])/(q[axis]-p[axis]);result.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}});
    return result;
  };
  for(let x=Math.floor(Math.min(...xs));x<Math.max(...xs);x+=cell) for(let z=Math.floor(Math.min(...zs));z<Math.max(...zs);z+=cell) {
    const piece=clip(clip(clip(clip(ring,0,x,false),0,x+cell,true),1,z,false),1,z+cell,true);
    if(piece.length<3) continue;
    const contour=piece.map(([px,pz])=>new THREE.Vector2(px,pz));
    for(const face of THREE.ShapeUtils.triangulateShape(contour,[])) {
      // Wound so the face looks up once laid flat (x east, z south).
      for(const k of [face[0],face[2],face[1]]) {const [px,pz]=piece[k];out.push(px,gardenFallY(px,pz),pz);}
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(out,3));geometry.computeVertexNormals();
  return geometry;
}

function loweredSurface(ring:Vec2[],holes:Vec2[][],heightAt:(x:number,z:number)=>number):THREE.BufferGeometry {
  const shape=new THREE.Shape(ring.map(([x,z])=>new THREE.Vector2(x,-z)));
  holes.forEach(r=>shape.holes.push(new THREE.Path(r.map(([x,z])=>new THREE.Vector2(x,-z)))));
  const base=new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2).toNonIndexed();
  const pos=base.getAttribute("position"),out:number[]=[];
  const triangle=(a:Vec2,b:Vec2,c:Vec2,depth:number)=>{
    if(depth && Math.max(Math.hypot(a[0]-b[0],a[1]-b[1]),Math.hypot(b[0]-c[0],b[1]-c[1]),Math.hypot(c[0]-a[0],c[1]-a[1]))>2) {
      const ab:Vec2=[(a[0]+b[0])/2,(a[1]+b[1])/2],bc:Vec2=[(b[0]+c[0])/2,(b[1]+c[1])/2],ca:Vec2=[(c[0]+a[0])/2,(c[1]+a[1])/2];
      triangle(a,ab,ca,depth-1);triangle(ab,b,bc,depth-1);triangle(ca,bc,c,depth-1);triangle(ab,bc,ca,depth-1);
    } else for(const [x,z] of [a,b,c]) out.push(x,heightAt(x,z),z);
  };
  for(let i=0;i<pos.count;i+=3) triangle([pos.getX(i),pos.getZ(i)],[pos.getX(i+1),pos.getZ(i+1)],[pos.getX(i+2),pos.getZ(i+2)],7);
  base.dispose();const result=new THREE.BufferGeometry();result.setAttribute("position",new THREE.Float32BufferAttribute(out,3));result.computeVertexNormals();return result;
}
