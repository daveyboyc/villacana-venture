import * as THREE from "three";
import data from "../data/juan_gris_pergolas.json";
import { beam } from "./elena-east-patios";
import { plasterMaterial } from "./materials";
import type { Vec2 } from "./types";

const { width, beamHeight, beamWidth, underside, wallTop, postWidth } = data;

export const juanGrisPergolas = data.pergolas.map((spec) => {
  const [a, b] = spec.wall as Vec2[];
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const inward: Vec2 = [-(b[1] - a[1]) / length, (b[0] - a[0]) / length];
  const shift = ([x, z]: Vec2): Vec2 => [x + inward[0] * width, z + inward[1] * width];
  return { ...spec, ring: [a, b, shift(b), shift(a)] };
});

export function juanGrisPergolaPostRings(): Vec2[][] {
  const half = postWidth / 2;
  return juanGrisPergolas.flatMap(({ ring }) => ring.slice(2).map(([x, z]): Vec2[] => [
    [x - half, z - half], [x + half, z - half], [x + half, z + half], [x - half, z + half],
  ]));
}

export function addJuanGrisPergolas(scene: THREE.Scene, ground: (x: number, z: number) => number): void {
  const timber = new THREE.MeshStandardMaterial({ color: "#352b29", roughness: 0.9 });
  const plaster = plasterMaterial("#fffdf5");
  const group = new THREE.Group();
  group.name = "juan-gris-pergolas";
  group.userData.noDrape = true;
  for (const { id, ring: [a, b, c, d], beams } of juanGrisPergolas) {
    const base = (ground(...a) + ground(...b)) / 2;
    const y = base + underside;
    const support = 0.13;
    // The photographed beams meet the plastered boundary wall and a house-side bearer.
    group.add(beam(a, b, base + wallTop - 0.06, 0.23, underside - wallTop + 0.065, plaster, id));
    group.add(beam(d, c, y - support, support, support, timber, id));
    for (const [x, z] of [d, c]) {
      const bottom = ground(x, z);
      const height = y - support - bottom;
      const pier = new THREE.Mesh(new THREE.BoxGeometry(postWidth, height, postWidth), plaster);
      pier.position.set(x, bottom + height / 2, z);
      pier.name = id;
      pier.castShadow = pier.receiveShadow = true;
      group.add(pier);
    }
    for (let i = 0; i < beams; i++) {
      const fraction = i / (beams - 1);
      const from: Vec2 = [a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction];
      const to: Vec2 = [d[0] + (c[0] - d[0]) * fraction, d[1] + (c[1] - d[1]) * fraction];
      group.add(beam(from, to, y, beamWidth, beamHeight, timber, id));
    }
  }
  scene.add(group);
}
