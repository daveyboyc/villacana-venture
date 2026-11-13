import * as THREE from "three";
import layout from "../data/main_pool.json";
import data from "../data/main_pool_lawn.json";
import { clippedHedge, looseShrub } from "./clipped-plants";
import { centroid, closestOnSegment, pointInRing } from "./geom";
import { plasterMaterial, surfaceTexture } from "./materials";
import { accessSection, LOWER_POOL_Y, poolGroundY, poolLevelPoint } from "./pool-levels";
import { addKitModel } from "./pool-kit";
import { addSprites } from "./sprites";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Vec2 } from "./types";

/** Pink paths, flagstones, lawn walls and the step finish (data/main_pool_lawn.json).
 * The glass fence the November photos show stays out: Dave, 2026-10-11, and again 2026-11-12.
 * World metres, the same frame as the camera pins. The lawn follows the laser-survey ground (about
 * -2.2 to -2.8 m, not the old flat -3 m deck), so every piece stands on `ground`, the game's live
 * ground height, and the group is not draped again. */

const Y = LOWER_POOL_Y;

/**
 * South faces of the houses behind the main-pool lawn, the row seen from Barraka's
 * awning (IMG_2609, IMG_2607). Those fronts are plain white. The generated tiled
 * porch roofs were reading as a brown awning on every bay.
 */
export function inLawnPlainFront(x: number, z: number, nz: number): boolean {
  return nz > 0.35 && x > -48 && x < 58 && z > 30 && z < 100;
}
const flight = {
  points: layout.levels.enriqueSteps.points.map(poolLevelPoint),
  width: layout.levels.enriqueSteps.width,
};
const stepCount = layout.levels.enriqueSteps.count;

function resample(ring: Vec2[], step: number): Vec2[] {
  const out: Vec2[] = [];
  let carry = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!len) continue;
    if (!out.length) out.push(a);
    let d = step - carry;
    while (d <= len) {
      const t = d / len;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      d += step;
    }
    carry = len - (d - step);
  }
  return out;
}

function pushOut(ring: Vec2[], dist: number): Vec2[] {
  const c = centroid(ring);
  return ring.map((p) => {
    const dx = p[0] - c.x, dz = p[1] - c.z, n = Math.hypot(dx, dz) || 1;
    return [p[0] + (dx / n) * dist, p[1] + (dz / n) * dist] as Vec2;
  });
}

function nearRing(p: Vec2, ring: Vec2[], dist: number): boolean {
  if (pointInRing(p[0], p[1], ring)) return true;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    if (closestOnSegment(p[0], p[1], a[0], a[1], b[0], b[1]).d < dist) return true;
  }
  return false;
}

function stripRing(a: Vec2, b: Vec2, half: number): Vec2[] {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = ((b[1] - a[1]) / len) * half, nz = (-(b[0] - a[0]) / len) * half;
  return [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]];
}

function ribbonRing(points: Vec2[], half: number): Vec2[] {
  const left: Vec2[] = [], right: Vec2[] = [];
  points.forEach((p, i) => {
    const before = i > 0 ? points[i - 1] : p, after = i < points.length - 1 ? points[i + 1] : p;
    const dx = after[0] - before[0], dz = after[1] - before[1], n = Math.hypot(dx, dz) || 1;
    const nx = (dz / n) * half, nz = (-dx / n) * half;
    left.push([p[0] + nx, p[1] + nz]);
    right.push([p[0] - nx, p[1] - nz]);
  });
  return [...left, ...right.reverse()];
}

/** The inner tiled path from the foot of Calle Guillermo to the beach gate, the only way out (data/main_pool_lawn.json). */
export const INNER_PATH = data.innerPath.points as Vec2[];

/** Registry buildings the lawn photos show as plain white walls: no generated shutters, kit openings or porches. */
export const PLAIN_LAWN_BUILDINGS = new Set<string>(data.plainBuildings.ids);

/** Pink paths and the flagstone apron, for the map. */
export function lawnGroundRings(): Vec2[][] {
  const half = data.paths.width / 2;
  return [...data.paths.lines.map((line) => ribbonRing(line as Vec2[], half)), ribbonRing(data.innerPath.points as Vec2[], data.innerPath.width / 2), data.apron.ring as Vec2[]];
}

function wallRings(): Vec2[][] {
  const rings: Vec2[][] = [];
  for (const wall of data.rooms.walls) {
    const pts = wall.points as Vec2[];
    for (let i = 0; i < pts.length - 1; i++) rings.push(stripRing(pts[i], pts[i + 1], 0.12));
  }
  const s = data.hedge.shower as Vec2;
  rings.push(stripRing([s[0] - 0.45, s[1]], [s[0] + 0.45, s[1]], 0.09));
  return rings;
}

/** The white lawn walls and the shower pier. The pool stays unfenced. */
export function lawnSolidRings(): Vec2[][] {
  return wallRings();
}

type Ground = (x: number, z: number) => number;

/** The same line with a point at least every `step` metres, so a surface laid on it follows the ground. */
function densify(points: Vec2[], step: number): Vec2[] {
  const out: Vec2[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  return out;
}

/** Split every triangle into four, `levels` times, then lay each vertex on the ground. */
function layOnGround(geometry: THREE.BufferGeometry, ground: Ground, lift: number, levels: number): THREE.BufferGeometry {
  let g = geometry.index ? geometry.toNonIndexed() : geometry;
  for (let l = 0; l < levels; l++) {
    const p = g.getAttribute("position"), out: number[] = [];
    for (let t = 0; t < p.count; t += 3) {
      const v = [0, 1, 2].map((k) => new THREE.Vector3().fromBufferAttribute(p, t + k));
      const m = [[0, 1], [1, 2], [2, 0]].map(([a, b]) => v[a].clone().add(v[b]).multiplyScalar(0.5));
      for (const tri of [[v[0], m[0], m[2]], [m[0], v[1], m[1]], [m[2], m[1], v[2]], [m[0], m[1], m[2]]]) for (const q of tri) out.push(q.x, q.y, q.z);
    }
    g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  }
  const p = g.getAttribute("position"), uv: number[] = [];
  for (let i = 0; i < p.count; i++) { p.setY(i, ground(p.getX(i), p.getZ(i)) + lift); uv.push(p.getX(i), p.getZ(i)); }
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

function ribbonMesh(line: Vec2[], half: number, ground: Ground, lift: number, material: THREE.Material, name: string): THREE.Mesh {
  const points = densify(line, 0.6);
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  let run = 0;
  // Direction along the line at each point, always forward: at the first point the old code took it
  // backward, which flipped that cross-section and twisted the ribbon into a bow-tie (a wedge where
  // the branch path leaves the main one, and at the gateway end).
  const at = (i: number): Vec2 => {
    const a = points[Math.max(0, i - 1)], b = points[Math.min(points.length - 1, i + 1)];
    return [b[0] - a[0], b[1] - a[1]];
  };
  points.forEach((p, i) => {
    if (i) run += Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]);
    const d = at(i), n = Math.hypot(d[0], d[1]) || 1;
    const nx = (d[1] / n) * half, nz = (-d[0] / n) * half;
    for (const side of [-1, 1]) { const x = p[0] + nx * side, z = p[1] + nz * side; pos.push(x, ground(x, z) + lift, z); uv.push(run / 2.4, side * half); }
    if (i) { const b = (i - 1) * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = name; mesh.receiveShadow = true;
  return mesh;
}

function box(name: string, w: number, h: number, d: number, material: THREE.Material, at: Vec2, y: number, yaw = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.name = name; mesh.position.set(at[0], y, at[1]); mesh.rotation.y = yaw;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function flagstoneTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#c9a898"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#a88878"; g.lineWidth = 3;
  for (let i = 0; i < 18; i++) {
    g.beginPath();
    const x = (i * 47) % 240 + 8, y = (i * 83) % 240 + 8;
    g.moveTo(x, y); g.lineTo(x + 40, y + 8); g.lineTo(x + 28, y + 46); g.lineTo(x - 6, y + 30); g.closePath(); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/**
 * The riser tiles (IMG_2776, IMG_2777): a row of square Andalusian tiles, deep cobalt with a white
 * four-petal motif and small ochre centres, read as a dark blue band under each pale nosing. One
 * canvas is one tile; the material repeats it along each riser.
 */
function riserTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1f3c8c"; g.fillRect(0, 0, 64, 64);
  g.fillStyle = "#f2efe6";
  for (const [x, y] of [[32, 14], [50, 32], [32, 50], [14, 32]]) { g.beginPath(); g.ellipse(x, y, 7, 7, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#d9a531"; g.beginPath(); g.arc(32, 32, 6, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#f2efe6"; g.lineWidth = 2;
  for (const [x, y] of [[0, 0], [64, 0], [0, 64], [64, 64]]) { g.beginPath(); g.arc(x, y, 12, 0, Math.PI * 2); g.stroke(); }
  g.strokeStyle = "#e8e3d6"; g.lineWidth = 1; g.strokeRect(0.5, 0.5, 63, 63);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
  return t;
}

function fanPalm(): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.55, 6), new THREE.MeshStandardMaterial({ color: "#6d5344", roughness: 1 }));
  trunk.position.y = 0.28; g.add(trunk);
  const leaf = new THREE.MeshStandardMaterial({ color: "#3d6a34", roughness: 0.85, side: THREE.DoubleSide });
  for (let i = 0; i < 8; i++) {
    const frond = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.85), leaf);
    frond.position.y = 0.62; frond.rotation.y = (i / 8) * Math.PI * 2; frond.rotation.x = 0.7;
    g.add(frond);
  }
  return g;
}

function addSteps(group: THREE.Group, details: boolean, ground: Ground): void {
  // The flight is draped onto the survey like the rest of the pool level: follow the same offset.
  const lift = (p: Vec2): number => ground(p[0], p[1]) - poolGroundY(p[0], p[1]);
  const tile = new THREE.MeshStandardMaterial({ map: riserTexture(), roughness: 0.6 });
  tile.map!.repeat.set(Math.max(1, Math.round(flight.width / 0.15)), 1); // 15 cm tiles across the flight
  const marble = new THREE.MeshStandardMaterial({ color: "#f7f4ee", roughness: 0.35 });
  const iron = new THREE.MeshStandardMaterial({ color: "#1c2420", roughness: 0.4, metalness: 0.55 });
  for (let i = 0; i < stepCount; i++) {
    const t = i / stepCount, u = (i + 1) / stepCount;
    const A = accessSection(flight, t), B = accessSection(flight, u);
    const top = Y * t, foot = Y * u;
    const dx = B.r[0] - B.l[0], dz = B.r[1] - B.l[1], len = Math.hypot(dx, dz) || 1;
    const yaw = -Math.atan2(dz, dx) + Math.PI / 2;
    const mid: Vec2 = [(B.l[0] + B.r[0]) / 2, (B.l[1] + B.r[1]) / 2];
    const shift = lift(mid);
    const nose = box("enrique-nosing", 0.09, 0.025, len, marble, mid, top + shift + 0.02, yaw);
    group.add(nose);
    const riser = box("enrique-riser", 0.02, Math.max(0.08, top - foot), len, tile, mid, (top + foot) / 2 + shift, yaw);
    group.add(riser);
    if (details) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, Math.hypot(B.r[0] - A.r[0], B.r[1] - A.r[1]) || 0.2, 6), iron);
      rail.name = "enrique-handrail";
      const railY = top + lift(A.r) + 0.9;
      rail.position.set((A.r[0] + B.r[0]) / 2, railY, (A.r[1] + B.r[1]) / 2);
      rail.lookAt(B.r[0], railY, B.r[1]); rail.rotateX(Math.PI / 2);
      group.add(rail);
    }
  }
  if (!details) return;
  const bed = layout.levels.enriqueSteps.bed.wall.map(poolLevelPoint);
  bed.forEach((p, i) => {
    if (i % 2) return;
    const shrub = looseShrub({ width: 1.15, depth: 0.7, height: 0.42, seed: 80 + i, leaf: "small", leafSize: [0.05, 0.035], greens: ["#4f7038", "#5d8242", "#3f5c2e"], stems: 4, flowers: { count: 70, colour: i % 4 ? "#f0b320" : "#ee7a18" } });
    shrub.position.set(p[0], Y + lift(p) + 0.4, p[1]); shrub.name = "enrique-lantana"; group.add(shrub);
  });
  const palm = fanPalm();
  const at = bed[Math.floor(bed.length / 2)];
  palm.position.set(at[0], Y + lift(at) + 0.35, at[1]); palm.name = "enrique-fan-palm"; group.add(palm);
}

/** One blue box awning: a sloping canvas top, a lettered valance in front and plain sides and back. */
function boxAwning(text: string, width: number): THREE.Group {
  const c = document.createElement("canvas"); c.width = 512; c.height = 48;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1d4e86"; g.fillRect(0, 0, 512, 48);
  g.fillStyle = "#f4f7fb"; g.font = "bold 24px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(text, 256, 25, 492);
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace;
  const cloth = new THREE.MeshStandardMaterial({ color: "#1d4e86", roughness: 0.9, side: THREE.DoubleSide });
  const lettered = new THREE.MeshStandardMaterial({ map, roughness: 0.9 });
  const awning = new THREE.Group();
  const depth = 0.75, drop = 0.28;
  const top = new THREE.Mesh(new THREE.PlaneGeometry(width, Math.hypot(depth, 0.3)), cloth);
  top.rotation.x = -Math.PI / 2 + Math.atan2(0.3, depth); top.position.set(0, 0.15, depth / 2); awning.add(top);
  // Lettering faces out from the wall only; seen from behind the valance is plain cloth.
  const valance = new THREE.Mesh(new THREE.PlaneGeometry(width, drop), lettered);
  valance.position.set(0, -drop / 2, depth); awning.add(valance);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(width, drop), cloth);
  back.rotation.y = Math.PI; back.position.set(0, -drop / 2, depth - 0.002); awning.add(back);
  for (const side of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.PlaneGeometry(depth, drop + 0.3), cloth);
    cheek.rotation.y = Math.PI / 2; cheek.position.set(side * width / 2, 0, depth / 2); awning.add(cheek);
  }
  return awning;
}

/**
 * The shop front at the head of Enrique's steps (IMG_2775, IMG_2776): three blue box awnings in a row
 * along the facade, lettered as photographed, a wall lantern above the first, menu boards to its left.
 * The facade faces the lane (south), as the lane photos look north at it; the anchor is estimated.
 */
function addShop(group: THREE.Group, ground: Ground): void {
  const at = data.shop.at as Vec2, base = ground(at[0], at[1]);
  const front = new THREE.Group(); front.name = "enrique-shop-front"; front.position.set(at[0], base, at[1]);
  const awnings: [string, number][] = [["FISH PORTIONS · MEATS · PUBLIC PEOPLE", 2.1], ["RACIONES · PESCADOS · CARNES · PIZZAS", 2.1], ["BAR & RESTAURANTE ENRIQUE", 2.3]];
  const span = awnings.reduce((t, [, w]) => t + w, 0) + 0.5 * (awnings.length - 1);
  let x = -span / 2;
  for (const [text, width] of awnings) {
    const awning = boxAwning(text, width); awning.name = "enrique-awning";
    awning.position.set(x + width / 2, 2.45, 0); front.add(awning);
    x += width + 0.5;
  }
  const board = plasterMaterial("#f7f4ee");
  for (const [dx, w] of [[-span / 2 - 0.9, 0.6], [-span / 2 - 0.3, 0.3]] as const) front.add(box("enrique-menu", w, 0.8, 0.03, board, [dx, 0.03], 1.65));
  const lamp = new THREE.MeshStandardMaterial({ color: "#2b2b28", roughness: 0.5, metalness: 0.4 });
  const glass = new THREE.MeshStandardMaterial({ color: "#f1ead8", emissive: "#5a5040", roughness: 0.3 });
  const lx = -span / 2 + 1.0;
  front.add(box("enrique-lantern-arm", 0.04, 0.04, 0.35, lamp, [lx, 0.18], 3.15));
  front.add(box("enrique-lantern", 0.2, 0.3, 0.2, glass, [lx, 0.35], 3.0));
  front.add(box("enrique-lantern-cap", 0.26, 0.06, 0.26, lamp, [lx, 0.35], 3.18));
  group.add(front);
}

function addDeck(group: THREE.Group, mainRing: Vec2[], toddlerRing: Vec2[], ground: Ground): void {
  const c = centroid(mainRing);
  const terracotta = new THREE.MeshStandardMaterial({ color: "#c4745a", roughness: 0.92, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const mat = new THREE.MeshStandardMaterial({ color: "#3f8f62", roughness: 0.85, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const samples = resample(mainRing, 1.4);
  const outer = pushOut(samples, data.deck.band), inner = pushOut(samples, 0.2);
  const pos: number[] = [], idx: number[] = [];
  const matPos: number[] = [];
  for (let i = 0; i < samples.length; i++) {
    const j = (i + 1) % samples.length;
    const mid: Vec2 = [(outer[i][0] + outer[j][0]) / 2, (outer[i][1] + outer[j][1]) / 2];
    const dx = mid[0] - c.x, dz = mid[1] - c.z, n = Math.hypot(dx, dz) || 1;
    // IMG_2764 and IMG_2765 show a pale deck from the lawn. Terracotta squares are only
    // the paving at the foot of Enrique's steps (IMG_2777), not a band around the pool.
    if (Math.hypot(mid[0] + 31, mid[1] - 105) > 8) continue;
    if (nearRing(mid, toddlerRing, 0.8)) continue;
    const b = pos.length / 3;
    for (const p of [inner[i], outer[i], outer[j], inner[j]]) pos.push(p[0], ground(p[0], p[1]) + 0.025, p[1]);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    if (dz / n > 0.45) for (const p of [inner[i], pushOut([samples[i]], 0.55)[0], pushOut([samples[j]], 0.55)[0], inner[j]]) matPos.push(p[0], ground(p[0], p[1]) + 0.03, p[1]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, terracotta); mesh.name = "main-pool-deck-tiles"; mesh.receiveShadow = true; group.add(mesh);
  if (matPos.length) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(matPos, 3));
    const id: number[] = [];
    for (let k = 0; k < matPos.length / 3; k += 4) id.push(k, k + 1, k + 2, k, k + 2, k + 3);
    g.setIndex(id); g.computeVertexNormals();
    const green = new THREE.Mesh(g, mat); green.name = "main-pool-edge-mat"; green.receiveShadow = true; group.add(green);
  }
}

export function addMainPoolLawn(scene: THREE.Scene, mainRing: Vec2[], toddlerRing: Vec2[], details: boolean, ground: Ground): void {
  const on = (p: Vec2): number => ground(p[0], p[1]);
  const group = new THREE.Group();
  group.name = "main-pool-lawn"; group.userData.noDrape = true;
  const pink = new THREE.MeshStandardMaterial({ color: "#c47468", roughness: 0.82, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const flags = new THREE.MeshStandardMaterial({ map: flagstoneTexture(), roughness: 0.95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  flags.map!.repeat.set(1.4, 1.4);
  for (const line of data.paths.lines) group.add(ribbonMesh(line as Vec2[], data.paths.width / 2, ground, 0.05, pink, "lawn-pink-path"));
  // The inner tiled path from the foot of Calle Guillermo along the inside of the boundary to the gate (IMG_2600-2602, IMG_2763).
  // IMG_2600 and IMG_2601 show large terracotta squares, about 0.4 m: the terracotta photo texture holds
  // eight tiles a repeat; the ribbon's u runs 1 per 2.4 m along and v in metres across.
  const quarry = surfaceTexture("paving").clone(); quarry.repeat.set(2.4 / 3.2, 1 / 3.2); quarry.needsUpdate = true;
  const terracotta = new THREE.MeshStandardMaterial({ color: "#d48a6a", map: quarry, roughness: 0.9, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  group.add(ribbonMesh(data.innerPath.points as Vec2[], data.innerPath.width / 2, ground, 0.05, terracotta, "lawn-inner-path"));
  const apron = new THREE.Shape((data.apron.ring as Vec2[]).map(([x, z]) => new THREE.Vector2(x, -z)));
  const apronMesh = new THREE.Mesh(layOnGround(new THREE.ShapeGeometry(apron).rotateX(-Math.PI / 2), ground, 0.04, 3), flags);
  apronMesh.name = "lawn-flagstone-apron"; apronMesh.receiveShadow = true; group.add(apronMesh);
  const white = plasterMaterial("#fbf8f0");
  for (const wall of data.rooms.walls) {
    const pts = wall.points as Vec2[];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      // Level top at its height above the higher end; the foot goes into the ground at the lower end.
      const foot = Math.min(on(a), on(b)) - 0.1, top = Math.max(on(a), on(b)) + wall.height;
      group.add(box("lawn-white-wall", len, top - foot, 0.22, white, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], (top + foot) / 2, -Math.atan2(b[1] - a[1], b[0] - a[0])));
    }
  }
  const showerAt = data.hedge.shower as Vec2;
  group.add(box("lawn-shower-wall", 0.9, 1.9, 0.18, white, showerAt, on(showerAt) + 0.95));
  addDeck(group, mainRing, toddlerRing, ground);
  addSteps(group, details, ground);
  if (details) {
    addShop(group, ground);
    // The Blender-built lawn kit (scripts/build_lawn_kit.py, public/models/lawn): bollard lights,
    // slatted bins and the square service lid; simple shapes stand in until each model loads.
    const place = (at: Vec2) => ({ x: at[0], y: on(at), z: at[1], turn: 0 });
    const bollardStandIn = mergeGeometries([new THREE.CylinderGeometry(0.09, 0.09, 0.44, 8).translate(0, 0.22, 0), new THREE.CylinderGeometry(0.08, 0.08, 0.14, 8).translate(0, 0.51, 0)])!;
    addKitModel(group, "/models/lawn/bollard.glb", bollardStandIn, (data.fittings.bollards as Vec2[]).map(place), new THREE.MeshStandardMaterial({ color: "#2c4a3a", roughness: 0.6 }), "lawn-bollard");
    addKitModel(group, "/models/lawn/bin.glb", new THREE.CylinderGeometry(0.23, 0.23, 0.68, 12).translate(0, 0.42, 0), (data.fittings.bins as Vec2[]).map(place), new THREE.MeshStandardMaterial({ color: "#5b3b27", roughness: 0.85 }), "lawn-bin");
    addKitModel(group, "/models/lawn/cover.glb", new THREE.BoxGeometry(0.63, 0.012, 0.63).translate(0, 0.006, 0), (data.fittings.covers as Vec2[]).map(place), new THREE.MeshStandardMaterial({ color: "#73766f", roughness: 0.6 }), "lawn-service-cover");
    const grate = new THREE.MeshStandardMaterial({ color: "#3a3e40", roughness: 0.45, metalness: 0.5 });
    for (const drain of data.fittings.drains) {
      const along = drain.along as Vec2, n = Math.hypot(along[0], along[1]) || 1;
      group.add(box("lawn-slot-drain", 1.6, 0.02, 0.22, grate, drain.at as Vec2, on(drain.at as Vec2) + 0.055, -Math.atan2(along[1] / n, along[0] / n)));
    }
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: "#d5d8dc", metalness: 0.8, roughness: 0.25 }));
    head.position.set(showerAt[0], on(showerAt) + 1.7, showerAt[1] + 0.12); head.name = "lawn-shower"; group.add(head);
    const [h0, h1] = data.hedge.points as Vec2[];
    const hlen = Math.hypot(h1[0] - h0[0], h1[1] - h0[1]);
    const pieces = Math.ceil(hlen / 1.3);
    for (let i = 0; i < pieces; i++) {
      const t = (i + 0.5) / pieces;
      const hedge = clippedHedge({ length: hlen / pieces + 0.05, depth: 0.55, height: 0.7, seed: 30 + i, clip: 4.2, greens: ["#2f4a28", "#3d5c32", "#4c6b3c"] });
      const hx = h0[0] + (h1[0] - h0[0]) * t, hz = h0[1] + (h1[1] - h0[1]) * t;
      hedge.position.set(hx, ground(hx, hz), hz);
      hedge.rotation.y = Math.atan2(h1[0] - h0[0], h1[1] - h0[1]);
      hedge.name = "lawn-sea-hedge"; group.add(hedge);
    }
    for (const plant of data.rooms.plants) {
      const at = plant.at as Vec2;
      if (plant.kind === "strelitzia") {
        const holder = new THREE.Scene(); holder.userData = { ...scene.userData, layoutOnly: false };
        addSprites(holder, "bird_of_paradise", [{ x: at[0], y: on(at), z: at[1], scale: 0.55 }]);
        for (const child of [...holder.children]) { child.name = "lawn-strelitzia"; child.userData.noDrape = true; scene.add(child); }
      } else {
        const shrub = looseShrub({ width: 1.5, depth: 1.1, height: 0.45, seed: 17, leaf: "small", leafSize: [0.04, 0.03], greens: ["#b7b8b0", "#9aa096", "#c8c9c2"], stems: 6 });
        shrub.position.set(at[0], on(at), at[1]); shrub.name = "lawn-silver-bush"; group.add(shrub);
      }
    }
  }
  scene.add(group);
}
