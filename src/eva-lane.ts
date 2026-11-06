import * as THREE from "three";
import data from "../data/eva_lane.json";
import { pointInRing } from "./geom";
import { surfaceTexture } from "./materials";
import { addSprites, type SpriteKind } from "./sprites";
import { refine, siteY } from "./terrain";
import type { Vec2 } from "./types";

/**
 * Calle Eva as photographed (IMG_2336, IMG_2504, IMG_2677, IMG_2676, IMG_2503, IMG_2549,
 * IMG_2551, IMG_2552, IMG_2553): four big square terracotta tiles across with pale joints,
 * a grey exposed-aggregate margin each side, white rounded kerbs where a bed or lawn is kerbed,
 * flush lawn where it is not. Each run has an axis; s is metres along it, c metres to its right.
 * The mapped centreline, its route width and walking stay as they were.
 */
export const evaLane = data;
type Run = (typeof data.runs)[number];

class Axis {
  readonly points: Vec2[];
  readonly at0: number[] = [0];
  constructor(points: number[][]) {
    this.points = points as Vec2[];
    for (let i = 1; i < points.length; i++) this.at0.push(this.at0[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  get length(): number { return this.at0[this.at0.length - 1]; }
  private right(i: number): Vec2 {
    const a = this.points[i], b = this.points[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
  }
  /** Point at s, c; at an inner vertex the offset follows the mitre so strips meet without gaps. */
  at(s: number, c: number): Vec2 {
    const n = this.points.length;
    let i = 0;
    while (i < n - 2 && s > this.at0[i + 1]) i++;
    const a = this.points[i], b = this.points[i + 1], seg = this.at0[i + 1] - this.at0[i];
    const t = seg ? (s - this.at0[i]) / seg : 0;
    let r = this.right(i);
    const vertex = Math.abs(t - 1) < 1e-6 && i < n - 2 ? i + 1 : Math.abs(t) < 1e-6 && i > 0 ? i : -1;
    if (vertex > 0) {
      const p = this.right(vertex - 1), q = this.right(vertex), m: Vec2 = [p[0] + q[0], p[1] + q[1]], ml = Math.hypot(...m);
      const cos = (m[0] * q[0] + m[1] * q[1]) / ml;
      r = [m[0] / ml / cos, m[1] / ml / cos];
    }
    return [a[0] + (b[0] - a[0]) * t + r[0] * c, a[1] + (b[1] - a[1]) * t + r[1] * c];
  }
  /** s values from s0 to s1 including every axis vertex between them. */
  stations(s0: number, s1: number): number[] {
    return [s0, ...this.at0.filter((v) => v > s0 + 1e-6 && v < s1 - 1e-6), s1];
  }
}

const axes = new Map<string, Axis>(data.runs.map((r) => [r.id, new Axis(r.axis)]));
const axisOf = (run: Run) => axes.get(run.id)!;

/** A run-local polyline [[s, c], ...] as world points; along-axis legs follow the axis vertices. */
function localLine(run: Run, line: number[][]): Vec2[] {
  const axis = axisOf(run), out: Vec2[] = [];
  for (let i = 0; i < line.length; i++) {
    const [s, c] = line[i];
    if (i && Math.abs(line[i - 1][1] - c) < 1e-9) {
      const [s0] = line[i - 1], forward = s > s0;
      const mids = axis.stations(Math.min(s0, s), Math.max(s0, s)).slice(1, -1);
      for (const m of forward ? mids : mids.reverse()) out.push(axis.at(m, c));
    }
    out.push(axis.at(s, c));
  }
  return out;
}

/** Ring of a rectangle in run coordinates, following the axis. */
export function evaRect(run: Run, s0: number, s1: number, c0: number, c1: number): Vec2[] {
  const axis = axisOf(run), st = axis.stations(s0, s1);
  return [...st.map((s) => axis.at(s, c0)), ...[...st].reverse().map((s) => axis.at(s, c1))];
}

export type EvaSurface = { id: string; kind: "paving" | "margin" | "kerb" | "bed" | "lawn" | "planter" | "drain"; ring: Vec2[]; text: string };

function kerbRing(line: Vec2[], width: number): Vec2[] {
  const left: Vec2[] = [], right: Vec2[] = [];
  line.forEach((p, i) => {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const n: Vec2 = [-(b[1] - a[1]) / l * width / 2, (b[0] - a[0]) / l * width / 2];
    left.push([p[0] + n[0], p[1] + n[1]]); right.push([p[0] - n[0], p[1] - n[1]]);
  });
  return [...left, ...right.reverse()];
}

/** Every built surface as a world ring, for the map and the checks. */
export function evaLaneSurfaces(): EvaSurface[] {
  const out: EvaSurface[] = [], h = data.bandHalf, m = data.margin;
  for (const run of data.runs) {
    const L = axisOf(run).length, text = `${run.name}: ${run.axisBasis} · ${run.evidence.join(", ")}`;
    out.push({ id: run.id + "-paving", kind: "paving", ring: evaRect(run, 0, L, -h, h), text });
    for (const [side, c0, c1] of [["l", -h - m, -h], ["r", h, h + m]] as const) out.push({ id: `${run.id}-margin-${side}`, kind: "margin", ring: evaRect(run, 0, L, c0, c1), text: "Grey exposed-aggregate margin, 0.14 m estimated" });
    for (const k of run.kerbs) out.push({ id: k.id, kind: "kerb", ring: kerbRing(localLine(run, k.line), data.kerb.width), text: `White rounded kerb · ${k.evidence.join(", ")}` });
    for (const b of run.beds) out.push({ id: b.id, kind: "bed", ring: evaRect(run, b.s[0], b.s[1], b.c[0], b.c[1]), text: `Kerbed planted bed, depth estimated · ${b.evidence.join(", ")}` });
    for (const l of run.lawns) out.push({ id: l.id, kind: "lawn", ring: evaRect(run, l.s[0], l.s[1], l.c[0], l.c[1]), text: "Lawn flush with the margin; extent estimated" });
    for (const sp of run.spurs) out.push({ id: sp.id, kind: "paving", ring: evaRect(run, sp.s[0], sp.s[1], sp.c[0], sp.c[1]), text: `${sp.note} · ${sp.evidence.join(", ")}` });
    for (const p of run.planters) out.push({ id: p.id, kind: "planter", ring: evaRect(run, p.s[0], p.s[1], p.c[0], p.c[1]), text: `${p.note} · ${p.evidence.join(", ")}` });
    for (const d of run.drains) out.push({ id: d.id, kind: "drain", ring: evaRect(run, d.s - d.width / 2, d.s + d.width / 2, -h, h), text: `Slot drain across the path · ${d.evidence.join(", ")}` });
  }
  return out;
}

const clipQuads: Vec2[][] = data.runs.flatMap((run) => {
  const axis = axisOf(run), [c0, c1] = run.clip, st = axis.stations(0, axis.length);
  return st.slice(1).map((s, i) => {
    const q: Vec2[] = [axis.at(st[i], c0), axis.at(s, c0), axis.at(s, c1), axis.at(st[i], c1)];
    const area = q.reduce((sum, p, k) => { const r = q[(k + 1) % 4]; return sum + p[0] * r[1] - r[0] * p[1]; }, 0);
    return area < 0 ? q.reverse() : q;
  });
});

/** Cut the generic lane ribbon and its white edging out of the photographed Eva stretches. */
export function outsideEvaLane(ring: Vec2[]): Vec2[][] {
  const xs = ring.map((p) => p[0]), zs = ring.map((p) => p[1]);
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  // Bounding boxes overlap: a long quad can cross a small ring with all four corners far away.
  const near = clipQuads.filter((q) => Math.max(...q.map((p) => p[0])) > x0 && Math.min(...q.map((p) => p[0])) < x1 && Math.max(...q.map((p) => p[1])) > z0 && Math.min(...q.map((p) => p[1])) < z1);
  if (!near.length) return [ring];
  const area = (poly: Vec2[]) => Math.abs(poly.reduce((sum, p, i) => { const q = poly[(i + 1) % poly.length]; return sum + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
  const clip = (poly: Vec2[], a: Vec2, b: Vec2, sign: number): Vec2[] => {
    const out: Vec2[] = [], side = (p: Vec2) => sign * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], dp = side(p), dq = side(q);
      if (dp >= 0) out.push(p);
      if ((dp >= 0) !== (dq >= 0)) { const t = dp / (dp - dq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    return out;
  };
  let parts = THREE.ShapeUtils.triangulateShape(ring.map((p) => new THREE.Vector2(...p)), []).map((ids) => ids.map((i) => ring[i]));
  for (const quad of near) {
    parts = parts.flatMap((part) => {
      const outside: Vec2[][] = []; let inside = part;
      for (let e = 0; e < 4 && inside.length; e++) {
        const p = quad[e], q = quad[(e + 1) % 4], fragment = clip(inside, p, q, -1);
        if (area(fragment) > 1e-8) outside.push(fragment);
        inside = clip(inside, p, q, 1);
      }
      return outside;
    });
  }
  return parts;
}

const outline = evaLaneSurfaces().filter((s) => s.kind !== "kerb");
/** Inside the photographed lane, its beds or lawn edges: generated walls, gates and clutter give way. */
export const inEvaLane = (x: number, z: number): boolean => outline.some((s) => pointInRing(x, z, s.ring)) || clipQuads.some((q) => pointInRing(x, z, q));
export function suppressInEvaLane<T extends { gardenWalls: Vec2[]; gardenGates: Vec2[]; props: { x: number; z: number }[] }>(skeleton: T): void {
  skeleton.gardenWalls = skeleton.gardenWalls.filter(([x, z]) => !inEvaLane(x, z));
  skeleton.gardenGates = skeleton.gardenGates.filter(([x, z]) => !inEvaLane(x, z));
  skeleton.props = skeleton.props.filter((p) => !inEvaLane(p.x, p.z));
}

// ---- Materials: drawn here, no photo pixels are copied.
function canvasTexture(draw: (g: CanvasRenderingContext2D, size: number) => void, size = 512): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = c.height = size;
  draw(c.getContext("2d")!, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}
const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
/** Four by four big terracotta squares with pale grey joints; one repeat is one band width. */
function tileTexture(): THREE.CanvasTexture {
  return canvasTexture((g, size) => {
    const pitch = size / data.tile.columns, joint = pitch * data.tile.joint / (data.tile.size + data.tile.joint);
    g.fillStyle = "#8e877d"; g.fillRect(0, 0, size, size);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const k = i * 4 + j, x = i * pitch + joint / 2, y = j * pitch + joint / 2, w = pitch - joint;
      const r = 150 + hash(k) * 20, gg = 104 + hash(k + 40) * 14, b = 82 + hash(k + 80) * 10;
      g.fillStyle = `rgb(${r | 0},${gg | 0},${b | 0})`; g.fillRect(x, y, w, w);
      for (let d = 0; d < 160; d++) {
        const px = x + hash(k * 999 + d) * w, py = y + hash(k * 777 + d * 3) * w, a = .015 + hash(d + k) * .03;
        g.fillStyle = hash(d * 7 + k) > .5 ? `rgba(240,190,160,${a})` : `rgba(90,40,25,${a})`;
        g.beginPath(); g.arc(px, py, 1 + hash(d * 13 + k) * 3, 0, Math.PI * 2); g.fill();
      }
    }
  });
}
/** Grey exposed aggregate: cement with dark and light pebbles. */
function aggregateTexture(): THREE.CanvasTexture {
  return canvasTexture((g, size) => {
    g.fillStyle = "#8a847a"; g.fillRect(0, 0, size, size);
    for (let d = 0; d < 9000; d++) {
      const v = hash(d * 3.1);
      g.fillStyle = v > .75 ? "#45413c" : v > .5 ? "#b9b2a6" : "#6f6a62";
      g.beginPath(); g.arc(hash(d) * size, hash(d * 1.7 + 3) * size, .8 + hash(d * 5.3) * 2.2, 0, Math.PI * 2); g.fill();
    }
  }, 256);
}
function drainTexture(): THREE.CanvasTexture {
  return canvasTexture((g, size) => {
    g.fillStyle = "#3a1f15"; g.fillRect(0, 0, size, size);
    g.fillStyle = "#8b4a2c";
    for (let x = 0; x < size; x += 16) g.fillRect(x, 0, 10, size);
  }, 128);
}

// ---- Geometry
function strip(run: Run, s0: number, s1: number, c0: number, c1: number, y: number, uv: (s: number, c: number) => [number, number]): THREE.BufferGeometry {
  const axis = axisOf(run), st = axis.stations(s0, s1), pos: number[] = [], uvs: number[] = [], index: number[] = [];
  st.forEach((s, i) => {
    for (const c of [c0, c1]) { const [x, z] = axis.at(s, c); pos.push(x, y, z); uvs.push(...uv(s, c)); }
    if (i) { const k = (i - 1) * 2; index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(index);
  return g;
}

/** A swept profile along a world polyline: rounded white kerb or a square planter wall. */
function sweep(line: Vec2[], profile: [number, number][], base: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const frames = line.map((p, i) => {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return { p, n: [-(b[1] - a[1]) / l, (b[0] - a[0]) / l] as Vec2 };
  });
  const v = (f: { p: Vec2; n: Vec2 }, [x, y]: [number, number]) => [f.p[0] + f.n[0] * x, base + y, f.p[1] + f.n[1] * x];
  for (let i = 1; i < frames.length; i++) for (let k = 1; k < profile.length; k++) {
    const a = v(frames[i - 1], profile[k - 1]), b = v(frames[i - 1], profile[k]), c = v(frames[i], profile[k]), d = v(frames[i], profile[k - 1]);
    pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  }
  for (const f of [frames[0], frames[frames.length - 1]]) for (let k = 2; k < profile.length; k++) pos.push(...v(f, profile[0]), ...v(f, profile[k - 1]), ...v(f, profile[k]));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

function onGround(geometry: THREE.BufferGeometry, material: THREE.Material, name: string, structural = true): THREE.Mesh {
  const mesh = new THREE.Mesh(refine(geometry, siteY, new THREE.Matrix4()), material);
  mesh.geometry.computeVertexNormals();
  mesh.name = name; mesh.userData.noDrape = true; mesh.userData.evaLane = true; mesh.userData.structural = structural;
  mesh.castShadow = !!(material as THREE.MeshStandardMaterial).userData.shadow; mesh.receiveShadow = true;
  return mesh;
}

export function addEvaLane(scene: THREE.Scene): void {
  const group = new THREE.Group(); group.name = data.id; group.userData.noDrape = true; scene.add(group);
  const L = data.levels, h = data.bandHalf, m = data.margin, k = data.kerb, band = data.tile.columns * (data.tile.size + data.tile.joint);
  const tiles = new THREE.MeshStandardMaterial({ map: tileTexture(), roughness: .9, side: THREE.DoubleSide });
  const aggregate = new THREE.MeshStandardMaterial({ map: aggregateTexture(), roughness: 1, side: THREE.DoubleSide });
  const turf = new THREE.MeshStandardMaterial({ color: "#6d8a48", map: surfaceTexture("turf"), roughness: 1, side: THREE.DoubleSide });
  const soil = new THREE.MeshStandardMaterial({ color: "#5a4634", roughness: 1, side: THREE.DoubleSide });
  const white = new THREE.MeshStandardMaterial({ color: "#f6f3ec", roughness: .75, side: THREE.DoubleSide }); white.userData.shadow = true;
  const drain = new THREE.MeshStandardMaterial({ map: drainTexture(), roughness: .6, metalness: .3 });
  const kerbProfile: [number, number][] = [[-k.width / 2, 0], [-k.width / 2, k.height * .55], [-k.width * .3, k.height * .9], [0, k.height], [k.width * .3, k.height * .9], [k.width / 2, k.height * .55], [k.width / 2, 0]];
  for (const run of data.runs) {
    const len = axisOf(run).length;
    group.add(onGround(strip(run, 0, len, -h, h, L.paving, (s, c) => [(c + h) / band, s / band]), tiles, run.id + "-paving"));
    for (const [c0, c1] of [[-h - m, -h], [h, h + m]]) group.add(onGround(strip(run, 0, len, c0, c1, L.margin, (s, c) => [c / .8, s / .8]), aggregate, run.id + "-margin"));
    for (const sp of run.spurs) group.add(onGround(strip(run, sp.s[0], sp.s[1], sp.c[0], sp.c[1], L.paving + .002, (s, c) => [(s - sp.s[0]) / band, c / band]), tiles, sp.id));
    for (const l of run.lawns) group.add(onGround(strip(run, l.s[0], l.s[1], l.c[0], l.c[1], L.lawn, (s, c) => [c / 1.6, s / 1.6]), turf, l.id));
    for (const b of run.beds) group.add(onGround(strip(run, b.s[0], b.s[1], b.c[0], b.c[1], L.soil, (s, c) => [c, s]), soil, b.id));
    for (const kb of run.kerbs) group.add(onGround(sweep(localLine(run, kb.line), kerbProfile, L.lawn - .03), white, kb.id));
    for (const p of run.planters) {
      const ring = evaRect(run, p.s[0], p.s[1], p.c[0], p.c[1]), wall: [number, number][] = [[-p.wall / 2, 0], [-p.wall / 2, L.planterHeight], [p.wall / 2, L.planterHeight], [p.wall / 2, 0]];
      group.add(onGround(sweep([...ring, ring[0]], wall, L.lawn - .03), white, p.id));
      group.add(onGround(strip(run, p.s[0], p.s[1], p.c[0] + p.wall, p.c[1] - p.wall, L.lawn + L.planterHeight - .05, (s, c) => [c, s]), soil, p.id + "-soil"));
    }
    for (const d of run.drains) group.add(onGround(strip(run, d.s - d.width / 2, d.s + d.width / 2, -h, h, L.paving + .004, (s, c) => [(c + h) / .25, s / d.width]), drain, d.id));
  }
  if (scene.userData.layoutOnly) return;
  const guard = scene.userData.decorationClearance as ((x: number, z: number, radius: number) => boolean) | undefined;
  const clear = (p: Vec2, r: number) => !guard || guard(p[0], p[1], r);
  const hedgeMat = { clipped: new THREE.MeshStandardMaterial({ color: "#3f6633", map: surfaceTexture("turf"), roughness: 1 }), oleander: new THREE.MeshStandardMaterial({ color: "#35512e", map: surfaceTexture("turf"), roughness: 1 }) };
  const green = new THREE.MeshStandardMaterial({ color: "#203f31", roughness: .7 }), opal = new THREE.MeshStandardMaterial({ color: "#e3dfb8", roughness: .45 });
  const details = new THREE.Group(); details.name = data.id + "-details"; details.userData.noDrape = true;
  for (const run of data.runs) {
    const axis = axisOf(run);
    for (const b of run.beds) {
      const hd = b.hedge; if (!hd) continue;
      // Pieces no longer than 1.2 m, each guarded with its whole visible footprint.
      const pieces = Math.max(1, Math.ceil((hd.s[1] - hd.s[0]) / 1.2)), step = (hd.s[1] - hd.s[0]) / pieces;
      for (let i = 0; i < pieces; i++) {
        const a = axis.at(hd.s[0] + i * step, hd.c), z = axis.at(hd.s[0] + (i + 1) * step, hd.c), mid: Vec2 = [(a[0] + z[0]) / 2, (a[1] + z[1]) / 2], len = Math.hypot(z[0] - a[0], z[1] - a[1]);
        if (!clear(mid, Math.hypot(len, hd.depth) / 2)) continue;
        const box = new THREE.Mesh(new THREE.BoxGeometry(len + .02, hd.height, hd.depth), hedgeMat[hd.kind as "clipped" | "oleander"]);
        box.position.set(mid[0], siteY(...mid) + L.soil + hd.height / 2 - .02, mid[1]); box.rotation.y = -Math.atan2(z[1] - a[1], z[0] - a[0]);
        box.name = b.id + "-hedge"; box.castShadow = box.receiveShadow = true; details.add(box);
      }
    }
    for (const lamp of run.lamps) {
      const p = axis.at(lamp.s, lamp.c); if (!clear(p, .25)) continue;
      const y = siteY(...p) + L.lawn, post = new THREE.Mesh(new THREE.CylinderGeometry(.035, .05, 2.8, 8), green);
      post.position.set(p[0], y + 1.4, p[1]);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(.16, .1, .35, 4), opal); head.position.set(p[0], y + 2.9, p[1]);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(.23, .2, 4), green); cap.position.set(p[0], y + 3.16, p[1]);
      for (const o of [post, head, cap]) { o.name = lamp.id; o.castShadow = true; details.add(o); }
    }
    for (const plant of run.plants) {
      const p = axis.at(plant.s, plant.c), holder = new THREE.Scene(); holder.userData = { ...scene.userData };
      addSprites(holder, plant.kind as SpriteKind, [{ x: p[0], z: p[1], scale: plant.scale, y: siteY(...p) + L.lawn }]);
      for (const child of [...holder.children]) { child.name = plant.id; child.userData.noDrape = true; details.add(child); }
    }
  }
  group.add(details);
}
