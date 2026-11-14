import * as THREE from "three";
import { plasterMaterial } from "./materials";
import { poolLevelPoint } from "./pool-levels";
import data from "../data/seafront_fence.json";
import type { Vec2 } from "./types";

/** The white wall, the gateway and railings between the big-pool lawn and the paseo (data/seafront_fence.json).
 * The railings are dark green bars on a low sandstone plinth, not white (IMG_2604, 2609, 2610, 2630, 2631). */
const line = (points: number[][]): Vec2[] => points.map(poolLevelPoint).filter((p, i, all) => !i || Math.hypot(p[0] - all[i - 1][0], p[1] - all[i - 1][1]) > 0.05);
const pieces = [data.wall, data.rampWall, data.stub, data.railing].map((f) => ({ ...f, line: line(f.points) }));
const gateAt = poolLevelPoint(data.gate.at), gateAlong = (() => { const [x, z] = poolLevelPoint(data.gate.along); const n = Math.hypot(x, z); return [x / n, z / n] as Vec2; })();
/** The beach gateway in world metres: its centre and the direction along the boundary (the sea is to the right of it). */
export const beachGate = { at: gateAt, along: gateAlong };

function strip(a: Vec2, b: Vec2, thickness: number): Vec2[] {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = (b[1] - a[1]) / length * thickness / 2, nz = -(b[0] - a[0]) / length * thickness / 2;
  return [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]];
}

/** Solid footprints: the walls, the railings and the gateway's two piers. The opening stays open. */
export function seafrontFenceRings(): Vec2[][] {
  const rings = pieces.flatMap((f) => f.line.slice(1).map((b, i) => strip(f.line[i], b, f.thickness)));
  const half = data.gate.opening / 2 + data.gate.pier / 2;
  for (const side of [-1, 1]) {
    const c: Vec2 = [gateAt[0] + gateAlong[0] * half * side, gateAt[1] + gateAlong[1] * half * side];
    rings.push(strip([c[0] - gateAlong[0] * data.gate.pier / 2, c[1] - gateAlong[1] * data.gate.pier / 2], [c[0] + gateAlong[0] * data.gate.pier / 2, c[1] + gateAlong[1] * data.gate.pier / 2], data.gate.depth));
  }
  return rings;
}

/** Built on the paseo's ground: `groundAt` gives its height (the seaside heights). */
export function addSeafrontFence(scene: THREE.Scene, groundAt: (x: number, z: number) => number): void {
  const group = new THREE.Group(), white = plasterMaterial("#fbf8f0"), paint = new THREE.MeshStandardMaterial({ color: data.railing.paint, roughness: 0.6 });
  const plinth = plasterMaterial(data.railing.plinthFinish);
  group.name = "seafront-fence"; group.userData.noDrape = true; group.userData.structural = true;
  const beam = (a: Vec2, b: Vec2, y: number, height: number, thickness: number, material: THREE.Material) => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, height, thickness), material);
    mesh.position.set((a[0] + b[0]) / 2, y + height / 2, (a[1] + b[1]) / 2); mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    mesh.castShadow = mesh.receiveShadow = true; group.add(mesh);
  };
  const base = (a: Vec2, b: Vec2) => Math.min(groundAt(...a), groundAt(...b));
  for (const f of [pieces[0], pieces[1], pieces[2]]) f.line.slice(1).forEach((b, i) => { const a = f.line[i]; beam(a, b, base(a, b) - 0.2, f.height + 0.2, f.thickness, white); });
  // Railings: a low sandstone plinth, square posts, a top rail and close vertical bars between them, all dark green.
  const rail = pieces[3], bars: THREE.Matrix4[] = [];
  const railLen = rail.line.slice(1).reduce((n, b, i) => n + Math.hypot(b[0] - rail.line[i][0], b[1] - rail.line[i][1]), 0);
  let walked = 0;
  rail.line.slice(1).forEach((b, i) => {
    const a = rail.line[i], y = base(a, b), length = Math.hypot(b[0] - a[0], b[1] - a[1]), yaw = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    // The stone wall is low by the gate and about waist height where the terrace widens at Barraka (IMG_2610).
    const t = railLen ? (walked + length / 2) / railLen : 1;
    walked += length;
    const plinthH = data.railing.plinth + (data.railing.plinthAtEnd - data.railing.plinth) * t;
    const top = data.railing.height + (data.railing.heightAtEnd - data.railing.height) * t;
    beam(a, b, y - 0.2, plinthH + 0.2, rail.thickness, plinth);
    beam(a, b, y + top - 0.05, 0.05, 0.08, paint);
    for (let s = 0; s <= length; s += data.railing.post) {
      const p: Vec2 = [a[0] + (b[0] - a[0]) * s / length, a[1] + (b[1] - a[1]) * s / length];
      beam([p[0] - (b[0] - a[0]) / length * 0.06, p[1] - (b[1] - a[1]) / length * 0.06], [p[0] + (b[0] - a[0]) / length * 0.06, p[1] + (b[1] - a[1]) / length * 0.06], y, top + 0.05, 0.12, paint);
    }
    for (let s = data.railing.bar / 2; s < length; s += data.railing.bar) {
      const m = new THREE.Matrix4().compose(new THREE.Vector3(a[0] + (b[0] - a[0]) * s / length, y + (plinthH + top) / 2, a[1] + (b[1] - a[1]) * s / length),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(1, top - plinthH, 1));
      bars.push(m);
    }
  });
  const barMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 1, 0.025), paint, bars.length);
  bars.forEach((m, i) => barMesh.setMatrixAt(i, m)); barMesh.castShadow = true; group.add(barMesh);
  // The gateway (IMG_2602, IMG_2766, IMG_2485): two square white piers either side of a rectangular
  // opening, a flat moulded lintel over it and a shallow segmental hood with a projecting cornice above.
  const g = data.gate, hood = g.hood, r = g.opening / 2, outer = r + g.pier;
  const arch = new THREE.Group(); arch.name = g.id;
  arch.position.set(gateAt[0], groundAt(...gateAt), gateAt[1]); arch.rotation.y = -Math.atan2(gateAlong[1], gateAlong[0]);
  const part = (geometry: THREE.BufferGeometry, x: number, y: number, z = 0) => {
    const mesh = new THREE.Mesh(geometry, white); mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; arch.add(mesh); return mesh;
  };
  // Piers run 0.2 m into the ground so their feet never show an edge on sloping paving.
  for (const side of [-1, 1]) part(new THREE.BoxGeometry(g.pier, g.spring + 0.2, g.depth), side * (r + g.pier / 2), (g.spring - 0.2) / 2);
  part(new THREE.BoxGeometry(2 * outer, hood.lintel, g.depth), 0, g.spring + hood.lintel / 2);
  part(new THREE.BoxGeometry(2 * outer + 2 * hood.cornice, 0.06, g.depth + 2 * hood.cornice), 0, g.spring + hood.lintel + 0.03);
  // The hood: a segment of a circle through both ends of the cornice, rising `rise` at the middle.
  const span = outer + hood.cornice, chord = span, sag = hood.rise, radius = (chord * chord + sag * sag) / (2 * sag), hoodBase = g.spring + hood.lintel + 0.06;
  const sweep = Math.asin(chord / radius), seg = new THREE.Shape();
  seg.moveTo(-span, 0); seg.absarc(0, sag - radius, radius, Math.PI / 2 + sweep, Math.PI / 2 - sweep, true); seg.lineTo(-span, 0);
  part(new THREE.ExtrudeGeometry(seg, { depth: g.depth, bevelEnabled: false }).translate(0, 0, -g.depth / 2), 0, hoodBase);
  const lip = new THREE.Shape(), out = span + 0.05, lipR = radius + 0.05;
  lip.absarc(0, sag - radius, lipR, Math.PI / 2 + Math.asin(out / lipR), Math.PI / 2 - Math.asin(out / lipR), true);
  lip.absarc(0, sag - radius, radius - 0.02, Math.PI / 2 - sweep, Math.PI / 2 + sweep, false);
  part(new THREE.ExtrudeGeometry(lip, { depth: g.depth + 0.1, bevelEnabled: false }).translate(0, 0, -(g.depth + 0.1) / 2), 0, hoodBase);
  group.add(arch);
  // IMG_2602 and IMG_2766 show a black iron leaf of vertical bars with ring motifs. It is swung open so the way through stays clear.
  const iron = new THREE.MeshStandardMaterial({ color: "#1c2420", roughness: 0.45, metalness: 0.55 });
  const leaf = new THREE.Group(); leaf.name = "guillermo-beach-gate-leaf";
  leaf.position.set(-r + 0.04, 0, 0); leaf.rotation.y = 1.15;
  const width = g.opening - 0.08, tall = g.spring - 0.06;
  for (let i = 0; i < 7; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.014, tall - 0.1, 0.014), iron);
    bar.position.set(((i + 0.5) / 7) * width, tall / 2, 0); leaf.add(bar);
  }
  for (const y of [0.08, tall * 0.5, tall - 0.04]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(width, 0.025, 0.025), iron);
    rail.position.set(width / 2, y, 0); leaf.add(rail);
  }
  for (const [x, y] of [[0.3, 0.72], [0.7, 0.72], [0.5, 0.85], [0.3, 0.28], [0.7, 0.28]] as [number, number][]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 6, 14), iron);
    ring.position.set(x * width, y * tall, 0); leaf.add(ring);
  }
  // The COMUNIDAD VILLACANA ZONA PRIVADA sign on the paseo face of the wall beside the gate (IMG_2485).
  const c = document.createElement("canvas"); c.width = 256; c.height = 160;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f6f6f2"; ctx.fillRect(0, 0, 256, 160);
  ctx.fillStyle = "#c8303a"; ctx.beginPath(); ctx.moveTo(196, 14); ctx.lineTo(214, 40); ctx.lineTo(178, 40); ctx.fill();
  ctx.fillStyle = "#1b1b1b"; ctx.font = "bold 26px serif"; ctx.textAlign = "center";
  ctx.fillText("COMUNIDAD", 128, 76); ctx.fillText("VILLACANA", 128, 108); ctx.font = "16px serif"; ctx.fillText("ZONA PRIVADA", 128, 136);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.47), new THREE.MeshStandardMaterial({ map: Object.assign(new THREE.CanvasTexture(c), { colorSpace: THREE.SRGBColorSpace }), roughness: 0.5 }));
  // The paseo face is the side away from the lawn: +z in the gateway's frame points to the sea.
  sign.position.set(outer + 0.75, 1.0, data.stub.thickness / 2 + 0.012); sign.name = "comunidad-villacana-sign";
  arch.add(sign);
  arch.add(leaf);
  scene.add(group);
}
