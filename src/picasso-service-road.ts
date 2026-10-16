import * as THREE from "three";
import data from "../data/picasso_service_road.json";
import type { Vec2 } from "./types";

export const picassoFeatures = data.features;
export const picassoRamp = data.ramp;
export function picassoStrip(points: number[][], width: number): Vec2[] {
  const [a,b]=points,l=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=(b[1]-a[1])/l*width/2,nz=(a[0]-b[0])/l*width/2;
  return [[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]];
}
export const picassoServiceRings = ():Vec2[][] => [...data.features.map(f=>picassoStrip(f.points,f.thickness)),data.ramp.ring as Vec2[]];

/** Bounded frontage detail, retaining all original road/house geometry and site levels. */
export function addPicassoServiceRoad(scene:THREE.Scene,details:boolean,clear:(x:number,z:number,r:number)=>boolean):void {
  const white=new THREE.MeshStandardMaterial({color:'#f4f1e7',roughness:.95});
  const stone=new THREE.MeshStandardMaterial({color:'#998b71',roughness:1});
  const brown=new THREE.MeshStandardMaterial({color:'#67483d',roughness:.9});
  const iron=new THREE.MeshStandardMaterial({color:'#343b3c',roughness:.75});
  function beam(a:number[],b:number[],w:number,h:number,y:number,mat:THREE.Material,name:string){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(b[0]-a[0],b[1]-a[1]),h,w),mat);
    mesh.position.set((a[0]+b[0])/2,y+h/2,(a[1]+b[1])/2);mesh.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);
    mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);return mesh;
  }
  for(const f of data.features){
    const [a,b]=f.points;
    beam(a,b,f.thickness,f.height,0,f.kind==='plinth'?stone:white,f.id);
    if(f.kind==='utility'){
      // Two brown flush door panels only: no invented shed footprint behind the existing registry building.
      for(const t of [.25,.72]){
        const x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
        const ux=(b[0]-a[0])/5,uz=(b[1]-a[1])/5;
        const shift=[-data.left[0]*.11,-data.left[1]*.11];
        beam([x-ux*.48+shift[0],z-uz*.48+shift[1]],[x+ux*.48+shift[0],z+uz*.48+shift[1]],.04,1.95,.04,brown,f.id+'-door');
      }
    }
    if(f.kind==='plinth'){
      beam(a,b,.045,.045,1.55,iron,f.id+'-rail');
      for(let i=0;i<=4;i++){
        const p=[a[0]+(b[0]-a[0])*i/4,a[1]+(b[1]-a[1])*i/4];
        beam(p,[p[0]+.04,p[1]],.045,.9,.7,iron,f.id+'-post');
      }
    }
  }
  // Private frontage ramp is solid/inaccessible via picassoServiceRings; no walkable ground is asserted.
  const r=data.ramp.ring,shape=new THREE.BufferGeometry();
  const p=(i:number,y:number)=>[r[i][0],y,r[i][1]];
  const vertices=[...p(0,.04),...p(1,.74),...p(2,.74),...p(0,.04),...p(2,.74),...p(3,.04)];
  shape.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));shape.computeVertexNormals();
  const ramp=new THREE.Mesh(shape,new THREE.MeshStandardMaterial({color:'#a49f90',side:THREE.DoubleSide,roughness:1}));ramp.name=data.ramp.id;ramp.receiveShadow=true;scene.add(ramp);
  if(details)for(const bin of data.bins){
    const [x,z]=bin.position;if(!clear(x,z,.85))continue;
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(1.15,1.2,1.1),new THREE.MeshStandardMaterial({color:bin.color,roughness:.9}));
    mesh.position.set(x,.6,z);mesh.name='picasso-details-bin';scene.add(mesh);
    beam([x-.6,z],[x+.6,z],1.15,.12,1.2,iron,'picasso-details-bin-lid');
  }
}
