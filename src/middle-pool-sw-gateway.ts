import * as THREE from "three";
import feature from "../data/middle_pool_sw_gateway.json";
import steps from "../data/middle_pool_steps.json";
import { plasterMaterial } from "./materials";
import { addSprites } from "./sprites";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/** The south-west gateway above the middle pool steps (data/middle_pool_sw_gateway.json), in the steps' frame. */
const foot = steps.foot as Vec2, toward = steps.toward as Vec2;
const length = Math.hypot(toward[0] - foot[0], toward[1] - foot[1]);
const up: Vec2 = [(toward[0] - foot[0]) / length, (toward[1] - foot[1]) / length];
/** A point `along` the lane from the foot of the steps and `across` it (positive towards the planter side). */
export const middleSwAt = (along: number, across = 0): Vec2 => [foot[0] + up[0] * along - up[1] * across, foot[1] + up[1] * along + up[0] * across];
export const middleSwFlight = steps;

/** Collision: both piers and the two open leaves along the lane edges. */
export function middleSwRings(): Vec2[][] {
  const g = feature.gatewayAlong, w = feature.opening / 2, p = feature.pierWidth;
  const strip = (a: number, b: number, c: number, d: number): Vec2[] => [middleSwAt(a, c), middleSwAt(b, c), middleSwAt(b, d), middleSwAt(a, d)];
  return [-1, 1].flatMap((side) => {
    const c = side * (w + p / 2);
    return [strip(g - p / 2, g + p / 2, c - p / 2, c + p / 2), strip(g + 0.1, g + w, c - 0.025, c + 0.025)];
  });
}

export function addMiddleSwGateway(scene: THREE.Scene): void {
  const plaster = plasterMaterial("#fffdf5"), iron = new THREE.MeshStandardMaterial({ color: "#26342b", roughness: 0.65 });
  // The gateway stands on the upper level; it is placed at its own ground height and kept out of draping.
  const base = siteY(...middleSwAt(feature.gatewayAlong)) + 0.06;
  const block = (along: number, across: number, w: number, h: number, depth: number, y: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), mat), p = middleSwAt(along, across);
    m.position.set(p[0], y + h / 2, p[1]); m.rotation.y = Math.atan2(up[0], up[1]);
    m.name = feature.id; m.castShadow = m.receiveShadow = true; m.userData.noDrape = true; scene.add(m);
  };
  const g = feature.gatewayAlong, w = feature.opening / 2, p = feature.pierWidth;
  for (const side of [-1, 1]) {
    block(g, side * (w + p / 2), p, feature.height + feature.headHeight, p, base, plaster);
    // Two leaves stand open along the landing edges, keeping the opening clear.
    for (const y of [0.05, 1, 1.95]) block(g + w / 2, side * (w + 0.03), 0.035, 0.035, w, base + y, iron);
    for (let a = 0.08; a < w; a += 0.12) block(g + a, side * (w + 0.03), 0.018, 1.95, 0.018, base, iron);
  }
  block(g, 0, feature.opening, feature.headHeight, p, base + feature.height, plaster);
  block(g, 0, feature.opening + 2 * p + 0.12, 0.07, p + 0.1, base + feature.height + feature.headHeight, plaster);
  if (!scene.userData.layoutOnly) {
    const q = middleSwAt(g, 1.65);
    addSprites(scene, "bougainvillea", [{ x: q[0], z: q[1], y: base + 1.5, scale: 0.75 }]);
  }
}
