import * as THREE from "three";
import layout from "../data/elena_north.json";
import { pointInRing } from "./geom";
import { plasterMaterial, surfaceTexture } from "./materials";
import { addSprites, type SpritePlacement } from "./sprites";
import type { Vec2 } from "./types";

/** Calle Elena north, traced from the 14 October roof photos (data/elena_north.json). */
const gateway = layout.gateway;
const walls = layout.walls.map((w) => ({ ...w, points: w.points as Vec2[], doors: w.doors.map((d) => ({ ...d, at: d.at as Vec2 })) }));
export const elenaNorthBeds = layout.beds.map((b) => ({ ...b, ring: b.ring as Vec2[] }));
export const elenaNorthPlanters = layout.planters.map((p) => ({ ...p, ring: p.ring as Vec2[] }));
export const elenaNorthReview = layout.review.ring as Vec2[];

export const inElenaNorthReview = (x: number, z: number): boolean => pointInRing(x, z, elenaNorthReview);

/** The two solid parts of the gateway wall, either side of the opening on the lane. */
export function gatewayParts(): { west: Vec2[]; east: Vec2[]; cross: Vec2; along: Vec2 } {
  const [a, b] = gateway.points as Vec2[], [la, lb] = [layout.lane.from, layout.lane.to] as Vec2[];
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / length, uz = (b[1] - a[1]) / length;
  const t = ((a[0] - la[0]) * uz - (a[1] - la[1]) * ux) / ((lb[0] - la[0]) * uz - (lb[1] - la[1]) * ux);
  const cross: Vec2 = [la[0] + (lb[0] - la[0]) * t, la[1] + (lb[1] - la[1]) * t];
  const at = (o: number): Vec2 => [cross[0] + ux * o, cross[1] + uz * o];
  return { west: [a, at(gateway.opening[0])], east: [at(gateway.opening[1]), b], cross, along: [ux, uz] };
}

const strip = ([a, b]: Vec2[], thickness: number): Vec2[] => {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = ((b[1] - a[1]) / length) * thickness / 2, nz = (-(b[0] - a[0]) / length) * thickness / 2;
  return [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]];
};

/** Collision: the gateway either side of its opening, the patio wall and the raised beds. */
export function elenaNorthRings(): Vec2[][] {
  const { west, east } = gatewayParts();
  return [
    strip(west, gateway.thickness),
    strip(east, gateway.thickness),
    ...walls.flatMap((w) => w.points.slice(1).map((b, i) => strip([w.points[i], b], w.thickness))),
    ...elenaNorthBeds.map((b) => b.ring),
    ...elenaNorthPlanters.map((p) => p.ring),
  ];
}

/** A straight box between two plan points, standing on the ground. */
function slab(a: Vec2, b: Vec2, height: number, thickness: number, material: THREE.Material, y = 0): THREE.Mesh {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, height, thickness), material);
  mesh.position.set((a[0] + b[0]) / 2, y + height / 2, (a[1] + b[1]) / 2);
  mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

/** A plain wall with a slightly wider white coping, as on the photographed garden walls. */
function wall(scene: THREE.Scene, a: Vec2, b: Vec2, height: number, thickness: number, plaster: THREE.Material, name: string): void {
  const body = slab(a, b, height - 0.05, thickness, plaster);
  const cap = slab(a, b, 0.05, thickness + 0.06, plaster, height - 0.05);
  body.name = cap.name = name;
  scene.add(body, cap);
}

/** A closed brown timber door drawn on one face of a wall. */
function door(scene: THREE.Scene, at: Vec2, along: Vec2, side: number, thickness: number, width: number, height: number, material: THREE.Material): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.04), material);
  mesh.position.set(at[0] - along[1] * side * (thickness / 2 + 0.02), height / 2 + 0.02, at[1] + along[0] * side * (thickness / 2 + 0.02));
  mesh.rotation.y = -Math.atan2(along[1], along[0]);
  scene.add(mesh);
}

export function addElenaNorth(scene: THREE.Scene): void {
  const plaster = plasterMaterial("#fffdf5");
  const timber = new THREE.MeshStandardMaterial({ color: "#6b4126", roughness: 0.85 });
  // Gateway: two wall pieces and an arched head over the opening (IMG_2363).
  const { west, east, cross, along } = gatewayParts();
  wall(scene, west[0], west[1], gateway.height, gateway.thickness, plaster, gateway.id);
  wall(scene, east[0], east[1], gateway.height, gateway.thickness, plaster, gateway.id);
  const half = (gateway.opening[1] - gateway.opening[0]) / 2, pier = 0.12;
  const head = new THREE.Shape();
  head.moveTo(-half - pier, gateway.archSpring);
  head.absellipse(0, gateway.archSpring, half, gateway.archCrown - gateway.archSpring, Math.PI, 0, true);
  head.lineTo(half + pier, gateway.archSpring);
  head.lineTo(half + pier, gateway.top);
  head.quadraticCurveTo(0, gateway.top + 0.18, -half - pier, gateway.top);
  head.closePath();
  const arch = new THREE.Mesh(new THREE.ExtrudeGeometry(head, { depth: gateway.thickness, bevelEnabled: false, curveSegments: 16 }).translate(0, 0, -gateway.thickness / 2), plaster);
  arch.position.set(cross[0], 0, cross[1]);
  arch.rotation.y = -Math.atan2(along[1], along[0]);
  arch.castShadow = arch.receiveShadow = true;
  arch.name = gateway.id;
  scene.add(arch);
  // The garden door in the gateway wall faces the private patio (south side).
  const doorAt: Vec2 = [cross[0] + along[0] * 1.9, cross[1] + along[1] * 1.9];
  door(scene, doorAt, along, 1, gateway.thickness, 0.9, 1.85, timber);

  for (const w of walls) {
    for (let i = 0; i < w.points.length - 1; i++) wall(scene, w.points[i], w.points[i + 1], w.height, w.thickness, plaster, w.id);
    const [a, b] = w.points, length = Math.hypot(b[0] - a[0], b[1] - a[1]), dir: Vec2 = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
    // Doors open onto the lane, on the wall's west face.
    for (const d of w.doors) door(scene, d.at, dir, 1, w.thickness, d.width, d.height, timber);
  }

  // Raised beds: a low white kerb all round, dark soil inside.
  const soil = new THREE.MeshStandardMaterial({ color: "#5a4433", roughness: 1 });
  const hedge = new THREE.MeshStandardMaterial({ color: "#3d6a34", map: surfaceTexture("turf"), roughness: 1 });
  for (const bed of elenaNorthBeds) {
    const shape = new THREE.Shape(bed.ring.map(([x, z]) => new THREE.Vector2(x, -z)));
    const top = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), soil);
    top.position.y = bed.kerb - 0.04;
    top.receiveShadow = true;
    top.name = bed.id;
    scene.add(top);
    bed.ring.forEach((a, i) => {
      const b = bed.ring[(i + 1) % bed.ring.length];
      const kerb = slab(a, b, bed.kerb, 0.14, plaster);
      kerb.name = bed.id;
      scene.add(kerb);
      // Clipped box hedge just inside the kerb (IMG_2199-2201); a detail, not a layout element.
      if (bed.hedgeBorder && !scene.userData.layoutOnly) {
        const c = bed.ring.reduce((s, p) => [s[0] + p[0] / bed.ring.length, s[1] + p[1] / bed.ring.length], [0, 0]);
        const inset = (p: Vec2): Vec2 => { const dx = c[0] - p[0], dz = c[1] - p[1], d = Math.hypot(dx, dz); return [p[0] + (dx / d) * 0.32, p[1] + (dz / d) * 0.32]; };
        scene.add(slab(inset(a), inset(b), bed.hedgeBorder, 0.38, hedge, bed.kerb - 0.04));
      }
    });
  }
  // Small white planter boxes against the west house front (IMG_2201).
  for (const box of elenaNorthPlanters) {
    const shape = new THREE.Shape(box.ring.map(([x, z]) => new THREE.Vector2(x, -z)));
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: box.height, bevelEnabled: false }).rotateX(-Math.PI / 2), plaster);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.name = box.id;
    scene.add(mesh);
  }
  addElenaNorthPlanting(scene, west, east);
}

/** Painted plants for the Details view, inside the beds and over the gateway. */
function addElenaNorthPlanting(scene: THREE.Scene, west: Vec2[], east: Vec2[]): void {
  const [la, lb] = [layout.lane.from, layout.lane.to] as Vec2[];
  const length = Math.hypot(lb[0] - la[0], lb[1] - la[1]), u: Vec2 = [(lb[0] - la[0]) / length, (lb[1] - la[1]) / length], n: Vec2 = [u[1], -u[0]];
  const lane = (s: number, o: number, y = 0, scale = 1): SpritePlacement => ({ x: la[0] + u[0] * s + n[0] * o, y, z: la[1] + u[1] * s + n[1] * o, scale });
  const span = (bed: (typeof elenaNorthBeds)[number]) => {
    const s = bed.ring.map(([x, z]) => (x - la[0]) * u[0] + (z - la[1]) * u[1]), o = bed.ring.map(([x, z]) => (x - la[0]) * n[0] + (z - la[1]) * n[1]);
    return { s0: Math.min(...s), s1: Math.max(...s), o0: Math.min(...o), o1: Math.max(...o) };
  };
  const magnolia: SpritePlacement[] = [], pollarded: SpritePlacement[] = [], strap: SpritePlacement[] = [], shrubs: SpritePlacement[] = [];
  for (const bed of elenaNorthBeds) {
    const { s0, s1, o0, o1 } = span(bed), y = bed.kerb - 0.04;
    if (bed.planting === "magnolia") {
      for (let s = s0 + 1.1; s < s1 - 0.6; s += 2.1) magnolia.push(lane(s, (o0 + o1) / 2 + 0.15, y, 0.85));
      for (let s = s0 + 0.35; s < s1 - 0.2; s += 0.55) strap.push(lane(s, o0 + 0.33, y, 0.9));
    } else if (bed.planting === "pollarded") {
      pollarded.push(lane((s0 + s1) / 2, (o0 + o1) / 2, y, 0.8));
      // Spider-plant-like strap leaves fill the hedged beds (IMG_2201).
      for (let s = s0 + 0.75; s < s1 - 0.6; s += 0.6) for (const o of [o0 + 0.75, o1 - 0.75]) strap.push(lane(s, o, y, 1.1));
    }
    else for (let s = s0 + 0.8; s < s1 - 0.4; s += 1.6) shrubs.push(lane(s, (o0 + o1) / 2 - 0.1, y, 0.6));
  }
  addSprites(scene, "magnolia", magnolia);
  addSprites(scene, "pollarded_tree", pollarded);
  addSprites(scene, "grass", strap);
  addSprites(scene, "hedge", shrubs);
  addSprites(scene, "oleander", elenaNorthPlanters.map((box) => {
    const c = box.ring.reduce((a, q) => [a[0] + q[0] / box.ring.length, a[1] + q[1] / box.ring.length], [0, 0]);
    return { x: c[0], y: box.height - 0.05, z: c[1], scale: 0.45 };
  }));
  // Bougainvillea spills over the gateway wall either side of the arch (IMG_2363).
  const over = (part: Vec2[], t: number): SpritePlacement => ({ x: part[0][0] + (part[1][0] - part[0][0]) * t, y: gateway.height - 0.5, z: part[0][1] + (part[1][1] - part[0][1]) * t, scale: 0.7 });
  addSprites(scene, "bougainvillea", [over(west, 0.3), over(east, 0.55)]);
}
