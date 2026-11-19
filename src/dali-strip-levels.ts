import * as THREE from "three";
import levels from "../data/dali_strip_levels.json";
import threshold from "../data/dali_cervantes_threshold.json";
import { closestOnSegment, pointInRing } from "./geom";
import { plasterMaterial, surfaceTexture } from "./materials";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/**
 * The Pintor Dalí house-side strip at its photographed and surveyed levels (data/dali_strip_levels.json).
 *
 * North of the Cervantes apron the lawn is a raised bed behind a white kerb wall, about 0.35 m above the
 * tiled path (IMG_3089, IMG_3086). South of the apron a low kerb edges the path and the lawn rises behind
 * it to the parking (IMG_3082-3084).
 *
 * The lawn's parking edge stays at the visible Dalí parking surface. The path sits `drop` below it,
 * where `drop` comes from the 2020-21 laser survey. The traced rings (data/dali_cervantes_threshold.json)
 * keep their outlines; only their heights change, so src/dali-threshold.ts no longer lays them flat.
 */
const DALI_SURFACE = 0.272;
type Zone = { id: string; kind: string; ring: Vec2[] };
const traced = threshold.zones.map((z) => ({ id: z.id, kind: z.kind, ring: z.ring as Vec2[] }));
const zones: Zone[] = [...traced, ...levels.extension.map((z) => ({ id: z.id, kind: z.kind, ring: z.ring as Vec2[] }))];
const zone = (id: string): Zone => zones.find((z) => z.id === id)!;
type Bed = { zones: string[]; paths: string[]; form: string; kerbAbove?: number; kerbHeight?: number; kerbWidth: number; lawnAtKerb?: number };
const beds = levels.beds as Bed[];

/** Zones drawn here instead of as flat sheets. */
export const DALI_STRIP_ZONES = new Set(beds.flatMap((b) => [...b.zones, ...b.paths]));

const [ox, oz] = levels.station.origin as Vec2, [fx, fz] = levels.station.along as Vec2;
const station = (x: number, z: number) => (x - ox) * fx + (z - oz) * fz;
function drop(x: number, z: number): number {
  const a = station(x, z), table = levels.drop as Vec2[];
  if (a <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) if (a <= table[i][0]) {
    const [a0, d0] = table[i - 1], [a1, d1] = table[i];
    return d0 + (d1 - d0) * (a - a0) / (a1 - a0);
  }
  return table[table.length - 1][1];
}
const edges = levels.parkingEdges.map((e) => ({ id: e.id, a: e.from as Vec2, b: e.to as Vec2 }));
/** The nearest point on the lawn's parking edge, and how far in from it. */
function parkingEdge(x: number, z: number, which?: string) {
  let best = { x, z, d: Infinity };
  for (const e of edges) if (!which || e.id === which) {
    const hit = closestOnSegment(x, z, ...e.a, ...e.b);
    if (hit.d < best.d) best = hit;
  }
  return best;
}
/** The visible surface the flat sheets used to lie on here: the terrain plus the Dalí surface datum. Every
 * level below is built from this at the point itself, so it stays on the same side of the terrain's
 * lowered-area edge as the ground around it. */
const base = (x: number, z: number) => siteY(x, z) + DALI_SURFACE;
const edgeOf = (b: Bed) => (b.form === "raised" ? "north" : "south");

function gap(x: number, z: number, ring: Vec2[]): number {
  if (pointInRing(x, z, ring)) return 0;
  return Math.min(...ring.map((a, i) => closestOnSegment(x, z, ...a, ...ring[(i + 1) % ring.length]).d));
}
/** The nearest point of the bed's path, and how far away it is. */
function nearestPath(bed: Bed, x: number, z: number): { x: number; z: number; d: number } {
  let best = { x, z, d: Infinity };
  for (const id of bed.paths) {
    const ring = zone(id).ring;
    if (pointInRing(x, z, ring)) return { x, z, d: 0 };
    ring.forEach((a, i) => { const hit = closestOnSegment(x, z, ...a, ...ring[(i + 1) % ring.length]); if (hit.d < best.d) best = hit; });
  }
  return best;
}
/** The path's level: the old visible surface, which the laser survey already puts below the lawn and parking. */
const pathLevel = (x: number, z: number) => base(x, z);
/** Lawn surface: `drop` above the path beside it, flat in the raised bed. In the sloped strip it runs from
 * just above the kerb up to `drop` at the parking edge. It is never below the old surface. */
function lawnSurface(bed: Bed, x: number, z: number): number {
  const p = nearestPath(bed, x, z), ref = pathLevel(p.x, p.z), d = drop(x, z);
  if (bed.form === "raised") return Math.max(base(x, z), ref + d);
  const toParking = parkingEdge(x, z, edgeOf(bed)).d, w = toParking + p.d > 0 ? p.d / (toParking + p.d) : 1;
  const kerbSide = ref + (bed.lawnAtKerb ?? 0.12);
  return Math.max(base(x, z), kerbSide, kerbSide + (ref + d - kerbSide) * w);
}

/** Visible surface height over the strip, or undefined off it. */
export function daliStripSurface(x: number, z: number): number | undefined {
  for (const bed of beds) {
    for (const id of bed.zones) if (pointInRing(x, z, zone(id).ring)) return lawnSurface(bed, x, z);
    for (const id of bed.paths) if (pointInRing(x, z, zone(id).ring)) return pathLevel(x, z);
  }
  return undefined;
}
/** Inside the photographed strip (its lawn or path), where generated sidewalk filler must not be drawn. */
export const inDaliStrip = (x: number, z: number): boolean => beds.some((b) => [...b.zones, ...b.paths].some((id) => pointInRing(x, z, zone(id).ring)));
/** How far a plant standing here must rise above the terrain to stand on the strip's visible surface. */
export const daliStripPropLift = (x: number, z: number): number => { const y = daliStripSurface(x, z); return y === undefined ? 0 : y - siteY(x, z); };

// ---- Meshes, built at absolute heights (not draped).
function sheet(ring: Vec2[], height: (x: number, z: number) => number, material: THREE.Material, name: string): THREE.Mesh {
  // Densify the outline so the surface follows the levels between the traced vertices.
  const dense: Vec2[] = [];
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.6));
    for (let k = 0; k < n; k++) dense.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  });
  const geometry = new THREE.ShapeGeometry(new THREE.Shape(dense.map(([x, z]) => new THREE.Vector2(x, -z)))).rotateX(-Math.PI / 2);
  const p = geometry.getAttribute("position"), uv = geometry.getAttribute("uv");
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, height(x, z)); uv.setXY(i, x, z); }
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name; mesh.receiveShadow = true; mesh.userData.noDrape = true; mesh.userData.referenceSurface = name;
  return mesh;
}
/** The stretches of a lawn ring's outline that run along another ring (within `near` metres). */
function sharedEdges(ring: Vec2[], other: Vec2[], near: number): [Vec2, Vec2][] {
  const out: [Vec2, Vec2][] = [];
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.05) return;
    if (gap(...a, other) <= near && gap(...b, other) <= near && gap((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, other) <= near) out.push([a, b]);
  });
  return out;
}
/** A white rendered kerb wall along a line: path-side face from `base` up to `top`, a flat top `width` deep towards `inward`. */
function wall(out: number[], a: Vec2, b: Vec2, base: (p: Vec2) => number, top: (p: Vec2) => number, width: number, inward: Vec2): void {
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.5));
  const at = (t: number): Vec2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const back = (p: Vec2): Vec2 => [p[0] + inward[0] * width, p[1] + inward[1] * width];
  const quad = (p: number[], q: number[], r: number[], s: number[]) => out.push(...p, ...q, ...r, ...p, ...r, ...s);
  for (let k = 0; k < n; k++) {
    const p0 = at(k / n), p1 = at((k + 1) / n), q0 = back(p0), q1 = back(p1), r = 0.03; // a 3 cm round-over on the front edge
    quad([p0[0], base(p0) - 0.02, p0[1]], [p0[0], top(p0) - r, p0[1]], [p1[0], top(p1) - r, p1[1]], [p1[0], base(p1) - 0.02, p1[1]]);
    const m0: Vec2 = [p0[0] + inward[0] * r, p0[1] + inward[1] * r], m1: Vec2 = [p1[0] + inward[0] * r, p1[1] + inward[1] * r];
    quad([p0[0], top(p0) - r, p0[1]], [m0[0], top(p0), m0[1]], [m1[0], top(p1), m1[1]], [p1[0], top(p1) - r, p1[1]]);
    quad([m0[0], top(p0), m0[1]], [q0[0], top(p0), q0[1]], [q1[0], top(p1), q1[1]], [m1[0], top(p1), m1[1]]);
  }
}
function solid(positions: number[], material: THREE.Material, name: string): THREE.Mesh {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const uv: number[] = [];
  for (let i = 0; i < positions.length; i += 3) uv.push(positions[i], positions[i + 1] + positions[i + 2]);
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.name = name; m.castShadow = m.receiveShadow = true; m.userData.noDrape = true;
  return m;
}
/** Unit vector from a segment's middle into a ring (towards the lawn). */
function inwardOf(a: Vec2, b: Vec2, ring: Vec2[]): Vec2 {
  const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), n: Vec2 = [-dz / l, dx / l], mid: Vec2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  return pointInRing(mid[0] + n[0] * 0.2, mid[1] + n[1] * 0.2, ring) ? n : [-n[0], -n[1]];
}

export function addDaliStripLevels(scene: THREE.Scene): void {
  const group = new THREE.Group();
  group.name = levels.id; group.userData.noDrape = true;
  const tiles = new THREE.MeshStandardMaterial({ color: "#ffffff", map: surfaceTexture("paving"), roughness: 1, side: THREE.DoubleSide });
  const turf = new THREE.MeshStandardMaterial({ color: "#718658", map: surfaceTexture("turf"), roughness: 1, side: THREE.DoubleSide });
  const white = plasterMaterial("#fffdf3");
  white.side = THREE.DoubleSide;
  const crossing = threshold.crossingRing as Vec2[];
  for (const bed of beds) {
    const which = edgeOf(bed), kerb: number[] = [];
    for (const id of bed.paths) group.add(sheet(zone(id).ring, (x, z) => pathLevel(x, z), tiles, id));
    for (const id of bed.zones) {
      const ring = zone(id).ring;
      group.add(sheet(ring, (x, z) => lawnSurface(bed, x, z), turf, id));
      // The kerb along the path: a wall up to just above the bed, or a low kerb in front of the sloped lawn.
      const top = (p: Vec2) => bed.form === "raised" ? pathLevel(...p) + drop(...p) + (bed.kerbAbove ?? 0.03) : pathLevel(...p) + (bed.kerbHeight ?? 0.14);
      for (const pathId of bed.paths) for (const [a, b] of sharedEdges(ring, zone(pathId).ring, 0.2))
        wall(kerb, a, b, (p) => pathLevel(...p), top, bed.kerbWidth, inwardOf(a, b, ring));
      // The raised bed's end wall facing the apron, down to the crossing tiles.
      if (bed.form === "raised") for (const [a, b] of sharedEdges(ring, crossing, 0.35))
        wall(kerb, a, b, (p) => base(...p), (p) => lawnSurface(bed, ...p) + (bed.kerbAbove ?? 0.03), bed.kerbWidth, inwardOf(a, b, ring));
    }
    group.add(solid(kerb, white, `${levels.id}-${which}-kerb`));
  }
  // The rounded pier with the mailbox at the bed's corner by the apron (IMG_3086, IMG_3087).
  const pier = levels.pier, [px, pz] = pier.at as Vec2, foot = base(px, pz);
  const body = new THREE.Mesh(new THREE.BoxGeometry(pier.size[0], pier.height - pier.size[0] / 2, pier.size[1]), white);
  body.position.set(px, foot + (pier.height - pier.size[0] / 2) / 2, pz);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(pier.size[0] / 2, pier.size[0] / 2, pier.size[1], 16, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), white);
  cap.position.set(px, foot + pier.height - pier.size[0] / 2, pz);
  const box = new THREE.Mesh(new THREE.BoxGeometry(...(pier.mailbox.size as [number, number, number])), new THREE.MeshStandardMaterial({ color: "#f4f2ec", roughness: 0.5 }));
  box.position.set(px, foot + 0.85, pz + pier.size[1] / 2 + pier.mailbox.size[2] / 2);
  for (const m of [body, cap, box]) { m.castShadow = m.receiveShadow = true; group.add(m); }
  scene.add(group);
}
