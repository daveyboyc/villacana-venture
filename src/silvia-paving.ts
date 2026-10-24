import * as THREE from 'three';
import data from '../data/silvia_tunnel.json';

const p=data.paving;
/** Metric coordinates shared by the slab, street apron and bounded garden path. */
export function silviaPavingUv(x:number,z:number):[number,number]{
 const a=p.angleDegrees*Math.PI/180,period=17*p.insertSize;
 return [(x*Math.cos(a)-z*Math.sin(a))/period,(x*Math.sin(a)+z*Math.cos(a))/period];
}
export function setSilviaPavingUvs(geometry:THREE.BufferGeometry,local:(x:number,y:number,z:number)=>[number,number]=(x,_y,z)=>[x,z]){
 const positions=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
 for(let i=0;i<positions.count;i++){const [x,z]=local(positions.getX(i),positions.getY(i),positions.getZ(i));uv.setXY(i,...silviaPavingUv(x,z));}
 return geometry;
}

/** Square-and-dot/hopscotch layout: 4:1 tile sizes, lattice (4,1), (-1,4).
 * Large tiles have four square corners. The offset lattice creates diagonal
 * chains of small inserts without turning the entire field into diamonds.
 * Seventeen insert units give a seamless axis-aligned repeat.
 */
export function silviaPavingCanvas(n=1024){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=n;
 const g=canvas.getContext('2d')!,unit=n/17,joint=unit*.045;
 const hash=(a:number,b=0)=>{const f=Math.sin(a*127.1+b*311.7)*43758.5453;return f-Math.floor(f);};
 const mod=(v:number)=>((v%17)+17)%17;
 g.fillStyle='#b9ae96';g.fillRect(0,0,n,n);
 for(let i=-8;i<=8;i++)for(let j=-8;j<=8;j++){
  const cx=4*i-j,cy=i+4*j,x=cx*unit,y=cy*unit,key=mod(cx)+17*mod(cy),v=hash(key);
  if(x>n||y>n||x+4*unit<0||y+4*unit<0)continue;
  const size=4*unit;
  g.fillStyle=`rgb(${150+v*35},${74+v*28},${49+v*21})`;
  g.fillRect(x+joint,y+joint,size-2*joint,size-2*joint);
  g.save();g.beginPath();g.rect(x+joint,y+joint,size-2*joint,size-2*joint);g.clip();
  // Uneven faded glaze and small worn patches, drawn independently for each tile.
  for(let k=0;k<9;k++){
   const tx=x+hash(key,k+1)*size,ty=y+hash(key,k+31)*size,r=size*(.08+hash(key,k+71)*.27);
   const wash=g.createRadialGradient(tx,ty,0,tx,ty,r);wash.addColorStop(0,k%3?'#dab68b30':'#583c2b20');wash.addColorStop(1,'#a9907000');g.fillStyle=wash;g.fillRect(tx-r,ty-r,r*2,r*2);
  }
  for(let k=0;k<130;k++){g.fillStyle=k%3?'#e7d1a31a':'#4d392719';g.fillRect(x+hash(key,k+151)*size,y+hash(key,k+401)*size,1+hash(key,k+601)*5,1+hash(key,k+701)*2);}
  g.strokeStyle='#d3b99c55';g.lineWidth=joint*.45;g.strokeRect(x+joint*1.4,y+joint*1.4,size-joint*2.8,size-joint*2.8);g.restore();
 }
 // Small square ceramic inserts fill the offset corner gaps, not all grid crossings.
 for(let i=-8;i<=8;i++)for(let j=-8;j<=8;j++){
  const cx=4*i-j+3,cy=i+4*j+4,x=cx*unit,y=cy*unit,key=mod(cx)+17*mod(cy);
  if(x>n||y>n||x+unit<0||y+unit<0)continue;
  g.fillStyle='#e3dfcb';g.fillRect(x+joint,y+joint,unit-2*joint,unit-2*joint);
  g.save();g.translate(x+unit/2,y+unit/2);g.rotate((key%4)*Math.PI/2);
  g.strokeStyle='#28465b';g.fillStyle='#263f56';g.lineWidth=unit*.035;
  const r=unit*.27;
  if(key%4===0){g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke();for(let k=0;k<4;k++){g.rotate(Math.PI/2);g.beginPath();g.ellipse(r*.38,0,r*.35,r*.2,0,0,Math.PI*2);g.fill();}}
  else if(key%4===1){for(let k=0;k<4;k++){g.rotate(Math.PI/2);g.beginPath();g.moveTo(0,0);g.lineTo(r,-r*.6);g.lineTo(r*.7,r*.35);g.closePath();g.fill();}}
  else if(key%4===2){for(let k=0;k<4;k++){g.rotate(Math.PI/2);g.beginPath();g.ellipse(0,r*.6,r*.32,r*.55,0,0,Math.PI*2);g.fill();}g.fillRect(-r*.2,-r*.2,r*.4,r*.4);}
  else {g.strokeRect(-r,-r,r*2,r*2);g.beginPath();g.moveTo(-r,-r);g.lineTo(r,r);g.moveTo(-r,r);g.lineTo(r,-r);g.stroke();}
  g.restore();
 }
 return canvas;
}

export function silviaPavingMaterial(){
 const canvas=silviaPavingCanvas(),map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;
 const material=new THREE.MeshStandardMaterial({map,color:'#e3d9ca',roughness:.96});
 material.userData.pavingLayout=p.layout;material.userData.tileSize=p.tileSize;material.userData.insertSize=p.insertSize;
 return material;
}
