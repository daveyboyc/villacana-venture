import * as THREE from "three";
import data from "../data/jorge_lane.json";
import skeleton from "../public/map/skeleton.json";
import { pointInRing } from "./geom";
import { plasterMaterial, surfaceTexture } from "./materials";
import type { Vec2 } from "./types";

/** Calle Jorge: grass, the house-side hedge wall, the white benches, the street sign and its lamp. */
export const jorgeLane = data;
const sign = data.sign, lamp = data.lamp;
const BENCH_LENGTH = 1.45;
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
  for (let s = 0; s < total - 0.5; s += 2) {
    const a = jorgeAt(s), b = jorgeAt(Math.min(total, s + 2));
    const pick = (f: Frame, d: number): Vec2 => {
      const n = side === "lawn" ? f.lawn : f.hedge;
      return [f.p[0] + n[0] * d, f.p[1] + n[1] * d];
    };
    const corners = [pick(a, inner), pick(a, outer), pick(b, outer), pick(b, inner)];
    if (corners.some((p) => inHouse(p[0], p[1]))) continue;
    const base = pos.length / 3;
    corners.forEach((p, i) => { pos.push(p[0], 0.025, p[1]); uv.push(i % 2, s / 4); });
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: surfaceTexture("turf"), color: "#5f8a45", roughness: 1, side: THREE.DoubleSide }));
  mesh.name = `jorge-grass-${side}`; mesh.receiveShadow = true;
  return mesh;
}

/** Grass both sides, the white hedge wall, benches, shrubs, the street sign and the lamp. */
export function addJorgeLane(scene: THREE.Scene): void {
  scene.add(verge("lawn"), verge("hedge"));
  const white = plasterMaterial("#f7f4ee"), green = new THREE.MeshStandardMaterial({ color: "#2f6a34", roughness: 0.9 });
  const wallRun = data.boundary;
  for (let s = wallRun.from; s <= wallRun.to; s += wallRun.every) {
    const f = jorgeAt(s);
    const p: Vec2 = [f.p[0] + f.hedge[0] * wallRun.offset, f.p[1] + f.hedge[1] * wallRun.offset];
    if (inHouse(p[0], p[1]) || inHouse(p[0] + f.along[0] * 1.4, p[1] + f.along[1] * 1.4)) continue;
    const yaw = Math.atan2(f.along[0], f.along[1]);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(wallRun.length, 0.58, 0.4), white);
    wall.position.set(p[0], 0.29, p[1]); wall.rotation.y = yaw; wall.userData.base = p; wall.castShadow = true; wall.name = "jorge-wall";
    const hedge = new THREE.Mesh(new THREE.BoxGeometry(wallRun.length - 0.08, 0.72, 0.72), green);
    hedge.position.set(p[0], 0.9, p[1]); hedge.rotation.y = yaw; hedge.userData.base = p; hedge.castShadow = true; hedge.name = "jorge-hedge";
    scene.add(wall, hedge);
  }
  for (const spot of jorgeBenchSpots()) scene.add(place(benchMesh(), spot.at, spot.face));
  for (const dist of data.plants.along) {
    const f = jorgeAt(dist);
    const p: Vec2 = [f.p[0] + f.lawn[0] * data.plants.offset, f.p[1] + f.lawn[1] * data.plants.offset];
    if (inHouse(p[0], p[1])) continue;
    const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), green);
    shrub.position.set(p[0], 0.5, p[1]); shrub.userData.base = p; shrub.castShadow = true; shrub.name = "jorge-shrub";
    scene.add(shrub);
  }
  scene.add(place(signMesh(), sign.at as Vec2, sign.face as Vec2));
  const light = lampMesh();
  light.position.set(lamp.at[0], 0, lamp.at[1]);
  light.userData.base = lamp.at as Vec2;
  scene.add(light);
}
