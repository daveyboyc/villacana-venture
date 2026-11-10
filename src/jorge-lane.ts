import * as THREE from "three";
import data from "../data/jorge_lane.json";
import skeleton from "../public/map/skeleton.json";
import { pointInRing } from "./geom";
import { photoTexture, plasterMaterial, surfaceTexture } from "./materials";
import type { Vec2 } from "./types";
import { clippedHedge, looseShrub } from "./clipped-plants";
import { candelabraCactus } from "./candelabra-cactus";
import { addSprites } from "./sprites";

/** Calle Jorge: square tiles, covers, grass, the hedge wall, benches, the yucca and cactus, plaques, the sign and lamps. */
export const jorgeLane = data;
const sign = data.sign, lamp = data.lamp;
const BENCH_LENGTH = 1.45;
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
export function jorgeBenchSpots(): { at: Vec2; face: Vec2 }[] {
  return data.benches.along.map((dist) => {
    const f = jorgeAt(dist);
    const at: Vec2 = [f.p[0] + f.lawn[0] * data.benches.offset, f.p[1] + f.lawn[1] * data.benches.offset];
    return { at, face: f.hedge };
  }).filter((b) => !inHouse(b.at[0], b.at[1]));
}
/** A point off the centreline. `face` points back toward the path. */
export function jorgeSide(dist: number, offset: number, side: string): { at: Vec2; face: Vec2 } {
  const f = jorgeAt(dist);
  const lawnSide = side !== "hedge";
  const n = lawnSide ? f.lawn : f.hedge;
  const at: Vec2 = [f.p[0] + n[0] * offset, f.p[1] + n[1] * offset];
  return { at, face: lawnSide ? f.hedge : f.lawn };
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

function lampMesh(): THREE.Group {
  const g = new THREE.Group(); g.name = "jorge-lamp";
  const dark = new THREE.MeshStandardMaterial({ color: "#1c2420", roughness: 0.5, metalness: 0.25 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 2.7, 8), dark);
  post.position.y = 1.35; post.castShadow = true; g.add(post);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.28), new THREE.MeshStandardMaterial({ color: "#d9dde2", roughness: 0.25, metalness: 0.1 }));
  head.position.y = 2.75; g.add(head);
  return g;
}

function place(group: THREE.Group, at: Vec2, face: Vec2): THREE.Group {
  group.position.set(at[0], 0, at[1]);
  group.rotation.y = yawOf(face);
  group.userData.base = at;
  return group;
}

function verge(side: "lawn" | "hedge"): THREE.Mesh {
  const inner = data.verges.inner, outer = side === "lawn" ? data.verges.lawnOuter : data.verges.hedgeOuter;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const total = lengthOf();
  for (let s = SHOWN.from; s < Math.min(total, SHOWN.to) - 0.5; s += 2) {
    const a = jorgeAt(s), b = jorgeAt(Math.min(total, s + 2));
    const pick = (f: Frame, d: number): Vec2 => {
      const n = side === "lawn" ? f.lawn : f.hedge;
      return [f.p[0] + n[0] * d, f.p[1] + n[1] * d];
    };
    const corners = [pick(a, inner), pick(a, outer), pick(b, outer), pick(b, inner)];
    if (corners.some((p) => inHouse(p[0], p[1]))) continue;
    const base = pos.length / 3;
    // Turf in metres (1.6 m swatch), across and along, so it is not stretched into stripes.
    const across = [inner, outer, outer, inner], along = [s, s, s + 2, s + 2];
    corners.forEach((p, i) => { pos.push(p[0], 0.025, p[1]); uv.push(across[i] / 1.6, along[i] / 1.6); });
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: surfaceTexture("turf"), color: "#6d8f4c", roughness: 1, side: THREE.DoubleSide }));
  mesh.name = `jorge-grass-${side}`; mesh.receiveShadow = true;
  return mesh;
}

/** Square terracotta with joints along and across the path. IMG_2182, IMG_2230, IMG_2234. World-aligned UVs put the grid on the diagonal. */
function pathRibbon(half: number, y: number, material: THREE.Material, name: string): THREE.Mesh {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const total = lengthOf();
  for (let s = SHOWN.from; s < Math.min(total, SHOWN.to) - 0.4; s += 2) {
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
function coverTexture(kind: "round" | "square"): THREE.CanvasTexture {
  const s = 256, c = document.createElement("canvas"); c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, s, s);
  g.fillStyle = "#7a3030";
  if (kind === "round") {
    g.beginPath(); g.arc(s / 2, s / 2, s * 0.46, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#c4a48a"; g.lineWidth = 3;
    for (const r of [0.16, 0.28, 0.38]) { g.beginPath(); g.arc(s / 2, s / 2, s * r, 0, Math.PI * 2); g.stroke(); }
    g.strokeStyle = "#e8d7c4"; g.lineWidth = 1.2;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      g.beginPath(); g.moveTo(s / 2 + Math.cos(a) * s * 0.18, s / 2 + Math.sin(a) * s * 0.18);
      g.lineTo(s / 2 + Math.cos(a) * s * 0.36, s / 2 + Math.sin(a) * s * 0.36); g.stroke();
    }
    g.fillStyle = "#f3e6d4"; g.font = "bold 22px Arial, sans-serif"; g.textAlign = "center";
    g.save(); g.translate(s / 2, s / 2); g.rotate(-0.6); g.fillText("SANEA", 0, -s * 0.3); g.restore();
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
  const round = kind !== "square";
  const g = new THREE.Group(); g.name = `jorge-cover-${round ? "round" : "square"}`;
  // Flush with the tiles (IMG_2596): a thin plate whose top is a few millimetres above the path at 0.32 m.
  const geo = round ? new THREE.CylinderGeometry(0.3, 0.3, 0.02, 24) : new THREE.BoxGeometry(0.46, 0.02, 0.46);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: "#9a3830", map: coverTexture(round ? "round" : "square"), roughness: 0.5, metalness: 0.35,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
  }));
  mesh.position.y = 0.315; mesh.receiveShadow = true; mesh.renderOrder = 4; g.add(mesh);
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

/** Grass both sides, square tiles, covers, the white hedge wall, benches, shrubs, the yucca, the cactus, plaques, the sign and the lamps. */
export function addJorgeLane(scene: THREE.Scene): void {
  const edge = new THREE.MeshStandardMaterial({ color: "#d9d3c6", roughness: 0.95 });
  const tiles = new THREE.MeshStandardMaterial({ map: photoTexture("terracotta"), roughness: 0.9 });
  // The mapped street ribbon already sits at 0.27 m (src/boundaries.ts). These sit on it.
  scene.add(pathRibbon(data.path.edgeHalf, 0.3, edge, "jorge-path-edge"), pathRibbon(data.path.tileHalf, 0.32, tiles, "jorge-path"));
  scene.add(verge("lawn"), verge("hedge"));
  const white = plasterMaterial("#f7f4ee");
  // The low white planter wall (IMG_2230, IMG_2234): continuous runs where the photographed stretch is open, stopped at houses.
  const wallRun = data.boundary, step = 0.5, runs: [number, number][] = [];
  for (let s = wallRun.from; s < wallRun.to; s += step) {
    const f = jorgeAt(s), p: Vec2 = [f.p[0] + f.hedge[0] * wallRun.offset, f.p[1] + f.hedge[1] * wallRun.offset];
    const open = !inHouse(p[0], p[1]) && !inHouse(p[0] + f.along[0] * step, p[1] + f.along[1] * step);
    const last = runs[runs.length - 1];
    if (open && last && Math.abs(last[1] - s) < 1e-6) last[1] = s + step; else if (open) runs.push([s, s + step]);
  }
  const wallRuns = runs.filter(([a, b]) => b - a >= 0.8);
  for (const [a, b] of wallRuns) {
    const mid = jorgeAt((a + b) / 2), len = b - a;
    const p: Vec2 = [mid.p[0] + mid.hedge[0] * wallRun.offset, mid.p[1] + mid.hedge[1] * wallRun.offset];
    const yaw = Math.atan2(mid.along[0], mid.along[1]);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, len), white);
    wall.position.set(p[0], 0.275, p[1]); wall.rotation.y = yaw; wall.userData.base = p; wall.castShadow = wall.receiveShadow = true; wall.name = "jorge-wall";
    scene.add(wall);
  }
  for (const cover of data.covers) {
    const spot = jorgeSide(cover.along, Math.abs(cover.offset), cover.offset >= 0 ? "lawn" : "hedge");
    if (inHouse(spot.at[0], spot.at[1])) continue;
    scene.add(place(coverMesh(cover.kind), spot.at, spot.face));
  }
  for (const spot of jorgeBenchSpots()) scene.add(place(benchMesh(), spot.at, spot.face));
  for (const plaque of data.plaques) {
    const spot = jorgeSide(plaque.along, plaque.offset, plaque.side);
    if (inHouse(spot.at[0], spot.at[1])) continue;
    scene.add(place(plaqueMesh(plaque.lines), spot.at, spot.face));
  }
  scene.add(place(signMesh(), sign.at as Vec2, sign.face as Vec2));
  for (const at of [lamp.at as Vec2, ...data.lamps.along.map((dist) => jorgeSide(dist, data.lamps.offset, data.lamps.side).at)]) {
    if (inHouse(at[0], at[1])) continue;
    const light = lampMesh();
    light.position.set(at[0], 0, at[1]); light.userData.base = at; scene.add(light);
  }
  // Planting is Details only and keeps every route clear with its whole footprint.
  if (scene.userData.layoutOnly) return;
  const guard = scene.userData.decorationClearance as ((x: number, z: number, r: number) => boolean) | undefined;
  const clear = (p: Vec2, r: number) => !guard || guard(p[0], p[1], r);
  const stand = (plant: THREE.Object3D, at: Vec2, yaw: number, y: number, name: string) => {
    plant.position.set(at[0], y, at[1]); plant.rotation.y = yaw; plant.name = name; plant.userData.base = at; scene.add(plant);
  };
  let seed = 401;
  // A leafy clipped hedge along the top of each wall run, in pieces up to 1.4 m.
  for (const [a, b] of wallRuns) {
    const n = Math.ceil((b - a) / 1.4), piece = (b - a) / n;
    for (let i = 0; i < n; i++) {
      const f = jorgeAt(a + (i + 0.5) * piece), p: Vec2 = [f.p[0] + f.hedge[0] * wallRun.offset, f.p[1] + f.hedge[1] * wallRun.offset];
      if (!clear(p, Math.hypot(piece, 0.6) / 2)) continue;
      const hedge = clippedHedge({ length: piece, depth: 0.6, height: 0.62, seed: seed++, clip: 4.5, greens: ["#36522c", "#446233", "#53713b"] });
      stand(hedge, p, Math.atan2(f.along[1], f.along[0]) * -1, 0.53, "jorge-hedge");
    }
  }
  // Round clipped shrubs on the lawn side (IMG_2229, IMG_2182).
  for (const dist of data.plants.along) {
    const f = jorgeAt(dist), p: Vec2 = [f.p[0] + f.lawn[0] * data.plants.offset, f.p[1] + f.lawn[1] * data.plants.offset];
    if (inHouse(p[0], p[1]) || !clear(p, 0.55)) continue;
    stand(looseShrub({ width: 1.05, depth: 1.0, height: 0.95, seed: seed++, leaf: "small", leafSize: [0.07, 0.045], greens: ["#3e5c30", "#4c6b38", "#5b7a42"], stems: 5 }), p, 0, 0.03, "jorge-shrub");
  }
  // The yucca rising behind the wall (IMG_2230): the resort's 3D yucca, smaller than its default size.
  {
    const spot = jorgeSide(data.yucca.along, data.yucca.offset, data.yucca.side), holder = new THREE.Scene(); holder.userData = { ...scene.userData };
    if (!inHouse(spot.at[0], spot.at[1])) addSprites(holder, "yucca", [{ x: spot.at[0], z: spot.at[1], scale: 0.6 }]);
    for (const child of [...holder.children]) { child.name = "jorge-yucca"; scene.add(child); }
  }
  // The candelabra tree in the garden behind the wall, with the lantana bed at its foot (IMG_2183, IMG_2233).
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
