import * as THREE from "three";
import { looseShrub } from "./clipped-plants";
import data from "../data/barraka_boardwalk.json";
import { routeClearance, type ProtectedRoute } from "./route-clearance";
import type { Vec2 } from "./types";

/** Shared map/3D access; protects the whole walk from optional furniture. */
export const barrakaAccess: ProtectedRoute = { id: data.boardwalk.id, name: data.boardwalk.name, points: data.boardwalk.points as Vec2[], width: data.boardwalk.width };
/** Hull of the sand-filled barbecue boat, shared by the map, the model and collision. */
export const barrakaBarbecueBoat = data.boat.ring as Vec2[];
/** The sign spans the aisle; its lettering faces back towards the inland approach. */
export const barrakaSign = { point: data.sign.point as Vec2, name: data.sign.name,
  yaw: Math.atan2(barrakaAccess.points[1][0]-barrakaAccess.points[0][0], barrakaAccess.points[1][1]-barrakaAccess.points[0][1])+Math.PI };
export function barrakaSections(): { a: Vec2; b: Vec2; left: Vec2; right: Vec2; endLeft: Vec2; endRight: Vec2 }[] {
  return barrakaAccess.points.slice(1).map((b, i) => {
    const a = barrakaAccess.points[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / length * barrakaAccess.width / 2, nz = (b[0] - a[0]) / length * barrakaAccess.width / 2;
    return { a, b, left: [a[0] + nx, a[1] + nz], right: [a[0] - nx, a[1] - nz], endLeft: [b[0] + nx, b[1] + nz], endRight: [b[0] - nx, b[1] - nz] };
  });
}

/** Ground-following planks; no terrain change or collision lip. Props are Details only. */
export function addBarrakaBoardwalk(scene: THREE.Scene, groundY: (x: number, z: number) => number): void {
  const group = new THREE.Group(); group.name = "barraka-boardwalk"; group.userData.noDrape = true; scene.add(group);
  const materials = ["#6c8973", "#9c9575", "#71887b", "#b1a080"].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1, side: THREE.DoubleSide }));
  let plank = 0;
  for (const { a, b, left, right, endLeft, endRight } of barrakaSections()) {
    const count = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / data.boardwalk.plankLength);
    const mix = (p: Vec2, q: Vec2, t: number): Vec2 => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    for (let i = 0; i < count; i++) {
      const points = [mix(left, endLeft, i / count), mix(right, endRight, i / count), mix(right, endRight, (i + .94) / count), mix(left, endLeft, (i + .94) / count)];
      const positions = [0, 2, 1, 0, 3, 2].flatMap(k => [points[k][0], groundY(...points[k]) + .065, points[k][1]]);
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, materials[plank++ % materials.length]); mesh.receiveShadow = true; group.add(mesh);
    }
  }
  if (scene.userData.layoutOnly) return;
  const details = new THREE.Group(); details.name = "barraka-details"; group.add(details);
  const routes = [...(scene.userData.protectedRoutes as ProtectedRoute[] ?? []), barrakaAccess];
  const clear = (x: number, z: number, radius: number) => routeClearance(routes, x, z, radius);
  const wood = new THREE.MeshStandardMaterial({ color: "#79543a", roughness: 1 });
  const cream = new THREE.MeshStandardMaterial({ color: "#e3d5b4", roughness: 1 });
  const white = new THREE.MeshStandardMaterial({ color: "#e9e7d9", roughness: .9 });
  const box = (parent: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const [sx, sz] = data.sign.point, signRadius = Math.hypot(data.sign.width / 2, data.sign.depth / 2 + .3);
  if (clear(sx, sz, signRadius)) {
    const sign = new THREE.Group(); sign.name = data.sign.id; sign.position.set(sx, groundY(sx, sz), sz); sign.rotation.y = barrakaSign.yaw; details.add(sign);
    box(sign, 2.1, .42, .65, 0, .25, .28, white); box(sign, 2.1, 1.25, .16, 0, .65, -.12, white);
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 192;
    const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#e9e7d9"; ctx.fillRect(0, 0, 512, 192); ctx.fillStyle = "#24271e"; ctx.textAlign = "center"; ctx.font = "bold 62px serif"; ctx.fillText("BARRAKA", 256, 77); ctx.fillText("BEACH", 300, 151);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.05, .77), new THREE.MeshStandardMaterial({ map: texture, roughness: 1, side: THREE.DoubleSide })); face.position.set(0, .8, .001); sign.add(face);
    const greens = ["#5a7a3c", "#6d8a48", "#4e6c36"];
    const lower = looseShrub({ width: 1.7, depth: 0.45, height: 0.42, seed: 4, leaf: "small", leafSize: [0.055, 0.032], greens });
    lower.position.set(0, 0.42, 0.22); sign.add(lower);
    const upper = looseShrub({ width: 1.5, depth: 0.32, height: 0.36, seed: 8, leaf: "glossy", leafSize: [0.05, 0.03], greens: ["#3f6230", "#54743c", "#6a8a44"] });
    upper.position.set(0, 1.22, -0.02); sign.add(upper);
  }
  for (const [x, z] of data.seating.parasols) {
    // Includes the visible thatch fringe (larger than the pole) and the full paired beds.
    if (!clear(x, z, 2.35)) continue;
    const y = groundY(x, z), seating = new THREE.Group(); seating.position.set(x, y, z); seating.rotation.y = -.7; details.add(seating);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, 2.35, 8), wood); pole.position.y = 1.175; seating.add(pole);
    const straw = new THREE.MeshStandardMaterial({ color: "#8a7c5d", roughness: 1 });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(data.seating.radius, .65, 24, 1, true), straw); roof.position.y = 2.35; roof.castShadow = true; seating.add(roof);
    for (let k = 0; k < 48; k++) { const angle = k * Math.PI * 2 / 48; const fringe = new THREE.Mesh(new THREE.CylinderGeometry(.012, .019, .25 + k % 3 * .05, 3), straw); fringe.position.set(Math.cos(angle) * 1.5, 1.97, Math.sin(angle) * 1.5); seating.add(fringe); }
    for (const side of [-1, 1]) {
      box(seating, .8, .15, 1.95, side * .61, .37, .35, wood); box(seating, .77, .12, 1.9, side * .61, .5, .35, cream);
      for (const dx of [-.3, .3]) for (const dz of [-.76, .76]) box(seating, .09, .3, .1, side * .61 + dx, .15, .35 + dz, wood);
    }
  }
  const [bx, bz] = data.boat.centre as Vec2;
  if (clear(bx, bz, 1.70)) addBarbecueBoat(details, groundY, bx, bz);
}

/** One open metal hull filled with sand, a few logs and a static flame. No smoke and no copied mesh. */
function addBarbecueBoat(parent: THREE.Group, groundY: (x: number, z: number) => number, bx: number, bz: number): void {
  const boat = new THREE.Group(); boat.name = "barraka-barbecue-boat"; boat.position.set(bx, groundY(bx, bz), bz); parent.add(boat);
  const local = (p: Vec2): [number, number] => [p[0] - bx, p[1] - bz];
  const hull = barrakaBarbecueBoat.map(local);
  const metal = new THREE.MeshStandardMaterial({ color: "#c5cbcf", roughness: 0.45, metalness: 0.55 });
  const sandMat = new THREE.MeshStandardMaterial({ color: "#d9c4a0", roughness: 1 });
  const logMat = new THREE.MeshStandardMaterial({ color: "#6b4428", roughness: 0.9 });
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length];
    const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz) || 1;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(length, 0.45, 0.05), metal);
    wall.position.set((a[0] + b[0]) / 2, 0.225, (a[1] + b[1]) / 2);
    wall.rotation.y = Math.atan2(-dz, dx); wall.castShadow = wall.receiveShadow = true; boat.add(wall);
  }
  const cx = hull.reduce((s, p) => s + p[0], 0) / hull.length, cz = hull.reduce((s, p) => s + p[1], 0) / hull.length;
  const sandPts = hull.map(([x, z]) => {
    const dx = cx - x, dz = cz - z, len = Math.hypot(dx, dz) || 1;
    return [x + dx / len * 0.08, z + dz / len * 0.08] as [number, number];
  });
  const sandGeo = new THREE.ExtrudeGeometry(new THREE.Shape(sandPts.map(([x, z]) => new THREE.Vector2(x, -z))), { depth: 0.28, bevelEnabled: false });
  sandGeo.rotateX(-Math.PI / 2);
  const sand = new THREE.Mesh(sandGeo, sandMat); sand.position.y = 0.02; sand.receiveShadow = true; sand.name = "barraka-barbecue-sand"; boat.add(sand);
  const stern: [number, number] = [(hull[0][0] + hull[1][0]) / 2, (hull[0][1] + hull[1][1]) / 2];
  const bow = hull[2];
  const across = Math.atan2(-(bow[1] - stern[1]), bow[0] - stern[0]) + Math.PI / 2;
  const logGeo = new THREE.CylinderGeometry(0.055, 0.06, 0.78, 6); logGeo.rotateZ(Math.PI / 2);
  for (let i = 0; i < 6; i++) {
    const t = 0.32 + i * 0.08;
    const log = new THREE.Mesh(logGeo, logMat);
    log.rotation.y = across + (i % 2) * 0.12;
    log.position.set(stern[0] + (bow[0] - stern[0]) * t, 0.36 + (i % 3) * 0.035, stern[1] + (bow[1] - stern[1]) * t);
    log.castShadow = true; boat.add(log);
  }
  const flame = new THREE.Group();
  flame.position.set(stern[0] + (bow[0] - stern[0]) * 0.52, 0.5, stern[1] + (bow[1] - stern[1]) * 0.52);
  const core = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 6), new THREE.MeshStandardMaterial({ color: "#ff7a22", emissive: "#ff5a00", emissiveIntensity: 0.85, roughness: 0.45 }));
  core.position.y = 0.11; flame.add(core);
  const tongue = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.16, 6), new THREE.MeshStandardMaterial({ color: "#ffb020", emissive: "#ff8a00", emissiveIntensity: 0.6, roughness: 0.4, transparent: true, opacity: 0.85 }));
  tongue.position.y = 0.08; flame.add(tongue); boat.add(flame);
}
