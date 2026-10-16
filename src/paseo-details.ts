import * as THREE from "three";
import data from "../data/paseo_details.json";
import wallData from "../data/paseo_wall.json";
import { paseoWallFace } from "./paseo-wall";
import type { Seaside } from "./seaside";

/** Wall-relative station: source line and levels remain shared with structure. */
export function paseoDetailStation(along: number, inland: number) {
  let remaining = along;
  for (let i = 0; i < paseoWallFace.length - 1; i++) {
    const a = paseoWallFace[i], b = paseoWallFace[i + 1];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (remaining <= length || i === paseoWallFace.length - 2) {
      const t = Math.min(1, remaining / length), tx = (b[0] - a[0]) / length, tz = (b[1] - a[1]) / length;
      return { x: a[0] + (b[0] - a[0]) * t + tz * inland, z: a[1] + (b[1] - a[1]) * t - tx * inland, tx, tz };
    }
    remaining -= length;
  }
  throw new Error("Empty paseo wall");
}

/** Optional photo-backed details. Never creates collision or changes terrain. */
export function addPaseoDetails(scene: THREE.Scene, seaside: Seaside, inlandY: (x: number, z: number) => number): void {
  if (scene.userData.layoutOnly) return;
  const clear = scene.userData.decorationClearance as ((x: number, z: number, radius: number) => boolean) | undefined;
  if (!clear) return; // No placement without the shared guard.
  const group = new THREE.Group(); group.name = "paseo-photo-details"; group.userData.noDrape = true;
  const material = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: .9 });
  const green = material("#40543a"), cloth = material("#456d60"), white = material("#e6e5db"), lid = material("#716a61");
  const box = (w: number, h: number, d: number, mat: THREE.Material, name: string, x: number, y: number, z: number, angle: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.name = name; mesh.position.set(x, y, z); mesh.rotation.y = angle; mesh.castShadow = mesh.receiveShadow = true; return mesh;
  };
  for (const f of data.features) {
    const feature = new THREE.Group(); feature.name = f.id; feature.userData.evidence = f.evidence;
    if (f.kind === "hedge" || f.kind === "cloth") {
      // Short pieces follow corners/heights. Circle includes every visible box corner.
      const step = f.kind === "cloth" ? .1 : .5;
      for (let s = f.along[0]; s < f.along[1]; s += step) {
        const length = Math.min(step, f.along[1] - s), p = paseoDetailStation(s + length / 2, f.inland);
        if (!clear(p.x, p.z, Math.hypot(length / 2, f.width / 2))) continue;
        // Same ground sample that sets the wall cap; foliage starts at garden datum.
        const rear = paseoDetailStation(s + length / 2, wallData.wall.thickness + .3);
        const base = inlandY(rear.x, rear.z) + (f.kind === "cloth" ? wallData.wall.coping + .04 : 0);
        feature.add(box(length, f.height, f.width, f.kind === "hedge" ? green : cloth, f.id + "-section", p.x, base + f.height / 2, p.z, -Math.atan2(p.tz, p.tx)));
      }
    } else if (f.kind === "lamp") {
      const p = paseoDetailStation(f.along[0], f.inland);
      // Head reaches .45 m seaward; use its furthest corner from the shaft.
      const radius = Math.hypot(.45, .18);
      if (!clear(p.x, p.z, radius)) continue;
      const y = seaside.y(p.x, p.z) + .04;
      feature.add(box(.16, f.height, .16, white, f.id + "-shaft", p.x, y + f.height / 2, p.z, 0));
      feature.add(box(.32, .065, .65, white, f.id + "-head", p.x - p.tz * .125, y + f.height, p.z + p.tx * .125, -Math.atan2(p.tz, p.tx)));
    } else {
      // A flush horizontal surface is not an obstructing prop: it intentionally lies
      // within the photographed walk. No vertical volume, sprite or solid is added.
      const p = paseoDetailStation(f.along[0], f.inland);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(f.width, f.width), lid);
      mesh.name = f.id + "-surface"; mesh.rotation.set(-Math.PI / 2, 0, Math.atan2(p.tz, p.tx));
      mesh.position.set(p.x, seaside.y(p.x, p.z) + .046, p.z);
      mesh.userData.flushRouteSurface = true; feature.add(mesh);
    }
    if (feature.children.length) group.add(feature);
  }
  scene.add(group);
}
