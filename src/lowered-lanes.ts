import * as THREE from "three";
import { plasterMaterial } from "./materials";
import { roadHeight } from "./boundaries";
import layout from "../data/guillermo_slope.json";
import type { BoundaryReference, Vec2 } from "./types";

type Road = BoundaryReference["roads"][number];
/** A road's surface height at street level (src/boundaries.ts draws every flat road there). */
const STREET = 0.27;
/** Half the tiled lane and its pale edging: the corridor cut out of the street-level ground. */
const edgeOffset = (road: Road): number => (road.width + 0.12) / 2;

/** Lanes that dip below street level somewhere (Calle Guillermo and the foot of Calle Jorge). */
export const loweredRoads = (reference: BoundaryReference): Road[] => reference.roads.filter((r) => r.heights?.some((h) => h < STREET - 0.01));

/** How far a lowered lane's surface lies below street level at (x, z), or 0 off them. */
export function laneDrop(roads: Road[], x: number, z: number): number {
  for (const road of roads) {
    const hit = roadHeight(road, x, z);
    if (hit.distance <= road.width / 2 + 0.18) return Math.min(0, hit.height - STREET);
  }
  return 0;
}

/** Beside a lowered stretch's corridor, not past its end: the deck's own walls are not drawn along it. */
export function onLoweredLane(roads: Road[], x: number, z: number): boolean {
  return roads.some((road) => road.points.slice(1).some((q, i) => {
    const p = road.points[i], dx = q[0] - p[0], dz = q[1] - p[1], t = ((x - p[0]) * dx + (z - p[1]) * dz) / (dx * dx + dz * dz);
    if (t < 0 || t > 1 || road.heights![i] + (road.heights![i + 1] - road.heights![i]) * t >= STREET - 0.005) return false;
    return Math.abs((x - p[0]) * dz - (z - p[1]) * dx) / Math.hypot(dx, dz) <= edgeOffset(road) + 0.05;
  }));
}

/**
 * The walls down each side of a lowered lane. Where the ground beside it is higher (house
 * gardens at street level) a white retaining face holds it back; where it is lower (the big-pool
 * lawn) a white wall stands up from the lawn to a parapet above the lane. A side opening onto
 * another lowered lane, or level with this one, is left open.
 */
export function addLoweredLanes(scene: THREE.Scene, reference: BoundaryReference, beside: (x: number, z: number) => number): void {
  const roads = loweredRoads(reference), white = plasterMaterial("#f4f0e5"), positions: number[] = [];
  const quad = (a: Vec2, b: Vec2, ay0: number, ay1: number, by0: number, by1: number) =>
    positions.push(a[0], ay0, a[1], b[0], by0, b[1], a[0], ay1, a[1], a[0], ay1, a[1], b[0], by0, b[1], b[0], by1, b[1]);
  for (const road of roads) {
    const others = roads.filter((r) => r !== road), half = edgeOffset(road);
    for (let i = 0; i < road.points.length - 1; i++) {
      const p = road.points[i], q = road.points[i + 1], length = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (road.heights![i] >= STREET - 0.005 && road.heights![i + 1] >= STREET - 0.005) continue;
      const ux = (q[0] - p[0]) / length, uz = (q[1] - p[1]) / length, pieces = Math.ceil(length / 0.2);
      for (let k = 0; k < pieces; k++) {
        const f = k / pieces, g = (k + 1) / pieces;
        const a: Vec2 = [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f], b: Vec2 = [p[0] + (q[0] - p[0]) * g, p[1] + (q[1] - p[1]) * g];
        const ha = road.heights![i] + (road.heights![i + 1] - road.heights![i]) * f - 0.015, hb = road.heights![i] + (road.heights![i + 1] - road.heights![i]) * g - 0.015;
        for (const side of [1, -1]) {
          const nx = -uz * side, nz = ux * side;
          const ea: Vec2 = [a[0] + nx * half, a[1] + nz * half], eb: Vec2 = [b[0] + nx * half, b[1] + nz * half];
          const out: Vec2 = [(a[0] + b[0]) / 2 + nx * (half + 0.05), (a[1] + b[1]) / 2 + nz * (half + 0.05)];
          if (others.some((r) => roadHeight(r, ...out).distance <= edgeOffset(r))) continue;
          const ground = beside(...out);
          if (ground > Math.max(ha, hb) + 0.02) quad(ea, eb, Math.min(ha, ground), ground, Math.min(hb, ground), ground);
          else if (ground < Math.min(ha, hb) - 0.3) {
            // A wall 0.2 m thick, its lane face at the tiles' edge and its lawn face on the lawn.
            const t = 0.2, oa: Vec2 = [ea[0] + nx * t, ea[1] + nz * t], ob: Vec2 = [eb[0] + nx * t, eb[1] + nz * t];
            const ta = ha + layout.parapet, tb = hb + layout.parapet;
            quad(ea, eb, ha, ta, hb, tb);
            quad(oa, ob, ground, ta, ground, tb);
            positions.push(ea[0], ta, ea[1], oa[0], ta, oa[1], eb[0], tb, eb[1], eb[0], tb, eb[1], oa[0], ta, oa[1], ob[0], tb, ob[1]);
          }
        }
      }
    }
  }
  if (!positions.length) return;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const at = geometry.getAttribute("position"), uvs: number[] = [];
  for (let v = 0; v < at.count; v++) uvs.push(at.getX(v) + at.getZ(v), at.getY(v));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  white.side = THREE.DoubleSide;
  const walls = new THREE.Mesh(geometry, white);
  walls.castShadow = walls.receiveShadow = true;
  walls.name = "lowered-lane-walls";
  walls.userData.structural = true;
  scene.add(walls);
}
