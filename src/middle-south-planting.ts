import * as THREE from 'three';
import gate from '../data/middle_pool_south_gate.json';
import {routeClearance,type ProtectedRoute} from './route-clearance';
/** Finite source-observed planting, rooted within the existing bench planter. */
export function addSouthBenchPlanting(scene:THREE.Scene){
 const routes=(scene.userData.protectedRoutes??[]) as ProtectedRoute[];
 const at=(a:number,c:number)=>[gate.center[0]+gate.forward[0]*a-gate.forward[1]*c,gate.center[1]+gate.forward[1]*a+gate.forward[0]*c];
 const green=['#415a31','#52683c','#667448'].map(color=>new THREE.MeshStandardMaterial({color,roughness:1}));
 const wood=new THREE.MeshStandardMaterial({color:'#695541',roughness:1}),flower=new THREE.MeshStandardMaterial({color:'#ce897d',roughness:1});
 const root=new THREE.Group();root.name='middle-south-bench-planting';root.userData.noDrape=true;root.userData.omittedPlants=[];
 for(const [index,p] of gate.benchPlanting.cypresses.entries()){
  const [x,z]=at(p.along,p.across);if(!routeClearance(routes,x,z,p.radius)){root.userData.omittedPlants.push(`cypress-${index}`);continue;}
  const tree=new THREE.Group();tree.position.set(x,gate.planter.height+.06,z);tree.name=`bench-cypress-${index}`;tree.userData.visibleRadius=p.radius;
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.025,.04,p.height*.55,7),wood);trunk.position.y=p.height*.275;tree.add(trunk);
  const foliage=new THREE.CapsuleGeometry(p.radius,p.height-2*p.radius,6,14),positions=foliage.getAttribute('position'),colours:number[]=[];
  for(let i=0;i<positions.count;i++){
   const y=positions.getY(i),fraction=(y+p.height/2)/p.height,taper=fraction>.7?1-(fraction-.7)*1.4:.96;
   const rough=.9+.06*Math.sin(i*17.3);positions.setXYZ(i,positions.getX(i)*taper*rough,y,positions.getZ(i)*taper*rough);
   const colour=new THREE.Color(['#415a31','#52683c','#596e3d'][i%3]);colours.push(colour.r,colour.g,colour.b);
  }
  foliage.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));foliage.computeVertexNormals();
  const leaves=new THREE.Mesh(foliage,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));leaves.position.y=p.height/2;leaves.castShadow=leaves.receiveShadow=true;tree.add(leaves);
  root.add(tree);
 }
 for(const [index,p] of gate.benchPlanting.geraniums.entries()){
  const [x,z]=at(p.along,p.across);if(!routeClearance(routes,x,z,p.radius)){root.userData.omittedPlants.push(`geranium-${index}`);continue;}
  const shrub=new THREE.Group();shrub.position.set(x,gate.planter.height+.06,z);shrub.name=`bench-geranium-${index}`;shrub.userData.visibleRadius=p.radius;
  for(let i=0;i<15;i++){const angle=i*2.39996,r=(i%3+1)*p.radius*.22;const leaf=new THREE.Mesh(new THREE.SphereGeometry(p.radius*.32,8,5),green[(i+1)%3]);leaf.scale.y=.18;leaf.rotation.z=Math.sin(i)*.55;leaf.position.set(Math.cos(angle)*r,.1+(i%4)*.07,Math.sin(angle)*r);leaf.castShadow=true;shrub.add(leaf);}
  const bloom=new THREE.Mesh(new THREE.SphereGeometry(.035,6,4),flower);bloom.position.set(.08,.36,0);shrub.add(bloom);root.add(shrub);
 }
 scene.add(root);return root;
}
