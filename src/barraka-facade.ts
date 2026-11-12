import * as THREE from "three";
import data from "../data/barraka_facade.json";
import { centroid } from "./geom";
import type { Vec2 } from "./types";

/** Registry part for Barraka. The ring is not moved; only the wall height and the openings change. */
export const BARRAKA_BUILDING = data.buildingId;
/** Parapet height in metres. Photo proportion on IMG_2618, not the 3 m registry storey. */
export const barrakaWallHeight = data.wallHeight;

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
 * stays where it is. The group shares the building's floor datum, so draping lifts
 * the openings with the walls. Visible in Layout and with Show details.
 */
export function addBarrakaFacade(scene: THREE.Scene, ring: Vec2[], baseY: number): void {
  const c = centroid(ring);
  const group = new THREE.Group();
  group.name = "barraka-facade";
  group.position.y = baseY;
  group.userData.base = [c.x, c.z] as Vec2;
  group.userData.evidence = data.facade.evidence;
  scene.add(group);

  const ne = facePoints(ring, data.faces.ne);
  const sw = facePoints(ring, data.faces.sw);
  const nw = facePoints(ring, data.faces.nw);
  const on = (pts: Vec2[], at: number, out = 0.06) => station(pts, at, out, c.x, c.z);

  const std = (color: string, roughness = 0.85) => new THREE.MeshStandardMaterial({ color, roughness });
  const timber = std("#7a4e2c", 0.9);
  const frameMat = std("#6b3e24", 0.75);
  const glassMat = new THREE.MeshStandardMaterial({ color: "#c5d5dc", roughness: 0.12, metalness: 0.25, transparent: true, opacity: 0.55 });
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
  const door = on(ne, data.ne.door.at, 0.07);
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
  const glassRun = (pts: Vec2[], from: number, to: number) => {
    const s = on(pts, (from + to) / 2, 0.04);
    const h = data.sw.glazing.head - data.sw.glazing.sill;
    put("barraka-glazing", to - from, h, 0.05, s, data.sw.glazing.sill + h / 2, glassMat);
    const clad = data.sw.timber.head - data.sw.timber.sill;
    put("barraka-timber-clad", to - from, clad, 0.08, on(pts, (from + to) / 2, 0.05), data.sw.timber.sill + clad / 2, timber);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(to - from - 0.4, 0.32), letterMat);
    sign.name = "barraka-lettering"; sign.position.set(s.x, 1.72, s.z); sign.rotation.y = s.yaw; sign.translateZ(0.06); group.add(sign);
  };
  for (const [from, to] of data.sw.awnings) { awning(sw, from, to); glassRun(sw, from, to); }
  awning(nw, data.nw.awning[0], data.nw.awning[1]);
  glassRun(nw, data.nw.awning[0], data.nw.glazedTo);
  windowAt(nw, "barraka-nw-window", data.nw.window.at, data.nw.window.y, data.nw.window.width, data.nw.window.height);

  thatch(sw, 0, faceLength(sw));
  thatch(nw, 0, data.nw.glazedTo + 0.4);
  thatch(ne, 0, data.roof.neReturn);

  const tankAt = on(sw, data.roof.tankAt, -data.roof.tankInset);
  const tank = new THREE.Group(); tank.name = "barraka-tank"; tank.position.set(tankAt.x, barrakaWallHeight + data.roof.tankRadius, tankAt.z); tank.rotation.y = tankAt.yaw; group.add(tank);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(data.roof.tankRadius, data.roof.tankRadius, data.roof.tankLength, 16), tankMat);
  drum.rotation.z = Math.PI / 2; drum.castShadow = true; tank.add(drum);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.9), std("#243044", 0.4));
  panel.position.set(0, 0.45, -0.55); panel.rotation.x = -0.7; panel.castShadow = true; tank.add(panel);
}
