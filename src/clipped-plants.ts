import * as THREE from "three";

/**
 * Leafy plants built in the browser from numbers: a lumpy clipped hull (the shadowed inside) covered
 * in small leaf cards in three greens, as scripts/build_plants.py builds the north-pool hedges in Blender.
 * Seeded, so a plant is the same on every load. Local frame: x along, z across, y up, standing on y = 0.
 * They are original illustrative models of the photographed plant types, not scans.
 */

type Rng = () => number;
export function seeded(seed: number): Rng {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

export type LeafKind = "small" | "narrow" | "glossy" | "petal" | "star";
const LEAF_SHAPES: Record<LeafKind, [number, number][]> = {
  // Outline in a unit leaf (x along the leaf, y across), scaled by each leaf's size.
  small: [[-1, 0], [-0.4, 0.55], [0.4, 0.6], [1, 0], [0.4, -0.6], [-0.4, -0.55]],
  narrow: [[-1, 0], [-0.5, 0.18], [0.5, 0.16], [1, 0], [0.5, -0.16], [-0.5, -0.18]],
  glossy: [[-1, 0], [-0.5, 0.62], [0.35, 0.7], [1, 0], [0.35, -0.7], [-0.5, -0.62]],
  petal: [[-1, 0], [-0.3, 0.8], [0.6, 0.7], [1, 0], [0.6, -0.7], [-0.3, -0.8]],
  star: [[-1, 0], [-0.2, 0.25], [0, 1], [0.2, 0.25], [1, 0], [0.2, -0.25], [0, -1], [-0.2, -0.25]],
};
const leafGeometries = new Map<LeafKind, THREE.BufferGeometry>();
function leafGeometry(kind: LeafKind): THREE.BufferGeometry {
  let g = leafGeometries.get(kind);
  if (!g) {
    const shape = new THREE.Shape(LEAF_SHAPES[kind].map(([x, y]) => new THREE.Vector2(x * 0.5, y * 0.5)));
    // Leaf in the x-z plane facing +y, so `normal` can be mapped onto +y.
    g = new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
    leafGeometries.set(kind, g);
  }
  return g;
}

/** Collects leaves for one plant group and turns them into one InstancedMesh per leaf shape. */
export class Foliage {
  private leaves = new Map<LeafKind, { m: THREE.Matrix4; c: THREE.Color }[]>();
  private parts: THREE.Mesh[] = [];
  constructor(readonly rng: Rng) {}
  leaf(kind: LeafKind, at: THREE.Vector3, normal: THREE.Vector3, size: [number, number], colour: THREE.Color | string): void {
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal.clone().normalize());
    q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.rng() * Math.PI * 2));
    const m = new THREE.Matrix4().compose(at, q, new THREE.Vector3(size[0], 1, size[1]));
    const list = this.leaves.get(kind) ?? [];
    list.push({ m, c: typeof colour === "string" ? new THREE.Color(colour) : colour });
    this.leaves.set(kind, list);
  }
  add(mesh: THREE.Mesh): void { this.parts.push(mesh); }
  build(name: string): THREE.Group {
    const group = new THREE.Group(); group.name = name;
    for (const p of this.parts) group.add(p);
    for (const [kind, list] of this.leaves) {
      const material = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: kind === "glossy" ? 0.55 : 0.8 });
      const mesh = new THREE.InstancedMesh(leafGeometry(kind), material, list.length);
      list.forEach((l, i) => { mesh.setMatrixAt(i, l.m); mesh.setColorAt(i, l.c); });
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.castShadow = true; mesh.receiveShadow = true; mesh.name = `${name}-leaves-${kind}`;
      mesh.computeBoundingSphere();
      group.add(mesh);
    }
    return group;
  }
}

const tone = (hex: string, rng: Rng, spread = 0.12) => new THREE.Color(hex).offsetHSL((rng() - 0.5) * 0.02, (rng() - 0.5) * spread, (rng() - 0.5) * spread);

/**
 * A lumpy superellipsoid hull with half-extents (a, h/2, b) standing on y = 0; `p` near 2 is round,
 * larger is boxier (clipped). Returns the mesh and a function giving a surface point and normal.
 */
function hull(a: number, h: number, b: number, p: number, rng: Rng, colour: string, lumpiness = 0.05) {
  const se = (w: number) => Math.sign(w) * Math.abs(w) ** (2 / p);
  const lumps = Array.from({ length: 9 }, () => [rng() * Math.PI * 2, (rng() - 0.3) * Math.PI, (0.4 + rng() * 0.6) * lumpiness] as const);
  const bump = (u: number, v: number) => 1 + lumps.reduce((s, [lu, lv, k]) => s + k * Math.max(0, Math.cos(u - lu)) * Math.max(0, Math.cos(v - lv)), 0);
  const point = (u: number, v: number, out = 1) => {
    const r = bump(u, v) * out;
    return new THREE.Vector3(se(Math.cos(v) * Math.cos(u)) * a * r, Math.max(0, h / 2 + se(Math.sin(v)) * h / 2 * r), se(Math.cos(v) * Math.sin(u)) * b * r);
  };
  const rows = 12, cols = 24, pos: number[] = [], index: number[] = [];
  for (let i = 0; i <= rows; i++) for (let j = 0; j <= cols; j++) {
    const v = -Math.PI / 2 + Math.PI * i / rows, u = 2 * Math.PI * j / cols, q = point(u, v);
    pos.push(q.x, q.y, q.z);
    if (i < rows && j < cols) { const k = i * (cols + 1) + j; index.push(k, k + cols + 1, k + 1, k + 1, k + cols + 1, k + cols + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(index); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: colour, roughness: 1, side: THREE.DoubleSide }));
  mesh.castShadow = mesh.receiveShadow = true;
  /** A surface point a little outside the hull, and its outward normal. */
  const surface = (u: number, v: number, out = 1.02) => {
    const q = point(u, v, out), e = 0.01;
    const du = point(u + e, v, out).sub(point(u - e, v, out)), dv = point(u, v + e, out).sub(point(u, v - e, out));
    const n = new THREE.Vector3().crossVectors(dv, du).normalize();
    if (n.dot(new THREE.Vector3(q.x, q.y - h / 2, q.z)) < 0) n.negate();
    return { q, n };
  };
  return { mesh, surface };
}

/** Area-weighted (u, v) on the hull: more leaves round the middle than at the poles. */
function sampleUV(rng: Rng, vMin = -0.25): [number, number] {
  const u = rng() * Math.PI * 2, s = vMin + rng() * (1 - vMin);
  return [u, Math.asin(Math.max(-1, Math.min(1, s)))];
}

export type ClippedHedgeOptions = { length: number; depth: number; height: number; seed: number; clip?: number; density?: number; leaf?: LeafKind; leafSize?: [number, number]; greens?: string[]; inside?: string; flowers?: { count: number; colour: string; kind?: LeafKind; size?: [number, number] } };
/** A clipped hedge piece: x along its length, z across; slightly longer than `length` so a row joins. */
export function clippedHedge(o: ClippedHedgeOptions): THREE.Group {
  const rng = seeded(o.seed), f = new Foliage(rng);
  const { mesh, surface } = hull(o.length * 0.56, o.height, o.depth * 0.5, o.clip ?? 4.5, rng, o.inside ?? "#24391f", 0.035);
  f.add(mesh);
  const greens = o.greens ?? ["#3b5631", "#4b6a37", "#58783f"], area = 2 * o.length * o.height + o.length * o.depth + 2 * o.depth * o.height;
  for (let i = 0, n = Math.round(area * (o.density ?? 260)); i < n; i++) {
    const [u, v] = sampleUV(rng), { q, n: nn } = surface(u, v, 1.0 + rng() * 0.06);
    nn.add(new THREE.Vector3((rng() - 0.5) * 1.1, (rng() - 0.3) * 0.9, (rng() - 0.5) * 1.1)).normalize();
    const s = o.leafSize ?? [0.07, 0.045], k = 0.8 + rng() * 0.45;
    f.leaf(o.leaf ?? "small", q, nn, [s[0] * k, s[1] * k], tone(greens[Math.floor(rng() * greens.length)], rng));
  }
  if (o.flowers) for (let i = 0; i < o.flowers.count; i++) {
    const [u, v] = sampleUV(rng, 0.1), { q, n } = surface(u, v, 1.07);
    const s = o.flowers.size ?? [0.06, 0.06];
    f.leaf(o.flowers.kind ?? "petal", q, n, s, tone(o.flowers.colour, rng, 0.08));
  }
  return f.build("clipped-hedge");
}

/** A loose shrub: rounder, airier, leaves sticking out further; woody stems at the base. */
export function looseShrub(o: { width: number; depth: number; height: number; seed: number; leaf: LeafKind; leafSize: [number, number]; greens: string[]; stems?: number; flowers?: { count: number; colour: string } }): THREE.Group {
  const rng = seeded(o.seed), f = new Foliage(rng);
  const lift = o.height * 0.18, { mesh, surface } = hull(o.width * 0.46, o.height - lift, o.depth * 0.46, 2.6, rng, "#22341d", 0.09);
  mesh.position.y = lift; f.add(mesh);
  const wood = new THREE.MeshStandardMaterial({ color: "#5b4a38", roughness: 1 });
  for (let i = 0; i < (o.stems ?? 7); i++) {
    const a = rng() * Math.PI * 2, r = rng() * o.width * 0.2, top = new THREE.Vector3(Math.cos(a) * r * 2, lift + o.height * 0.3, Math.sin(a) * r * 2);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.022, top.length() + 0.05, 5), wood);
    stem.position.set(top.x / 2, top.y / 2, top.z / 2); stem.lookAt(top); stem.rotateX(Math.PI / 2); stem.castShadow = true; f.add(stem);
  }
  const area = 2 * (o.width + o.depth) * o.height;
  for (let i = 0, n = Math.round(area * 230); i < n; i++) {
    const [u, v] = sampleUV(rng, -0.1), { q, n: nn } = surface(u, v, 0.95 + rng() * 0.2);
    q.y += lift;
    // Narrow leaves point out and up from the twigs, as on an oleander.
    nn.add(new THREE.Vector3((rng() - 0.5) * 1.6, rng() * 0.8, (rng() - 0.5) * 1.6)).normalize();
    const k = 0.75 + rng() * 0.5;
    f.leaf(o.leaf, q, nn, [o.leafSize[0] * k, o.leafSize[1] * k], tone(o.greens[Math.floor(rng() * o.greens.length)], rng));
  }
  if (o.flowers) for (let i = 0; i < o.flowers.count; i++) {
    const [u, v] = sampleUV(rng, 0.2), { q, n } = surface(u, v, 1.08);
    q.y += lift;
    f.leaf("petal", q, n, [0.07, 0.07], tone(o.flowers.colour, rng, 0.08));
  }
  return f.build("loose-shrub");
}

/** The round clipped tree on the Eva lawn (IMG_2336, IMG_2503): pale smooth trunk, a domed crown of small glossy leaves. */
export function roundClippedTree(o: { trunk: number; crown: number; crownHeight: number; seed: number }): THREE.Group {
  const rng = seeded(o.seed), f = new Foliage(rng);
  const bark = new THREE.MeshStandardMaterial({ color: "#a39d8f", roughness: 0.9 });
  const lean = new THREE.Vector3((rng() - 0.5) * 0.12, 1, (rng() - 0.5) * 0.12).normalize();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.11, o.trunk + 0.4, 10), bark);
  trunk.position.copy(lean.clone().multiplyScalar((o.trunk + 0.4) / 2)); trunk.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), lean); trunk.castShadow = true; f.add(trunk);
  const fork = lean.clone().multiplyScalar(o.trunk);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + rng() * 0.8, tip = fork.clone().add(new THREE.Vector3(Math.cos(a) * 0.45, 0.55 + rng() * 0.2, Math.sin(a) * 0.45));
    const l = tip.distanceTo(fork), b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, l, 6), bark);
    b.position.copy(fork.clone().add(tip).multiplyScalar(0.5)); b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tip.clone().sub(fork).normalize()); b.castShadow = true; f.add(b);
  }
  const { mesh, surface } = hull(o.crown / 2, o.crownHeight, o.crown / 2, 2.4, rng, "#1f3220", 0.07);
  mesh.position.copy(fork).setY(o.trunk - o.crownHeight * 0.12); f.add(mesh);
  const greens = ["#2f4a2a", "#3d5a31", "#4e6b3a", "#365231"], area = Math.PI * o.crown * (o.crownHeight + o.crown / 2);
  for (let i = 0, n = Math.round(area * 230); i < n; i++) {
    const [u, v] = sampleUV(rng, -0.55), { q, n: nn } = surface(u, v, 1.0 + rng() * 0.05);
    q.add(mesh.position);
    nn.add(new THREE.Vector3((rng() - 0.5) * 0.9, (rng() - 0.2) * 0.8, (rng() - 0.5) * 0.9)).normalize();
    const k = 0.8 + rng() * 0.4;
    f.leaf("glossy", q, nn, [0.075 * k, 0.05 * k], tone(greens[Math.floor(rng() * greens.length)], rng, 0.1));
  }
  return f.build("round-clipped-tree");
}

/**
 * Shrubs and climbers grown up against a wall: leaves in a shallow layer over the face with a ragged top,
 * and white star flowers (jasmine). x along the wall, z out from it (0 at the wall), y up.
 */
export function wallClimber(o: { length: number; height: number; depth: number; seed: number; flowers: number }): THREE.Group {
  const rng = seeded(o.seed), f = new Foliage(rng);
  const top = Array.from({ length: Math.max(3, Math.ceil(o.length / 0.6)) + 1 }, () => o.height * (0.7 + rng() * 0.3));
  const topAt = (x: number) => { const t = (x / o.length) * (top.length - 1), i = Math.min(top.length - 2, Math.floor(t)), k = t - i; return top[i] * (1 - k) + top[i + 1] * k; };
  const back = new THREE.Shape([new THREE.Vector2(0, 0), ...top.map((h, i) => new THREE.Vector2(o.length * i / (top.length - 1), h * 0.92)), new THREE.Vector2(o.length, 0)]);
  const backing = new THREE.Mesh(new THREE.ShapeGeometry(back), new THREE.MeshStandardMaterial({ color: "#22361e", roughness: 1, side: THREE.DoubleSide }));
  backing.position.z = 0.03; f.add(backing);
  const mid = backing.clone(); mid.position.z = o.depth * 0.45; mid.scale.set(1, 0.75, 1); f.add(mid);
  const greens = ["#365a2c", "#4a6d36", "#5b7c3f", "#2f4a28"];
  for (let i = 0, n = Math.round(o.length * o.height * 560); i < n; i++) {
    // A bushy mass: deepest low down, thinning to a ragged top.
    const x = rng() * o.length, y = rng() ** 0.7 * topAt(x), z = 0.05 + rng() ** 0.8 * o.depth * (0.35 + 0.65 * (1 - y / o.height));
    const nn = new THREE.Vector3((rng() - 0.5) * 1.4, (rng() - 0.3) * 1.0, 1).normalize(), k = 0.8 + rng() * 0.5;
    f.leaf(rng() < 0.35 ? "glossy" : "small", new THREE.Vector3(x, y, z), nn, [0.11 * k, 0.07 * k], tone(greens[Math.floor(rng() * greens.length)], rng));
  }
  for (let i = 0; i < o.flowers; i++) {
    const x = rng() * o.length, y = (0.35 + rng() * 0.65) * topAt(x), z = 0.06 + rng() * o.depth * 0.7;
    f.leaf("star", new THREE.Vector3(x, y, z + 0.02), new THREE.Vector3((rng() - 0.5) * 0.6, (rng() - 0.5) * 0.6, 1), [0.035, 0.035], "#f7f5ee");
  }
  return f.build("wall-climber");
}
