import * as THREE from 'three';
import './shotgun.css';
import { asset } from './asset';
import { createShotgunAudio } from './shotgun-audio';
import { ShotgunCycle, SHOTGUN_CAPACITY } from './shotgun-cycle';
export { SHOTGUN_COOLDOWN } from './shotgun-cycle';

/** Arcade values, deliberately independent of the resort's measured geometry. */
export const PELLETS = [[0,0],[-.035,0],[.035,0],[0,-.035],[0,.035],[-.025,.025],[.025,.025],[.02,-.025]];

/** One ray stops at the nearest target or opaque surface, including batched originals. */
export function tracePellet(ray:THREE.Raycaster, targets:THREE.Object3D[], blockers:THREE.Object3D[]) {
  return ray.intersectObjects([...targets,...blockers],false)[0];
}

type Options={scene:THREE.Scene;camera:THREE.PerspectiveCamera;canvas:HTMLCanvasElement;
  centre:{x:number;z:number};groundY:(x:number,z:number)=>number;ignoreObject:THREE.Object3D;
  available:()=>boolean;resetInput:()=>void;resetPlayer:()=>void};

export function createShotgun({scene,camera,canvas,centre,groundY,ignoreObject,available,resetInput,resetPlayer}:Options){
  const abort=new AbortController(),signal=abort.signal;
  const hud=document.createElement('section');hud.id='shotgun-hud';hud.dataset.shots='0';hud.dataset.hits='0';
  hud.innerHTML=`
    <div class="sg-top"><span>NORTH POOL <small>ARCADE TEST</small></span><div><button id="sg-mute" aria-pressed="false" aria-label="Mute shotgun sound">Sound on</button><button id="sg-pause">Pause</button></div></div>
    <div id="sg-crosshair" aria-hidden="true">＋</div><div id="sg-hit" aria-hidden="true">×</div>
    <div id="sg-weapon" aria-hidden="true"><div class="sg-viewmodel">
      <svg id="sg-flash" viewBox="0 0 120 130" shape-rendering="crispEdges"><path fill="#a52c10" d="M54 0h12v24h12V12h12v30h18v12h12v18h-18v12h12v12H84v18H72v16H48v-16H36V96H6V84h12V72H0V54h18V42h18V12h12v18h6Z"/><path fill="#ff9d22" d="M54 12h12v30h12V30h6v24h24v12H90v18h12v6H78v18H66v12H54v-12H42V90H18v-6h12V66H12V54h24V36h6v12h12Z"/><path fill="#fff4bd" d="M54 42h12v18h12v12h12v6H78v12H66v12H54V90H42V78H30v-6h12V60h12Z"/></svg>
      <img class="sg-sprite" src="${asset('/art/shotgun-doom.png')}" alt="" draggable="false" width="1086" height="1448" />
      <span id="sg-shell" aria-hidden="true"></span>
    </div></div>
    <div class="sg-bottom"><span>SHOTGUN <b id="sg-ammo">8/8</b><small>SHELLS</small></span><span id="sg-status" role="status">Ready</span><span><b id="sg-score">0 / 3</b><small>TARGETS</small></span></div>
    <button id="sg-reload" aria-label="Reload shotgun" disabled>RELOAD</button>
    <button id="sg-fire" aria-label="Fire shotgun" disabled>FIRE</button>
    <div id="sg-menu"><div class="sg-card"><span class="sg-kicker">VILLACANA / NORTH POOL</span><h1>Poolside shotgun</h1><p id="sg-instructions">Left thumb to move. Drag the scene to aim.<br>Tap FIRE. Tap RELOAD to insert more shells.<br><small>Keyboard: WASD · drag to aim · F to fire · R to reload · Esc to pause</small></p><p id="sg-message">Loading courtyard…</p><button id="sg-start" disabled>Loading…</button><button id="sg-reset">Restart targets & position</button><a href="./?view=overview&area=north-pool" target="_top">Back to Inspect</a></div></div>`;
  document.body.append(hud);document.body.classList.add('shotgun-mode');
  const el=<T extends HTMLElement=HTMLElement>(id:string)=>hud.querySelector<T>('#'+id)!;
  const menu=el('sg-menu'),start=el<HTMLButtonElement>('sg-start'),fire=el<HTMLButtonElement>('sg-fire'),status=el('sg-status'),weapon=el('sg-weapon'),hitMarker=el('sg-hit');
  let paused=true,disposed=false,shots=0,hits=0,muted=false,hitTime=0,impactTime=0;
  let blockers:THREE.Object3D[]|null=null;
  const cycle=new ShotgunCycle();
  let lastTick=performance.now(),emptyUntil=0;
  const reload=el<HTMLButtonElement>('sg-reload');
  const audio=createShotgunAudio(state=>{
    hud.dataset.audio=state;
    if(state==='error')el('sg-mute').textContent='Sound unavailable';
  });
  const group=new THREE.Group();group.name='fps-practice-targets';group.userData.dynamic=true;group.userData.noDrape=true;scene.add(group);
  const targetTexture=document.createElement('canvas');targetTexture.width=targetTexture.height=128;
  const ctx=targetTexture.getContext('2d')!;
  for(const [r,color] of [[63,'#351a17'],[57,'#ffcd69'],[47,'#a52d22'],[32,'#ffcd69'],[19,'#a52d22'],[7,'#fff0bd']] as const){ctx.fillStyle=color;ctx.beginPath();ctx.arc(64,64,r,0,Math.PI*2);ctx.fill();}
  const texture=new THREE.CanvasTexture(targetTexture);texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
  const geometry=new THREE.CircleGeometry(.7,24);
  const targets=[[-2.2,-1.4],[0,1.1],[2.2,-1.4]].map(([dx,dz],i)=>{
    const t=new THREE.Mesh(geometry,material);t.name=`fps-target-${i+1}`;t.userData.fpsTarget=true;
    t.position.set(centre.x+dx,groundY(centre.x,centre.z)+1.65,centre.z+dz);group.add(t);return t;
  });
  const impactGeometry=new THREE.BufferGeometry();const impactPositions=new Float32Array(PELLETS.length*3);impactGeometry.setAttribute('position',new THREE.BufferAttribute(impactPositions,3));impactGeometry.setDrawRange(0,0);
  const impactMaterial=new THREE.PointsMaterial({color:'#ffe9a0',size:.12,transparent:true,depthWrite:false});
  const impacts=new THREE.Points(impactGeometry,impactMaterial);impacts.userData.dynamic=true;impacts.frustumCulled=false;group.add(impacts);
  const ray=new THREE.Raycaster();ray.far=60;
  const active=()=>!disposed&&!paused&&available()&&!document.hidden;
  const sync=()=>{
    hud.dataset.shots=String(shots);hud.dataset.hits=String(hits);hud.dataset.state=paused?'paused':'playing';
    hud.dataset.ammo=String(cycle.ammo);hud.dataset.action=cycle.phase;
    el('sg-score').textContent=`${hits} / 3`;el('sg-ammo').textContent=`${cycle.ammo}/${SHOTGUN_CAPACITY}`;
    weapon.dataset.action=cycle.phase;
    weapon.classList.toggle('sg-reloading',cycle.reloading);weapon.classList.toggle('sg-loading',cycle.phase==='loading');
    reload.disabled=!active()||!cycle.canReload;reload.textContent=cycle.reloading?'LOADING':'RELOAD';
    reload.classList.toggle('sg-empty',cycle.ammo===0&&!cycle.reloading);
  };
  const pause=(stopAudio=true)=>{paused=true;cycle.cancelReload();if(stopAudio)audio.stop();resetInput();menu.hidden=false;fire.disabled=true;start.textContent=shots?'Resume':'Start playing';sync();};
  function requestShot(){
    if(!active())return;
    audio.unlock();
    const result=cycle.fire();
    if(result==='empty'){if(performance.now()>emptyUntil){audio.play('empty');emptyUntil=performance.now()+300;}status.textContent='EMPTY · RELOAD';return;}
    if(result!=='fire')return;
    lastTick=performance.now();audio.stop();audio.play('fire');shoot();sync();
  }
  function requestReload(){
    if(!active()||!cycle.reload())return;
    lastTick=performance.now();
    audio.unlock();audio.stop();audio.play('reload-open');
    weapon.classList.remove('sg-firing');status.textContent='Opening…';sync();
  }
  function collectBlockers(){
    const list:THREE.Object3D[]=[];
    scene.traverse(o=>{
      if(!(o instanceof THREE.Mesh)||o.userData.batch||o.userData.fpsTarget)return;
      for(let p:THREE.Object3D|null=o;p;p=p.parent)if(p===ignoreObject||p===group)return;
      const mats=Array.isArray(o.material)?o.material:[o.material];
      if(mats.some(m=>!m.transparent&&m.opacity>=1&&m.alphaTest===0&&!(m instanceof THREE.ShaderMaterial)))list.push(o);
    });return list;
  }
  function shoot(){
    shots++;let count=0,hit=false;
    blockers??=collectBlockers();scene.updateMatrixWorld(true);
    // Spread is in camera space, so portrait and landscape have the same cone.
    for(const [dx,dy] of PELLETS){
      ray.set(camera.position,new THREE.Vector3(dx,dy,-1).normalize().applyQuaternion(camera.quaternion));
      const contact=tracePellet(ray,targets.filter(t=>t.visible),blockers);
      if(!contact)continue;
      if(contact.object.userData.fpsTarget){contact.object.visible=false;hits++;hit=true;}
      impactPositions.set(contact.point.toArray(),count++*3);
    }
    impactGeometry.attributes.position.needsUpdate=true;impactGeometry.setDrawRange(0,count);impactTime=.2;
    weapon.classList.remove('sg-firing');void weapon.offsetWidth;weapon.classList.add('sg-firing');
    if(hit)hitTime=.22;
    status.textContent=hits===3?'All targets hit!':hit?'HIT!':'PUMP…';sync();
    if(hits===3){pause(false);el('sg-message').textContent=`All 3 targets hit in ${shots} shots. Restart for another round.`;start.textContent='Keep exploring';}
  }
  start.addEventListener('click',()=>{if(!available())return;paused=false;lastTick=performance.now();audio.unlock();resetInput();menu.hidden=true;fire.disabled=false;sync();},{signal});
  fire.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();requestShot();},{signal});
  // Keyboard/assistive activation has no preceding pointer event.
  fire.addEventListener('click',e=>{if(e.detail===0)requestShot();},{signal});
  reload.addEventListener('click',requestReload,{signal});
  el('sg-pause').addEventListener('click',()=>pause(),{signal});
  el('sg-reset').addEventListener('click',()=>{
    pause();resetPlayer();shots=hits=0;cycle.reset();hitTime=impactTime=0;emptyUntil=0;lastTick=performance.now();targets.forEach(t=>t.visible=true);impactGeometry.setDrawRange(0,0);weapon.classList.remove('sg-firing');status.textContent='Ready';el('sg-message').textContent='Eight shells. Unlimited reserve. Tap RELOAD to refill.';start.textContent='Start playing';sync();
  },{signal});
  el('sg-mute').addEventListener('click',()=>{muted=!muted;audio.mute(muted);el('sg-mute').setAttribute('aria-pressed',String(muted));el('sg-mute').textContent=muted?'Sound off':'Sound on';},{signal});
  window.addEventListener('keydown',e=>{if(e.target instanceof Element&&e.target.closest('input,textarea,select'))return;if(e.code==='Escape')pause();if(e.code==='KeyR'&&!e.repeat){e.preventDefault();requestReload();}if(e.code==='KeyF'&&!e.repeat){e.preventDefault();requestShot();}},{signal});
  let mouseDown:{x:number;y:number}|null=null;
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0)mouseDown={x:e.clientX,y:e.clientY};},{signal});
  canvas.addEventListener('pointerup',e=>{if(e.pointerType==='mouse'&&mouseDown&&Math.hypot(e.clientX-mouseDown.x,e.clientY-mouseDown.y)<5)requestShot();mouseDown=null;},{signal});
  canvas.addEventListener('pointercancel',()=>{mouseDown=null;},{signal});
  window.addEventListener('blur',()=>pause(),{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();},{signal});
  window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='villacana-controls-reset')pause();},{signal});
  const dispose=()=>{if(disposed)return;disposed=true;abort.abort();group.removeFromParent();geometry.dispose();material.dispose();texture.dispose();impactGeometry.dispose();impactMaterial.dispose();audio.dispose();hud.remove();document.body.classList.remove('shotgun-mode');};
  window.addEventListener('pagehide',e=>{if(e.persisted)pause();else dispose();},{signal});
  sync();
  return {playing:active,dispose,update(dt:number,moving:boolean){
    if(disposed)return;
    const now=performance.now(),elapsed=Math.max(0,(now-lastTick)/1000);lastTick=now;
    const ready=available();start.disabled=!ready;fire.disabled=!active();
    if(!ready&&!paused)pause();
    if(ready&&start.textContent==='Loading…'){start.textContent='Start playing';el('sg-message').textContent='Eight shells. Unlimited reserve. Tap RELOAD to refill.';}
    for(const t of targets)t.quaternion.copy(camera.quaternion);
    if(active()){
      for(const cue of cycle.advance(elapsed))audio.play(cue);
      if(active())status.textContent=cycle.reloading?`Loading ${cycle.ammo}/${SHOTGUN_CAPACITY}`:cycle.phase==='pump'?'PUMP…':cycle.ammo===0?'EMPTY · RELOAD':hits===3?'All targets hit!':'Ready';
    }
    sync();
    hitTime=Math.max(0,hitTime-dt);hitMarker.hidden=hitTime===0;
    impactTime=Math.max(0,impactTime-dt);impactMaterial.opacity=impactTime/.2;
    if(impactTime===0)impactGeometry.setDrawRange(0,0);
    weapon.style.setProperty('--sway',active()&&moving?`${Math.sin(performance.now()*.009)*3}px`:'0px');
  }};
}
