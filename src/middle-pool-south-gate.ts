import * as THREE from "three";
import f from "../data/middle_pool_south_gate.json";
import { plasterMaterial } from "./materials";
import type { Vec2 } from "./types";

// Local +along points south into the lane; +across is the planter on the photo's right.
export const middleSouthAt = (along: number, across = 0): Vec2 => [f.center[0]+f.forward[0]*along-f.forward[1]*across,f.center[1]+f.forward[1]*along+f.forward[0]*across];
export const middleSouthRect = (a:number,b:number,c:number,d:number):Vec2[] => [middleSouthAt(a,c),middleSouthAt(b,c),middleSouthAt(b,d),middleSouthAt(a,d)];
export function middleSouthRings():Vec2[][] {
 const w=f.opening/2,p=f.pier,b=f.planter,s=f.step,panel=f.panel;
 // Leaves are fixed open into the courtyard; the inset step is outside the through route.
 return [-1,1].flatMap(side=>{const c=side*(w+p/2);return [middleSouthRect(-p/2,p/2,c-p/2,c+p/2),middleSouthRect(-f.leafLength,0,side*w-.025,side*w+.025)];}).concat([
  middleSouthRect(b.along[0],s.along[0],...b.across as [number,number]),
  middleSouthRect(s.along[1],b.along[1],...b.across as [number,number]),
  middleSouthRect(s.along[0],s.along[1],...s.across as [number,number]),
  middleSouthRect(...panel.along as [number,number],panel.across,panel.across+.16),
 ]);
}
function crazyPavingTexture():THREE.CanvasTexture {
 const c=document.createElement("canvas");c.width=c.height=512;const g=c.getContext("2d")!;
 g.fillStyle="#858278";g.fillRect(0,0,512,512);
 // Deterministic irregular stone fragments, independent of private source imagery.
 const noise=(n:number)=>{const v=Math.sin(n*127.1)*43758.5;return v-Math.floor(v);};
 const pts=Array.from({length:8},(_,row)=>Array.from({length:8},(_,col)=>[col*85-40+(noise(row*8+col)-.5)*35,row*85-40+(noise(row*8+col+90)-.5)*35]));
 for(let r=0;r<7;r++)for(let x=0;x<7;x++) {
  const quad=[pts[r][x],pts[r][x+1],pts[r+1][x+1],pts[r+1][x]];
  for(const poly of (r+x)%3===0?[[quad[0],quad[1],quad[2]],[quad[0],quad[2],quad[3]]]:[quad]) {
   const n=noise(r*7+x),value=155+n*45;g.fillStyle=`rgb(${value+10},${value+5},${value-6})`;g.strokeStyle="#858278";g.lineWidth=5;g.beginPath();poly.forEach((p,i)=>i?g.lineTo(...p as [number,number]):g.moveTo(...p as [number,number]));g.closePath();g.fill();g.stroke();
  }
 }
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export function addMiddleSouthGate(scene:THREE.Scene):void {
 const group=new THREE.Group();group.position.set(f.center[0],.06,f.center[1]);
 // Reflect across so local x follows photo-right while local z follows the lane.
 group.rotation.y=Math.atan2(f.forward[0],f.forward[1]);group.scale.x=-1;
 const plaster=plasterMaterial("#fffdf5"),iron=new THREE.MeshStandardMaterial({color:"#202823",roughness:.6,metalness:.45}),stone=new THREE.MeshStandardMaterial({color:"#b2a793",map:crazyPavingTexture(),roughness:1});
 const box=(a:number,c:number,w:number,h:number,d:number,y:number,mat:THREE.Material)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(c,y+h/2,a);group.add(m);};
 const w=f.opening/2,p=f.pier;
 for(const side of [-1,1]) {
  box(0,side*(w+p/2),p,f.height+.2,p,0,plaster);
  for(const a of [-f.leafLength,0])box(a,side*w,.035,f.height-.08,.035,0,iron);
  for(const y of [.06,1.05,f.height-.08])box(-f.leafLength/2,side*w,.04,.035,f.leafLength,y,iron);
  for(let a=.12;a<f.leafLength;a+=.12)box(-a,side*w,.018,f.height-.08,.018,0,iron);
 }
 const shape=new THREE.Shape();shape.moveTo(-w-p,f.height);shape.lineTo(w+p,f.height);shape.lineTo(w+p,f.height+.2);shape.quadraticCurveTo(0,f.height+.2+2*f.crownRise,-w-p,f.height+.2);shape.closePath();
 const head=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:f.headDepth,bevelEnabled:false,curveSegments:24}),plaster);head.position.z=-f.headDepth/2;group.add(head);
 // Three thin curved metal ribs above the rendered head; no invented solid pergola roof.
 for(const a of [-.25,0,.25]) {
  const points=Array.from({length:25},(_,i)=>{const x=-w+i*2*w/24;return new THREE.Vector3(x,f.height+.26+f.crownRise*(1-(x/w)**2),a);});
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,.014,5,false),iron));
 }
 const b=f.planter,s=f.step;
 for(const [lo,hi] of [[b.along[0],s.along[0]],[s.along[1],b.along[1]]]) {
  box((lo+hi)/2,(b.across[0]+b.across[1])/2,b.across[1]-b.across[0],b.height,hi-lo,0,plaster);
  box((lo+hi)/2,(b.across[0]+b.across[1])/2,b.across[1]-b.across[0]-2*b.wall,.025,hi-lo-.05,b.height,new THREE.MeshStandardMaterial({color:"#584c32"}));
 }
 box((s.along[0]+s.along[1])/2,(s.across[0]+s.across[1])/2,s.across[1]-s.across[0],s.height,s.along[1]-s.along[0],0,plaster);
 const panel=f.panel,pa=(panel.along[0]+panel.along[1])/2;
 box(pa,panel.across+.08,.16,panel.wallHeight,panel.width,0,plaster);
 const canvas=document.createElement("canvas");canvas.width=384;canvas.height=256;const g=canvas.getContext("2d")!;
 g.fillStyle="#eeeade";g.fillRect(0,0,384,256);
 for(let y=0;y<4;y++)for(let x=0;x<6;x++) {
  const border=y===0||y===3||x===0||x===5;g.strokeStyle="#b6b4a2";g.strokeRect(x*64,y*64,64,64);
  if(border){g.fillStyle="#dcc46e";g.fillRect(x*64+2,y*64+2,60,60);g.fillStyle="#214c96";g.beginPath();g.ellipse(x*64+32,y*64+32,24,27,0,0,Math.PI*2);g.fill();g.strokeStyle="#e7e6ce";g.lineWidth=4;g.beginPath();g.arc(x*64+32,y*64+32,16,0,Math.PI*1.7);g.stroke();}
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 box(pa,panel.across-.006,.012,panel.height,panel.width,panel.bottom,new THREE.MeshStandardMaterial({map:texture,roughness:.8}));
 const paving=f.paving;box((paving.along[0]+paving.along[1])/2,(paving.across[0]+paving.across[1])/2,paving.across[1]-paving.across[0],.014,paving.along[1]-paving.along[0],.006,stone);
 const drain=f.drain;box(drain.along,drain.across,drain.width,.02,drain.length,.023,iron);
 for(let a=-drain.length/2+.04;a<drain.length/2;a+=.055)box(drain.along+a,drain.across,drain.width-.035,.012,.015,.045,new THREE.MeshStandardMaterial({color:"#65716d"}));
 group.traverse(m=>{m.name=f.id;m.userData.noDrape=true;if(m instanceof THREE.Mesh)m.castShadow=m.receiveShadow=true;});scene.add(group);
}
