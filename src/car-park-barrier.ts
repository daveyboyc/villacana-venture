import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * The car-park security barrier at the north entrance of the main (Picasso) car park, as in IMG_3131:
 * a white aluminium boom with red top and bottom edges, lying closed across the lane
 * at about 1 m; at its free end a red square-section rest post on a bolted base plate, with a V-shaped
 * fork of two red rods that cradles the boom and a small black photocell box on the face towards the
 * pivot; and beside the rest post a fixed red-and-white bollard (red foot, white band, red top).
 * The drive cabinet at the pivot end is off the photo: it is drawn as a plain painted box of a usual
 * size and marked inferred. Built from numbers; no photo pixels are used.
 *
 * Local frame: y up, standing on y = 0; the boom runs along +x from the pivot (x = 0) to the rest
 * post (x = armLength). Sizes read from IMG_3131 at an assumed 1.5 m phone height: rest post about
 * 1.0 m to the fork, 0.08 m square; bollard about 0.87 m high and 0.1 m across; boom about 0.1 m deep.
 */
export const BOOM_HEIGHT = 1.0;
export const BOOM_DEPTH = 0.1, BOOM_WIDTH = 0.065;
export const REST_POST = { height: 1.0, size: 0.08, plate: 0.22 };
export const BOLLARD = { height: 0.87, radius: 0.05, band: [0.29, 0.64] as const };
/** The drive cabinet: not photographed, a usual size for a single-lane barrier. */
export const CABINET = { width: 0.34, depth: 0.3, height: 1.02 };
/** Half the widest part of each post-like piece: the footprint collision keeps. */
export const BARRIER_POST_RADIUS = 0.12;
/** Half the cabinet's plan diagonal: its collision footprint. */
export const CABINET_RADIUS = Math.hypot(CABINET.width, CABINET.depth) / 2 + 0.02;

const RED = "#c3242a", WHITE = "#f2f1ec";

type Kit = { red: THREE.Material; white: THREE.Material; black: THREE.Material; cabinet: THREE.Material; plate: THREE.Material };
let kit: Kit | undefined;
function materials(): Kit {
  return {
    red: new THREE.MeshStandardMaterial({ color: RED, roughness: 0.5, metalness: 0.25 }),
    white: new THREE.MeshStandardMaterial({ color: WHITE, roughness: 0.35, metalness: 0.3 }),
    black: new THREE.MeshStandardMaterial({ color: "#16181a", roughness: 0.6 }),
    cabinet: new THREE.MeshStandardMaterial({ color: "#d7d4cc", roughness: 0.55, metalness: 0.2 }),
    plate: new THREE.MeshStandardMaterial({ color: "#8f2a26", roughness: 0.7, metalness: 0.2 }),
  };
}

function box(w: number, h: number, d: number, x: number, y: number, z: number): THREE.BufferGeometry {
  return new THREE.BoxGeometry(w, h, d).translate(x, y, z);
}
/** A round bar from a to b. */
function rod(a: THREE.Vector3, b: THREE.Vector3, radius: number): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 8);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
  return g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
}
function mesh(parts: THREE.BufferGeometry[], material: THREE.Material, name: string): THREE.Mesh {
  const m = new THREE.Mesh(mergeGeometries(parts.map((p) => p.index ? p.toNonIndexed() : p)), material);
  m.name = name; m.castShadow = m.receiveShadow = true;
  return m;
}

/** `side` puts the cabinet on the local -z side (1) or +z side (-1) of the boom. */
export type BarrierOptions = { armLength: number; name?: string; side?: 1 | -1 };

/**
 * One barrier, closed: cabinet at the pivot (x = 0), boom along +x, rest post with its fork at x = armLength.
 * The bollard is separate (barrierBollard) because it stands on its own beside the rest post.
 */
export function carParkBarrier(o: BarrierOptions): THREE.Group {
  kit ??= materials();
  const name = o.name ?? "car-park-barrier", L = o.armLength, side = o.side ?? 1;
  const g = new THREE.Group(); g.name = name;
  const y = BOOM_HEIGHT + BOOM_DEPTH / 2; // the boom rests on the fork, its underside at the post top
  // Boom: white body from just inside the cabinet to the fork, red strips along its top and bottom edges.
  const start = -0.05, end = L + 0.12, length = end - start, mid = (start + end) / 2;
  const strip = 0.018;
  g.add(mesh([box(length, BOOM_DEPTH - 2 * strip, BOOM_WIDTH, mid, y, 0)], kit.white, `${name}-boom`));
  g.add(mesh([box(length, strip, BOOM_WIDTH + 0.004, mid, y + BOOM_DEPTH / 2 - strip / 2, 0), box(length, strip, BOOM_WIDTH + 0.004, mid, y - BOOM_DEPTH / 2 + strip / 2, 0)], kit.red, `${name}-boom-edges`));
  // Rest post: square red tube on a base plate, a V fork of two rods above it, a black photocell box facing the pivot.
  const p = REST_POST;
  const fork = [-1, 1].map((s) => rod(new THREE.Vector3(L, p.height - 0.01, s * 0.02), new THREE.Vector3(L + 0.01, p.height + 0.12, s * 0.09), 0.007));
  g.add(mesh([box(p.size, p.height, p.size, L, p.height / 2, 0), ...fork], kit.red, `${name}-rest-post`));
  g.add(mesh([box(p.plate, 0.012, p.plate, L, 0.006, 0)], kit.plate, `${name}-rest-plate`));
  g.add(mesh([box(0.035, 0.12, 0.05, L - p.size / 2 - 0.0175, 0.55, 0)], kit.black, `${name}-photocell`));
  // Drive cabinet (inferred): a plain box at the pivot, the boom hub on its lane side and a short tail behind.
  const c = CABINET;
  g.add(mesh([box(c.width, c.height + 0.25, c.depth, -c.width / 2 - 0.02, (c.height - 0.25) / 2, -side * (c.depth / 2 + BOOM_WIDTH / 2 + 0.02))], kit.cabinet, `${name}-cabinet`));
  g.add(mesh([rod(new THREE.Vector3(0, y, -side * 0.02), new THREE.Vector3(0, y, -side * 0.12), 0.06), box(0.35, BOOM_DEPTH * 0.8, BOOM_WIDTH, -0.2, y, 0)], kit.red, `${name}-hub`));
  g.userData.carParkBarrier = true;
  return g;
}

/** The fixed red-and-white bollard beside the rest post. */
export function barrierBollard(name = "car-park-barrier-bollard"): THREE.Group {
  kit ??= materials();
  const b = BOLLARD, [lo, hi] = b.band;
  const g = new THREE.Group(); g.name = name;
  const cyl = (from: number, to: number) => new THREE.CylinderGeometry(b.radius, b.radius, to - from, 16).translate(0, (from + to) / 2, 0);
  g.add(mesh([cyl(0, lo), cyl(hi, b.height), new THREE.CircleGeometry(b.radius, 16).rotateX(-Math.PI / 2).translate(0, b.height, 0)], kit.red, `${name}-red`));
  g.add(mesh([cyl(lo, hi)], kit.white, `${name}-white`));
  return g;
}
