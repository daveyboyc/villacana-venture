import * as THREE from "three";
import street from "../data/dali_street.json";
import layout from "../data/dali_cervantes.json";
import sills from "../data/door_sills.json";
import skeleton from "../public/map/skeleton.json";
import { pointInRing } from "./geom";
import { surfaceTexture } from "./materials";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

const fence = layout.barriers.find((b) => b.id === street.fence.barrierId);
if (!fence) throw new Error("Dalí fence missing from data/dali_cervantes.json");

/** Mapped fence, without the last segment the coastal gate already dresses. */
export function daliDressedFence(): Vec2[] {
  return fence!.points.slice(0, fence!.points.length - street.fence.stopBeforeLastSegments) as Vec2[];
}

function outward(a: Vec2, b: Vec2): Vec2 {
  const road = layout.roads.find((r) => r.id === "dali")!;
  const mid: Vec2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let best = Infinity, qx = mid[0], qz = mid[1];
  for (let i = 0; i < road.points.length - 1; i++) {
    const p = road.points[i], q = road.points[i + 1];
    const dx = q[0] - p[0], dz = q[1] - p[1], l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((mid[0] - p[0]) * dx + (mid[1] - p[1]) * dz) / l2));
    const x = p[0] + dx * t, z = p[1] + dz * t, d = Math.hypot(mid[0] - x, mid[1] - z);
    if (d < best) { best = d; qx = x; qz = z; }
  }
  const vx = mid[0] - qx, vz = mid[1] - qz, n = Math.hypot(vx, vz) || 1;
  return [vx / n, vz / n];
}

function box(w: number, h: number, d: number, material: THREE.Material, name: string, x: number, y: number, z: number, angle: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.y = angle;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

const road = layout.roads.find((r) => r.id === "dali")!;

function roadHit(p: Vec2): { d: number; x: number; z: number } {
  let best = Infinity, x = p[0], z = p[1];
  for (let i = 0; i < road.points.length - 1; i++) {
    const a = road.points[i], b = road.points[i + 1];
    const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l2));
    const qx = a[0] + dx * t, qz = a[1] + dz * t, d = Math.hypot(p[0] - qx, p[1] - qz);
    if (d < best) { best = d; x = qx; z = qz; }
  }
  return { d: best, x, z };
}

/** House side of a bay: the edge farthest from the asphalt. */
function houseEdge(ring: Vec2[]): [Vec2, Vec2] | null {
  const order = ring.map((p, i) => ({ i, d: roadHit(p).d })).sort((a, b) => b.d - a.d);
  const i = order[0].i, j = order[1].i, n = ring.length;
  if (Math.min(Math.abs(i - j), n - Math.abs(i - j)) !== 1) return null;
  return [ring[i], ring[j]];
}

function onBuiltFootpath(p: Vec2): boolean {
  const k = sills.footpathKerb;
  const dx = p[0] - k.origin[0], dz = p[1] - k.origin[1];
  const along = dx * k.along[0] + dz * k.along[1];
  const across = dx * k.toward[0] + dz * k.toward[1];
  return along > -2 && along < k.length + 2 && across > -1 && across < k.width + 1;
}

function insideHouse(p: Vec2): boolean {
  return skeleton.buildings.some((b) => pointInRing(p[0], p[1], b.ring as Vec2[]));
}

/** Asphalt datum shared with the Dalí road meshes and door-sills (`daliSurface`). */
const ASPHALT = 0.272;
/** levels_survey dali-footpath-kerb: the path stands 0.10–0.15 m above that asphalt. */
const KERB = 0.12;

function shift(p: Vec2, ox: number, oz: number, d: number): Vec2 {
  return [p[0] + ox * d, p[1] + oz * d];
}
function atHeight(p: Vec2, aboveAsphalt: number): number[] {
  return [p[0], siteY(p[0], p[1]) + ASPHALT + aboveAsphalt, p[1]];
}
function quad(out: number[], a: number[], b: number[], c: number[], d: number[]) {
  out.push(...a, ...b, ...c, ...a, ...c, ...d);
}
function top(out: number[], a: Vec2, b: Vec2, c: Vec2, d: Vec2, h: number) {
  quad(out, atHeight(a, h), atHeight(b, h), atHeight(c, h), atHeight(d, h));
}
/** Vertical face, from the asphalt up to `h`, so the step is a kerb and not a colour change. */
function riser(out: number[], a: Vec2, b: Vec2, h: number) {
  quad(out, atHeight(a, 0), atHeight(a, h), atHeight(b, h), atHeight(b, 0));
}
function solid(positions: number[], material: THREE.Material, name: string): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.userData.noDrape = true;
  mesh.userData.structural = true;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

/**
 * The house-side walk is a step up from the asphalt. IMG_2291, IMG_2292 and
 * IMG_2293 show a white kerb, grass and terracotta tiles 0.10–0.15 m above the
 * parking. The measured stretch between Eva and Patricia is already in
 * door-sills; this continues that kerb along the other bay runs. Widths there
 * are estimated from those photos.
 */
function addSidewalk(group: THREE.Group): void {
  const tiles = new THREE.MeshStandardMaterial({ color: "#c56b45", map: surfaceTexture("paving"), roughness: 0.92, side: THREE.DoubleSide });
  const grass = new THREE.MeshStandardMaterial({ color: "#6d8a48", map: surfaceTexture("turf"), roughness: 1, side: THREE.DoubleSide });
  const kerbMat = new THREE.MeshStandardMaterial({ color: "#f7f4ee", roughness: 0.7, side: THREE.DoubleSide });
  const kerbW = 0.16, lawnW = 0.9, pathW = 1.5;
  const path: number[] = [], lawn: number[] = [], stone: number[] = [];
  for (const ring of layout.parking.bayRings as Vec2[][]) {
    const edge = houseEdge(ring);
    if (!edge) continue;
    const [a, b] = edge;
    const mid: Vec2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (onBuiltFootpath(mid)) continue;
    const hit = roadHit(mid);
    const n = Math.hypot(mid[0] - hit.x, mid[1] - hit.z) || 1;
    const ox = (mid[0] - hit.x) / n, oz = (mid[1] - hit.z) / n;
    const walkMid = shift(mid, ox, oz, kerbW + lawnW + pathW / 2);
    if (insideHouse(walkMid)) continue;
    const k0 = a, k1 = b;
    const l0 = shift(a, ox, oz, kerbW), l1 = shift(b, ox, oz, kerbW);
    const g0 = shift(a, ox, oz, kerbW + lawnW), g1 = shift(b, ox, oz, kerbW + lawnW);
    const p0 = shift(a, ox, oz, kerbW + lawnW + pathW), p1 = shift(b, ox, oz, kerbW + lawnW + pathW);
    top(stone, k0, k1, l1, l0, KERB + 0.012);
    riser(stone, k0, k1, KERB + 0.012);
    top(lawn, l0, l1, g1, g0, KERB - 0.01);
    top(path, g0, g1, p1, p0, KERB);
    riser(path, g0, g1, KERB);
  }
  if (stone.length) group.add(solid(stone, kerbMat, "dali-sidewalk-kerb"), solid(lawn, grass, "dali-sidewalk-lawn"), solid(path, tiles, "dali-sidewalk"));
}

/** Plinth, curb and the house-side sidewalk. Hedge and lanterns are Details. */
export function addDaliStreet(scene: THREE.Scene): void {
  const group = new THREE.Group();
  group.name = "dali-street-scene";
  const concrete = new THREE.MeshStandardMaterial({ color: "#e4e0d4", roughness: 0.92 });
  const white = new THREE.MeshStandardMaterial({ color: "#f4f1e8", roughness: 0.8 });
  const dressed = daliDressedFence();
  const { plinthHeight, plinthThickness, curbHeight, curbWidth, curbOffset, curbBase } = street.fence;
  for (let i = 0; i < dressed.length - 1; i++) {
    const a = dressed[i], b = dressed[i + 1];
    const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz);
    const angle = Math.atan2(dz, dx);
    const mid: Vec2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const [ox, oz] = outward(a, b);
    const plinth = box(length, plinthHeight, plinthThickness, concrete, street.fence.id, mid[0], plinthHeight / 2, mid[1], -angle);
    plinth.userData.structural = true;
    group.add(plinth);
    group.add(box(length, curbHeight, curbWidth, white, street.fence.id + "-curb", mid[0] - ox * curbOffset, curbBase + curbHeight / 2, mid[1] - oz * curbOffset, -angle));
  }
  addSidewalk(group);
  scene.add(group);
  if (scene.userData.layoutOnly) return;
  const clear = scene.userData.decorationClearance as ((x: number, z: number, radius: number) => boolean) | undefined;
  if (!clear) return;
  const hedgeMat = new THREE.MeshStandardMaterial({ color: "#3d6834", map: surfaceTexture("turf"), roughness: 1 });
  const hedge = street.hedge;
  const hedgeGroup = new THREE.Group();
  hedgeGroup.name = hedge.id;
  for (let i = 0; i < dressed.length - 1; i++) {
    const a = dressed[i], b = dressed[i + 1];
    const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz) || 1;
    const [ox, oz] = outward(a, b);
    const step = hedge.step;
    for (let at = 0; at < length; at += step) {
      const piece = Math.min(step, length - at);
      const x = a[0] + dx / length * (at + piece / 2) + ox * hedge.outward;
      const z = a[1] + dz / length * (at + piece / 2) + oz * hedge.outward;
      if (!clear(x, z, Math.hypot(piece / 2, hedge.depth / 2))) continue;
      hedgeGroup.add(box(piece, hedge.height, hedge.depth, hedgeMat, hedge.id, x, hedge.base + hedge.height / 2, z, -Math.atan2(dz, dx)));
    }
  }
  if (hedgeGroup.children.length) group.add(hedgeGroup);

  const black = new THREE.MeshStandardMaterial({ color: "#161616", roughness: 0.4, metalness: 0.4 });
  const glass = new THREE.MeshStandardMaterial({ color: "#ffe7a3", roughness: 0.2, emissive: "#c48a2a", emissiveIntensity: 0.85 });
  const lamps = new THREE.Group();
  lamps.name = street.lanterns.id;
  const h = street.lanterns.height, head = street.lanterns.head;
  for (const [x, z] of street.lanterns.points) {
    if (!clear(x, z, street.lanterns.radius)) continue;
    const lamp = new THREE.Group();
    lamp.name = street.lanterns.id;
    lamp.position.set(x, 0, z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, h - head, 8), black);
    post.position.y = (h - head) / 2;
    post.castShadow = true;
    const bodyY = h - head * 0.62;
    const body = new THREE.Mesh(new THREE.BoxGeometry(head * 0.7, head * 0.62, head * 0.7), glass);
    body.position.y = bodyY;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(head * 0.62, head * 0.42, 4), black);
    cap.position.y = h - head * 0.16;
    cap.rotation.y = Math.PI / 4;
    lamp.add(post, body, cap);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.035, head * 0.62, 0.035), black);
      frame.position.set(sx * head * 0.34, bodyY, sz * head * 0.34);
      lamp.add(frame);
    }
    lamps.add(lamp);
  }
  if (lamps.children.length) group.add(lamps);
}
