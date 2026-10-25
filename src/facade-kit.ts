import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { asset } from "./asset";
import { pointInRing } from "./geom";
import { replacesLaneGroundOpening } from "./middle-pool-lane-frontages";
import { SILVIA_HOST, silviaCloseCamera } from "./silvia-map";
import type { SkeletonBuilding, Vec2 } from "./types";
import traced from "../data/facade_kit.json";

/**
 * The facade kit (public/models, built in Blender by scripts/build_kit.py) on the house walls.
 * Walls in data/facade_kit.json get the parts read from the photos there. The others are
 * generated, one opening per 3.1 m of wall as the flat shutters were: arched doors and
 * shuttered or arched windows on the ground floor; above, balcony doors with iron balconies,
 * windows, or on some walls one wooden balcony with a tiled roof. Details view only; no collision.
 */
const SPACING = 3.1;
const PARTS = ["shutter-door", "iron-balcony", "wood-balcony", "shutter-window", "arched-window"] as const;
/** Each part's own opening width in metres, as built; a traced "width" stretches it along the wall. */
const WIDTH: Record<(typeof PARTS)[number], number> = { "shutter-door": 1.2, "iron-balcony": 1.8, "wood-balcony": 3.0, "shutter-window": 1.4, "arched-window": 0.7 };
/** Distance from a cell's middle beyond which its kit is drawn as flat quads. */
const FAR = 120;
/** The far quad for each opening part, as built: width, height, sill and colour (scripts/build_kit.py). */
const FLAT: Partial<Record<(typeof PARTS)[number], [number, number, number, string]>> = {
  "shutter-door": [1.2, 2.3, 0, "#5b3622"], "shutter-window": [1.4, 1.1, 1.0, "#5b3622"], "arched-window": [0.7, 1.3, 0.9, "#5b3622"],
};
type Traced = { part: (typeof PARTS)[number]; along: number; storey: number; width?: number };
const tracedWalls = new Map<string, Traced[]>(
  (traced as unknown as { walls: { building: string; edge: number; parts: Traced[] }[] }).walls.map((w) => [`${w.building}:${w.edge}`, w.parts]),
);
type Kit = Record<(typeof PARTS)[number], THREE.Matrix4[]>;
const key = (b: SkeletonBuilding, i: number) => `${b.id}:${i}`;
const hash = (x: number, z: number) => { const v = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return v - Math.floor(v); };

/** The walls the kit dresses, as "building id:edge index": every house wall long enough for an
 * opening, or with tracedOnly just the walls traced from photos (small screens keep the flat
 * shutters elsewhere, src/slice.ts). */
export function facadeKitWalls(houses: SkeletonBuilding[], tracedOnly: boolean): Set<string> {
  const walls = new Set<string>();
  for (const b of houses) {
    if (b.floors <= 0) continue;
    b.ring.forEach(([ax, az], i) => {
      const [bx, bz] = b.ring[(i + 1) % b.ring.length];
      if (tracedOnly ? tracedWalls.has(key(b, i)) : Math.hypot(bx - ax, bz - az) >= 2.6) walls.add(key(b, i));
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
  const kit: Kit = { "shutter-door": [], "iron-balcony": [], "wood-balcony": [], "shutter-window": [], "arched-window": [] };
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
      const parts = tracedWalls.get(key(b, i));
      if (parts) {
        for (const p of parts) {
          const width = p.width ?? WIDTH[p.part];
          // Keep the part on its own wall where the photographed corner and the registry corner differ.
          const along = Math.min(Math.max(p.along, width / 2), Math.max(length - width / 2, width / 2));
          kit[p.part].push(new THREE.Matrix4().compose(at(along / length, p.storey * floorHeight), turn, new THREE.Vector3(width / WIDTH[p.part], 1, 1)));
        }
        return;
      }
      const count = Math.max(1, Math.floor(length / SPACING));
      // The porches (addPorches, src/slice.ts) already hang a balcony on walls that look out over
      // open ground, 3.4 m wide every 5 m; there the kit adds the door onto it, not a second balcony.
      const spans = Math.floor(length / 5) || 1, porches = length < 4 ? [] : Array.from({ length: spans }, (_, k) => (k + 0.5) / spans)
        .filter((t) => [1, 2.5, 4.5].every((d) => !houses.some((o) => pointInRing(ax + (bx - ax) * t + nx * d, az + (bz - az) * t + nz * d, o.ring))));
      const underPorch = (t: number) => porches.some((c) => Math.abs(t - c) * length < 2.3);
      const wooden = b.floors > 1 && length >= 3.4 && !porches.length && hash(ax, az) < 0.2;
      for (let k = 0; k < count; k++) {
        const t = (k + 0.5) / count, p = at(t, 0);
        // A wall shared with the next house has no openings.
        if (houses.some((o) => o !== b && pointInRing(p.x + nx * 0.5, p.z + nz * 0.5, o.ring))) continue;
        for (let f = 0; f < b.floors; f++) {
          // The same ground-floor openings the flat shutters leave out (Silvia passage, traced lane frontages).
          if (f === 0 && ((b.id === SILVIA_HOST && silviaCloseCamera(p.x, p.z)) || replacesLaneGroundOpening(p.x, p.z))) continue;
          const h = hash(p.x + f * 7.1, p.z), place = (part: (typeof PARTS)[number]) => kit[part].push(new THREE.Matrix4().compose(at(t, f * floorHeight), turn, one));
          if (f === 0) place(h < 0.35 ? "shutter-door" : h < 0.75 ? "shutter-window" : "arched-window");
          else if (f === 1 && ((wooden && Math.abs(t - 0.5) * length < 1.6) || underPorch(t))) place("shutter-door");
          else if (h < 0.3) { place("shutter-door"); place("iron-balcony"); }
          else place(h < 0.7 ? "shutter-window" : "arched-window");
        }
      }
      if (wooden) kit["wood-balcony"].push(new THREE.Matrix4().compose(at(0.5, floorHeight), turn, one));
    });
  }
  const loader = new GLTFLoader();
  const models = new Map(await Promise.all(PARTS.filter((name) => kit[name].length).map(async (name) => {
    const gltf = await loader.loadAsync(asset(`/models/${name}.glb`));
    gltf.scene.updateMatrixWorld(true);
    return [name, gltf.scene] as const;
  })));
  // The kit goes up in 80 m cells, so frustum culling skips the houses out of view, and beyond
  // FAR from a cell's middle its doors and windows become flat quads in their own colour.
  const cells = new Map<string, { part: (typeof PARTS)[number]; m: THREE.Matrix4 }[]>();
  for (const part of PARTS) for (const m of kit[part]) {
    const cell = `${Math.floor(m.elements[12] / 80)},${Math.floor(m.elements[14] / 80)}`;
    cells.set(cell, [...(cells.get(cell) ?? []), { part, m }]);
  }
  const quad = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0.035);
  const flat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  for (const items of cells.values()) {
    const middle = items.reduce((sum, { m }) => sum.add(new THREE.Vector3().setFromMatrixPosition(m)), new THREE.Vector3()).divideScalar(items.length);
    const offset = new THREE.Matrix4().makeTranslation(-middle.x, -middle.y, -middle.z);
    const lod = new THREE.LOD(), near = new THREE.Group();
    lod.position.copy(middle);
    lod.name = "facade-kit";
    lod.userData.noDrape = true;
    for (const [name, model] of models) {
      const matrices = items.filter((i) => i.part === name).map((i) => offset.clone().multiply(i.m));
      if (!matrices.length) continue;
      model.traverse((o) => {
        const source = o as THREE.Mesh;
        if (!source.isMesh) return;
        const mesh = new THREE.InstancedMesh(source.geometry, source.material, matrices.length);
        matrices.forEach((m, n) => mesh.setMatrixAt(n, m.clone().multiply(source.matrixWorld)));
        mesh.computeBoundingSphere();
        // Doors and windows sit nearly flush with the wall; only balconies throw a shadow worth drawing.
        mesh.castShadow = name === "iron-balcony" || name === "wood-balcony";
        mesh.receiveShadow = true;
        mesh.name = `facade-kit:${name}`;
        near.add(mesh);
      });
    }
    const openings = items.filter((i) => FLAT[i.part]);
    const far = new THREE.InstancedMesh(quad, flat, openings.length);
    openings.forEach(({ part, m }, n) => {
      const [width, height, sill, colour] = FLAT[part]!;
      far.setMatrixAt(n, offset.clone().multiply(m).multiply(new THREE.Matrix4().compose(new THREE.Vector3(0, sill, 0), new THREE.Quaternion(), new THREE.Vector3(width, height, 1))));
      far.setColorAt(n, new THREE.Color(colour));
    });
    far.computeBoundingSphere();
    far.receiveShadow = true;
    far.name = "facade-kit:far";
    lod.addLevel(near, 0);
    lod.addLevel(far, FAR);
    scene.add(lod);
  }
}
