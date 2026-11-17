import * as THREE from 'three';
import './shotgun.css';

/** Arcade values, deliberately independent of the resort's measured geometry. */
export const SHOTGUN_COOLDOWN = .8;
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
    <div id="sg-weapon" aria-hidden="true"><svg viewBox="0 0 200 240" shape-rendering="crispEdges">
      <g id="sg-flash"><path fill="#ff9b19" d="M100 8 109 40 128 24 120 52 143 56 115 70 125 90 101 79 77 94 83 70 57 59 82 50 74 25 93 40Z"/><path fill="#fff5ba" d="m100 31 8 25 16 4-18 12-6 12-8-15-15-8 17-5Z"/></g>
      <path fill="#171c20" stroke="#080d10" stroke-width="4" d="M88 66h24l7 70 19 32 13 72H49l13-72 19-32Z"/>
      <path fill="#75818a" d="M91 69h7v73h-12Z"/><path fill="#343f49" d="M98 69h11l6 73H98Z"/>
      <path fill="#c2cbd0" d="M94 69h3v70h-3Z"/><path fill="#10171b" d="M96 61h8v12h-8Z"/><path fill="#7c8990" d="M98 61h3v8h-3Z"/>
      <path fill="#4a5962" d="M81 141h38l13 38H68Z"/><path fill="#a6b1b7" d="M82 145h6l-8 29h-7Z"/>
      <path fill="#202a31" d="M91 145h18v32H91Z"/><path fill="#0d1216" d="M91 150h18v11H91Z"/>
      <g id="sg-pump"><path fill="#5c321e" stroke="#21150f" stroke-width="3" d="M77 113h46l6 38H71Z"/><path fill="#ad7140" d="M80 116h38v7H78Z"/><path fill="#7b492b" d="M77 127h46v5H77Zm-2 10h50v5H75Z"/></g>
      <path fill="#75432b" d="M72 180h56l15 60H57Z"/><path fill="#ac7245" d="M73 183h10l-9 57H60Z"/>
      <path fill="#bd875e" stroke="#3c291e" stroke-width="3" d="m132 166 16 8 11 25 5 41h-26l-9-41-9-15Z"/><path fill="#e2ae7e" d="m134 170 10 7 5 12-14-5-9-5Z"/>
      <path fill="#414b36" d="M139 214h27l10 26h-35Z"/>
    </svg></div>
    <div class="sg-bottom"><span>SHOTGUN <b>∞</b><small>SHELLS</small></span><span id="sg-status" role="status">Ready</span><span><b id="sg-score">0 / 3</b><small>TARGETS</small></span></div>
    <button id="sg-fire" aria-label="Fire shotgun" disabled>FIRE</button>
    <div id="sg-menu"><div class="sg-card"><span class="sg-kicker">VILLACANA / NORTH POOL</span><h1>Poolside shotgun</h1><p id="sg-instructions">Left thumb to move. Drag the scene to aim.<br>Tap FIRE. Hit the three floating targets.<br><small>Keyboard: WASD · drag to aim · F to fire · Esc to pause</small></p><p id="sg-message">Loading courtyard…</p><button id="sg-start" disabled>Loading…</button><button id="sg-reset">Restart targets & position</button><a href="./?view=overview&area=north-pool" target="_top">Back to Inspect</a></div></div>`;
  document.body.append(hud);document.body.classList.add('shotgun-mode');
  const el=<T extends HTMLElement=HTMLElement>(id:string)=>hud.querySelector<T>('#'+id)!;
  const menu=el('sg-menu'),start=el<HTMLButtonElement>('sg-start'),fire=el<HTMLButtonElement>('sg-fire'),status=el('sg-status'),weapon=el('sg-weapon'),hitMarker=el('sg-hit');
  let paused=true,disposed=false,pending=false,cooldown=0,readyAt=0,shots=0,hits=0,muted=false,hitTime=0,impactTime=0;
  let audio:AudioContext|undefined,blockers:THREE.Object3D[]|null=null;
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
  const sync=()=>{hud.dataset.shots=String(shots);hud.dataset.hits=String(hits);hud.dataset.state=paused?'paused':'playing';el('sg-score').textContent=`${hits} / 3`;};
  const pause=()=>{paused=true;pending=false;resetInput();menu.hidden=false;fire.disabled=true;start.textContent=shots?'Resume':'Start playing';sync();};
  function sound(){
    if(muted)return;
    try{
      audio??=new AudioContext();void audio.resume().catch(()=>{});
      const duration=.23,buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*duration),audio.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(data.length*.2));
      const source=audio.createBufferSource();source.buffer=buffer;
      const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1800;
      const gain=audio.createGain();gain.gain.value=.3;source.connect(filter).connect(gain).connect(audio.destination);source.start();
      source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
    }catch{/* Visual feedback remains available if browser audio is unavailable. */}
  }
  function requestShot(){if(!active()||performance.now()<readyAt||pending)return;pending=true;sound();}
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
    pending=false;cooldown=SHOTGUN_COOLDOWN;readyAt=performance.now()+SHOTGUN_COOLDOWN*1000;shots++;let count=0,hit=false;
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
    if(hits===3){pause();el('sg-message').textContent=`All 3 targets hit in ${shots} shots. Restart for another round.`;start.textContent='Keep exploring';}
  }
  start.addEventListener('click',()=>{if(!available())return;paused=false;resetInput();menu.hidden=true;fire.disabled=false;sync();},{signal});
  fire.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();requestShot();},{signal});
  // Keyboard/assistive activation has no preceding pointer event.
  fire.addEventListener('click',e=>{if(e.detail===0)requestShot();},{signal});
  el('sg-pause').addEventListener('click',pause,{signal});
  el('sg-reset').addEventListener('click',()=>{
    pause();resetPlayer();shots=hits=0;cooldown=readyAt=hitTime=impactTime=0;targets.forEach(t=>t.visible=true);impactGeometry.setDrawRange(0,0);weapon.classList.remove('sg-firing');status.textContent='Ready';el('sg-message').textContent='Three targets. Unlimited shells.';start.textContent='Start playing';sync();
  },{signal});
  el('sg-mute').addEventListener('click',()=>{muted=!muted;el('sg-mute').setAttribute('aria-pressed',String(muted));el('sg-mute').textContent=muted?'Sound off':'Sound on';},{signal});
  window.addEventListener('keydown',e=>{if((e.target as HTMLElement).closest('input,textarea,select'))return;if(e.code==='Escape')pause();if(e.code==='KeyF'&&!e.repeat){e.preventDefault();requestShot();}},{signal});
  let mouseDown:{x:number;y:number}|null=null;
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0)mouseDown={x:e.clientX,y:e.clientY};},{signal});
  canvas.addEventListener('pointerup',e=>{if(e.pointerType==='mouse'&&mouseDown&&Math.hypot(e.clientX-mouseDown.x,e.clientY-mouseDown.y)<5)requestShot();mouseDown=null;},{signal});
  canvas.addEventListener('pointercancel',()=>{mouseDown=null;},{signal});
  window.addEventListener('blur',pause,{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();},{signal});
  window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='villacana-controls-reset')pause();},{signal});
  const dispose=()=>{if(disposed)return;disposed=true;abort.abort();group.removeFromParent();geometry.dispose();material.dispose();texture.dispose();impactGeometry.dispose();impactMaterial.dispose();void audio?.close();hud.remove();document.body.classList.remove('shotgun-mode');};
  window.addEventListener('pagehide',e=>{if(e.persisted)pause();else dispose();},{signal});
  sync();
  return {playing:active,dispose,update(dt:number,moving:boolean){
    if(disposed)return;
    const ready=available();start.disabled=!ready;fire.disabled=!active();
    if(!ready&&!paused)pause();
    if(ready&&start.textContent==='Loading…'){start.textContent='Start playing';el('sg-message').textContent='Three targets. Unlimited shells.';}
    for(const t of targets)t.quaternion.copy(camera.quaternion);
    if(active()){
      cooldown=Math.max(0,(readyAt-performance.now())/1000);
      if(cooldown===0&&hits<3)status.textContent='Ready';
      if(pending)shoot();
    }
    hitTime=Math.max(0,hitTime-dt);hitMarker.hidden=hitTime===0;
    impactTime=Math.max(0,impactTime-dt);impactMaterial.opacity=impactTime/.2;
    if(impactTime===0)impactGeometry.setDrawRange(0,0);
    weapon.style.setProperty('--sway',active()&&moving?`${Math.sin(performance.now()*.009)*3}px`:'0px');
  }};
}
