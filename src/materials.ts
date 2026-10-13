import * as THREE from "three";

/** Original, repeatable surfaces; colour/scale matched to IMG_2263/2237/2204. */
const noise=(i:number)=>{const v=Math.sin(i*127.1+31.7)*43758.5453;return v-Math.floor(v);};
export function pavingCanvas(size=512):HTMLCanvasElement {
  const c=document.createElement("canvas");c.width=c.height=size;const g=c.getContext("2d")!;
  g.fillStyle="#aaa18f";g.fillRect(0,0,size,size);
  const unit=size/4,joint=Math.max(1,size/180);
  for(let row=0;row<4;row++) for(let col=0;col<4;col++) {
    const n=row*4+col,t=noise(n)*12;
    g.fillStyle=`rgb(${166+t},${117+t},${96+t})`;g.fillRect(col*unit+joint,row*unit+joint,unit-joint*2,unit-joint*2);
    g.strokeStyle="rgba(243,219,190,.12)";g.lineWidth=joint;g.strokeRect(col*unit+joint*2,row*unit+joint*2,unit-joint*4,unit-joint*4);
  }
  const pixels=g.getImageData(0,0,size,size);
  for(let i=0;i<pixels.data.length;i+=4){const grain=(noise(i)-.5)*12;for(let k=0;k<3;k++)pixels.data[i+k]+=grain;}
  g.putImageData(pixels,0,0);
  for(let i=0;i<1100;i++){g.fillStyle=i%3?"rgba(48,39,28,.13)":"rgba(233,216,189,.2)";g.fillRect(noise(i+3000)*size,noise(i+8000)*size,1+noise(i+90)*2,1);}
  return c;
}
const cache=new Map<string,THREE.CanvasTexture>();
export function surfaceTexture(kind:"plaster"|"paving"|"mosaic"|"turf"):THREE.CanvasTexture {
  const saved=cache.get(kind);if(saved)return saved;
  const c=kind==="paving"?pavingCanvas():document.createElement("canvas");
  if(kind!=="paving") {
    c.width=c.height=256;const g=c.getContext("2d")!,pixels=g.createImageData(256,256);
    for(let i=0;i<pixels.data.length;i+=4){const v=kind==="plaster"?235+noise(i)*17:kind==="turf"?225+noise(i)*27:202+noise(Math.floor(i/4/16))*18;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;pixels.data[i+3]=255;}
    g.putImageData(pixels,0,0);
    if(kind==="mosaic"){g.strokeStyle="#a2a7a2";g.lineWidth=1;for(let at=0;at<256;at+=16){g.beginPath();g.moveTo(at,0);g.lineTo(at,256);g.moveTo(0,at);g.lineTo(256,at);g.stroke();}}
  }
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.setScalar(kind==="plaster"?1:1/1.6);texture.anisotropy=4;cache.set(kind,texture);return texture;
}
export function plasterMaterial(color="#f7f7ee"):THREE.MeshStandardMaterial {
  const map=surfaceTexture("plaster");return new THREE.MeshStandardMaterial({color,map,bumpMap:map,bumpScale:.025,roughness:.95});
}
