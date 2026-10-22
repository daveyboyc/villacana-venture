import * as THREE from 'three';
import {createSilviaTunnel,silviaTunnelRings} from './silvia-tunnel';
import {CoastField,Solids,clamp} from './geom';
import {Player,type MoveWorld} from './player';
import {asset} from './asset';
import type {InputState} from './types';

/** Explicit photo-relative study in the canonical app. Never substitutes a guessed map footprint. */
export function bootSilviaStudy(){
 const canvas=document.querySelector<HTMLCanvasElement>('#scene')!;
 for(const id of ['areas','title','current-route','layout-details','back','gate-control','jump','walk-camera','overview-controls','alignment-notes','overview','help']){const node=document.getElementById(id);if(node)node.style.display='none';}
 const style=document.createElement('style');style.textContent=`
 .study-bar{position:fixed;top:16px;left:16px;right:16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;z-index:5;font:14px system-ui;color:#273b34}
 .study-bar h1{font-size:18px;margin:0 12px 0 0}.study-bar button,.study-bar a{font:inherit;padding:10px 13px;border-radius:8px;border:1px solid #b8b9aa;background:#fffdf5;color:#273b34;text-decoration:none;cursor:pointer;min-height:44px}.study-bar button[aria-pressed=true]{background:#245e4c;color:white}
 .study-title{box-sizing:border-box;background:#fffdf5ed;padding:10px 14px;border-radius:10px;box-shadow:0 3px 20px #172c2220}.study-title small{display:block;font-size:12px;margin-top:4px}
 .study-help{position:fixed;bottom:16px;left:16px;background:#fffdf5e8;border-radius:8px;padding:10px 14px;font:13px system-ui;pointer-events:none}
 .study-photo{position:fixed;right:16px;top:130px;bottom:60px;width:min(35vw,480px);background:#fffdf5;z-index:6;border-radius:10px;padding:10px;box-sizing:border-box;overflow:auto}.study-photo[hidden]{display:none}.study-photo img{width:100%;display:block}.study-photo p{font:13px system-ui;margin:6px 0}
 .study-move{position:fixed;bottom:16px;right:16px;display:flex;gap:5px}.study-move button{font:20px system-ui;width:46px;height:46px;background:#fffdf5ed;border:1px solid #b8b9aa;border-radius:8px;touch-action:none}
 @media(max-width:650px){.study-bar{top:8px;left:8px;right:8px;gap:4px}.study-title{width:100%;padding:7px 10px}.study-bar button,.study-bar a{padding:7px 10px}.study-help{bottom:74px;left:8px;right:8px;font-size:11px;padding:7px}.study-photo{top:160px;bottom:135px;width:54vw;right:8px}.study-move{bottom:12px;right:8px}}`;
 document.head.append(style);
 const bar=document.createElement('nav');bar.className='study-bar';bar.setAttribute('aria-label','Silvia tunnel study controls');bar.innerHTML='<div class="study-title"><h1>Calle Silvia · tunnel study</h1><small>Recess depths estimated · map connection unresolved</small></div>';document.body.append(bar);
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#c7d8c0');scene.fog=new THREE.Fog('#c7d8c0',18,45);
 scene.add(new THREE.HemisphereLight('#fff8e8','#757064',2.45));
 const sun=new THREE.DirectionalLight('#fff4d2',3.2);sun.position.set(-3,7,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-6,right:6,top:12,bottom:-4,near:.1,far:30});sun.shadow.bias=-.0003;scene.add(sun);
 const entranceLight=new THREE.PointLight('#f6f2e7',12,12,2);entranceLight.position.set(0,2.2,-1);scene.add(entranceLight);
 const exitLight=new THREE.PointLight('#e4edd0',10,10,2);exitLight.position.set(0,2,8);scene.add(exitLight);
 let details=true,model=createSilviaTunnel(true);scene.add(model);
 // A bounded garden fragment visible through the exit; not an inferred connection or far gate.
 const garden=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshStandardMaterial({color:'#769259',roughness:1}));garden.rotation.x=-Math.PI/2;garden.position.set(0,-.005,9);garden.receiveShadow=true;scene.add(garden);
 const camera=new THREE.PerspectiveCamera(65,1,.045,80),player=new Player();
 const world:MoveWorld={solids:new Solids(silviaTunnelRings()),coast:new CoastField([[-100,100],[100,100]],[0,0]),pools:[],bounds:{minX:-10,maxX:10,minZ:-8,maxZ:18},groundHeight:()=>.06};
 const input:InputState={moveX:0,moveZ:0,run:false,jump:false,lookDx:0,lookDy:0,zoom:0,interact:false};
 let yaw=Math.PI,pitch=-.03,plan=false,held:string|undefined;
 const keys=new Set<string>();
 const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();};resize();addEventListener('resize',resize);
 function button(label:string,click:()=>void){const b=document.createElement('button');b.textContent=label;b.onclick=click;bar.append(b);return b;}
 function preset(x:number,z:number,lookX:number,lookZ:number){plan=false;camera.fov=z<0?65:80;camera.updateProjectionMatrix();player.place(x,z,0);yaw=Math.atan2(lookX-x,-(lookZ-z));pitch=-.025;model.traverse(o=>{if(o.name==='T02-flat-ceiling'||o.name.endsWith('-soffit'))o.visible=true;});}
 button('Entrance',()=>preset(0,-2.8,0,6));button('Inside',()=>preset(0,.15,0,6));button('Left recess',()=>preset(0,5.4,2.2,5.4));button('Right recess',()=>preset(0,5.3,-2.2,5.3));
 button('Plan cutaway',()=>{plan=true;model.traverse(o=>{if(o.name==='T02-flat-ceiling'||o.name.endsWith('-soffit'))o.visible=false;});});
 const detailButton=button('Planting on',()=>{details=!details;scene.remove(model);model.traverse(o=>{const m=o as THREE.Mesh;if(m.geometry)m.geometry.dispose();});model=createSilviaTunnel(details);scene.add(model);detailButton.textContent=details?'Planting on':'Planting off';if(plan)model.traverse(o=>{if(o.name==='T02-flat-ceiling'||o.name.endsWith('-soffit'))o.visible=false;});});
 const photo=document.createElement('aside');photo.className='study-photo';photo.hidden=true;photo.innerHTML=`<p>IMG_2190 · source photograph</p><img src="${asset('/photos-ref/IMG_2190.jpg')}" alt="Actual Silvia passage reference"><p>Photo and draft cameras differ. Recess depth and concealed brown doors are estimates.</p>`;document.body.append(photo);
 const photoButton=button('Compare photo',()=>{photo.hidden=!photo.hidden;photoButton.setAttribute('aria-pressed',String(!photo.hidden));});
 const link=document.createElement('a');link.href=asset('/reference-packs/entrance/index.html#feature=T06&source=IMG_2190.jpg');link.target='_top';link.textContent='Photo inventory';bar.append(link);
 const help=document.createElement('div');help.className='study-help';help.textContent='Drag to look · WASD / arrows to walk · side doors are closed · both arch openings stay open';document.body.append(help);
 const movement=document.createElement('div');movement.className='study-move';movement.setAttribute('aria-label','Walk through the tunnel');for(const [label,key]of [['←','a'],['↑','w'],['↓','s'],['→','d']]){const b=document.createElement('button');b.textContent=label;b.setAttribute('aria-label','Walk '+({a:'left',w:'forward',s:'backward',d:'right'}[key]));b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held=key;};b.onpointerup=b.onpointercancel=()=>{held=undefined;};movement.append(b);}document.body.append(movement);
 addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{keys.clear();held=undefined;});
 let pointer:{x:number;y:number}|undefined;canvas.style.touchAction='none';canvas.onpointerdown=e=>{pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(!pointer||plan)return;yaw-=(e.clientX-pointer.x)*.005;pitch=clamp(pitch-(e.clientY-pointer.y)*.004,-1.1,1.1);pointer={x:e.clientX,y:e.clientY};};canvas.onpointerup=canvas.onpointercancel=()=>{pointer=undefined;};
 preset(0,-2.8,0,6);let previous=performance.now();
 renderer.setAnimationLoop((now)=>{const dt=Math.min(.05,(now-previous)/1000);previous=now;if(!plan){const down=(k:string)=>keys.has(k)||held===k;input.moveX=Number(down('d')||down('arrowright'))-Number(down('a')||down('arrowleft'));input.moveZ=Number(down('w')||down('arrowup'))-Number(down('s')||down('arrowdown'));player.update(dt,input,world,yaw);camera.position.set(player.x,1.66,player.z);camera.up.set(0,1,0);camera.lookAt(player.x+Math.sin(yaw)*Math.cos(pitch),1.66+Math.sin(pitch),player.z-Math.cos(yaw)*Math.cos(pitch));}else{camera.position.set(0,11,3.6);camera.up.set(0,0,1);camera.lookAt(0,0,3.6);}renderer.render(scene,camera);canvas.dataset.studyReady='true';});
}
