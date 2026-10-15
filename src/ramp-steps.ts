import * as THREE from "three";
import cervantes from "../data/cervantes_elena_steps.json";
import middlePool from "../data/middle_pool_steps.json";
import { roadHeight } from "./boundaries";
import { surfaceTexture, plasterMaterial } from "./materials";
import { siteY } from "./terrain";
import type { BoundaryReference, Vec2 } from "./types";

type FlightData = typeof cervantes;

/** Photographed steps beside a lane ramp: data/cervantes_elena_steps.json, data/middle_pool_steps.json. */
export const flights = [cervantes, middlePool].map((steps: FlightData) => {
  const foot = steps.foot as Vec2, toward = steps.toward as Vec2;
  const length = Math.hypot(toward[0] - foot[0], toward[1] - foot[1]);
  const up: Vec2 = [(toward[0] - foot[0]) / length, (toward[1] - foot[1]) / length];
  // A quarter turn from the uphill direction: the north (or north-west) half of the lane.
  const side: Vec2 = [-up[1], up[0]];
  return { steps, foot, up, side };
});
type Flight = (typeof flights)[number];

const rise = (f: Flight) => siteY(f.foot[0] + f.up[0] * f.steps.end, f.foot[1] + f.up[1] * f.steps.end) - siteY(...f.foot);

/** Where a point falls on the flight: distance uphill from the foot and across from the lane centreline. */
function onFlight(f: Flight, x: number, z: number): { along: number; across: number } {
  const dx = x - f.foot[0], dz = z - f.foot[1];
  return { along: dx * f.up[0] + dz * f.up[1], across: dx * f.side[0] + dz * f.side[1] };
}

/** The height of the tread at this distance up the flight, above the foot. */
function treadHeight(f: Flight, along: number): number {
  const passed = f.steps.risers.filter((r) => along >= r).length;
  return (rise(f) * passed) / f.steps.risers.length;
}

/** Extra ground height on the steps, over the smooth slope the terrain already gives. */
export function stepsGroundOffset(x: number, z: number): number {
  for (const f of flights) {
    const { along, across } = onFlight(f, x, z);
    if (along < 0 || along > f.steps.end || across < f.steps.across[0] || across > f.steps.across[1]) continue;
    // Before the first riser, and wherever the ramp has caught up, the slope itself is the ground.
    return Math.max(0, siteY(...f.foot) + treadHeight(f, along) - siteY(x, z));
  }
  return 0;
}

export function addRampSteps(scene: THREE.Scene, reference: BoundaryReference): void {
  const tread = new THREE.MeshStandardMaterial({ color: "#ffffff", map: surfaceTexture("paving"), roughness: 1 });
  const riser = plasterMaterial("#f6f2e8");
  for (const f of flights) {
    const { steps, foot, up, side } = f;
    const road = reference.roads.find((r) => r.id === steps.road);
    if (!road) continue;
    const base = roadHeight(road, ...foot).height + siteY(...foot);
    const width = steps.across[1] - steps.across[0], mid = (steps.across[0] + steps.across[1]) / 2;
    steps.risers.forEach((start, i) => {
      // Each step is a block from its riser to the top of the flight, stacked on the one below.
      const run = steps.end - start, height = (rise(f) * (i + 1)) / steps.risers.length;
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
}
