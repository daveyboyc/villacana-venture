import * as THREE from 'three';
import {createSilviaRampPassage,type RampVariant} from './silvia-ramp-passage';
import {asset} from './asset';

/** Photo-relative study of the Calle de Silvia 2-20 and 22-44 ramp passages. Never placed on the map. silvia-ramp.html?preset=IMG_2669|IMG_2670|IMG_2656|IMG_2657|IMG_2574 or ?variant=2-20|22-44[&cam=x,y,z,lx,ly,lz,fov] */
const PRESETS:Record<string,{variant:RampVariant;cam:number[];photo:string}>={
 // Uncalibrated, eye-height cameras standing where each photo seems to have been taken, vertical FOV of a 26 mm (35 mm equivalent) portrait frame.
 'IMG_2669':{variant:'2-20',photo:'IMG_2669.jpg',cam:[.25,1.42,-.9,0,1.05,6,67.6]},
 'IMG_2670':{variant:'2-20',photo:'IMG_2670.jpg',cam:[.35,1.42,-1.6,.1,1.2,6,67.6]},
 'IMG_2656':{variant:'22-44',photo:'IMG_2656.jpg',cam:[.2,1.45,-.8,.05,1.05,6,67.6]},
 'IMG_2657':{variant:'22-44',photo:'IMG_2657.jpg',cam:[.3,1.5,-1.4,-.05,1.0,6,67.6]},
 'IMG_2574':{variant:'22-44',photo:'IMG_2574.jpg',cam:[1.3,1.45,-2.0,-1.0,.5,1.0,67.6]}
};
export function bootSilviaRampStudy(){
 const q=new URLSearchParams(location.search),canvas=document.querySelector<HTMLCanvasElement>('#scene')!;
 for(const id of ['areas','title','current-route','layout-details','back','gate-control','jump','walk-camera','walk-pad','walk-touch-help','overview-controls','alignment-notes','overview','help','inspection-jump']){const n=document.getElementById(id);if(n)n.style.display='none';}
 const style=document.createElement('style');style.textContent='.rs-bar{position:fixed;top:12px;left:12px;right:12px;display:flex;gap:6px;flex-wrap:wrap;z-index:5;font:14px system-ui;color:#273b34}.rs-bar b{background:#fffdf5ed;padding:9px 12px;border-radius:8px}.rs-bar button{font:inherit;padding:9px 12px;border-radius:8px;border:1px solid #b8b9aa;background:#fffdf5;cursor:pointer;min-height:44px}.rs-note{position:fixed;bottom:12px;left:12px;right:12px;background:#fffdf5e8;border-radius:8px;padding:8px 12px;font:12px system-ui;pointer-events:none}';document.head.append(style);
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#d7e2d0');scene.fog=new THREE.Fog('#d7e2d0',14,40);
 scene.add(new THREE.HemisphereLight('#fff8e8','#756f62',1.9));
 const sun=new THREE.DirectionalLight('#fff4d2',1.7);sun.position.set(-4,8,-4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-7,right:7,top:10,bottom:-4,near:.1,far:30});sun.shadow.bias=-.0003;scene.add(sun);
 for(const z of [-1.5,2.2,4.6]){const l=new THREE.PointLight('#fff0d4',z<0?4:3.5,9,2);l.position.set(0,2.4,z);scene.add(l);}
 const garden=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:'#7d9a5e',roughness:1}));garden.rotation.x=-Math.PI/2;garden.position.set(0,-.12,15);garden.receiveShadow=true;scene.add(garden);
 let variant=(q.get('variant')==='22-44'?'22-44':'2-20') as RampVariant,details=q.get('details')!=='0',model:THREE.Group;
 const camera=new THREE.PerspectiveCamera(67.6,1,.05,80),size=()=>{const w=Number(q.get('w'))||innerWidth,h=Number(q.get('h'))||innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
 function build(){if(model){scene.remove(model);}model=createSilviaRampPassage(variant,details);scene.add(model);}
 function aim(c:number[]){camera.position.set(c[0],c[1],c[2]);camera.up.set(0,1,0);camera.lookAt(c[3],c[4],c[5]);camera.fov=c[6]??67.6;camera.updateProjectionMatrix();}
 const bar=document.createElement('nav');bar.className='rs-bar';bar.innerHTML='<b>Calle de Silvia · ramp passages (study)</b>';document.body.append(bar);
 const photo=document.createElement('aside');photo.hidden=true;photo.style.cssText='position:fixed;right:12px;top:70px;width:min(34vw,420px);background:#fffdf5;border-radius:10px;padding:8px;z-index:6';document.body.append(photo);
 let currentPhoto='';
 for(const [name,p] of Object.entries(PRESETS)){const b=document.createElement('button');b.textContent=name.replace('IMG_','')+' view';b.onclick=()=>{variant=p.variant;build();aim(p.cam);currentPhoto=p.photo;};bar.append(b);}
 const cmp=document.createElement('button');cmp.textContent='Compare photo';cmp.onclick=()=>{photo.hidden=!photo.hidden;photo.innerHTML=`<img style="width:100%" src="${asset('/photos-ref/'+currentPhoto)}" alt="Source photograph ${currentPhoto}">`;};bar.append(cmp);
 const note=document.createElement('div');note.className='rs-note';note.textContent='Photo-relative study of the Silvia 2-20 and 22-44 passages: every dimension is an estimate; not placed in the map and not connected to the west tunnel.';document.body.append(note);
 const pre=PRESETS[q.get('preset')??''];if(pre){variant=pre.variant;currentPhoto=pre.photo;}
 build();aim(q.get('cam')?q.get('cam')!.split(',').map(Number):pre?.cam??PRESETS['IMG_2669'].cam);size();addEventListener('resize',size);
 let frames=0;renderer.setAnimationLoop(()=>{renderer.render(scene,camera);if(++frames>2)canvas.dataset.studyReady='true';});
 if(q.get('shot')){for(const n of [...document.querySelectorAll('.rs-bar,.rs-note')])(n as HTMLElement).style.display='none';}
}
