import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { asset } from './asset';
import type { Vec2 } from './types';

export type WallGuideRow = {id:string;name:string;kind:string;points:Vec2[]};
/** Resample the existing map axes only. This overlay never creates physical walls. */
export function guidePoints(row:WallGuideRow, ground:(x:number,z:number)=>number):number[] {
  if(row.points.length<2)return [];
  const points=row.kind==='enclosure'?[...row.points,row.points[0]]:row.points;
  const positions:number[]=[];
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.5));
    for(let j=i===1?0:1;j<=n;j++){
      const x=a[0]+(b[0]-a[0])*j/n,z=a[1]+(b[1]-a[1])*j/n;
      positions.push(x,ground(x,z)+.16,z);
    }
  }
  return positions;
}

export function wallGuides(scene:THREE.Scene,ground:(x:number,z:number)=>number,focus:(points:Vec2[])=>void){
  const params=new URLSearchParams(location.search);
  let on=params.get('wallGuides')==='1',selected=params.get('wall')??'',loaded=false,failed=false,loading=false;
  const group=new THREE.Group();group.name='patio-wall-guides';group.userData.dynamic=true;group.userData.noDrape=true;group.visible=false;scene.add(group);
  const button=document.querySelector<HTMLButtonElement>('#wall-guides-toggle')!;
  const panel=document.createElement('details');panel.id='wall-guide-panel';panel.open=innerWidth>700;panel.hidden=true;
  const summary=document.createElement('summary');summary.textContent='Wall placement guides';panel.append(summary);
  const legend=document.createElement('p');legend.textContent='Blue solid: existing wall axes · teal: low edges · orange dashed: untraced enclosure edges · pink: selected. Ground-position guides, not wall-top levels. Lines show through buildings for comparison; they are not new walls or approved positions.';panel.append(legend);
  const label=document.createElement('label'),unknown=document.createElement('input');unknown.type='checkbox';unknown.checked=true;label.append(unknown,' Show untraced enclosure edges');panel.append(label);
  const select=document.createElement('select');select.setAttribute('aria-label','Select wall guide');select.add(new Option('All wall guides',''));panel.append(select);
  const status=document.createElement('p');status.setAttribute('role','status');status.id='wall-guide-status';panel.append(status);
  const link=document.createElement('a');link.textContent='Check selected wall on map / photos';link.target='_top';panel.append(link);document.body.append(panel);
  const rows=new Map<string,WallGuideRow>(),lines=new Map<string,Line2>();
  function sync(){
    button.setAttribute('aria-pressed',String(on));
    const url=new URL(location.href);url.searchParams.set('wallGuides',on?'1':'0');if(selected)url.searchParams.set('wall',selected);else url.searchParams.delete('wall');history.replaceState(null,'',url);
    const detailLink=document.querySelector<HTMLAnchorElement>('#layout-details')!;const detailUrl=new URL(detailLink.href);detailUrl.searchParams.set('wallGuides',on?'1':'0');if(selected)detailUrl.searchParams.set('wall',selected);else detailUrl.searchParams.delete('wall');detailLink.href=detailUrl.href;
    if(parent!==window)parent.postMessage({type:'villacana-wall-guides',on,wall:selected},location.origin);
    for(const [id,line]of lines){const row=rows.get(id)!;line.visible=row.kind!=='enclosure'||unknown.checked;line.material.color.set(id===selected?'#ff36b4':row.kind==='enclosure'?'#ec9900':row.kind==='kerb'?'#16b6a6':'#168bff');line.material.linewidth=id===selected?5:3;}
    const urlMap=new URL(asset('/'),location.href);urlMap.searchParams.set('view','map');urlMap.searchParams.set('walls','1');if(selected)urlMap.searchParams.set('wall',selected);link.href=urlMap.href;
    status.textContent=failed?'Wall guides could not load. Switch off and on to retry.':!loaded?'Loading wall guides…':selected?(rows.get(selected)?.name??'This model group has no individual wall trace. Select an axis or enclosure below.'):`${[...lines.values()].filter(l=>l.visible).length} guide runs. Dashed outlines may contain openings or building faces; trace each edge before building.`;
    select.value=rows.has(selected)?selected:'';
  }
  async function load(){
    if(loaded||loading)return;
    loading=true;
    try{
      failed=false;sync();const response=await fetch(asset('/patio-walls.json'));if(!response.ok)throw Error('Wall guide data unavailable');
      const data=await response.json() as {records:WallGuideRow[]};
      for(const row of data.records){
        if(!['wall','kerb','enclosure'].includes(row.kind)||row.points.length<2)continue;
        const geometry=new LineGeometry();geometry.setPositions(guidePoints(row,ground));
        const material=new LineMaterial({color:0x168bff,linewidth:3,dashed:row.kind==='enclosure',dashSize:1,gapSize:.65,depthTest:false,depthWrite:false,transparent:true,opacity:.9});material.resolution.set(innerWidth,innerHeight);
        const line=new Line2(geometry,material);line.name=row.id;line.userData.kind=row.kind;line.userData.guide=true;line.computeLineDistances();line.renderOrder=110;line.raycast=()=>{};
        group.add(line);rows.set(row.id,row);lines.set(row.id,line);select.add(new Option((row.kind==='enclosure'?'Untraced · ':'')+row.name,row.id));
      }
      loaded=true;group.userData.ready=true;group.userData.count=lines.size;
      if(rows.has(selected))focus(rows.get(selected)!.points);
    }catch(error){failed=true;console.error(error);}
    loading=false;sync();
  }
  button.addEventListener('click',()=>{on=!on;sync();if(on&&!loaded)void load();});
  unknown.addEventListener('change',sync);
  select.addEventListener('change',()=>{selected=select.value;sync();if(rows.has(selected))focus(rows.get(selected)!.points);});
  window.addEventListener('resize',()=>{for(const line of lines.values())line.material.resolution.set(innerWidth,innerHeight);});
  sync();if(on)void load();
  return {update(inspecting:boolean){button.hidden=!inspecting;group.visible=inspecting&&on;panel.hidden=!inspecting||!on;}};
}
