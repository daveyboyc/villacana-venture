import * as THREE from 'three';
import data from '../data/entrance_planters.json';
import gate from '../data/middle_pool_south_gate.json';
import silvia from '../data/silvia_map.json';
import {planterBed} from './planter-bed';
import {plasterMaterial} from './materials';
import {routeClearance} from './route-clearance';
import type {Vec2} from './types';

export const entranceBeds=data.beds;
export const entranceGardenPath=data.path;
type Frame='silvia'|'pool';
export function entranceWorld(frame:Frame,[x,z]:Vec2):Vec2{
 if(frame==='silvia'){const f=silvia.forward,a=silvia.entry;return [a[0]+f[1]*x+f[0]*z,a[1]-f[0]*x+f[1]*z];}
 const f=gate.forward,a=gate.center;return [a[0]+f[0]*z-f[1]*x,a[1]+f[1]*z+f[0]*x];
}
export function entranceBedRings(frame:Frame):Vec2[][]{return data.beds.filter(b=>b.frame===frame&&b.kind==='kerbed-bed').map(b=>b.ring.map(p=>entranceWorld(frame,p as Vec2)));}
export const entrancePathRing=()=>data.path.ring.map(p=>entranceWorld('silvia',p as Vec2));

/** Shared finite beds; local geometry is used inside the existing tunnel transform. */
export function addEntranceBeds(parent:THREE.Object3D,frame:Frame,details:boolean,world=false,extraClearance?:(x:number,z:number,r:number)=>boolean){
 const root=new THREE.Group();root.name=frame+'-entrance-planters';root.userData.noDrape=true;root.userData.omittedPlants=[];
 const at=(p:Vec2)=>world?entranceWorld(frame,p):p;
 for(const bed of data.beds.filter(b=>b.frame===frame)){
  if(bed.kind==='kerbed-bed')planterBed(root,bed.ring.map(p=>at(p as Vec2)),bed.height,bed.wall,plasterMaterial(bed.color),bed.id);
  if(!details)continue;
  for(const [i,p] of bed.plants.entries()){
   const [x,z]=at(p.at as Vec2),local=p.at;
   const axis=[{id:'silvia-garden-axis',name:'Silvia garden approach',width:1.2,points:[[0,7],[0,12]] as Vec2[]}];
   if((frame==='silvia'&&!routeClearance(axis,local[0],local[1],p.radius))||(extraClearance&&!extraClearance(x,z,p.radius))){root.userData.omittedPlants.push(bed.id+'-'+i);continue;}
   const plant=gardenPlant(p.radius,p.height,p.kind);plant.name=bed.id+'-plant-'+i;plant.position.set(x,.06+bed.height-.035,z);root.add(plant);
  }
 }
 parent.add(root);return root;
}

/** Curved leaf ribbons remain within each declared radius, including their visible tips. */
function gardenPlant(radius:number,height:number,kind:string){
 const root=new THREE.Group();root.userData.visibleRadius=radius;
 const leaves=kind==='strappy'?23:15;
 const material=new THREE.MeshStandardMaterial({color:'#607f38',roughness:1,side:THREE.DoubleSide,vertexColors:true});
 const positions:number[]=[],colours:number[]=[];
 for(let i=0;i<leaves;i++){
  const angle=i*2.39996,reach=radius*(.72+(i%4)*.07),top=height*(.56+(i%5)*.1),width=kind==='strappy'?radius*.09:radius*.32;
  const point=(t:number,side:number)=>{const bend=reach*Math.sin(t*Math.PI*.5),w=width*Math.sin(Math.PI*t)*side,y=kind==='strappy'?top*Math.sin(t*Math.PI*.73):top*t;return [Math.cos(angle)*bend-Math.sin(angle)*w,y,Math.sin(angle)*bend+Math.cos(angle)*w];};
  const color=new THREE.Color().setHSL(.23+(i%4)*.015,.32+(i%3)*.06,.25+(i%5)*.025);
  for(let j=0;j<7;j++){const a=j/7,b=(j+1)/7;for(const p of [point(a,-1),point(b,-1),point(b,1),point(a,-1),point(b,1),point(a,1)]){positions.push(...p);colours.push(color.r,color.g,color.b);}}
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return root;
}
