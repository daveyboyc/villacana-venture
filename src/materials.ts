import * as THREE from "three";
import { asset } from "./asset";

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
/**
 * CC0 Poly Haven surfaces, recoloured to the photos and scaled to the metre
 * (public/textures/CREDITS.md). Each image covers `metres` of surface, so on
 * geometry whose UVs are in metres the shared texture tiles at true size.
 */
export type PhotoSurface="plaster"|"roof-tiles"|"crazy-paving"|"terracotta";
const PHOTO_METRES:Record<PhotoSurface,number>={plaster:2,"roof-tiles":2.5,"crazy-paving":2,terracotta:3.2};
const photoCache=new Map<string,THREE.Texture>();
export function photoTexture(name:PhotoSurface,normal=false):THREE.Texture {
  const key=name+(normal?"-normal":"");const saved=photoCache.get(key);if(saved)return saved;
  const texture=new THREE.TextureLoader().load(asset(`/textures/${key}.jpg`));
  if(!normal)texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.setScalar(1/PHOTO_METRES[name]);texture.anisotropy=8;
  photoCache.set(key,texture);return texture;
}
/** The metres one image of a photo surface covers, for geometry whose UVs are not in metres. */
export function photoMetres(name:PhotoSurface):number {return PHOTO_METRES[name];}
const cache=new Map<string,THREE.Texture>();
/** Shared surfaces. "paving" is the terracotta photo surface: 0.4 m tiles, 8 to an image 3.2 m across. */
export function surfaceTexture(kind:"plaster"|"paving"|"mosaic"|"turf"):THREE.Texture {
  if(kind==="paving")return photoTexture("terracotta");
  const saved=cache.get(kind);if(saved)return saved;
  const c=document.createElement("canvas");
  {
    c.width=c.height=256;const g=c.getContext("2d")!,pixels=g.createImageData(256,256);
    for(let i=0;i<pixels.data.length;i+=4){const v=kind==="plaster"?235+noise(i)*17:kind==="turf"?225+noise(i)*27:202+noise(Math.floor(i/4/16))*18;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;pixels.data[i+3]=255;}
    g.putImageData(pixels,0,0);
    if(kind==="turf") {
      // A 1.6 m swatch: short, irregular blades with wrapped edges for seamless
      // repetition. No external image, Canvas filters or extra geometry needed.
      g.lineWidth=.8;g.lineCap="round";
      for(let i=0;i<6500;i++) {
        const x=noise(i+17)*256,y=noise(i+503)*256;
        g.strokeStyle=["#b5b5b5","#dedede","#969696","#fafafa"][i%4];
        const dx=(noise(i+900)-.5)*4,dy=1+noise(i+700)*5;
        for(const ox of [-256,0,256])for(const oy of [-256,0,256]) {
          g.beginPath();g.moveTo(x+ox,y+oy);g.lineTo(x+ox+dx,y+oy-dy);g.stroke();
        }
      }
    }
    if(kind==="mosaic"){g.strokeStyle="#a2a7a2";g.lineWidth=1;for(let at=0;at<256;at+=16){g.beginPath();g.moveTo(at,0);g.lineTo(at,256);g.moveTo(0,at);g.lineTo(256,at);g.stroke();}}
  }
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.setScalar(kind==="plaster"?1:1/1.6);texture.anisotropy=4;cache.set(kind,texture);return texture;
}
export function plasterMaterial(color="#f7f7ee"):THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({color,map:photoTexture("plaster"),normalMap:photoTexture("plaster",true),normalScale:new THREE.Vector2(.6,.6),roughness:.95});
}

export type GroundDetail={mask:HTMLCanvasElement;slabs:HTMLCanvasElement;turn:number};
/**
 * Preserve the mapped cover while adding grass at the same metre scale in
 * single-courtyard and whole-resort views. With `detail`, the mask's red, green
 * and blue mark pool deck, terracotta paving and crazy paving, drawn at full
 * resolution in metres and turned square to the houses like the painted paving.
 * Standard lighting, alpha cutouts and mipmaps still apply on mobile and desktop.
 * Raised ground reuses this material.
 */
export function groundMaterial(map:THREE.Texture,lawnCanvas:HTMLCanvasElement,metres:number,detail?:GroundDetail):THREE.MeshStandardMaterial {
  const mask=new THREE.CanvasTexture(lawnCanvas);
  const turf=surfaceTexture("turf");
  const material=new THREE.MeshStandardMaterial({map,roughness:.95,alphaTest:.5});
  const detailMask=detail?new THREE.CanvasTexture(detail.mask):null;
  const slabs=detail?new THREE.CanvasTexture(detail.slabs):null;
  if(slabs){slabs.colorSpace=THREE.SRGBColorSpace;slabs.wrapS=slabs.wrapT=THREE.RepeatWrapping;slabs.anisotropy=8;}
  const turn=(detail?.turn??0)*Math.PI/180;
  material.onBeforeCompile=shader=>{
    shader.uniforms.lawnMask={value:mask};
    shader.uniforms.turfDetail={value:turf};
    shader.uniforms.groundMetres={value:metres};
    shader.uniforms.detailMask={value:detailMask};
    shader.uniforms.deckSlabs={value:slabs};
    shader.uniforms.terracotta={value:detail?photoTexture("terracotta"):null};
    shader.uniforms.crazyPaving={value:detail?photoTexture("crazy-paving"):null};
    shader.uniforms.detailTurn={value:new THREE.Vector2(Math.cos(turn),Math.sin(turn))};
    shader.fragmentShader=shader.fragmentShader.replace("#include <common>",`#include <common>
      uniform sampler2D lawnMask;
      uniform sampler2D turfDetail;
      uniform float groundMetres;
      ${detail?`uniform sampler2D detailMask;
      uniform sampler2D deckSlabs;
      uniform sampler2D terracotta;
      uniform sampler2D crazyPaving;
      uniform vec2 detailTurn;`:""}`)
      .replace("#include <map_fragment>",`#include <map_fragment>
      float lawn = texture2D(lawnMask, vMapUv).r;
      vec3 blades = texture2D(turfDetail, vMapUv * groundMetres / 1.6).rgb;
      diffuseColor.rgb *= mix(vec3(1.0), blades * 1.25, lawn);
      ${detail?`vec3 surfaces = texture2D(detailMask, vMapUv).rgb;
      vec2 m = vMapUv * groundMetres;
      vec2 turned = vec2(detailTurn.x * m.x - detailTurn.y * m.y, detailTurn.y * m.x + detailTurn.x * m.y);
      diffuseColor.rgb = mix(diffuseColor.rgb, texture2D(deckSlabs, turned / 4.8).rgb, surfaces.r);
      diffuseColor.rgb = mix(diffuseColor.rgb, texture2D(terracotta, turned / ${PHOTO_METRES.terracotta.toFixed(1)}).rgb, surfaces.g);
      diffuseColor.rgb = mix(diffuseColor.rgb, texture2D(crazyPaving, m / ${PHOTO_METRES["crazy-paving"].toFixed(1)}).rgb, surfaces.b);`:""}`);
  };
  material.customProgramCacheKey=()=>detail?"mapped-turf-detail-v1":"mapped-turf-v1";
  return material;
}
