import * as THREE from "three";
import data from "../data/terrain.json";
import { centroid, clamp, closestOnSegment, pointInRing } from "./geom";
import type { Vec2 } from "./types";

const west = data.west;
const COS = Math.cos(26 * Math.PI / 180), SIN = Math.sin(26 * Math.PI / 180);

/**
 * Height of the ground above the middle-pool level. The Dalí side stands
 * `rise` higher; the ground climbs to it over `run` metres west of the `foot` line.
 */
export function siteY(x: number, z: number): number {
  const tx = x * COS - z * SIN, tz = x * SIN + z * COS, foot = west.foot;
  let edge = foot[foot.length - 1][0];
  if (tz <= foot[0][1]) edge = foot[0][0];
  else for (let i = 1; i < foot.length; i++) if (tz <= foot[i][1]) { edge = foot[i - 1][0] + (foot[i][0] - foot[i - 1][0]) * (tz - foot[i - 1][1]) / (foot[i][1] - foot[i - 1][1]); break; }
  // Level again by the time the land reaches the paseo.
  const seaward = 1 - clamp((tz - west.fade[0]) / (west.fade[1] - west.fade[0]), 0, 1);
  return west.rise * clamp((edge - tx) / west.run, 0, 1) * seaward;
}

/** The raised part of the ground, laid over the flat sheet with the same painted texture. */
export function addRaisedGround(scene: THREE.Scene, material: THREE.Material, centre: { x: number; z: number }, span: number): void {
  const cell = 1, n = Math.ceil(span * 2 / cell), x0 = centre.x - span, z0 = centre.z - span;
  const positions: number[] = [], uvs: number[] = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const corners = [[i, j], [i, j + 1], [i + 1, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]].map(([a, b]) => { const x = x0 + a * cell, z = z0 + b * cell; return [x, siteY(x, z), z]; });
    if (!corners.some((c) => c[1] > 0)) continue;
    for (const [x, y, z] of corners) { positions.push(x, y + 0.004, z); uvs.push((x - x0) / (span * 2), 1 - (z - z0) / (span * 2)); }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true; mesh.userData.noDrape = true; mesh.userData.referenceSurface = true;
  scene.add(mesh);
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
    const longest = Math.max(Math.hypot(a.p[0] - b.p[0], a.p[2] - b.p[2]), Math.hypot(b.p[0] - c.p[0], b.p[2] - c.p[2]), Math.hypot(c.p[0] - a.p[0], c.p[2] - a.p[2]));
    if (depth && uneven && longest > 1.5) { emit(a, ab, ca, depth - 1); emit(ab, b, bc, depth - 1); emit(ca, bc, c, depth - 1); emit(ab, bc, ca, depth - 1); return; }
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
  // Nothing here stands on raised ground: leave it exactly as it was.
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
