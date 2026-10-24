import * as THREE from "three";
import data from "../data/terrain.json";
import { centroid, clamp, closestOnSegment, pointInRing } from "./geom";
import type { Vec2 } from "./types";

type Ramp = { foot: number[]; toward: number[]; start: number; run: number; halfWidth: number; behind: number; base: number; rise: number };
type Grid = { x0: number; z0: number; step: number; nx: number; nz: number; fade: number[]; ramps: Ramp[]; cm: number[][] };
const grid = data as unknown as Grid;
const COS = Math.cos(26 * Math.PI / 180), SIN = Math.sin(26 * Math.PI / 180);
const ramps = grid.ramps.map((r) => {
  const dx = r.toward[0] - r.foot[0], dz = r.toward[1] - r.foot[1], length = Math.hypot(dx, dz);
  return { ...r, up: [dx / length, dz / length] };
});
/** How far a photographed flight's own profile reaches beside and above it before giving way to the survey grid (below its foot: behind). */
const RAMP_BLEND = 3;

/**
 * The surveyed ground: each 2 m cell is split into two flat triangles along its diagonal
 * (from its low-x, low-z corner), so every draped surface cut along the same lines lies exactly on it.
 */
function surveyed(x: number, z: number): number {
  const u = clamp((x - grid.x0) / grid.step, 0, grid.nx - 1.001), v = clamp((z - grid.z0) / grid.step, 0, grid.nz - 1.001);
  const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, row = grid.cm[j], next = grid.cm[j + 1];
  const y = fu >= fv ? row[i] + fu * (row[i + 1] - row[i]) + fv * (next[i + 1] - row[i + 1]) : row[i] + fv * (next[i] - row[i]) + fu * (next[i + 1] - next[i]);
  return y / 100;
}

/** World boxes where siteY is not flat on the survey's triangles: around each flight, and the seafront fade. */
const curved = ramps.map((r) => {
  const side = [-r.up[1], r.up[0]], ends = [-1 - r.behind, r.run + 1.5 + RAMP_BLEND], half = r.halfWidth + RAMP_BLEND;
  const xs: number[] = [], zs: number[] = [];
  for (const a of ends) for (const c of [-half, half]) { xs.push(r.foot[0] + r.up[0] * a + side[0] * c); zs.push(r.foot[1] + r.up[1] * a + side[1] * c); }
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
});
/** Whether siteY is flat on the survey's triangles over this box. */
function facetted(minX: number, maxX: number, minZ: number, maxZ: number): boolean {
  if (curved.some((b) => minX <= b.maxX && maxX >= b.minX && minZ <= b.maxZ && maxZ >= b.minZ)) return false;
  // tz = x sin + z cos grows with both x and z, so its range over the box is at the corners.
  const lo = minX * SIN + minZ * COS, hi = maxX * SIN + maxZ * COS;
  return hi <= grid.fade[0] || lo >= grid.fade[1];
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
    const below = Math.max(-1 - along, 0) / r.behind, beyond = Math.max(along - (r.run + 1.5), 0) / RAMP_BLEND, aside = Math.max(across - r.halfWidth, 0) / RAMP_BLEND;
    const weight = (1 - clamp(Math.max(below, beyond), 0, 1)) * (1 - clamp(aside, 0, 1));
    if (weight > 0) y += (r.base + r.rise * clamp((along - r.start) / (r.run - r.start), 0, 1) - y) * weight;
  }
  return y * seaward;
}

/**
 * A flat ground sheet over [min, max] with holes, laid out on the survey grid's cells: two triangles
 * per open cell along its diagonal, so draping keeps it at two triangles a cell. Around each hole a
 * block of whole cells is triangulated with the hole cut out.
 */
export function groundSheet(min: Vec2, max: Vec2, holes: Vec2[][]): THREE.BufferGeometry {
  const step = grid.step, col = (x: number) => (x - grid.x0) / step, row = (z: number) => (z - grid.z0) / step;
  const i0 = Math.floor(col(min[0])), i1 = Math.ceil(col(max[0])), j0 = Math.floor(row(min[1])), j1 = Math.ceil(row(max[1]));
  const X = (i: number) => clamp(grid.x0 + i * step, min[0], max[0]), Z = (j: number) => clamp(grid.z0 + j * step, min[1], max[1]);
  // Blocks of cells round each hole, merged until none overlap.
  let blocks = holes.map((h) => ({ holes: [h], a: Math.floor(col(Math.min(...h.map((p) => p[0])))) - 1, b: Math.ceil(col(Math.max(...h.map((p) => p[0])))) + 1, c: Math.floor(row(Math.min(...h.map((p) => p[1])))) - 1, d: Math.ceil(row(Math.max(...h.map((p) => p[1])))) + 1 }));
  for (let merged = true; merged;) {
    merged = false;
    outer: for (let k = 0; k < blocks.length; k++) for (let m = k + 1; m < blocks.length; m++) {
      const p = blocks[k], q = blocks[m];
      if (p.a <= q.b && q.a <= p.b && p.c <= q.d && q.c <= p.d) {
        blocks[k] = { holes: [...p.holes, ...q.holes], a: Math.min(p.a, q.a), b: Math.max(p.b, q.b), c: Math.min(p.c, q.c), d: Math.max(p.d, q.d) };
        blocks.splice(m, 1); merged = true; break outer;
      }
    }
  }
  blocks = blocks.map((k) => ({ ...k, a: Math.max(k.a, i0), b: Math.min(k.b, i1), c: Math.max(k.c, j0), d: Math.min(k.d, j1) }));
  const out: number[] = [];
  const tri = (a: number[], b: number[], c: number[]) => {
    // Face up: counter-clockwise seen from above (+y), which in x, z is clockwise.
    const up = (c[0] - a[0]) * (b[1] - a[1]) - (b[0] - a[0]) * (c[1] - a[1]) > 0;
    for (const q of up ? [a, b, c] : [a, c, b]) out.push(q[0], 0, q[1]);
  };
  for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) {
    if (blocks.some((k) => i >= k.a && i < k.b && j >= k.c && j < k.d)) continue;
    const a = [X(i), Z(j)], b = [X(i + 1), Z(j)], c = [X(i + 1), Z(j + 1)], d = [X(i), Z(j + 1)];
    if (a[0] === b[0] || a[1] === d[1]) continue;
    tri(a, b, c); tri(a, c, d);
  }
  for (const k of blocks) {
    const contour = [[X(k.a), Z(k.c)], [X(k.b), Z(k.c)], [X(k.b), Z(k.d)], [X(k.a), Z(k.d)]].map(([x, z]) => new THREE.Vector2(x, z));
    const cut = k.holes.map((h) => h.map(([x, z]) => new THREE.Vector2(x, z)));
    // triangulateShape drops a repeated closing point from the rings in place: list the points after it.
    const faces = THREE.ShapeUtils.triangulateShape(contour, cut), points = [...contour, ...cut.flat()];
    for (const [a, b, c] of faces) tri([points[a].x, points[a].y], [points[b].x, points[b].y], [points[c].x, points[c].y]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(new Array((out.length / 3) * 2).fill(0), 2));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Lay a surface on the ground. Triangles are cut along the survey grid's cell edges and diagonals,
 * where siteY is flat, so every draped surface lies exactly on the same facets; around a flight and
 * in the seafront fade they are split further wherever the ground bends.
 */
export function refine(geometry: THREE.BufferGeometry, heightAt: (x: number, z: number) => number, world: THREE.Matrix4): THREE.BufferGeometry {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry, pos = flat.getAttribute("position"), uv = flat.getAttribute("uv");
  const outP: number[] = [], outU: number[] = [], v = new THREE.Vector3();
  let lifted = false;
  type P = { p: number[]; u: number[]; w: number[]; h: number };
  const make = (p: number[], u: number[]): P => { v.set(p[0], p[1], p[2]).applyMatrix4(world); return { p, u, w: [v.x, v.z], h: heightAt(v.x, v.z) }; };
  const lerp = (a: P, b: P, t: number): P => make(a.p.map((c, i) => c + (b.p[i] - c) * t), a.u.map((c, i) => c + (b.u[i] - c) * t));
  const mid = (a: P, b: P): P => lerp(a, b, 0.5);
  const emit = (a: P, b: P, c: P, depth: number) => {
    const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
    const hs = [a.h, b.h, c.h, ab.h, bc.h, ca.h], uneven = Math.max(...hs) - Math.min(...hs) > 0.01;
    // How far the ground at each edge's middle bends away from the straight edge.
    const bend = Math.max(Math.abs(ab.h - (a.h + b.h) / 2), Math.abs(bc.h - (b.h + c.h) / 2), Math.abs(ca.h - (c.h + a.h) / 2));
    const longest = Math.max(Math.hypot(a.p[0] - b.p[0], a.p[2] - b.p[2]), Math.hypot(b.p[0] - c.p[0], b.p[2] - c.p[2]), Math.hypot(c.p[0] - a.p[0], c.p[2] - a.p[2]));
    if (depth && longest > 1.5 && (bend > 0.008 || uneven && longest > 4)) { emit(a, ab, ca, depth - 1); emit(ab, b, bc, depth - 1); emit(ca, bc, c, depth - 1); emit(ab, bc, ca, depth - 1); return; }
    for (const q of [a, b, c]) { if (q.h) lifted = true; outP.push(q.p[0], q.p[1] + q.h, q.p[2]); outU.push(...q.u); }
  };
  /** Keep the part of a convex polygon where side(w) >= 0, side being linear in world x, z. */
  const clip = (poly: P[], side: (w: number[]) => number): P[] => {
    const out: P[] = [];
    poly.forEach((a, k) => {
      const b = poly[(k + 1) % poly.length], sa = side(a.w), sb = side(b.w);
      if (sa >= 0) out.push(a);
      if (sa >= 0 !== sb >= 0) out.push(lerp(a, b, sa / (sa - sb)));
    });
    return out;
  };
  const piece = (all: P[]) => {
    // Clipping along a line a triangle only touches leaves repeated points and no area: drop those.
    const poly = all.filter((q, k) => { const r = all[(k + 1) % all.length]; return q.p.some((c, n) => Math.abs(c - r.p[n]) > 1e-6); });
    if (poly.length < 3) return;
    const normal = [0, 0, 0];
    poly.forEach((q, k) => { const r = poly[(k + 1) % poly.length].p; normal[0] += (q.p[1] - r[1]) * (q.p[2] + r[2]); normal[1] += (q.p[2] - r[2]) * (q.p[0] + r[0]); normal[2] += (q.p[0] - r[0]) * (q.p[1] + r[1]); });
    if (Math.hypot(...normal) < 1e-6) return;
    const xs = poly.map((q) => q.w[0]), zs = poly.map((q) => q.w[1]);
    const exact = heightAt === siteY && facetted(Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs));
    for (let k = 1; k < poly.length - 1; k++) emit(poly[0], poly[k], poly[k + 1], exact ? 0 : 8);
  };
  const cut = (a: P, b: P, c: P): void => {
    if (heightAt !== siteY) { emit(a, b, c, 8); return; }
    const xs = [a.w[0], b.w[0], c.w[0]], zs = [a.w[1], b.w[1], c.w[1]];
    // Seaward of the fade the ground is the seafront's own: siteY is zero there.
    if (Math.min(...xs.map((x, k) => x * SIN + zs[k] * COS)) >= grid.fade[1]) { emit(a, b, c, 0); return; }
    // Cell columns and rows; beyond the grid the clamped ground is flat across one strip each side.
    const cell = (t: number, o: number, n: number) => clamp(Math.floor((t - o) / grid.step), -1, n - 1);
    const edge = (k: number, o: number, n: number) => k < 0 ? -Infinity : k > n - 1 ? Infinity : o + k * grid.step;
    const i0 = cell(Math.min(...xs), grid.x0, grid.nx), i1 = cell(Math.max(...xs), grid.x0, grid.nx);
    const j0 = cell(Math.min(...zs), grid.z0, grid.nz), j1 = cell(Math.max(...zs), grid.z0, grid.nz);
    // Where the ground under it is one plane already (a held deck, level open ground), lay it whole.
    const area = (b.w[0] - a.w[0]) * (c.w[1] - a.w[1]) - (c.w[0] - a.w[0]) * (b.w[1] - a.w[1]);
    if (Math.abs(area) > 1e-6 && facetted(Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs))) {
      const s = ((b.h - a.h) * (c.w[1] - a.w[1]) - (c.h - a.h) * (b.w[1] - a.w[1])) / area;
      const t = ((c.h - a.h) * (b.w[0] - a.w[0]) - (b.h - a.h) * (c.w[0] - a.w[0])) / area;
      let level = true;
      for (let i = Math.max(i0, 0); level && i <= Math.min(i1 + 1, grid.nx - 1); i++) {
        for (let j = Math.max(j0, 0); j <= Math.min(j1 + 1, grid.nz - 1); j++) {
          const x = grid.x0 + i * grid.step, z = grid.z0 + j * grid.step;
          if (Math.abs(grid.cm[j][i] / 100 - a.h - s * (x - a.w[0]) - t * (z - a.w[1])) > 0.003) { level = false; break; }
        }
      }
      if (level) { emit(a, b, c, 0); return; }
    }
    for (let i = i0; i <= i1; i++) {
      const left = edge(i, grid.x0, grid.nx), right = edge(i + 1 > grid.nx - 1 ? grid.nx : i + 1, grid.x0, grid.nx);
      const column = clip(clip([a, b, c], (w) => w[0] - left), (w) => right - w[0]);
      for (let j = j0; j <= j1 && column.length > 2; j++) {
        const top = edge(j, grid.z0, grid.nz), bottom = edge(j + 1 > grid.nz - 1 ? grid.nz : j + 1, grid.z0, grid.nz);
        const square = clip(clip(column, (w) => w[1] - top), (w) => bottom - w[1]);
        if (square.length < 3) continue;
        if (i < 0 || j < 0 || i > grid.nx - 2 || j > grid.nz - 2) { piece(square); continue; }
        // The cell's diagonal: fu = fv.
        const diagonal = (w: number[]) => (w[0] - left) - (w[1] - top);
        piece(clip(square, diagonal)); piece(clip(square, (w) => -diagonal(w)));
      }
    }
  };
  const groups:{start:number;count:number;materialIndex:number}[]=[];
  for (let i = 0; i < pos.count; i += 3) {
    const corner = (k: number) => make([pos.getX(k), pos.getY(k), pos.getZ(k)], uv ? [uv.getX(k), uv.getY(k)] : []);
    const start=outP.length/3;
    cut(corner(i), corner(i + 1), corner(i + 2));
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
    // Ground the survey bends under it: corners of its footprint at different heights.
    const corners = [siteY(box.min.x, box.min.z), siteY(box.max.x, box.min.z), siteY(box.min.x, box.max.z), siteY(box.max.x, box.max.z), siteY(mid.x, mid.z)];
    const uneven = Math.max(...corners) - Math.min(...corners) > 0.05 && baseAt(mid.x, mid.z) === siteY(mid.x, mid.z);
    if (mesh.isMesh && (Math.max(size.x, size.z) > 45 || uneven)) {
      // Long, or on sloping ground away from a house: bend it over the ground.
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
