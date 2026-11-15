import * as THREE from "three";
import { looseShrub } from "./clipped-plants";
import data from "../data/barraka_boardwalk.json";
import { routeClearance, type ProtectedRoute } from "./route-clearance";
import type { Vec2 } from "./types";

/** Shared map/3D access; protects the whole walk from optional furniture. */
export const barrakaAccess: ProtectedRoute = { id: data.boardwalk.id, name: data.boardwalk.name, points: data.boardwalk.points as Vec2[], width: data.boardwalk.width };
/** Hull of the sand-filled barbecue boat, shared by the map, the model and collision. */
export const barrakaBarbecueBoat = data.boat.ring as Vec2[];
/** The sign spans the aisle; its lettering faces back towards the inland approach. */
export const barrakaSign = { point: data.sign.point as Vec2, name: data.sign.name,
  yaw: Math.atan2(barrakaAccess.points[1][0]-barrakaAccess.points[0][0], barrakaAccess.points[1][1]-barrakaAccess.points[0][1])+Math.PI };
export function barrakaSections(): { a: Vec2; b: Vec2; left: Vec2; right: Vec2; endLeft: Vec2; endRight: Vec2 }[] {
  return barrakaAccess.points.slice(1).map((b, i) => {
    const a = barrakaAccess.points[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / length * barrakaAccess.width / 2, nz = (b[0] - a[0]) / length * barrakaAccess.width / 2;
    return { a, b, left: [a[0] + nx, a[1] + nz], right: [a[0] - nx, a[1] - nz], endLeft: [b[0] + nx, b[1] + nz], endRight: [b[0] - nx, b[1] - nz] };
  });
}

/** Ground-following planks; no terrain change or collision lip. Props are Details only. */
export function addBarrakaBoardwalk(scene: THREE.Scene, groundY: (x: number, z: number) => number): void {
  const group = new THREE.Group(); group.name = "barraka-boardwalk"; group.userData.noDrape = true; scene.add(group);
  const materials = ["#6c8973", "#9c9575", "#71887b", "#b1a080"].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1, side: THREE.DoubleSide }));
  let plank = 0;
  for (const { a, b, left, right, endLeft, endRight } of barrakaSections()) {
    const count = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / data.boardwalk.plankLength);
    const mix = (p: Vec2, q: Vec2, t: number): Vec2 => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    for (let i = 0; i < count; i++) {
      const points = [mix(left, endLeft, i / count), mix(right, endRight, i / count), mix(right, endRight, (i + .94) / count), mix(left, endLeft, (i + .94) / count)];
      const positions = [0, 2, 1, 0, 3, 2].flatMap(k => [points[k][0], groundY(...points[k]) + .065, points[k][1]]);
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, materials[plank++ % materials.length]); mesh.receiveShadow = true; group.add(mesh);
    }
  }
  if (scene.userData.layoutOnly) return;
  const details = new THREE.Group(); details.name = "barraka-details"; group.add(details);
  const routes = [...(scene.userData.protectedRoutes as ProtectedRoute[] ?? []), barrakaAccess];
  const clear = (x: number, z: number, radius: number) => routeClearance(routes, x, z, radius);
  const wood = new THREE.MeshStandardMaterial({ color: "#79543a", roughness: 1 });
  const cream = new THREE.MeshStandardMaterial({ color: "#e3d5b4", roughness: 1 });
  const white = new THREE.MeshStandardMaterial({ color: "#e9e7d9", roughness: .9 });
  const box = (parent: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const [sx, sz] = data.sign.point, signRadius = Math.hypot(data.sign.width / 2, data.sign.depth / 2 + .3);
  if (clear(sx, sz, signRadius)) {
    const sign = new THREE.Group(); sign.name = data.sign.id; sign.position.set(sx, groundY(sx, sz), sz); sign.rotation.y = barrakaSign.yaw; details.add(sign);
    box(sign, 2.1, .42, .65, 0, .25, .28, white); box(sign, 2.1, 1.25, .16, 0, .65, -.12, white);
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 192;
    const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#e9e7d9"; ctx.fillRect(0, 0, 512, 192); ctx.fillStyle = "#24271e"; ctx.textAlign = "center"; ctx.font = "bold 62px serif"; ctx.fillText("BARRAKA", 256, 77); ctx.fillText("BEACH", 300, 151);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.05, .77), new THREE.MeshStandardMaterial({ map: texture, roughness: 1, side: THREE.DoubleSide })); face.position.set(0, .8, .001); sign.add(face);
    const greens = ["#5a7a3c", "#6d8a48", "#4e6c36"];
    const lower = looseShrub({ width: 1.7, depth: 0.45, height: 0.42, seed: 4, leaf: "small", leafSize: [0.055, 0.032], greens });
    lower.position.set(0, 0.42, 0.22); sign.add(lower);
    const upper = looseShrub({ width: 1.5, depth: 0.32, height: 0.36, seed: 8, leaf: "glossy", leafSize: [0.05, 0.03], greens: ["#3f6230", "#54743c", "#6a8a44"] });
    upper.position.set(0, 1.22, -0.02); sign.add(upper);
  }
  for (const [x, z] of data.seating.parasols) {
    // Includes the visible thatch fringe (larger than the pole) and the full paired beds.
    if (!clear(x, z, 2.35)) continue;
    const y = groundY(x, z), seating = new THREE.Group(); seating.position.set(x, y, z); seating.rotation.y = -.7; details.add(seating);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, 2.35, 8), wood); pole.position.y = 1.175; seating.add(pole);
    const straw = new THREE.MeshStandardMaterial({ color: "#8a7c5d", roughness: 1 });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(data.seating.radius, .65, 24, 1, true), straw); roof.position.y = 2.35; roof.castShadow = true; seating.add(roof);
    for (let k = 0; k < 48; k++) { const angle = k * Math.PI * 2 / 48; const fringe = new THREE.Mesh(new THREE.CylinderGeometry(.012, .019, .25 + k % 3 * .05, 3), straw); fringe.position.set(Math.cos(angle) * 1.5, 1.97, Math.sin(angle) * 1.5); seating.add(fringe); }
    for (const side of [-1, 1]) {
      box(seating, .8, .15, 1.95, side * .61, .37, .35, wood); box(seating, .77, .12, 1.9, side * .61, .5, .35, cream);
      for (const dx of [-.3, .3]) for (const dz of [-.76, .76]) box(seating, .09, .3, .1, side * .61 + dx, .15, .35 + dz, wood);
    }
  }
  const [bx, bz] = data.boat.centre as Vec2;
  if (clear(bx, bz, 1.70)) addBarbecueBoat(details, groundY, bx, bz);
}

/** Open metal boat: flat transom, sides that rise into a pointed bow, ash, a log mound, small flames and smoke. */
function addBarbecueBoat(parent: THREE.Group, groundY: (x: number, z: number) => number, bx: number, bz: number): void {
  const boat = new THREE.Group(); boat.name = "barraka-barbecue-boat"; boat.position.set(bx, groundY(bx, bz), bz); parent.add(boat);
  const body = new THREE.Group();
  const ring = barrakaBarbecueBoat, sternX = (ring[0][0] + ring[1][0]) / 2, sternZ = (ring[0][1] + ring[1][1]) / 2;
  // Local +X is the stem. The plan ring stays the triangle this hull is stood on.
  body.rotation.y = Math.atan2(-(ring[2][1] - sternZ), ring[2][0] - sternX);
  boat.add(body);
  const metal = new THREE.MeshStandardMaterial({ color: "#c8c2b6", roughness: 0.58, metalness: 0.24 });
  const shell = new THREE.Mesh(boatHullGeometry(), metal); shell.castShadow = shell.receiveShadow = true; shell.name = "barraka-barbecue-hull"; body.add(shell);
  const ash = new THREE.Mesh(ashGeometry(), new THREE.MeshStandardMaterial({ color: "#9a8e82", roughness: 1, side: THREE.DoubleSide })); ash.receiveShadow = true; ash.name = "barraka-barbecue-ash"; body.add(ash);
  addCharredLogs(body);
  addBoatFire(body);
}

/** Waterline extruded into a hollow hull. t = 0 is the transom, t = 1 is the stem. */
const BOAT_LENGTH = 3.2, BOAT_BEAM = 1.15, BOAT_WALL = 0.055, BOAT_STATIONS = 22;

function boatHalfBeam(t: number): number {
  const half = BOAT_BEAM / 2, shoulder = 0.6;
  if (t <= shoulder) return half * (1 - 0.045 * (t / shoulder) ** 2);
  const u = (t - shoulder) / (1 - shoulder);
  return half * 0.955 * Math.cos(u * Math.PI / 2);
}

function boatSheer(t: number): number {
  const u = Math.max(0, (t - 0.55) / 0.45);
  return 0.45 + 0.34 * u * u;
}

type BoatPt = { x: number; z: number; y: number };

function boatOutline(): BoatPt[] {
  const pts: BoatPt[] = [];
  const at = (t: number, side: 1 | -1): BoatPt => ({ x: -BOAT_LENGTH / 2 + t * BOAT_LENGTH, z: side * boatHalfBeam(t), y: boatSheer(t) });
  for (let i = 0; i <= BOAT_STATIONS; i++) pts.push(at(i / BOAT_STATIONS, 1));
  for (let i = BOAT_STATIONS - 1; i >= 0; i--) pts.push(at(i / BOAT_STATIONS, -1));
  return pts;
}

/** Right of travel. The outline is clockwise seen from above, so this points into the hull. */
function boatInward(a: BoatPt, b: BoatPt): { x: number; z: number } {
  const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz) || 1;
  return { x: dz / len, z: -dx / len };
}

function boatInset(loop: BoatPt[], dist: number): BoatPt[] {
  const m = loop.length;
  return loop.map((p, i) => {
    const a = boatInward(loop[(i + m - 1) % m], p), b = boatInward(p, loop[(i + 1) % m]);
    let x = a.x + b.x, z = a.z + b.z;
    const len = Math.hypot(x, z);
    if (len < 1e-5) return { ...p };
    x /= len; z /= len;
    const scale = dist / Math.max(0.42, x * a.x + z * a.z);
    return { x: p.x + x * scale, z: p.z + z * scale, y: p.y };
  });
}

function boatHullGeometry(): THREE.BufferGeometry {
  const outer = boatOutline(), inner = boatInset(outer, BOAT_WALL), m = outer.length;
  const pos: number[] = [], nrm: number[] = [], idx: number[] = [];
  const v = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => {
    const i = pos.length / 3, len = Math.hypot(nx, ny, nz) || 1;
    pos.push(x, y, z); nrm.push(nx / len, ny / len, nz / len); return i;
  };
  const at = (i: number): [number, number, number] => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
  const face = (a: number, b: number, c: number, d: number, want: readonly [number, number, number]) => {
    const pa = at(a), pb = at(b), pc = at(c);
    const ax = pb[0] - pa[0], ay = pb[1] - pa[1], az = pb[2] - pa[2], bx = pc[0] - pa[0], by = pc[1] - pa[1], bz = pc[2] - pa[2];
    const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    if (nx * nx + ny * ny + nz * nz < 1e-8) return;
    if (nx * want[0] + ny * want[1] + nz * want[2] < 0) idx.push(a, d, c, a, c, b);
    else idx.push(a, b, c, a, c, d);
  };
  const edgeOut = (a: BoatPt, b: BoatPt): [number, number, number] => { const n = boatInward(a, b); return [-n.x, 0, -n.z]; };
  const cornerOut = (i: number): [number, number, number] => {
    const prev = i > 0 ? edgeOut(outer[i - 1], outer[i]) : null;
    const next = i < m - 1 ? edgeOut(outer[i], outer[i + 1]) : null;
    const x = (prev?.[0] ?? 0) + (next?.[0] ?? 0), z = (prev?.[2] ?? 0) + (next?.[2] ?? 0);
    return [x, 0, z];
  };
  const ob: number[] = [], ot: number[] = [], ib: number[] = [], it: number[] = [];
  for (let i = 0; i < m; i++) {
    const n = cornerOut(i), p = outer[i], q = inner[i];
    ob.push(v(p.x, 0.02, p.z, n[0], 0, n[2])); ot.push(v(p.x, p.y, p.z, n[0], 0, n[2]));
    ib.push(v(q.x, 0.02, q.z, -n[0], 0, -n[2])); it.push(v(q.x, q.y + 0.012, q.z, -n[0], 0, -n[2]));
  }
  for (let i = 0; i < m - 1; i++) {
    const out = edgeOut(outer[i], outer[i + 1]);
    face(ob[i], ob[i + 1], ot[i + 1], ot[i], out);
    face(ib[i], it[i], it[i + 1], ib[i + 1], [-out[0], 0, -out[2]]);
  }
  // Square transom, separate from the side normals so the stern stays flat.
  const stern: [number, number, number] = [-1, 0, 0];
  const so = [v(outer[0].x, 0.02, outer[0].z, ...stern), v(outer[m - 1].x, 0.02, outer[m - 1].z, ...stern), v(outer[m - 1].x, outer[m - 1].y, outer[m - 1].z, ...stern), v(outer[0].x, outer[0].y, outer[0].z, ...stern)];
  face(so[0], so[3], so[2], so[1], stern);
  const bow: [number, number, number] = [1, 0, 0];
  const si = [v(inner[m - 1].x, 0.02, inner[m - 1].z, ...bow), v(inner[m - 1].x, inner[m - 1].y + 0.012, inner[m - 1].z, ...bow), v(inner[0].x, inner[0].y + 0.012, inner[0].z, ...bow), v(inner[0].x, 0.02, inner[0].z, ...bow)];
  face(si[0], si[1], si[2], si[3], bow);
  const lip = outer.map((p, i) => { const n = cornerOut(i), len = Math.hypot(n[0], n[2]) || 1; return v(p.x + n[0] / len * 0.016, p.y + 0.012, p.z + n[2] / len * 0.016, n[0], 0.35, n[2]); });
  const lipIn = inner.map((p, i) => { const n = cornerOut(i); return v(p.x, p.y + 0.012, p.z, n[0], 1, n[2]); });
  for (let i = 0; i < m; i++) {
    const j = (i + 1) % m;
    face(lip[i], lip[j], lipIn[j], lipIn[i], [0, 1, 0]);
    face(ot[i], ot[j], lip[j], lip[i], edgeOut(outer[i], outer[j % m === 0 ? 0 : j]));
  }
  const floor = inner.map(p => v(p.x, 0.04, p.z, 0, 1, 0));
  const contour = inner.map(p => new THREE.Vector2(p.x, p.z));
  if (polygonArea(inner) < 0) contour.reverse();
  for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(contour, [])) {
    const rev = polygonArea(inner) < 0;
    const ia = floor[rev ? inner.length - 1 - a : a], ib = floor[rev ? inner.length - 1 - b : b], ic = floor[rev ? inner.length - 1 - c : c];
    const pa = at(ia), pb = at(ib), pc = at(ic);
    const ny = (pb[2] - pa[2]) * (pc[0] - pa[0]) - (pb[0] - pa[0]) * (pc[2] - pa[2]);
    idx.push(ia, ny < 0 ? ic : ib, ny < 0 ? ib : ic);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

function polygonArea(loop: BoatPt[]): number {
  let area = 0;
  for (let i = 0; i < loop.length; i++) { const p = loop[i], q = loop[(i + 1) % loop.length]; area += p.x * q.z - q.x * p.z; }
  return area / 2;
}

function ashGeometry(): THREE.BufferGeometry {
  const rim = boatInset(boatOutline(), BOAT_WALL + 0.02), mid = rim.map(p => ({ x: p.x * 0.42, z: p.z * 0.42, y: p.y }));
  const yAt = (x: number, z: number, base: number) => base + Math.sin(x * 5.2 + z * 3.1) * 0.012 + Math.cos(z * 8.4) * 0.009;
  const pos: number[] = [], idx: number[] = [];
  const add = (x: number, y: number, z: number) => { const i = pos.length / 3; pos.push(x, y, z); return i; };
  const outer = rim.map(p => add(p.x, yAt(p.x, p.z, 0.30), p.z));
  const inner = mid.map(p => add(p.x, yAt(p.x, p.z, 0.335), p.z));
  const centre = add(0.02, 0.35, 0);
  const tri = (a: number, b: number, c: number) => {
    const ax = pos[b * 3] - pos[a * 3], az = pos[b * 3 + 2] - pos[a * 3 + 2], bx = pos[c * 3] - pos[a * 3], bz = pos[c * 3 + 2] - pos[a * 3 + 2];
    if (az * bx - ax * bz < 0) idx.push(a, c, b); else idx.push(a, b, c);
  };
  for (let i = 0; i < outer.length; i++) {
    const j = (i + 1) % outer.length;
    tri(outer[i], outer[j], inner[j]); tri(outer[i], inner[j], inner[i]); tri(inner[i], inner[j], centre);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** Irregular charred lengths, crossed into a mound rather than laid in a row. */
function addCharredLogs(parent: THREE.Group): void {
  const pieces: { h: number; r0: number; r1: number; x: number; y: number; z: number; rot: [number, number, number]; color: string; sides: number }[] = [
    { h: 0.74, r0: 0.072, r1: 0.048, x: -0.02, y: 0.39, z: 0.03, rot: [0.14, 0.28, 0.1], color: "#3a2a22", sides: 6 },
    { h: 0.58, r0: 0.06, r1: 0.05, x: 0.08, y: 0.40, z: -0.08, rot: [0.22, 1.25, -0.18], color: "#4a3228", sides: 5 },
    { h: 0.66, r0: 0.055, r1: 0.038, x: -0.14, y: 0.38, z: 0.1, rot: [-0.16, 1.85, 0.28], color: "#6a4630", sides: 7 },
    { h: 0.46, r0: 0.064, r1: 0.042, x: 0.2, y: 0.37, z: 0.06, rot: [0.34, 0.7, -0.22], color: "#3f2c22", sides: 5 },
    { h: 0.52, r0: 0.048, r1: 0.034, x: -0.22, y: 0.39, z: -0.06, rot: [-0.28, 2.35, 0.16], color: "#5c4030", sides: 6 },
    { h: 0.4, r0: 0.058, r1: 0.03, x: 0.02, y: 0.48, z: -0.02, rot: [0.85, 0.45, 0.72], color: "#3a2a22", sides: 5 },
    { h: 0.36, r0: 0.046, r1: 0.036, x: 0.14, y: 0.5, z: 0.04, rot: [-0.74, 1.7, 0.95], color: "#6a4630", sides: 6 },
    { h: 0.42, r0: 0.04, r1: 0.026, x: -0.1, y: 0.49, z: 0.05, rot: [1.05, 2.45, -0.48], color: "#4e3428", sides: 7 },
    { h: 0.3, r0: 0.042, r1: 0.024, x: 0.04, y: 0.58, z: 0.01, rot: [0.52, 0.95, 1.25], color: "#3a2a22", sides: 5 },
    { h: 0.27, r0: 0.036, r1: 0.028, x: -0.05, y: 0.6, z: -0.04, rot: [-1.15, 0.35, 0.55], color: "#5a3c2c", sides: 6 },
    { h: 0.33, r0: 0.044, r1: 0.02, x: 0.1, y: 0.56, z: 0.07, rot: [0.78, 2.65, -0.92], color: "#6a4630", sides: 5 },
  ];
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  for (const piece of pieces) {
    let mat = materials.get(piece.color);
    if (!mat) materials.set(piece.color, mat = new THREE.MeshStandardMaterial({ color: piece.color, roughness: 0.94 }));
    const geo = new THREE.CylinderGeometry(piece.r0, piece.r1, piece.h, piece.sides, 1); geo.rotateZ(Math.PI / 2);
    const log = new THREE.Mesh(geo, mat);
    log.position.set(piece.x, piece.y, piece.z); log.rotation.set(...piece.rot); log.castShadow = log.receiveShadow = true;
    parent.add(log);
  }
}

/** Several soft flames in the mound, and pale smoke. The group is left out of the static batch. */
function addBoatFire(parent: THREE.Group): void {
  const fire = new THREE.Group(); fire.name = "barraka-barbecue-fire"; fire.userData.dynamic = true; fire.position.set(0.02, 0.58, 0); parent.add(fire);
  const flameMap = flameBlob(), smokeMap = smokePuff();
  const tongues = [
    { x: -0.02, y: 0.1, z: 0.02, w: 0.18, h: 0.3, rate: 10.4, phase: 0.2 },
    { x: -0.14, y: 0.0, z: 0.08, w: 0.13, h: 0.2, rate: 13.2, phase: 1.4 },
    { x: 0.15, y: -0.02, z: -0.07, w: 0.14, h: 0.22, rate: 8.3, phase: 2.2 },
    { x: 0.05, y: 0.16, z: -0.04, w: 0.12, h: 0.24, rate: 11.6, phase: 0.8 },
    { x: -0.06, y: -0.04, z: -0.11, w: 0.11, h: 0.16, rate: 15.1, phase: 2.8 },
    { x: 0.1, y: 0.06, z: 0.1, w: 0.1, h: 0.18, rate: 9.1, phase: 1.9 },
  ].map(spec => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameMap, transparent: true, depthWrite: false, opacity: 0.82, color: "#ffffff" }));
    sprite.center.set(0.5, 0.18); sprite.position.set(spec.x, spec.y, spec.z); sprite.scale.set(spec.w, spec.h, 1); fire.add(sprite);
    return { ...spec, sprite };
  });
  const puffs = Array.from({ length: 7 }, (_, i) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeMap, transparent: true, depthWrite: false, opacity: 0.35, color: "#c8c3bb" }));
    sprite.center.set(0.5, 0.12); fire.add(sprite);
    return { sprite, seed: i * 0.41 + 0.15 };
  });
  // A Group callback never runs; this sprite is drawn, so the flicker does.
  tongues[0].sprite.onBeforeRender = () => {
    const t = performance.now() * 0.001;
    for (const flame of tongues) {
      const flick = Math.sin(t * flame.rate + flame.phase), flick2 = Math.sin(t * flame.rate * 1.73 + flame.phase * 2.1);
      flame.sprite.scale.set(flame.w * (0.88 + flick2 * 0.12), flame.h * (0.78 + flick * 0.2 + flick2 * 0.06), 1);
      flame.sprite.position.set(flame.x + Math.sin(t * 2.7 + flame.phase) * 0.012, flame.y + Math.max(0, flick) * 0.018, flame.z + Math.cos(t * 2.2 + flame.phase) * 0.012);
      (flame.sprite.material as THREE.SpriteMaterial).opacity = 0.55 + Math.abs(flick) * 0.38;
    }
    for (const puff of puffs) {
      const life = 2.8, u = ((t * 0.36 + puff.seed) % life) / life, rise = u * u;
      puff.sprite.position.set(Math.sin(puff.seed * 5.2 + t * 0.55) * 0.1 * (0.35 + u), 0.16 + rise * 1.7, Math.cos(puff.seed * 3.7 + t * 0.42) * 0.08 * (0.35 + u));
      const width = 0.26 + rise * 0.9;
      puff.sprite.scale.set(width, width * 1.25, 1);
      (puff.sprite.material as THREE.SpriteMaterial).opacity = Math.sin(u * Math.PI) * 0.55;
    }
  };
}

/** Soft yellow-orange blobs. Not a cone, and not a photograph. */
function flameBlob(): THREE.CanvasTexture {
  const size = 64, canvas = document.createElement("canvas"); canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  const blob = (x: number, y: number, r: number, inner: string, mid: string) => {
    const shade = g.createRadialGradient(x, y, 1, x, y, r);
    shade.addColorStop(0, inner); shade.addColorStop(0.5, mid); shade.addColorStop(1, "rgba(255,90,10,0)");
    g.fillStyle = shade; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  };
  blob(32, 44, 20, "rgba(255,248,220,1)", "rgba(255,176,40,0.9)");
  blob(23, 36, 13, "rgba(255,220,80,0.95)", "rgba(255,110,16,0.55)");
  blob(41, 34, 12, "rgba(255,196,48,0.95)", "rgba(255,90,12,0.5)");
  blob(32, 24, 10, "rgba(255,252,236,1)", "rgba(255,160,40,0.45)");
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A soft grey puff. Schematic, not a photograph of smoke. */
function smokePuff(): THREE.CanvasTexture {
  const size = 64, canvas = document.createElement("canvas"); canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!, shade = g.createRadialGradient(32, 34, 2, 32, 30, 30);
  shade.addColorStop(0, "rgba(108,104,98,0.9)"); shade.addColorStop(0.42, "rgba(150,146,140,0.45)"); shade.addColorStop(1, "rgba(176,172,166,0)");
  g.fillStyle = shade; g.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
