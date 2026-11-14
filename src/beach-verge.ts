import * as THREE from "three";
import data from "../data/beach_verge.json";
import { looseShrub } from "./clipped-plants";
import { routeClearance, type ProtectedRoute } from "./route-clearance";
import { tallPalm } from "./spiky-trees";
import type { Vec2 } from "./types";

/** The grass verge on the beach side of the paseo in front of the gateway and the lawn railings (data/beach_verge.json). */
export const vergeRing = data.grass.ring as Vec2[];
export const vergeClumps = data.shrubs.clumps as [number, number, number][];

/** Grass laid over the beach ground (no collision); shrub clumps are Details only. */
export function addBeachVerge(scene: THREE.Scene, groundY: (x: number, z: number) => number): void {
  const group = new THREE.Group(); group.name = "beach-verge"; group.userData.noDrape = true; scene.add(group);
  // Triangulate the outline, then split each triangle into pieces under about 1 m so the grass follows the ground.
  const positions: number[] = [], at = (p: Vec2) => [p[0], groundY(p[0], p[1]) + .05, p[1]];
  const contour = vergeRing.map(([x, z]) => new THREE.Vector2(x, z));
  for (const [i, j, k] of THREE.ShapeUtils.triangulateShape(contour, [])) {
    const [a, b, c] = [vergeRing[i], vergeRing[j], vergeRing[k]];
    const n = Math.max(1, Math.ceil(Math.max(Math.hypot(b[0] - a[0], b[1] - a[1]), Math.hypot(c[0] - b[0], c[1] - b[1]), Math.hypot(a[0] - c[0], a[1] - c[1]))));
    const p = (u: number, v: number): Vec2 => [a[0] + (b[0] - a[0]) * u / n + (c[0] - a[0]) * v / n, a[1] + (b[1] - a[1]) * u / n + (c[1] - a[1]) * v / n];
    for (let u = 0; u < n; u++) for (let v = 0; v < n - u; v++) {
      positions.push(...at(p(u, v)), ...at(p(u + 1, v)), ...at(p(u, v + 1)));
      if (u + v < n - 1) positions.push(...at(p(u + 1, v)), ...at(p(u + 1, v + 1)), ...at(p(u, v + 1)));
    }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); geometry.computeVertexNormals();
  const grass = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: "#9aa36a", roughness: 1, side: THREE.DoubleSide }));
  grass.name = data.grass.id; grass.receiveShadow = true; group.add(grass);
  if (scene.userData.layoutOnly) return;
  const details = new THREE.Group(); details.name = data.shrubs.id; group.add(details);
  const routes = scene.userData.protectedRoutes as ProtectedRoute[] ?? [];
  const greens = ["#4a6a34", "#5c7c40", "#3e5a2e", "#6d8750"];
  vergeClumps.forEach(([x, z, r], i) => {
    // The clump's visible footprint is its radius. IMG_2631 and IMG_2226: round leafy bushes, not a bare ball.
    if (!routeClearance(routes, x, z, r)) return;
    const shrub = looseShrub({ width: r * 2, depth: r * 1.6, height: data.shrubs.height * (0.75 + (i % 4) * 0.1), seed: 40 + i, leaf: "small", leafSize: [0.08, 0.045], greens });
    shrub.position.set(x, groundY(x, z), z); shrub.rotation.y = i * 0.9; details.add(shrub);
  });
  (data.agaves as [number, number, number][]).forEach(([x, z, r], i) => {
    if (!routeClearance(routes, x, z, r)) return;
    const plant = agave(80 + i, r * 2);
    plant.position.set(x, groundY(x, z), z); plant.rotation.y = i * 1.3; details.add(plant);
  });
  (data.palms as { at: [number, number]; height: number; seed: number }[]).forEach((palm) => {
    const [x, z] = palm.at;
    if (!routeClearance(routes, x, z, 0.6)) return;
    const tree = tallPalm({ height: palm.height, seed: palm.seed });
    tree.position.set(x, groundY(x, z), z); details.add(tree);
  });
}

/** A young agave: a fleshy rosette, outer blades longer and lower (IMG_2482). */
function agave(seed: number, spread: number): THREE.Group {
  const group = new THREE.Group(); group.name = "beach-agave";
  const outer = new THREE.MeshStandardMaterial({ color: "#6a8a58", roughness: 0.8, side: THREE.DoubleSide });
  const inner = new THREE.MeshStandardMaterial({ color: "#8faf6e", roughness: 0.75, side: THREE.DoubleSide });
  const blade = (len: number, width: number, mat: THREE.Material) => new THREE.Mesh(new THREE.PlaneGeometry(width, len), mat);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + (seed % 5) * 0.05;
    const len = spread * (0.7 + (i % 3) * 0.1);
    const leaf = blade(len, 0.11, outer);
    leaf.position.set(Math.cos(a) * len * 0.32, len * 0.16, Math.sin(a) * len * 0.32);
    leaf.rotation.y = -a; leaf.rotation.x = 1.15; leaf.castShadow = true; group.add(leaf);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3;
    const len = spread * 0.45;
    const leaf = blade(len, 0.08, inner);
    leaf.position.set(Math.cos(a) * len * 0.2, len * 0.32, Math.sin(a) * len * 0.2);
    leaf.rotation.y = -a; leaf.rotation.x = 0.7; group.add(leaf);
  }
  return group;
}
