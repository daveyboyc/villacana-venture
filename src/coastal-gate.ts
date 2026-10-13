import { Solids } from "./geom";
import * as THREE from "three";
import data from "../data/coastal_gate.json";
import { barrierRings } from "./boundaries";
import { plasterMaterial } from "./materials";
import type { Boundary, Vec2 } from "./types";
export const coastalParkingEnd = data.parkingEndRing as Vec2[];
export const coastalWalls = data.walls.map((w) => ({
  ...w,
  points: w.points as Vec2[],
}));
export const coastalGate = { ...data.gate, points: data.gate.points as Vec2[] };
export const coastalAccess = {
  ...data.route,
  points: data.route.points as Vec2[],
};
export const coastalWallRings = () => barrierRings(coastalWalls as Boundary[]);
export const coastalClosedGateRings = () =>
  barrierRings([
    { ...coastalGate, solid: true, trust: data.trust },
  ] as Boundary[]);
export function addCoastalGate(
  scene: THREE.Scene,
  height: (x: number, z: number) => number,
) {
  const shape = new THREE.Shape(
    coastalParkingEnd.map(([x, z]) => new THREE.Vector2(x, -z)),
  );
  const apronGeometry = new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2),
    positions = apronGeometry.getAttribute("position");
  for (let i = 0; i < positions.count; i++)
    positions.setY(i, height(positions.getX(i), positions.getZ(i)) + 0.264);
  apronGeometry.computeVertexNormals();
  const apron = new THREE.Mesh(
    apronGeometry,
    new THREE.MeshStandardMaterial({ color: "#888b8b", roughness: 1 }),
  );
  apron.name = "dali-coastal-parking-end";
  apron.userData.noDrape = true;
  apron.receiveShadow = true;
  scene.add(apron);
  const white = plasterMaterial("#fffdf3"),
    steel = new THREE.MeshStandardMaterial({
      color: "#34423b",
      roughness: 0.85,
    });
  const bar = (
    a: Vec2,
    b: Vec2,
    base: number,
    h: number,
    width: number,
    material: THREE.Material,
  ) => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(length, h, width),
      material,
    );
    mesh.position.set((a[0] + b[0]) / 2, base + h / 2, (a[1] + b[1]) / 2);
    mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    mesh.userData.noDrape = true;
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };
  for (const wall of coastalWalls) {
    const [a, b] = wall.points,
      base = height((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) + 0.26;
    const mesh = bar(a, b, base, wall.height, wall.thickness, white);
    mesh.name = wall.id;
    const meshHeight = "meshHeight" in wall ? wall.meshHeight : 0;
    if (meshHeight) {
      const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.14);
      for (let i = 0; i <= n; i++) {
        const x = a[0] + ((b[0] - a[0]) * i) / n,
          z = a[1] + ((b[1] - a[1]) * i) / n;
        bar(
          [x - 0.009, z],
          [x + 0.009, z],
          base + wall.height,
          meshHeight,
          0.018,
          steel,
        );
      }
      for (let y = 0.2; y < meshHeight; y += 0.2)
        bar(a, b, base + wall.height + y, 0.016, 0.018, steel);
    }
  }
  const [a, b] = coastalGate.points,
    width = Math.hypot(b[0] - a[0], b[1] - a[1]),
    base = height(...a) + 0.26;
  const pivot = new THREE.Group();
  pivot.name = coastalGate.id;
  pivot.position.set(a[0], base, a[1]);
  pivot.userData.noDrape = true;
  const leaf = (x: number, y: number, w: number, h: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), steel);
    m.position.set(x, y, 0);
    m.castShadow = true;
    pivot.add(m);
  };
  for (const x of [0.025, width - 0.025])
    leaf(x, coastalGate.height / 2, 0.05, coastalGate.height);
  for (const y of [0.025, 0.65, 1.25, coastalGate.height - 0.025])
    leaf(width / 2, y, width, 0.05);
  for (let x = 0.15; x < width; x += 0.14)
    leaf(x, coastalGate.height / 2, 0.018, coastalGate.height - 0.1);
  scene.add(pivot);
  let open = false;
  return {
    get open() {
      return open;
    },
    setOpen(value: boolean) {
      open = value;
      pivot.rotation.y = value ? -Math.PI / 2 : 0;
    },
    at: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as Vec2,
  };
}

export class GatedSolids extends Solids {
  private readonly closed = new Solids(coastalClosedGateRings());
  constructor(
    private readonly base: Solids,
    private readonly isOpen: () => boolean,
  ) {
    super([]);
  }
  override resolve(x: number, z: number, radius: number, y?: number) {
    const p = this.base.resolve(x, z, radius, y);
    return this.isOpen() ? p : this.closed.resolve(p.x, p.z, radius, y);
  }
}
