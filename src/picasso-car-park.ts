import * as THREE from "three";
import data from "../data/picasso_car_park.json";
import { plasterMaterial } from "./materials";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/**
 * The main (Picasso) car park's structure, estimated from the aerial and the photos
 * (data/picasso_car_park.json): the long white wall between the car park and Calle Pintor
 * Picasso, and the round island's white kerb and raised bed. Planting on the island is left
 * for the detail stage.
 */
const wall = data.wall, island = data.island;
/** The car-park and road paving is drawn this far above the terrain (boundaries.ts); kerb and wall heights are measured from it. */
const PAVING = 0.27;
const wallPoints = wall.points as Vec2[];

function strip(a: Vec2, b: Vec2, thickness: number): Vec2[] {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = (b[1] - a[1]) / length * thickness / 2, nz = -(b[0] - a[0]) / length * thickness / 2;
  return [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]];
}

function circle(radius: number, steps = 48): Vec2[] {
  return Array.from({ length: steps }, (_, i) => {
    const t = i / steps * Math.PI * 2;
    return [island.centre[0] + Math.cos(t) * radius, island.centre[1] + Math.sin(t) * radius] as Vec2;
  });
}

/** Collision for the wall and the island (kerb and bed together). */
export function picassoCarParkRings(): Vec2[][] {
  return [...wallPoints.slice(1).map((b, i) => strip(wallPoints[i], b, wall.thickness)), circle(island.radius, 24)];
}

/** Plan outlines for the map: the wall strip and the island. */
export function picassoCarParkPlan(): { wall: Vec2[][]; island: Vec2[] } {
  return { wall: wallPoints.slice(1).map((b, i) => strip(wallPoints[i], b, wall.thickness)), island: circle(island.radius) };
}

export function addPicassoCarPark(scene: THREE.Scene): void {
  const group = new THREE.Group();
  group.name = data.id;
  group.userData.noDrape = true;
  group.userData.structural = true;
  const white = plasterMaterial("#f4f1e8");
  wallPoints.slice(1).forEach((b, i) => {
    const a = wallPoints[i];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    // The wall stands on the lower end's ground and is tall enough to meet the higher end's.
    const ya = siteY(a[0], a[1]), yb = siteY(b[0], b[1]), y = Math.min(ya, yb), height = wall.height + PAVING + Math.abs(ya - yb);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, height, wall.thickness), white);
    mesh.position.set((a[0] + b[0]) / 2, y + height / 2, (a[1] + b[1]) / 2);
    mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    mesh.name = wall.id;
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  });
  // The island: a white kerb ring and an earth bed inside it, just below the kerb top.
  const [cx, cz] = island.centre, ground = siteY(cx, cz) + PAVING;
  const kerb = new THREE.Mesh(new THREE.RingGeometry(island.radius - island.kerbWidth, island.radius, 64, 1), white);
  kerb.rotation.x = -Math.PI / 2;
  kerb.position.set(cx, ground + island.kerbHeight, cz);
  const kerbSide = new THREE.Mesh(new THREE.CylinderGeometry(island.radius, island.radius, island.kerbHeight, 64, 1, true), white);
  kerbSide.position.set(cx, ground + island.kerbHeight / 2, cz);
  const bed = new THREE.Mesh(new THREE.CircleGeometry(island.radius - island.kerbWidth, 64), new THREE.MeshStandardMaterial({ color: "#5d4a35", roughness: 1 }));
  bed.rotation.x = -Math.PI / 2;
  bed.position.set(cx, ground + island.kerbHeight - 0.02, cz);
  for (const m of [kerb, kerbSide, bed]) { m.name = island.id; m.receiveShadow = true; group.add(m); }
  scene.add(group);
}
