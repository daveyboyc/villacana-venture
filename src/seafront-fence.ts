import * as THREE from "three";
import { plasterMaterial } from "./materials";
import { poolLevelPoint } from "./pool-levels";
import data from "../data/seafront_fence.json";
import type { Vec2 } from "./types";

/** The white wall, arched gateway and railings between the big-pool lawn and the paseo (data/seafront_fence.json). */
const line = (points: number[][]): Vec2[] => points.map(poolLevelPoint).filter((p, i, all) => !i || Math.hypot(p[0] - all[i - 1][0], p[1] - all[i - 1][1]) > 0.05);
const pieces = [data.wall, data.rampWall, data.stub, data.railing].map((f) => ({ ...f, line: line(f.points) }));
const gateAt = poolLevelPoint(data.gate.at), gateAlong = (() => { const [x, z] = poolLevelPoint(data.gate.along); const n = Math.hypot(x, z); return [x / n, z / n] as Vec2; })();

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
  const group = new THREE.Group(), white = plasterMaterial("#fbf8f0"), paint = new THREE.MeshStandardMaterial({ color: "#f7f6f1", roughness: 0.6 });
  group.name = "seafront-fence"; group.userData.noDrape = true; group.userData.structural = true;
  const beam = (a: Vec2, b: Vec2, y: number, height: number, thickness: number, material: THREE.Material) => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, height, thickness), material);
    mesh.position.set((a[0] + b[0]) / 2, y + height / 2, (a[1] + b[1]) / 2); mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    mesh.castShadow = mesh.receiveShadow = true; group.add(mesh);
  };
  const base = (a: Vec2, b: Vec2) => Math.min(groundAt(...a), groundAt(...b));
  for (const f of [pieces[0], pieces[1], pieces[2]]) f.line.slice(1).forEach((b, i) => { const a = f.line[i]; beam(a, b, base(a, b) - 0.2, f.height + 0.2, f.thickness, white); });
  // Railings: a low white plinth, square posts, a top rail and close vertical bars between them.
  const rail = pieces[3], bars: THREE.Matrix4[] = [];
  rail.line.slice(1).forEach((b, i) => {
    const a = rail.line[i], y = base(a, b), length = Math.hypot(b[0] - a[0], b[1] - a[1]), yaw = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    beam(a, b, y - 0.2, data.railing.plinth + 0.2, rail.thickness, white);
    beam(a, b, y + rail.height - 0.05, 0.05, 0.08, paint);
    for (let s = 0; s <= length; s += data.railing.post) {
      const p: Vec2 = [a[0] + (b[0] - a[0]) * s / length, a[1] + (b[1] - a[1]) * s / length];
      beam([p[0] - (b[0] - a[0]) / length * 0.06, p[1] - (b[1] - a[1]) / length * 0.06], [p[0] + (b[0] - a[0]) / length * 0.06, p[1] + (b[1] - a[1]) / length * 0.06], y, rail.height + 0.05, 0.12, paint);
    }
    for (let s = data.railing.bar / 2; s < length; s += data.railing.bar) {
      const m = new THREE.Matrix4().compose(new THREE.Vector3(a[0] + (b[0] - a[0]) * s / length, y + (data.railing.plinth + rail.height) / 2, a[1] + (b[1] - a[1]) * s / length),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(1, rail.height - data.railing.plinth, 1));
      bars.push(m);
    }
  });
  const barMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 1, 0.025), paint, bars.length);
  bars.forEach((m, i) => barMesh.setMatrixAt(i, m)); barMesh.castShadow = true; group.add(barMesh);
  // The arched gateway: one white slab with a round-headed opening, at paseo level.
  const g = data.gate, outer = g.opening / 2 + g.pier, r = g.opening / 2;
  // The slab runs 0.2 m into the ground so the opening's foot never shares an edge with its outline.
  const shape = new THREE.Shape([new THREE.Vector2(-outer, -0.2), new THREE.Vector2(outer, -0.2), new THREE.Vector2(outer, g.height), new THREE.Vector2(-outer, g.height)]);
  const hole = new THREE.Path(); hole.moveTo(-r, -0.1); hole.lineTo(-r, g.spring); hole.absarc(0, g.spring, r, Math.PI, 0, true); hole.lineTo(r, -0.1); hole.lineTo(-r, -0.1);
  shape.holes.push(hole);
  const arch = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: g.depth, bevelEnabled: false }).translate(0, 0, -g.depth / 2), white);
  arch.position.set(gateAt[0], groundAt(...gateAt), gateAt[1]); arch.rotation.y = -Math.atan2(gateAlong[1], gateAlong[0]);
  arch.name = g.id; arch.castShadow = arch.receiveShadow = true; group.add(arch);
  scene.add(group);
}
