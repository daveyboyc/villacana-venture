import { siteY } from './terrain';
import { asset } from './asset';
import type { Vec2 } from './types';
type Row = {id:string;name:string;kind:string;points:Vec2[];areas:string[];evidence:string[];basis:string;confidence:string;placement:string;levelState:string;closed?:boolean;routeOpenings?:unknown[];lengthM?:number;heightM?:number;thicknessM?:number;grossFaceM2?:number;openings?:unknown[];solvedCameras?:string[];levelRefs?:{id:string;rise:number[];confidence:string}[]};
const NS='http://www.w3.org/2000/svg';
function add<K extends keyof HTMLElementTagNameMap>(tag:K,parent:Element,text='') {const n=document.createElement(tag);n.textContent=text;parent.append(n);return n;}
/** Mark-up only: never turns registry outlines into physical walls. */
export async function patioWalls(world:SVGGElement,focus:(points:Vec2[])=>void) {
 const response=await fetch(asset('/patio-walls.json'));if(!response.ok)throw Error('Patio wall inventory unavailable');
 const data=await response.json() as {scope:string;totals:Record<string,number>;records:Row[]};
 const toggle=document.querySelector<HTMLButtonElement>('#patio-walls-toggle')!;
 const panel=add('section',document.querySelector('#map-page')!);panel.id='patio-walls';panel.hidden=true;panel.setAttribute('aria-label','Patio wall inventory');
 const header=add('header',panel);add('h2',header,'Patio walls');const close=add('button',header,'Close');
 add('p',panel,`${data.totals.wall} wall axes · ${data.totals.kerb} low kerbs · ${data.totals.enclosure} untraced enclosures · ${data.totals.gap} recorded gaps · ${data.totals.context} other model groups`);
 add('p',panel,'Blue: model wall · teal: low kerb · dashed amber: registry enclosure · red: evidence gap · grey: model group needing individual wall traces. Select a marking to check estimates and photos.');
 const search=add('input',panel);search.type='search';search.placeholder='Find wall, place or photo';search.setAttribute('aria-label','Search patio walls');
 const filter=add('select',panel);filter.setAttribute('aria-label','Wall marking type');
 for(const [v,label] of [['','All markings'],['wall','Walls'],['kerb','Low kerbs'],['enclosure','Untraced enclosures'],['gap','Evidence gaps'],['context','Other model wall / patio groups']])filter.add(new Option(label,v));
 const count=add('p',panel);count.setAttribute('role','status');const results=add('div',panel);results.id='patio-wall-results';
 const detail=add('div',panel);detail.id='patio-wall-detail';detail.setAttribute('aria-live','polite');
 const limits=add('details',panel);add('summary',limits,'Coverage and estimate limits');add('p',limits,data.scope);add('p',limits,'Lengths and gross single-face areas come from existing model axes and nominal heights. Openings, both faces, coping and waste are not deducted or added. No cost or construction quantities are certified. A solved camera in the source list does not measure this wall.');
 const download=add('a',limits,'Download wall inventory (JSON)');download.href=asset('/patio-walls.json');download.download='patio-walls.json';
 const layer=document.createElementNS(NS,'g');layer.id='patio-wall-overlay';world.append(layer);
 let selected:Row|undefined;
 function draw(row:Row) {
  if(!row.points.length)return;
  const isGap=row.kind==='gap',node=document.createElementNS(NS,isGap?'circle':'path');
  if(isGap){node.setAttribute('cx',String(row.points[0][0]));node.setAttribute('cy',String(row.points[0][1]));node.setAttribute('r','1');}
  else node.setAttribute('d','M'+row.points.map(p=>p.join(' ')).join('L')+(row.kind==='enclosure'||row.closed?'Z':''));
  node.setAttribute('fill','none');node.setAttribute('stroke',row.id===selected?.id?'#bb2374':({wall:'#186aa3',kerb:'#177f75',enclosure:'#ab6e0b',gap:'#c33232',context:'#707070'}[row.kind]??'#555'));
  node.setAttribute('stroke-width',row.id===selected?.id?'5':'3');node.setAttribute('vector-effect','non-scaling-stroke');
  if(row.kind==='enclosure'||row.kind==='context')node.setAttribute('stroke-dasharray','6 4');
  node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label',row.name);node.setAttribute('data-patio-wall',row.id);
  const title=document.createElementNS(NS,'title');title.textContent=row.name;node.append(title);
  node.addEventListener('pointerdown',e=>e.stopPropagation());node.addEventListener('click',e=>{e.stopPropagation();select(row);});
  node.addEventListener('keydown',event=>{const e=event as KeyboardEvent;if(e.key==='Enter'||e.key===' '){e.preventDefault();select(row);}});layer.append(node);
 }
 function select(row:Row,move=true) {
  selected=row;detail.replaceChildren();add('h3',detail,row.name);add('code',detail,row.id);
  add('p',detail,`Evidence confidence: ${row.confidence} · placement: ${row.placement}`);add('p',detail,row.basis);
  if(row.lengthM!==undefined){
   add('p',detail,`Model estimate: ${row.lengthM.toFixed(2)} m long × ${row.heightM!.toFixed(2)} m high · ${row.thicknessM!.toFixed(2)} m thick · ${row.grossFaceM2!.toFixed(2)} m² gross single face.`);
   add('p',detail,`${row.openings?.length??0} opening records in this wall source; gross area does not deduct them. Check photos for omissions.`);
   if(row.routeOpenings?.length)add('p',detail,`${row.routeOpenings.length} route-opening polygons in the parent source must stay open; these are context, not door deductions.`);
   add('p',detail,`Cited solved cameras: ${row.solvedCameras?.join(', ')||'none'}. Wall-specific measurement still required.`);
  }
  if(row.lengthM!==undefined){
   const ground:number[]=[];
   row.points.slice(1).forEach((b,i)=>{const a=row.points[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.5));for(let j=0;j<=n;j++)ground.push(siteY(a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n));});
   const low=Math.min(...ground),high=Math.max(...ground);
   add('p',detail,`Terrain screening along axis (0.5 m samples): ${low.toFixed(2)} to ${high.toFixed(2)} m relative to the model datum; ${(high-low).toFixed(2)} m variation. This is model ground, not a measured wall base or top. A level top needs a separate datum, especially where this run crosses steps.`);
  }
  add('h4',detail,'Level check');add('p',detail,row.levelState);add('p',detail,'Keep each patio floor on its own datum; compare wall-top endpoints, door sills and adjoining steps against the photos and laser survey before changing the model.');
  for(const l of row.levelRefs??[])add('p',detail,`Area context only: ${l.id} · rise ${l.rise?.join('–')??'unknown'} m · ${l.confidence}. Not this wall’s top elevation.`);
  for(const id of row.evidence){const b=add('button',detail,'Photo '+id);b.addEventListener('click',()=>{show(false);window.dispatchEvent(new CustomEvent('reference-open',{detail:id}));});}
  if(row.points.length){const inspect=add('button',detail,'Inspect existing model here');inspect.addEventListener('click',()=>{const point=row.points.reduce((p,q)=>[p[0]+q[0]/row.points.length,p[1]+q[1]/row.points.length],[0,0]);window.dispatchEvent(new CustomEvent('patio-wall-inspect',{detail:{point}}));});}
  const aerial=add('a',detail,'Open aerial map');aerial.href=asset('/map/ground.jpg');aerial.target='_blank';aerial.rel='noopener';
  const url=new URL(location.href);url.searchParams.set('walls','1');url.searchParams.set('wall',row.id);history.replaceState(null,'',url);
  if(move&&row.points.length)focus(row.points);render();
 }
 function render(){
  const q=search.value.toLowerCase();const rows=data.records.filter(r=>(!filter.value||r.kind===filter.value)&&[r.id,r.name,...r.evidence].join(' ').toLowerCase().includes(q));
  results.replaceChildren();layer.replaceChildren();count.textContent=`${rows.length} markings shown. Physical survey incomplete.`;
  for(const row of rows){const b=add('button',results,row.name);b.dataset.wallId=row.id;b.setAttribute('aria-pressed',String(selected?.id===row.id));b.addEventListener('click',()=>select(row));draw(row);}
 }
 function show(on:boolean){panel.hidden=!on;layer.style.display=on?'':'none';toggle.setAttribute('aria-pressed',String(on));const u=new URL(location.href);if(on)u.searchParams.set('walls','1');else {u.searchParams.delete('walls');u.searchParams.delete('wall');}history.replaceState(null,'',u);}
 toggle.addEventListener('click',()=>show(panel.hidden));close.addEventListener('click',()=>show(false));search.addEventListener('input',render);filter.addEventListener('change',render);
 const url=new URL(location.href);render();show(url.searchParams.get('walls')==='1');const initial=data.records.find(r=>r.id===url.searchParams.get('wall'));if(initial){show(true);select(initial);}
}
