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

/** Open brushed-metal skiff on a pedestal stand: flared hull, rolled gunwale pipe, sand & ash bed, charred firewood, embers and wispy smoke. */
function addBarbecueBoat(parent: THREE.Group, groundY: (x: number, z: number) => number, bx: number, bz: number): void {
  const boat = new THREE.Group(); boat.name = "barraka-barbecue-boat"; boat.position.set(bx, groundY(bx, bz), bz); parent.add(boat);
  const body = new THREE.Group();
  const ring = barrakaBarbecueBoat, sternX = (ring[0][0] + ring[1][0]) / 2, sternZ = (ring[0][1] + ring[1][1]) / 2;
  // Local +X is the stem. The plan ring stays the triangle this hull is stood on.
  body.rotation.y = Math.atan2(-(ring[2][1] - sternZ), ring[2][0] - sternX);
  boat.add(body);

  const hullTex = brushedMetalTexture();
  const hullMat = new THREE.MeshStandardMaterial({
    map: hullTex.map,
    roughnessMap: hullTex.roughness,
    bumpMap: hullTex.bump,
    bumpScale: 0.004,
    roughness: 0.45,
    metalness: 0.36,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: "#dad4ca",
    roughness: 0.30,
    metalness: 0.52,
  });
  const standMat = new THREE.MeshStandardMaterial({
    color: "#767068",
    roughness: 0.72,
    metalness: 0.35,
  });

  const shell = new THREE.Mesh(boatHullGeometry(), hullMat);
  shell.castShadow = shell.receiveShadow = true;
  shell.name = "barraka-barbecue-hull";
  body.add(shell);

  const gunwale = new THREE.Mesh(boatGunwaleGeometry(), rimMat);
  gunwale.castShadow = gunwale.receiveShadow = true;
  gunwale.name = "barraka-barbecue-gunwale";
  body.add(gunwale);

  addBoatPedestal(body, standMat);

  const sandTex = sandAshTexture();
  const sandMat = new THREE.MeshStandardMaterial({
    map: sandTex.map,
    bumpMap: sandTex.bump,
    bumpScale: 0.016,
    roughness: 0.96,
    metalness: 0.0,
  });
  const ash = new THREE.Mesh(sandBedGeometry(), sandMat);
  ash.receiveShadow = true;
  ash.name = "barraka-barbecue-ash";
  body.add(ash);

  addCharredLogs(body);
  addBoatFire(body);
}

/** Proportions matched to IMG_2223, IMG_2346, IMG_2347, IMG_2616 and IMG_2619. */
const BOAT_LENGTH = 2.75;
const BOAT_BEAM = 1.22;
const BOAT_STATIONS = 24;
const BOAT_FIRE_X = 0.34;
const BOAT_BED_DROP = 0.042;

function boatHalfBeam(t: number): number {
  const half = BOAT_BEAM / 2, shoulder = 0.32;
  if (t <= shoulder) return half * (0.90 + 0.10 * Math.sin((t / shoulder) * Math.PI / 2));
  const u = (t - shoulder) / (1 - shoulder);
  return 0.042 + (half - 0.042) * Math.pow(Math.max(0, 1 - u * u), 0.62);
}

function boatSheer(t: number): number {
  return 0.52 + 0.055 * Math.pow(t, 1.8);
}

type HullStation = {
  xg: number; yg: number; zg: number;
  xc: number; yc: number; zc: number;
  xk: number; yk: number;
};

function hullStation(t: number): HullStation {
  const zg = boatHalfBeam(t);
  const yg = boatSheer(t);
  const xg = -BOAT_LENGTH / 2 - 0.035 + t * (BOAT_LENGTH + 0.08);
  const xc = -BOAT_LENGTH / 2 + 0.035 + t * (BOAT_LENGTH - 0.08);
  const xk = -BOAT_LENGTH / 2 + 0.045 + t * (BOAT_LENGTH - 0.11);
  const forefoot = Math.pow(Math.max(0, (t - 0.62) / 0.38), 1.8);
  const yk = 0.14 + 0.10 * forefoot;
  const yc = yk + 0.055 * (1 - 0.55 * t);
  const zc = zg * (0.67 + 0.06 * t);
  return { xg, yg, zg, xc, yc, zc, xk, yk };
}

function boatHullGeometry(): THREE.BufferGeometry {
  const stations = Array.from({ length: BOAT_STATIONS + 1 }, (_, i) => hullStation(i / BOAT_STATIONS));
  const pos: number[] = [], nrm: number[] = [], uvs: number[] = [], idx: number[] = [];

  const pushTri = (ax: number, ay: number, az: number, au: number, av: number,
                   bx: number, by: number, bz: number, bu: number, bv: number,
                   cx: number, cy: number, cz: number, cu: number, cv: number,
                   nx: number, ny: number, nz: number) => {
    const i0 = pos.length / 3;
    pos.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    uvs.push(au, av, bu, bv, cu, cv);
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    const len = Math.hypot(fx, fy, fz);
    if (len < 1e-8) { pos.length -= 9; uvs.length -= 6; return; }
    const dot = fx * nx + fy * ny + fz * nz;
    const sn = dot >= 0 ? 1 : -1;
    const l = Math.hypot(nx, ny, nz) || 1;
    nrm.push(nx / l, ny / l, nz / l, nx / l, ny / l, nz / l, nx / l, ny / l, nz / l);
    if (sn >= 0) idx.push(i0, i0 + 1, i0 + 2);
    else idx.push(i0, i0 + 2, i0 + 1);
  };

  const quad = (a: [number, number, number, number, number],
                b: [number, number, number, number, number],
                c: [number, number, number, number, number],
                d: [number, number, number, number, number],
                want: readonly [number, number, number]) => {
    pushTri(...a, ...b, ...c, ...want);
    pushTri(...a, ...c, ...d, ...want);
  };

  // Smooth vertex-normal builder for curved side plates & bottom plates.
  const sideQuadSmooth = (
    p00: [number, number, number], p10: [number, number, number],
    p11: [number, number, number], p01: [number, number, number],
    n00: [number, number, number], n10: [number, number, number],
    n11: [number, number, number], n01: [number, number, number],
    uv00: [number, number], uv10: [number, number],
    uv11: [number, number], uv01: [number, number],
    want: [number, number, number],
  ) => {
    const base = pos.length / 3;
    const pts = [p00, p10, p11, p01];
    const ns = [n00, n10, n11, n01];
    const ts = [uv00, uv10, uv11, uv01];
    for (let k = 0; k < 4; k++) {
      pos.push(...pts[k]);
      const l = Math.hypot(...ns[k]) || 1;
      nrm.push(ns[k][0] / l, ns[k][1] / l, ns[k][2] / l);
      uvs.push(...ts[k]);
    }
    const ux = p10[0] - p00[0], uy = p10[1] - p00[1], uz = p10[2] - p00[2];
    const vx = p11[0] - p00[0], vy = p11[1] - p00[1], vz = p11[2] - p00[2];
    const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    if (fx * want[0] + fy * want[1] + fz * want[2] >= 0) {
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    } else {
      idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    }
  };

  for (let i = 0; i < BOAT_STATIONS; i++) {
    const a = stations[i], b = stations[i + 1];
    const u0 = i / BOAT_STATIONS, u1 = (i + 1) / BOAT_STATIONS;
    for (const side of [1, -1] as const) {
      // Flared outer side panel normal
      const slopeZ = (a.zg - a.zc) / Math.max(0.05, a.yg - a.yc);
      const dxA = (stations[Math.min(BOAT_STATIONS, i + 1)].zg - stations[Math.max(0, i - 1)].zg);
      const dsA = (stations[Math.min(BOAT_STATIONS, i + 1)].xg - stations[Math.max(0, i - 1)].xg) || 1;
      const nxA = -dxA / dsA;
      const nSideA: [number, number, number] = [nxA, -slopeZ * 0.6, side];

      const slopeZb = (b.zg - b.zc) / Math.max(0.05, b.yg - b.yc);
      const dxB = (stations[Math.min(BOAT_STATIONS, i + 2)].zg - stations[i].zg);
      const dsB = (stations[Math.min(BOAT_STATIONS, i + 2)].xg - stations[i].xg) || 1;
      const nxB = -dxB / dsB;
      const nSideB: [number, number, number] = [nxB, -slopeZb * 0.6, side];

      sideQuadSmooth(
        [a.xc, a.yc, side * a.zc], [b.xc, b.yc, side * b.zc],
        [b.xg, b.yg, side * b.zg], [a.xg, a.yg, side * a.zg],
        nSideA, nSideB, nSideB, nSideA,
        [u0, 0.08], [u1, 0.08], [u1, 0.92], [u0, 0.92],
        [0, -0.3, side],
      );

      // Bottom plate (keel to chine)
      const nBot: [number, number, number] = [0, -1, side * 0.16];
      sideQuadSmooth(
        [a.xk, a.yk, 0], [b.xk, b.yk, 0],
        [b.xc, b.yc, side * b.zc], [a.xc, a.yc, side * a.zc],
        nBot, nBot, nBot, nBot,
        [u0, 0.05], [u1, 0.05], [u1, 0.35], [u0, 0.35],
        [0, -1, 0],
      );

      // Visible inner side band (top gunwale down 0.14 m inside, well beneath sand surface)
      const insetG = 0.018;
      const nIn: [number, number, number] = [-nxA, 0.3, -side];
      const nInB: [number, number, number] = [-nxB, 0.3, -side];
      sideQuadSmooth(
        [a.xg, a.yg, side * (a.zg - insetG)], [b.xg, b.yg, side * (b.zg - insetG)],
        [b.xg - 0.01, b.yg - 0.14, side * Math.max(0.01, b.zg - 0.065)], [a.xg - 0.01, a.yg - 0.14, side * Math.max(0.01, a.zg - 0.065)],
        nIn, nInB, nInB, nIn,
        [u0, 0.85], [u1, 0.85], [u1, 0.98], [u0, 0.98],
        [0, 0.2, -side],
      );
    }
  }

  // Flat raked stern transom (V-bottomed inverted trapezoid) + inner stern strip
  const s0 = stations[0];
  const sternOut: [number, number, number] = [-1, -0.18, 0];
  pushTri(
    s0.xk, s0.yk, 0, 0.5, 0.08,
    s0.xc, s0.yc, s0.zc, 0.9, 0.18,
    s0.xg, s0.yg, s0.zg, 0.95, 0.92,
    ...sternOut,
  );
  pushTri(
    s0.xk, s0.yk, 0, 0.5, 0.08,
    s0.xg, s0.yg, s0.zg, 0.95, 0.92,
    s0.xg, s0.yg, -s0.zg, 0.05, 0.92,
    ...sternOut,
  );
  pushTri(
    s0.xk, s0.yk, 0, 0.5, 0.08,
    s0.xg, s0.yg, -s0.zg, 0.05, 0.92,
    s0.xc, s0.yc, -s0.zc, 0.1, 0.18,
    ...sternOut,
  );
  // Inner transom wall down into sand
  quad(
    [s0.xg + 0.015, s0.yg, -s0.zg + 0.018, 0.1, 0.92],
    [s0.xg + 0.015, s0.yg, s0.zg - 0.018, 0.9, 0.92],
    [s0.xg + 0.035, s0.yg - 0.14, s0.zg - 0.06, 0.85, 0.72],
    [s0.xg + 0.035, s0.yg - 0.14, -s0.zg + 0.06, 0.15, 0.72],
    [1, 0.2, 0],
  );

  // Rounded welded bow nose cap (4 curved segments from port to starboard)
  const sb = stations[BOAT_STATIONS];
  const bowSegs = 4;
  for (let k = 0; k < bowSegs; k++) {
    const a0 = -Math.PI / 2 + (k / bowSegs) * Math.PI;
    const a1 = -Math.PI / 2 + ((k + 1) / bowSegs) * Math.PI;
    const zG0 = Math.sin(a0) * sb.zg, xG0 = sb.xg + Math.cos(a0) * 0.042;
    const zG1 = Math.sin(a1) * sb.zg, xG1 = sb.xg + Math.cos(a1) * 0.042;
    const zC0 = Math.sin(a0) * sb.zc, xC0 = sb.xc + Math.cos(a0) * 0.032;
    const zC1 = Math.sin(a1) * sb.zc, xC1 = sb.xc + Math.cos(a1) * 0.032;
    const amid = (a0 + a1) / 2;
    const nBow: [number, number, number] = [Math.cos(amid), -0.25, Math.sin(amid)];
    quad(
      [xC0, sb.yc, zC0, 0.95, 0.2],
      [xC1, sb.yc, zC1, 0.98, 0.2],
      [xG1, sb.yg, zG1, 0.98, 0.9],
      [xG0, sb.yg, zG0, 0.95, 0.9],
      nBow,
    );
    pushTri(
      sb.xk, sb.yk, 0, 0.95, 0.1,
      xC1, sb.yc, zC1, 0.98, 0.2,
      xC0, sb.yc, zC0, 0.95, 0.2,
      0.4, -1, Math.sin(amid) * 0.3,
    );
    // Inner bow nose strip
    const xI0 = xG0 - 0.015, zI0 = zG0 * 0.55;
    const xI1 = xG1 - 0.015, zI1 = zG1 * 0.55;
    quad(
      [xI1, sb.yg, zI1, 0.98, 0.9],
      [xI0, sb.yg, zI0, 0.95, 0.9],
      [xI0 - 0.025, sb.yg - 0.14, zI0 * 0.7, 0.95, 0.72],
      [xI1 - 0.025, sb.yg - 0.14, zI1 * 0.7, 0.98, 0.72],
      [-Math.cos(amid), 0.2, -Math.sin(amid)],
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

/** Closed tubular stainless pipe gunwale sitting directly over the hull sheet edge, with tight rounded stern corners and bow nose. */
function boatGunwaleGeometry(): THREE.BufferGeometry {
  const rim: [number, number, number][] = [];
  const stations = Array.from({ length: BOAT_STATIONS + 1 }, (_, i) => hullStation(i / BOAT_STATIONS));
  const s0 = stations[0], sb = stations[BOAT_STATIONS];
  const inset = 0.008;

  // Starboard side stern -> bow (start at stern corner fillet exit)
  for (let i = 1; i < BOAT_STATIONS; i++) {
    const s = stations[i];
    rim.push([s.xg, s.yg + 0.006, s.zg - inset]);
  }
  // Rounded bow nose matching the hull bow cap curve
  for (let k = 0; k <= 6; k++) {
    const a = Math.PI / 2 - (k / 6) * Math.PI;
    rim.push([sb.xg + Math.cos(a) * 0.042, sb.yg + 0.006, Math.sin(a) * (sb.zg - inset)]);
  }
  // Port side bow -> stern
  for (let i = BOAT_STATIONS - 1; i >= 1; i--) {
    const s = stations[i];
    rim.push([s.xg, s.yg + 0.006, -(s.zg - inset)]);
  }
  // Port stern corner (tight 1.8 cm fillet centered right over transom corner)
  const cornerR = 0.018;
  for (let k = 0; k <= 2; k++) {
    const a = -Math.PI / 2 - (k / 2) * (Math.PI / 2);
    rim.push([s0.xg + cornerR + Math.cos(a) * cornerR, s0.yg + 0.006, -(s0.zg - cornerR - inset) + Math.sin(a) * cornerR]);
  }
  // Transom straight run
  for (let k = 1; k <= 5; k++) {
    const z = -(s0.zg - cornerR - inset) + (k / 6) * 2 * (s0.zg - cornerR - inset);
    rim.push([s0.xg, s0.yg + 0.006, z]);
  }
  // Starboard stern corner
  for (let k = 0; k <= 2; k++) {
    const a = Math.PI - (k / 2) * (Math.PI / 2);
    rim.push([s0.xg + cornerR + Math.cos(a) * cornerR, s0.yg + 0.006, (s0.zg - cornerR - inset) + Math.sin(a) * cornerR]);
  }

  const m = rim.length, segs = 10, pipeR = 0.023;
  const pos: number[] = [], nrm: number[] = [], idx: number[] = [];
  for (let i = 0; i < m; i++) {
    const prev = rim[(i + m - 1) % m], curr = rim[i], next = rim[(i + 1) % m];
    const tx = next[0] - prev[0], ty = next[1] - prev[1], tz = next[2] - prev[2];
    const tlen = Math.hypot(tx, ty, tz) || 1;
    // Outward horizontal radial vector from tangent (rim runs clockwise viewed from +Y: stern->starboard->bow->port->stern)
    const rx0 = -tz / tlen, rz0 = tx / tlen;
    const rlen = Math.hypot(rx0, rz0) || 1;
    const rx = rx0 / rlen, rz = rz0 / rlen;
    // Binormal perpendicular to tangent & radial
    const bx = (ty / tlen) * rz;
    const by = (tz / tlen) * rx - (tx / tlen) * rz;
    const bz = -(ty / tlen) * rx;
    for (let j = 0; j < segs; j++) {
      const phi = (j / segs) * Math.PI * 2;
      const c = Math.cos(phi), s = Math.sin(phi);
      const nx = c * rx + s * bx, ny = s * by, nz = c * rz + s * bz;
      pos.push(curr[0] + nx * pipeR, curr[1] + ny * pipeR, curr[2] + nz * pipeR);
      nrm.push(nx, ny, nz);
    }
  }
  for (let i = 0; i < m; i++) {
    const ni = (i + 1) % m;
    for (let j = 0; j < segs; j++) {
      const nj = (j + 1) % segs;
      const a = i * segs + j, b = ni * segs + j, c = ni * segs + nj, d = i * segs + nj;
      idx.push(a, c, b, a, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

/** Under-hull pedestal stand: sturdy central-aft galvanized column (visible under transom in IMG_2346/2616) and tucked keel cradle. */
function addBoatPedestal(parent: THREE.Group, mat: THREE.Material): void {
  const mainPost = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.24, 14), mat);
  mainPost.position.set(-0.46, 0.05, 0);
  mainPost.castShadow = mainPost.receiveShadow = true;
  parent.add(mainPost);

  const keelBeam = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 0.06), mat);
  keelBeam.position.set(-0.22, 0.13, 0);
  keelBeam.castShadow = keelBeam.receiveShadow = true;
  parent.add(keelBeam);
}

/** Dense undulating sand & ash bed filling right up near the gunwale rim (~3.8 cm below top). */
function sandBedGeometry(): THREE.BufferGeometry {
  const cols = 10, rows = BOAT_STATIONS;
  const pos: number[] = [], uvs: number[] = [], idx: number[] = [];
  const stations = Array.from({ length: rows + 1 }, (_, i) => hullStation(i / rows));

  for (let i = 0; i <= rows; i++) {
    const s = stations[i], t = i / rows;
    const x = Math.min(s.xg + 0.01, Math.max(s.xg + 0.025 * (1 - t), s.xg + (t === 1 ? 0.018 : 0)));
    const innerHalf = Math.max(0.01, s.zg - 0.022);
    for (let j = 0; j <= cols; j++) {
      const f = (j / cols) * 2 - 1; // -1 (port) .. +1 (starboard)
      const z = f * innerHalf;
      const edgeFade = 1 - f * f;
      const distFire = Math.hypot(x - BOAT_FIRE_X, z);
      const ashMound = Math.exp(-(distFire * distFire) / 0.14) * 0.042;
      const ripple = Math.sin(x * 7.5 + z * 5.2) * 0.009 + Math.cos(z * 11.4 - x * 4.3) * 0.007;
      const y = s.yg - BOAT_BED_DROP + 0.012 * edgeFade + ashMound + ripple * (0.35 + 0.65 * edgeFade);
      pos.push(x, y, z);
      uvs.push((x + BOAT_LENGTH / 2 + 0.1) / (BOAT_LENGTH + 0.2), (z + BOAT_BEAM / 2) / BOAT_BEAM);
    }
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j, b = (i + 1) * (cols + 1) + j;
      const c = (i + 1) * (cols + 1) + (j + 1), d = i * (cols + 1) + (j + 1);
      idx.push(a, c, b, a, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function detHash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Weathered brushed stainless/galvanized sheet metal texture + roughness + bump. */
function brushedMetalTexture(): { map: THREE.CanvasTexture; roughness: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const size = 256;
  const colC = document.createElement("canvas"); colC.width = colC.height = size;
  const rghC = document.createElement("canvas"); rghC.width = rghC.height = size;
  const bmpC = document.createElement("canvas"); bmpC.width = bmpC.height = size;
  const cg = colC.getContext("2d")!, rg = rghC.getContext("2d")!, bg = bmpC.getContext("2d")!;

  cg.fillStyle = "#c8c0b4"; cg.fillRect(0, 0, size, size);
  rg.fillStyle = "#7c7c7c"; rg.fillRect(0, 0, size, size);
  bg.fillStyle = "#808080"; bg.fillRect(0, 0, size, size);

  for (let i = 0; i < 1600; i++) {
    const y = detHash(i * 1.3) * size, x = detHash(i * 2.7) * size, w = 14 + detHash(i * 3.9) * 60;
    const tone = detHash(i * 5.1) > 0.5 ? "rgba(255,250,242,0.07)" : "rgba(75,68,60,0.06)";
    cg.fillStyle = tone; cg.fillRect(x, y, w, 1.2);
    bg.fillStyle = detHash(i * 6.3) > 0.5 ? "rgba(220,220,220,0.08)" : "rgba(40,40,40,0.08)"; bg.fillRect(x, y, w, 1);
    rg.fillStyle = detHash(i * 7.7) > 0.5 ? "rgba(200,200,200,0.09)" : "rgba(90,90,90,0.09)"; rg.fillRect(x, y, w, 1.5);
  }
  // Subtle heat/weathering darkening near the upper rim and bottom chine
  const rimGrad = cg.createLinearGradient(0, 0, 0, size);
  rimGrad.addColorStop(0, "rgba(78,70,62,0.14)");
  rimGrad.addColorStop(0.16, "rgba(0,0,0,0)");
  rimGrad.addColorStop(0.84, "rgba(0,0,0,0)");
  rimGrad.addColorStop(1, "rgba(68,62,54,0.18)");
  cg.fillStyle = rimGrad; cg.fillRect(0, 0, size, size);

  const map = new THREE.CanvasTexture(colC); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping;
  const roughness = new THREE.CanvasTexture(rghC); roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
  const bump = new THREE.CanvasTexture(bmpC); bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  return { map, roughness, bump };
}

/** Coarse beach sand transitioning into pale wood-ash and dark soot around the fire zone. */
function sandAshTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const size = 512;
  const colC = document.createElement("canvas"); colC.width = colC.height = size;
  const bmpC = document.createElement("canvas"); bmpC.width = bmpC.height = size;
  const cg = colC.getContext("2d")!, bg = bmpC.getContext("2d")!;

  cg.fillStyle = "#b0a492"; cg.fillRect(0, 0, size, size);
  bg.fillStyle = "#808080"; bg.fillRect(0, 0, size, size);

  // Broad sand scoops and moisture variation
  for (let i = 0; i < 420; i++) {
    const x = detHash(i * 3.1) * size, y = detHash(i * 7.3) * size, r = 10 + detHash(i * 11.7) * 28;
    const dark = detHash(i * 13.9) > 0.45;
    cg.fillStyle = dark ? "rgba(128,116,101,0.10)" : "rgba(208,198,182,0.10)";
    cg.beginPath(); cg.ellipse(x, y, r, r * 0.65, detHash(i * 2.1) * Math.PI, 0, Math.PI * 2); cg.fill();
    bg.fillStyle = dark ? "rgba(50,50,50,0.09)" : "rgba(210,210,210,0.09)";
    bg.beginPath(); bg.ellipse(x, y, r, r * 0.65, detHash(i * 2.1) * Math.PI, 0, Math.PI * 2); bg.fill();
  }

  // Pale powdery wood-ash ring centered on BOAT_FIRE_X (~0.62 along u)
  const fx = ((BOAT_FIRE_X + BOAT_LENGTH / 2 + 0.1) / (BOAT_LENGTH + 0.2)) * size;
  const fy = 0.5 * size;
  const ashHalo = cg.createRadialGradient(fx, fy, 12, fx, fy, 130);
  ashHalo.addColorStop(0, "rgba(232,229,224,0.92)");
  ashHalo.addColorStop(0.45, "rgba(214,209,202,0.78)");
  ashHalo.addColorStop(0.75, "rgba(186,178,168,0.38)");
  ashHalo.addColorStop(1, "rgba(176,164,146,0)");
  cg.fillStyle = ashHalo; cg.beginPath(); cg.arc(fx, fy, 135, 0, Math.PI * 2); cg.fill();

  // Dark soot & charcoal core directly under the logs
  const soot = cg.createRadialGradient(fx, fy, 4, fx, fy, 64);
  soot.addColorStop(0, "rgba(38,34,31,0.92)");
  soot.addColorStop(0.5, "rgba(68,62,56,0.58)");
  soot.addColorStop(1, "rgba(195,190,184,0)");
  cg.fillStyle = soot; cg.beginPath(); cg.arc(fx, fy, 68, 0, Math.PI * 2); cg.fill();

  // Coarse sand grains, ash clumps & scattered charcoal bits
  for (let i = 0; i < 16000; i++) {
    const x = detHash(i * 1.9 + 11) * size, y = detHash(i * 4.3 + 29) * size;
    const dFire = Math.hypot(x - fx, y - fy);
    const sz = 1 + detHash(i * 9.7) * 1.8;
    const pick = detHash(i * 17.3);
    if (dFire < 110 && pick < 0.22) {
      cg.fillStyle = pick < 0.09 ? "rgba(32,28,25,0.72)" : "rgba(244,242,238,0.68)";
    } else {
      cg.fillStyle = pick < 0.45 ? "rgba(92,82,70,0.34)" : pick < 0.85 ? "rgba(222,213,198,0.34)" : "rgba(58,52,46,0.32)";
    }
    cg.fillRect(x, y, sz, sz);
    bg.fillStyle = pick < 0.5 ? "rgba(30,30,30,0.45)" : "rgba(235,235,235,0.45)";
    bg.fillRect(x, y, sz, sz);
  }

  const map = new THREE.CanvasTexture(colC); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const bump = new THREE.CanvasTexture(bmpC); bump.anisotropy = 8;
  return { map, bump };
}

/** Rough charred bark + pale white-ash crust texture for split firewood logs. */
function charredLogTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const size = 256;
  const colC = document.createElement("canvas"); colC.width = colC.height = size;
  const bmpC = document.createElement("canvas"); bmpC.width = bmpC.height = size;
  const cg = colC.getContext("2d")!, bg = bmpC.getContext("2d")!;

  cg.fillStyle = "#3b2e26"; cg.fillRect(0, 0, size, size);
  bg.fillStyle = "#808080"; bg.fillRect(0, 0, size, size);

  for (let i = 0; i < 650; i++) {
    const x = detHash(i * 2.3) * size, y = detHash(i * 5.9) * size;
    const len = 18 + detHash(i * 8.1) * 58, th = 1.5 + detHash(i * 4.7) * 4;
    const p = detHash(i * 11.3);
    cg.fillStyle = p < 0.35 ? "rgba(22,19,17,0.75)" : p < 0.65 ? "rgba(104,80,62,0.55)" : "rgba(205,199,190,0.62)";
    cg.fillRect(x, y, len, th);
    bg.fillStyle = p < 0.45 ? "rgba(25,25,25,0.65)" : "rgba(230,230,230,0.55)";
    bg.fillRect(x, y, len, th);
  }
  const map = new THREE.CanvasTexture(colC); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping;
  const bump = new THREE.CanvasTexture(bmpC); bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  return { map, bump };
}

/** Irregular split firewood geometry with rough bark displacement. */
function roughLogGeometry(length: number, r0: number, r1: number, sides: number, seed: number): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(r0, r1, length, sides, 5);
  geo.rotateZ(Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const r = Math.hypot(y, z);
    if (r > 0.002) {
      const ang = Math.atan2(z, y);
      const jitter = 0.84 + 0.32 * detHash(seed * 31 + Math.round(x * 20) * 7 + Math.round(ang * 5));
      pos.setY(i, y * jitter);
      pos.setZ(i, z * jitter);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/** Irregular charred, ash-crusted firewood mound and glowing coals in the forward half of the boat. */
function addCharredLogs(parent: THREE.Group): void {
  const logTex = charredLogTexture();
  const baseMat = (tint: string) => new THREE.MeshStandardMaterial({
    color: tint,
    map: logTex.map,
    bumpMap: logTex.bump,
    bumpScale: 0.012,
    roughness: 0.94,
  });
  const mats = ["#d8d2ca", "#a89888", "#746256"].map(baseMat);

  const pieces: { h: number; r0: number; r1: number; x: number; y: number; z: number; rot: [number, number, number]; mat: number; sides: number }[] = [
    { h: 0.56, r0: 0.068, r1: 0.052, x: BOAT_FIRE_X - 0.02, y: 0.54, z: 0.03, rot: [0.16, 0.32, 0.08], mat: 0, sides: 8 },
    { h: 0.48, r0: 0.062, r1: 0.048, x: BOAT_FIRE_X + 0.07, y: 0.55, z: -0.07, rot: [0.22, 1.28, -0.16], mat: 1, sides: 7 },
    { h: 0.52, r0: 0.056, r1: 0.040, x: BOAT_FIRE_X - 0.12, y: 0.53, z: 0.09, rot: [-0.18, 1.88, 0.24], mat: 2, sides: 7 },
    { h: 0.42, r0: 0.060, r1: 0.042, x: BOAT_FIRE_X + 0.16, y: 0.52, z: 0.06, rot: [0.34, 0.68, -0.22], mat: 0, sides: 6 },
    { h: 0.44, r0: 0.048, r1: 0.036, x: BOAT_FIRE_X - 0.16, y: 0.54, z: -0.06, rot: [-0.28, 2.35, 0.16], mat: 1, sides: 7 },
    { h: 0.38, r0: 0.054, r1: 0.034, x: BOAT_FIRE_X + 0.02, y: 0.61, z: -0.02, rot: [0.72, 0.45, 0.64], mat: 0, sides: 7 },
    { h: 0.35, r0: 0.046, r1: 0.036, x: BOAT_FIRE_X + 0.11, y: 0.62, z: 0.04, rot: [-0.66, 1.72, 0.82], mat: 1, sides: 6 },
    { h: 0.38, r0: 0.040, r1: 0.028, x: BOAT_FIRE_X - 0.08, y: 0.61, z: 0.05, rot: [0.92, 2.42, -0.45], mat: 2, sides: 7 },
    { h: 0.28, r0: 0.042, r1: 0.026, x: BOAT_FIRE_X + 0.03, y: 0.69, z: 0.01, rot: [0.48, 0.95, 1.05], mat: 0, sides: 6 },
    { h: 0.26, r0: 0.036, r1: 0.026, x: BOAT_FIRE_X - 0.04, y: 0.70, z: -0.04, rot: [-1.02, 0.38, 0.52], mat: 1, sides: 6 },
  ];
  pieces.forEach((piece, idx) => {
    const log = new THREE.Mesh(roughLogGeometry(piece.h, piece.r0, piece.r1, piece.sides, idx + 1), mats[piece.mat]);
    log.position.set(piece.x, piece.y, piece.z);
    log.rotation.set(...piece.rot);
    log.castShadow = log.receiveShadow = true;
    parent.add(log);
  });

  // Glowing ember coals & charcoal chunks nestled at the base of the log mound
  const emberMat = new THREE.MeshStandardMaterial({ color: "#3b1b12", emissive: "#ff4808", emissiveIntensity: 0.95, roughness: 0.9 });
  const charMat = new THREE.MeshStandardMaterial({ color: "#24201e", roughness: 0.98 });
  const coalGeo = new THREE.DodecahedronGeometry(0.032, 0);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + detHash(i * 3.7) * 0.4;
    const rad = i < 4 ? 0.06 + detHash(i * 5.3) * 0.06 : 0.14 + detHash(i * 9.1) * 0.12;
    const lump = new THREE.Mesh(coalGeo, i < 4 ? emberMat : charMat);
    lump.position.set(BOAT_FIRE_X + Math.cos(a) * rad, 0.525 + detHash(i * 2.9) * 0.025, Math.sin(a) * rad);
    lump.scale.set(0.8 + detHash(i * 4.1) * 0.8, 0.55 + detHash(i * 6.7) * 0.4, 0.8 + detHash(i * 8.3) * 0.7);
    lump.rotation.set(detHash(i * 1.1) * 3, detHash(i * 2.2) * 3, 0);
    lump.castShadow = true;
    parent.add(lump);
  }
}

/** Low flickering flames tucked between the logs, and delicate pale sunlit smoke. Left out of the static batch. */
function addBoatFire(parent: THREE.Group): void {
  const fire = new THREE.Group(); fire.name = "barraka-barbecue-fire"; fire.userData.dynamic = true; fire.position.set(BOAT_FIRE_X, 0.62, 0); parent.add(fire);
  const flameMap = flameBlob(), smokeMap = smokePuff();
  const tongues = [
    { x: -0.01, y: 0.03, z: 0.01, w: 0.13, h: 0.20, rate: 10.4, phase: 0.2 },
    { x: -0.08, y: -0.02, z: 0.05, w: 0.10, h: 0.15, rate: 13.2, phase: 1.4 },
    { x: 0.09, y: -0.03, z: -0.04, w: 0.10, h: 0.16, rate: 8.3, phase: 2.2 },
    { x: 0.03, y: 0.08, z: -0.02, w: 0.09, h: 0.17, rate: 11.6, phase: 0.8 },
  ].map(spec => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameMap, transparent: true, depthWrite: false, opacity: 0.78, color: "#ffd8b0" }));
    sprite.center.set(0.5, 0.18); sprite.position.set(spec.x, spec.y, spec.z); sprite.scale.set(spec.w, spec.h, 1); fire.add(sprite);
    return { ...spec, sprite };
  });
  const puffs = Array.from({ length: 8 }, (_, i) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeMap, transparent: true, depthWrite: false, opacity: 0.34, color: "#e8eef4" }));
    sprite.center.set(0.5, 0.18); fire.add(sprite);
    return { sprite, seed: i * 0.37 + 0.12 };
  });
  // A Group callback never runs; this sprite is drawn, so the flicker does.
  tongues[0].sprite.onBeforeRender = () => {
    const t = performance.now() * 0.001;
    for (const flame of tongues) {
      const flick = Math.sin(t * flame.rate + flame.phase), flick2 = Math.sin(t * flame.rate * 1.73 + flame.phase * 2.1);
      flame.sprite.scale.set(flame.w * (0.88 + flick2 * 0.12), flame.h * (0.76 + flick * 0.22 + flick2 * 0.06), 1);
      flame.sprite.position.set(flame.x + Math.sin(t * 2.7 + flame.phase) * 0.008, flame.y + Math.max(0, flick) * 0.012, flame.z + Math.cos(t * 2.2 + flame.phase) * 0.008);
      (flame.sprite.material as THREE.SpriteMaterial).opacity = 0.5 + Math.abs(flick) * 0.35;
    }
    for (const puff of puffs) {
      const life = 3.2, u = ((t * 0.31 + puff.seed) % life) / life, rise = u * u;
      puff.sprite.position.set(
        Math.sin(puff.seed * 5.2 + t * 0.55) * 0.11 * (0.3 + u) - rise * 0.18,
        0.06 + rise * 1.35,
        Math.cos(puff.seed * 3.7 + t * 0.42) * 0.09 * (0.3 + u) + rise * 0.12,
      );
      const width = 0.24 + rise * 0.9;
      puff.sprite.scale.set(width, width * 1.15, 1);
      (puff.sprite.material as THREE.SpriteMaterial).opacity = Math.sin(u * Math.PI) * 0.42;
    }
  };
}

/** Soft orange-amber ember/flame blobs. */
function flameBlob(): THREE.CanvasTexture {
  const size = 64, canvas = document.createElement("canvas"); canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  const blob = (x: number, y: number, r: number, inner: string, mid: string) => {
    const shade = g.createRadialGradient(x, y, 1, x, y, r);
    shade.addColorStop(0, inner); shade.addColorStop(0.5, mid); shade.addColorStop(1, "rgba(255,90,10,0)");
    g.fillStyle = shade; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  };
  blob(32, 44, 20, "rgba(255,244,210,1)", "rgba(255,155,32,0.85)");
  blob(23, 36, 13, "rgba(255,210,72,0.9)", "rgba(255,98,14,0.5)");
  blob(41, 34, 12, "rgba(255,186,44,0.9)", "rgba(255,84,12,0.45)");
  blob(32, 24, 9, "rgba(255,248,224,0.95)", "rgba(255,144,36,0.4)");
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Delicate pale blue-grey sunlit smoke puff matching IMG_2223. */
function smokePuff(): THREE.CanvasTexture {
  const size = 64, canvas = document.createElement("canvas"); canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!, shade = g.createRadialGradient(32, 34, 2, 32, 30, 30);
  shade.addColorStop(0, "rgba(222,230,238,0.68)");
  shade.addColorStop(0.45, "rgba(216,224,232,0.32)");
  shade.addColorStop(1, "rgba(210,218,226,0)");
  g.fillStyle = shade; g.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
