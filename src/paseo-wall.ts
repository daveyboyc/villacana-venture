import * as THREE from "three";
import data from "../data/paseo_wall.json";
import { closestOnSegment } from "./geom";
import type { Seaside } from "./seaside";
import type { Seafront, Vec2 } from "./types";

/**
 * The yellow sandstone retaining wall along the landward side of the paseo, with the
 * green mesh fence on it, and the timber edge on the paseo's seaward side
 * (data/paseo_wall.json, IMG_2349-2354). The wall's height is not stored: it runs from
 * the paseo up to the ground behind, so it is as tall as the level difference there.
 */
const wall = data.wall;
export const paseoWallFace = wall.face as Vec2[];
export const PASEO_WALL_ID = wall.id;

/** A line moved sideways by `d` metres, inland for positive `d` (the line runs west to east). */
function offset(points: Vec2[], d: number): Vec2[] {
  return points.map(([x, z], i) => {
    const a = points[Math.max(0, i - 1)], b = points[Math.min(points.length - 1, i + 1)], length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [x + (b[1] - a[1]) / length * d, z - (b[0] - a[0]) / length * d];
  });
}

const back = offset(paseoWallFace, wall.thickness);
const fenceLine = offset(paseoWallFace, wall.fence.setback);

/** Collision: one block per stretch of wall, from its face to its back. The fence stands on it, so it stops the player from both sides. */
export function paseoWallRings(): Vec2[][] {
  return paseoWallFace.slice(1).map((b, i) => [paseoWallFace[i], b, back[i + 1], back[i]]);
}

/** The wall's plan outline, face then back, for the reference map. */
export const paseoWallOutline = (): Vec2[] => [...paseoWallFace, ...[...back].reverse()];

/** True when a stretch of the south lawn's sea wall is this same wall, so it is not drawn twice. */
export function paseoWallCovers(a: Vec2, b: Vec2): boolean {
  const near = ([x, z]: Vec2) => fenceLine.slice(1).some((q, i) => closestOnSegment(x, z, ...fenceLine[i], ...q).d < 1.2);
  return near(a) && near(b);
}

/** Points every metre or so along a line, keeping its corners. */
function walk(line: Vec2[], step = 1): { p: Vec2; i: number }[] {
  return line.flatMap((a, i) => {
    if (i === line.length - 1) return [{ p: a, i }];
    const b = line[i + 1], count = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    return Array.from({ length: count }, (_, k) => ({ p: [a[0] + (b[0] - a[0]) * k / count, a[1] + (b[1] - a[1]) * k / count] as Vec2, i }));
  });
}

/** Rough coursed sandstone: irregular yellow blocks with darker joints (IMG_2349). */
function sandstoneTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#8f7552"; g.fillRect(0, 0, 256, 256);
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tones = ["#e2c286", "#d9b778", "#ebcd92", "#d2ad70", "#e6c78c"];
  for (let row = 0, y = 0; y < 256; row++) {
    const h = 44 + rand() * 30;
    for (let x = -rand() * 60; x < 256;) {
      const w = 50 + rand() * 70;
      g.fillStyle = tones[Math.floor(rand() * tones.length)];
      g.beginPath();
      g.moveTo(x + 3 + rand() * 5, y + 3 + rand() * 4);
      g.lineTo(x + w - 3 - rand() * 5, y + 3 + rand() * 4);
      g.lineTo(x + w - 3 - rand() * 4, Math.min(256, y + h) - 3 - rand() * 4);
      g.lineTo(x + 3 + rand() * 4, Math.min(256, y + h) - 3 - rand() * 4);
      g.closePath(); g.fill();
      x += w;
    }
    y += h;
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Green welded mesh panel: see-through between the wires. */
function meshTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64; canvas.height = 128;
  const g = canvas.getContext("2d")!;
  g.strokeStyle = "#2f4a37"; g.lineWidth = 3;
  for (let x = 2; x < 64; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); }
  for (let y = 2; y < 128; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function surface(positions: number[], uvs: number[] | undefined, material: THREE.Material, name: string): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (uvs) geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name; mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

/** A vertical strip between two height profiles along a line. */
function strip(points: Vec2[], bottom: number[], top: number[], out: number[], uv: number[], scale: number): void {
  let along = 0;
  for (let k = 0; k < points.length - 1; k++) {
    const a = points[k], b = points[k + 1], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const quad = [[a, bottom[k], along], [b, bottom[k + 1], along + length], [a, top[k], along], [b, top[k + 1], along + length]] as const;
    for (const j of [0, 1, 2, 2, 1, 3]) { const [p, y, s] = quad[j]; out.push(p[0], y, p[1]); uv.push(s / scale, y / scale); }
    along += length;
  }
}

/**
 * Build the wall, its coping, the fence on it and the paseo's timber edge. `inland` is the
 * ground height behind the wall; the paseo and beach heights come from `seaside`.
 */
export function addPaseoWall(scene: THREE.Scene, sf: Seafront, seaside: Seaside, inland: (x: number, z: number) => number): void {
  const group = new THREE.Group();
  group.name = PASEO_WALL_ID; group.userData.noDrape = true;
  const samples = walk(paseoWallFace);
  const face = samples.map((s) => s.p);
  const lerp = (line: Vec2[], s: { p: Vec2; i: number }): Vec2 => {
    // The same fraction along the matching stretch of a parallel line.
    const a = paseoWallFace[s.i], b = paseoWallFace[Math.min(s.i + 1, paseoWallFace.length - 1)], length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const f = Math.hypot(s.p[0] - a[0], s.p[1] - a[1]) / length, c = line[s.i], d = line[Math.min(s.i + 1, line.length - 1)];
    return [c[0] + (d[0] - c[0]) * f, c[1] + (d[1] - c[1]) * f];
  };
  const rear = samples.map((s) => lerp(back, s)), fence = samples.map((s) => lerp(fenceLine, s));
  const behind = offset(rear, 0.3), seaward = offset(face, -0.05);
  // Foot well below the paseo: the sand grid dips under the ground just inland of the seaside, and the face must close that gap.
  const foot = seaward.map(([x, z]) => seaside.y(x, z) - 0.8);
  // Top level with the ground behind, plus the coping.
  const top = behind.map(([x, z]) => inland(x, z) + wall.coping);
  // A little self-light: the face looks south-east, away from the scene's afternoon sun, but is sunlit in the photos.
  const stone = new THREE.MeshStandardMaterial({ color: "#ffffff", map: sandstoneTexture(), roughness: 0.95, emissive: "#4a3818", emissiveIntensity: 0.6 });
  const positions: number[] = [], uvs: number[] = [];
  strip(face, foot, top, positions, uvs, 1.6);
  // End faces, so the wall does not look hollow where it stops.
  for (const k of [0, samples.length - 1]) strip([face[k], rear[k]], [foot[k], foot[k]], [top[k], top[k]], positions, uvs, 1.6);
  group.add(surface(positions, uvs, stone, PASEO_WALL_ID));
  // Coping: a flat cap from face to back.
  const cap: number[] = [];
  for (let k = 0; k < samples.length - 1; k++) {
    const q = [[face[k], top[k]], [face[k + 1], top[k + 1]], [rear[k], top[k]], [rear[k + 1], top[k + 1]]] as const;
    for (const j of [0, 2, 1, 1, 2, 3]) cap.push(q[j][0][0], q[j][1] + 0.005, q[j][0][1]);
  }
  group.add(surface(cap, undefined, new THREE.MeshStandardMaterial({ color: "#d8bd8a", roughness: 0.9, side: THREE.DoubleSide }), PASEO_WALL_ID + "-coping"));

  // The fence: welded mesh panels on posts, standing on the coping (IMG_2349, IMG_2350).
  const h = wall.fence.height, fenceTop = top.map((y) => y + h);
  const panel: number[] = [], panelUv: number[] = [];
  strip(fence, top, fenceTop, panel, panelUv, 1);
  const wires = meshTexture();
  wires.repeat.set(1 / 0.8, 1 / 1.1);
  const panelMesh = surface(panel, panelUv, new THREE.MeshStandardMaterial({ color: "#ffffff", map: wires, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.8 }), PASEO_WALL_ID + "-fence");
  panelMesh.castShadow = false;
  group.add(panelMesh);
  const green = new THREE.MeshStandardMaterial({ color: "#2f4a37", roughness: 0.7 });
  let since = Infinity;
  for (let k = 0; k < fence.length; k++) {
    since += k ? Math.hypot(fence[k][0] - fence[k - 1][0], fence[k][1] - fence[k - 1][1]) : 0;
    if (since < wall.fence.postSpacing && k !== fence.length - 1) continue;
    since = 0;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, h + 0.05, 0.06), green);
    post.position.set(fence[k][0], top[k] + (h + 0.05) / 2, fence[k][1]);
    post.name = PASEO_WALL_ID + "-post";
    group.add(post);
  }

  // Timber edge along the paseo's seaward side, over the same stretch (IMG_2350, IMG_2351).
  const edge = data.edge, paseo = sf.paseo.points, half = sf.paseo.width / 2;
  const span = (p: Vec2) => {
    let best = Infinity, at = 0, run = 0;
    for (let i = 0; i < paseo.length - 1; i++) {
      const a = paseo[i], b = paseo[i + 1], hit = closestOnSegment(p[0], p[1], ...a, ...b);
      if (hit.d < best) { best = hit.d; at = run + Math.hypot(hit.x - a[0], hit.z - a[1]); }
      run += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return at;
  };
  const [from, to] = [span(paseoWallFace[0]), span(paseoWallFace[paseoWallFace.length - 1])];
  const line = walk(paseo).map((s) => s.p), arcs = [0];
  for (let k = 1; k < line.length; k++) arcs.push(arcs[k - 1] + Math.hypot(line[k][0] - line[k - 1][0], line[k][1] - line[k - 1][1]));
  const kept = line.filter((_, k) => arcs[k] >= from && arcs[k] <= to);
  if (kept.length > 1) {
    const outer = offset(kept, -half - edge.width / 2), inner = offset(kept, -half + edge.width / 2);
    // The ribbon lies 0.04 above the seaside ground; the board stands a little proud of it.
    const tops = kept.map(([x, z]) => seaside.y(x, z) + 0.04 + edge.height);
    const board: number[] = [];
    for (let k = 0; k < kept.length - 1; k++) {
      const ya = tops[k], yb = tops[k + 1], base = Math.min(ya, yb) - edge.height - 0.12;
      const q = [outer[k], outer[k + 1], inner[k], inner[k + 1]];
      // Top, then the beach-facing side down into the sand.
      for (const j of [0, 2, 1, 1, 2, 3]) board.push(q[j][0], j % 2 ? yb : ya, q[j][1]);
      for (const [p, yy] of [[outer[k], ya], [outer[k + 1], yb], [outer[k], base], [outer[k], base], [outer[k + 1], yb], [outer[k + 1], base]] as [Vec2, number][]) board.push(p[0], yy, p[1]);
    }
    group.add(surface(board, undefined, new THREE.MeshStandardMaterial({ color: "#a08d76", roughness: 0.95, side: THREE.DoubleSide }), edge.id));
  }
  scene.add(group);
}
