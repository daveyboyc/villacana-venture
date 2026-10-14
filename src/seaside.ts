import * as THREE from "three";
import layout from "../data/main_pool.json";
import paseoWall from "../data/paseo_wall.json";
import { closestOnSegment, pointInRing } from "./geom";
import type { Seafront, Vec2 } from "./types";

const levels = layout.levels.seafront;
/** The seaside starts this far inland of the paseo's centre line. */
const EDGE = 1.8;
const SAND = "#e1c99c";

/**
 * Ground heights seaward of the paseo. The paseo follows `profile` (level with
 * the big pool in front of it, street level further along); the beach then
 * falls gently from the paseo to the shore, and the sea lies a little lower.
 */
export type Seaside = {
  seaY: number;
  /** Seaward of the paseo's inland edge. */
  inZone(x: number, z: number): boolean;
  /** Ground height there. */
  y(x: number, z: number): number;
  /** The inland edge of the zone, west to east. */
  edge: Vec2[];
  /** Beside the photographed retaining wall (data/paseo_wall.json), which stands in for the plain bank. */
  walled(x: number, z: number): boolean;
};

/** Where the retaining wall stands, the zone reaches the foot of its face; it blends back to EDGE over this length past each end. */
const WALL_BLEND = 2;

export function makeSeaside(sf: Seafront, rotation: number): Seaside {
  const paseo = sf.paseo.points, coast = sf.coast, sea: Vec2[] = [...coast, [1500, 1500], [-1500, 1500]];
  const cos = Math.cos(rotation * Math.PI / 180), sin = Math.sin(rotation * Math.PI / 180);
  const profile = levels.profile as number[][];
  const paseoY = (x: number, z: number): number => {
    const along = x * cos - z * sin;
    if (along <= profile[0][0]) return profile[0][1];
    for (let i = 1; i < profile.length; i++) {
      const [a, ay] = profile[i - 1], [b, by] = profile[i];
      if (along <= b) return ay + (by - ay) * (along - a) / (b - a);
    }
    return profile[profile.length - 1][1];
  };
  const run = paseo.slice(1).reduce((acc, b, i) => [...acc, acc[i] + Math.hypot(b[0] - paseo[i][0], b[1] - paseo[i][1])], [0]);
  /** Distance to the paseo's centre line, positive on the seaward side, the nearest point on it and how far along the paseo that is. */
  const toPaseo = (x: number, z: number) => {
    let best = Infinity, signed = 0, px = x, pz = z, arc = 0;
    for (let i = 0; i < paseo.length - 1; i++) {
      const [ax, az] = paseo[i], [bx, bz] = paseo[i + 1], hit = closestOnSegment(x, z, ax, az, bx, bz);
      if (hit.d < best) { best = hit.d; px = hit.x; pz = hit.z; arc = run[i] + Math.hypot(hit.x - ax, hit.z - az); signed = (-(bz - az) * (x - ax) + (bx - ax) * (z - az)) >= 0 ? hit.d : -hit.d; }
    }
    return { signed, px, pz, arc };
  };
  // The wall's face as (distance along the paseo, distance inland of its centre line).
  const face = (paseoWall.wall.face as Vec2[]).map(([x, z]): Vec2 => { const p = toPaseo(x, z); return [p.arc, -p.signed]; });
  const [s0, s1] = [face[0][0], face[face.length - 1][0]];
  const edgeAt = (arc: number): number => {
    if (arc <= s0 - WALL_BLEND || arc >= s1 + WALL_BLEND) return EDGE;
    if (arc < s0) return EDGE + (face[0][1] - EDGE) * (arc - (s0 - WALL_BLEND)) / WALL_BLEND;
    if (arc > s1) return EDGE + (face[face.length - 1][1] - EDGE) * (s1 + WALL_BLEND - arc) / WALL_BLEND;
    for (let i = 1; i < face.length; i++) if (arc <= face[i][0]) return face[i - 1][1] + (face[i][1] - face[i - 1][1]) * (arc - face[i - 1][0]) / ((face[i][0] - face[i - 1][0]) || 1);
    return face[face.length - 1][1];
  };
  const toCoast = (x: number, z: number) => {
    let best = Infinity;
    for (let i = 0; i < coast.length - 1; i++) best = Math.min(best, closestOnSegment(x, z, coast[i][0], coast[i][1], coast[i + 1][0], coast[i + 1][1]).d);
    return best;
  };
  // The inland edge, every metre so it can follow the wall; corners take the mean of both directions.
  const edge: Vec2[] = paseo.flatMap(([x, z], i): Vec2[] => {
    const a = paseo[Math.max(0, i - 1)], b = paseo[Math.min(paseo.length - 1, i + 1)], length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const corner: Vec2 = [x + (b[1] - a[1]) / length * edgeAt(run[i]), z - (b[0] - a[0]) / length * edgeAt(run[i])];
    if (i === paseo.length - 1) return [corner];
    const [nx, nz] = paseo[i + 1], span = run[i + 1] - run[i], count = Math.max(1, Math.ceil(span));
    return [corner, ...Array.from({ length: count - 1 }, (_, k): Vec2 => {
      const f = (k + 1) / count, off = edgeAt(run[i] + span * f);
      return [x + (nx - x) * f + (nz - z) / span * off, z + (nz - z) * f - (nx - x) / span * off];
    })];
  });
  return {
    seaY: levels.sea,
    edge,
    walled: (x, z) => { const arc = toPaseo(x, z).arc; return arc >= s0 && arc <= s1; },
    inZone: (x, z) => { const p = toPaseo(x, z); return p.signed > -edgeAt(p.arc); },
    y: (x, z) => {
      const p = toPaseo(x, z), top = paseoY(p.px, p.pz), out = Math.max(p.signed - sf.paseo.width / 2, 0), shore = toCoast(x, z);
      if (pointInRing(x, z, sea)) return Math.max(levels.shore - shore * 0.04, levels.shore - 2.5);
      return top + (levels.shore - top) * out / ((out + shore) || 1);
    },
  };
}

/** Sand from the paseo down to the sea, the paseo itself, and a bank where the land behind stands higher. */
export function addSeaside(scene: THREE.Scene, sf: Seafront, seaside: Seaside, centre: { x: number; z: number }, span: number, inlandY: (x: number, z: number) => number): void {
  // Sand: a grid that follows the heights. It reaches a cell inland of the zone, hidden under the ground there.
  const cell = 2, n = Math.ceil(span * 2 / cell), x0 = centre.x - span, z0 = centre.z - span;
  const heights = new Float32Array((n + 1) * (n + 1)), inside = new Uint8Array((n + 1) * (n + 1));
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const x = x0 + i * cell, z = z0 + j * cell;
    inside[j * (n + 1) + i] = seaside.inZone(x, z) ? 1 : 0;
    // Corners just inland of the zone dip well below the ground there, so the two never flicker.
    heights[j * (n + 1) + i] = seaside.y(x, z) - (inside[j * (n + 1) + i] ? 0.03 : 0.6);
  }
  const sand: number[] = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = [j * (n + 1) + i, j * (n + 1) + i + 1, (j + 1) * (n + 1) + i, (j + 1) * (n + 1) + i + 1];
    if (!k.some((v) => inside[v])) continue;
    const at = (v: number, di: number, dj: number) => sand.push(x0 + (i + di) * cell, heights[v], z0 + (j + dj) * cell);
    at(k[0], 0, 0); at(k[2], 0, 1); at(k[1], 1, 0); at(k[1], 1, 0); at(k[2], 0, 1); at(k[3], 1, 1);
  }
  const mesh = (positions: number[], color: string, shadow = true) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    const m = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.95, side: THREE.DoubleSide }));
    m.receiveShadow = shadow; m.userData.referenceSurface = true; scene.add(m);
  };
  mesh(sand, SAND);

  // Walk a line in short steps so ribbons and banks follow the heights.
  const steps = (line: Vec2[]): Vec2[] => line.flatMap((a, i) => {
    if (i === line.length - 1) return [a];
    const b = line[i + 1], count = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2));
    return Array.from({ length: count }, (_, k): Vec2 => [a[0] + (b[0] - a[0]) * k / count, a[1] + (b[1] - a[1]) * k / count]);
  });
  const near = ([x, z]: Vec2) => Math.abs(x - centre.x) < span + 4 && Math.abs(z - centre.z) < span + 4;

  // The paseo: a ribbon lying on the ground it crosses.
  const ribbon: number[] = [], line = steps(sf.paseo.points), half = sf.paseo.width / 2;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i], b = line[i + 1];
    if (!near(a) && !near(b)) continue;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = (b[1] - a[1]) / length * half, nz = -(b[0] - a[0]) / length * half;
    const ay = seaside.y(a[0], a[1]) + 0.04, by = seaside.y(b[0], b[1]) + 0.04;
    ribbon.push(a[0] + nx, ay, a[1] + nz, a[0] - nx, ay, a[1] - nz, b[0] + nx, by, b[1] + nz, b[0] + nx, by, b[1] + nz, a[0] - nx, ay, a[1] - nz, b[0] - nx, by, b[1] - nz);
  }
  // Faded pink-red stamped concrete (IMG_2350).
  mesh(ribbon, paseoWall.surface.color);

  // Where the land behind the paseo stands higher, a bank holds it back.
  const bank: number[] = [], rim = steps(seaside.edge);
  for (let i = 0; i < rim.length - 1; i++) {
    const a = rim[i], b = rim[i + 1];
    if (!near(a) && !near(b)) continue;
    // The retaining wall stands here instead (src/paseo-wall.ts).
    if (seaside.walled((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)) continue;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ix = (b[1] - a[1]) / length * 0.4, iz = -(b[0] - a[0]) / length * 0.4;
    const top = Math.max(inlandY(a[0] + ix, a[1] + iz), inlandY(b[0] + ix, b[1] + iz));
    const ay = seaside.y(a[0], a[1]) - 0.03, by = seaside.y(b[0], b[1]) - 0.03;
    if (top - Math.min(ay, by) < 0.08) continue;
    bank.push(a[0], ay, a[1], b[0], by, b[1], a[0], top, a[1], a[0], top, a[1], b[0], by, b[1], b[0], top, b[1]);
  }
  mesh(bank, "#efe6d2");
}
