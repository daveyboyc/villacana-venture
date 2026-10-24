import * as THREE from "three";
import data from "../data/middle_pool_lane_frontages.json";
import gate from "../data/middle_pool_south_gate.json";
import { plasterMaterial } from "./materials";
import {refine,siteY} from './terrain';
import {outdoorPavingMaterial} from './silvia-outdoor-paving';
import { addSprites, type SpriteKind } from "./sprites";
import type { Vec2 } from "./types";

/** Same provisional gate frame as the original entrance; no registry/route relocation. */
export const laneAt = (a: number, c: number): Vec2 => [gate.center[0] + gate.forward[0] * a - gate.forward[1] * c, gate.center[1] + gate.forward[1] * a + gate.forward[0] * c];
export function laneLocal(x: number, z: number): Vec2 {
  const dx = x - gate.center[0], dz = z - gate.center[1];
  return [dx * gate.forward[0] + dz * gate.forward[1], -dx * gate.forward[1] + dz * gate.forward[0]];
}
export const laneBeds = data.beds;
export const laneOpenings = data.openings;
export const laneDoorway = data.doorway;
export const lanePaving = data.paving;
export const lanePavingRing = (): Vec2[] => [
  ...data.paving.sections.map(([a, left]) => laneAt(a, left)),
  ...[...data.paving.sections].reverse().map(([a, , right]) => laneAt(a, right)),
];
export const laneBedRing = (bed: typeof data.beds[number]): Vec2[] => bed.outline.map(([a, c]) => laneAt(a, c));
export const laneFrontageRings = (): Vec2[][] => data.beds.map(laneBedRing);

/** Replace the generic tile ribbon and white edging only inside this bounded surface. */
export function outsideLanePaving(ring: Vec2[]): Vec2[][] {
  const local = ring.map(([x, z]) => laneLocal(x, z));
  const sections = lanePaving.sections;
  if (local.every(p => p[0] < sections[0][0]) || local.every(p => p[0] > sections.at(-1)![0]) ||
      local.every(p => p[1] < Math.min(...sections.map(s => s[1]))) || local.every(p => p[1] > Math.max(...sections.map(s => s[2])))) return [ring];
  const area = (poly: Vec2[]) => Math.abs(poly.reduce((sum, p, i) => { const q = poly[(i + 1) % poly.length]; return sum + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
  const clip = (poly: Vec2[], a: Vec2, b: Vec2, sign: number): Vec2[] => {
    const out: Vec2[] = [], distance = (p: Vec2) => sign * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], dp = distance(p), dq = distance(q);
      if (dp >= 0) out.push(p);
      if ((dp >= 0) !== (dq >= 0)) { const t = dp / (dp - dq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    return out;
  };
  let parts = THREE.ShapeUtils.triangulateShape(local.map(p => new THREE.Vector2(...p)), []).map(ids => ids.map(i => local[i]));
  for (let i = 1; i < sections.length; i++) {
    const [a, left, right] = sections[i - 1], [b, nextLeft, nextRight] = sections[i];
    if (a === b) continue;
    const quad: Vec2[] = [[a, left], [b, nextLeft], [b, nextRight], [a, right]];
    parts = parts.flatMap(part => {
      const outside: Vec2[][] = []; let inside = part;
      for (let e = 0; e < quad.length && inside.length; e++) {
        const p = quad[e], q = quad[(e + 1) % quad.length], fragment = clip(inside, p, q, -1);
        if (area(fragment) > 1e-8) outside.push(fragment);
        inside = clip(inside, p, q, 1);
      }
      return outside;
    });
  }
  return parts.map(part => part.map(([a, c]) => laneAt(a, c)));
}

/** Suppress only illustrative clutter and inferred ground openings in this bounded frontage. */
export function inLaneFrontageBand(x: number, z: number): boolean {
  const [a, c] = laneLocal(x, z);
  return a >= data.review.along[0] && a <= data.review.along[1] && c >= data.review.across[0] && c <= data.review.across[1];
}
export function replacesLaneGroundOpening(x: number, z: number): boolean {
  return data.openings.some(o => {
    const [a, b] = o.facade, length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const t = ((x - a[0]) * (b[0] - a[0]) + (z - a[1]) * (b[1] - a[1])) / length ** 2;
    const gap = Math.hypot(x - a[0] - t * (b[0] - a[0]), z - a[1] - t * (b[1] - a[1]));
    return gap < .3 && Math.abs(t - o.at) * length < o.width / 2 + .15;
  });
}

function inset(ring: Vec2[], distance: number): Vec2[] {
  const area = ring.reduce((s, p, i) => { const q = ring[(i + 1) % ring.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
  const sign = area > 0 ? 1 : -1;
  const edges = ring.map((p, i) => {
    const q = ring[(i + 1) % ring.length], length = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const normal = [-(q[1] - p[1]) / length * distance * sign, (q[0] - p[0]) / length * distance * sign];
    return [[p[0] + normal[0], p[1] + normal[1]], [q[0] + normal[0], q[1] + normal[1]]] as Vec2[];
  });
  return edges.map(([r, s], i) => {
    const [p, q] = edges[(i + edges.length - 1) % edges.length], u = [q[0] - p[0], q[1] - p[1]], v = [s[0] - r[0], s[1] - r[1]];
    const denominator = u[0] * v[1] - u[1] * v[0];
    if (Math.abs(denominator) < 1e-9) return r;
    const t = ((r[0] - p[0]) * v[1] - (r[1] - p[1]) * v[0]) / denominator;
    return [p[0] + u[0] * t, p[1] + u[1] * t] as Vec2;
  });
}

function addBed(scene: THREE.Scene, bed: typeof data.beds[number], plaster: THREE.Material): void {
  const ring = laneBedRing(bed), inner = inset(ring, bed.wall);
  const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
  shape.holes.push(new THREE.Path(inner.map(([x, z]) => new THREE.Vector2(x, -z))));
  const shell = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: bed.height, bevelEnabled: false }).rotateX(-Math.PI / 2), plaster);
  const soil = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(inner.map(([x, z]) => new THREE.Vector2(x, -z)))).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#514332", roughness: 1 }));
  shell.position.y = .06; soil.position.y = .06 + bed.height - .035;
  shell.name = bed.id; soil.name = bed.id + "-soil";
  shell.userData.noDrape = soil.userData.noDrape = true;
  shell.castShadow = shell.receiveShadow = soil.receiveShadow = true;
  scene.add(shell, soil);
  if (scene.userData.layoutOnly) return;
  const p = bed.planting;
  for (const kind of (p.kind === "mixed" ? ["hedge", "grass"] : ["hedge"]) as SpriteKind[]) {
    // Vertical-only scaling keeps the guarded x/z footprint unchanged.
    const planting = new THREE.Scene(); planting.userData = { ...scene.userData };
    const places = [];
    let i = 0;
    for (let a = p.along[0]; a <= p.along[1] + 1e-6; a += p.spacing, i++) {
      if (p.kind === "mixed" && (kind === "hedge") !== (i % 2 === 0)) continue;
      const [x, z] = laneAt(a, p.across);
      places.push({ x, z, scale: kind === "grass" ? p.scale * 2.8 : p.scale });
    }
    addSprites(planting, kind, places);
    planting.name = bed.id + "-" + kind;
    planting.scale.y = p.heightScale; planting.position.y = .06 + bed.height - .03;
    planting.traverse(object => { object.userData.noDrape = true; });
    scene.add(planting);
  }
}

function shutterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas"); canvas.width = 128; canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#70462d"; ctx.fillRect(0, 0, 128, 256);
  for (let y = 8; y < 256; y += 9) {
    ctx.fillStyle = "#412a20"; ctx.fillRect(5, y, 118, 3);
    ctx.fillStyle = "#986443"; ctx.fillRect(5, y + 3, 118, 2);
  }
  ctx.fillStyle = "#3e2b20"; ctx.fillRect(61, 0, 6, 256);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addPaving(scene: THREE.Scene): void {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const start = lanePaving.sections[0][0];
  lanePaving.sections.forEach(([a, left, right], i) => {
    for (const [side, across] of [left, right].entries()) {
      const [x, z] = laneAt(a, across);
      positions.push(x, .086, z);
      // The original atlas has four columns and four rows. One full width = four tiles.
      uv.push(side, (a - start) / (lanePaving.columns * lanePaving.tilePitch));
    }
    if (i && a > lanePaving.sections[i - 1][0]) {
      const l = (i - 1) * 2, r = l + 1, next = i * 2;
      indices.push(l, r, next, r, next + 1, next);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(refine(geometry,siteY,new THREE.Matrix4()), outdoorPavingMaterial());
  mesh.name = lanePaving.id; mesh.userData.noDrape = true; mesh.receiveShadow = true;
  scene.add(mesh);
}

export function laneGrilleRing(o: typeof data.openings[number]): Vec2[] {
  const [a, b] = o.facade as Vec2[], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const along: Vec2 = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
  const c: Vec2 = [a[0] + (b[0] - a[0]) * o.at, a[1] + (b[1] - a[1]) * o.at];
  const outward: Vec2 = [along[1], -along[0]];
  return [[-1, 0], [1, 0], [1, 1], [-1, 1]].map(([side, front]) => [c[0] + along[0] * side * o.width / 2 + outward[0] * front * o.projection, c[1] + along[1] * side * o.width / 2 + outward[1] * front * o.projection] as Vec2);
}

function addOpening(scene: THREE.Scene, o: typeof data.openings[number], plaster: THREE.Material): void {
  const [a, b] = o.facade, length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const dx = (b[0] - a[0]) / length, dz = (b[1] - a[1]) / length;
  const group = new THREE.Group();
  group.position.set(a[0] + (b[0] - a[0]) * o.at, .06, a[1] + (b[1] - a[1]) * o.at);
  // Local x is along the real facade, local +z faces the lane.
  group.rotation.y = -Math.atan2(dz, dx);
  group.scale.z = -1;
  const iron = new THREE.MeshStandardMaterial({ color: "#202522", roughness: .65, metalness: .35 });
  const box = (x: number, y: number, z: number, w: number, h: number, d: number, material: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y + h / 2, z); group.add(mesh); return mesh;
  };
  // These facades face clockwise into the lane; the orientation is validated against the house polygon.
  for (const side of [-1, 1]) box(side * (o.width / 2 + .055), o.bottom - .06, .045, .11, o.height + .17, .11, plaster);
  box(0, o.bottom - .08, .09, o.width + .24, .1, .25, plaster);
  box(0, o.bottom + o.height, .045, o.width + .24, .12, .12, plaster);
  const shutter = new THREE.Mesh(new THREE.PlaneGeometry(o.width, o.height), new THREE.MeshStandardMaterial({ map: shutterTexture(), roughness: .9, side: THREE.DoubleSide }));
  shutter.position.set(0, o.bottom + o.height / 2, .055); group.add(shutter);
  const tube = (points: THREE.Vector3[], radius = .012) => group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 16, radius, 5, false), iron));
  for (let i = 0; i < o.bars; i++) {
    const x = -o.width / 2 + i * o.width / (o.bars - 1);
    box(x, o.bottom, o.projection, .022, o.height, .022, iron).userData.grillePart = "upright";
  }
  for (const t of [0, .32, .65, 1]) {
    box(0, o.bottom + o.height * t, o.projection, o.width + .04, .026, .026, iron);
    for (const side of [-1, 1]) box(side * o.width / 2, o.bottom + o.height * t, o.projection / 2, .026, .026, o.projection, iron);
  }
  // Small paired curls are schematic metalwork; no photographic texture or exact motif claim.
  for (const side of [-1, 1]) tube(Array.from({ length: 21 }, (_, i) => {
    const angle = i * Math.PI * 2 / 20;
    return new THREE.Vector3(side * .14 + .055 * Math.cos(angle), o.bottom + o.height * .48 + .095 * Math.sin(angle), o.projection);
  }), .009);
  group.traverse(object => { object.name = o.id; object.userData.noDrape = true; if (object instanceof THREE.Mesh) object.castShadow = object.receiveShadow = true; });
  scene.add(group);
}

export function addLaneFrontages(scene: THREE.Scene): void {
  addPaving(scene);
  const plaster = plasterMaterial("#fffdf5");
  for (const bed of data.beds) addBed(scene, bed, plaster);
  for (const opening of data.openings) addOpening(scene, opening, plaster);
}
