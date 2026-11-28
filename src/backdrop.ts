import * as THREE from "three";
import data from "../data/backdrop.json";
import { asset } from "./asset";
import { addSprites, type SpriteKind, type SpritePlacement } from "./sprites";

/**
 * The trees and mountains beyond the resort (data/backdrop.json, scripts/build_backdrop.py):
 * trees where the aerial shows canopy and where the north-pool photos show them over the roofs,
 * groves filling the land beyond the aerial, and the distant mountain panorama.
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
 * A flat photographic panorama of the ranges behind Villacana, built from Dave's own photo
 * IMG_2214 and the measured skyline (scripts/build_mountain_texture.py), with soft feathered
 * edges that blend into the sky, replacing the old traced polygon ridges.
 */
const RESORT_CENTRE: [number, number] = [-80, 90];
const FAR_DISTANCE = 4200;
// Real elevation range in degrees; the strip is 21.1 px per degree, produced by scripts/build_mountain_texture.py.
const E_BOTTOM = -2.1;
const E_TOP = 8.5;

export function addRidge(scene: THREE.Scene): void {
  const [cx, cz] = RESORT_CENTRE;
  const R = FAR_DISTANCE;
  const N = 194;
  const yBottom = R * Math.tan((E_BOTTOM * Math.PI) / 180);
  const yTop = R * Math.tan((E_TOP * Math.PI) / 180);

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= N; i++) {
    const bDeg = -112 + i * (194 / N);
    const b = (bDeg * Math.PI) / 180;
    const x = cx + Math.sin(b) * R;
    const z = cz - Math.cos(b) * R;
    const u = i / N;
    positions.push(x, yBottom, z, x, yTop, z);
    // Default flipY = true maps the top row of the image to v = 1 and bottom row to v = 0.
    uvs.push(u, 0, u, 1);
  }

  for (let i = 0; i < N; i++) {
    const v0 = i * 2;
    indices.push(v0, v0 + 2, v0 + 3, v0, v0 + 3, v0 + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);

  const mat = new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = "mountain-panorama";
  mesh.frustumCulled = false;
  mesh.renderOrder = -500;
  mesh.visible = false;
  mesh.userData.noDrape = true;
  mesh.userData.noOcclusion = true;
  mesh.userData.noBatch = true;
  scene.add(mesh);

  const loader = new THREE.TextureLoader();
  loader.load(asset("/art/mountains/panorama.webp"), (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.anisotropy = 8;
    mat.map = tex;
    mat.needsUpdate = true;
    mesh.visible = true;
  });
}
