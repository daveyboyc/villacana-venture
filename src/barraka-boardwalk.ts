import * as THREE from "three";
import data from "../data/barraka_boardwalk.json";
import { routeClearance, type ProtectedRoute } from "./route-clearance";
import type { Vec2 } from "./types";

/** Shared map/3D access; protects the whole walk from optional furniture. */
export const barrakaAccess: ProtectedRoute = { id: data.boardwalk.id, name: data.boardwalk.name, points: data.boardwalk.points as Vec2[], width: data.boardwalk.width };
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
    for (let i = 0; i < 14; i++) {
      const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(.28, 1), new THREE.MeshStandardMaterial({ color: i % 2 ? "#768444" : "#a2aa61", roughness: 1 }));
      shrub.position.set((i % 7 - 3) * .29, i < 7 ? .5 : 1.35, i < 7 ? .3 : -.1); shrub.scale.set(1, .75, 1); shrub.castShadow = true; sign.add(shrub);
    }
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
}
