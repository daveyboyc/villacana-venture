import * as THREE from "three";
import type { Vec2 } from "./types";

const WALL_HEIGHT = 0.7;
const FENCE_TOP = 1.7;

/** Footprints that stop the player along the seaward wall: one strip per run, one block per corner. */
export function seaWallRings(points: Vec2[]): Vec2[][] {
  const rings: Vec2[][] = points.map(([x, z]) => [[x - 0.3, z - 0.3], [x + 0.3, z - 0.3], [x + 0.3, z + 0.3], [x - 0.3, z + 0.3]]);
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i], [bx, bz] = points[i + 1];
    const length = Math.hypot(bx - ax, bz - az) || 1;
    const nx = ((bz - az) / length) * 0.3, nz = (-(bx - ax) / length) * 0.3;
    rings.push([[ax + nx, az + nz], [bx + nx, bz + nz], [bx - nx, bz - nz], [ax - nx, az - nz]]);
  }
  return rings;
}

/** The low white wall with a dark mesh fence on it, between the south lawn and the paseo. No gate. */
export function addSeaWall(scene: THREE.Scene, points: Vec2[]): void {
  const white = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.92 });
  const post = new THREE.MeshStandardMaterial({ color: "#26352c", roughness: 0.7 });
  const mesh = new THREE.MeshStandardMaterial({ color: "#26352c", roughness: 0.8, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i], [bx, bz] = points[i + 1];
    const length = Math.hypot(bx - ax, bz - az);
    const run = new THREE.Group();
    run.position.set((ax + bx) / 2, 0, (az + bz) / 2);
    run.rotation.y = -Math.atan2(bz - az, bx - ax);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(length + 0.3, WALL_HEIGHT, 0.3), white);
    wall.position.y = WALL_HEIGHT / 2;
    wall.castShadow = wall.receiveShadow = true;
    const fence = new THREE.Mesh(new THREE.PlaneGeometry(length, FENCE_TOP - WALL_HEIGHT), mesh);
    fence.position.y = (FENCE_TOP + WALL_HEIGHT) / 2;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.05, 0.05), post);
    rail.position.y = FENCE_TOP;
    run.add(wall, fence, rail);
    const posts = Math.max(1, Math.round(length / 2.5));
    for (let k = 0; k <= posts; k++) {
      const upright = new THREE.Mesh(new THREE.BoxGeometry(0.06, FENCE_TOP - WALL_HEIGHT, 0.06), post);
      upright.position.set(-length / 2 + (length * k) / posts, (FENCE_TOP + WALL_HEIGHT) / 2, 0);
      run.add(upright);
    }
    scene.add(run);
  }
}
