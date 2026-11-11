import {clamp} from './geom';
import type {InputState} from './types';

type Options={canvas:HTMLCanvasElement;pad:HTMLButtonElement;input:InputState;isOverview:()=>boolean;isPan:()=>boolean;pan:(x:number,y:number)=>void;toggleOverview:()=>void};

type WheelLike=Pick<WheelEvent,'deltaX'|'deltaY'|'deltaMode'|'ctrlKey'|'metaKey'>&{wheelDeltaX?:number;wheelDeltaY?:number};

/**
 * Inspect gestures, in the same arrangement as a map and a 3D viewer:
 * left-drag orbits, right-drag / Shift-drag / the Pan button pans,
 * a mouse wheel zooms, a trackpad scroll pans, and a pinch zooms.
 * On a phone, two fingers pan and twist to orbit. Forward and back follow
 * the fingers, opposite a one-finger pan. Walk is unchanged.
 */
const PINCH_GAIN=5;

function wheelPixels(delta:number,mode:number){
 return delta*(mode===1?16:mode===2?innerHeight:1);
}

/** Chrome gives a trackpad wheelDelta of about −3× the pixel delta. A mouse notch keeps the legacy ±120. */
function trackpadScroll(e:WheelLike){
 if(e.ctrlKey||e.metaKey||e.deltaMode!==0||(e.deltaX===0&&e.deltaY===0))return false;
 const triple=(wheel:number|undefined,delta:number)=>typeof wheel==='number'&&delta!==0&&Math.abs(wheel+3*delta)<=1;
 if(triple(e.wheelDeltaY,e.deltaY)||triple(e.wheelDeltaX,e.deltaX))return true;
 const notch=(wheel:number|undefined)=>typeof wheel==='number'&&Math.abs(Math.abs(wheel)-120)<1;
 if(notch(e.wheelDeltaY)||notch(e.wheelDeltaX))return false;
 if(e.deltaX!==0||!Number.isInteger(e.deltaY))return true;
 return Math.abs(e.deltaY)>0&&Math.abs(e.deltaY)<50;
}

/** Left-drag follows the Pan/Orbit switch. Shift, right-drag or middle-drag does the other one. */
function dragPans(e:PointerEvent,panMode:boolean){
 const alternate=e.shiftKey||(e.buttons&2)!==0||(e.buttons&4)!==0;
 return panMode?!alternate:alternate;
}

export function inspectWheel(e:WheelLike,overview:boolean):{kind:'pan';x:number;y:number}|{kind:'zoom';units:number}{
 const x=wheelPixels(e.deltaX,e.deltaMode),y=wheelPixels(e.deltaY,e.deltaMode);
 if(overview&&trackpadScroll(e))return {kind:'pan',x,y};
 const pinch=e.ctrlKey||e.metaKey;
 return {kind:'zoom',units:clamp(y*(pinch?PINCH_GAIN:1)/100,-3,3)};
}

/** Keep held touch axes independent of keyboard polling and allow a second thumb to look. */
export function bindWalkControls({canvas,pad,input,isOverview,isPan,pan,toggleOverview}:Options){
 const keys=new Set<string>(),looks=new Map<number,{x:number;y:number}>();
 let stick:{id:number;x:number;y:number}|null=null,padPointer:number|null=null;
 const touch={x:0,z:0},thumb=pad.querySelector<HTMLElement>('.walk-thumb')!;
 const clearTouch=()=>{touch.x=touch.z=0;thumb.style.transform='translate(0px,0px)';pad.dataset.active='false';};
 const read=()=>{
  input.moveX=clamp(touch.x+Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),-1,1);
  input.moveZ=clamp(touch.z+Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown')),-1,1);
  input.run=keys.has('ShiftLeft')||keys.has('ShiftRight');
 };
 const reset=()=>{looks.clear();stick=null;padPointer=null;keys.clear();clearTouch();input.moveX=input.moveZ=input.lookDx=input.lookDy=input.zoom=0;input.run=input.jump=false;};
 window.addEventListener('keydown',e=>{
  if(e.metaKey||e.ctrlKey||(e.target as HTMLElement).matches('input,textarea,select')||document.querySelector('dialog[open]'))return;
  if((e.target as HTMLElement).closest('button')&&['Space','Enter'].includes(e.code))return;
  keys.add(e.code);if(e.code==='Space')input.jump=true;
  if(/^(Arrow|Key[WASD]|Space)/.test(e.code))e.preventDefault();
 });
 window.addEventListener('keyup',e=>keys.delete(e.code));
 document.querySelector('#jump')!.addEventListener('pointerdown',e=>{e.preventDefault();input.jump=true;});
 document.querySelector('#overview')!.addEventListener('click',()=>{reset();toggleOverview();});
 const movePad=(e:PointerEvent)=>{
  const r=pad.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/42,dy=(e.clientY-r.top-r.height/2)/42,scale=Math.max(1,Math.hypot(dx,dy));
  touch.x=clamp(dx/scale,-1,1);touch.z=clamp(-dy/scale,-1,1);thumb.style.transform=`translate(${touch.x*34}px,${-touch.z*34}px)`;read();
 };
 pad.addEventListener('pointerdown',e=>{
  e.preventDefault();if(isOverview()||padPointer!==null||stick)return;
  padPointer=e.pointerId;pad.setPointerCapture(e.pointerId);pad.dataset.active='true';movePad(e);
 });
 pad.addEventListener('pointermove',e=>{if(e.pointerId===padPointer){e.preventDefault();movePad(e);}});
 const releasePad=(e:PointerEvent)=>{if(e.pointerId!==padPointer)return;padPointer=null;clearTouch();read();};
 for(const name of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(name,e=>releasePad(e as PointerEvent));
 canvas.addEventListener('pointerdown',e=>{
  e.preventDefault();canvas.setPointerCapture(e.pointerId);looks.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(!isOverview()&&e.pointerType==='touch'&&e.clientX<innerWidth/2&&!stick&&padPointer===null&&looks.size===1)stick={id:e.pointerId,x:e.clientX,y:e.clientY};
 });
 canvas.addEventListener('pointermove',e=>{
  const prev=looks.get(e.pointerId);if(!prev)return;
  if(looks.size===2&&(isOverview()||(!stick&&padPointer===null))){
   const other=[...looks.entries()].find(([id])=>id!==e.pointerId)![1];
   const before=Math.hypot(prev.x-other.x,prev.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y);
   if(before>5&&after>5){input.zoom+=Math.log(before/after)/.08;
    if(isOverview()){const turn=Math.atan2(e.clientY-other.y,e.clientX-other.x)-Math.atan2(prev.y-other.y,prev.x-other.x);input.lookDx+=Math.atan2(Math.sin(turn),Math.cos(turn))/.0045;}
   }
   // The midpoint grabs the ground. Each finger event owns half of that move.
   // Forward/back is reversed from a one-finger drag so the model follows the pair.
   if(isOverview())pan((e.clientX-prev.x)/2,-(e.clientY-prev.y)/2);
  }else if(looks.size<=2){
   if(stick&&e.pointerId===stick.id){touch.x=clamp((e.clientX-stick.x)/50,-1,1);touch.z=clamp(-(e.clientY-stick.y)/50,-1,1);read();}
   else if(isOverview()&&dragPans(e,isPan()))pan(e.clientX-prev.x,e.clientY-prev.y);
   else{input.lookDx+=e.clientX-prev.x;input.lookDy+=e.clientY-prev.y;}
  }
  looks.set(e.pointerId,{x:e.clientX,y:e.clientY});
 });
 const release=(e:PointerEvent)=>{if(stick&&e.pointerId===stick.id){stick=null;clearTouch();read();}looks.delete(e.pointerId);};
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>release(e as PointerEvent));
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.addEventListener('wheel',e=>{
  e.preventDefault();
  const action=inspectWheel(e,isOverview());
  if(action.kind==='pan')pan(action.x,action.y);
  else input.zoom+=action.units;
 },{passive:false});
 // Safari reports a two-finger twist here. Pinch zoom still arrives as a ctrl+wheel.
 let twist=0;
 canvas.addEventListener('gesturestart',e=>{e.preventDefault();twist=0;},{passive:false});
 canvas.addEventListener('gesturechange',e=>{
  e.preventDefault();
  const rotation=(e as Event&{rotation?:number}).rotation;
  if(!isOverview()||typeof rotation!=='number')return;
  input.lookDx+=(rotation-twist)*Math.PI/180/0.0045;twist=rotation;
 },{passive:false});
 window.addEventListener('blur',reset);window.addEventListener('resize',reset);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='villacana-controls-reset')reset();});
 return {read,reset};
}
