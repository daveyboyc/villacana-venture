import * as THREE from "three";
import data from "../data/north_pool_frontages.json";
import { plasterMaterial } from "./materials";
import { raisedTerraceGroundOffset } from "./raised-terraces";
import { addSprites } from "./sprites";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/**
 * Front gardens and facade details of the houses across the north pool from the roof station
 * (data/north_pool_frontages.json): white patio furniture and parasols, awnings on the house walls,
 * bougainvillea climbing them, and the white arch over the alley mouth. The arch is structure and shows
 * in Layout; the rest is detail and shows with Show details.
 */

type Furniture = { id: string; kind: string; at: number[]; turn?: number; count?: number; seats?: number; open?: boolean; colour?: string; height?: number; size?: number };
type Awning = { id: string; wall: number[][]; out: number[]; height: number; depth: number; colour: string; stripes?: string; drop?: number };
type Climber = { id: string; at: number[]; height: number; spread: number; from?: number };
type Gate = { id: string; at: number[]; along: number[]; width: number; height: number; wall: number; rise: number; colour: string };
type Arch = { id: string; from: number[]; to: number[]; height: number; rise: number; depth: number; style?: "arch" | "canopy" };

/**
 * A pool-facing wall in the photographed north frontage (data/north_pool_frontages.json): its awnings and
 * climbers are the photographed ones, so the generator adds none there.
 */
export function inPhotographedFrontage(x: number, z: number, nx: number, nz: number): boolean {
  const f = data.photographedFrontage;
  return x >= f.box[0] && z >= f.box[1] && x <= f.box[2] && z <= f.box[3] && nx * f.facing[0] + nz * f.facing[1] > 0.5;
}

/** A generated garden wall or gate that gives way to what the photos show there (`replacesGardenWalls`). */
export function replacedGardenWall(x: number, z: number): boolean {
  return data.replacesGardenWalls.some(({ box: b }) => x >= b[0] && z >= b[1] && x <= b[2] && z <= b[3]);
}

function plankTexture(colour: string): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = 64; c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = colour; ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  for (let x = 0; x < 64; x += 9) ctx.fillRect(x, 0, 1.5, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** The floor under a point: a raised terrace or patio floor where there is one, else the surveyed ground. */
const floorY = (x: number, z: number) => siteY(x, z) + raisedTerraceGroundOffset(x, z);

const white = () => new THREE.MeshStandardMaterial({ color: "#f3f3ef", roughness: 0.45, metalness: 0.15 });

function box(w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z); mesh.castShadow = true; return mesh;
}

/** A white aluminium chair facing -z in its own frame. */
function chair(m: THREE.Material, arms = false): THREE.Group {
  const g = new THREE.Group();
  g.add(box(0.46, 0.04, 0.46, m, 0, 0.44, 0));
  g.add(box(0.46, 0.42, 0.03, m, 0, 0.67, 0.22));
  for (const [x, z] of [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]]) g.add(box(0.03, 0.44, 0.03, m, x, 0.22, z));
  if (arms) for (const x of [-0.24, 0.24]) g.add(box(0.04, 0.04, 0.46, m, x, 0.64, 0));
  return g;
}

function table(m: THREE.Material, w: number, d: number, h = 0.74): THREE.Group {
  const g = new THREE.Group();
  g.add(box(w, 0.03, d, m, 0, h, 0));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.04, h, 0.04, m, x * (w / 2 - 0.06), h / 2, z * (d / 2 - 0.06)));
  return g;
}

function piece(f: Furniture, m: THREE.Material, canvas: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  if (f.kind === "dining-set") {
    const seats = f.seats ?? 4, long = seats > 4;
    const w = long ? 1.8 : 1.0, d = 0.9;
    g.add(table(m, w, d));
    const along = long ? [-0.55, 0, 0.55] : [-0.25, 0.25];
    for (const x of along) for (const side of [-1, 1]) {
      const c = chair(m); c.position.set(x, 0, side * (d / 2 + 0.3)); c.rotation.y = side > 0 ? 0 : Math.PI; g.add(c);
    }
  } else if (f.kind === "bistro-set") {
    g.add(table(m, 0.7, 0.7));
    for (const side of [-1, 1]) { const c = chair(m); c.position.set(side * 0.62, 0, 0); c.rotation.y = side * Math.PI / 2; g.add(c); }
  } else if (f.kind === "armchair") {
    for (let i = 0; i < (f.count ?? 1); i++) { const c = chair(m, true); c.position.set(i * 0.7, 0, 0); g.add(c); }
  } else if (f.kind === "loungers") {
    for (let i = 0; i < (f.count ?? 1); i++) {
      const l = new THREE.Group();
      l.add(box(0.68, 0.06, 1.35, m, 0, 0.3, 0.25));
      const back = box(0.68, 0.06, 0.65, m, 0, 0.5, -0.66); back.rotation.x = 0.7; l.add(back);
      for (const [x, z] of [[-0.3, -0.35], [0.3, -0.35], [-0.3, 0.85], [0.3, 0.85]]) l.add(box(0.04, 0.3, 0.04, m, x, 0.15, z));
      l.position.x = i * 0.85; g.add(l);
    }
  } else if (f.kind === "side-table") {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 20), m); top.position.y = 0.5; g.add(top);
    g.add(box(0.04, 0.5, 0.04, m, 0, 0.25, 0));
  } else if (f.kind === "parasol") {
    const steel = new THREE.MeshStandardMaterial({ color: "#d7d7d2", roughness: 0.4, metalness: 0.5 });
    const pole = (f.height ?? 2.55) - 0.05;
    g.add(box(0.05, pole, 0.05, steel, 0, pole / 2, 0));
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.08, 16), steel); base.position.y = 0.04; g.add(base);
    if (f.open) {
      // A square canopy (four sides), shallow and pale, as photographed.
      const top = new THREE.Mesh(new THREE.ConeGeometry(f.size ?? 1.55, 0.45 * (f.size ?? 1.55) / 1.55, 4, 1, true), canvas); top.position.y = pole + 0.05; top.rotation.y = Math.PI / 4; top.castShadow = true; g.add(top);
    } else {
      const furled = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.5, 8), canvas); furled.position.y = 1.85; furled.rotation.x = Math.PI; furled.castShadow = true; g.add(furled);
    }
  }
  return g;
}

function stripedTexture(colour: string, stripe: string): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = 64; c.height = 8;
  const ctx = c.getContext("2d")!;
  for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? stripe : colour; ctx.fillRect(i * 8, 0, 8, 8); }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A retractable awning: fabric sloping out from the wall, with a valance along its front edge. */
function awning(a: Awning): THREE.Group {
  const g = new THREE.Group(); g.name = a.id;
  const [ax, az] = a.wall[0], [bx, bz] = a.wall[1];
  const width = Math.hypot(bx - ax, bz - az), drop = a.drop ?? 0.45;
  const mat = new THREE.MeshStandardMaterial({ color: a.stripes ? "#ffffff" : a.colour, roughness: 0.85, side: THREE.DoubleSide });
  if (a.stripes) { const t = stripedTexture(a.colour, a.stripes); t.repeat.set(width / 1.2, 1); mat.map = t; }
  const slope = Math.hypot(a.depth, drop);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(width, slope), mat);
  cloth.rotation.x = -Math.PI / 2 + Math.atan2(drop, a.depth);
  cloth.position.set(0, -drop / 2, a.depth / 2); cloth.castShadow = true; g.add(cloth);
  const valance = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.22), mat);
  valance.position.set(0, -drop - 0.11, a.depth); g.add(valance);
  const bar = box(width, 0.06, 0.08, new THREE.MeshStandardMaterial({ color: "#d9d9d4", roughness: 0.5 }), 0, -drop, a.depth); g.add(bar);
  // Placed on the wall's midpoint, its local +z along the outward normal.
  const mx = (ax + bx) / 2, mz = (az + bz) / 2;
  g.position.set(mx, floorY(mx + a.out[0] * 0.5, mz + a.out[1] * 0.5) + a.height + drop, mz);
  g.rotation.y = Math.atan2(a.out[0], a.out[1]);
  return g;
}

/** Structure: the white arch over the alley mouth and the patio gates (Layout and Show details). */
export function addNorthPoolFrontageStructure(scene: THREE.Scene): void {
  const plaster = plasterMaterial("#fbf8ef");
  // Brown plank gates in the patio walls' openings, each under a white capping that rises over it.
  for (const g of data.gates as Gate[]) {
    const [x, z] = g.at, base = siteY(x, z);
    const group = new THREE.Group(); group.name = g.id; group.userData.noDrape = true; group.userData.structural = true;
    const door = new THREE.Mesh(new THREE.BoxGeometry(g.width - 0.04, g.height, 0.05), new THREE.MeshStandardMaterial({ map: plankTexture(g.colour), roughness: 0.8 }));
    door.position.y = g.height / 2; door.castShadow = true; group.add(door);
    // Infill above the door up to the wall's top, then a segmental hump over the opening.
    const head = box(g.width + 0.02, g.wall - g.height, 0.26, plaster, 0, (g.wall + g.height) / 2, 0); group.add(head);
    const half = g.width / 2 + 0.25, shape = new THREE.Shape();
    shape.moveTo(-half, 0); shape.quadraticCurveTo(0, g.rise * 2, half, 0); shape.lineTo(-half, 0);
    const hump = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false }).translate(0, 0, -0.15), plaster);
    hump.position.y = g.wall; hump.castShadow = true; group.add(hump);
    group.position.set(x, base, z); group.rotation.y = -Math.atan2(g.along[1], g.along[0]);
    scene.add(group);
  }
  for (const a of data.arches as Arch[]) {
    const [ax, az] = a.from, [bx, bz] = a.to, span = Math.hypot(bx - ax, bz - az);
    const g = new THREE.Group(); g.name = a.id; g.userData.noDrape = true; g.userData.structural = true;
    const base = Math.min(floorY(ax, az), floorY(bx, bz));
    if (a.style === "canopy") {
      // A thin curved white canopy on two slim posts, as photographed over the alley mouth.
      const half = span / 2, r = (half * half + a.rise * a.rise) / (2 * a.rise), th = Math.asin(half / r);
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(r, r, a.depth, 24, 1, true, -th, 2 * th), plaster);
      shell.material = plaster.clone(); (shell.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
      shell.rotation.z = Math.PI / 2; shell.rotation.x = -Math.PI / 2; shell.position.y = a.height + a.rise - r;
      const ring = new THREE.Group(); ring.add(shell); ring.rotation.y = Math.PI / 2; g.add(ring);
      for (const s of [-1, 1]) g.add(box(0.09, a.height, 0.09, plaster, s * (half - 0.05), a.height / 2, 0));
      g.position.set((ax + bx) / 2, base, (az + bz) / 2);
      g.rotation.y = -Math.atan2(bz - az, bx - ax);
      scene.add(g);
      continue;
    }
    // An arched band: a flat-topped slab with a segmental arch cut from its underside.
    const shape = new THREE.Shape();
    const top = a.height + a.rise + 0.25, half = span / 2;
    shape.moveTo(-half, a.height - 0.3); shape.lineTo(-half, top); shape.lineTo(half, top); shape.lineTo(half, a.height - 0.3);
    shape.lineTo(half - 0.25, a.height - 0.3);
    const r = (Math.pow(half - 0.25, 2) + a.rise * a.rise) / (2 * a.rise), cy = a.height + a.rise - r;
    const th = Math.asin((half - 0.25) / r);
    shape.absarc(0, cy, r, Math.PI / 2 - th, Math.PI / 2 + th, false);
    shape.lineTo(-half, a.height - 0.3);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: a.depth, bevelEnabled: false });
    geo.translate(0, 0, -a.depth / 2);
    const band = new THREE.Mesh(geo, plaster); band.castShadow = band.receiveShadow = true; g.add(band);
    for (const s of [-1, 1]) g.add(box(0.25, a.height - 0.3, a.depth, plaster, s * (half - 0.125), (a.height - 0.3) / 2, 0));
    g.position.set((ax + bx) / 2, base, (az + bz) / 2);
    g.rotation.y = -Math.atan2(bz - az, bx - ax);
    scene.add(g);
  }
}

/** Details: furniture, parasols, awnings and climbers (Show details only). */
export function addNorthPoolFrontageDetails(scene: THREE.Scene): void {
  const m = white(), canvas = new THREE.MeshStandardMaterial({ color: "#e9e7df", roughness: 0.9, side: THREE.DoubleSide });
  for (const f of data.furniture as Furniture[]) {
    const g = piece(f, m, f.colour ? new THREE.MeshStandardMaterial({ color: f.colour, roughness: 0.9, side: THREE.DoubleSide }) : canvas);
    const [x, z] = f.at as Vec2;
    g.position.set(x, floorY(x, z), z); g.rotation.y = ((f.turn ?? 0) * Math.PI) / 180;
    g.name = f.id; g.userData.noDrape = true; scene.add(g);
  }
  for (const a of data.awnings as Awning[]) { const g = awning(a); g.userData.noDrape = true; scene.add(g); }
  // The bougainvillea sprite is 2.6 m square: each climber runs from `from` (about 1 m) above its floor up to its photographed height.
  const before = scene.children.length;
  addSprites(scene, "bougainvillea", (data.climbers as Climber[]).map((c) => ({ x: c.at[0], z: c.at[1], y: floorY(c.at[0], c.at[1]) + (c.from ?? 1.0), scale: Math.max(c.spread, c.height - (c.from ?? 1.0)) / 2.6 })));
  for (const child of scene.children.slice(before)) child.userData.noDrape = true;
}
