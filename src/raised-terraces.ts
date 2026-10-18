import * as THREE from "three";
import data from "../data/raised_terraces.json";
import { closestOnSegment, pointInRing } from "./geom";
import { plasterMaterial, surfaceTexture } from "./materials";
import { addSprites, type SpriteKind, type SpritePlacement } from "./sprites";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/**
 * Raised terraces and patios (data/raised_terraces.json, docs/RAISED_TERRACES.md):
 * an outline at a floor height above the ground, retaining faces with coping,
 * and openings each with a stair. The player's ground follows the floor inside a
 * walkable terrace and the stairs one riser at a time; faces are solid except at
 * the openings. Houses keep their own level: the terrace is the ground in front of them.
 */

export type EdgeKind = "face" | "house" | "end";
export type TerraceStair = { risers: number; tread: number; direction: "in" | "out"; riserFinish?: string; treadFinish?: string; handrail?: "left" | "right" | "both" | "none"; cheeks?: boolean };
export type TerraceOpening = { id: string; edge: number; at: number; width: number; stair?: TerraceStair };
export type TerraceFace = { finish: "render" | "sandstone"; thickness: number; height?: number; coping: { height: number; overhang: number } };
export type RaisedTerrace = {
  id: string; name: string; area: string; survey?: string; walkable: boolean;
  base: Vec2; rise: number; floor: string; face: TerraceFace;
  outline: Vec2[]; edges: { kind: EdgeKind; finish?: "render" | "sandstone"; note?: string; building?: string }[];
  openings: TerraceOpening[]; walks?: Vec2[][]; planting?: { edges: number[]; inset: number; kind: string };
  evidence: string[]; trust: string;
};

export const raisedTerraces = data.terraces as unknown as RaisedTerrace[];
/** The same small lift the reference ground gives everywhere off the roads (boundaries.ts). */
const GROUND = 0.06;
const PLAYER = 0.42;

const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]];
const along = (a: Vec2, u: Vec2, d: number, n: Vec2 = [0, 0], e = 0): Vec2 => [a[0] + u[0] * d + n[0] * e, a[1] + u[1] * d + n[1] * e];
const area2 = (ring: Vec2[]) => ring.reduce((s, p, i) => { const q = ring[(i + 1) % ring.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);

/** Edge i of a terrace: its ends, unit direction, length and the normal pointing into the terrace. */
export function terraceEdge(t: RaisedTerrace, i: number): { a: Vec2; b: Vec2; u: Vec2; n: Vec2; length: number } {
  const a = t.outline[i], b = t.outline[(i + 1) % t.outline.length], [dx, dz] = sub(b, a), length = Math.hypot(dx, dz);
  const u: Vec2 = [dx / length, dz / length], sign = area2(t.outline) > 0 ? 1 : -1;
  return { a, b, u, n: [-u[1] * sign, u[0] * sign], length };
}

/** Height of the terrace floor, absolute (siteY at the base point plus the rise). */
export const terraceFloorY = (t: RaisedTerrace): number => siteY(...t.base) + t.rise;

/** A stair in its own frame: `foot` is the middle of the bottom riser, `up` climbs, `right` is the climber's right hand. */
export function stairFrame(t: RaisedTerrace, o: TerraceOpening) {
  const s = o.stair!, e = terraceEdge(t, o.edge), run = (s.risers - 1) * s.tread;
  const start = along(e.a, e.u, o.at), end = along(e.a, e.u, o.at + o.width);
  const out = s.direction === "out" ? -run : 0;
  const foot = along([(start[0] + end[0]) / 2, (start[1] + end[1]) / 2], e.n, out);
  // The climber's right hand, facing up the flight (+x east, +z south).
  const right: Vec2 = [-e.n[1], e.n[0]];
  return { stair: s, foot, up: e.n, right, width: o.width, run, riser: t.rise / s.risers, base: siteY(...t.base) };
}
type Frame = ReturnType<typeof stairFrame>;

/** Distance up the flight from the bottom riser and across from its centre line. */
const onStair = (f: Frame, x: number, z: number) => {
  const d = sub([x, z], f.foot);
  return { s: d[0] * f.up[0] + d[1] * f.up[1], c: d[0] * f.right[0] + d[1] * f.right[1] };
};
const rect = (f: Frame, s0: number, s1: number, c0: number, c1: number): Vec2[] =>
  [[s0, c0], [s1, c0], [s1, c1], [s0, c1]].map(([s, c]) => along(f.foot, f.up, s, f.right, c));

/** The plan of each stair: from the bottom riser to the top one. */
export const stairRing = (f: Frame): Vec2[] => rect(f, 0, f.run, -f.width / 2, f.width / 2);
/** The low sides beside a cut-back flight, so the treads are not open to the floor above them. */
const cheekRings = (t: RaisedTerrace, f: Frame): Vec2[][] =>
  (f.stair.cheeks ?? f.stair.direction === "in") ? [rect(f, 0, f.run, -f.width / 2 - t.face.thickness, -f.width / 2), rect(f, 0, f.run, f.width / 2, f.width / 2 + t.face.thickness)] : [];

const stairCache = new Map<RaisedTerrace, (Frame & { opening: TerraceOpening })[]>();
/** Every stair of a terrace, in its own frame. */
export function terraceStairs(t: RaisedTerrace): (Frame & { opening: TerraceOpening })[] {
  let stairs = stairCache.get(t);
  if (!stairs) { stairs = t.openings.filter((o) => o.stair).map((o) => ({ ...stairFrame(t, o), opening: o })); stairCache.set(t, stairs); }
  return stairs;
}
/** Plan bounds of each terrace with its stairs, for a quick miss. */
const bounds = raisedTerraces.map((t) => {
  const pts = [...t.outline, ...t.openings.filter((o) => o.stair).flatMap((o) => stairRing(stairFrame(t, o)))];
  return { minX: Math.min(...pts.map((p) => p[0])), maxX: Math.max(...pts.map((p) => p[0])), minZ: Math.min(...pts.map((p) => p[1])), maxZ: Math.max(...pts.map((p) => p[1])) };
});
const missed = (i: number, x: number, z: number, margin = 0) => x < bounds[i].minX - margin || x > bounds[i].maxX + margin || z < bounds[i].minZ - margin || z > bounds[i].maxZ + margin;

/** The floor's plan: the outline with each cut-back flight taken out of it. */
export function floorRing(t: RaisedTerrace): Vec2[] {
  const ring: Vec2[] = [];
  t.outline.forEach((p, i) => {
    ring.push(p);
    for (const o of t.openings.filter((o) => o.edge === i && o.stair?.direction === "in").sort((a, b) => a.at - b.at)) {
      const e = terraceEdge(t, i), run = (o.stair!.risers - 1) * o.stair!.tread;
      const s = along(e.a, e.u, o.at), q = along(e.a, e.u, o.at + o.width);
      ring.push(...[s, along(s, e.n, run), along(q, e.n, run), q].filter((v) => Math.hypot(v[0] - ring[ring.length - 1][0], v[1] - ring[ring.length - 1][1]) > 1e-6));
    }
  });
  return ring;
}

/** Solid stretches of an edge: the whole edge, less its openings. */
function solidParts(t: RaisedTerrace, i: number): [number, number][] {
  const e = terraceEdge(t, i), cuts = t.openings.filter((o) => o.edge === i).map((o) => [o.at, o.at + o.width]).sort((a, b) => a[0] - b[0]);
  const parts: [number, number][] = [];
  let from = 0;
  for (const [a, b] of cuts) { if (a - from > 0.02) parts.push([from, a]); from = Math.max(from, b); }
  if (e.length - from > 0.02) parts.push([from, e.length]);
  return parts;
}

/** A wall strip on the inside of an edge, from d0 to d1 along it. */
function edgeStrip(t: RaisedTerrace, i: number, d0: number, d1: number, thickness = t.face.thickness): Vec2[] {
  const e = terraceEdge(t, i);
  return [along(e.a, e.u, d0), along(e.a, e.u, d1), along(e.a, e.u, d1, e.n, thickness), along(e.a, e.u, d0, e.n, thickness)];
}

/** Inside a terrace's outline or on one of its stairs (for keeping generated details off it). */
export function inRaisedTerrace(x: number, z: number, margin = 0): boolean {
  return raisedTerraces.some((t, i) => !missed(i, x, z, margin) && (pointInRing(x, z, t.outline) || terraceStairs(t).some((f) => pointInRing(x, z, stairRing(f)))
    || (margin > 0 && t.outline.some((a, i) => closestOnSegment(x, z, ...a, ...t.outline[(i + 1) % t.outline.length]).d < margin))));
}

/** Generated garden walls, gates and props give way to a traced terrace (as suppressInEvaLawn). */
export function suppressInRaisedTerraces<T extends { gardenWalls: Vec2[]; gardenGates: Vec2[]; props: { x: number; z: number }[] }>(skeleton: T): void {
  skeleton.gardenWalls = skeleton.gardenWalls.filter(([x, z]) => !inRaisedTerrace(x, z, 1.5));
  skeleton.gardenGates = skeleton.gardenGates.filter(([x, z]) => !inRaisedTerrace(x, z, 1.5));
  skeleton.props = skeleton.props.filter((p) => !inRaisedTerrace(p.x, p.z, 0.5));
}

/** Extra ground height over siteY: the terrace floor, or the tread underfoot on a stair. */
export function raisedTerraceGroundOffset(x: number, z: number): number {
  for (const [i, t] of raisedTerraces.entries()) {
    if (!t.walkable || missed(i, x, z)) continue;
    for (const f of terraceStairs(t)) {
      const { s, c } = onStair(f, x, z);
      if (s < 0 || s >= f.run || Math.abs(c) > f.width / 2) continue;
      const passed = Math.min(f.stair.risers - 1, Math.floor(s / f.stair.tread + 1e-9) + 1);
      return Math.max(0, f.base + passed * f.riser - siteY(x, z));
    }
    if (pointInRing(x, z, t.outline)) return Math.max(0, terraceFloorY(t) - siteY(x, z));
  }
  return 0;
}

/** Collision: faces and untraced ends less their openings, and the cheeks beside cut-back flights. House edges are the houses' own rings. */
export function raisedTerraceRings(): Vec2[][] {
  return raisedTerraces.flatMap((t) => [
    ...t.edges.flatMap((edge, i) => edge.kind === "house" ? [] : solidParts(t, i).map(([a, b]) => edgeStrip(t, i, a, b))),
    ...terraceStairs(t).flatMap((f) => cheekRings(t, f)),
  ]);
}

/** Red and blue patterned riser tiles (IMG_2204, IMG_2206). */
function riserTiles(): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = 64; c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "#a8372b"; g.fillRect(0, 0, 64, 64);
  g.fillStyle = "#264b8a"; g.beginPath(); g.moveTo(32, 6); g.lineTo(58, 32); g.lineTo(32, 58); g.lineTo(6, 32); g.closePath(); g.fill();
  g.fillStyle = "#efe6d2"; g.beginPath(); g.arc(32, 32, 7, 0, Math.PI * 2); g.fill();
  for (const [x, y] of [[0, 0], [64, 0], [0, 64], [64, 64]]) { g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = "rgba(240,230,210,.6)"; g.lineWidth = 2; g.strokeRect(1, 1, 62, 62);
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function addRaisedTerraces(scene: THREE.Scene): void {
  const white = plasterMaterial("#fffdf5"), coping = plasterMaterial("#fbf6ea"), sandstone = plasterMaterial("#d7b98d");
  const paving = new THREE.MeshStandardMaterial({ color: "#d9ccb2", map: surfaceTexture("plaster"), roughness: 1 });
  const soil = new THREE.MeshStandardMaterial({ color: "#827357", roughness: 1 });
  const terracotta = new THREE.MeshStandardMaterial({ color: "#c27a5a", map: surfaceTexture("paving"), roughness: 1 });
  const iron = new THREE.MeshStandardMaterial({ color: "#23282a", roughness: 0.6, metalness: 0.3 });
  const add = (mesh: THREE.Mesh, name: string) => { mesh.name = name; mesh.userData.noDrape = true; mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh); return mesh; };
  /** A box lying along a plan direction, from y0 to y1. */
  const box = (centre: Vec2, dir: Vec2, length: number, depth: number, y0: number, y1: number, material: THREE.Material | THREE.Material[], name: string) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, y1 - y0, depth), material);
    mesh.position.set(centre[0], (y0 + y1) / 2, centre[1]); mesh.rotation.y = -Math.atan2(dir[1], dir[0]);
    return add(mesh, name);
  };
  for (const t of raisedTerraces) {
    const floor = terraceFloorY(t) + GROUND, th = t.face.thickness, cap = t.face.coping;
    // A patio floor can sit below its enclosing wall; a bed can use the same face at soil height.
    const wallTop = siteY(...t.base) + GROUND + (t.face.height ?? t.rise);
    // The floor, cut back where a stair climbs into it.
    const shape = new THREE.Shape(floorRing(t).map(([x, z]) => new THREE.Vector2(x, -z)));
    const top = add(new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), t.floor === "soil" ? soil : paving), t.id + "-floor");
    top.position.y = floor; top.userData.referenceSurface = true; top.castShadow = false;
    // Retaining faces with a coping; untraced ends as plain faces.
    t.edges.forEach((edge, i) => {
      if (edge.kind === "house") return;
      const e = terraceEdge(t, i), material = (edge.finish ?? t.face.finish) === "sandstone" ? sandstone : white;
      const joined = (j: number) => t.edges[(j + t.edges.length) % t.edges.length].kind !== "house";
      for (const [d0, d1] of solidParts(t, i)) {
        // Overlap the next face a little so a curve drawn in straight pieces has no gaps.
        const a = d0 - (d0 < 0.02 && joined(i - 1) ? th / 2 : 0), b = d1 + (d1 > e.length - 0.02 && joined(i + 1) ? th / 2 : 0);
        const mid = along(e.a, e.u, (a + b) / 2, e.n, th / 2), outside = [along(e.a, e.u, d0, e.n, -0.3), along(e.a, e.u, d1, e.n, -0.3)];
        const bottom = Math.min(...outside.map((p) => siteY(...p))) + GROUND - 0.08;
        if (edge.kind === "face") {
          box(mid, e.u, b - a, th, bottom, wallTop, material, t.id + "-face");
          box(along(e.a, e.u, (a + b) / 2, e.n, th / 2 - cap.overhang / 2), e.u, b - a + 0.02, th + cap.overhang, wallTop, wallTop + cap.height, coping, t.id + "-coping");
        } else box(mid, e.u, b - a, th, bottom, floor - 0.005, material, t.id + "-end");
      }
    });
    for (const f of terraceStairs(t)) {
      const s = f.stair, name = f.opening.id, tiles = riserTiles();
      tiles.repeat.set(Math.max(1, Math.round(f.width / f.riser)), 1);
      const riser = new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.55 });
      const tread = s.treadFinish === "terracotta" ? terracotta : paving;
      // One slab per riser, from that riser to the top of the flight, stacked on the one below.
      for (let i = 0; i < s.risers; i++) {
        // The top riser is a thin slab just under the floor's edge.
        const last = i === s.risers - 1, s0 = i * s.tread, s1 = Math.max(f.run, s0) + (last ? 0.04 : 0), mid = along(f.foot, f.up, (s0 + s1) / 2), h = f.riser - (last ? 0.003 : 0);
        const slab = new THREE.Mesh(new THREE.BoxGeometry(f.width, h, s1 - s0), [white, white, tread, white, white, riser]);
        slab.position.set(mid[0], f.base + GROUND + f.riser * i + h / 2, mid[1]); slab.rotation.y = Math.atan2(f.up[0], f.up[1]);
        add(slab, name + "-tread-" + (i + 1));
      }
      // The cheeks beside a cut-back flight rise to the floor with the coping, like the faces either side.
      for (const ring of cheekRings(t, f)) {
        const c: Vec2 = [(ring[0][0] + ring[2][0]) / 2, (ring[0][1] + ring[2][1]) / 2];
        box(c, f.up, f.run, th, f.base + GROUND - 0.05, floor, white, name + "-cheek");
        box(c, f.up, f.run + 0.02, th + cap.overhang, floor, floor + cap.height, coping, name + "-cheek");
      }
      // Iron handrail on posts along the open edge of the treads.
      const sides = s.handrail === "both" ? [1, -1] : s.handrail === "left" ? [-1] : s.handrail === "right" ? [1] : [];
      for (const side of sides) {
        const across = side * (f.width / 2 - 0.08), stations = [0.12, f.run / 2, f.run + 0.35];
        const y = (d: number) => f.base + GROUND + Math.min(s.risers, Math.floor(d / s.tread) + 1) * f.riser;
        for (const d of stations) {
          const p = along(f.foot, f.up, d, f.right, across), post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.9, 0.04), iron);
          post.position.set(p[0], y(d) + 0.45, p[1]); add(post, name + "-handrail");
        }
        const a = along(f.foot, f.up, stations[0], f.right, across), b = along(f.foot, f.up, stations[2], f.right, across);
        const from = new THREE.Vector3(a[0], y(stations[0]) + 0.9, a[1]), to = new THREE.Vector3(b[0], y(stations[2]) + 0.9, b[1]);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(from.distanceTo(to), 0.045, 0.045), iron);
        rail.position.copy(from).add(to).multiplyScalar(0.5); rail.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), to.clone().sub(from).normalize());
        add(rail, name + "-handrail");
      }
    }
    // The planted bank behind the retaining wall: clipped shrubs on the floor (Details only).
    if (t.planting) {
      const places: SpritePlacement[] = [], stairs = terraceStairs(t);
      for (const i of t.planting.edges) {
        const e = terraceEdge(t, i);
        for (let d = 0.6; d < e.length - 0.3; d += 1.1) {
          const p = along(e.a, e.u, d, e.n, t.planting.inset);
          if (stairs.some((f) => { const q = onStair(f, ...p); return q.s > -0.5 && q.s < f.run + 1.2 && Math.abs(q.c) < f.width / 2 + 1.0; })) continue;
          if (pointInRing(...p, t.outline)) places.push({ x: p[0], y: floor, z: p[1], scale: 0.55 });
        }
      }
      const before = scene.children.length;
      addSprites(scene, t.planting.kind as SpriteKind, places);
      for (const child of scene.children.slice(before)) child.userData.noDrape = true;
    }
  }
}

/** What the blueprint draws: floors, faces, untraced ends, treads and handrails. */
export function raisedTerraceBlueprint(): { id: string; points: Vec2[]; closed: boolean; fill?: string; stroke?: string; width?: number; dash?: string; title: string }[] {
  return raisedTerraces.flatMap((t) => {
    const out: ReturnType<typeof raisedTerraceBlueprint> = [];
    const text = `${t.name}: ${t.rise} m above the path · ${t.trust} · ${t.evidence.join(", ")}`;
    out.push({ id: t.id, points: floorRing(t), closed: true, fill: t.floor === "soil" ? "#827357" : "#e4d6bc", stroke: "none", title: text });
    t.edges.forEach((edge, i) => {
      if (edge.kind === "house") return;
      const e = terraceEdge(t, i);
      for (const [a, b] of solidParts(t, i)) {
        const line = [along(e.a, e.u, a, e.n, t.face.thickness / 2), along(e.a, e.u, b, e.n, t.face.thickness / 2)];
        out.push(edge.kind === "face"
          ? { id: t.id + "-face", points: line, closed: false, stroke: edge.finish === "sandstone" || t.face.finish === "sandstone" ? "#d7b98d" : "#fffdf5", width: t.face.thickness, title: `${t.name}: retaining face with coping${edge.note ? " · " + edge.note : ""}` }
          : { id: t.id + "-end", points: line, closed: false, stroke: "#8a8172", width: 0.08, dash: ".3 .2", title: `${t.name}: untraced end${edge.note ? " · " + edge.note : ""}` });
      }
    });
    for (const f of terraceStairs(t)) {
      const title = `${f.opening.id}: ${f.stair.risers} risers of ${f.riser.toFixed(2)} m, ${f.stair.tread} m treads, ${f.stair.direction === "in" ? "cut back into" : "in front of"} the terrace`;
      out.push({ id: f.opening.id, points: stairRing(f), closed: true, fill: "#b4513e", stroke: "none", title });
      for (let i = 0; i < f.stair.risers; i++) out.push({ id: f.opening.id + "-riser", points: [along(f.foot, f.up, i * f.stair.tread, f.right, -f.width / 2), along(f.foot, f.up, i * f.stair.tread, f.right, f.width / 2)], closed: false, stroke: "#2d4f8c", width: 0.05, title });
      for (const ring of cheekRings(t, f)) out.push({ id: f.opening.id + "-cheek", points: ring, closed: true, fill: "#fffdf5", stroke: "none", title });
      const side = f.stair.handrail === "left" ? -1 : 1;
      if (f.stair.handrail && f.stair.handrail !== "none") out.push({ id: f.opening.id + "-handrail", points: [along(f.foot, f.up, 0.12, f.right, side * (f.width / 2 - 0.08)), along(f.foot, f.up, f.run + 0.35, f.right, side * (f.width / 2 - 0.08))], closed: false, stroke: "#23282a", width: 0.05, title: "Iron handrail" });
    }
    return out;
  });
}

/** Clearance a walker needs through each opening (used by the checks and the browser test). */
export const OPENING_CLEARANCE = 2 * PLAYER + 0.3;
