import {clamp} from './geom';
import type {InputState} from './types';

type Options={canvas:HTMLCanvasElement;pad:HTMLButtonElement;input:InputState;isOverview:()=>boolean;isPan:()=>boolean;pan:(x:number,y:number)=>void;toggleOverview:()=>void;
 /** Screen point a pinch or scroll zooms towards, in client pixels. */
 zoomAt?:(x:number,y:number)=>void;
 /** Screen point a rotate or tilt turns about while a drag or twist lasts; null when it ends. */
 orbitAt?:(point:{x:number;y:number}|null)=>void};

type WheelLike=Pick<WheelEvent,'deltaX'|'deltaY'|'deltaMode'|'ctrlKey'|'metaKey'>&{wheelDeltaX?:number;wheelDeltaY?:number};

/**
 * Inspect gestures, arranged like Google Maps: a drag grabs the ground and
 * pans; Ctrl-, Shift-, right- or middle-drag rotates and tilts about the point
 * under the pointer; the mouse wheel, a trackpad scroll and a pinch zoom
 * towards the pointer. The Orbit button swaps what a plain drag does.
 * Arrow keys or WASD move forward, back and sideways.
 * On a phone, like a map app: one finger pans (the Pan/Orbit switch still
 * applies), two fingers twist to turn and slide up or down to tilt, and a
 * pinch zooms towards the point between the fingers. Walk is unchanged.
 */
const PINCH_GAIN=5;

function wheelPixels(delta:number,mode:number){
 return delta*(mode===1?16:mode===2?innerHeight:1);
}

/** Left-drag follows the Pan/Orbit switch. Ctrl, Shift, right-drag or middle-drag does the other one. */
function dragPans(e:PointerEvent,panMode:boolean){
 const alternate=e.ctrlKey||e.metaKey||e.shiftKey||(e.buttons&2)!==0||(e.buttons&4)!==0;
 return panMode?!alternate:alternate;
}

/** A wheel, a trackpad scroll or a trackpad pinch (ctrl+wheel) zooms, as in Google Maps. */
export function inspectWheel(e:WheelLike,_overview:boolean):{kind:'zoom';units:number}{
 const y=wheelPixels(e.deltaY,e.deltaMode);
 const pinch=e.ctrlKey||e.metaKey;
 return {kind:'zoom',units:clamp(y*(pinch?PINCH_GAIN:1)/100,-3,3)};
}

/** Keep held touch axes independent of keyboard polling and allow a second thumb to look. */
export function bindWalkControls({canvas,pad,input,isOverview,isPan,pan,toggleOverview,zoomAt,orbitAt}:Options){
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
  // preventDefault stops the click focusing the page, so focus the canvas: the keys then reach the view.
  e.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);looks.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(isOverview()){
   if(e.pointerType!=='touch')orbitAt?.({x:e.clientX,y:e.clientY});
   else if(looks.size===2){const [a,b]=[...looks.values()];orbitAt?.({x:(a.x+b.x)/2,y:(a.y+b.y)/2});}
  }
  pair=looks.size===2?[...looks.values()].map(p=>({...p})):null;
  if(!isOverview()&&e.pointerType==='touch'&&e.clientX<innerWidth/2&&!stick&&padPointer===null&&looks.size===1)stick={id:e.pointerId,x:e.clientX,y:e.clientY};
 });
 /** The two fingers as last read, and the frame request that reads them next. */
 let pair:{x:number;y:number}[]|null=null,pairFrame=0;
 const pairGesture=()=>{
  pairFrame=0;
  const now=[...looks.values()];
  if(now.length!==2){pair=null;return;}
  if(!pair){pair=now.map(p=>({...p}));return;}
  const [a,b]=now,[pa,pb]=pair;
  const before=Math.hypot(pb.x-pa.x,pb.y-pa.y),after=Math.hypot(b.x-a.x,b.y-a.y);
  if(before>5&&after>5){
   const pinch=Math.log(before/after)/.08;input.zoom+=pinch;
   if(isOverview()){
    if(Math.abs(pinch)>.05)zoomAt?.((a.x+b.x)/2,(a.y+b.y)/2);
    const turn=Math.atan2(b.y-a.y,b.x-a.x)-Math.atan2(pb.y-pa.y,pb.x-pa.x);input.lookDx+=Math.atan2(Math.sin(turn),Math.cos(turn))/.0045;
   }
  }
  // Sliding the pair up or down tilts the view.
  if(isOverview())input.lookDy+=(a.y+b.y-pa.y-pb.y)/2;
  pair=now.map(p=>({...p}));
 };
 canvas.addEventListener('pointermove',e=>{
  const prev=looks.get(e.pointerId);if(!prev)return;
  if(looks.size===2&&(isOverview()||(!stick&&padPointer===null))){
   // Read the pair once per frame, after both fingers have moved, so a slide never shows up as a twist.
   looks.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(!pairFrame)pairFrame=requestAnimationFrame(pairGesture);
   return;
  }else if(looks.size<=2){
   if(stick&&e.pointerId===stick.id){touch.x=clamp((e.clientX-stick.x)/50,-1,1);touch.z=clamp(-(e.clientY-stick.y)/50,-1,1);read();}
   // The ground follows the pointer or finger both ways, like grabbing a map.
   else if(isOverview()&&dragPans(e,isPan()))pan(e.clientX-prev.x,-(e.clientY-prev.y));
   else{input.lookDx+=e.clientX-prev.x;input.lookDy+=e.clientY-prev.y;}
  }
  looks.set(e.pointerId,{x:e.clientX,y:e.clientY});
 });
 const release=(e:PointerEvent)=>{if(stick&&e.pointerId===stick.id){stick=null;clearTouch();read();}
  // Apply a pair move still waiting for its frame before the finger leaves.
  if(pairFrame&&looks.has(e.pointerId)){cancelAnimationFrame(pairFrame);pairGesture();}
  if(looks.delete(e.pointerId)){orbitAt?.(null);pair=null;}};
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>release(e as PointerEvent));
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.addEventListener('wheel',e=>{
  e.preventDefault();
  const action=inspectWheel(e,isOverview());
  input.zoom+=action.units;
  if(isOverview())zoomAt?.(e.clientX,e.clientY);
 },{passive:false});
 // Safari reports a two-finger twist here. Pinch zoom still arrives as a ctrl+wheel.
 let twist=0;
 canvas.addEventListener('gesturestart',e=>{
  e.preventDefault();twist=0;
  const at=e as Event&{clientX?:number;clientY?:number};
  if(isOverview()&&typeof at.clientX==='number'&&typeof at.clientY==='number')orbitAt?.({x:at.clientX,y:at.clientY});
 },{passive:false});
 canvas.addEventListener('gestureend',()=>orbitAt?.(null));
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
