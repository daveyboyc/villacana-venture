import * as THREE from "three";
import data from "../data/picasso_forecourt.json";
import skeleton from "../public/map/skeleton.json";
import { plasterMaterial } from "./materials";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/**
 * The forecourt of Calle Pintor Picasso by the pool building (data/picasso_forecourt.json): the 90 MILES building's
 * upper block on the pool building's road end (registry 6364501UF1366S_part5, footprint unchanged), the low white wall
 * along the plane-tree garden, and, in Show details, the 90 MILES sign and the two grey containers at the low block.
 * The forecourt asphalt is a ground-plan apron; the low block and the utility row are built elsewhere.
 */
const PAVING = 0.27;
const upper = data.ninetyMiles, wall = data.gardenWall;
const upperRing = upper.ring as Vec2[];
const wallLine = wall.points as Vec2[];

function strip(a: Vec2, b: Vec2, thickness: number): Vec2[] {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = (b[1] - a[1]) / length * thickness / 2, nz = -(b[0] - a[0]) / length * thickness / 2;
  return [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]];
}

/** The pool building's roof as the model draws it: ground at its centroid plus its registry storeys. */
function hostRoof(): number {
  const host = (skeleton.buildings as { id: string; ring: number[][]; floors?: number }[]).find((b) => b.id === upper.hostId);
  if (!host) return 3.4;
  const cx = host.ring.reduce((s, p) => s + p[0], 0) / host.ring.length, cz = host.ring.reduce((s, p) => s + p[1], 0) / host.ring.length;
  return siteY(cx, cz) + (host.floors ?? 1) * skeleton.floorHeight;
}

/** Collision: the garden wall (the upper block stands on the registry building, which already has its own). */
export function picassoForecourtRings(): Vec2[][] {
  return wallLine.slice(1).map((p, i) => strip(wallLine[i], p, wall.thickness));
}

/** Plan outlines for the map. */
export function picassoForecourtPlan(): { id: string; name: string; ring: Vec2[]; fill: string }[] {
  return [
    { id: upper.id, name: upper.name, ring: upperRing, fill: "#efebe2" },
    ...wallLine.slice(1).map((p, i) => ({ id: wall.id, name: wall.name, ring: strip(wallLine[i], p, wall.thickness), fill: "#f7f4ee" })),
  ];
}

export function addPicassoForecourt(scene: THREE.Scene): void {
  const group = new THREE.Group();
  group.name = data.id; group.userData.noDrape = true; group.userData.structural = true;
  const white = plasterMaterial("#f4f1e8");

  // The upper block: from just under the pool building's modelled roof to the surveyed top.
  { const foot = hostRoof() - 0.1, top = upper.top + PAVING;
    const shape = new THREE.Shape(upperRing.map(([x, z]) => new THREE.Vector2(x, -z)));
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.5, top - foot), bevelEnabled: false }), white);
    mesh.rotation.x = -Math.PI / 2; mesh.position.y = foot; mesh.name = upper.id; mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh); }

  // The garden wall: a plain white wall, its foot below the lower end of each run.
  wallLine.slice(1).forEach((b, i) => {
    const a = wallLine[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ground = Math.min(siteY(a[0], a[1]), siteY(b[0], b[1])) + PAVING;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(length + wall.thickness, wall.height + 0.3, wall.thickness), white);
    mesh.position.set((a[0] + b[0]) / 2, ground + (wall.height - 0.3) / 2, (a[1] + b[1]) / 2);
    mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); mesh.name = wall.id; mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  });

  scene.add(group);
}

/** Show details: the 90 MILES sign on the upper block's face and the two grey containers. */
export function addPicassoForecourtDetails(into: THREE.Scene, keep: (x: number, z: number) => boolean): void {
  const root = new THREE.Group(); root.name = `${data.id}-details`; root.userData.noDrape = true;
  { const s = data.sign, [a, b] = [upperRing[0], upperRing[1]];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / length, uz = (b[1] - a[1]) / length;
    // Outward (south-east) normal of the face, away from the block.
    const nx = uz, nz = -ux;
    const x = a[0] + ux * s.along + nx * 0.04, z = a[1] + uz * s.along + nz * 0.04;
    const board = new THREE.Mesh(new THREE.BoxGeometry(s.width, s.height, 0.04), new THREE.MeshStandardMaterial({ color: "#1c1c1c", roughness: 0.6 }));
    board.position.set(x, upper.top + PAVING - s.below - s.height / 2, z);
    board.rotation.y = -Math.atan2(uz, ux); board.name = s.id; root.add(board);
    const text = new THREE.Mesh(new THREE.BoxGeometry(s.width * 0.6, 0.12, 0.01), new THREE.MeshStandardMaterial({ color: "#eeeeea", roughness: 0.6 }));
    text.position.set(x + nx * 0.025, board.position.y + 0.15, z + nz * 0.025); text.rotation.y = board.rotation.y; text.name = `${s.id}-lettering`; root.add(text); }
  { const c = data.containers, [w, d, h] = c.size, pts = c.centres as Vec2[];
    const turn = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]);
    const grey = new THREE.MeshStandardMaterial({ color: "#5d6266", roughness: 0.7 }), dark = new THREE.MeshStandardMaterial({ color: "#2b2d2f", roughness: 0.8 });
    for (const [x, z] of pts) {
      if (!keep(x, z)) continue;
      const bin = new THREE.Group(); bin.name = c.id;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.25, d), grey); body.position.y = 0.2 + (h - 0.25) / 2; bin.add(body);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.06, d + 0.06), grey); lid.position.y = h - 0.02; bin.add(lid);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12), dark);
        wheel.rotation.x = Math.PI / 2; wheel.position.set(sx * (w / 2 - 0.15), 0.1, sz * (d / 2 - 0.15)); bin.add(wheel);
      }
      bin.position.set(x, siteY(x, z) + PAVING, z); bin.rotation.y = -turn;
      bin.traverse((o) => { o.castShadow = true; }); root.add(bin);
    }
  }
  into.add(root);
}
