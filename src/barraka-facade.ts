import * as THREE from "three";
import data from "../data/barraka_facade.json";
import { centroid, closestOnSegment } from "./geom";
import { routeClearance, type ProtectedRoute } from "./route-clearance";
import type { Vec2 } from "./types";

/** Registry part for Barraka. The ring is not moved; only the wall height and the openings change. */
export const BARRAKA_BUILDING = data.buildingId;
/** Parapet height in metres. Photo proportion on IMG_2618, not the 3 m registry storey. */
export const barrakaWallHeight = data.wallHeight;
/** The white upper storey starts here. Below it the paseo and beach fronts are glazed. */
export const barrakaLowerHead = data.awning.y;

type Face = { start: number; count: number };
type Station = { x: number; z: number; yaw: number; nx: number; nz: number; tx: number; tz: number };

function facePoints(ring: Vec2[], face: Face): Vec2[] {
  const pts: Vec2[] = [];
  for (let i = 0; i < face.count; i++) pts.push(ring[(face.start + i) % ring.length]);
  pts.push(ring[(face.start + face.count) % ring.length]);
  return pts;
}

function faceLength(pts: Vec2[]): number {
  let length = 0;
  for (let i = 0; i < pts.length - 1; i++) length += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  return length;
}

/** A point `at` metres from the start of the face, `out` metres outside the wall (negative is onto the roof). */
function station(pts: Vec2[], at: number, out: number, cx: number, cz: number): Station {
  let remain = at;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz) || 1;
    if (remain <= length || i === pts.length - 2) {
      const t = Math.max(0, Math.min(1, remain / length));
      const tx = dx / length, tz = dz / length;
      let nx = tz, nz = -tx;
      const x = a[0] + dx * t, z = a[1] + dz * t;
      if (nx * (x - cx) + nz * (z - cz) < 0) { nx = -nx; nz = -nz; }
      return { x: x + nx * out, z: z + nz * out, yaw: Math.atan2(nx, nz), nx, nz, tx, tz };
    }
    remain -= length;
  }
  const last = pts[pts.length - 1];
  return { x: last[0], z: last[1], yaw: 0, nx: 0, nz: 1, tx: 1, tz: 0 };
}

function thatchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#8b7756"; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 280; i++) {
    const x = (i * 47) % 128, y = (i * 29) % 128;
    g.strokeStyle = i % 2 ? "#c4ae86" : "#5c4b34";
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y + 16); g.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function scallopTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas"); canvas.width = 256; canvas.height = 64;
  const g = canvas.getContext("2d")!;
  g.clearRect(0, 0, 256, 64);
  g.fillStyle = "#8e2c3a";
  g.beginPath(); g.moveTo(0, 0); g.lineTo(256, 0); g.lineTo(256, 24);
  for (let i = 8; i >= 1; i--) {
    const x = i * 32;
    g.quadraticCurveTo(x - 16, 62, x - 32, 24);
  }
  g.lineTo(0, 0); g.closePath(); g.fill();
  g.strokeStyle = "#f3efe6"; g.lineWidth = 2; g.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

function letterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas"); canvas.width = 1024; canvas.height = 128;
  const g = canvas.getContext("2d")!;
  g.clearRect(0, 0, 1024, 128);
  g.fillStyle = "rgba(244,241,234,0.92)";
  g.font = "600 64px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("BARRAKA  BEACH     BARRAKA  BEACH", 512, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Barraka's photographed walls (data/barraka_facade.json). The registry footprint
 * stays where it is. The group is already at the beach height, the same height as
 * the sand, so it is not draped again. Visible in Layout and with Show details.
 */
export function addBarrakaFacade(scene: THREE.Scene, ring: Vec2[], baseY: number, terrace: Vec2[] = []): void {
  const c = centroid(ring);
  const group = new THREE.Group();
  group.name = "barraka-facade";
  group.position.y = baseY;
  group.userData.noDrape = true;
  group.userData.evidence = data.facade.evidence;
  scene.add(group);

  const ne = facePoints(ring, data.faces.ne);
  const sw = facePoints(ring, data.faces.sw);
  const nw = facePoints(ring, data.faces.nw);
  const on = (pts: Vec2[], at: number, out = 0.06) => station(pts, at, out, c.x, c.z);

  const std = (color: string, roughness = 0.85) => new THREE.MeshStandardMaterial({ color, roughness });
  const timber = std("#7a4e2c", 0.9);
  const frameMat = std("#6b3e24", 0.75);
  const glassMat = new THREE.MeshStandardMaterial({ color: "#9eb4bf", roughness: 0.08, metalness: 0.35, transparent: true, opacity: 0.38, side: THREE.DoubleSide });
  const plaster = std("#f4f1ea", 0.92);
  const floorMat = std("#6d5344", 0.85);
  const shadeMat = std("#2c2824", 0.95);
  const chairMat = std("#f7f6f2", 0.7);
  const doorMat = std("#161411", 0.6);
  const ventMat = std("#8a9096", 0.5);
  const awningMat = std("#8e2c3a", 0.8);
  const tankMat = std("#d5dde2", 0.35);
  const thatchMat = new THREE.MeshStandardMaterial({ map: thatchTexture(), roughness: 1 });
  const valanceMat = new THREE.MeshStandardMaterial({ map: scallopTexture(), transparent: true, roughness: 0.75, side: THREE.DoubleSide });
  const letterMat = new THREE.MeshStandardMaterial({ map: letterTexture(), transparent: true, roughness: 0.4, side: THREE.DoubleSide });

  const put = (name: string, w: number, h: number, d: number, s: Station, y: number, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.name = name; mesh.position.set(s.x, y, s.z); mesh.rotation.y = s.yaw;
    mesh.castShadow = mesh.receiveShadow = true; group.add(mesh); return mesh;
  };
  const windowAt = (pts: Vec2[], name: string, at: number, sill: number, w: number, h: number) => {
    const s = on(pts, at, 0.05);
    const g = new THREE.Group(); g.name = name; g.position.set(s.x, sill + h / 2, s.z); g.rotation.y = s.yaw; group.add(g);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), frameMat); frame.castShadow = true; g.add(frame);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(w - 0.16, h - 0.14, 0.02), glassMat); glass.position.z = 0.03; g.add(glass);
  };
  const band = (pts: Vec2[], y: number, height: number) => {
    let run = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const length = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      put("barraka-timber-band", length, height, 0.08, on(pts, run + length / 2, 0.05), y, timber);
      run += length;
    }
  };
  const awning = (pts: Vec2[], from: number, to: number) => {
    const mid = (from + to) / 2, width = to - from;
    const s = on(pts, mid, 0);
    const g = new THREE.Group(); g.name = "barraka-awning"; g.position.set(s.x, data.awning.y, s.z); g.rotation.y = s.yaw; group.add(g);
    const depth = data.awning.depth;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(width, 0.07, depth), awningMat);
    panel.position.set(0, 0.04, depth / 2); panel.rotation.x = 0.14; panel.castShadow = true; g.add(panel);
    const valance = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.48), valanceMat);
    valance.position.set(0, -0.2, depth); valance.castShadow = true; g.add(valance);
  };
  const thatch = (pts: Vec2[], from: number, to: number) => {
    let run = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const length = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      const a = Math.max(from, run), b = Math.min(to, run + length);
      if (b - a > 0.2) put("barraka-thatch", b - a, data.roof.thatchHeight, data.roof.thatchDepth, on(pts, (a + b) / 2, data.roof.thatchDepth / 2), barrakaWallHeight - 0.02, thatchMat);
      run += length;
    }
  };

  for (const groupAt of data.ne.windows.groups) for (const at of groupAt) windowAt(ne, "barraka-ne-window", at, data.ne.windows.sill, data.ne.windows.width, data.ne.windows.height);
  band(ne, data.ne.band.y, data.ne.band.height);
  const door = on(ne, data.ne.door.at, 0.16);
  put("barraka-door", data.ne.door.width, data.ne.door.height, 0.08, door, data.ne.door.height / 2 + 0.02, doorMat);
  const louvre = on(ne, data.ne.louvre.at, 0.07);
  const vent = new THREE.Group(); vent.name = "barraka-louvre"; vent.position.set(louvre.x, data.ne.louvre.y, louvre.z); vent.rotation.y = louvre.yaw; group.add(vent);
  for (let i = 0; i < 5; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(data.ne.louvre.width, 0.045, 0.06), ventMat);
    slat.position.y = (i - 2) * 0.08; vent.add(slat);
  }
  const slot = on(ne, data.ne.slot.at, 0.06);
  put("barraka-slot-vent", data.ne.slot.width, data.ne.slot.height, 0.05, slot, data.ne.slot.y, ventMat);

  for (const at of data.sw.windows.at) windowAt(sw, "barraka-sw-window", at, data.sw.windows.sill, data.sw.windows.width, data.sw.windows.height);
  band(sw, data.sw.band.y, data.sw.band.height);
  const wallRun = (pts: Vec2[], from: number, to: number, height: number, name: string, mat: THREE.Material, out = 0, depth = 0.22) => {
    let run = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const length = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      const a = Math.max(from, run), b = Math.min(to, run + length);
      if (b - a > 0.15) put(name, b - a, height, depth, on(pts, (a + b) / 2, out), height / 2, mat);
      run += length;
    }
  };
  const glassRun = (pts: Vec2[], from: number, to: number) => {
    const s = on(pts, (from + to) / 2, 0.05);
    const sill = data.sw.glazing.sill, head = barrakaLowerHead - 0.04;
    put("barraka-glazing", to - from, head - sill, 0.04, s, sill + (head - sill) / 2, glassMat);
    for (let m = from + 0.15; m < to - 0.1; m += 1.45) put("barraka-mullion", 0.06, head - sill, 0.07, on(pts, m, 0.07), sill + (head - sill) / 2, frameMat);
    // Timber fascia directly under the awning, and a low sill. The glass between them is the lower storey.
    put("barraka-timber-clad", to - from, 0.26, 0.1, on(pts, (from + to) / 2, 0.07), barrakaLowerHead - 0.18, timber);
    put("barraka-timber-clad", to - from, 0.14, 0.08, on(pts, (from + to) / 2, 0.06), 0.16, timber);
    // A dark wall set inside the glass, so the lower storey reads as a room rather than a white block.
    put("barraka-lower-room", to - from, head * 0.55, 0.08, on(pts, (from + to) / 2, -2.4), head * 0.28, shadeMat);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(0.8, to - from - 0.4), 0.32), letterMat);
    sign.name = "barraka-lettering"; sign.position.set(s.x, 1.55, s.z); sign.rotation.y = s.yaw; sign.translateZ(0.05); group.add(sign);
  };
  // The north-east wall is solid to the ground, with a gap for the door. The glazed fronts are not.
  const doorGap: [number, number] = [data.ne.door.at - data.ne.door.width / 2 - 0.08, data.ne.door.at + data.ne.door.width / 2 + 0.08];
  wallRun(ne, 0, doorGap[0], barrakaLowerHead, "barraka-lower-wall", plaster);
  wallRun(ne, doorGap[1], faceLength(ne), barrakaLowerHead, "barraka-lower-wall", plaster);
  const se = facePoints(ring, data.faces.se);
  wallRun(se, 0, faceLength(se), barrakaLowerHead, "barraka-lower-wall", plaster);
  // The north-west face is the front toward the paseo and the pool lawn (IMG_2604, IMG_2630).
  const floor = new THREE.Shape(ring.map(([x, z]) => {
    const dx = x - c.x, dz = z - c.z, len = Math.hypot(dx, dz) || 1;
    return new THREE.Vector2(x - dx / len * 0.35, -(z - dz / len * 0.35));
  }));
  const floorMesh = new THREE.Mesh(new THREE.ShapeGeometry(floor).rotateX(-Math.PI / 2), floorMat);
  floorMesh.name = "barraka-lower-floor"; floorMesh.position.y = 0.04; floorMesh.receiveShadow = true; group.add(floorMesh);

  for (const [from, to] of data.sw.awnings) { awning(sw, from, to); glassRun(sw, from, to); }
  awning(nw, data.nw.awning[0], data.nw.awning[1]);
  glassRun(nw, data.nw.awning[0], data.nw.glazedTo);
  for (const at of data.nw.windows.at) windowAt(nw, "barraka-nw-window", at, data.nw.windows.sill, data.nw.windows.width, data.nw.windows.height);

  thatch(sw, 0, faceLength(sw));
  thatch(nw, 0, data.nw.glazedTo + 0.4);
  thatch(ne, 0, data.roof.neReturn);

  const tankAt = on(sw, data.roof.tankAt, -data.roof.tankInset);
  const tank = new THREE.Group(); tank.name = "barraka-tank"; tank.position.set(tankAt.x, barrakaWallHeight + data.roof.tankRadius, tankAt.z); tank.rotation.y = tankAt.yaw; group.add(tank);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(data.roof.tankRadius, data.roof.tankRadius, data.roof.tankLength, 16), tankMat);
  drum.rotation.z = Math.PI / 2; drum.castShadow = true; tank.add(drum);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.9), std("#243044", 0.4));
  panel.position.set(0, 0.45, -0.55); panel.rotation.x = -0.7; panel.castShadow = true; tank.add(panel);

  if (scene.userData.layoutOnly) return;
  const routes = [...(scene.userData.protectedRoutes as ProtectedRoute[] ?? [])];
  const clear = (x: number, z: number, radius: number) => routeClearance(routes, x, z, radius);
  const nearRing = (x: number, z: number) => ring.some((a, i) => closestOnSegment(x, z, a[0], a[1], ring[(i + 1) % ring.length][0], ring[(i + 1) % ring.length][1]).d < 1.2);
  const placeSeat = (x: number, z: number, yaw: number, radius: number, make: (g: THREE.Group) => void, name: string) => {
    if (nearRing(x, z) || !clear(x, z, radius)) return;
    const g = new THREE.Group(); g.name = name; g.position.set(x, 0, z); g.rotation.y = yaw; make(g); group.add(g);
  };
  const table = (g: THREE.Group) => {
    putBox(g, 0.72, 0.05, 0.72, 0, 0.74, 0, std("#2a2622", 0.6));
    for (const [x, z] of [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]] as const) putBox(g, 0.05, 0.72, 0.05, x, 0.36, z, std("#3a342e"));
  };
  const chair = (g: THREE.Group) => {
    putBox(g, 0.46, 0.05, 0.46, 0, 0.46, 0, chairMat);
    putBox(g, 0.46, 0.42, 0.05, 0, 0.7, -0.2, chairMat);
    for (const x of [-0.18, 0.18]) putBox(g, 0.05, 0.46, 0.05, x, 0.23, 0, chairMat);
  };
  const dine = (pts: Vec2[], at: number) => {
    const s = on(pts, at, data.seating.out);
    placeSeat(s.x, s.z, s.yaw, 0.55, table, "barraka-seat-table");
    for (const side of [-1, 1]) {
      const x = s.x + s.tx * side * 0.85, z = s.z + s.tz * side * 0.85;
      placeSeat(x, z, Math.atan2(-side * s.tx, -side * s.tz), 0.35, chair, "barraka-seat-chair");
    }
  };
  for (const at of data.seating.alongSw) dine(sw, at);
  for (const at of data.seating.alongNw) dine(nw, at);
  // One closed cream parasol among the tables, as in IMG_2604.
  const parasolAt = on(sw, data.seating.alongSw[2] ?? data.seating.alongSw[0], data.seating.out + 0.7);
  placeSeat(parasolAt.x, parasolAt.z, parasolAt.yaw, 0.4, (g) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 8), std("#cfc8b8")); pole.position.y = 1.1; g.add(pole);
    const furled = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.18, 0.9, 10), std("#f3efe4")); furled.position.y = 1.7; g.add(furled);
  }, "barraka-seat-parasol");
  for (const [x, z] of data.seating.terrace as Vec2[]) {
    placeSeat(x, z, 0.6, 0.55, table, "barraka-seat-table");
    placeSeat(x + 0.7, z, 0.6, 0.35, chair, "barraka-seat-chair");
    placeSeat(x - 0.7, z, 0.6 + Math.PI, 0.35, chair, "barraka-seat-chair");
  }
  // White rail around the beach terrace, except where it meets the building or a path (IMG_2606).
  for (let i = 0; i < terrace.length; i++) {
    const a = terrace[i], b = terrace[(i + 1) % terrace.length];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    if (length < 1 || nearRing(mx, mz) || !clear(mx, mz, 0.2)) continue;
    const yaw = Math.atan2(b[0] - a[0], b[1] - a[1]);
    const rail = new THREE.Group(); rail.name = "barraka-terrace-rail"; rail.position.set(mx, 0, mz); rail.rotation.y = yaw; group.add(rail);
    putBox(rail, length, 0.08, 0.08, 0, 0.92, 0, plaster);
    putBox(rail, length, 0.08, 0.06, 0, 0.48, 0, plaster);
    for (let s = 0.2; s < length; s += 1.5) putBox(rail, 0.07, 0.92, 0.07, -length / 2 + s, 0.46, 0, plaster);
  }
}

function putBox(parent: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh);
}
