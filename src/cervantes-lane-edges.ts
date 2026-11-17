import * as THREE from "three";
import data from "../data/cervantes_lane_edges.json";
import { clippedHedge, looseShrub } from "./clipped-plants";
import { groundElenaWall } from "./elena-wall-ground";
import { plasterMaterial } from "./materials";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/** Raised hedge planters and kerbed beds along Calle Cervantes (data/cervantes_lane_edges.json). The white kerb
 * walls and soil are structure (Layout, solid, on the map); the planting is a Show-details piece. */
export type LaneEdgePlanting = { kind: string; height: number; runs: { s: number[]; look: string }[] };
export type LaneEdgePlanter = { id: string; name: string; kind: string; s: number[]; o: number[]; height: number; wall: number; ring: Vec2[]; planting: LaneEdgePlanting; evidence: string[]; basis: string };
export const cervantesLaneEdges: LaneEdgePlanter[] = data.planters.map((p) => ({ ...p, ring: p.ring as Vec2[] }));

const { origin, along, right } = data.axis;
/** A point in the lane frame: s metres along the axis from the Dalí end, o metres off it (positive south). */
const at = (s: number, o: number): Vec2 => [origin[0] + along[0] * s + right[0] * o, origin[1] + along[1] * s + right[1] * o];

/** Collision: the whole planter (kerbs and the planting on them). */
export const cervantesLaneEdgeRings = (): Vec2[][] => cervantesLaneEdges.map((p) => p.ring);

/** A box from a to b (centreline), y0..y1 above the ground, `width` across, draped on the surveyed ground. */
function box(a: Vec2, b: Vec2, y0: number, y1: number, width: number, material: THREE.Material, name: string): THREE.Mesh {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, y1 - y0, width), material);
  mesh.position.set((a[0] + b[0]) / 2, (y0 + y1) / 2, (a[1] + b[1]) / 2);
  mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.name = name;
  return groundElenaWall(mesh);
}

export function addCervantesLaneEdges(scene: THREE.Scene): void {
  const group = new THREE.Group();
  group.name = data.id;
  group.userData.noDrape = true;
  group.userData.structural = true;
  const white = plasterMaterial("#fbf8ef");
  const soil = new THREE.MeshStandardMaterial({ color: "#5a4634", roughness: 1 });
  const FOOT = 0.06;
  for (const p of cervantesLaneEdges) {
    const [s0, s1] = p.s, [near, far] = p.o, sign = Math.sign(far - near), t = p.wall;
    // Kerb walls: the lane face and the back on the long sides, the two ends between them.
    for (const o of [near + sign * t / 2, far - sign * t / 2]) group.add(box(at(s0, o), at(s1, o), -FOOT, p.height, t, white, p.id));
    const mid = (near + far) / 2, inner = Math.abs(far - near) - 2 * t;
    for (const s of [s0 + t / 2, s1 - t / 2]) group.add(box(at(s, mid - sign * inner / 2), at(s, mid + sign * inner / 2), -FOOT, p.height, t, white, p.id));
    // Soil just under the kerb top, between the walls.
    group.add(box(at(s0 + t, mid), at(s1 - t, mid), p.height - 0.08, p.height - 0.03, inner, soil, p.id + "-soil"));
  }
  scene.add(group);
}

const LOOKS: Record<string, (length: number, depth: number, height: number, seed: number) => THREE.Group> = {
  box: (length, depth, height, seed) => clippedHedge({ length, depth, height, seed, clip: 5.5, leafSize: [0.05, 0.034], greens: ["#3a5a2e", "#476a35", "#55773d"] }),
  thuja: (length, depth, height, seed) => clippedHedge({ length, depth, height, seed, clip: 4, density: 420, leaf: "narrow", leafSize: [0.09, 0.03], greens: ["#3c5a2c", "#4a6b33", "#587a3c"], inside: "#22341b" }),
  oleander: (length, depth, height, seed) => clippedHedge({ length, depth, height, seed, clip: 3.2, density: 520, leaf: "narrow", leafSize: [0.16, 0.045], greens: ["#2f4528", "#3d5733", "#4a6638"], inside: "#1d2c19", flowers: { count: Math.round(length * 18), colour: "#f0c3c8" } }),
  dracaena: (length, depth, height, seed) => looseShrub({ width: Math.min(length, 0.9), depth, height, seed, leaf: "narrow", leafSize: [0.32, 0.05], greens: ["#4f6f3a", "#6b8a4a", "#c9cf9a"], stems: 4 }),
  jade: (length, depth, height, seed) => looseShrub({ width: Math.min(length, 0.7), depth, height, seed, leaf: "glossy", leafSize: [0.07, 0.05], greens: ["#4d6e36", "#5d7f40", "#6b8c48"], stems: 4 }),
  lantana: (length, depth, height, seed) => looseShrub({ width: Math.min(length, 0.9), depth, height, seed, leaf: "small", leafSize: [0.06, 0.04], greens: ["#3f5a30", "#4c6a37", "#5d7a42"], stems: 5, flowers: { count: 30, colour: seed % 2 ? "#f2c230" : "#e8652e" } }),
};

/** Show details: the planting in each bed, in pieces of 0.5-0.6 m, each guarded with its whole visible footprint. */
export function addCervantesLaneEdgePlanting(into: THREE.Scene, keep: (x: number, z: number) => boolean): void {
  const guard = into.userData.decorationClearance as ((x: number, z: number, radius: number) => boolean) | undefined;
  const clear = (p: Vec2, r: number) => !guard || guard(p[0], p[1], r);
  const details = new THREE.Group();
  details.name = data.id + "-planting";
  details.userData.noDrape = true;
  let seed = 311;
  for (const p of cervantesLaneEdges) {
    const [near, far] = p.o, sign = Math.sign(far - near), depth = Math.abs(far - near) - 2 * p.wall - 0.04, o = (near + far) / 2 + sign * 0.0;
    for (const run of p.planting.runs) {
      const look = LOOKS[run.look] ?? LOOKS.box, loose = run.look === "dracaena" || run.look === "lantana" || run.look === "jade";
      // Short pieces: the guard bounds each with a circle, and these beds are narrow and close to the lane.
      const step = loose ? 0.5 : 0.6, pieces = Math.max(1, Math.ceil((run.s[1] - run.s[0] - 2 * p.wall) / step)), len = (run.s[1] - run.s[0] - 2 * p.wall) / pieces;
      for (let i = 0; i < pieces; i++) {
        const s = run.s[0] + p.wall + (i + 0.5) * len, mid = at(s, o);
        if (!keep(...mid) || !clear(mid, Math.hypot(len, depth) / 2)) { seed++; continue; }
        const height = (p.planting.height - p.height) * (0.9 + ((seed * 37) % 17) / 85);
        const plant = look(len, depth, height, seed++);
        plant.position.set(mid[0], siteY(...mid) + p.height - 0.04, mid[1]);
        plant.rotation.y = -Math.atan2(along[1], along[0]);
        plant.name = p.id + "-planting";
        const ux = along[0], uz = along[1], rx = right[0], rz = right[1];
        plant.userData.footprint = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [mid[0] + ux * a * len / 2 + rx * b * depth / 2, mid[1] + uz * a * len / 2 + rz * b * depth / 2]);
        plant.traverse((obj) => { obj.userData.noDrape = true; });
        details.add(plant);
      }
    }
  }
  into.add(details);
}
