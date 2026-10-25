import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { asset } from "./asset";
import { centroid, pointInRing } from "./geom";
import type { SkeletonBuilding, Vec2 } from "./types";

/**
 * The facade kit (public/models, built in Blender by scripts/build_kit.py) on the house walls
 * that face the north pool: arched louvred doors on every opening, and on the upper floor an
 * iron balcony at each door or, on some walls, one wooden balcony with a tiled roof. Openings
 * keep the spacing of the generated shutters (one per 3.1 m of wall); which walls get a wooden
 * balcony is generated too, not traced from the photos. Details view only; no collision.
 */
const SPACING = 3.1;
const PARTS = ["shutter-door", "iron-balcony", "wood-balcony"] as const;
type Kit = Record<(typeof PARTS)[number], THREE.Matrix4[]>;
const key = (b: SkeletonBuilding, i: number) => `${b.id}:${i}`;
const hash = (x: number, z: number) => { const v = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return v - Math.floor(v); };

/** Walls whose openings face the pool across open ground, as "building id:edge index". */
export function poolFacingWalls(houses: SkeletonBuilding[], pool: Vec2[], reach = 45): Set<string> {
  const centre = centroid(pool), walls = new Set<string>();
  for (const b of houses) {
    b.ring.forEach(([ax, az], i) => {
      const [bx, bz] = b.ring[(i + 1) % b.ring.length], length = Math.hypot(bx - ax, bz - az);
      if (length < 2.6) return;
      const outward = facing(b.ring, ax, az, bx, bz), mx = (ax + bx) / 2, mz = (az + bz) / 2;
      const tx = centre.x - mx, tz = centre.z - mz, distance = Math.hypot(tx, tz);
      const clear = !houses.some((o) => pointInRing(mx + outward[0] * 3, mz + outward[1] * 3, o.ring));
      if (distance < reach && (outward[0] * tx + outward[1] * tz) / distance > 0.5 && clear) walls.add(key(b, i));
    });
  }
  return walls;
}

function facing(ring: Vec2[], ax: number, az: number, bx: number, bz: number): Vec2 {
  const length = Math.hypot(bx - ax, bz - az);
  let nx = (bz - az) / length, nz = -(bx - ax) / length;
  if (pointInRing((ax + bx) / 2 + nx * 0.3, (az + bz) / 2 + nz * 0.3, ring)) { nx = -nx; nz = -nz; }
  return [nx, nz];
}

export async function addFacadeKit(scene: THREE.Scene, houses: SkeletonBuilding[], walls: Set<string>, floorHeight: number): Promise<void> {
  const kit: Kit = { "shutter-door": [], "iron-balcony": [], "wood-balcony": [] };
  const up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
  for (const b of houses) {
    // Stand on the house's own floor datum, as draped (src/terrain.ts).
    const datum = scene.getObjectByName(`building:${b.id}`)?.position.y ?? 0;
    b.ring.forEach(([ax, az], i) => {
      if (!walls.has(key(b, i))) return;
      const [bx, bz] = b.ring[(i + 1) % b.ring.length], length = Math.hypot(bx - ax, bz - az);
      const [nx, nz] = facing(b.ring, ax, az, bx, bz);
      const turn = new THREE.Quaternion().setFromAxisAngle(up, Math.atan2(nx, nz));
      const at = (t: number, y: number) => new THREE.Vector3(ax + (bx - ax) * t + nx * 0.02, datum + y, az + (bz - az) * t + nz * 0.02);
      const count = Math.max(1, Math.floor(length / SPACING));
      const wooden = b.floors > 1 && length >= 3.4 && hash(ax, az) < 0.35;
      for (let k = 0; k < count; k++) {
        const t = (k + 0.5) / count, p = at(t, 0);
        // A wall shared with the next house has no openings.
        if (houses.some((o) => o !== b && pointInRing(p.x + nx * 0.5, p.z + nz * 0.5, o.ring))) continue;
        for (let f = 0; f < b.floors; f++) {
          kit["shutter-door"].push(new THREE.Matrix4().compose(at(t, f * floorHeight), turn, one));
          if (f > 0 && !(wooden && Math.abs(t - 0.5) * length < 1.6)) kit["iron-balcony"].push(new THREE.Matrix4().compose(at(t, f * floorHeight), turn, one));
        }
      }
      if (wooden) kit["wood-balcony"].push(new THREE.Matrix4().compose(at(0.5, floorHeight), turn, one));
    });
  }
  const loader = new GLTFLoader();
  await Promise.all(PARTS.map(async (name) => {
    if (!kit[name].length) return;
    const gltf = await loader.loadAsync(asset(`/models/${name}.glb`));
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      const source = o as THREE.Mesh;
      if (!source.isMesh) return;
      const mesh = new THREE.InstancedMesh(source.geometry, source.material, kit[name].length);
      kit[name].forEach((m, n) => mesh.setMatrixAt(n, m.clone().multiply(source.matrixWorld)));
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.userData.noDrape = true;
      mesh.name = `facade-kit:${name}`;
      scene.add(mesh);
    });
  }));
}
