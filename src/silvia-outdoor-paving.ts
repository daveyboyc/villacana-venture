import * as THREE from 'three';
import gate from '../data/middle_pool_south_gate.json';
import data from '../data/middle_pool_lane_frontages.json';

/** Plain exterior square tiles, four columns per atlas. No indoor decorated inserts. */
export function outdoorPavingCanvas(size=512){
 const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d')!,unit=size/4,joint=unit*.032;
 const noise=(a:number,b=0)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v);};
 g.fillStyle='#929087';g.fillRect(0,0,size,size);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const key=row*4+col,x=col*unit,y=row*unit,v=noise(key);
  g.fillStyle=`rgb(${172+v*22},${121+v*24},${103+v*24})`;g.fillRect(x+joint,y+joint,unit-2*joint,unit-2*joint);
  g.save();g.beginPath();g.rect(x+joint,y+joint,unit-2*joint,unit-2*joint);g.clip();
  for(let k=0;k<8;k++){
   const px=x+noise(key,k+1)*unit,py=y+noise(key,k+31)*unit,r=unit*(.08+noise(key,k+51)*.4),wash=g.createRadialGradient(px,py,0,px,py,r);
   wash.addColorStop(0,k%3?'#ded0b74c':'#493d3452');wash.addColorStop(1,'#9c8e7f00');g.fillStyle=wash;g.fillRect(px-r,py-r,r*2,r*2);
  }
  for(let k=0;k<210;k++){g.fillStyle=k%4?'#514b3e35':'#efdfc445';g.fillRect(x+noise(key,k+81)*unit,y+noise(key,k+401)*unit,noise(key,k+701)*2+1,1);}
  g.strokeStyle='#d3b6a16a';g.lineWidth=1.2;g.strokeRect(x+joint+1,y+joint+1,unit-2*joint-2,unit-2*joint-2);g.restore();
 }
 return c;
}
export function outdoorPavingMaterial(){
 const map=new THREE.CanvasTexture(outdoorPavingCanvas());map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;
 const material=new THREE.MeshStandardMaterial({map,roughness:1});material.userData.pavingLayout='plain-four-column-exterior';return material;
}
/** Same lane-aligned columns/row phase on the lane and its estimated side approach. */
export function outdoorPavingUv(x:number,z:number):[number,number]{
 const f=gate.forward,dx=x-gate.center[0],dz=z-gate.center[1],a=dx*f[0]+dz*f[1],c=-dx*f[1]+dz*f[0],sections=data.paving.sections;
 let left=sections[0][1],right=sections[0][2];
 for(let i=1;i<sections.length;i++){
  const p=sections[i-1],q=sections[i];if(q[0]===p[0])continue;
  const t=THREE.MathUtils.clamp((a-p[0])/(q[0]-p[0]),0,1);left=p[1]+(q[1]-p[1])*t;right=p[2]+(q[2]-p[2])*t;
  if(a<=q[0])break;
 }
 return [(c-left)/(right-left),(a-sections[0][0])/(data.paving.columns*data.paving.tilePitch)];
}
