/** Approximate west-side connection: registry topology, not a surveyed photo registration. */
import clipping from 'polygon-clipping';
import placement from '../data/silvia_map.json';
import type {Vec2,SkeletonBuilding} from './types';
import {silviaTunnel,silviaTunnelRings} from './silvia-tunnel';
export const SILVIA_HOST=placement.hostBuilding;
export const SILVIA_CANOPY=placement.canopyBuilding;
export const silviaPlacement={entry:placement.entry as Vec2,forward:placement.forward as Vec2,status:placement.status};
const f=silviaPlacement.forward, a=silviaPlacement.entry;
export const silviaRotation=Math.atan2(f[0],f[1]);
export function silviaWorld(x:number,z:number):Vec2{return [a[0]+f[1]*x+f[0]*z,a[1]-f[0]*x+f[1]*z];}
export function silviaLocal(x:number,z:number):Vec2{const dx=x-a[0],dz=z-a[1];return [dx*f[1]-dz*f[0],dx*f[0]+dz*f[1]];}
export function silviaRect(x0:number,z0:number,x1:number,z1:number):Vec2[]{return [[x0,z0],[x1,z0],[x1,z1],[x0,z1]].map(([x,z])=>silviaWorld(x,z));}
const d=silviaTunnel.dimensions,h=d.width/2;
// The carve includes the actual wall thickness and each recess, never the entire house.
export const silviaEnvelope=[silviaRect(-h-d.wall,-1.3,h+d.wall,d.length+.35),...silviaTunnel.entrances.map(e=>silviaRect(Math.min(e.side*h,e.side*(h+e.depth+d.wall)),e.along[0]-d.wall/2,Math.max(e.side*h,e.side*(h+e.depth+d.wall)),e.along[1]+d.wall/2))];
export const silviaFloor= silviaRect(-h,-3.65,h,d.length+.35);
export const silviaWallRings=()=>silviaTunnelRings().map(r=>r.map(([x,z])=>silviaWorld(x,z)));
export function silviaGroundParts(b:SkeletonBuilding):{ring:Vec2[];holes:Vec2[][]}[]{
 if(b.id===SILVIA_CANOPY)return [];
 if(b.id!==SILVIA_HOST)return [{ring:b.ring,holes:[]}];
 return clipping.difference([b.ring,...(b.holes??[])],...silviaEnvelope.map(r=>[r])).map(poly=>({ring:poly[0] as Vec2[],holes:poly.slice(1) as Vec2[][]}));
}
export function inSilviaFloor(x:number,z:number){const [u,v]=silviaLocal(x,z);return Math.abs(u)<h+.02&&v>-3.65&&v<d.length+.35;}
export function silviaCloseCamera(x:number,z:number){const [u,v]=silviaLocal(x,z);return Math.abs(u)<h+.75&&v>-5.8&&v<d.length+2;}
