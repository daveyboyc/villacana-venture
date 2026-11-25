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
  // The wall's foot follows the ground, sampled every metre, while its top is level (laser survey):
  // about 1.4 m high at the uphill north end and 3.1 m at the seaward south end.
  wallPoints.slice(1).forEach((b, i) => {
    const a = wallPoints[i];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]), steps = Math.max(1, Math.ceil(length));
    const ux = (b[0] - a[0]) / length, uz = (b[1] - a[1]) / length, half = wall.thickness / 2;
    const nx = uz * half, nz = -ux * half;
    const positions: number[] = [], index: number[] = [];
    // Four corners per station: left foot, left top, right top, right foot.
    for (let s = 0; s <= steps; s++) {
      const x = a[0] + ux * length * s / steps, z = a[1] + uz * length * s / steps, ground = siteY(x, z);
      const foot = ground - 0.2, top = wall.top + PAVING;
      positions.push(x + nx, foot, z + nz, x + nx, top, z + nz, x - nx, top, z - nz, x - nx, foot, z - nz);
    }
    const quad = (p: number, q: number, r: number, u: number) => index.push(p, q, r, p, r, u);
    for (let s = 0; s < steps; s++) {
      const k = s * 4, n = k + 4;
      quad(k, n, n + 1, k + 1);         // left face
      quad(k + 1, n + 1, n + 2, k + 2); // top
      quad(k + 2, n + 2, n + 3, k + 3); // right face
    }
    const last = steps * 4;
    quad(0, 1, 2, 3);                    // end caps
    quad(last, last + 3, last + 2, last + 1);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(index);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, white);
    (mesh.material as THREE.Material).side = THREE.DoubleSide;
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
