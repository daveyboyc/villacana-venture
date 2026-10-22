import { addMiddlePoolNorth, inMiddlePoolNorthReview, middlePoolNorthRings } from "./middle-pool-north";
import * as THREE from "three";
import layout from "../data/middle_pool.json";
import { pointInRing } from "./geom";
import { plasterMaterial, surfaceTexture } from "./materials";
import { addSprites, type SpritePlacement } from "./sprites";
import type { Vec2 } from "./types";
import { inLaneFrontageBand } from "./middle-pool-lane-frontages";

/** The middle pool courtyard: east gateway from Calle Eva and the west planter wall (data/middle_pool.json). */
const gateway = layout.gateway;
export const middlePoolPlanter = { ...layout.planter, ring: layout.planter.ring as Vec2[], face: layout.planter.face as Vec2[] };
export const middlePoolReview = layout.review.rings as Vec2[][];

export const inMiddlePoolReview = (x: number, z: number): boolean => middlePoolReview.some((ring) => pointInRing(x, z, ring)) || inMiddlePoolNorthReview(x,z) || inLaneFrontageBand(x,z);

/** Generated garden walls, gates and props give way to the traced features inside the reviewed bands. */
export function suppressInMiddlePoolReview<T extends { gardenWalls: Vec2[]; gardenGates: Vec2[]; props: { x: number; z: number }[] }>(skeleton: T): void {
  skeleton.gardenWalls = skeleton.gardenWalls.filter(([x, z]) => !inMiddlePoolReview(x, z));
  skeleton.gardenGates = skeleton.gardenGates.filter(([x, z]) => !inMiddlePoolReview(x, z));
  skeleton.props = skeleton.props.filter((p) => !inMiddlePoolReview(p.x, p.z));
}

/**
 * The gateway in its own frame: `along` runs along the wall from its north-west end to its
 * south-east end, `inward` points into the courtyard, `cross` is where Calle Eva crosses it.
 */
export function middleGatewayFrame(): { cross: Vec2; along: Vec2; inward: Vec2; nw: Vec2[]; se: Vec2[]; at: (o: number, i?: number) => Vec2 } {
  const [a, b] = gateway.points as Vec2[], [la, lb] = [layout.lane.from, layout.lane.to] as Vec2[];
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / length, uz = (b[1] - a[1]) / length;
  const t = ((a[0] - la[0]) * uz - (a[1] - la[1]) * ux) / ((lb[0] - la[0]) * uz - (lb[1] - la[1]) * ux);
  const cross: Vec2 = [la[0] + (lb[0] - la[0]) * t, la[1] + (lb[1] - la[1]) * t];
  const inward: Vec2 = -uz * (lb[0] - la[0]) + ux * (lb[1] - la[1]) > 0 ? [-uz, ux] : [uz, -ux];
  const at = (o: number, i = 0): Vec2 => [cross[0] + ux * o + inward[0] * i, cross[1] + uz * o + inward[1] * i];
  return { cross, along: [ux, uz], inward, nw: [a, at(gateway.opening[0])], se: [at(gateway.opening[1]), b], at };
}

/** The open leaf as a plan line, from its hinge on the south-east jamb into the courtyard. */
export function middleGatewayLeaf(): Vec2[] {
  const { along, inward, at } = middleGatewayFrame(), [lo, hi] = gateway.opening, angle = (gateway.leaf.openDegrees * Math.PI) / 180, w = hi - lo;
  const hinge = at(hi + 0.02, gateway.pier.depth / 2 + 0.02);
  const dir: Vec2 = [inward[0] * Math.sin(angle) - along[0] * Math.cos(angle), inward[1] * Math.sin(angle) - along[1] * Math.cos(angle)];
  return [hinge, [hinge[0] + dir[0] * w, hinge[1] + dir[1] * w]];
}

const strip = ([a, b]: Vec2[], thickness: number): Vec2[] => {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = ((b[1] - a[1]) / length) * thickness / 2, nz = (-(b[0] - a[0]) / length) * thickness / 2;
  return [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]];
};

/** Collision: both gateway wings, the two piers, the open leaf and the raised planter. */
export function middlePoolRings(): Vec2[][] {
  const { nw, se, at } = middleGatewayFrame(), [lo, hi] = gateway.opening, { width, depth } = gateway.pier;
  const pier = (o: number) => strip([at(o - width / 2), at(o + width / 2)], depth);
  return [
    strip(nw, gateway.thickness),
    strip(se, gateway.thickness),
    pier(lo - width / 2),
    pier(hi + width / 2),
    strip(middleGatewayLeaf(), 0.06),
    middlePoolPlanter.ring,
    ...middlePoolNorthRings(),
  ];
}

/** Places a mesh built in the wall's frame (local x along the wall, local z into the courtyard). */
function inWallFrame(mesh: THREE.Object3D, o: number, i = 0): THREE.Object3D {
  const { along, at } = middleGatewayFrame(), [x, z] = at(o, i), frame = new THREE.Group();
  frame.add(mesh);
  frame.position.set(x, 0, z);
  frame.rotation.y = -Math.atan2(along[1], along[0]);
  frame.traverse((m) => { if (m instanceof THREE.Mesh) m.castShadow = m.receiveShadow = true; m.name = gateway.id; });
  return frame;
}

/** A wall-plane profile (x along, y up) extruded through the wall's thickness. */
function profile(points: (shape: THREE.Shape) => void, depth: number, material: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape();
  points(shape);
  return new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 12 }).translate(0, 0, -depth / 2), material);
}

function box(w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y + h / 2, z);
  return mesh;
}

/** A flat sign panel painted on a canvas: the white community notice or the blue dog-rule pair. */
function signTexture(kind: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = kind === "notice" ? 180 : 80;
  const g = canvas.getContext("2d")!;
  if (kind === "notice") {
    g.fillStyle = "#f4f4ef"; g.fillRect(0, 0, 128, 180);
    g.fillStyle = "#222"; g.font = "bold 11px sans-serif"; g.textAlign = "center"; g.fillText("COMUNIDAD VILLACANA", 64, 18);
    g.fillStyle = "#777";
    for (let y = 32; y < 170; y += 9) g.fillRect(12, y, y % 36 === 32 ? 70 : 104, 3);
  } else {
    g.fillStyle = "#f4f4ef"; g.fillRect(0, 0, 128, 80);
    for (const cx of [32, 96]) {
      g.fillStyle = "#1d4fa0"; g.fillRect(cx - 30, 4, 60, 72);
      g.fillStyle = "#fff"; g.beginPath(); g.arc(cx, 30, 20, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#1d4fa0"; g.beginPath(); g.arc(cx, 30, 16, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#fff"; g.fillRect(cx - 6, 20, 4, 18); g.fillRect(cx + 2, 30, 10, 6); g.fillRect(cx - 24, 58, 48, 4); g.fillRect(cx - 20, 66, 40, 4);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** The single black iron leaf: frame, bars and a scrolled middle rail, built along local x from the hinge. */
function leaf(width: number, height: number, iron: THREE.Material): THREE.Group {
  const group = new THREE.Group(), t = gateway.leaf.thickness;
  group.add(box(0.05, height, t, iron, 0.025, 0.05), box(0.05, height, t, iron, width - 0.025, 0.05));
  for (const y of [0.05, 0.95, height]) group.add(box(width, 0.045, t, iron, width / 2, y));
  for (let x = 0.14; x < width - 0.08; x += 0.12) group.add(box(0.018, height - 0.05, t * 0.6, iron, x, 0.07));
  return group;
}

export function addMiddlePool(scene: THREE.Scene): void {
  const plaster = plasterMaterial("#fffdf5");
  const iron = new THREE.MeshStandardMaterial({ color: "#1f2a22", roughness: 0.55, metalness: 0.4 });
  const { nw, at, inward } = middleGatewayFrame();
  const [lo, hi] = gateway.opening, { width: pw, depth: pd, height: ph } = gateway.pier, th = gateway.thickness;
  const nwStart = -Math.hypot(nw[0][0] - nw[1][0], nw[0][1] - nw[1][1]) + lo, seEnd = Math.hypot(gateway.points[1][0] - at(hi)[0], gateway.points[1][1] - at(hi)[1]) + hi;
  const wing = gateway.northWestWing, stepAt = lo - pw - wing.highLength;

  // North-west wing: full height beside the pier, then a curved step down to the lawn wall (photo 12, IMG_2340).
  scene.add(inWallFrame(profile((s) => {
    s.moveTo(nwStart, 0); s.lineTo(lo, 0); s.lineTo(lo, wing.high); s.lineTo(stepAt, wing.high);
    s.bezierCurveTo(stepAt - wing.curveLength * 0.5, wing.high, stepAt - wing.curveLength * 0.5, wing.low, stepAt - wing.curveLength, wing.low);
    s.lineTo(nwStart, wing.low); s.closePath();
  }, th, plaster), 0));
  // South-east wing to the house corner.
  scene.add(inWallFrame(box(seEnd - hi, gateway.height, th, plaster, (hi + seEnd) / 2), 0));
  // Square piers, the flat head over the opening and the gently curved coping (IMG_2340).
  for (const o of [lo - pw / 2, hi + pw / 2]) scene.add(inWallFrame(box(pw, ph, pd, plaster), o));
  scene.add(inWallFrame(box(hi - lo, ph - gateway.height, pd, plaster, 0, gateway.height), 0));
  const { bottom, top, crown, overhang } = gateway.coping, ends = hi + pw + overhang;
  scene.add(inWallFrame(profile((s) => {
    s.moveTo(-ends, bottom); s.lineTo(ends, bottom); s.lineTo(ends, top); s.quadraticCurveTo(0, crown + (crown - top), -ends, top); s.closePath();
  }, pd + overhang * 2, plaster), 0));
  // The open black iron leaf, hinged on the south-east jamb, standing back against the planting inside.
  const [hinge, tip] = middleGatewayLeaf(), door = leaf(hi - lo, gateway.leaf.height, iron);
  door.position.set(hinge[0], 0, hinge[1]);
  door.rotation.y = -Math.atan2(tip[1] - hinge[1], tip[0] - hinge[0]);
  door.traverse((m) => { if (m instanceof THREE.Mesh) m.castShadow = true; m.name = gateway.id; });
  scene.add(door);
  // Notices on the street face of the north-west pier and wall (IMG_2340).
  for (const sign of gateway.signs) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(sign.width, sign.height), new THREE.MeshStandardMaterial({ map: signTexture(sign.kind), roughness: 0.6 }));
    const face = sign.along > lo - pw ? pd / 2 + 0.012 : th / 2 + 0.012;
    const [x, z] = at(sign.along, -face);
    panel.position.set(x, sign.y + sign.height / 2, z);
    panel.lookAt(x - inward[0], sign.y + sign.height / 2, z - inward[1]);
    panel.name = gateway.id;
    scene.add(panel);
  }
  addMiddlePoolNorth(scene);
  addPlanter(scene, plaster);
  addMiddlePoolPlanting(scene);
}

/** A ring shrunk inward by `d`, each edge moved parallel and neighbours re-intersected. */
function inset(ring: Vec2[], d: number): Vec2[] {
  const area = ring.reduce((s, p, i) => { const q = ring[(i + 1) % ring.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0), side = area > 0 ? 1 : -1;
  const lines = ring.map((p, i) => {
    const q = ring[(i + 1) % ring.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]), n: Vec2 = [(-(q[1] - p[1]) / l) * side * d, ((q[0] - p[0]) / l) * side * d];
    return [[p[0] + n[0], p[1] + n[1]], [q[0] + n[0], q[1] + n[1]]] as Vec2[];
  });
  return lines.map((l, i) => {
    const [p, q] = lines[(i + lines.length - 1) % lines.length], [r, s] = l;
    const d1: Vec2 = [q[0] - p[0], q[1] - p[1]], d2: Vec2 = [s[0] - r[0], s[1] - r[1]], den = d1[0] * d2[1] - d1[1] * d2[0];
    if (Math.abs(den) < 1e-9) return r;
    const t = ((r[0] - p[0]) * d2[1] - (r[1] - p[1]) * d2[0]) / den;
    return [p[0] + d1[0] * t, p[1] + d1[1] * t] as Vec2;
  });
}

/** Height of the clipped hedge above the planter soil (IMG_2332: roughly as tall again as the wall). */
const HEDGE = 0.75;

const flat = (ring: Vec2[]) => new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));

/** The raised white planter: rendered walls on its outline, soil inside, a clipped hedge on top in Details. */
function addPlanter(scene: THREE.Scene, plaster: THREE.Material): void {
  const p = middlePoolPlanter, inner = inset(p.ring, p.wall);
  const shell = new THREE.Shape(p.ring.map(([x, z]) => new THREE.Vector2(x, -z)));
  shell.holes.push(new THREE.Path(inner.map(([x, z]) => new THREE.Vector2(x, -z))));
  const walls = new THREE.Mesh(new THREE.ExtrudeGeometry(shell, { depth: p.height, bevelEnabled: false }).rotateX(-Math.PI / 2), plaster);
  const soil = new THREE.Mesh(new THREE.ShapeGeometry(flat(inner)).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#5a4433", roughness: 1 }));
  soil.position.y = p.height - 0.08;
  walls.castShadow = walls.receiveShadow = soil.receiveShadow = true;
  walls.name = soil.name = p.id;
  scene.add(walls, soil);
  if (scene.userData.layoutOnly) return;
  // Dense clipped hedge standing about 0.75 m above the wall (IMG_2332, IMG_2341).
  const hedge = new THREE.Mesh(new THREE.ExtrudeGeometry(flat(inset(p.ring, p.wall + 0.06)), { depth: HEDGE, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.1, bevelSegments: 2 }).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: "#5b8a45", map: surfaceTexture("turf"), roughness: 1 }));
  hedge.position.y = p.height - 0.08;
  hedge.castShadow = hedge.receiveShadow = true;
  hedge.name = p.id + "-hedge";
  scene.add(hedge);
}

/** Painted plants for the Details view: red hibiscus in the planter hedge, planting round the gateway. */
function addMiddlePoolPlanting(scene: THREE.Scene): void {
  // Red hibiscus along the middle of the long leg, between the path face and the back of the bed.
  const p = middlePoolPlanter, [f0, f1] = p.face, back = p.ring[p.ring.length - 1], half: Vec2 = [(back[0] - f0[0]) / 2, (back[1] - f0[1]) / 2], flowers: SpritePlacement[] = [];
  for (let t = 0.06; t < 0.97; t += 0.15) flowers.push({ x: f0[0] + (f1[0] - f0[0]) * t + half[0], y: p.height - 0.08 + HEDGE - 0.4, z: f0[1] + (f1[1] - f0[1]) * t + half[1], scale: 0.55 });
  addSprites(scene, "hibiscus_hedge", flowers);
  const { at } = middleGatewayFrame(), [lo, hi] = gateway.opening;
  // Outside: clipped hedge and courtyard bougainvillea (IMG_2340, photo 12).
  // The lawn-wall espalier is now a flat wall-plane in eva-walled-lawn.ts (IMG_2339).
  const place = (o: number, i: number, y = 0, scale = 0.7): SpritePlacement => { const [x, z] = at(o, i); return { x, y, z, scale }; };
  addSprites(scene, "hedge", [place(hi + 0.95, -0.7, 0, 0.6), place(hi + 0.95, 1.1, 0, 0.6), place(lo - 1.0, 1.3, 0, 0.6)]);
  addSprites(scene, "bougainvillea", [place(hi + 0.9, 0.5, 1.2, 0.6)]);
}
