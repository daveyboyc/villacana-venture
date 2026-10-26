import * as THREE from "three";
import layout from "../data/elena_east_patios.json";
import { pointInRing } from "./geom";
import { plasterMaterial } from "./materials";
import {groundElenaWall} from "./elena-wall-ground";
import { addSprites, type SpriteKind } from "./sprites";
import type { Vec2 } from "./types";

/** Private patios behind the Elena garden wall (data/elena_east_patios.json, issue #38).
 * Only the photographed enclosure walls and pergola are built; the patios' insides are unseen. */
export const elenaEastPatioWalls = layout.walls.map((w) => ({ ...w, points: w.points as Vec2[] }));
export const elenaEastPergola = { ...layout.pergola, ring: layout.pergola.ring as Vec2[] };
export const elenaEastPatioReview = layout.review.ring as Vec2[];
export const inElenaEastPatios = (x: number, z: number): boolean => pointInRing(x, z, elenaEastPatioReview);

const strip = ([a, b]: Vec2[], thickness: number): Vec2[] => {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = ((b[1] - a[1]) / l) * thickness / 2, nz = (-(b[0] - a[0]) / l) * thickness / 2;
  return [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]];
};
/** Pergola posts stand at the ring's corners. */
export const elenaEastPergolaPosts = (): Vec2[][] => elenaEastPergola.ring.map(([x, z]) => {
  const h = elenaEastPergola.post / 2;
  return [[x - h, z - h], [x + h, z - h], [x + h, z + h], [x - h, z + h]];
});
/** Collision: the two enclosure walls (and the pergola posts, unreachable inside the patio). */
export const elenaEastPatioRings = (): Vec2[][] => [...elenaEastPatioWalls.map((w) => strip(w.points, w.thickness)), ...elenaEastPergolaPosts()];

function beam(a: Vec2, b: Vec2, y: number, width: number, height: number, material: THREE.Material, name: string): THREE.Mesh {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, height, width), material);
  mesh.position.set((a[0] + b[0]) / 2, y + height / 2, (a[1] + b[1]) / 2);
  mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.name = name;
  return mesh;
}

export function addElenaEastPatios(scene: THREE.Scene): void {
  const plaster = plasterMaterial("#fffdf5");
  const timber = new THREE.MeshStandardMaterial({ color: "#6b4126", roughness: 0.85 });
  // White walls with a slightly wider coping, matching the existing garden wall.
  for (const w of elenaEastPatioWalls) {
    const [a, b] = w.points;
    scene.add(groundElenaWall(beam(a, b, 0, w.thickness, w.height - 0.05, plaster, w.id)), groundElenaWall(beam(a, b, w.height - 0.05, w.thickness + 0.06, 0.05, plaster, w.id)));
  }
  // Pergola: four posts, two beams along the wall and rafters across them.
  const p = elenaEastPergola, [c0, c1, c2, c3] = p.ring;
  for (const [x, z] of p.ring) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(p.post, p.height, p.post), timber);
    post.position.set(x, p.height / 2, z); post.castShadow = true; post.name = p.id; scene.add(post);
  }
  scene.add(beam(c0, c3, p.height - p.beam, p.beam * 0.8, p.beam, timber, p.id), beam(c1, c2, p.height - p.beam, p.beam * 0.8, p.beam, timber, p.id));
  const along = Math.hypot(c3[0] - c0[0], c3[1] - c0[1]), count = Math.max(2, Math.round(along / p.rafterSpacing));
  for (let i = 0; i <= count; i++) {
    const t = i / count, a: Vec2 = [c0[0] + (c3[0] - c0[0]) * t, c0[1] + (c3[1] - c0[1]) * t], b: Vec2 = [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t];
    const ux = (b[0] - a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1]), uz = (b[1] - a[1]) / Math.hypot(b[0] - a[0], b[1] - a[1]);
    // Rafters overhang the beams a little, as the beam end over the wall in IMG_2199.
    scene.add(beam([a[0] - ux * 0.2, a[1] - uz * 0.2], [b[0] + ux * 0.2, b[1] + uz * 0.2], p.height, 0.07, 0.09, timber, p.id));
  }
  // Bougainvillea over the wall tops: Details only, through the shared route-clearance guard.
  for (const q of layout.planting) addSprites(scene, q.kind as SpriteKind, [{ x: q.at[0], z: q.at[1], y: q.y, scale: q.scale }]);
}
