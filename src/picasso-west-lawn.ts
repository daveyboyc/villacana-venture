import * as THREE from "three";
import data from "../data/picasso_west_lawn.json";
import layout from "../data/street_layout.json";
import { plasterMaterial, surfaceTexture } from "./materials";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/**
 * The raised grass strip between Calle de Picasso and the main car park's west bays, and the retaining wall
 * that holds it up at the back of the bays (data/picasso_west_lawn.json). The grass stands level with the
 * path, a little below its paving, and steps down with it; the wall's foot is on the car park.
 */
const [ox, oz] = data.frame.origin, [tx, tz] = data.frame.toward;
const length = Math.hypot(tx - ox, tz - oz);
const U: Vec2 = [(tx - ox) / length, (tz - oz) / length];
/** West of the car line: the side Calle de Picasso is on. */
const W: Vec2 = [-U[1], U[0]];
const at = (s: number, west: number): Vec2 => [ox + U[0] * s + W[0] * west, oz + U[1] * s + W[1] * west];
const path = (layout.streets.find((r) => r.id === "picasso-access")!).points as Vec2[];
const pathWidth = layout.streets.find((r) => r.id === "picasso-access")!.width;
/** Paving and the car park are drawn this far above the terrain (boundaries.ts, picasso-car-park.ts). */
const PAVING = 0.27;

/** How far west of the car line Calle de Picasso's centreline lies at s. */
function pathWest(s: number): number {
  const [px, pz] = at(s, 0);
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, az] = path[i], [bx, bz] = path[i + 1];
    // Where the line through (px, pz) along W meets the segment.
    const dx = bx - ax, dz = bz - az, den = W[0] * dz - W[1] * dx;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((ax - px) * dz - (az - pz) * dx) / den, k = ((ax - px) * W[1] - (az - pz) * W[0]) / den;
    if (k >= -1e-6 && k <= 1 + 1e-6) return t;
  }
  return 8.4;
}

/** Each span sampled every half metre: the wall's outer and inner faces, the path's east edge, the grass and foot heights. */
export function picassoWestLawnSections(): { span: number; s: number; outer: Vec2; inner: Vec2; edge: Vec2; lawn: number; foot: number }[][] {
  return (data.spans as [number, number][]).map(([s0, s1], span) => {
    const steps = Math.ceil((s1 - s0) / 0.5);
    return Array.from({ length: steps + 1 }, (_, i) => {
      const s = s0 + (s1 - s0) * i / steps, west = pathWest(s);
      const centre = at(s, west), outer = at(s, data.wall.offset);
      const lawn = siteY(...centre) + PAVING - data.lawnBelowPath;
      const foot = Math.min(siteY(...outer) + PAVING, lawn) - data.wall.below;
      return { span, s, outer, inner: at(s, data.wall.offset + data.wall.thickness), edge: at(s, west - pathWidth / 2), lawn, foot };
    });
  });
}

/** The wall's footprint, for collision and the map: one ring per span. */
export function picassoWestLawnRings(): Vec2[][] {
  return picassoWestLawnSections().map((row) => [...row.map((r) => r.outer), ...row.map((r) => r.inner).reverse()]);
}

/** The grass strip's footprint, for the map. */
export function picassoWestLawnPlan(): Vec2[][] {
  return picassoWestLawnSections().map((row) => [...row.map((r) => r.inner), ...row.map((r) => r.edge).reverse()]);
}

export function addPicassoWestLawn(scene: THREE.Scene): void {
  const group = new THREE.Group();
  group.name = data.id;
  group.userData.noDrape = true;
  group.userData.structural = true;
  const white = plasterMaterial("#f4f1e8");
  const turf = new THREE.MeshStandardMaterial({ color: "#6d8a48", map: surfaceTexture("turf"), roughness: 1, side: THREE.DoubleSide });
  const coping = data.wall.coping;
  for (const row of picassoWestLawnSections()) {
    const grass: number[] = [], face: number[] = [], top: number[] = [], back: number[] = [];
    const quad = (out: number[], a: number[], b: number[], c: number[], d: number[]) => out.push(...a, ...b, ...c, ...a, ...c, ...d);
    for (let i = 0; i < row.length - 1; i++) {
      const p = row[i], q = row[i + 1];
      const y = (r: typeof p) => r.lawn + coping;
      // Grass from the wall's inner face to the path's edge.
      quad(grass, [p.inner[0], p.lawn, p.inner[1]], [q.inner[0], q.lawn, q.inner[1]], [q.edge[0], q.lawn, q.edge[1]], [p.edge[0], p.lawn, p.edge[1]]);
      // The wall: outer face down to the car park, its coping, and a short inner face above the grass.
      quad(face, [p.outer[0], p.foot, p.outer[1]], [q.outer[0], q.foot, q.outer[1]], [q.outer[0], y(q), q.outer[1]], [p.outer[0], y(p), p.outer[1]]);
      quad(top, [p.outer[0], y(p), p.outer[1]], [q.outer[0], y(q), q.outer[1]], [q.inner[0], y(q), q.inner[1]], [p.inner[0], y(p), p.inner[1]]);
      quad(back, [p.inner[0], p.lawn - 0.05, p.inner[1]], [q.inner[0], q.lawn - 0.05, q.inner[1]], [q.inner[0], y(q), q.inner[1]], [p.inner[0], y(p), p.inner[1]]);
    }
    // Each end of a span is closed by a face from the wall to the path's edge, down to the ground there.
    for (const r of [row[0], row[row.length - 1]]) {
      const ground = (p: Vec2) => Math.min(siteY(...p) + PAVING, r.lawn) - data.wall.below;
      quad(face, [r.outer[0], r.foot, r.outer[1]], [r.edge[0], ground(r.edge), r.edge[1]], [r.edge[0], r.lawn, r.edge[1]], [r.outer[0], r.lawn + coping, r.outer[1]]);
    }
    for (const [positions, material, part] of [[grass, turf, "grass"], [face, white, "wall"], [top, white, "coping"], [back, white, "wall-inner"]] as const) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      if (part === "grass") {
        // Turf texture by world position, about 1.6 m a repeat.
        const uv: number[] = [];
        for (let k = 0; k < positions.length; k += 3) uv.push(positions[k] / 1.6, positions[k + 2] / 1.6);
        geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      }
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, material);
      (mesh.material as THREE.Material).side = THREE.DoubleSide;
      mesh.name = `${data.id}-${part}`;
      mesh.castShadow = part !== "grass";
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  }
  scene.add(group);
}
