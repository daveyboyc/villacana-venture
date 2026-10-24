import * as THREE from "three";
import data from "../data/terrain.json";
import { centroid, clamp, closestOnSegment, pointInRing } from "./geom";
import type { Vec2 } from "./types";

type Ramp = { foot: number[]; toward: number[]; start: number; run: number; halfWidth: number; base: number; rise: number };
type Grid = { x0: number; z0: number; step: number; nx: number; nz: number; fade: number[]; ramps: Ramp[]; cm: number[][] };
const grid = data as unknown as Grid;
const COS = Math.cos(26 * Math.PI / 180), SIN = Math.sin(26 * Math.PI / 180);
const ramps = grid.ramps.map((r) => {
  const dx = r.toward[0] - r.foot[0], dz = r.toward[1] - r.foot[1], length = Math.hypot(dx, dz);
  return { ...r, up: [dx / length, dz / length] };
});
/** How far a photographed flight's own profile reaches before giving way to the survey grid. */
const RAMP_BLEND = 3;

/** The surveyed ground, sampled bilinearly. */
function surveyed(x: number, z: number): number {
  const u = clamp((x - grid.x0) / grid.step, 0, grid.nx - 1.001), v = clamp((z - grid.z0) / grid.step, 0, grid.nz - 1.001);
  const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, row = grid.cm[j], next = grid.cm[j + 1];
  const top = row[i] + (row[i + 1] - row[i]) * fu, bottom = next[i] + (next[i + 1] - next[i]) * fu;
  return (top + (bottom - top) * fv) / 100;
}

/**
 * Height of the ground above the middle-pool deck, from the laser survey (data/terrain.json,
 * written by scripts/lidar_check.py grid). Each photographed flight of steps keeps an exact
 * rise: level ground, a straight climb from its first riser (or its foot), level ground above. Seaward of the fade
 * line the seafront heights take over.
 */
export function siteY(x: number, z: number): number {
  const tz = x * SIN + z * COS;
  const seaward = 1 - clamp((tz - grid.fade[0]) / (grid.fade[1] - grid.fade[0]), 0, 1);
  if (!seaward) return 0;
  let y = surveyed(x, z);
  for (const r of ramps) {
    const dx = x - r.foot[0], dz = z - r.foot[1], along = dx * r.up[0] + dz * r.up[1], across = Math.abs(dz * r.up[0] - dx * r.up[1]);
    const beyond = Math.max(-1 - along, along - (r.run + 1.5), 0), aside = Math.max(across - r.halfWidth, 0);
    const weight = (1 - clamp(beyond / RAMP_BLEND, 0, 1)) * (1 - clamp(aside / RAMP_BLEND, 0, 1));
    if (weight > 0) y += (r.base + r.rise * clamp((along - r.start) / (r.run - r.start), 0, 1) - y) * weight;
  }
  return y * seaward;
}

/** Split triangles that cross a change of height, so a draped surface follows the ground. */
export function refine(geometry: THREE.BufferGeometry, heightAt: (x: number, z: number) => number, world: THREE.Matrix4): THREE.BufferGeometry {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry, pos = flat.getAttribute("position"), uv = flat.getAttribute("uv");
  const outP: number[] = [], outU: number[] = [], v = new THREE.Vector3();
  let lifted = false;
  type P = { p: number[]; u: number[]; h: number };
  const make = (p: number[], u: number[]): P => { v.set(p[0], p[1], p[2]).applyMatrix4(world); return { p, u, h: heightAt(v.x, v.z) }; };
  const mid = (a: P, b: P): P => make(a.p.map((c, i) => (c + b.p[i]) / 2), a.u.map((c, i) => (c + b.u[i]) / 2));
  const emit = (a: P, b: P, c: P, depth: number) => {
    const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
    const hs = [a.h, b.h, c.h, ab.h, bc.h, ca.h], uneven = Math.max(...hs) - Math.min(...hs) > 0.01;
    // How far the ground at each edge's middle bends away from the straight edge.
    const bend = Math.max(Math.abs(ab.h - (a.h + b.h) / 2), Math.abs(bc.h - (b.h + c.h) / 2), Math.abs(ca.h - (c.h + a.h) / 2));
    const longest = Math.max(Math.hypot(a.p[0] - b.p[0], a.p[2] - b.p[2]), Math.hypot(b.p[0] - c.p[0], b.p[2] - c.p[2]), Math.hypot(c.p[0] - a.p[0], c.p[2] - a.p[2]));
    if (depth && longest > 1.5 && (bend > 0.02 || uneven && longest > 6)) { emit(a, ab, ca, depth - 1); emit(ab, b, bc, depth - 1); emit(ca, bc, c, depth - 1); emit(ab, bc, ca, depth - 1); return; }
    for (const q of [a, b, c]) { if (q.h) lifted = true; outP.push(q.p[0], q.p[1] + q.h, q.p[2]); outU.push(...q.u); }
  };
  const groups:{start:number;count:number;materialIndex:number}[]=[];
  for (let i = 0; i < pos.count; i += 3) {
    const corner = (k: number) => make([pos.getX(k), pos.getY(k), pos.getZ(k)], uv ? [uv.getX(k), uv.getY(k)] : []);
    const start=outP.length/3;
    emit(corner(i), corner(i + 1), corner(i + 2), 8);
    const source=flat.groups.find(g=>i>=g.start&&i<g.start+g.count);
    if(source){const count=outP.length/3-start,last=groups[groups.length-1];if(last&&last.materialIndex===source.materialIndex&&last.start+last.count===start)last.count+=count;else groups.push({start,count,materialIndex:source.materialIndex??0});}
  }
  // Nothing here stands off the deck level: leave it exactly as it was.
  if (!lifted) return geometry;
  const result = new THREE.BufferGeometry();
  result.setAttribute("position", new THREE.Float32BufferAttribute(outP, 3));
  if (uv) result.setAttribute("uv", new THREE.Float32BufferAttribute(outU, 2));
  for(const g of groups)result.addGroup(g.start,g.count,g.materialIndex);
  result.computeVertexNormals();
  return result;
}

/**
 * Lift everything already in the scene onto the ground heights. Small things
 * move as a whole; long flat things (roads, car parks) are bent to follow the
 * ground; details fixed to a house move with that house.
 */
export function drapeScene(scene: THREE.Scene, buildings: { ring: Vec2[] }[]): void {
  const houses = buildings.map((b) => {
    const c = centroid(b.ring), xs = b.ring.map((p) => p[0]), zs = b.ring.map((p) => p[1]);
    return { ring: b.ring, y: siteY(c.x, c.z), minX: Math.min(...xs) - 2.2, maxX: Math.max(...xs) + 2.2, minZ: Math.min(...zs) - 2.2, maxZ: Math.max(...zs) + 2.2 };
  });
  /** The ground height for something at this spot: its house's, if it stands against one. */
  const baseAt = (x: number, z: number): number => {
    for (const h of houses) {
      if (x < h.minX || x > h.maxX || z < h.minZ || z > h.maxZ) continue;
      if (pointInRing(x, z, h.ring) || h.ring.some((a, i) => closestOnSegment(x, z, a[0], a[1], h.ring[(i + 1) % h.ring.length][0], h.ring[(i + 1) % h.ring.length][1]).d <= 2.2)) return h.y;
    }
    return siteY(x, z);
  };
  scene.updateMatrixWorld(true);
  const m = new THREE.Matrix4(), box = new THREE.Box3(), size = new THREE.Vector3(), mid = new THREE.Vector3();
  for (const object of [...scene.children]) {
    if (object.userData.noDrape || (object as THREE.Light).isLight || (object as THREE.Camera).isCamera) continue;
    if ((object as THREE.InstancedMesh).isInstancedMesh) {
      const mesh = object as THREE.InstancedMesh;
      let changed = false;
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, m);
        const y = baseAt(m.elements[12] + mesh.position.x, m.elements[14] + mesh.position.z);
        if (!y) continue;
        m.elements[13] += y; mesh.setMatrixAt(i, m); changed = true;
      }
      if (changed) { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); }
      continue;
    }
    // Buildings stay level and keep their extrusion material groups, even over 45 m.
    const base=object.userData.base as Vec2|undefined;
    if(base){object.position.y+=siteY(...base);continue;}
    box.setFromObject(object);
    if (box.isEmpty()) continue;
    box.getSize(size); box.getCenter(mid);
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh && Math.max(size.x, size.z) > 45) {
      // Long and flat: bend it over the ground.
      const old = mesh.geometry;
      mesh.geometry = refine(old, siteY, mesh.matrixWorld);
      if (mesh.geometry !== old) old.dispose();
      continue;
    }
    const at = object.userData.base as Vec2 | undefined;
    const y = at ? siteY(at[0], at[1]) : siteY(mid.x, mid.z);
    if (y) object.position.y += y;
  }
}
