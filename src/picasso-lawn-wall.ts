import * as THREE from "three";
import data from "../data/picasso_lawn_wall.json";
import { clippedHedge } from "./clipped-plants";
import { plasterMaterial } from "./materials";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/** The thin white wall on the Calle Pintor Picasso side of the big-pool lawn. It runs from the pool building to the coastal path. */
const points = data.points as Vec2[];

function strip(a: Vec2, b: Vec2, thickness: number): Vec2[] {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = (b[1] - a[1]) / length * thickness / 2, nz = -(b[0] - a[0]) / length * thickness / 2;
  return [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]];
}

export function picassoLawnWallRings(): Vec2[][] {
  return points.slice(1).map((b, i) => strip(points[i], b, data.thickness));
}

export function addPicassoLawnWall(scene: THREE.Scene): void {
  const group = new THREE.Group();
  group.name = data.id;
  group.userData.noDrape = true;
  group.userData.structural = true;
  const white = plasterMaterial("#f7f4ee");
  points.slice(1).forEach((b, i) => {
    const a = points[i];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const y = Math.min(siteY(a[0], a[1]), siteY(b[0], b[1]));
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, data.height, data.thickness), white);
    mesh.position.set((a[0] + b[0]) / 2, y + data.height / 2, (a[1] + b[1]) / 2);
    mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  });
  if (!scene.userData.layoutOnly) {
    const hedge = data.hedge;
    points.slice(1).forEach((b, i) => {
      const a = points[i];
      const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz) || 1;
      const left: Vec2 = [-dz / length, dx / length];
      for (let s = hedge.depth; s < length - hedge.depth; s += 5.5) {
        const x = a[0] + (dx / length) * s + left[0] * hedge.inset;
        const z = a[1] + (dz / length) * s + left[1] * hedge.inset;
        const bush = clippedHedge({ length: 5.2, depth: hedge.depth, height: hedge.height, seed: 40 + i * 9 + Math.round(s), density: 70, clip: 3.5 });
        bush.position.set(x, siteY(x, z), z);
        bush.rotation.y = -Math.atan2(dz, dx);
        bush.userData.noDrape = true;
        group.add(bush);
      }
    });
  }
  scene.add(group);
}
