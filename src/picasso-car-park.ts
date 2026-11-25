import * as THREE from "three";
import data from "../data/picasso_car_park.json";
import { barrierBollard, carParkBarrier, BARRIER_POST_RADIUS, CABINET, CABINET_RADIUS } from "./car-park-barrier";
import { plasterMaterial } from "./materials";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/**
 * The main (Picasso) car park's structure, estimated from the aerial and the photos
 * (data/picasso_car_park.json): the long white wall between the car park and Calle Pintor
 * Picasso, the round island's white kerb and raised bed, and the security barrier at the north entrance
 * (src/car-park-barrier.ts): entry in the west lane, exit in the east. Planting on the island is left for the detail stage.
 */
const wall = data.wall, island = data.island;
type Barrier = { id: string; restPost: Vec2; pivot: Vec2; armLength: number; bollard: Vec2 | null; cabinetSide: string };
const barriers = data.barriers as unknown as Barrier[];
const gatehouse = data.gatehouse as unknown as { id: string; ring: Vec2[]; height: number };
/** The car-park and road paving is drawn this far above the terrain (boundaries.ts); kerb and wall heights are measured from it. */
const PAVING = 0.27;
const wallPoints = wall.points as Vec2[];

function strip(a: Vec2, b: Vec2, thickness: number): Vec2[] {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = (b[1] - a[1]) / length * thickness / 2, nz = -(b[0] - a[0]) / length * thickness / 2;
  return [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]];
}

function circle(radius: number, steps = 48, centre: Vec2 = island.centre as Vec2): Vec2[] {
  return Array.from({ length: steps }, (_, i) => {
    const t = i / steps * Math.PI * 2;
    return [centre[0] + Math.cos(t) * radius, centre[1] + Math.sin(t) * radius] as Vec2;
  });
}

/** Where a barrier's drive cabinet stands: beside the pivot, on the side the data names. */
function cabinetCentre(b: Barrier): Vec2 {
  const [px, pz] = b.pivot, l = Math.hypot(b.restPost[0] - px, b.restPost[1] - pz);
  const ux = (b.restPost[0] - px) / l, uz = (b.restPost[1] - pz) / l;
  // Normal to the boom pointing to the named side (north is -z).
  let nx = -uz, nz = ux;
  if ((b.cabinetSide === "north" && nz > 0) || (b.cabinetSide === "south" && nz < 0)) { nx = -nx; nz = -nz; }
  const back = CABINET.width / 2 + 0.02, off = CABINET.depth / 2 + 0.05;
  return [px - ux * back + nx * off, pz - uz * back + nz * off];
}

/** Collision for the wall, the island (kerb and bed together) and the barrier's fixed posts and cabinet; the boom lifts, so it is left open. */
export function picassoCarParkRings(): Vec2[][] {
  const posts = barriers.flatMap((b) => [circle(BARRIER_POST_RADIUS, 8, b.restPost), ...(b.bollard ? [circle(BARRIER_POST_RADIUS, 8, b.bollard)] : []), circle(CABINET_RADIUS, 8, cabinetCentre(b))]);
  return [...wallPoints.slice(1).map((b, i) => strip(wallPoints[i], b, wall.thickness)), circle(island.radius, 24), ...posts, gatehouse.ring];
}

/** Plan outlines for the map: the wall strip, the island and each barrier's boom line with its posts. */
export function picassoCarParkPlan(): { wall: Vec2[][]; island: Vec2[]; gatehouse: Vec2[]; barriers: { id: string; boom: Vec2[]; posts: Vec2[] }[] } {
  return {
    gatehouse: gatehouse.ring,
    wall: wallPoints.slice(1).map((b, i) => strip(wallPoints[i], b, wall.thickness)), island: circle(island.radius),
    barriers: barriers.map((b) => ({ id: b.id, boom: [b.pivot, b.restPost], posts: [b.restPost, ...(b.bollard ? [b.bollard] : []), cabinetCentre(b)] })),
  };
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
  // The north-entrance barriers, closed as photographed (IMG_3131, Street View, Google 3D top-down): pivot and cabinet at
  // the gatehouse island end, the boom in the rest post's fork at the other, the entry lane's bollard just beyond.
  for (const b of barriers) {
    const [px, pz] = b.pivot, dx = b.restPost[0] - px, dz = b.restPost[1] - pz;
    // Local +x runs from pivot to rest post; the cabinet sits on local -z (side 1) or +z (side -1).
    // With rotation.y = turn, local -z points to world (-sin turn, -cos turn); north is world -z.
    const turn = Math.atan2(-dz, dx), minusZIsNorth = -Math.cos(turn) < 0;
    const side: 1 | -1 = minusZIsNorth === (b.cabinetSide === "north") ? 1 : -1;
    const barrier = carParkBarrier({ armLength: Math.hypot(dx, dz), name: b.id, side });
    barrier.rotation.y = turn;
    // The boom stays level at the photographed rest post's height; the cabinet runs down into the paving.
    barrier.position.set(px, siteY(b.restPost[0], b.restPost[1]) + PAVING, pz);
    group.add(barrier);
    if (b.bollard) {
      const bollard = barrierBollard(`${b.id}-bollard`);
      bollard.position.set(b.bollard[0], siteY(b.bollard[0], b.bollard[1]) + PAVING, b.bollard[1]);
      group.add(bollard);
    }
  }
  // The gatehouse on the entrance island: a plain white block standing on the paving, flat-roofed.
  const footY = Math.min(...gatehouse.ring.map(([x, z]) => siteY(x, z))) + PAVING - 0.1;
  const shape = new THREE.Shape(gatehouse.ring.map(([x, z]) => new THREE.Vector2(x, -z)));
  const block = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: gatehouse.height + 0.1, bevelEnabled: false }), white);
  block.rotation.x = -Math.PI / 2; block.position.y = footY;
  block.name = gatehouse.id; block.castShadow = block.receiveShadow = true;
  group.add(block);
  scene.add(group);
}
