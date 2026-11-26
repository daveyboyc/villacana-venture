import * as THREE from "three";
import data from "../data/picasso_service_frontage.json";
import { plasterMaterial } from "./materials";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/**
 * Calle Pintor Picasso south of the car park (data/picasso_service_frontage.json), stage 2 of the
 * structure-first order: the hotel's lower wing on the east side (registry 6465301UF1366N_part3, which the
 * registry gives 0 storeys), the walled bin yard at the car park's south-east corner, and the utility row on
 * the west side: the bin store's street face, the set-back wall, the substation, a recessed grey gate, the meter
 * box and the slatted gate. Heights are laser-survey tops over the datum, drawn above the visible paving as the long wall is.
 * The pavement and the asphalt apron are ground-plan surfaces (data/ground_plan_picasso.json).
 */
/** Road and car-park paving is drawn this far above the terrain (src/boundaries.ts); survey tops are lifted by it. */
const PAVING = 0.27;
type Building = { id: string; ring: Vec2[]; top: number; roof: string };
const buildings = data.buildings as unknown as Building[];
const wing = data.hotelWing as unknown as { id: string; ring: Vec2[]; top: number };
type Opening = { at: number; width: number; height: number };
const yard = data.binYard as unknown as {
  id: string; front: Vec2[]; northEnd: Vec2[]; southEnd: Vec2[]; roadFace: Vec2[]; thickness: number; height: number;
  doorway: Opening; streetDoor: Opening;
};
/** The bin yard's walls: its car-park front with the doorway, its road face with the green sliding door, and its two ends. The long wall is its east side north-west of the wall's end. */
const yardWalls: { line: Vec2[]; openings: Opening[] }[] = [
  { line: yard.front, openings: [yard.doorway] },
  { line: yard.roadFace, openings: [yard.streetDoor] },
  { line: yard.southEnd, openings: [] },
  { line: yard.northEnd, openings: [] },
];
const recess = data.recess as unknown as { id: string; points: Vec2[]; thickness: number; top: number };
const gate = data.slattedGate as unknown as { id: string; points: Vec2[]; thickness: number; height: number };
const serviceGate = data.serviceGate as unknown as { id: string; points: Vec2[]; thickness: number; height: number };

function strip(a: Vec2, b: Vec2, thickness: number): Vec2[] {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = (b[1] - a[1]) / length * thickness / 2, nz = -(b[0] - a[0]) / length * thickness / 2;
  return [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]];
}
const along = (a: Vec2, b: Vec2, t: number): Vec2 => {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [a[0] + (b[0] - a[0]) * t / l, a[1] + (b[1] - a[1]) * t / l];
};

/** A wall split round its openings: solid [start, end] runs and the openings, metres from its first point. */
function pieces(line: Vec2[], openings: Opening[]): { solid: [number, number][]; openings: { from: number; to: number; height: number }[] } {
  const [a, b] = line, length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const gaps = openings.map((o) => ({ from: o.at - o.width / 2, to: o.at + o.width / 2, height: o.height })).sort((p, q) => p.from - q.from);
  const solid: [number, number][] = [];
  let at = 0;
  for (const o of gaps) { solid.push([at, o.from]); at = o.to; }
  solid.push([at, length]);
  return { solid: solid.filter(([s, t]) => t - s > 0.01), openings: gaps };
}
const yardStrips = (): Vec2[][] => yardWalls.flatMap((w) => pieces(w.line, w.openings).solid.map(([s, t]) => strip(along(w.line[0], w.line[1], s), along(w.line[0], w.line[1], t), yard.thickness)));

/** Collision: every building and wall; the yard's doorway and gate are left open. */
export function picassoServiceFrontageRings(): Vec2[][] {
  return [
    wing.ring, ...buildings.map((x) => x.ring), ...yardStrips(), strip(serviceGate.points[0], serviceGate.points[1], serviceGate.thickness),
    ...recess.points.slice(1).map((p, i) => strip(recess.points[i], p, recess.thickness)),
    strip(gate.points[0], gate.points[1], gate.thickness),
  ];
}

/** Plan outlines for the map. */
export function picassoServiceFrontagePlan(): { id: string; name: string; ring: Vec2[]; fill: string }[] {
  const named = (id: string) => [data.hotelWing, data.binYard, data.recess, data.slattedGate, data.serviceGate, ...data.buildings].find((x) => x.id === id)!.name;
  return [
    { id: wing.id, name: named(wing.id), ring: wing.ring, fill: "#efe6da" },
    ...buildings.map((x) => ({ id: x.id, name: named(x.id), ring: x.ring, fill: x.roof === "brown" ? "#8a5a44" : "#f7f4ee" })),
    ...yardStrips().map((ring) => ({ id: yard.id, name: named(yard.id), ring, fill: "#f7f4ee" })),
    { id: serviceGate.id, name: named(serviceGate.id), ring: strip(serviceGate.points[0], serviceGate.points[1], serviceGate.thickness), fill: "#8a9094" },
    ...recess.points.slice(1).map((p, i) => ({ id: recess.id, name: named(recess.id), ring: strip(recess.points[i], p, recess.thickness), fill: "#f7f4ee" })),
    { id: gate.id, name: named(gate.id), ring: strip(gate.points[0], gate.points[1], gate.thickness), fill: "#2f3532" },
  ];
}

export function addPicassoServiceFrontage(scene: THREE.Scene): void {
  const group = new THREE.Group();
  group.name = "picasso-service-frontage";
  group.userData.noDrape = true;
  group.userData.structural = true;
  const white = plasterMaterial("#f4f1e8");
  const roofs: Record<string, THREE.Material> = {
    white,
    brown: new THREE.MeshStandardMaterial({ color: "#6e3e2e", roughness: 0.9 }),
    red: new THREE.MeshStandardMaterial({ color: "#b3573f", roughness: 0.95 }),
  };
  const dark = new THREE.MeshStandardMaterial({ color: "#2f3532", roughness: 0.8 });

  // A flat-roofed block: foot below the lowest ground under it, level top. ExtrudeGeometry's groups are the
  // caps (roof) then the sides (walls).
  const block = (id: string, ring: Vec2[], topY: number, roof: THREE.Material) => {
    const foot = Math.min(...ring.map(([x, z]) => siteY(x, z))) - 0.2;
    const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: topY - foot, bevelEnabled: false }), [roof, white]);
    mesh.rotation.x = -Math.PI / 2; mesh.position.y = foot;
    mesh.name = id; mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  // A straight wall piece from bottom to top (world y) between two plan points.
  const wallPiece = (id: string, a: Vec2, b: Vec2, thickness: number, bottom: number, top: number, mat: THREE.Material = white) => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (length < 0.02 || top <= bottom) return;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, top - bottom, thickness), mat);
    mesh.position.set((a[0] + b[0]) / 2, (bottom + top) / 2, (a[1] + b[1]) / 2);
    mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    mesh.name = id; mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  };
  const groundAt = (a: Vec2, b: Vec2) => Math.min(siteY(a[0], a[1]), siteY(b[0], b[1]));

  // The hotel's lower wing: white walls, a flat red roof (aerial) at the surveyed top.
  block(wing.id, wing.ring, wing.top + PAVING, roofs.red);

  // The utility row: substation (brown tiled cap a little proud of its walls), meter box.
  for (const b of buildings) {
    block(b.id, b.ring, b.top + PAVING, roofs[b.roof] ?? white);
    if (b.roof === "brown") {
      const cx = b.ring.reduce((s, p) => s + p[0], 0) / b.ring.length, cz = b.ring.reduce((s, p) => s + p[1], 0) / b.ring.length;
      const grown = b.ring.map(([x, z]) => { const l = Math.hypot(x - cx, z - cz); return [x + (x - cx) / l * 0.15, z + (z - cz) / l * 0.15] as Vec2; });
      const shape = new THREE.Shape(grown.map(([x, z]) => new THREE.Vector2(x, -z)));
      const cap = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: false }), roofs.brown);
      cap.rotation.x = -Math.PI / 2; cap.position.y = b.top + PAVING - 0.06;
      cap.name = `${b.id}-cap`; cap.castShadow = cap.receiveShadow = true;
      group.add(cap);
    }
  }

  // The bin yard: level-topped walls 2.6 m over the car-park paving, open to the sky, its doorway and street door
  // left open under lintels. On the road side the walls stand on the lower road.
  const floor = groundAt(yard.front[0], yard.front[1]) + PAVING, top = floor + yard.height;
  for (const w of yardWalls) {
    const [a, b] = w.line, foot = groundAt(a, b) + PAVING;
    const cut = pieces(w.line, w.openings);
    for (const [s, t] of cut.solid) wallPiece(yard.id, along(a, b, s), along(a, b, t), yard.thickness, foot - 0.3, top);
    for (const o of cut.openings) wallPiece(`${yard.id}-lintel`, along(a, b, o.from), along(a, b, o.to), yard.thickness, foot + o.height, top);
  }

  // The set-back wall between the bin store's street face and the substation, level-topped.
  recess.points.slice(1).forEach((p, i) => wallPiece(recess.id, recess.points[i], p, recess.thickness, groundAt(recess.points[i], p) - 0.2, recess.top + PAVING));

  // The dark slatted gate beside the meter box.
  const [ga, gb] = gate.points, gFoot = groundAt(ga, gb) + PAVING;
  wallPiece(gate.id, ga, gb, gate.thickness, gFoot - 0.3, gFoot + gate.height, dark);

  // The narrow grey gate set back between the substation and the meter box.
  const [sa, sb] = serviceGate.points, sFoot = groundAt(sa, sb) + PAVING;
  wallPiece(serviceGate.id, sa, sb, serviceGate.thickness, sFoot - 0.3, sFoot + serviceGate.height, new THREE.MeshStandardMaterial({ color: "#8a9094", roughness: 0.7 }));

  scene.add(group);
}
