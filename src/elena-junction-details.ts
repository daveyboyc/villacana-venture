import * as THREE from "three";
import data from "../data/elena_junction_details.json";
import lawns from "../data/junction_lawns.json";
import frontages from "../data/frontage_divisions.json";
import walls from "../data/lane_walls.json";
import beds from "../data/elena_south_beds.json";
import { looseShrub, roundClippedTree, wallClimber } from "./clipped-plants";
import { lanternPost, LANTERN_RADIUS } from "./lantern-post";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/**
 * Show-details pieces at the Elena south junction lawns (data/elena_junction_details.json, data/junction_lawns.json):
 * the clipped lawn trees, the two cypresses at the far wall, climbers on the walls, the lamp post in the east hedge bed
 * and the CALLE ELENA tile sign. Each piece keeps the shared route guard with its whole footprint; a photographed tree
 * whose crown overhangs the lane kerb (canopyOverhangs) keeps only its trunk clear, as for data/objects.json.
 */
const TRUNK_CLEARANCE = 0.3;
type Guard = (x: number, z: number, radius: number) => boolean;
const wallById = new Map(walls.walls.map((w) => [w.id, w]));
const lawnLift = (region: string) => (frontages.regions.find((r) => r.id === region) as { lift?: number } | undefined)?.lift ?? 0.025;

/** A wall segment as a frame: start, unit direction, unit normal toward `side` (a compass word), half thickness. */
function wallFrame(wallId: string, segment: number, side: string) {
  const w = wallById.get(wallId)!;
  const a = w.points[segment] as Vec2, b = w.points[segment + 1] as Vec2, l = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const u: Vec2 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  let n: Vec2 = [u[1], -u[0]];
  const want: Record<string, Vec2> = { east: [1, 0], west: [-1, 0], north: [0, -1], south: [0, 1] };
  if (n[0] * want[side][0] + n[1] * want[side][1] < 0) n = [-n[0], -n[1]];
  // A right-handed frame needs x × up = n: x runs along u or against it, and the viewer facing the wall has x to their right.
  const x: Vec2 = -u[1] === n[0] && u[0] === n[1] ? u : [-u[0], -u[1]];
  const turn = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(x[0], 0, x[1]), new THREE.Vector3(0, 1, 0), new THREE.Vector3(n[0], 0, n[1])));
  return { a, u, n, x, turn, forward: x === u, half: w.thickness / 2, length: l, height: w.height };
}

function cypress(height: number, radius: number): THREE.Group {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.045, height * 0.4, 7), new THREE.MeshStandardMaterial({ color: "#5d4a38", roughness: 1 }));
  trunk.position.y = height * 0.2; tree.add(trunk);
  const foliage = new THREE.CapsuleGeometry(radius, height - 2 * radius, 6, 14), positions = foliage.getAttribute("position"), colours: number[] = [];
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i), fraction = (y + height / 2) / height, taper = fraction > 0.6 ? 1 - (fraction - 0.6) * 1.5 : 0.9 + fraction * 0.15;
    const rough = 0.9 + 0.07 * Math.sin(i * 17.3);
    positions.setXYZ(i, positions.getX(i) * taper * rough, y, positions.getZ(i) * taper * rough);
    const colour = new THREE.Color(["#2f4527", "#3a5330", "#33492b"][i % 3]); colours.push(colour.r, colour.g, colour.b);
  }
  foliage.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3)); foliage.computeVertexNormals();
  const leaves = new THREE.Mesh(foliage, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
  leaves.position.y = height / 2 + 0.05; leaves.castShadow = leaves.receiveShadow = true; tree.add(leaves);
  return tree;
}

function signTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas"); canvas.width = 288; canvas.height = 96;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#f4f1e8"; g.fillRect(0, 0, 288, 96);
  g.strokeStyle = "#1d2a4a"; g.lineWidth = 6; g.strokeRect(5, 5, 278, 86);
  g.strokeStyle = "rgba(60,60,60,0.25)"; g.lineWidth = 2;
  for (const x of [72, 144, 216]) { g.beginPath(); g.moveTo(x, 6); g.lineTo(x, 90); g.stroke(); }
  g.fillStyle = "#151a24"; g.font = "bold 58px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(text, 144, 52);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  return texture;
}

export function addElenaJunctionDetails(into: THREE.Scene, keep: (x: number, z: number) => boolean): void {
  const guard = into.userData.decorationClearance as Guard | undefined;
  const clear = (x: number, z: number, r: number) => !guard || guard(x, z, r);
  const root = new THREE.Group(); root.name = data.id; root.userData.noDrape = true; root.userData.omitted = [] as string[];
  const omit = (id: string) => (root.userData.omitted as string[]).push(id);

  // Clipped lawn trees: a round crown on a bare trunk, standing on the raised lawn.
  let seed = 41;
  for (const t of lawns.trees as { id: string; point: number[]; region: string; trunk: number; crown: number; crownHeight: number; canopyOverhangs?: boolean }[]) {
    const [x, z] = t.point;
    if (!keep(x, z) || !clear(x, z, t.canopyOverhangs ? TRUNK_CLEARANCE : t.crown / 2)) { omit(t.id); continue; }
    const tree = roundClippedTree({ trunk: t.trunk, crown: t.crown, crownHeight: t.crownHeight, seed: seed++ });
    tree.position.set(x, siteY(x, z) + lawnLift(t.region) - 0.02, z); tree.name = t.id; tree.userData.visibleRadius = t.crown / 2;
    tree.traverse((o) => { o.userData.noDrape = true; }); root.add(tree);
  }

  for (const c of data.cypresses) {
    const [x, z] = c.at;
    if (!keep(x, z) || !clear(x, z, c.radius)) { omit(c.id); continue; }
    const tree = cypress(c.height, c.radius); tree.position.set(x, siteY(x, z) + 0.12, z); tree.name = c.id;
    tree.traverse((o) => { o.userData.noDrape = true; }); root.add(tree);
  }

  // Climbers in 0.6 m pieces, so the guard can bound each with its footprint.
  for (const c of data.climbers as { id: string; wall: string; segment: number; from: number; to: number; side: string; height: number; depth: number; flowers: number; colour?: string; sparse?: boolean }[]) {
    const f = wallFrame(c.wall, c.segment, c.side), pieces = Math.max(1, Math.round((c.to - c.from) / 0.6)), len = (c.to - c.from) / pieces;
    for (let i = 0; i < pieces; i++) {
      const s = c.from + i * len, mid = s + len / 2, off = f.half + c.depth / 2;
      const cx = f.a[0] + f.u[0] * mid + f.n[0] * off, cz = f.a[1] + f.u[1] * mid + f.n[1] * off;
      if (!keep(cx, cz) || !clear(cx, cz, Math.hypot(len, c.depth) / 2)) { omit(`${c.id}-${i}`); continue; }
      const piece = wallClimber({ length: len, height: Math.min(c.height, f.height + 0.25), depth: c.depth, seed: seed++, flowers: Math.round((c.flowers * len) / (c.to - c.from)), flowerColour: c.colour, sparse: c.sparse });
      // Local x along the wall (with or against u, see wallFrame), z out of its face: start at whichever end x begins.
      const start = f.forward ? s : s + len;
      const sx = f.a[0] + f.u[0] * start + f.n[0] * f.half, sz = f.a[1] + f.u[1] * start + f.n[1] * f.half;
      piece.position.set(sx, siteY(sx, sz), sz);
      piece.quaternion.copy(f.turn);
      piece.name = c.id; piece.traverse((o) => { o.userData.noDrape = true; }); root.add(piece);
    }
  }

  // Shrubs in the strip at the west wall's foot.
  for (const [i, sh] of (data.shrubs ?? []).entries()) {
    const f = wallFrame(sh.wall, sh.segment, sh.side), off = f.half + 0.05 + sh.width / 2;
    const x = f.a[0] + f.u[0] * sh.at + f.n[0] * off, z = f.a[1] + f.u[1] * sh.at + f.n[1] * off;
    if (!keep(x, z) || !clear(x, z, sh.width / 2)) { omit(`west-wall-shrub-${i}`); continue; }
    const bush = looseShrub({ width: sh.width, depth: sh.width * 0.8, height: sh.height, seed: seed++, leaf: "glossy", leafSize: [0.1, 0.08], greens: ["#5f8a3e", "#6f9a48", "#7fa852", "#56803a"], stems: 5 });
    bush.position.set(x, siteY(x, z) + 0.12, z); bush.name = "west-wall-shrub"; bush.traverse((o) => { o.userData.noDrape = true; }); root.add(bush);
  }

  // White facade pieces the photos show on registry faces: boxes in the face's frame (along it, out of it, up).
  const plaster = new THREE.MeshStandardMaterial({ color: "#fbf8f0", roughness: 0.85 });
  for (const fc of data.facade ?? []) {
    const [a, b] = fc.face as [Vec2, Vec2], l = Math.hypot(b[0] - a[0], b[1] - a[1]), u: Vec2 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    let n: Vec2 = [u[1], -u[0]]; if (fc.side === "north" ? n[1] > 0 : fc.side === "south" ? n[1] < 0 : fc.side === "east" ? n[0] < 0 : n[0] > 0) n = [-n[0], -n[1]];
    const ground = siteY((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    for (const bx of fc.boxes) {
      const sm = (bx.along[0] + bx.along[1]) / 2, om = (bx.out[0] + bx.out[1]) / 2;
      const x = a[0] + u[0] * sm + n[0] * om, z = a[1] + u[1] * sm + n[1] * om;
      if (!clear(x, z, Math.hypot(bx.along[1] - bx.along[0], bx.out[1] - bx.out[0]) / 2)) { omit(`${fc.id}-${bx.name}`); continue; }
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(bx.along[1] - bx.along[0], bx.y[1] - bx.y[0], bx.out[1] - bx.out[0]), plaster);
      mesh.position.set(x, ground + (bx.y[0] + bx.y[1]) / 2, z); mesh.rotation.y = -Math.atan2(u[1], u[0]);
      mesh.castShadow = mesh.receiveShadow = true; mesh.name = fc.id; mesh.userData.noDrape = true; root.add(mesh);
    }
  }

  // Small windows on plain faces: a brown shuttered panel in a white reveal, just proud of the wall.
  for (const w of data.windows ?? []) {
    const [a, b] = w.face as [Vec2, Vec2], l = Math.hypot(b[0] - a[0], b[1] - a[1]), u: Vec2 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    let n: Vec2 = [u[1], -u[0]]; if (w.side === "north" ? n[1] > 0 : n[1] < 0) n = [-n[0], -n[1]];
    const x = a[0] + u[0] * w.along + n[0] * 0.03, z = a[1] + u[1] * w.along + n[1] * 0.03, y = siteY(x, z) + w.y;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w.width + 0.12, w.height + 0.12, 0.04), plaster);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(w.width, w.height, 0.05), new THREE.MeshStandardMaterial({ color: "#4a2e1f", roughness: 0.8 }));
    for (const [m, dz] of [[frame, 0.0], [panel, 0.01]] as [THREE.Mesh, number][]) {
      m.position.set(x + n[0] * dz, y, z + n[1] * dz); m.rotation.y = -Math.atan2(u[1], u[0]); m.name = w.id; m.userData.noDrape = true; root.add(m);
    }
  }

  // Lamp post in the east hedge bed.
  const bed = beds.planters.find((b) => b.id === data.lamp.bed)!, ax = beds.axis;
  const lx = ax.origin[0] + ax.along[0] * data.lamp.s + ax.right[0] * data.lamp.o, lz = ax.origin[1] + ax.along[1] * data.lamp.s + ax.right[1] * data.lamp.o;
  if (keep(lx, lz) && clear(lx, lz, LANTERN_RADIUS)) {
    const post = lanternPost({ name: data.lamp.id }); post.position.set(lx, siteY(lx, lz) + bed.height - 0.03, lz);
    post.traverse((o) => { o.userData.noDrape = true; }); root.add(post);
  } else omit(data.lamp.id);

  // CALLE ELENA tile plaques on the wall face.
  const sg = data.sign, f = wallFrame(sg.wall, sg.segment, sg.side);
  sg.plaques.forEach((text, i) => {
    // Read left to right by someone facing the wall: along x from the first plaque.
    const k = f.forward ? i : sg.plaques.length - 1 - i, s = sg.from + k * (sg.plaqueWidth + sg.gap) + sg.plaqueWidth / 2;
    const x = f.a[0] + f.u[0] * s + f.n[0] * (f.half + 0.012), z = f.a[1] + f.u[1] * s + f.n[1] * (f.half + 0.012);
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(sg.plaqueWidth, sg.plaqueHeight), new THREE.MeshStandardMaterial({ map: signTexture(text), roughness: 0.5 }));
    plaque.position.set(x, siteY(x, z) + sg.y, z);
    plaque.quaternion.copy(f.turn);
    plaque.name = sg.id; plaque.userData.noDrape = true; root.add(plaque);
  });
  into.add(root);
}
