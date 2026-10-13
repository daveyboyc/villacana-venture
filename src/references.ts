import {frontageRegions} from "./frontages";
import { asset } from "./asset";
import type { Skeleton, Vec2 } from "./types";
import "./references.css";
import layout from "../data/main_pool.json";
import {poolAccess,poolLevelPoint} from "./pool-levels";

export type ReferencePoint = { id: string; x: number; z: number; label: string; note: string; url: string; photo: string };
export type ScreenPoint = { x: number; y: number; visible: boolean };
const KEY = "villacana-reference-points-v1";
const centre = (ring: Vec2[]): Vec2 => ring.reduce(([x,z],p)=>[x+p[0]/ring.length,z+p[1]/ring.length],[0,0] as Vec2);
/** Place names along the lane, rather than clustering two-point streets at junctions. */
const lineCentre = (points: Vec2[]): Vec2 => {
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
  let left=lengths.reduce((sum,length)=>sum+length,0)/2;
  for(let i=0;i<lengths.length;i++) {
    if(left<=lengths[i]) {const t=left/lengths[i];return [points[i][0]+(points[i+1][0]-points[i][0])*t,points[i][1]+(points[i+1][1]-points[i][1])*t];}
    left-=lengths[i];
  }
  return points[0];
};
export function mapLabels(s: Skeleton): ReferencePoint[] {
  const labels: ReferencePoint[] = [];
  const add = (id:string,label:string,p:Vec2,note="",photo="") => labels.push({id,x:p[0],z:p[1],label,note,url:"",photo});
  const streetNames=new Set<string>();
  for (const street of s.streets) {
    const key=street.id ?? street.name;if(streetNames.has(key))continue;streetNames.add(key);
    const points=street.points ?? street.registryPlots;
    if(points?.length) add(street.referenceId ?? `street-${key}`,street.name+(street.points?"":" ?"),street.points ? lineCentre(points) : centre(points),street.trust ?? "Mapped street");
  }
  for (const p of s.pools) add(`pool-${p.id}`,`${p.id === "toddler" ? "Children’s" : p.id[0].toUpperCase()+p.id.slice(1)} pool`,centre(p.ring));
  for (const p of s.boundaryReference?.carParks ?? []) add(`park-${p.id}`,p.name,p.at,p.trust,p.id==="dali"?"IMG_2269.jpg":"");
  for (const p of s.boundaryReference?.ramps ?? []) add(p.id,p.name,centre(p.points),p.trust,p.evidence.find(e=>e.startsWith("photo:"))?.slice(6)??"");
  if(s.seafront) {
    const sf=s.seafront;
    add("barraka",sf.restaurant.name,centre(sf.restaurant.ring),sf.restaurant.trust);
    add("paseo",sf.paseo.name,sf.paseo.points[Math.floor(sf.paseo.points.length/2)]);
    const [x,z]=centre(sf.viewBounds),r=s.viewRotation*Math.PI/180;
    add("beach",sf.beach.name,[x-10*Math.cos(r)-2*Math.sin(r),z+10*Math.sin(r)-2*Math.cos(r)]);
    add("sea",sf.sea.name,[x+55*Math.sin(r),z+55*Math.cos(r)]);
  }
  add("main-pool-platform","Enrique’s · 90 Miles platform",poolLevelPoint([-53,56]),layout.levels.trust);
  for(const access of poolAccess) add(access.id,access.name,centre(access.points),layout.levels.trust);
  for(const r of frontageRegions)add(`frontage-${r.id}`,r.name,centre(r.ring),r.trust,r.evidence[0]);
  return labels;
}

function validPoints(value: unknown): ReferencePoint[] {
  if(!Array.isArray(value)||value.length>1000) throw Error("Choose a Villacana references export.");
  const ids=new Set<string>();
  return value.map((p: ReferencePoint)=>{
    if(!p||typeof p.id!=="string"||p.id.length>100||ids.has(p.id)||!Number.isFinite(p.x)||!Number.isFinite(p.z)||Math.abs(p.x)>5000||Math.abs(p.z)>5000||typeof p.label!=="string"||!p.label.trim()||p.label.length>120) throw Error("The file contains an invalid reference point.");
    ids.add(p.id);
    const note=typeof p.note==="string"?p.note.slice(0,2000):"",url=typeof p.url==="string"?p.url:"",photo=typeof p.photo==="string"?p.photo:"";
    if(url) {
      try { const link=new URL(url);if(!["https:","http:"].includes(link.protocol)||!link.hostname)throw Error(); }
      catch { throw Error("Reference links must start with https:// or http:// and include a valid address."); }
    }
    if(photo && !/^IMG_\d+\.jpg$/.test(photo)) throw Error("Invalid reference photo.");
    return {id:p.id,x:p.x,z:p.z,label:p.label.trim(),note,url,photo};
  });
}

/** Same references, coordinates and persistence in the 2D map and 3D overview. */
export function referenceEditor(options: {
  surface: HTMLElement | SVGSVGElement; labels: ReferencePoint[];
  project: (x:number,z:number)=>ScreenPoint;
  unproject: (x:number,y:number)=>Vec2 | null;
  enabled?: ()=>boolean; onArm?: ()=>void;
}) {
  let points: ReferencePoint[]=[];
  let loadWarning="";
  try { points=validPoints(JSON.parse(localStorage.getItem(KEY)??"[]")); } catch { loadWarning="Saved references could not be read. Export your current references before leaving."; }
  let armed=false, selected:ReferencePoint|null=null, hidden=false;
  const layer=document.createElement("div");layer.className="reference-layer";document.body.append(layer);
  const tools=document.createElement("div");tools.className="reference-tools";
  tools.innerHTML='<button id="ref-add" type="button">+ Label / reference</button><button id="ref-labels" type="button" aria-pressed="true">Labels</button><button id="ref-export" type="button">Export references</button><button id="ref-import" type="button">Import</button><input id="ref-file" type="file" accept="application/json,.json" hidden><span id="ref-status" role="status" aria-live="polite"></span>';
  document.body.append(tools);
  const dialog=document.createElement("dialog");dialog.className="reference-dialog";
  dialog.innerHTML='<form><h2>Map reference</h2><p id="ref-location"></p><label>Name<input id="ref-name" required maxlength="120" placeholder="e.g. Cervantes ramp"></label><label>Notes<textarea id="ref-note" maxlength="2000" placeholder="What does this show? What needs correcting?"></textarea></label><label>Reference photo<select id="ref-photo"><option value="">No photo</option></select></label><img id="ref-image" alt="Selected reference photo" hidden><label>Web or Drive link<input id="ref-url" type="url" placeholder="https://…"></label><a id="ref-open" target="_blank" rel="noopener noreferrer" hidden>Open reference link</a><p id="ref-save-status" role="status" aria-live="polite"></p><div class="reference-actions"><button type="submit">Save</button><button id="ref-move" type="button">Move pin</button><button id="ref-delete" type="button">Delete</button><button id="ref-close" type="button">Close</button></div><p class="reference-hint">Saved on this browser. Export references to back them up or share them; import on another device.</p></form>';
  document.body.append(dialog);
  const get=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
  const status=get<HTMLSpanElement>("ref-status"), saveStatus=get<HTMLParagraphElement>("ref-save-status");status.textContent=loadWarning;
  const name=get<HTMLInputElement>("ref-name"),note=get<HTMLTextAreaElement>("ref-note"),url=get<HTMLInputElement>("ref-url"),photo=get<HTMLSelectElement>("ref-photo");
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(points));return true;}catch{return false;}};
  const all=()=>[...options.labels.filter(p=>!points.some(q=>q.id===p.id)),...points];
  const saveMessage=(saved:boolean)=>saved?"Saved on this browser. Export to share or back up.":"Browser storage unavailable. Export references before leaving; changes are kept for this visit.";
  const media=()=>{
    const image=get<HTMLImageElement>("ref-image");image.hidden=!photo.value;image.src=photo.value?asset(`/photos-ref/${photo.value}`):"";
    const link=get<HTMLAnchorElement>("ref-open");link.hidden=!/^https?:\/\//i.test(url.value);if(!link.hidden)link.href=url.value;
  };
  const open=(p:ReferencePoint)=>{selected={...p};name.value=p.label;note.value=p.note;url.value=p.url;photo.value=p.photo;get("ref-location").textContent=`Map position: ${p.x.toFixed(2)}, ${p.z.toFixed(2)}`;saveStatus.textContent="";get("ref-delete").hidden=!points.some(q=>q.id===p.id);get("ref-delete").textContent=options.labels.some(q=>q.id===p.id)?"Reset label":"Delete";media();dialog.showModal();name.focus();};
  let buttons=new Map<string,HTMLButtonElement>();
  const render=()=>{
    layer.replaceChildren();buttons=new Map();
    for(const p of all()) {
      const b=document.createElement("button");b.className="reference-pin"+(points.some(q=>q.id===p.id)?" user-reference":"");const display=p.id.startsWith("street-") && !points.some(q=>q.id===p.id) && p.label.length>22 ? p.label.replace(/^Calle /,"C. ") : p.label;
      b.textContent=(p.photo?"▣ ":"")+display;b.title=`${p.label} · ${p.note || "Tap to label or add a reference"}`;b.dataset.referenceId=p.id;
      b.addEventListener("click",()=>open(p));b.addEventListener("pointerdown",e=>e.stopPropagation());layer.append(b);buttons.set(p.id,b);
    }
  };
  const arm=(moving=false)=>{options.onArm?.();armed=!armed;layer.classList.toggle("placing",armed);get("ref-add").textContent=armed?"Cancel placement":"+ Label / reference";get("ref-add").setAttribute("aria-pressed",String(armed));status.textContent=armed?(moving?"Tap the new pin position.":"Tap the map to place a label or reference."):"";};
  get("ref-add").addEventListener("click",()=>{selected=null;arm();});
  get("ref-labels").addEventListener("click",()=>{hidden=!hidden;get("ref-labels").setAttribute("aria-pressed",String(!hidden));});
  get("ref-close").addEventListener("click",()=>dialog.close());
  get("ref-move").addEventListener("click",()=>{if(selected)selected={...selected,label:name.value,note:note.value,url:url.value,photo:photo.value};dialog.close();arm(true);});
  dialog.querySelector("form")!.addEventListener("submit",e=>{
    e.preventDefault();if(!selected)return;
    try {
      const [p]=validPoints([{...selected,label:name.value,note:note.value,url:url.value.trim(),photo:photo.value}]);
      points=points.filter(q=>q.id!==p.id);points.push(p);selected=p;saveStatus.textContent=saveMessage(persist());status.textContent=saveStatus.textContent;get("ref-delete").hidden=false;render();name.blur();
    } catch(e){saveStatus.textContent=(e as Error).message;}
  });
  get("ref-delete").addEventListener("click",()=>{if(!selected)return;points=points.filter(q=>q.id!==selected!.id);status.textContent=saveMessage(persist());dialog.close();render();});
  photo.addEventListener("change",media);url.addEventListener("input",media);
  void fetch(asset("/photos-ref/manifest.json")).then(r=>r.json()).then((manifest:{file:string;title:string}[])=>{
    for(const p of manifest.sort((a,b)=>a.file.localeCompare(b.file)))photo.add(new Option(p.title,p.file));if(selected){photo.value=selected.photo;media();}
  }).catch(()=>{status.textContent="Photo list unavailable. You can still add a web or Drive link.";});
  get("ref-export").addEventListener("click",()=>{
    const blob=new Blob([JSON.stringify({format:"villacana-references",version:1,references:points},null,2)],{type:"application/json"});
    const a=document.createElement("a"),href=URL.createObjectURL(blob);a.href=href;a.download="villacana-references.json";a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);status.textContent=`Exported ${points.length} saved reference${points.length===1?"":"s"}.`;
  });
  get("ref-import").addEventListener("click",()=>get<HTMLInputElement>("ref-file").click());
  get<HTMLInputElement>("ref-file").addEventListener("change",async()=>{
    const file=get<HTMLInputElement>("ref-file").files?.[0];if(!file)return;
    try {
      if(file.size>2_000_000)throw Error("Reference file is too large.");
      const data=JSON.parse(await file.text());if(data.format!=="villacana-references"||data.version!==1)throw Error("Choose a Villacana references export.");
      const incoming=validPoints(data.references);const merged=new Map(points.map(p=>[p.id,p]));incoming.forEach(p=>merged.set(p.id,p));points=validPoints([...merged.values()]);
      status.textContent=`Imported ${incoming.length} references. ${saveMessage(persist())}`;render();
    }catch(e){status.textContent=(e as Error).message;}get<HTMLInputElement>("ref-file").value="";
  });
  let down:{id:number;x:number;y:number}|null=null;
  options.surface.addEventListener("pointerdown",((e:PointerEvent)=>{if(!armed)return;e.stopImmediatePropagation();e.preventDefault();down={id:e.pointerId,x:e.clientX,y:e.clientY};options.surface.setPointerCapture(e.pointerId);}) as EventListener,true);
  options.surface.addEventListener("pointermove",((e:PointerEvent)=>{if(armed&&down)e.stopImmediatePropagation();}) as EventListener,true);
  options.surface.addEventListener("pointerup",((e:PointerEvent)=>{
    if(!armed||!down||down.id!==e.pointerId)return;e.stopImmediatePropagation();
    const tap=Math.hypot(e.clientX-down.x,e.clientY-down.y)<10;down=null;if(!tap)return;
    const p=options.unproject(e.clientX,e.clientY);if(!p){status.textContent="Tap inside the mapped area.";return;}
    const moving=selected;arm();open({...moving,id:moving?.id??`ref-${crypto.randomUUID()}`,x:p[0],z:p[1],label:moving?.label??"",note:moving?.note??"",url:moving?.url??"",photo:moving?.photo??""});
  }) as EventListener,true);
  options.surface.addEventListener("pointercancel",()=>{down=null;},true);
  render();
  window.addEventListener("storage",e=>{if(e.key!==KEY)return;try{points=validPoints(JSON.parse(e.newValue??"[]"));render();}catch{status.textContent="Could not read updated references.";}});
  return { update(){
    const enabled=options.enabled?.()??true;if(!enabled&&armed){arm();down=null;}tools.hidden=!enabled;layer.hidden=!enabled||hidden;
    if(!enabled||hidden)return;
    // Give user annotations priority when labels would overlap.
    const occupied:{x:number;y:number;w:number;h:number}[]=[];
    const priority=(p:ReferencePoint)=>points.some(q=>q.id===p.id)?10:p.id.startsWith("street-")&&/Cervantes/.test(p.label)?8:p.id.startsWith("pool-")&&p.id!=="pool-toddler"?6:p.id.startsWith("main-pool-")?5:p.id.startsWith("park-")?5:/Cervantes|Pintor/.test(p.label)?4:p.id==="barraka"?3:p.label.endsWith("?")?0:1;
    for(const p of all().sort((a,b)=>priority(b)-priority(a))) {
      const b=buttons.get(p.id)!;const pos=options.project(p.x,p.z);b.style.left=`${pos.x}px`;b.style.top=`${pos.y}px`;
      const w=b.offsetWidth||120,h=b.offsetHeight||28,box={x:pos.x-w/2,y:pos.y-h/2,w,h};
      const overlaps=occupied.some(r=>box.x<r.x+r.w+6&&box.x+w+6>r.x&&box.y<r.y+r.h+4&&box.y+h+4>r.y);
      b.style.visibility=pos.visible&&!overlaps?"visible":"hidden";if(pos.visible&&!overlaps)occupied.push(box);
    }
  }, active:()=>armed||dialog.open };
}
