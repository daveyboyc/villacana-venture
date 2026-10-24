import * as THREE from "three";
import data from "../data/door_sills.json";
import skeleton from "../public/map/skeleton.json";
import { closestOnSegment, pointInRing } from "./geom";
import { plasterMaterial, surfaceTexture } from "./materials";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/** Issue #57: sills, the kerbed Dalí footpath and the south Dalí arch approach (data/door_sills.json).
 * All three are ground-height offsets the player steps over; house floors are untouched. */
export const doorSills = data;
type Sill = (typeof data.sills)[number];
const kerb = data.footpathKerb, ap = data.approach;
const dot = (p: Vec2, o: Vec2, u: Vec2) => (p[0] - o[0]) * u[0] + (p[1] - o[1]) * u[1];
const at = (o: Vec2, u: Vec2, a: number, v: Vec2, b: number): Vec2 => [o[0] + u[0] * a + v[0] * b, o[1] + u[1] * a + v[1] * b];

// ---- Sills: a block from the door face out towards the lawn or lane.
const sillAcross = (s: Sill): Vec2 => [-s.outward[1], s.outward[0]];
export const sillRing = (s: Sill): Vec2[] => {
  const d = s.door as Vec2, o = s.outward as Vec2, w = sillAcross(s), h = s.width / 2;
  return [at(d, w, -h, o, 0), at(d, w, h, o, 0), at(d, w, h, o, s.depth), at(d, w, -h, o, s.depth)];
};
/** A sill is level: one riser above the ground at the middle of its front edge, whatever the lie of the land. */
export const sillTop = (s: Sill): number => siteY(...at(s.door as Vec2, s.outward as Vec2, s.depth, sillAcross(s), 0)) + s.rise;
function sillRise(x: number, z: number): number | undefined {
  for (const s of data.sills) {
    const p: Vec2 = [x, z], a = dot(p, s.door as Vec2, sillAcross(s)), b = dot(p, s.door as Vec2, s.outward as Vec2);
    if (Math.abs(a) <= s.width / 2 && b >= 0 && b <= s.depth) return Math.max(0, sillTop(s) - siteY(x, z));
  }
  return undefined;
}

// ---- Dalí frontage: stations along the kerb (s) and across towards the houses (c).
const kOrigin = kerb.origin as Vec2, kAlong = kerb.along as Vec2, kToward = kerb.toward as Vec2;
export const kerbPoint = (s: number, c: number): Vec2 => at(kOrigin, kAlong, s, kToward, c);
/** Inner edge of the raised band: the asphalt kerb, or the path's own edge where cars nose up to it. */
const bandStart = (s: number) => (s < kerb.pathKerbFrom ? 0 : kerb.pathEdge);
const bandHeight = (s: number) => kerb.rise * Math.min(1, Math.max(0, s / kerb.taper));
function kerbRise(x: number, z: number): number | undefined {
  const s = dot([x, z], kOrigin, kAlong), c = dot([x, z], kOrigin, kToward);
  if (s < 0 || s > kerb.length || c > kerb.width || c < bandStart(s)) return undefined;
  const kw = kerb.kerbWidth;
  const white = (s >= kerb.taper && s <= kerb.pathKerbFrom && c <= kw) ||
    (s >= kerb.pathKerbFrom - kw && s <= kerb.pathKerbFrom && c >= kw && c <= kerb.pathEdge + kw) ||
    (s >= kerb.pathKerbFrom && c <= kerb.pathEdge + kw);
  if (white) return bandHeight(s) + 0.012;
  if (s >= kerb.lawn.from && s <= kerb.lawn.to && c >= kerb.lawn.across[0] && c <= kerb.lawn.across[1]) return bandHeight(s) - 0.01;
  if (s >= kerb.drain.along[0] && s <= kerb.drain.along[1] && c >= kerb.drain.across[0] && c <= kerb.drain.across[1]) return bandHeight(s) + 0.006;
  return bandHeight(s);
}
export const footpathBandRing: Vec2[] = [
  kerbPoint(0, 0), kerbPoint(kerb.pathKerbFrom, 0), kerbPoint(kerb.pathKerbFrom, kerb.pathEdge), kerbPoint(kerb.length, kerb.pathEdge),
  kerbPoint(kerb.length, kerb.width), kerbPoint(0, kerb.width),
];
export const footpathLawnRing: Vec2[] = [
  kerbPoint(kerb.lawn.from, kerb.lawn.across[0]), kerbPoint(kerb.lawn.to, kerb.lawn.across[0]),
  kerbPoint(kerb.lawn.to, kerb.lawn.across[1]), kerbPoint(kerb.lawn.from, kerb.lawn.across[1]),
];
/** Finite asphalt contact: the unchanged ribbon edge, then the inward-turned path kerb. */
export const footpathParkingApronRing: Vec2[] = [
  kerbPoint(kerb.taper, -kerb.parkingApron.overlap), kerbPoint(kerb.length, -kerb.parkingApron.overlap),
  kerbPoint(kerb.length, kerb.pathEdge), kerbPoint(kerb.pathKerbFrom, kerb.pathEdge),
  kerbPoint(kerb.pathKerbFrom, 0), kerbPoint(kerb.taper, 0),
];
/** The photographed white kerb: along the asphalt, turned in at the lawn's end, then along the path edge. */
export const footpathKerbLine: Vec2[] = [
  kerbPoint(kerb.taper, 0), kerbPoint(kerb.pathKerbFrom, 0), kerbPoint(kerb.pathKerbFrom, kerb.pathEdge), kerbPoint(kerb.length, kerb.pathEdge), kerbPoint(kerb.length, kerb.width),
];
export const footpathDrainRing: Vec2[] = [
  kerbPoint(kerb.drain.along[0], kerb.drain.across[0]), kerbPoint(kerb.drain.along[1], kerb.drain.across[0]),
  kerbPoint(kerb.drain.along[1], kerb.drain.across[1]), kerbPoint(kerb.drain.along[0], kerb.drain.across[1]),
];

// ---- South Dalí approach: t outward from the arch, q to the right walking in.
const aArch = ap.arch as Vec2, aOut = ap.outward as Vec2, aRight: Vec2 = [aOut[1], -aOut[0]]; // right-hand side walking in
export const approachPoint = (t: number, q: number): Vec2 => at(aArch, aOut, t, aRight, q);
export function approachSurface(t: number): number {
  if (t <= ap.level) return ap.rise;
  if (t <= ap.slope) return ap.rise + (ap.footRise - ap.rise) * (t - ap.level) / (ap.slope - ap.level);
  return ap.footRise * Math.max(0, ap.foot - t) / (ap.foot - ap.slope);
}
/** Inner half-width (flagstone edge) on one side; the photographed right-hand kerb kinks outward. */
export function approachInner(t: number, side: "left" | "right"): number {
  if (side !== ap.flare.side) return ap.halfWidth;
  return ap.halfWidth + ap.flare.extra * Math.min(1, Math.max(0, (t - ap.flare.from) / (ap.flare.to - ap.flare.from)));
}
const approachStations = [0, ap.level, ap.flare.from, ap.flare.to, ap.slope, ap.foot];
/** The rise is measured from the asphalt at the foot: the terrain rule's guessed west rise falls away under the arch. */
export const approachBase = (): number => siteY(...approachPoint(ap.foot, 0));
function approachRise(x: number, z: number): number | undefined {
  const t = dot([x, z], aArch, aOut), q = dot([x, z], aArch, aRight);
  if (t < 0 || t > ap.foot) return undefined;
  const side = q >= 0 ? "right" : "left", inner = approachInner(t, side), base = approachBase() - siteY(x, z);
  if (Math.abs(q) <= inner) return Math.max(0, base + approachSurface(t));
  if (Math.abs(q) <= inner + ap.kerbWidth) return Math.max(0, base + approachSurface(t) + ap.kerbHeight);
  return undefined;
}
export const approachRing: Vec2[] = [
  ...approachStations.map((t) => approachPoint(t, approachInner(t, "right") + ap.kerbWidth)),
  ...[...approachStations].reverse().map((t) => approachPoint(t, -(approachInner(t, "left") + ap.kerbWidth))),
];
export const approachKerbLines: Vec2[][] = (["left", "right"] as const).map((side) =>
  approachStations.map((t) => approachPoint(t, (side === "right" ? 1 : -1) * (approachInner(t, side) + ap.kerbWidth / 2))));

/** Visual datums are shared by meshes and the finite player-ground correction. */
export const ELENA_SURFACE = data.datums.elenaSurface, DALI_SURFACE = data.datums.daliSurface;
const localRings = [...data.sills.map(sillRing), footpathBandRing, footpathParkingApronRing, approachRing];
const reach = data.datums.fullApron + data.datums.blendApron;
const points = localRings.flat();
const bounds = {minX:Math.min(...points.map(p=>p[0]))-reach,maxX:Math.max(...points.map(p=>p[0]))+reach,minZ:Math.min(...points.map(p=>p[1]))-reach,maxZ:Math.max(...points.map(p=>p[1]))+reach};
const forbiddenGround = [...skeleton.buildings.filter(b=>b.floors>0&&!b.passage).map(b=>b.ring as Vec2[]),...skeleton.pools.map(p=>p.ring as Vec2[])];
/** Suppress generated illustrative objects only on the reviewed physical surfaces. */
export const inDoorSillReview = (x:number,z:number):boolean => localRings.some(r=>pointInRing(x,z,r));
/** Extra ground over the inherited player datum. The apron blend is a movement
 * approximation; the photographed feature itself stands at its visible mesh datum. */
export function doorSillsGroundOffset(x: number, z: number): number {
  if(x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ)return 0;
  const gap=(ring:Vec2[])=>pointInRing(x,z,ring)?0:Math.min(...ring.map((a,i)=>closestOnSegment(x,z,...a,...ring[(i+1)%ring.length]).d));
  const sillDistance=Math.min(...data.sills.map(s=>gap(sillRing(s))));
  const roadDistance=Math.min(...[footpathBandRing,footpathParkingApronRing,approachRing].map(gap));
  const distance=Math.min(sillDistance,roadDistance);
  if(distance>=reach||forbiddenGround.some(r=>pointInRing(x,z,r)))return 0;
  const weight=Math.max(0,Math.min(1,1-(distance-data.datums.fullApron)/data.datums.blendApron));
  const datum=(sillDistance<roadDistance?ELENA_SURFACE:DALI_SURFACE)-data.datums.legacyPlayerSurface;
  return datum*weight + (sillRise(x,z) ?? approachRise(x,z) ?? kerbRise(x,z) ?? 0);
}

// ---- Meshes. Built on the visual surface of each place, lifted by siteY per vertex (not draped).
const quad = (positions: number[], a: number[], b: number[], c: number[], d: number[]) => positions.push(...a, ...b, ...c, ...a, ...c, ...d);
const lift = (p: Vec2, datum: number, h: number) => [p[0], siteY(...p) + datum + h, p[1]];
function mesh(positions: number[], material: THREE.Material, name: string): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const uv: number[] = [];
  for (let i = 0; i < positions.length; i += 3) uv.push(positions[i], positions[i + 2]);
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.computeVertexNormals();
  const m = new THREE.Mesh(geometry, material);
  m.name = name; m.userData.noDrape = true; m.castShadow = m.receiveShadow = true;
  return m;
}
/** The stations split no more than half a unit apart, so a surface lifted per vertex follows the ground. */
const dense = (stations: number[]): number[] => stations.flatMap((b, i) => {
  if (!i) return [b];
  const a = stations[i - 1], n = Math.max(1, Math.ceil(Math.abs(b - a) / 0.5));
  return Array.from({ length: n }, (_, k) => a + (b - a) * (k + 1) / n);
});
/** Top surface over a (u,v) grid, plus optional vertical faces down to the datum along its edges. */
function sheet(point: (u: number, v: number) => Vec2, stationsU: number[], stationsV: number[], height: (u: number, v: number) => number, datum: number): number[] {
  const out: number[] = [], us = dense(stationsU), vs = dense(stationsV);
  for (let i = 1; i < us.length; i++) for (let j = 1; j < vs.length; j++) {
    const v = (a: number, b: number) => lift(point(a, b), datum, height(a, b));
    quad(out, v(us[i - 1], vs[j - 1]), v(us[i - 1], vs[j]), v(us[i], vs[j]), v(us[i], vs[j - 1]));
  }
  return out;
}
function face(a: Vec2, b: Vec2, datum: number, ha: number, hb: number): number[] {
  const out: number[] = [], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.5));
  const at = (t: number): Vec2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], h = (t: number) => ha + (hb - ha) * t;
  for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 1) / n;
    quad(out, lift(at(t0), datum, -0.01), lift(at(t0), datum, h(t0)), lift(at(t1), datum, h(t1)), lift(at(t1), datum, -0.01));
  }
  return out;
}

export function addDoorSills(scene: THREE.Scene): void {
  const white = plasterMaterial("#fffdf3"), red = new THREE.MeshStandardMaterial({ color: "#a75d43", map: surfaceTexture("paving"), roughness: 1 });
  red.side = white.side = THREE.DoubleSide;
  for (const s of data.sills) {
    const ring = sillRing(s), y = sillTop(s), top = (a: Vec2) => lift(a, ELENA_SURFACE, y - siteY(...a)), treads: number[] = [], sides: number[] = [];
    quad(treads, top(ring[0]), top(ring[3]), top(ring[2]), top(ring[1]));
    for (let i = 0; i < 4; i++) {const a = ring[i], b = ring[(i + 1) % 4];sides.push(...face(a, b, ELENA_SURFACE, y - siteY(...a), y - siteY(...b)));}
    scene.add(mesh(treads, s.tread === "red" ? red : white, s.id + "-tread"), mesh(sides, white, s.id + "-riser"));
  }
  // The kerbed footpath: tiles, the lawn strip, the white kerb and its faces, and the porch drain.
  const asphalt = new THREE.MeshStandardMaterial({color:"#7f8384",roughness:1,side:THREE.DoubleSide});
  scene.add(mesh([...sheet(kerbPoint,[kerb.taper,kerb.pathKerbFrom],[-kerb.parkingApron.overlap,0],()=>0,DALI_SURFACE),...sheet(kerbPoint,[kerb.pathKerbFrom,kerb.length],[-kerb.parkingApron.overlap,kerb.pathEdge],()=>0,DALI_SURFACE)],asphalt,kerb.id+"-parking-apron"));
  const tiles = new THREE.MeshStandardMaterial({ color: "#ffffff", map: surfaceTexture("paving"), roughness: 1, side: THREE.DoubleSide });
  const turf = new THREE.MeshStandardMaterial({ color: "#718658", map: surfaceTexture("turf"), roughness: 1, side: THREE.DoubleSide });
  const band = (s: number) => bandHeight(s);
  const L = kerb.lawn, kw = kerb.kerbWidth, path: number[] = [], lawn: number[] = [], stone: number[] = [];
  path.push(...sheet(kerbPoint, [0, kerb.taper], [0, kerb.width], band, DALI_SURFACE)); // unphotographed: no kerb, the rise fades out
  path.push(...sheet(kerbPoint, [L.from, L.to], [L.across[1], kerb.width], band, DALI_SURFACE));
  path.push(...sheet(kerbPoint, [kerb.pathKerbFrom, kerb.length], [kerb.pathEdge + kw, kerb.width], band, DALI_SURFACE));
  lawn.push(...sheet(kerbPoint, [L.from, L.to], L.across, (s) => band(s) - 0.01, DALI_SURFACE));
  const kerbTop = (s: number) => band(s) + 0.012;
  stone.push(...sheet(kerbPoint, [kerb.taper, kerb.pathKerbFrom], [0, kw], kerbTop, DALI_SURFACE));
  stone.push(...sheet(kerbPoint, [kerb.pathKerbFrom - kw, kerb.pathKerbFrom], [kw, kerb.pathEdge + kw], kerbTop, DALI_SURFACE));
  stone.push(...sheet(kerbPoint, [kerb.pathKerbFrom, kerb.length], [kerb.pathEdge, kerb.pathEdge + kw], kerbTop, DALI_SURFACE));
  stone.push(...face(kerbPoint(0, 0), kerbPoint(kerb.taper, 0), DALI_SURFACE, band(0), band(kerb.taper)));
  stone.push(...face(kerbPoint(kerb.taper, 0), kerbPoint(kerb.pathKerbFrom, 0), DALI_SURFACE, kerbTop(kerb.taper), kerbTop(kerb.pathKerbFrom)));
  stone.push(...face(kerbPoint(kerb.pathKerbFrom, 0), kerbPoint(kerb.pathKerbFrom, kerb.pathEdge), DALI_SURFACE, kerb.rise, kerb.rise));
  stone.push(...face(kerbPoint(kerb.pathKerbFrom, kerb.pathEdge), kerbPoint(kerb.length, kerb.pathEdge), DALI_SURFACE, kerb.rise, kerb.rise));
  stone.push(...face(kerbPoint(kerb.length, kerb.pathEdge), kerbPoint(kerb.length, kerb.width), DALI_SURFACE, kerb.rise, kerb.rise));
  const grate = new THREE.MeshStandardMaterial({ color: "#3b4243", roughness: 0.8 }), drain: number[] = [];
  drain.push(...sheet(kerbPoint, kerb.drain.along, kerb.drain.across, (s) => band(s) + 0.006, DALI_SURFACE));
  scene.add(mesh(path, tiles, kerb.id + "-path"), mesh(lawn, turf, kerb.id + "-lawn"), mesh(stone, white, kerb.id + "-kerb"), mesh(drain, grate, kerb.drain.id));
  // The flagstone approach: stone between the kerbs, a grooved concrete foot strip, rounded white kerbs.
  const flag = new THREE.MeshStandardMaterial({ color: "#a39b8c", map: surfaceTexture("mosaic"), roughness: 1, side: THREE.DoubleSide });
  const concrete = new THREE.MeshStandardMaterial({ color: "#c9c4b7", roughness: 1, side: THREE.DoubleSide });
  const along = approachStations.filter((t) => t <= ap.slope), stones: number[] = [], strip: number[] = [], kerbs: number[] = [];
  const across = (t: number, f: number) => -approachInner(t, "left") + f * (approachInner(t, "left") + approachInner(t, "right"));
  const span = (u: number, v: number) => approachPoint(u, across(u, v)), base = approachBase();
  const level = (point: (u: number, v: number) => Vec2, h: (t: number) => number) => (u: number, v: number) => base + h(u) - siteY(...point(u, v));
  stones.push(...sheet(span, along, [0, 1], level(span, approachSurface), DALI_SURFACE));
  strip.push(...sheet(span, [ap.slope, ap.foot], [0, 1], level(span, (t) => approachSurface(t) + 0.004), DALI_SURFACE));
  for (const g of [0.3, 0.5, 0.7]) strip.push(...sheet(span, [ap.slope + 0.15, ap.foot - 0.12], [g - 0.01, g + 0.01], level(span, (t) => approachSurface(t) + 0.008), DALI_SURFACE));
  for (const sign of [-1, 1]) {
    const side = sign > 0 ? "right" : "left", edge = (t: number, k: number) => approachPoint(t, sign * (approachInner(t, side) + k * ap.kerbWidth));
    const top = (t: number, k: number) => base + approachSurface(t) + ap.kerbHeight - siteY(...edge(t, k));
    kerbs.push(...sheet(edge, approachStations, [0, 1], top, DALI_SURFACE));
    for (let i = 1; i < approachStations.length; i++) {
      const a = approachStations[i - 1], b = approachStations[i];
      for (const k of [0, 1]) kerbs.push(...face(edge(a, k), edge(b, k), DALI_SURFACE, top(a, k), top(b, k)));
    }
    kerbs.push(...face(edge(ap.foot, 0), edge(ap.foot, 1), DALI_SURFACE, top(ap.foot, 0), top(ap.foot, 1)));
  }
  scene.add(mesh(stones, flag, ap.id + "-flagstones"), mesh(strip, concrete, ap.id + "-grooved-strip"), mesh(kerbs, white, ap.id + "-kerbs"));
}
