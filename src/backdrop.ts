import * as THREE from "three";
import data from "../data/backdrop.json";
import { addSprites, type SpriteKind, type SpritePlacement } from "./sprites";

/**
 * The trees and mountains beyond the resort (data/backdrop.json, scripts/build_backdrop.py):
 * trees where the aerial shows canopy and where the north-pool photos show them over the roofs,
 * groves filling the land beyond the aerial, and the mountain ridge traced from the photos.
 */
type Tree = [SpriteKind, number, number, number, string];
const trees = data.trees as unknown as Tree[];
const [bx0, bz0, bx1, bz1] = data.block;
const TURN = (26 * Math.PI) / 180;
/** Trees nearer than this to a shown pool get the detailed models; the rest the light distant ones.
 * Palms always use the distant model here: the detailed palm is 11,000 triangles. */
const NEAR = 85;

/** Whether a point is inside the resort block, whose own trees come from the ground cover and the props. */
export function inResortBlock(x: number, z: number): boolean {
  const tx = x * Math.cos(TURN) - z * Math.sin(TURN), tz = x * Math.sin(TURN) + z * Math.cos(TURN);
  return tx >= bx0 && tx <= bx1 && tz >= bz0 && tz <= bz1;
}

export function addBackdropTrees(scene: THREE.Scene, courts: { x: number; z: number }[]): void {
  const near = new Map<SpriteKind, SpritePlacement[]>(), far = new Map<SpriteKind, SpritePlacement[]>();
  for (const [kind, x, z, scale] of trees) {
    const close = kind !== "palm" && courts.some((c) => Math.hypot(c.x - x, c.z - z) < NEAR);
    const list = close ? near : far;
    if (!list.has(kind)) list.set(kind, []);
    list.get(kind)!.push({ x, z, scale });
  }
  for (const [kind, places] of near) addSprites(scene, kind, places);
  for (const [kind, places] of far) addSprites(scene, kind, places, { far: true });
}

/**
 * The mountains, as one band at a fixed distance from the north-pool station: its top follows the
 * bearing and elevation of the ridge traced in IMG_2204-2206, falling to low hills past them.
 * Hazy blue-grey at the crest, greyer green at the foot, as in the photos.
 */
export function addRidge(scene: THREE.Scene): void {
  const [sx, sy, sz] = data.station, distance = data.ridgeDistance;
  const ridge = [...(data.ridge as [number, number, string][])].sort((a, b) => ((a[0] + 180) % 360) - ((b[0] + 180) % 360));
  const positions: number[] = [], colours: number[] = [];
  const top = new THREE.Color("#93a2b3"), foot = new THREE.Color("#788a84");
  const point = ([bearing, elevation]: [number, number, string], up: boolean) => {
    const a = (bearing * Math.PI) / 180;
    const y = up ? sy + distance * Math.tan((elevation * Math.PI) / 180) : -60;
    positions.push(sx + Math.sin(a) * distance, y, sz - Math.cos(a) * distance);
    const c = up ? top.clone().lerp(foot, Math.max(0, 0.35 - elevation / 20)) : foot;
    colours.push(c.r, c.g, c.b);
  };
  for (let i = 0; i < ridge.length - 1; i++) {
    const a = ridge[i], b = ridge[i + 1];
    point(a, false); point(b, false); point(b, true);
    point(a, false); point(b, true); point(a, true);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }));
  mesh.name = "mountain-ridge";
  scene.add(mesh);
}
