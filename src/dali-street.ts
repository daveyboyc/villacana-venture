import * as THREE from "three";
import street from "../data/dali_street.json";
import layout from "../data/dali_cervantes.json";
import sills from "../data/door_sills.json";
import skeleton from "../public/map/skeleton.json";
import { pointInRing } from "./geom";
import { surfaceTexture } from "./materials";
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

/**
 * The house-side walk is not the asphalt. IMG_2292, IMG_2267 and IMG_2268 show a
 * white kerb, a grass strip and terracotta tiles beside the parking. The measured
 * stretch between Eva and Patricia is already in door-sills; this continues that
 * edge along the other bay runs. Widths are estimated from those photos.
 */
function addSidewalk(group: THREE.Group): void {
  const tiles = new THREE.MeshStandardMaterial({ color: "#c56b45", map: surfaceTexture("paving"), roughness: 0.92 });
  const grass = new THREE.MeshStandardMaterial({ color: "#6d8a48", map: surfaceTexture("turf"), roughness: 1 });
  const kerbMat = new THREE.MeshStandardMaterial({ color: "#f7f4ee", roughness: 0.7 });
  const kerbW = 0.16, lawnW = 0.9, pathW = 1.5;
  for (const ring of layout.parking.bayRings as Vec2[][]) {
    const edge = houseEdge(ring);
    if (!edge) continue;
    const [a, b] = edge;
    const mid: Vec2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (onBuiltFootpath(mid)) continue;
    const hit = roadHit(mid);
    const n = Math.hypot(mid[0] - hit.x, mid[1] - hit.z) || 1;
    const ox = (mid[0] - hit.x) / n, oz = (mid[1] - hit.z) / n;
    const walkMid: Vec2 = [mid[0] + ox * (kerbW + lawnW + pathW / 2), mid[1] + oz * (kerbW + lawnW + pathW / 2)];
    if (insideHouse(walkMid)) continue;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const angle = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    const place = (width: number, shift: number, height: number, y: number, material: THREE.Material, name: string) => {
      const mesh = box(length, height, width, material, name, mid[0] + ox * shift, y, mid[1] + oz * shift, angle);
      mesh.userData.structural = true;
      group.add(mesh);
    };
    place(kerbW, kerbW / 2, 0.16, 0.42, kerbMat, "dali-sidewalk-kerb");
    place(lawnW, kerbW + lawnW / 2, 0.05, 0.34, grass, "dali-sidewalk-lawn");
    place(pathW, kerbW + lawnW + pathW / 2, 0.06, 0.38, tiles, "dali-sidewalk");
  }
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
