import * as THREE from "three";
import data from "../data/beach_verge.json";
import { routeClearance, type ProtectedRoute } from "./route-clearance";
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
  const grass = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: "#8c9a5b", roughness: 1, side: THREE.DoubleSide }));
  grass.name = data.grass.id; grass.receiveShadow = true; group.add(grass);
  if (scene.userData.layoutOnly) return;
  const details = new THREE.Group(); details.name = data.shrubs.id; group.add(details);
  const routes = scene.userData.protectedRoutes as ProtectedRoute[] ?? [];
  const leaves = ["#4f6b3a", "#5f7a43", "#476236"].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  vergeClumps.forEach(([x, z, r], i) => {
    // The clump's visible footprint is its radius.
    if (!routeClearance(routes, x, z, r)) return;
    const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), leaves[i % leaves.length]);
    shrub.scale.set(r, data.shrubs.height / 2, r); shrub.position.set(x, groundY(x, z) + data.shrubs.height / 2, z);
    shrub.castShadow = shrub.receiveShadow = true; details.add(shrub);
  });
}
