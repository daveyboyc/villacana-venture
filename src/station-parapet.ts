import * as THREE from "three";
import data from "../data/plain_fronts.json";
import { photoMetres, photoTexture, plasterMaterial } from "./materials";

/**
 * Short roof-edge parapets capped with barrel tiles (data/plain_fronts.json `parapets`), measured
 * through a solved photo camera. Heights are above the model datum, so the meshes are not draped.
 * A white wall runs along `from`-`to`; on it the tiles slope from `innerTop` (the terrace side) down
 * to `outerTop` at the edge, over `coping` metres.
 */
type Parapet = { id: string; from: number[]; to: number[]; outerTop: number; innerTop: number; coping: number; thickness: number };

export function addStationParapets(scene: THREE.Scene, roofTop: (id: string) => number | undefined): void {
  const list = ((data as { parapets?: (Parapet & { building: string })[] }).parapets ?? []);
  if (!list.length) return;
  const tiles = photoTexture("roof-tiles").clone(), normals = photoTexture("roof-tiles", true).clone();
  for (const t of [tiles, normals]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / photoMetres("roof-tiles"), 1 / photoMetres("roof-tiles")); t.needsUpdate = true; }
  const tileMaterial = new THREE.MeshStandardMaterial({ map: tiles, normalMap: normals, roughness: 0.95, side: THREE.DoubleSide });
  const white = plasterMaterial("#fbf8f0");
  for (const p of list) {
    const [ax, az] = p.from, [bx, bz] = p.to, length = Math.hypot(bx - ax, bz - az);
    const ux = (bx - ax) / length, uz = (bz - az) / length;
    // Outward is the side away from the building's roof, found by the caller's roof test.
    const base = roofTop(p.building) ?? p.outerTop - 1;
    const mx = (ax + bx) / 2, mz = (az + bz) / 2, yaw = -Math.atan2(uz, ux);
    const wallHeight = p.outerTop - base;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(length, wallHeight, p.thickness), white);
    wall.position.set(mx, base + wallHeight / 2, mz); wall.rotation.y = yaw; wall.name = `${p.id}-wall`; wall.castShadow = wall.receiveShadow = true;
    // The coping: a tiled plane from the edge back over the terrace, rising to innerTop.
    const rise = p.innerTop - p.outerTop, slope = Math.hypot(p.coping, rise);
    const coping = new THREE.Mesh(new THREE.PlaneGeometry(length + 0.1, slope), tileMaterial);
    coping.rotation.order = "YXZ"; coping.rotation.set(-Math.PI / 2 + Math.atan2(rise, p.coping), yaw, 0);
    // Normal pointing inward across the edge: the side of the line away from the camera's terrace is outward (+n).
    const nx = -uz, nz = ux;
    coping.position.set(mx - nx * p.coping / 2, p.outerTop + rise / 2 + 0.02, mz - nz * p.coping / 2);
    coping.name = `${p.id}-tiles`; coping.castShadow = coping.receiveShadow = true;
    for (const m of [wall, coping]) { m.userData.noDrape = true; m.userData.structural = true; scene.add(m); }
  }
}
