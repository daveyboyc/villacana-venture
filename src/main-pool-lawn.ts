import * as THREE from "three";
import layout from "../data/main_pool.json";
import data from "../data/main_pool_lawn.json";
import { clippedHedge, looseShrub } from "./clipped-plants";
import { centroid, closestOnSegment, pointInRing } from "./geom";
import { plasterMaterial } from "./materials";
import { accessSection, LOWER_POOL_Y, poolLevelPoint } from "./pool-levels";
import { addSprites } from "./sprites";
import type { Vec2 } from "./types";

/** Pink paths, flagstones, lawn walls and the step finish (data/main_pool_lawn.json).
 * The glass fence the November photos show stays out: Dave, 2026-10-11, and again 2026-11-12.
 * World metres, the same frame as the camera pins. The lawn surface is the lowered pool deck, so
 * every piece is built at that height and not draped again. */

const Y = LOWER_POOL_Y;
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

/** Pink paths and the flagstone apron, for the map. */
export function lawnGroundRings(): Vec2[][] {
  const half = data.paths.width / 2;
  return [...data.paths.lines.map((line) => ribbonRing(line as Vec2[], half)), data.apron.ring as Vec2[]];
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

function ribbonMesh(points: Vec2[], half: number, y: number, material: THREE.Material, name: string): THREE.Mesh {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  let run = 0;
  const at = (i: number): Vec2 => {
    const p = points[Math.max(0, Math.min(points.length - 1, i))];
    const q = points[Math.max(0, Math.min(points.length - 1, i + (i === 0 ? 1 : -1)))];
    return i === 0 || i === points.length - 1 ? [p[0] - q[0], p[1] - q[1]] : [points[i + 1][0] - points[i - 1][0], points[i + 1][1] - points[i - 1][1]];
  };
  points.forEach((p, i) => {
    if (i) run += Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]);
    const d = at(i), n = Math.hypot(d[0], d[1]) || 1;
    const nx = (d[1] / n) * half, nz = (-d[0] / n) * half;
    for (const side of [-1, 1]) { pos.push(p[0] + nx * side, y, p[1] + nz * side); uv.push(run / 2.4, side * half); }
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

function riserTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = 64; c.height = 32;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f4efe6"; g.fillRect(0, 0, 64, 32);
  g.strokeStyle = "#2a4f86"; g.lineWidth = 2;
  for (let x = 4; x < 64; x += 12) { g.strokeRect(x, 4, 8, 24); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
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

function addSteps(group: THREE.Group, details: boolean): void {
  const tile = new THREE.MeshStandardMaterial({ map: riserTexture(), roughness: 0.8 });
  const marble = new THREE.MeshStandardMaterial({ color: "#f7f4ee", roughness: 0.35 });
  const iron = new THREE.MeshStandardMaterial({ color: "#1c2420", roughness: 0.4, metalness: 0.55 });
  for (let i = 0; i < stepCount; i++) {
    const t = i / stepCount, u = (i + 1) / stepCount;
    const A = accessSection(flight, t), B = accessSection(flight, u);
    const top = Y * t, foot = Y * u;
    const dx = B.r[0] - B.l[0], dz = B.r[1] - B.l[1], len = Math.hypot(dx, dz) || 1;
    const yaw = -Math.atan2(dz, dx) + Math.PI / 2;
    const mid: Vec2 = [(B.l[0] + B.r[0]) / 2, (B.l[1] + B.r[1]) / 2];
    const nose = box("enrique-nosing", 0.09, 0.025, len, marble, mid, top + 0.02, yaw);
    group.add(nose);
    const riser = box("enrique-riser", 0.02, Math.max(0.08, top - foot), len, tile, mid, (top + foot) / 2, yaw);
    group.add(riser);
    if (details) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, Math.hypot(B.r[0] - A.r[0], B.r[1] - A.r[1]) || 0.2, 6), iron);
      rail.name = "enrique-handrail";
      rail.position.set((A.r[0] + B.r[0]) / 2, top + 0.9, (A.r[1] + B.r[1]) / 2);
      rail.lookAt(B.r[0], top + 0.9, B.r[1]); rail.rotateX(Math.PI / 2);
      group.add(rail);
    }
  }
  if (!details) return;
  const bed = layout.levels.enriqueSteps.bed.wall.map(poolLevelPoint);
  bed.forEach((p, i) => {
    if (i % 2) return;
    const shrub = looseShrub({ width: 1.15, depth: 0.7, height: 0.42, seed: 80 + i, leaf: "small", leafSize: [0.05, 0.035], greens: ["#4f7038", "#5d8242", "#3f5c2e"], stems: 4, flowers: { count: 70, colour: i % 4 ? "#f0b320" : "#ee7a18" } });
    shrub.position.set(p[0], Y + 0.4, p[1]); shrub.name = "enrique-lantana"; group.add(shrub);
  });
  const palm = fanPalm();
  const at = bed[Math.floor(bed.length / 2)];
  palm.position.set(at[0], Y + 0.35, at[1]); palm.name = "enrique-fan-palm"; group.add(palm);
}

function addShop(group: THREE.Group): void {
  const at = data.shop.at as Vec2;
  const c = document.createElement("canvas"); c.width = 256; c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1d4e86"; g.fillRect(0, 0, 256, 64);
  g.fillStyle = "#f4f7fb"; g.font = "22px sans-serif"; g.fillText("BAR & RESTAURANTE", 16, 40);
  const cloth = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(c), roughness: 0.9, side: THREE.DoubleSide });
  (cloth.map as THREE.CanvasTexture).colorSpace = THREE.SRGBColorSpace;
  const awning = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.7), cloth);
  awning.name = "enrique-awning"; awning.position.set(at[0], 2.35, at[1]); awning.rotation.x = -0.15;
  group.add(awning);
  const board = box("enrique-menu", 0.7, 0.9, 0.04, plasterMaterial("#f7f4ee"), [at[0] - 1.4, at[1] + 0.4], 1.7);
  group.add(board);
  const lamp = box("enrique-lantern", 0.22, 0.36, 0.22, new THREE.MeshStandardMaterial({ color: "#d9d3c4", roughness: 0.4 }), [at[0] + 1.3, at[1] - 0.2], 2.5);
  group.add(lamp);
}

function addDeck(group: THREE.Group, mainRing: Vec2[], toddlerRing: Vec2[]): void {
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
    for (const p of [inner[i], outer[i], outer[j], inner[j]]) pos.push(p[0], Y + 0.025, p[1]);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    if (dz / n > 0.45) for (const p of [inner[i], pushOut([samples[i]], 0.55)[0], pushOut([samples[j]], 0.55)[0], inner[j]]) matPos.push(p[0], Y + 0.03, p[1]);
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

export function addMainPoolLawn(scene: THREE.Scene, mainRing: Vec2[], toddlerRing: Vec2[], details: boolean): void {
  const group = new THREE.Group();
  group.name = "main-pool-lawn"; group.userData.noDrape = true;
  const pink = new THREE.MeshStandardMaterial({ color: "#c47468", roughness: 0.82, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const flags = new THREE.MeshStandardMaterial({ map: flagstoneTexture(), roughness: 0.95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  flags.map!.repeat.set(1.4, 1.4);
  for (const line of data.paths.lines) group.add(ribbonMesh(line as Vec2[], data.paths.width / 2, Y + 0.05, pink, "lawn-pink-path"));
  const apron = new THREE.Shape((data.apron.ring as Vec2[]).map(([x, z]) => new THREE.Vector2(x, -z)));
  const apronMesh = new THREE.Mesh(new THREE.ShapeGeometry(apron).rotateX(-Math.PI / 2), flags);
  apronMesh.position.y = Y + 0.04; apronMesh.name = "lawn-flagstone-apron"; apronMesh.receiveShadow = true; group.add(apronMesh);
  const white = plasterMaterial("#fbf8f0");
  for (const wall of data.rooms.walls) {
    const pts = wall.points as Vec2[];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      group.add(box("lawn-white-wall", len, wall.height, 0.22, white, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], Y + wall.height / 2, -Math.atan2(b[1] - a[1], b[0] - a[0])));
    }
  }
  const showerAt = data.hedge.shower as Vec2;
  group.add(box("lawn-shower-wall", 0.9, 1.9, 0.18, white, showerAt, Y + 0.95));
  addDeck(group, mainRing, toddlerRing);
  addSteps(group, details);
  if (details) {
    addShop(group);
    const cap = new THREE.MeshStandardMaterial({ color: "#f3efe4", roughness: 0.5 });
    const body = new THREE.MeshStandardMaterial({ color: "#2c4638", roughness: 0.7 });
    for (const at of data.fittings.bollards as Vec2[]) {
      const bollard = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.48, 8), body);
      post.position.y = 0.24; bollard.add(post);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.12, 8), cap);
      top.position.y = 0.52; bollard.add(top);
      bollard.position.set(at[0], Y, at[1]); bollard.name = "lawn-bollard"; group.add(bollard);
    }
    const slats = new THREE.MeshStandardMaterial({ color: "#2a2e30", roughness: 0.6, metalness: 0.3 });
    for (const at of data.fittings.bins as Vec2[]) {
      const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.72, 10), slats);
      bin.position.set(at[0], Y + 0.36, at[1]); bin.name = "lawn-bin"; group.add(bin);
    }
    const grate = new THREE.MeshStandardMaterial({ color: "#3a3e40", roughness: 0.45, metalness: 0.5 });
    for (const drain of data.fittings.drains) {
      const along = drain.along as Vec2, n = Math.hypot(along[0], along[1]) || 1;
      group.add(box("lawn-slot-drain", 1.6, 0.02, 0.22, grate, drain.at as Vec2, Y + 0.055, -Math.atan2(along[1] / n, along[0] / n)));
    }
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: "#d5d8dc", metalness: 0.8, roughness: 0.25 }));
    head.position.set(showerAt[0], Y + 1.7, showerAt[1] + 0.12); head.name = "lawn-shower"; group.add(head);
    const [h0, h1] = data.hedge.points as Vec2[];
    const hlen = Math.hypot(h1[0] - h0[0], h1[1] - h0[1]);
    const pieces = Math.ceil(hlen / 1.3);
    for (let i = 0; i < pieces; i++) {
      const t = (i + 0.5) / pieces;
      const hedge = clippedHedge({ length: hlen / pieces + 0.05, depth: 0.55, height: 0.7, seed: 30 + i, clip: 4.2, greens: ["#2f4a28", "#3d5c32", "#4c6b3c"] });
      hedge.position.set(h0[0] + (h1[0] - h0[0]) * t, Y, h0[1] + (h1[1] - h0[1]) * t);
      hedge.rotation.y = Math.atan2(h1[0] - h0[0], h1[1] - h0[1]);
      hedge.name = "lawn-sea-hedge"; group.add(hedge);
    }
    for (const plant of data.rooms.plants) {
      const at = plant.at as Vec2;
      if (plant.kind === "strelitzia") {
        const holder = new THREE.Scene(); holder.userData = { ...scene.userData, layoutOnly: false };
        addSprites(holder, "bird_of_paradise", [{ x: at[0], y: Y, z: at[1], scale: 0.55 }]);
        for (const child of holder.children) { child.name = "lawn-strelitzia"; scene.add(child); }
      } else {
        const shrub = looseShrub({ width: 1.5, depth: 1.1, height: 0.45, seed: 17, leaf: "small", leafSize: [0.04, 0.03], greens: ["#b7b8b0", "#9aa096", "#c8c9c2"], stems: 6 });
        shrub.position.set(at[0], Y, at[1]); shrub.name = "lawn-silver-bush"; group.add(shrub);
      }
    }
  }
  scene.add(group);
}
