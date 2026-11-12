import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { asset } from "./asset";

/**
 * The stainless pool fittings built in Blender (scripts/build_pool_kit.py, public/models/pool):
 * goose-neck ladders, the handrails beside pool steps and life rings hung on posts. Each place
 * stands at deck level `y` and is turned so the model's +z (into the pool, or towards it for a
 * life ring) points along `turn` (radians about y, 0 = +z). A simple stand-in is drawn at once
 * and swapped for the instanced model when it has loaded; the three models are about 90 kB.
 */
export type PoolFitting = "ladder" | "step-rail" | "life-ring";
export type FittingPlace = { x: number; y: number; z: number; turn: number };

const models = new Map<string, Promise<THREE.Object3D | null>>();
function kitModel(url: string): Promise<THREE.Object3D | null> {
  let model = models.get(url);
  if (!model) {
    model = new GLTFLoader().loadAsync(asset(url)).then((gltf) => { gltf.scene.updateMatrixWorld(true); return gltf.scene; }, () => null);
    models.set(url, model);
  }
  return model;
}

/** Rough shapes in the models' own axes, shown until (or if not) the model arrives. */
function standIn(kind: PoolFitting): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  if (kind === "ladder") {
    for (const x of [-0.25, 0.25]) {
      parts.push(new THREE.TorusGeometry(0.33, 0.024, 6, 12, Math.PI).rotateY(Math.PI / 2).translate(x, 0.62, -0.2));
      parts.push(new THREE.CylinderGeometry(0.024, 0.024, 0.62, 6).translate(x, 0.31, -0.53));
      parts.push(new THREE.CylinderGeometry(0.024, 0.024, 1.4, 6).translate(x, -0.08, 0.13));
    }
  } else if (kind === "life-ring") {
    parts.push(new THREE.CylinderGeometry(0.024, 0.024, 1.45, 6).translate(0, 0.725, 0));
    parts.push(new THREE.TorusGeometry(0.3, 0.075, 8, 18).translate(0, 1.165, 0.1));
  } else {
    parts.push(new THREE.CylinderGeometry(0.024, 0.024, 0.7, 6).translate(0, 0.35, -0.4));
  }
  return mergeGeometries(parts.map((p) => p.deleteAttribute("uv")), false)!;
}

export function addPoolFittings(scene: THREE.Scene, kind: PoolFitting, places: FittingPlace[], material: THREE.Material): void {
  addKitModel(scene, `/models/pool/${kind}.glb`, standIn(kind), places, material, `pool-fitting:${kind}`);
}

/**
 * Instances of a Blender-built kit model (public/models/...glb) at each place: `standIn` is drawn at
 * once in `material` and swapped for the model when it has loaded (or kept if it cannot load).
 */
export function addKitModel(scene: THREE.Object3D, url: string, standInGeometry: THREE.BufferGeometry, places: FittingPlace[], material: THREE.Material, name: string): void {
  if (!places.length) return;
  const matrices = places.map(({ x, y, z, turn }) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), turn), new THREE.Vector3(1, 1, 1)));
  const rough = new THREE.InstancedMesh(standInGeometry, material, places.length);
  matrices.forEach((m, i) => rough.setMatrixAt(i, m));
  rough.castShadow = true;
  rough.name = name;
  scene.add(rough);
  void kitModel(url).then((model) => {
    if (!model || !rough.parent) return;
    const parent = rough.parent;
    model.traverse((o) => {
      const source = o as THREE.Mesh;
      if (!source.isMesh) return;
      const part = new THREE.InstancedMesh(source.geometry, source.material, places.length);
      matrices.forEach((m, i) => part.setMatrixAt(i, m.clone().multiply(source.matrixWorld)));
      part.computeBoundingSphere();
      part.castShadow = true;
      part.receiveShadow = true;
      part.name = name;
      parent.add(part);
    });
    parent.remove(rough);
  });
}
