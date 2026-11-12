import * as THREE from "three";
import data from "../data/jorge_lane.json";
import skeleton from "../public/map/skeleton.json";
import { pointInRing } from "./geom";
import { photoTexture, plasterMaterial, surfaceTexture } from "./materials";
import type { Vec2 } from "./types";
import { clippedHedge, looseShrub, roundClippedTree, wallClimber } from "./clipped-plants";
import { candelabraCactus } from "./candelabra-cactus";
import { lanternPost } from "./lantern-post";
import { addSprites } from "./sprites";
import { dragonTree, tallPalm } from "./spiky-trees";
import { siteY } from "./terrain";
import { poolGroundY } from "./pool-levels";
import { seawardPavingCanvas } from "./seaward-paving";

/** Calle Jorge: square tiles and cross-paths, covers, lawns and kerbs, planter walls, the bench, beds, the dragon tree and cactus, plaques, the sign and lamps. */
export const jorgeLane = data;
const sign = data.sign, lamp = data.lamp;
const BENCH_LENGTH = 1.45;
/** The tiled path stands this far above the modelled ground (the street ribbon, src/boundaries.ts); walls and kerbs are measured from it. */
const PATH_Y = 0.3;
/** Only the stretch the photos show is dressed; the rest keeps the generic ribbon (gap:jorge-west). */
const SHOWN = data.photographed;
const road = skeleton.streets.find((s) => s.id === "jorge")!;
const line = road.points as Vec2[];
type Frame = { p: Vec2; lawn: Vec2; hedge: Vec2; along: Vec2 };
function lengthOf(): number {
  let n = 0;
  for (let i = 1; i < line.length; i++) n += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
  return n;
}
export function jorgeAt(dist: number): Frame {
  let left = dist;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i], b = line[i + 1];
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
    if (left <= len || i === line.length - 2) {
      const along: Vec2 = [dx / len, dz / len], travelled = Math.min(left, len);
      const lawn: Vec2 = [-along[1], along[0]];
      return { p: [a[0] + along[0] * travelled, a[1] + along[1] * travelled], lawn, hedge: [-lawn[0], -lawn[1]], along };
    }
    left -= len;
  }
  return jorgeAt(0);
}
function inHouse(x: number, z: number): boolean {
  return skeleton.buildings.some((b) => b.floors > 0 && pointInRing(x, z, b.ring as Vec2[]));
}
/** The photographed bench, then the benches placed from the aerial (data.benches.aerial). Each faces the path. */
export function jorgeBenchSpots(): { at: Vec2; face: Vec2; inferred: boolean }[] {
  const seen = data.benches.along.map((dist) => ({ ...jorgeSide(dist, data.benches.offset, "lawn"), inferred: false }));
  const aerial = data.benches.aerial.map((b) => ({ ...jorgeSide(b.along, b.offset, b.side), inferred: true }));
  return [...seen, ...aerial].filter((b) => !inHouse(b.at[0], b.at[1]));
}
/** A point off the centreline. `face` points back toward the path. */
export function jorgeSide(dist: number, offset: number, side: string): { at: Vec2; face: Vec2 } {
  const f = jorgeAt(dist);
  const lawnSide = side !== "hedge";
  const n = lawnSide ? f.lawn : f.hedge;
  const at: Vec2 = [f.p[0] + n[0] * offset, f.p[1] + n[1] * offset];
  return { at, face: lawnSide ? f.hedge : f.lawn };
}
/** Station along the lane and signed offset: + is the lawn side, - the hedge side. */
function at(s: number, d: number): Vec2 {
  // The mapped lane is one straight segment, so this also holds a little beyond its ends (the Guillermo planter).
  if (line.length !== 2) throw new Error("jorge-lane: stations assume the mapped Calle Jorge line is one straight segment");
  const f = jorgeAt(0);
  return [f.p[0] + f.along[0] * s + f.lawn[0] * d, f.p[1] + f.along[1] * s + f.lawn[1] * d];
}
/** Walls the photos show plain or planted (IMG_2183, IMG_2229, IMG_2233): the generic tiled porches and awnings are left off them. */
export function inJorgePlainFront(x: number, z: number): boolean {
  const f = jorgeAt(0), dx = x - f.p[0], dz = z - f.p[1];
  const s = dx * f.along[0] + dz * f.along[1], d = dx * f.lawn[0] + dz * f.lawn[1];
  return data.plainFronts.some((zone) => {
    const o = zone.side === "lawn" ? d : -d;
    return s >= zone.along[0] && s <= zone.along[1] && o >= zone.offset[0] && o <= zone.offset[1];
  });
}
/** Walls the photos show as plain garden walls (IMG_2773): no generic doors, shutters, balconies or porches on them. */
export function inJorgePlainWall(x: number, z: number): boolean {
  const f = jorgeAt(0), dx = x - f.p[0], dz = z - f.p[1];
  const s = dx * f.along[0] + dz * f.along[1], north = -(dx * f.lawn[0] + dz * f.lawn[1]);
  return (data.guillermoWest.plainWalls as { along: number[]; offset: number[] }[]).some((w) => s >= w.along[0] && s <= w.along[1] && north >= w.offset[0] && north <= w.offset[1]);
}
/** The planter-wall runs on the hedge side: open stretches of the boundary, less houses and the photographed gaps. */
export function jorgeWallRuns(): [number, number][] {
  const w = data.boundary, step = 0.1, runs: [number, number][] = [];
  const gap = (s: number) => w.gaps.some((g) => s >= g.from - 1e-6 && s < g.to - 1e-6);
  for (let s = w.from; s < w.to - 1e-6; s += step) {
    const p = at(s + step / 2, -w.offset), open = !gap(s + step / 2) && !inHouse(p[0], p[1]);
    const last = runs[runs.length - 1];
    if (open && last && Math.abs(last[1] - s) < 1e-6) last[1] = s + step; else if (open) runs.push([s, s + step]);
  }
  return runs.map(([a, b]) => [Math.round(a * 10) / 10, Math.round(b * 10) / 10] as [number, number]).filter(([a, b]) => b - a >= 0.8);
}

function yawOf(face: Vec2): number {
  return Math.atan2(face[0], face[1]);
}
/** Schematic of the blue, yellow and green azulejo on IMG_2232. Not a copy of the tile. */
function tile(): THREE.CanvasTexture {
  const s = 512, g = document.createElement("canvas"); g.width = g.height = s;
  const c = g.getContext("2d")!;
  c.fillStyle = "#f6f1e4"; c.fillRect(0, 0, s, s);
  c.strokeStyle = "#1a4e86"; c.lineWidth = 22; c.strokeRect(14, 14, s - 28, s - 28);
  c.strokeStyle = "#d7a31a"; c.lineWidth = 8; c.strokeRect(42, 42, s - 84, s - 84);
  c.save(); c.translate(s / 2, s / 2);
  for (let i = 0; i < 4; i++) {
    c.rotate(Math.PI / 2);
    c.strokeStyle = "#1a4e86"; c.lineWidth = 16; c.lineCap = "round";
    c.beginPath(); c.arc(78, -70, 46, 0.4, Math.PI * 1.55); c.stroke();
    c.beginPath(); c.arc(86, -78, 18, 0, Math.PI * 2); c.stroke();
    c.fillStyle = "#e2b423"; c.beginPath(); c.ellipse(0, -86, 18, 40, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#2c6b3c"; c.beginPath(); c.ellipse(46, -40, 14, 26, 0.9, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#1a4e86"; c.beginPath(); c.ellipse(36, -96, 10, 16, 0.4, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = "#1a4e86"; c.beginPath(); c.arc(0, 0, 26, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#e2b423"; c.beginPath(); c.arc(0, 0, 11, 0, Math.PI * 2); c.fill();
  c.restore();
  const t = new THREE.CanvasTexture(g); t.colorSpace = THREE.SRGBColorSpace; return t;
}
/** Broad centre arch with a lower rounded hump each side. IMG_2232, not a zigzag. */
function crest(t: number): number {
  const u = Math.min(1, Math.max(0, (t - 0.06) / 0.88));
  const centre = Math.pow(Math.sin(Math.PI * u), 0.72) * 0.32;
  const leftU = (t - 0.2) / 0.11, rightU = (t - 0.8) / 0.11;
  const left = Math.exp(-leftU * leftU) * 0.07;
  const right = Math.exp(-rightU * rightU) * 0.07;
  return 0.7 + centre + left + right;
}
function letters(text: string): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = 720; c.height = 128;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 720, 128);
  const tileW = 46;
  let x = (720 - text.length * tileW) / 2;
  g.font = "bold 36px Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  for (const ch of text) {
    if (ch !== " ") {
      g.fillStyle = "#161616"; g.fillRect(x + 3, 28, tileW - 6, 72);
      g.fillStyle = "#f7f4ee"; g.fillText(ch, x + tileW / 2, 66);
    }
    x += tileW;
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function benchMesh(): THREE.Group {
  const g = new THREE.Group(); g.name = "jorge-bench";
  // Painted render, not the mottled wall plaster. IMG_2231/2232 are bright white.
  const white = new THREE.MeshStandardMaterial({ color: "#f7f5f0", roughness: 0.82 });
  const blue = new THREE.MeshStandardMaterial({ color: "#1a3c6e", roughness: 0.45 });
  const L = BENCH_LENGTH;
  const backD = 0.4, seatD = 0.42;
  const back = new THREE.Shape();
  back.moveTo(-L / 2, 0); back.lineTo(-L / 2, 0.62);
  for (let i = 0; i <= 48; i++) back.lineTo(-L / 2 + (i / 48) * L, crest(i / 48));
  back.lineTo(L / 2, 0); back.closePath();
  const slab = new THREE.Mesh(new THREE.ExtrudeGeometry(back, { depth: backD, bevelEnabled: false }), white);
  slab.name = "jorge-bench-back"; slab.castShadow = true; g.add(slab);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(L - 0.04, 0.38, seatD), white);
  seat.position.set(0, 0.25, backD + seatD / 2 - 0.06); seat.castShadow = seat.receiveShadow = true; seat.name = "jorge-bench-seat";
  g.add(seat);
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(L + 0.02, 0.055, backD + seatD), blue);
  skirt.position.set(0, 0.028, (backD + seatD) / 2); skirt.name = "jorge-bench-skirting"; g.add(skirt);
  const hatch = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.22, 0.34), new THREE.MeshStandardMaterial({ color: "#eceae4", roughness: 0.7 }));
  hatch.position.set(-L / 2 - 0.004, 0.72, backD * 0.45); hatch.name = "jorge-bench-hatch"; g.add(hatch);
  const azulejo = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshStandardMaterial({ map: tile(), roughness: 0.35 }));
  azulejo.position.set(0, 0.74, backD + 0.012); azulejo.name = "jorge-bench-tile"; g.add(azulejo);
  return g;
}

function signMesh(): THREE.Group {
  const g = new THREE.Group(); g.name = "jorge-sign";
  const white = plasterMaterial("#f7f4ee");
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.92, 0.22), white);
  body.position.y = 0.46; body.castShadow = true; g.add(body);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.06, 0.28), white);
  cap.position.y = 0.95; g.add(cap);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.16), new THREE.MeshStandardMaterial({ map: letters(sign.text), transparent: true, roughness: 0.45 }));
  plaque.position.set(0, 0.62, 0.12); plaque.name = "jorge-sign-letters"; g.add(plaque);
  return g;
}

function place(group: THREE.Group, at: Vec2, face: Vec2): THREE.Group {
  group.position.set(at[0], 0, at[1]);
  group.rotation.y = yawOf(face);
  group.userData.base = at;
  return group;
}

/** Lawn in one-metre cells, skipping any cell that touches a house. Turf is laid in metres so it is not stretched. */
function grass(side: "lawn" | "hedge"): THREE.Mesh {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const total = lengthOf(), sign = side === "lawn" ? 1 : -1;
  for (const patch of [...data.grass, ...data.west.grass, ...data.middle.grass].filter((g) => g.side === side)) {
    const inner = (patch as { inner?: number }).inner ?? data.verges.inner, to = Math.min(total, patch.to);
    for (let s = patch.from; s < to - 1e-6; s += 1) for (let d = inner; d < patch.outer - 1e-6; d += 1) {
      const s2 = Math.min(to, s + 1), d2 = Math.min(patch.outer, d + 1);
      const cell: [number, number][] = [[s, d], [s, d2], [s2, d2], [s2, d]];
      const corners = cell.map(([cs, cd]) => at(cs, cd * sign));
      if (corners.some((p) => inHouse(p[0], p[1]))) continue;
      const base = pos.length / 3;
      corners.forEach((p, i) => { pos.push(p[0], 0.025, p[1]); uv.push(cell[i][1] / 1.6, cell[i][0] / 1.6); });
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: surfaceTexture("turf"), color: data.planting.turf, roughness: 1, side: THREE.DoubleSide }));
  mesh.name = `jorge-grass-${side}`; mesh.receiveShadow = true;
  return mesh;
}

/** A tiled strip along a line of [station, offset] points, mitred at its bends, with tile joints along and across it. */
function strip(points: number[][], half: number, y: number, material: THREE.Material, name: string): THREE.Mesh {
  const pts = points.map(([s, d]) => at(s, d)), pos: number[] = [], uv: number[] = [], idx: number[] = [];
  let run = 0;
  const dir = (i: number): Vec2 => { const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  pts.forEach((p, i) => {
    const before = i > 0 ? dir(i - 1) : dir(i), after = i < pts.length - 1 ? dir(i) : dir(i - 1);
    if (i > 0) run += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    // Mitre: the offset direction is the bisector of the two side normals, lengthened to keep the width.
    const n: Vec2 = [-(before[1] + after[1]), before[0] + after[0]], l = Math.hypot(n[0], n[1]);
    const k = half / (l / 2) / l;
    for (const side of [-1, 1]) { pos.push(p[0] + n[0] * k * side, y, p[1] + n[1] * k * side); uv.push(run, side * half); }
    if (i > 0) { const b = (i - 1) * 2; idx.push(b, b + 3, b + 2, b, b + 1, b + 3); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = name; mesh.receiveShadow = true; mesh.renderOrder = 1;
  return mesh;
}
/** A box along the lane frame between two [station, offset] points, standing on the ground. */
function bar(a: number[], b: number[], width: number, height: number, material: THREE.Material, name: string): THREE.Mesh {
  const p = at(a[0], a[1]), q = at(b[0], b[1]), len = Math.hypot(q[0] - p[0], q[1] - p[1]);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, len), material);
  const mid: Vec2 = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  mesh.position.set(mid[0], height / 2, mid[1]); mesh.rotation.y = Math.atan2(q[0] - p[0], q[1] - p[1]);
  mesh.userData.base = mid; mesh.castShadow = mesh.receiveShadow = true; mesh.name = name;
  return mesh;
}
/** Red brick laid in rows across the patio thresholds (IMG_2230, IMG_2182). Schematic. */
function brickTexture(): THREE.CanvasTexture {
  const s = 256, c = document.createElement("canvas"); c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.fillStyle = "#a89684"; g.fillRect(0, 0, s, s);
  const rows = 8, h = s / rows, w = s / 2;
  for (let r = 0; r < rows; r++) for (let i = -1; i < 3; i++) {
    const tone = 118 + ((r * 37 + i * 61) % 30);
    g.fillStyle = `rgb(${tone + 22},${Math.round(tone * 0.46)},${Math.round(tone * 0.34)})`;
    g.fillRect(i * w + (r % 2 ? w / 2 : 0) + 2, r * h + 2, w - 4, h - 4);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
/** The small recess near a planter end with a blue-and-white house-number tile in its foot (IMG_2230, IMG_2182). The digits are not legible, so none are drawn. */
function nicheTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = 128; c.height = 240;
  const g = c.getContext("2d")!;
  const shade = g.createLinearGradient(0, 0, 128, 0); shade.addColorStop(0, "#8d887d"); shade.addColorStop(0.4, "#b9b4a8"); shade.addColorStop(1, "#cfcabe");
  g.fillStyle = shade; g.fillRect(0, 0, 128, 240);
  g.fillStyle = "#77736a"; g.fillRect(0, 0, 128, 22);
  g.fillStyle = "#eeece6"; g.fillRect(22, 168, 84, 64);
  g.strokeStyle = "#27478c"; g.lineWidth = 5; g.strokeRect(27, 173, 74, 54);
  g.fillStyle = "#27478c"; g.beginPath(); g.moveTo(64, 186); g.lineTo(76, 200); g.lineTo(64, 214); g.lineTo(52, 200); g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Square terracotta with joints along and across the path. IMG_2182, IMG_2230, IMG_2234. World-aligned UVs put the grid on the diagonal. */
function pathRibbon(half: number, y: number, material: THREE.Material, name: string, from = SHOWN.from, to = SHOWN.to): THREE.Mesh {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const total = lengthOf();
  for (let s = from; s < Math.min(total, to) - 0.4; s += 2) {
    const a = jorgeAt(s), b = jorgeAt(Math.min(total, s + 2)), end = Math.min(total, s + 2);
    const corner = (f: Frame, side: number, along: number): { p: Vec2; uv: [number, number] } => {
      const across = side * half;
      return { p: [f.p[0] + f.lawn[0] * across, f.p[1] + f.lawn[1] * across], uv: [along, across] };
    };
    const corners = [corner(a, -1, s), corner(a, 1, s), corner(b, 1, end), corner(b, -1, end)];
    if (corners.filter((c) => inHouse(c.p[0], c.p[1])).length >= 3) continue;
    const base = pos.length / 3;
    for (const c of corners) { pos.push(c.p[0], y, c.p[1]); uv.push(c.uv[0], c.uv[1]); }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = name; mesh.receiveShadow = true; mesh.renderOrder = 1;
  return mesh;
}

/** Round red SANEA cover and the square grate beside the bench. Schematic, not a copy of the casting. */
function coverTexture(kind: "round" | "square" | "channel" | "green"): THREE.CanvasTexture {
  const s = 256, c = document.createElement("canvas"); c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, s, s);
  g.fillStyle = kind === "green" ? "#2f5a3c" : "#7a3030";
  if (kind === "channel") {
    // Slot drain across the path at the Teodoro junction (IMG_2234): dark slots in a red frame.
    g.fillRect(0, 0, s, s);
    g.fillStyle = "#2a1515";
    for (let i = 0; i < 14; i++) g.fillRect(10 + i * 17, 26, 8, s - 52);
  } else if (kind === "round" || kind === "green") {
    g.beginPath(); g.arc(s / 2, s / 2, s * 0.46, 0, Math.PI * 2); g.fill();
    g.strokeStyle = kind === "green" ? "#6f9a78" : "#c4a48a"; g.lineWidth = 3;
    for (const r of [0.16, 0.28, 0.38]) { g.beginPath(); g.arc(s / 2, s / 2, s * r, 0, Math.PI * 2); g.stroke(); }
    g.strokeStyle = "#e8d7c4"; g.lineWidth = 1.2;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      g.beginPath(); g.moveTo(s / 2 + Math.cos(a) * s * 0.18, s / 2 + Math.sin(a) * s * 0.18);
      g.lineTo(s / 2 + Math.cos(a) * s * 0.36, s / 2 + Math.sin(a) * s * 0.36); g.stroke();
    }
    if (kind === "round") {
      g.fillStyle = "#f3e6d4"; g.font = "bold 22px Arial, sans-serif"; g.textAlign = "center";
      g.save(); g.translate(s / 2, s / 2); g.rotate(-0.6); g.fillText("SANEA", 0, -s * 0.3); g.restore();
    }
  } else {
    g.fillRect(8, 8, s - 16, s - 16);
    g.strokeStyle = "#2a1818"; g.lineWidth = 3;
    for (let i = 1; i < 8; i++) {
      const p = 8 + ((s - 16) * i) / 8;
      g.beginPath(); g.moveTo(p, 14); g.lineTo(p, s - 14); g.moveTo(14, p); g.lineTo(s - 14, p); g.stroke();
    }
    g.strokeStyle = "#e7d3c0"; g.lineWidth = 4; g.beginPath(); g.ellipse(s / 2, s / 2, 28, 14, 0.4, 0, Math.PI * 2); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function coverMesh(kind: string): THREE.Group {
  const shape = kind === "square" || kind === "channel" || kind === "green" ? kind : "round";
  const g = new THREE.Group(); g.name = `jorge-cover-${shape}`;
  // Flush with the tiles (IMG_2596): a thin plate whose top is a few millimetres above the path at 0.32 m.
  // The channel lies across the path; the green cover lies in the grass (IMG_2234).
  const r = data.grassCover.radius;
  const geo = shape === "round" ? new THREE.CylinderGeometry(0.3, 0.3, 0.02, 24) : shape === "green" ? new THREE.CylinderGeometry(r, r, 0.03, 28)
    : shape === "channel" ? new THREE.BoxGeometry(0.62, 0.02, 0.13) : new THREE.BoxGeometry(0.46, 0.02, 0.46);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: shape === "green" ? "#4f7f5c" : "#9a3830", map: coverTexture(shape), roughness: 0.5, metalness: 0.35,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
  }));
  mesh.position.y = shape === "green" ? 0.045 : 0.315; mesh.receiveShadow = true; mesh.renderOrder = 4; g.add(mesh);
  return g;
}

/** Black letter tiles on a white plate. House 20 and CALLE DE TEODORO, IMG_2231 and IMG_2234. */
function plaqueTexture(lines: string[]): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = 280; c.height = 360;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f7f4ee"; g.fillRect(0, 0, 280, 360);
  g.strokeStyle = "#1c1c1c"; g.lineWidth = 6; g.strokeRect(6, 6, 268, 348);
  g.font = "bold 36px Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  const gap = 300 / lines.length;
  lines.forEach((line, i) => {
    const y = 40 + gap * (i + 0.5);
    const tile = 34, width = line.length * tile;
    let x = (280 - width) / 2;
    for (const ch of line) {
      g.fillStyle = "#161616"; g.fillRect(x + 2, y - 22, tile - 4, 44);
      g.fillStyle = "#f7f4ee"; g.fillText(ch, x + tile / 2, y);
      x += tile;
    }
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function plaqueMesh(lines: string[]): THREE.Group {
  const g = new THREE.Group(); g.name = "jorge-plaque";
  const tall = lines.length > 1;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(tall ? 0.62 : 0.28, tall ? 0.48 : 0.22), new THREE.MeshStandardMaterial({ map: plaqueTexture(lines), roughness: 0.55 }));
  plate.position.y = tall ? 1.45 : 1.7; g.add(plate);
  return g;
}

/** Height of the Calle Guillermo paving `d` metres north of the Jorge line: the surveyed ground on the mapped lane, smoothed so the surface runs straight. */
function guillermoLaneY(d: number): number {
  const gp = data.guillermoPlanter;
  // A smooth upper envelope of the ground under the generic 1.2 m ribbon, so this paving covers it and runs straight:
  // the highest ground within 3 m each way, then averaged over 9 m along the lane.
  const crest = (q: number) => { let top = -Infinity; for (const across of [-0.7, 0, 0.7]) { const p = at(gp.along - gp.laneOffset + across, -q); top = Math.max(top, siteY(p[0], p[1])); } return top; };
  const envelope = (q: number) => { let top = -Infinity; for (let k = -3; k <= 3; k++) top = Math.max(top, crest(q + k)); return top; };
  let sum = 0;
  for (let k = -4; k <= 4; k++) sum += envelope(d + k);
  return sum / 9 + 0.33;
}
/** Height of the Guillermo planter's top: one metre (its `height`) above the paving beside it. */
function guillermoPlanterTop(): (d: number) => number {
  return (d: number) => guillermoLaneY(d) + data.guillermoPlanter.height;
}
/** Paving across Calle Guillermo from `from` to `to` metres north of the Jorge line, level across its width at the lane's own height (not draped: its east edge lies over the bank to the pool). */
function guillermoPaving(from: number, to: number, material: THREE.Material, name: string, uvScale = 1, along = data.guillermoPaving.along, half = data.guillermoPaving.half): THREE.Mesh {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const stations: number[] = []; for (let d = from; d < to - 1e-6; d += 0.5) stations.push(d); stations.push(to);
  stations.forEach((d, i) => {
    const y = guillermoLaneY(d);
    for (const side of [-1, 1]) { const p = at(along + side * half, -d); pos.push(p[0], y, p[1]); uv.push(d * uvScale, side * half * uvScale); }
    if (i) { const b = (i - 1) * 2; idx.push(b, b + 1, b + 3, b, b + 3, b + 2); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, material); (material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  mesh.name = name; mesh.userData.noDrape = true; mesh.receiveShadow = true; mesh.renderOrder = 1;
  return mesh;
}
/**
 * The white planter wall along Calle Guillermo (IMG_2773, IMG_2774): one straight, neat wall a metre above the lane.
 * Its heights are set here from the lane surface, not draped, because the ground under it is the bank down to the main pool;
 * the pool-side face is carried down to that lower ground as the retaining wall it is.
 */
function guillermoPlanter(top: (d: number) => number, material: THREE.Material): THREE.Mesh {
  const gp = data.guillermoPlanter, half = gp.thickness / 2, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const ring = (d: number): [number, number, number][] => {
    const w = at(gp.along - half, -d), e = at(gp.along + half, -d), out = at(gp.along + half + 0.4, -d), y = top(d);
    const westFoot = y - gp.height - 0.35, eastFoot = Math.min(westFoot, siteY(out[0], out[1]) + poolGroundY(out[0], out[1]) - 0.2);
    return [[w[0], westFoot, w[1]], [w[0], y, w[1]], [e[0], y, e[1]], [e[0], eastFoot, e[1]]];
  };
  const quad = (a: [number, number, number], b: [number, number, number], c: [number, number, number], e: [number, number, number], u0: number, u1: number) => {
    const base = pos.length / 3;
    for (const [v, u] of [[a, u0], [b, u0], [c, u1], [e, u1]] as const) { pos.push(...v); uv.push(u, v[1]); }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const stations: number[] = []; for (let d = gp.from; d < gp.to - 1e-6; d += 0.5) stations.push(d); stations.push(gp.to);
  for (let i = 0; i < stations.length - 1; i++) {
    const a = ring(stations[i]), b = ring(stations[i + 1]), u0 = stations[i], u1 = stations[i + 1];
    quad(a[0], a[1], b[1], b[0], u0, u1); // lane face
    quad(a[1], a[2], b[2], b[1], u0, u1); // top
    quad(a[2], a[3], b[3], b[2], u0, u1); // pool face
  }
  const first = ring(gp.from), last = ring(gp.to);
  quad(first[3], first[2], first[1], first[0], 0, gp.thickness); quad(last[0], last[1], last[2], last[3], 0, gp.thickness);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, material.clone());
  (mesh.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  mesh.name = "jorge-guillermo-planter"; mesh.userData.noDrape = true; mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

/** A small garden tree: a slim leaning trunk and a loose leafy crown. "olive" is grey-green with small leaves, "broadleaf" light green with large ones (IMG_2229, IMG_2773). */
function leafyTree(o: { height: number; crown: number; kind: string; seed: number }): THREE.Group {
  const g = new THREE.Group(), olive = o.kind === "olive", crownH = o.crown * 0.7, top = o.height - crownH * 0.75;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.085, top + 0.3, 8), new THREE.MeshStandardMaterial({ color: olive ? "#6d6356" : "#7a6a55", roughness: 1 }));
  trunk.position.set(0.05, (top + 0.3) / 2 - 0.15, 0); trunk.rotation.z = -0.05; trunk.castShadow = true; g.add(trunk);
  const crown = looseShrub({ width: o.crown, depth: o.crown * 0.9, height: crownH, seed: o.seed, leaf: olive ? "narrow" : "glossy", leafSize: olive ? [0.09, 0.03] : [0.24, 0.13],
    greens: olive ? ["#6f8061", "#7d8d6c", "#5f7154"] : ["#5f8f3a", "#70a044", "#528034"], stems: 3, inside: olive ? "#55634a" : "#44702c" });
  crown.position.y = top - crownH * 0.25; g.add(crown);
  g.name = "leafy-tree";
  return g;
}
/** Ground level beside the Calle Guillermo paving `d` metres north of the Jorge line. */
const guillermoGround = (d: number) => guillermoLaneY(d) - 0.33;
/** A box beside Calle Guillermo between two [station, metres north] points, standing on the lane's own ground (not draped) and carried 0.4 m below it. */
function laneBox(a: number[], b: number[], width: number, height: number, material: THREE.Material, name: string): THREE.Mesh {
  const mesh = bar([a[0], -a[1]], [b[0], -b[1]], width, height + 0.4, material, name);
  mesh.position.y = guillermoGround((a[1] + b[1]) / 2) + (height - 0.4) / 2;
  delete mesh.userData.base; mesh.userData.noDrape = true;
  return mesh;
}
/** A wall whose top falls evenly from `h0` at `a` to `h1` at `b` (IMG_2773), on the lane's own ground. */
function fallingWall(a: number[], b: number[], thickness: number, h0: number, h1: number, material: THREE.Material, name: string): THREE.Mesh {
  const p = at(a[0], -a[1]), q = at(b[0], -b[1]), len = Math.hypot(q[0] - p[0], q[1] - p[1]);
  const shape = new THREE.Shape([new THREE.Vector2(0, -0.4), new THREE.Vector2(len, -0.4), new THREE.Vector2(len, h1), new THREE.Vector2(0, h0)]);
  const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false }).translate(0, 0, -thickness / 2);
  const mesh = new THREE.Mesh(g, material);
  mesh.position.set(p[0], guillermoGround((a[1] + b[1]) / 2), p[1]); mesh.rotation.y = -Math.atan2(q[1] - p[1], q[0] - p[0]);
  mesh.name = name; mesh.userData.noDrape = true; mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
/** The no-dogs sign on the wall end (IMG_2773): a red ring and bar over a dark dog shape on a white plate. Schematic. */
function noDogsTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f4f2ee"; g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#2b2b2b"; g.fillRect(40, 60, 44, 18); g.fillRect(78, 50, 14, 14); g.fillRect(42, 76, 7, 16); g.fillRect(74, 76, 7, 16); g.fillRect(34, 54, 8, 6);
  g.strokeStyle = "#c62828"; g.lineWidth = 9; g.beginPath(); g.arc(64, 64, 46, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(32, 32); g.lineTo(96, 96); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Lawns, square tiles and cross-paths, covers, kerbs, planter walls, the bench, beds, planting, plaques, the sign and the lamps. */
export function addJorgeLane(scene: THREE.Scene): void {
  const edge = new THREE.MeshStandardMaterial({ color: "#d9d3c6", roughness: 0.95 });
  const tiles = new THREE.MeshStandardMaterial({ map: photoTexture("terracotta"), roughness: 0.9 });
  // The mapped street ribbon already sits at 0.27 m (src/boundaries.ts). These sit on it.
  scene.add(pathRibbon(data.path.edgeHalf, 0.3, edge, "jorge-path-edge"), pathRibbon(data.path.tileHalf, 0.32, tiles, "jorge-path"));
  scene.add(grass("lawn"), grass("hedge"));
  // Two-tile cross-paths over the lawn to the house fronts (IMG_2182, IMG_2229, IMG_2231), level with the lane.
  const cross = data.crossPaths;
  for (const path of cross.lines) {
    scene.add(strip(path.points, cross.edgeHalf, 0.29, edge, "jorge-cross-path-edge"), strip(path.points, cross.tileHalf, 0.31, tiles, "jorge-cross-path"));
  }
  const white = plasterMaterial("#f7f4ee");
  // The low white planter walls (IMG_2182, IMG_2230, IMG_2234): runs stopped at houses, at the open garden and at the patio thresholds.
  const wallRun = data.boundary, wallRuns = jorgeWallRuns();
  for (const [a, b] of wallRuns) scene.add(bar([a, -wallRun.offset], [b, -wallRun.offset], wallRun.thickness, wallRun.height + PATH_Y, white, "jorge-wall"));
  // Brick thresholds through the gaps into the patios, and the number niches at the planter ends.
  const brick = new THREE.MeshStandardMaterial({ map: brickTexture(), color: "#d9c4b8", roughness: 0.92 });
  for (const gap of wallRun.gaps.filter((g) => g.kind === "threshold")) {
    const mid = (data.path.edgeHalf + wallRun.thresholdOuter) / 2;
    const sill = strip([[gap.from, -mid], [gap.to, -mid]], (wallRun.thresholdOuter - data.path.edgeHalf) / 2, 0.3, brick, "jorge-threshold");
    const uv = sill.geometry.getAttribute("uv"); for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 0.5, uv.getY(i) / 0.5);
    scene.add(sill);
  }
  const face = wallRun.offset - wallRun.thickness / 2, niche = new THREE.MeshStandardMaterial({ map: nicheTexture(), roughness: 0.9 });
  for (const n of wallRun.niches) {
    const end = n.on === "end", f = jorgeAt(n.along);
    // On an end face the niche looks east along the lane, near the lane-side corner; on the long face it looks across the path.
    const p = end ? at(n.along + 0.006, -(face + 0.16)) : at(n.along, -(face - 0.006));
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.26), niche);
    plate.position.set(p[0], PATH_Y + wallRun.height * 0.5, p[1]); plate.rotation.y = yawOf(end ? f.along : f.lawn); plate.userData.base = p; plate.name = "jorge-wall-niche";
    scene.add(plate);
  }
  // The white-painted kerb round the open garden lawn (IMG_2230, IMG_2234, IMG_2235): along the lane and back along the octagon-tiled lane.
  const kerb = data.kerb;
  scene.add(bar([kerb.from - kerb.width / 2, -kerb.offset], [kerb.to, -kerb.offset], kerb.width, kerb.height + PATH_Y, white, "jorge-kerb"),
    bar([kerb.from, -kerb.offset], [kerb.from, -kerb.returnTo], kerb.width, kerb.height + PATH_Y, white, "jorge-kerb"));
  // Kerbed beds against the house fronts (IMG_2229).
  for (const bed of data.beds) {
    const [s0, s1] = bed.along, [d0, d1] = bed.offset;
    for (const [a, b] of [[[s0, d0], [s1, d0]], [[s1, d0], [s1, d1]], [[s1, d1], [s0, d1]], [[s0, d1], [s0, d0]]]) scene.add(bar(a, b, 0.1, 0.14, white, "jorge-bed-kerb"));
    const soil = strip([[s0, (d0 + d1) / 2], [s1, (d0 + d1) / 2]], (d1 - d0) / 2, 0.06, new THREE.MeshStandardMaterial({ color: "#5b4636", roughness: 1 }), "jorge-bed-soil");
    scene.add(soil);
  }
  // The west entrance from the Pintor Dalí car park (IMG_2280, IMG_2696-2698): sandstone flags between white-painted kerbs, then on between lawns.
  const west = data.west, wk = west.kerbs;
  // Laid in half-metre pieces a little above the generic street ribbon and the car-park asphalt, so they follow the ground and stay on top of both.
  const flagLine: number[][] = []; for (let s = west.from; s < west.to; s += 0.5) flagLine.push([s, 0]); flagLine.push([west.to, 0]);
  const flags = new THREE.MeshStandardMaterial({ map: photoTexture("crazy-paving"), roughness: 0.95 });
  scene.add(strip(flagLine, west.pathHalf, 0.38, flags, "jorge-west-flags"));
  // The gateway at the end of the flags (IMG_2280, IMG_2697): white piers and a flat capped lintel, green iron leaves standing open, a wall each side,
  // and the flagged cross-path in front of it.
  const gate = data.gateway, mid = data.middle;
  const portal = (o: { along: number; opening: number; pier: number; height: number; lintel: number }, name: string) => {
    const half = o.opening / 2 + o.pier / 2;
    for (const side of [-1, 1]) scene.add(bar([o.along - o.pier / 2, side * half], [o.along + o.pier / 2, side * half], o.pier, o.height + PATH_Y, white, name));
    for (const [h, w, y] of [[o.lintel, o.pier, o.height - o.lintel / 2], [0.07, o.pier + 0.14, o.height + 0.035]]) {
      const top = bar([o.along, -(half + o.pier / 2 + 0.06)], [o.along, half + o.pier / 2 + 0.06], w, h, white, name);
      top.position.y = PATH_Y + y; scene.add(top);
    }
  };
  portal(gate, "jorge-gateway");
  const iron = new THREE.MeshStandardMaterial({ color: "#1f3b2c", roughness: 0.6, metalness: 0.3 });
  for (const side of [-1, 1]) {
    const leaf = bar([gate.along + gate.pier / 2, side * (gate.opening / 2 - 0.03)], [gate.along + gate.pier / 2 + gate.opening / 2 - 0.1, side * (gate.opening / 2 + 0.12)], 0.04, 1.95, iron, "jorge-gateway-leaf");
    leaf.position.y += PATH_Y + 0.05; scene.add(leaf);
  }
  for (const w of gate.walls) {
    const sign = w.side === "lawn" ? 1 : -1, from = gate.opening / 2 + gate.pier;
    scene.add(bar([gate.along, sign * from], [gate.along, sign * w.to], 0.25, w.height + PATH_Y, white, "jorge-gateway-wall"));
  }
  const cf = gate.crossFlags;
  scene.add(strip([[cf.along, -(west.pathHalf - 0.05)], [cf.along, -cf.north]], cf.half, 0.375, flags, "jorge-west-cross-flags"), strip([[cf.along, west.pathHalf - 0.05], [cf.along, cf.south]], cf.half, 0.375, flags, "jorge-west-cross-flags"));
  // Between the gateway and the photographed east stretch (inferred, data.middle): the square-tile path carried through, and the second portal seen through the gateway.
  scene.add(pathRibbon(data.path.edgeHalf, 0.3, edge, "jorge-middle-path-edge", mid.from, mid.to), pathRibbon(data.path.tileHalf, 0.32, tiles, "jorge-middle-path", mid.from, mid.to));
  portal(mid.portal, "jorge-middle-portal");
  for (const side of [-1, 1]) {
    scene.add(bar([wk.from, side * wk.offset], [wk.to, side * wk.offset], wk.width, wk.height + PATH_Y, white, "jorge-west-kerb"),
      bar([wk.to, side * wk.offset], [wk.to, side * (wk.offset + wk.return)], wk.width, wk.height + PATH_Y, white, "jorge-west-kerb"));
  }
  // The lantana planter wall along Calle Guillermo behind the plinth lawn (IMG_2597, IMG_2773).
  const gp = data.guillermoPlanter;
  // Calle Guillermo beside the planter (IMG_2773, IMG_2774, IMG_2822): paved wall to wall, large squares at the junction, octagons with square insets beyond.
  const pave = data.guillermoPaving;
  {
    const octagons = new THREE.CanvasTexture(seawardPavingCanvas("octagonal"));
    octagons.colorSpace = THREE.SRGBColorSpace; octagons.wrapS = octagons.wrapT = THREE.RepeatWrapping; octagons.repeat.setScalar(1 / (pave.tile * 4)); octagons.anisotropy = 8;
    const squares = new THREE.MeshStandardMaterial({ map: photoTexture("terracotta"), roughness: 0.9 });
    scene.add(guillermoPaving(pave.from, pave.octagonsFrom - 6, new THREE.MeshStandardMaterial({ map: octagons, roughness: 0.9 }), "jorge-guillermo-octagons"),
      // The junction squares are about 1.4 times the octagon pitch in IMG_2773; the terracotta image holds nine 0.356 m tiles.
      guillermoPaving(pave.octagonsFrom - 6, pave.octagonsFrom, squares, "jorge-guillermo-squares", 0.356 / pave.square),
      guillermoPaving(pave.octagonsFrom, pave.to, new THREE.MeshStandardMaterial({ map: octagons, roughness: 0.9 }), "jorge-guillermo-octagons"));
    for (const cover of pave.covers) {
      const p = at(cover.at[0], -cover.at[1]), mesh = coverMesh(cover.kind);
      if (cover.kind === "square") {
        // Small grey metal grates (IMG_2773), not the red cast covers of the Jorge path.
        const plate = mesh.children[0] as THREE.Mesh; plate.scale.set(0.75, 1, 0.5);
        plate.material = new THREE.MeshStandardMaterial({ color: "#8a8a86", roughness: 0.6, metalness: 0.5 });
      }
      mesh.children[0].position.y = 0.012; mesh.position.set(p[0], guillermoLaneY(cover.at[1]), p[1]); mesh.rotation.y = yawOf(jorgeAt(0).along); mesh.userData.noDrape = true;
      scene.add(mesh);
    }
  }
  // West of Calle Guillermo (IMG_2773, IMG_2774): the lawn wall carried on to the lane with a falling top, the patio wall and hedged planters along the lane,
  // two lamp posts and the brick-on-edge border. The houses stand back behind these.
  const gw = data.guillermoWest;
  {
    const w = gw.wall, pw = gw.patioWall, pl = gw.planters;
    scene.add(fallingWall(w.from, w.to, w.thickness, w.heightFrom, w.heightTo, white, "jorge-guillermo-west-wall"));
    // The battered pier that ends the wall at the lane.
    scene.add(laneBox([w.to[0] - 0.05, w.to[1] - 0.3], [w.to[0] - 0.05, w.to[1] + 0.3], 0.5, w.heightTo + 0.08, white, "jorge-guillermo-west-pier"));
    scene.add(laneBox([pw.along, pw.from], [pw.along, pw.to], pw.thickness, pw.height, white, "jorge-guillermo-patio-wall"));
    for (const [from, to] of pl.runs) {
      scene.add(laneBox([pl.along, from], [pl.along, to], pl.thickness, pl.height, white, "jorge-guillermo-west-planter"));
      // A pier at each end of a planter, where the gateways are.
      for (const d of [from, to]) scene.add(laneBox([pl.along - 0.35, d], [pl.along + 0.3, d], 0.4, pl.height + 0.55, white, "jorge-guillermo-west-pier"));
    }
    // The other sides of the open patio behind the lawn wall, on the registry lines (data/registry_corrections.json, openPatios).
    for (let i = 0; i < gw.patio.line.length - 1; i++) scene.add(laneBox(gw.patio.line[i], gw.patio.line[i + 1], gw.patio.thickness, gw.patio.height, white, "jorge-guillermo-patio-wall"));
    const wallNorth = w.from[1] + ((w.to[1] - w.from[1]) * (gw.sign.along - w.from[0])) / (w.to[0] - w.from[0]);
    const signAt = at(gw.sign.along, -(wallNorth - w.thickness / 2 - 0.012));
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.MeshStandardMaterial({ map: noDogsTexture(), roughness: 0.6 }));
    plate.position.set(signAt[0], guillermoGround(w.from[1]) + gw.sign.height, signAt[1]); plate.rotation.y = yawOf(jorgeAt(0).lawn);
    plate.name = "jorge-guillermo-no-dogs"; plate.userData.noDrape = true; scene.add(plate);
    const b = gw.border, bricks = new THREE.MeshStandardMaterial({ map: brickTexture(), color: "#c9a898", roughness: 0.92 });
    const edgeMesh = guillermoPaving(b.from, b.to, bricks, "jorge-guillermo-brick-border", 4, b.along, b.half);
    edgeMesh.position.y += 0.006; scene.add(edgeMesh);
    for (const [s, d] of gw.lamps) {
      const p = at(s, -d), post = lanternPost({ name: "jorge-lamp" });
      post.position.set(p[0], guillermoGround(d), p[1]); post.rotation.y = yawOf(jorgeAt(0).along); post.userData.noDrape = true; scene.add(post);
    }
  }
  const planterTop = guillermoPlanterTop();
  scene.add(guillermoPlanter(planterTop, white));
  for (const cover of data.covers) {
    const spot = jorgeSide(cover.along, Math.abs(cover.offset), cover.offset >= 0 ? "lawn" : "hedge");
    if (inHouse(spot.at[0], spot.at[1])) continue;
    scene.add(place(coverMesh(cover.kind), spot.at, spot.face));
  }
  {
    const spot = jorgeSide(data.grassCover.along, data.grassCover.offset, data.grassCover.side);
    scene.add(place(coverMesh("green"), spot.at, spot.face));
  }
  for (const spot of jorgeBenchSpots()) scene.add(place(benchMesh(), spot.at, spot.face));
  for (const plaque of data.plaques) {
    const spot = jorgeSide(plaque.along, plaque.offset, plaque.side);
    if (inHouse(spot.at[0], spot.at[1])) continue;
    scene.add(place(plaqueMesh(plaque.lines), spot.at, spot.face));
  }
  scene.add(place(signMesh(), sign.at as Vec2, sign.face as Vec2));
  for (const at of [lamp.at as Vec2, jorgeSide(west.lamp.along, west.lamp.offset, west.lamp.side).at, ...data.lamps.along.map((dist) => jorgeSide(dist, data.lamps.offset, data.lamps.side).at)]) {
    if (inHouse(at[0], at[1])) continue;
    // The resort's lantern post (src/lantern-post.ts), as beside the CALLE DE JORGE plinth in IMG_2597 and on the kerb corner in IMG_2234.
    const light = lanternPost({ name: "jorge-lamp" });
    light.position.set(at[0], 0.03, at[1]); light.rotation.y = Math.atan2(line[1][0] - line[0][0], line[1][1] - line[0][1]); light.userData.base = at; scene.add(light);
  }
  // Planting is Details only and keeps every route clear with its whole footprint.
  if (scene.userData.layoutOnly) return;
  const guard = scene.userData.decorationClearance as ((x: number, z: number, r: number) => boolean) | undefined;
  const clear = (p: Vec2, r: number) => !guard || guard(p[0], p[1], r);
  const stand = (plant: THREE.Object3D, at: Vec2, yaw: number, y: number, name: string) => {
    plant.position.set(at[0], y, at[1]); plant.rotation.y = yaw; plant.name = name; plant.userData.base = at; scene.add(plant);
  };
  const sprite = (kind: "bird_of_paradise" | "tree", p: Vec2, scale: number, name: string) => {
    const holder = new THREE.Scene(); holder.userData = { ...scene.userData };
    if (!inHouse(p[0], p[1])) addSprites(holder, kind, [{ x: p[0], z: p[1], scale }]);
    for (const child of [...holder.children]) { child.name = name; scene.add(child); }
  };
  const hedgeYaw = (f: Frame) => Math.atan2(f.along[1], f.along[0]) * -1;
  const hedgeGreens = ["#36522c", "#446233", "#53713b"], shrubGreens = ["#3e5c30", "#4c6b38", "#5b7a42"];
  let seed = 401;
  // A leafy clipped hedge in each planter.
  for (const [a, b] of wallRuns) {
    // Short pieces, so each one's whole footprint clears the walking line from a planter that stands at the path edge.
    const n = Math.ceil((b - a) / 0.9), piece = (b - a) / n;
    for (let i = 0; i < n; i++) {
      const f = jorgeAt(a + (i + 0.5) * piece), p = at(a + (i + 0.5) * piece, -(wallRun.offset + 0.12));
      if (!clear(p, Math.hypot(piece, 0.5) / 2)) continue;
      const hedge = clippedHedge({ length: piece + 0.06, depth: 0.5, height: 0.72, seed: seed++, clip: 4.5, greens: hedgeGreens });
      stand(hedge, p, hedgeYaw(f), PATH_Y + wallRun.height - 0.04, "jorge-hedge");
    }
  }
  // The tall clipped hedge on the lawn in front of the CALLE DE TEODORO wall (IMG_2229, IMG_2234), with yellow lantana behind it.
  {
    const h = data.plaqueHedge, n = Math.ceil(h.length / 1.2), piece = h.length / n;
    for (let i = 0; i < n; i++) {
      const s = h.along - h.length / 2 + (i + 0.5) * piece, p = at(s, h.offset);
      if (inHouse(p[0], p[1]) || !clear(p, Math.hypot(piece, h.depth) / 2)) continue;
      stand(clippedHedge({ length: piece, depth: h.depth, height: h.height, seed: seed++, clip: 4.5, greens: hedgeGreens }), p, hedgeYaw(jorgeAt(s)), 0.03, "jorge-plaque-hedge");
    }
    const p = at(data.lantana.along, data.lantana.offset);
    if (!inHouse(p[0], p[1]) && clear(p, 0.6)) stand(looseShrub({ width: 1.3, depth: 1.1, height: 0.95, seed: seed++, leaf: "small", leafSize: [0.07, 0.045], greens: ["#55773a", "#638543", "#496a33"], stems: 5, flowers: { count: 55, colour: "#e9c224" } }), p, 0, 0.03, "jorge-lantana");
  }
  // Round clipped shrubs and the strelitzia in the kerbed beds by the houses (IMG_2229).
  for (const bed of data.beds) {
    for (const [s, d] of bed.shrubs) {
      const p = at(s, d);
      if (inHouse(p[0], p[1]) || !clear(p, 0.5)) continue;
      stand(looseShrub({ width: 0.95, depth: 0.95, height: 0.85, seed: seed++, leaf: "small", leafSize: [0.06, 0.04], greens: shrubGreens, stems: 5 }), p, 0, 0.08, "jorge-shrub");
    }
    const tall = (bed as { strelitzia?: number[] }).strelitzia;
    if (tall) sprite("bird_of_paradise", at(tall[0], tall[1]), 0.5, "jorge-strelitzia");
  }
  // Climbers trained on the walls: the bougainvilleas by house 23 and over the plaque (IMG_2229, IMG_2234) and along the garden wall behind the cactus (IMG_2183, IMG_2233).
  for (const c of [...data.climbers, west.climber]) {
    const lawnSide = c.side === "lawn", f = jorgeAt(c.from), out = lawnSide ? f.hedge : f.lawn;
    // Leaves grow along local x: westwards on a lawn-side wall, eastwards on a hedge-side one.
    const p = at(c.from, lawnSide ? c.offset : -c.offset), far = at(c.from + (lawnSide ? -c.length : c.length), lawnSide ? c.offset : -c.offset);
    if (inHouse(p[0], p[1]) || inHouse(far[0], far[1])) continue;
    stand(wallClimber({ length: c.length, height: c.height, depth: (c as { sparse?: boolean }).sparse ? 0.18 : 0.4, seed: seed++, flowers: c.flowers, flowerColour: c.colour, sparse: (c as { sparse?: boolean }).sparse }), p, yawOf(out), 0.03, "jorge-climber");
  }
  // The two trees the aerial shows on the middle lawn, as round-crowned trees (inferred), and bougainvillea over the gateway (IMG_2697).
  for (const t of data.middle.trees) {
    const p = at(t.at[0], t.at[1]);
    if (!inHouse(p[0], p[1]) && clear(p, 0.4)) stand(roundClippedTree({ trunk: t.height - t.crown * 0.7, crown: t.crown, crownHeight: t.crown * 0.85, seed: seed++ }), p, 0, 0.03, "jorge-middle-tree");
  }
  {
    const g = data.gateway, p = at(g.along - 0.05, g.opening / 2 + g.pier + 0.2);
    const over = looseShrub({ width: 2.8, depth: 0.8, height: 0.45, seed: seed++, leaf: "small", leafSize: [0.07, 0.05], greens: ["#3d5a2f", "#4a6936", "#35502a"], stems: 0, flowers: { count: 150, colour: "#96508a", size: 0.12 } });
    over.rotation.y = yawOf(jorgeAt(0).lawn);
    stand(over, at(g.along, 0.5), over.rotation.y, PATH_Y + g.height - 0.02, "jorge-gateway-bougainvillea");
    for (let i = 0; i < 3; i++) {
      const q = at(g.along - 0.75, -(g.opening / 2 + g.pier + 0.7 + i * 1.3));
      if (clear(q, 0.4)) stand(clippedHedge({ length: 1.3, depth: 0.6, height: 1.1, seed: seed++, clip: 4.5, greens: hedgeGreens }), q, yawOf(jorgeAt(0).along) + Math.PI / 2, 0.03, "jorge-gateway-hedge");
    }
    void p;
  }
  // West entrance planting: two round clipped trees on the north lawn, a shrub border along the house on the south side.
  for (const t of west.trees) {
    const p = jorgeSide(t.along, t.offset, t.side).at;
    if (!inHouse(p[0], p[1]) && clear(p, 1.2)) stand(roundClippedTree({ trunk: 1.7, crown: 2.3, crownHeight: 1.9, seed: seed++ }), p, 0, 0.03, "jorge-west-tree");
  }
  for (let s = west.border.from, i = 0; s <= west.border.to; s += west.border.every, i++) {
    if (Math.abs(s - data.gateway.crossFlags.along) < 0.95) continue; // the flagged cross-path to the house
    const p = jorgeSide(s, west.border.offset, west.border.side).at;
    if (inHouse(p[0], p[1]) || !clear(p, 0.5)) continue;
    const flowering = i % 2 === 1;
    stand(looseShrub({ width: flowering ? 1.1 : 0.9, depth: 0.9, height: flowering ? 0.95 : 0.8, seed: seed++, leaf: "small", leafSize: [0.06, 0.04], greens: flowering ? ["#55773a", "#638543", "#496a33"] : shrubGreens, stems: 5, flowers: flowering ? { count: 45, colour: "#e9c224" } : undefined }), p, 0, 0.03, "jorge-west-shrub");
  }
  // A low, dense carpet of lantana along the top of the Guillermo planter, and the spiky clump that rises from it (IMG_2773, IMG_2774).
  const level = (plant: THREE.Object3D, p: Vec2, y: number, name: string) => {
    plant.position.set(p[0], y, p[1]); plant.name = name; plant.userData.noDrape = true; scene.add(plant);
  };
  for (let d = gp.from + 0.6; d < gp.to - 0.3; d += 1.15) {
    const p = at(gp.along, -d);
    if (!clear(p, 0.3)) continue;
    const lantana = looseShrub({ width: 1.3, depth: 0.6, height: 0.36, seed: seed++, leaf: "small", leafSize: [0.055, 0.035], greens: ["#55773a", "#638543", "#496a33"], stems: 4, flowers: { count: 120, colour: seed % 3 ? "#f0b320" : "#ee9418" } });
    lantana.rotation.y = yawOf(jorgeAt(0).along);
    level(lantana, p, planterTop(d) - 0.08, "jorge-guillermo-lantana");
  }
  {
    const p = at(gp.along + gp.yucca.behind, -gp.yucca.along);
    if (clear(p, 0.9)) level(dragonTree({ height: gp.yucca.height, heads: 9, seed: 77, fork: 0.14, leaf: 1.15 }), p, planterTop(gp.yucca.along) - 0.75, "jorge-guillermo-yucca");
  }
  // West of Calle Guillermo: hedges in the lane planters, strelitzia behind the patio wall, the small tree and rose on the plinth lawn (IMG_2773, IMG_2774).
  {
    const pl = gw.planters;
    for (const [from, to] of pl.runs) {
      const n = Math.ceil((to - from - 0.5) / 0.9), piece = (to - from - 0.5) / n;
      for (let i = 0; i < n; i++) {
        const d = from + 0.25 + (i + 0.5) * piece, p = at(pl.along - 0.04, -d);
        // The guard is asked about the hedge's own narrow footprint (three circles along it), not one circle round its length.
        if (![-1, 0, 1].every((k) => clear(at(pl.along - 0.04, -(d + (k * piece) / 3)), 0.2))) continue;
        const hedge = clippedHedge({ length: piece + 0.06, depth: 0.38, height: pl.hedge, seed: seed++, clip: 4.5, greens: hedgeGreens });
        hedge.rotation.y = yawOf(jorgeAt(0).along) + Math.PI / 2;
        level(hedge, p, guillermoGround(d) + pl.height + 0.02, "jorge-guillermo-west-hedge");
      }
    }
    for (const [s, d] of gw.strelitzia) { const p = at(s, -d); sprite("bird_of_paradise", p, 0.75, "jorge-guillermo-strelitzia"); }
    const rose = at(gw.rose[0], -gw.rose[1]);
    if (clear(rose, 0.5)) stand(looseShrub({ width: 0.9, depth: 0.8, height: 0.8, seed: seed++, leaf: "small", leafSize: [0.05, 0.035], greens: ["#3f5a30", "#4a6636"], stems: 6, flowers: { count: 14, colour: "#d2476b" } }), rose, 0, 0.03, "jorge-guillermo-rose");
  }
  // Garden planting read from the photos (data.planting): small trees, bougainvillea in full bract, the shrub border at the west entrance.
  {
    const pl = data.planting;
    for (const t of pl.trees) {
      const p = at(t.at[0], t.at[1]);
      if (!inHouse(p[0], p[1]) && clear(p, 0.35)) stand(leafyTree({ height: t.height, crown: t.crown, kind: t.kind, seed: seed++ }), p, (seed * 2.4) % (Math.PI * 2), 0.03, "jorge-small-tree");
    }
    for (const b of pl.bougainvilleas) {
      const p = at(b.at[0], b.at[1]), lift = (b as { lift?: number }).lift;
      if (inHouse(p[0], p[1]) || !clear(p, 0.4)) continue;
      const mass = looseShrub({ width: b.width, depth: b.width * 0.7, height: b.height, seed: seed++, leaf: "small", leafSize: [0.07, 0.05], greens: ["#3d5a2f", "#4a6936", "#35502a"], stems: lift ? 0 : 5, flowers: { count: b.flowers, colour: b.colour, size: 0.12 } });
      mass.rotation.y = yawOf(jorgeAt(0).along);
      // A mass spilling over a wall top sits level with the wall, on the lane's own ground; a free-standing one stands on its own.
      if (lift) level(mass, p, guillermoGround(-b.at[1]) + lift, "jorge-bougainvillea"); else stand(mass, p, mass.rotation.y, 0.03, "jorge-bougainvillea");
    }
    for (const row of pl.shrubs) for (const s of row.along) {
      const p = jorgeSide(s, row.offset, row.side).at;
      if (inHouse(p[0], p[1]) || !clear(p, 0.3)) continue;
      stand(looseShrub({ width: row.width, depth: row.width, height: row.height, seed: seed++, leaf: "small", leafSize: [0.06, 0.04], greens: shrubGreens, stems: 5 }), p, 0, 0.03, "jorge-border-shrub");
    }
  }
  // One of the tall slender palms on the main-pool lawn below the lane (IMG_2764, IMG_2765).
  {
    const p = data.lawnPalm.at as Vec2;
    if (clear(p, 0.5)) stand(tallPalm({ height: data.lawnPalm.height, seed: 5 }), p, 0, poolGroundY(p[0], p[1]), "jorge-lawn-palm");
  }
  // The dragon tree on the kerbed lawn beside the lamp post (IMG_2230, IMG_2594): a stout forked trunk with a ball of sword leaves on each limb.
  {
    const p = jorgeSide(data.yucca.along, data.yucca.offset, data.yucca.side).at;
    if (!inHouse(p[0], p[1]) && clear(p, 1.2)) stand(dragonTree({ height: data.yucca.height, heads: 16, seed: 31, fork: 0.55, leaf: 1.15 }), p, 0.4, 0.03, "jorge-yucca");
  }
  // The old olive on the east lawn beside the CALLE DE JORGE plinth (IMG_2597).
  sprite("tree", jorgeSide(data.olive.along, data.olive.offset, data.olive.side).at, 0.5, "jorge-olive");
  // The candelabra tree on the open garden lawn, with the lantana bed at its foot (IMG_2183, IMG_2233).
  {
    const spot = jorgeSide(data.cactus.along, data.cactus.offset, data.cactus.side), cd = data.cactus;
    if (!inHouse(spot.at[0], spot.at[1]) && clear(spot.at, cd.spread / 2 + 0.15)) {
      stand(candelabraCactus({ height: cd.height, spread: cd.spread, seed: 19, trunks: 4 }), spot.at, 0.6, 0.03, "jorge-cactus");
      const f = jorgeAt(cd.along);
      for (const [da, dc, w, h, greens, flowers] of [[0.5, 0.9, 1.9, 0.85, ["#3f5f33", "#4d6e3a", "#35522c"], { count: 60, colour: "#e79ab8" }], [-0.9, 0.7, 1.3, 0.7, ["#6d8f45", "#7c9c4e", "#5f8140"], undefined]] as const) {
        // The bed lies on the lane side of the trunks, where the photos look at it from.
        const at: Vec2 = [spot.at[0] + f.along[0] * da + f.lawn[0] * dc, spot.at[1] + f.along[1] * da + f.lawn[1] * dc];
        stand(looseShrub({ width: w, depth: w * 0.85, height: h, seed: seed++, leaf: "small", leafSize: [0.07, 0.045], greens: [...greens], stems: 6, flowers: flowers ? { ...flowers } : undefined }), at, 0, 0.03, "jorge-cactus-shrub");
      }
    }
  }
}
