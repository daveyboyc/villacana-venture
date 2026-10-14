import * as THREE from "three";
import steps from "../data/cervantes_elena_steps.json";
import { roadHeight } from "./boundaries";
import { surfaceTexture, plasterMaterial } from "./materials";
import { siteY } from "./terrain";
import type { BoundaryReference, Vec2 } from "./types";

/** The steps beside the Cervantes / Elena ramp (data/cervantes_elena_steps.json). */
const foot = steps.foot as Vec2, toward = steps.toward as Vec2;
const length = Math.hypot(toward[0] - foot[0], toward[1] - foot[1]);
const up: Vec2 = [(toward[0] - foot[0]) / length, (toward[1] - foot[1]) / length];
// North of the lane centreline: a quarter turn from the uphill direction.
const side: Vec2 = [-up[1], up[0]];
const rise = () => siteY(foot[0] + up[0] * steps.end, foot[1] + up[1] * steps.end) - siteY(...foot);

/** Where a point falls on the flight: distance uphill from the foot drain and across from the centreline. */
function onFlight(x: number, z: number): { along: number; across: number } {
  const dx = x - foot[0], dz = z - foot[1];
  return { along: dx * up[0] + dz * up[1], across: dx * side[0] + dz * side[1] };
}

/** The height of the tread at this distance up the flight, above the foot. */
function treadHeight(along: number): number {
  const passed = steps.risers.filter((r) => along >= r).length;
  return (rise() * passed) / steps.risers.length;
}

/** Extra ground height on the steps, over the smooth slope the terrain already gives. */
export function stepsGroundOffset(x: number, z: number): number {
  const { along, across } = onFlight(x, z);
  if (along < 0 || along > steps.end || across < steps.across[0] || across > steps.across[1]) return 0;
  // Before the first riser, and wherever the ramp has caught up, the slope itself is the ground.
  return Math.max(0, siteY(...foot) + treadHeight(along) - siteY(x, z));
}

export function addRampSteps(scene: THREE.Scene, reference: BoundaryReference): void {
  const road = reference.roads.find((r) => r.id === "cervantes");
  if (!road) return;
  const base = roadHeight(road, ...foot).height + siteY(...foot);
  const tread = new THREE.MeshStandardMaterial({ color: "#ffffff", map: surfaceTexture("paving"), roughness: 1 });
  const riser = plasterMaterial("#f6f2e8");
  const width = steps.across[1] - steps.across[0], mid = (steps.across[0] + steps.across[1]) / 2;
  steps.risers.forEach((start, i) => {
    // Each step is a block from its riser to the top of the flight, stacked on the one below.
    const run = steps.end - start, height = (rise() * (i + 1)) / steps.risers.length;
    const block = new THREE.Mesh(new THREE.BoxGeometry(width, height, run), [riser, riser, tread, riser, riser, riser]);
    const at = start + run / 2;
    block.position.set(foot[0] + up[0] * at + side[0] * mid, base + height / 2, foot[1] + up[1] * at + side[1] * mid);
    block.rotation.y = Math.atan2(up[0], up[1]);
    block.castShadow = block.receiveShadow = true;
    block.userData.noDrape = true;
    block.name = steps.id;
    scene.add(block);
  });
}
