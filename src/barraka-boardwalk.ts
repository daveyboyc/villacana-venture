import * as THREE from "three";
import { looseShrub } from "./clipped-plants";
import data from "../data/barraka_boardwalk.json";
import { routeClearance, type ProtectedRoute } from "./route-clearance";
import type { Vec2 } from "./types";

/** Shared map/3D access; protects the whole walk from optional furniture. */
export const barrakaAccess: ProtectedRoute = { id: data.boardwalk.id, name: data.boardwalk.name, points: data.boardwalk.points as Vec2[], width: data.boardwalk.width };
/** Hull of the sand-filled barbecue boat, shared by the map, the model and collision. */
export const barrakaBarbecueBoat = data.boat.ring as Vec2[];

/** Curved flat-stern skiff outline in map metres for the 2D blueprint map, aligned to barrakaBarbecueBoat. */
export function barrakaBoatMapRing(ring: Vec2[] = barrakaBarbecueBoat): Vec2[] {
  const [cx, cz] = data.boat.centre as Vec2;
  const sternX = (ring[0][0] + ring[1][0]) / 2, sternZ = (ring[0][1] + ring[1][1]) / 2;
  const yaw = Math.atan2(-(ring[2][1] - sternZ), ring[2][0] - sternX);
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  const toWorld = (lx: number, lz: number): Vec2 => [
    Math.round((cx + lx * cos + lz * sin) * 100) / 100,
    Math.round((cz - lx * sin + lz * cos) * 100) / 100,
  ];
  const pts: Vec2[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, s = hullStation(t);
    pts.push(toWorld(s.xg, s.zg));
  }
  pts.push(toWorld(BOAT_LENGTH / 2 + 0.08, 0));
  for (let i = 12; i >= 0; i--) {
    const t = i / 12, s = hullStation(t);
    pts.push(toWorld(s.xg, -s.zg));
  }
  return pts;
}
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
  const [bx, bz] = data.boat.centre as Vec2;
  const routes = [...(scene.userData.protectedRoutes as ProtectedRoute[] ?? []), barrakaAccess];
  const clear = (x: number, z: number, radius: number) => routeClearance(routes, x, z, radius);
  // The sand-filled barbecue boat is a solid collision hull on the map, so show the hull in Layout too;
  // keep the animated fire/smoke on Show details only.
  if (clear(bx, bz, 1.70)) addBarbecueBoat(group, groundY, bx, bz, !scene.userData.layoutOnly);
  if (scene.userData.layoutOnly) return;
  const details = new THREE.Group(); details.name = "barraka-details"; group.add(details);
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
}

/** Open weathered clinker espeto boat settled in a beach-sand berm: barrel-curved lapstrake hull, contrasted gunwale & rub-rail, internal ribs, stemhead post & ring, sculpted sand/ash crater, glowing coal bed, firewood and wispy smoke. */
function addBarbecueBoat(parent: THREE.Group, groundY: (x: number, z: number) => number, bx: number, bz: number, showFire = true): void {
  const baseY = groundY(bx, bz) - 0.03; // match visible seaside sand mesh (seaside.y - 0.03)
  const boat = new THREE.Group(); boat.name = "barraka-barbecue-boat"; boat.position.set(bx, baseY, bz); parent.add(boat);
  const ring = barrakaBarbecueBoat, sternX = (ring[0][0] + ring[1][0]) / 2, sternZ = (ring[0][1] + ring[1][1]) / 2;
  const yaw = Math.atan2(-(ring[2][1] - sternZ), ring[2][0] - sternX);
  const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
  const localBeachY = (lx: number, lz: number) => (groundY(bx + lx * cosY + lz * sinY, bz - lx * sinY + lz * cosY) - 0.03) - baseY;

  const oriented = new THREE.Group();
  oriented.rotation.y = yaw;
  boat.add(oriented);

  const body = new THREE.Group();
  // Settle the hull gently along the natural seaward slope of the beach
  const slopePitch = Math.atan2(localBeachY(1.2, 0) - localBeachY(-1.2, 0), 2.4) * 0.7;
  body.rotation.z = slopePitch;
  oriented.add(body);

  const hullTex = weatheredHullTexture();
  const hullMat = new THREE.MeshStandardMaterial({
    color: "#f2ece0",
    vertexColors: true,
    map: hullTex.map,
    roughnessMap: hullTex.roughness,
    normalMap: hullTex.normal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughness: 0.54,
    metalness: 0.08,
  });
  const innerMat = new THREE.MeshStandardMaterial({
    color: "#4a423a",
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.08,
  });
  const rimTex = gunwalePipeTexture();
  const rimMat = new THREE.MeshStandardMaterial({
    color: "#8c8275",
    vertexColors: true,
    map: rimTex.map,
    normalMap: rimTex.normal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughness: 0.38,
    metalness: 0.32,
  });
  const standMat = new THREE.MeshStandardMaterial({
    color: "#5c5146",
    roughness: 0.88,
    metalness: 0.12,
  });
  const weldMat = new THREE.MeshStandardMaterial({
    color: "#7e7468",
    roughness: 0.58,
    metalness: 0.28,
  });

  const { outerGeo, innerGeo } = boatHullGeometries();
  const shell = new THREE.Mesh(outerGeo, hullMat);
  shell.castShadow = shell.receiveShadow = true;
  shell.name = "barraka-barbecue-hull";
  body.add(shell);

  const innerWall = new THREE.Mesh(innerGeo, innerMat);
  innerWall.castShadow = innerWall.receiveShadow = true;
  body.add(innerWall);

  const gunwale = new THREE.Mesh(boatGunwaleGeometry(), rimMat);
  gunwale.castShadow = gunwale.receiveShadow = true;
  gunwale.name = "barraka-barbecue-gunwale";
  body.add(gunwale);

  addHullFittings(body, weldMat);
  addBoatPedestalAndSandMound(oriented, standMat, localBeachY, slopePitch);

  const sandTex = sandAshTexture();
  const sandMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: sandTex.map,
    normalMap: sandTex.normal,
    normalScale: new THREE.Vector2(1.45, 1.45),
    emissive: showFire ? new THREE.Color("#ff540e") : new THREE.Color("#000000"),
    emissiveMap: sandTex.emissive,
    emissiveIntensity: showFire ? 1.55 : 0.0,
    roughness: 0.95,
    metalness: 0.0,
  });
  const ash = new THREE.Mesh(sandBedGeometry(), sandMat);
  ash.receiveShadow = true;
  ash.name = "barraka-barbecue-ash";
  body.add(ash);

  addCharredLogs(body, showFire);
  if (showFire) addBoatFire(body);
}

/** Proportions matched to IMG_2223, IMG_2346, IMG_2347, IMG_2616 and IMG_2619: full-bellied coastal espeto boat on a pedestal cradle. */
const BOAT_LENGTH = 2.76;
const BOAT_BEAM = 1.38;
const BOAT_STATIONS = 44;
const BOAT_FIRE_X = 0.28;
const BOAT_BED_DROP = 0.105;

function boatHalfBeam(t: number): number {
  const half = BOAT_BEAM / 2, mid = 0.46;
  if (t <= mid) {
    const s = t / mid;
    // Continuous barrel curve from narrower transom (0.68 * half) out to full midships belly
    return half * (0.68 + 0.32 * Math.sin(s * Math.PI / 2));
  }
  const u = (t - mid) / (1 - mid);
  // Smooth circular/ogive boat bow curve with zero straight segments
  return half * (0.11 + 0.89 * Math.cos(u * Math.PI * 0.5));
}

function boatSheer(t: number): number {
  const aftLift = 0.028 * Math.pow(Math.max(0, 1 - t / 0.40), 2);
  const bowLift = 0.095 * Math.pow(Math.max(0, (t - 0.34) / 0.66), 1.85);
  return 0.49 + aftLift + bowLift;
}

type HullStation = {
  xg: number; yg: number; zg: number;
  xc: number; yc: number; zc: number;
  xk: number; yk: number;
};

function hullStation(t: number): HullStation {
  const zg = boatHalfBeam(t);
  const yg = boatSheer(t);
  const xg = -BOAT_LENGTH / 2 - 0.035 + t * (BOAT_LENGTH + 0.075);
  const xc = -BOAT_LENGTH / 2 + 0.045 + t * (BOAT_LENGTH - 0.095);
  const xk = -BOAT_LENGTH / 2 + 0.055 + t * (BOAT_LENGTH - 0.125);
  const forefoot = Math.pow(Math.max(0, (t - 0.58) / 0.42), 1.8);
  const yk = 0.065 + 0.095 * forefoot;
  const yc = yk + 0.055 * (1 - 0.45 * t);
  const zc = zg * (0.58 + 0.06 * t);
  return { xg, yg, zg, xc, yc, zc, xk, yk };
}

/** Smooth C2-continuous closed gunwale spline around the entire boat (CCW viewed from +Y: transom -> starboard -> bow -> port -> transom). */
function smoothGunwaleLoop(samples = 96): THREE.Vector3[] {
  const ctrl: THREE.Vector3[] = [];
  const s0 = hullStation(0), sb = hullStation(1);
  const cornerR = 0.045;

  // Starboard half of flat transom & tight rounded starboard stern quarter
  ctrl.push(new THREE.Vector3(s0.xg, s0.yg, 0.22));
  ctrl.push(new THREE.Vector3(s0.xg, s0.yg, s0.zg - cornerR));
  ctrl.push(new THREE.Vector3(s0.xg + cornerR * 0.5, s0.yg, s0.zg - cornerR * 0.15));

  // Starboard curved side (stern -> bow)
  for (let k = 1; k <= 11; k++) {
    const t = 0.05 + (k / 12) * 0.90;
    const st = hullStation(t);
    ctrl.push(new THREE.Vector3(st.xg, st.yg, st.zg));
  }

  // Smooth rounded bow stem arc
  ctrl.push(new THREE.Vector3(sb.xg + 0.045, sb.yg + 0.004, sb.zg * 0.52));
  ctrl.push(new THREE.Vector3(sb.xg + 0.072, sb.yg + 0.008, 0));
  ctrl.push(new THREE.Vector3(sb.xg + 0.045, sb.yg + 0.004, -sb.zg * 0.52));

  // Port curved side (bow -> stern)
  for (let k = 11; k >= 1; k--) {
    const t = 0.05 + (k / 12) * 0.90;
    const st = hullStation(t);
    ctrl.push(new THREE.Vector3(st.xg, st.yg, -st.zg));
  }

  // Tight rounded port stern quarter & port half of flat transom
  ctrl.push(new THREE.Vector3(s0.xg + cornerR * 0.5, s0.yg, -(s0.zg - cornerR * 0.15)));
  ctrl.push(new THREE.Vector3(s0.xg, s0.yg, -(s0.zg - cornerR)));
  ctrl.push(new THREE.Vector3(s0.xg, s0.yg, -0.22));

  const curve = new THREE.CatmullRomCurve3(ctrl, true, "centripetal", 0.5);
  return curve.getSpacedPoints(samples);
}

/** Single unified C2-smooth shared-vertex curved-bilge hull & inner cavity (zero flat facets, natural bilge roll & vertical sunlit topsides). */
function boatHullGeometries(): { outerGeo: THREE.BufferGeometry; innerGeo: THREE.BufferGeometry } {
  const N = 96, RINGS = 12, IRINGS = 4;
  const loop = smoothGunwaleLoop(N); // length N + 1 (loop[N] == loop[0])

  const pos: number[] = [], uvs: number[] = [], col: number[] = [], idx: number[] = [];
  for (let i = 0; i <= N; i++) {
    const g = i === N ? loop[0] : loop[i];
    const tLong = Math.min(1, Math.max(0, (g.x + BOAT_LENGTH / 2) / BOAT_LENGTH));
    const forefoot = Math.pow(Math.max(0, (tLong - 0.58) / 0.42), 1.8);
    const keelY = 0.065 + 0.095 * forefoot;
    const keelX = Math.min(BOAT_LENGTH * 0.44, Math.max(-BOAT_LENGTH * 0.45, g.x * 0.88));
    const u = (i / N) * 2.0;

    for (let j = 0; j <= RINGS; j++) {
      const v = j / RINGS;
      const theta = v * Math.PI * 0.5;
      // Quarter-ellipse bilge: horizontal tangent at keel (j=0) curving smoothly to vertical topsides at gunwale (j=RINGS)
      const radFrac = Math.sin(theta);
      const yFrac = 1 - Math.cos(theta);
      const x = keelX + (g.x - keelX) * Math.pow(radFrac, 0.85);
      const z = g.z * radFrac;
      const y = keelY + (g.y - keelY) * yFrac;
      pos.push(x, y, z);
      uvs.push(u, 0.06 + v * 0.88);

      const shade = 0.88 + 0.12 * yFrac - (v > 0.90 ? (v - 0.90) * 1.4 : 0);
      col.push(shade, shade * 0.99, shade * 0.98);
    }
  }
  const stride = RINGS + 1;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < RINGS; j++) {
      const a = i * stride + j, b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1), d = i * stride + (j + 1);
      // CCW loop from +Y with j rising upward -> outward normal is e_i x e_j = (b - a) x (d - a)
      idx.push(a, b, c, a, c, d);
    }
  }
  const outerGeo = new THREE.BufferGeometry();
  outerGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  outerGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  outerGeo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  outerGeo.setIndex(idx);
  outerGeo.computeVertexNormals();
  outerGeo.computeBoundingSphere();

  // Shared-vertex inner hull cavity dropping 0.20 m from gunwale into the recessed sand trough
  const ipos: number[] = [], iuvs: number[] = [], icol: number[] = [], iidx: number[] = [];
  for (let i = 0; i <= N; i++) {
    const g = i === N ? loop[0] : loop[i];
    const prev = loop[(i - 1 + N) % N], next = loop[(i + 1) % N];
    const tx = next.x - prev.x, tz = next.z - prev.z, tl = Math.hypot(tx, tz) || 1;
    // Inward horizontal unit normal for CCW loop: (-tz, +tx) / tl -> wait: for starboard (+X tangent), inward is -Z: (-0, -1)? Let's check: tx=+1, tz=0 -> (tz, -tx) = (0, -1)!
    const inX = tz / tl, inZ = -tx / tl;
    const u = (i / N) * 2.0;
    for (let j = 0; j <= IRINGS; j++) {
      const d01 = j / IRINGS;
      const inset = 0.018 + d01 * 0.065;
      ipos.push(g.x + inX * inset, g.y - d01 * 0.20, g.z + inZ * inset);
      iuvs.push(u, 0.95 - d01 * 0.30);
      const s = 0.88 - 0.56 * d01;
      icol.push(s, s * 0.96, s * 0.92);
    }
  }
  const istride = IRINGS + 1;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < IRINGS; j++) {
      const a = i * istride + j, b = (i + 1) * istride + j;
      const c = (i + 1) * istride + (j + 1), d = i * istride + (j + 1);
      // Downward j (-Y) with +X e_i -> (+1,0,0) x (0,-1,0) = (0,0,-1) = inward!
      iidx.push(a, b, c, a, c, d);
    }
  }
  const innerGeo = new THREE.BufferGeometry();
  innerGeo.setAttribute("position", new THREE.Float32BufferAttribute(ipos, 3));
  innerGeo.setAttribute("uv", new THREE.Float32BufferAttribute(iuvs, 2));
  innerGeo.setAttribute("color", new THREE.Float32BufferAttribute(icol, 3));
  innerGeo.setIndex(iidx);
  innerGeo.computeVertexNormals();
  innerGeo.computeBoundingSphere();

  return { outerGeo, innerGeo };
}

/** Closed C2-smooth tubular gunwale swept directly along smoothGunwaleLoop. */
function boatGunwaleGeometry(): THREE.BufferGeometry {
  const loop = smoothGunwaleLoop(96);
  const m = loop.length - 1, segs = 14, pipeR = 0.033;
  const pos: number[] = [], nrm: number[] = [], uvs: number[] = [], col: number[] = [], idx: number[] = [];
  let arc = 0;
  const arcs: number[] = [0];
  for (let i = 1; i <= m; i++) {
    arc += loop[i].distanceTo(loop[i - 1]);
    arcs.push(arc);
  }
  const totalArc = arc || 1;

  for (let i = 0; i <= m; i++) {
    const curr = i === m ? loop[0] : loop[i];
    const prev = loop[(i - 1 + m) % m], next = loop[(i + 1) % m];
    const tx = next.x - prev.x, ty = next.y - prev.y, tz = next.z - prev.z;
    const tlen = Math.hypot(tx, ty, tz) || 1;
    // Outward horizontal normal for CCW loop: (-tz, +tx) -> wait: at starboard (tx=+1, tz=0), outward is +Z: (-tz, +tx) = (0, +1)!
    const rx0 = -tz / tlen, rz0 = tx / tlen;
    const rlen = Math.hypot(rx0, rz0) || 1;
    const rx = rx0 / rlen, rz = rz0 / rlen;
    const bx = (ty / tlen) * rz;
    const by = (tz / tlen) * rx - (tx / tlen) * rz;
    const bz = -(ty / tlen) * rx;
    // Note: for tx=+1, tz=0, rx=0, rz=+1 -> by = 0 - (+1)*(+1) = -1, so flip b to point +Y!
    const upSign = by < 0 ? -1 : 1;
    const ubx = bx * upSign, uby = by * upSign, ubz = bz * upSign;
    const u = (arcs[i] / totalArc) * 8;
    for (let j = 0; j <= segs; j++) {
      const phi = (j / segs) * Math.PI * 2;
      const c = Math.cos(phi), s = Math.sin(phi);
      const nx = c * rx + s * ubx, ny = s * uby, nz = c * rz + s * ubz;
      pos.push(curr.x - rx * 0.008 + nx * pipeR, curr.y + 0.008 + ny * pipeR, curr.z - rz * 0.008 + nz * pipeR);
      nrm.push(nx, ny, nz);
      uvs.push(u, j / segs);
      const ao = 0.52 + 0.48 * (0.5 + 0.5 * ny);
      col.push(ao, ao * 0.99, ao * 0.98);
    }
  }
  const stride = segs + 1;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * stride + j, b = (i + 1) * stride + j, c = (i + 1) * stride + j + 1, d = i * stride + j + 1;
      // e_i = +X, e_j at phi=0 (+Z) goes toward phi=pi/2 (+Y): (+1,0,0) x (0,+1,0) = (0,0,+1) = outward!
      idx.push(a, b, c, a, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

/** Clean welded sheet-metal boat fittings (IMG_2223, IMG_2346, IMG_2347): bow breast-hook plate, stern corner gussets, internal ribs, and vertical transom weld seams. */
function addHullFittings(parent: THREE.Group, weldMat: THREE.Material): void {
  const s0 = hullStation(0), sb = hullStation(1);

  const hookShape = new THREE.Shape([
    new THREE.Vector2(sb.xg + 0.042, 0),
    new THREE.Vector2(sb.xg - 0.18, -(boatHalfBeam(0.92) - 0.02)),
    new THREE.Vector2(sb.xg - 0.18, boatHalfBeam(0.92) - 0.02),
  ]);
  const hookGeo = new THREE.ExtrudeGeometry(hookShape, { depth: 0.014, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 });
  hookGeo.rotateX(-Math.PI / 2);
  const hook = new THREE.Mesh(hookGeo, weldMat);
  hook.position.y = sb.yg - 0.006;
  hook.castShadow = hook.receiveShadow = true;
  parent.add(hook);

  for (const side of [-1, 1] as const) {
    const gShape = new THREE.Shape([
      new THREE.Vector2(s0.xg + 0.012, side * (s0.zg - 0.018)),
      new THREE.Vector2(s0.xg + 0.18, side * (s0.zg - 0.018)),
      new THREE.Vector2(s0.xg + 0.012, side * (s0.zg - 0.18)),
    ]);
    const gGeo = new THREE.ExtrudeGeometry(gShape, { depth: 0.012, bevelEnabled: false });
    gGeo.rotateX(-Math.PI / 2);
    const gusset = new THREE.Mesh(gGeo, weldMat);
    gusset.position.y = s0.yg - 0.004;
    gusset.castShadow = gusset.receiveShadow = true;
    parent.add(gusset);

    const seamLen = Math.hypot(s0.xg - s0.xc, s0.yg - s0.yc, s0.zg - s0.zc);
    const seam = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, seamLen, 6), weldMat);
    seam.position.set((s0.xg + s0.xc) / 2, (s0.yg + s0.yc) / 2, side * (s0.zg + s0.zc) / 2);
    const dx = s0.xg - s0.xc, dy = s0.yg - s0.yc, dz = side * (s0.zg - s0.zc);
    seam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
    parent.add(seam);
  }

  // 5 pairs of exposed internal iron hull ribs rising from the recessed sand bed up to the gunwale
  for (const t of [0.18, 0.34, 0.50, 0.66, 0.82]) {
    const st = hullStation(t);
    for (const side of [-1, 1] as const) {
      const topZ = side * (st.zg - 0.024), botZ = side * (st.zg - 0.072);
      const topY = st.yg - 0.012, botY = st.yg - BOAT_BED_DROP - 0.035;
      const ribLen = Math.hypot(topY - botY, topZ - botZ);
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.028, ribLen, 0.022), weldMat);
      rib.position.set(st.xg, (topY + botY) / 2, (topZ + botZ) / 2);
      rib.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, topY - botY, topZ - botZ).normalize(),
      );
      rib.castShadow = rib.receiveShadow = true;
      parent.add(rib);
    }
  }
}

/** Opaque terrain-following #e1c99c beach-sand collar banking gently up against the buried hull sides (zero floating gap, no detached blob shadow). */
function addBoatPedestalAndSandMound(
  parent: THREE.Group,
  standMat: THREE.Material,
  localBeachY: (lx: number, lz: number) => number,
  slopePitch: number,
): void {
  // Central-aft timber/steel support post & full-length keel sleeper resting in a drifted beach-sand mound (IMG_2346 / IMG_2616)
  const aftY = localBeachY(-0.55, 0);
  const mainPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.22), standMat);
  mainPost.position.set(-0.55, aftY + 0.05, 0);
  mainPost.rotation.z = slopePitch;
  mainPost.castShadow = mainPost.receiveShadow = true;
  parent.add(mainPost);

  const midY = localBeachY(0.15, 0);
  const keelCradle = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.11, 0.14), standMat);
  keelCradle.position.set(-0.05, midY + 0.045, 0);
  keelCradle.rotation.z = slopePitch;
  keelCradle.castShadow = keelCradle.receiveShadow = true;
  parent.add(keelCradle);

  // Drifted #e1c99c beach-sand berm rising around the keel cradle with crisp dark under-hull overhang shadow
  const bermGeo = new THREE.PlaneGeometry(BOAT_LENGTH + 0.90, BOAT_BEAM + 0.75, 40, 28);
  bermGeo.rotateX(-Math.PI / 2);
  const mp = bermGeo.attributes.position;
  const cols: number[] = [];
  const baseSand = new THREE.Color("#e1c99c");
  const contactAO = new THREE.Color("#5c4d35");
  const cTmp = new THREE.Color();

  for (let i = 0; i < mp.count; i++) {
    const x = mp.getX(i), z = mp.getZ(i);
    const ground = localBeachY(x, z);
    const tApprox = Math.min(1, Math.max(0, (x + BOAT_LENGTH / 2) / BOAT_LENGTH));
    const st = hullStation(tApprox);
    const insideHull = Math.abs(x) <= BOAT_LENGTH * 0.49 && Math.abs(z) <= st.zg * 0.88;
    const distFootprint = Math.abs(x) <= BOAT_LENGTH * 0.49
      ? Math.max(0, Math.abs(z) - st.zg * 0.85)
      : Math.hypot(Math.abs(x) - BOAT_LENGTH * 0.49, Math.max(0, Math.abs(z) - st.zg * 0.45));
    const nx = x / (BOAT_LENGTH * 0.56), nz = z / (BOAT_BEAM * 0.56);
    const r = Math.hypot(nx, nz);
    const env = Math.pow(Math.max(0, 1 - r), 1.25);

    // Sand berm rises right up to the keel cradle (y ≈ +0.075) along the centerline so no daylight leaks under the hull
    const spineBerm = Math.exp(-(((x + 0.02) / 1.15) ** 2 + (z / 0.34) ** 2)) * 0.082 * env;
    const ripple = Math.sin(x * 6.4 + z * 7.2) * 0.005 * env;
    const edgeTuck = r > 0.86 ? -0.010 * ((r - 0.86) / 0.14) : 0;
    mp.setY(i, ground + spineBerm + ripple + edgeTuck);

    const seamAO = insideHull ? 0.78 : Math.exp(-((distFootprint / 0.16) ** 2)) * 0.55 * env;
    cTmp.copy(baseSand).lerp(contactAO, seamAO);
    cols.push(cTmp.r, cTmp.g, cTmp.b);
  }
  bermGeo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  bermGeo.computeVertexNormals();
  const mound = new THREE.Mesh(
    bermGeo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0.0 }),
  );
  mound.receiveShadow = true;
  mound.name = "barraka-barbecue-sand-mound";
  parent.add(mound);
}

/** Volumetric heaped sand & ash mound rising +11 cm above a recessed perimeter trough, with vertex-baked crevice AO. */
function sandBedGeometry(): THREE.BufferGeometry {
  const cols = 18, rows = BOAT_STATIONS;
  const pos: number[] = [], uvs: number[] = [], col: number[] = [], idx: number[] = [];
  const stations = Array.from({ length: rows + 1 }, (_, i) => hullStation(i / rows));

  for (let i = 0; i <= rows; i++) {
    const s = stations[i], t = i / rows;
    const x = s.xg + (t < 0.08 ? 0.035 * (1 - t / 0.08) : 0) + (t > 0.94 ? 0.03 * ((t - 0.94) / 0.06) : 0);
    const cornerTuck = t < 0.07 ? 0.80 + 0.20 * (t / 0.07) : 1.0;
    const innerHalf = Math.max(0.01, (s.zg - 0.028) * cornerTuck);
    const endFade = Math.sin(Math.pow(t, 0.85) * Math.PI);
    for (let j = 0; j <= cols; j++) {
      const f = (j / cols) * 2 - 1;
      const z = f * innerHalf;
      const dome = Math.pow(Math.max(0, 1 - f * f), 0.72) * (0.25 + 0.75 * endFade);
      const distFire = Math.hypot(x - BOAT_FIRE_X, z * 1.15);
      const craterRim = Math.exp(-((distFire - 0.30) ** 2) / 0.045) * 0.062;
      const craterBowl = -Math.exp(-(distFire * distFire) / 0.045) * 0.025;
      const aftDune = Math.exp(-(((x + 0.56) / 0.48) ** 2 + (z / 0.40) ** 2)) * 0.048;
      const ripple = Math.sin(x * 8.2 + z * 5.6) * 0.015 + Math.cos(z * 12.2 - x * 4.7) * 0.011;
      // Perimeter sits 13 cm below gunwale, heaping up into a 3D volumetric mound in the middle
      const y = (s.yg - 0.13) + 0.088 * dome + (craterRim + craterBowl + aftDune) * (0.35 + 0.65 * dome) + ripple * (0.35 + 0.65 * dome);
      pos.push(x, y, z);
      uvs.push((x + BOAT_LENGTH / 2 + 0.1) / (BOAT_LENGTH + 0.2), (z + BOAT_BEAM / 2) / BOAT_BEAM);
      const ao = 0.36 + 0.64 * Math.min(1, dome * 1.15 + craterRim * 4);
      col.push(ao, ao * 0.98, ao * 0.95);
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
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function detHash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Convert a greyscale heightfield canvas into a true tangent-space RGB normalMap CanvasTexture. */
function heightToNormalTexture(heightCanvas: HTMLCanvasElement, strength = 2.6, repeat = false): THREE.CanvasTexture {
  const w = heightCanvas.width, h = heightCanvas.height;
  const src = heightCanvas.getContext("2d")!.getImageData(0, 0, w, h).data;
  const outC = document.createElement("canvas"); outC.width = w; outC.height = h;
  const og = outC.getContext("2d")!;
  const dst = og.createImageData(w, h);
  const sample = (x: number, y: number) => {
    const wx = ((x % w) + w) % w, wy = repeat ? ((y % h) + h) % h : Math.min(h - 1, Math.max(0, y));
    return src[(wy * w + wx) * 4] / 255;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (sample(x + 1, y - 1) + 2 * sample(x + 1, y) + sample(x + 1, y + 1)
                - sample(x - 1, y - 1) - 2 * sample(x - 1, y) - sample(x - 1, y + 1)) * strength;
      const dy = (sample(x - 1, y + 1) + 2 * sample(x, y + 1) + sample(x + 1, y + 1)
                - sample(x - 1, y - 1) - 2 * sample(x, y - 1) - sample(x + 1, y - 1)) * strength;
      const nx = -dx, ny = dy, nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;
      const idx = (y * w + x) * 4;
      dst.data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      dst.data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      dst.data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      dst.data[idx + 3] = 255;
    }
  }
  og.putImageData(dst, 0, 0);
  const tex = new THREE.CanvasTexture(outC);
  tex.anisotropy = 8;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Sun-bleached beige-grey painted galvanized hull texture with vertical rain/salt streaks, heat oxidation near the fire zone, scuffs and bottom sand grit. */
function weatheredHullTexture(): { map: THREE.CanvasTexture; roughness: THREE.CanvasTexture; normal: THREE.CanvasTexture } {
  const w = 1024, h = 512;
  const colC = document.createElement("canvas"); colC.width = w; colC.height = h;
  const rghC = document.createElement("canvas"); rghC.width = w; rghC.height = h;
  const bmpC = document.createElement("canvas"); bmpC.width = w; bmpC.height = h;
  const cg = colC.getContext("2d")!, rg = rghC.getContext("2d")!, bg = bmpC.getContext("2d")!;

  // Bright sun-bleached coastal putty-cream hull base matched to IMG_2346 & IMG_2347
  cg.fillStyle = "#e6ddd0"; cg.fillRect(0, 0, w, h);
  rg.fillStyle = "#a8a8a8"; rg.fillRect(0, 0, w, h);
  bg.fillStyle = "#808080"; bg.fillRect(0, 0, w, h);

  // Broad mottled oxidation & sun-bleaching blotches
  for (let i = 0; i < 320; i++) {
    const x = detHash(i * 2.1) * w, y = detHash(i * 5.7) * h, r = 14 + detHash(i * 9.3) * 44;
    const warm = detHash(i * 13.1) > 0.48;
    cg.fillStyle = warm ? "rgba(236,229,218,0.12)" : "rgba(152,140,124,0.12)";
    cg.beginPath(); cg.ellipse(x, y, r * 1.4, r * 0.85, detHash(i * 3.7) * Math.PI, 0, Math.PI * 2); cg.fill();
    rg.fillStyle = warm ? "rgba(210,210,210,0.12)" : "rgba(120,120,120,0.12)";
    rg.beginPath(); rg.ellipse(x, y, r * 1.4, r * 0.85, detHash(i * 3.7) * Math.PI, 0, Math.PI * 2); rg.fill();
  }

  // Horizontal rolled sheet-metal grain
  for (let i = 0; i < 1200; i++) {
    const x = detHash(i * 1.7) * w, y = detHash(i * 3.1) * h, len = 18 + detHash(i * 4.9) * 75;
    cg.fillStyle = detHash(i * 6.1) > 0.5 ? "rgba(250,246,238,0.06)" : "rgba(92,82,70,0.06)";
    cg.fillRect(x, y, len, 1.2);
    bg.fillStyle = detHash(i * 8.3) > 0.5 ? "rgba(215,215,215,0.09)" : "rgba(45,45,45,0.09)";
    bg.fillRect(x, y, len, 1);
  }

  // Vertical rain, ash-water and salt drip streaks (soft, organic oxidation rather than panel lines)
  for (let i = 0; i < 160; i++) {
    const x = detHash(i * 4.3 + 7) * w;
    const topY = detHash(i * 2.9) * 28;
    const streakH = 34 + detHash(i * 7.1) * 155;
    const width = 1.2 + detHash(i * 11.3) * 3.8;
    const dark = detHash(i * 15.7) > 0.34;
    const g = cg.createLinearGradient(x, topY, x, topY + streakH);
    g.addColorStop(0, dark ? "rgba(104,92,78,0.18)" : "rgba(240,235,226,0.16)");
    g.addColorStop(0.55, dark ? "rgba(118,105,90,0.09)" : "rgba(232,226,216,0.08)");
    g.addColorStop(1, "rgba(160,148,134,0)");
    cg.fillStyle = g;
    cg.fillRect(x, topY, width, streakH);
    bg.fillStyle = dark ? "rgba(58,58,58,0.09)" : "rgba(202,202,202,0.08)";
    bg.fillRect(x, topY, width, streakH * 0.7);
  }

  // Subtle heat discoloration & soot smudge on the forward third of the hull (around u ≈ 0.62) near the gunwale
  const heatX = 0.62 * w;
  const heat = cg.createRadialGradient(heatX, 18, 8, heatX, 24, 115);
  heat.addColorStop(0, "rgba(88,72,56,0.28)");
  heat.addColorStop(0.5, "rgba(124,104,82,0.14)");
  heat.addColorStop(1, "rgba(180,168,152,0)");
  cg.fillStyle = heat; cg.fillRect(0, 0, w, h);

  // Under-gunwale shadow band at top (y=0..24) and sand-splash / salt crust along the chine & bottom (y=h-48..h)
  const topBand = cg.createLinearGradient(0, 0, 0, 26);
  topBand.addColorStop(0, "rgba(68,60,52,0.34)");
  topBand.addColorStop(0.45, "rgba(90,80,70,0.12)");
  topBand.addColorStop(1, "rgba(0,0,0,0)");
  cg.fillStyle = topBand; cg.fillRect(0, 0, w, 26);

  const botBand = cg.createLinearGradient(0, h - 56, 0, h);
  botBand.addColorStop(0, "rgba(0,0,0,0)");
  botBand.addColorStop(0.55, "rgba(138,122,98,0.20)");
  botBand.addColorStop(1, "rgba(96,84,68,0.38)");
  cg.fillStyle = botBand; cg.fillRect(0, h - 56, w, 56);

  // Scratches, paint chips & sand specks
  for (let i = 0; i < 450; i++) {
    const x = detHash(i * 6.7 + 3) * w, y = detHash(i * 9.1 + 19) * h;
    const rw = 2 + detHash(i * 3.3) * 7, rh = 1 + detHash(i * 5.5) * 2;
    cg.fillStyle = detHash(i * 12.9) > 0.65 ? "rgba(86,78,70,0.32)" : "rgba(242,238,230,0.28)";
    cg.fillRect(x, y, rw, rh);
    bg.fillStyle = "rgba(35,35,35,0.35)";
    bg.fillRect(x, y, rw, rh);
  }

  const map = new THREE.CanvasTexture(colC); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const roughness = new THREE.CanvasTexture(rghC); roughness.anisotropy = 4;
  const normal = heightToNormalTexture(bmpC, 2.2, false);
  return { map, roughness, normal };
}

/** Weathered brushed-metal & soot-patinated texture for the rolled tubular gunwale rim. */
function gunwalePipeTexture(): { map: THREE.CanvasTexture; normal: THREE.CanvasTexture } {
  const w = 256, h = 64;
  const colC = document.createElement("canvas"); colC.width = w; colC.height = h;
  const bmpC = document.createElement("canvas"); bmpC.width = w; bmpC.height = h;
  const cg = colC.getContext("2d")!, bg = bmpC.getContext("2d")!;

  cg.fillStyle = "#dfd7ca"; cg.fillRect(0, 0, w, h);
  bg.fillStyle = "#808080"; bg.fillRect(0, 0, w, h);

  for (let i = 0; i < 380; i++) {
    const x = detHash(i * 2.9) * w, y = detHash(i * 5.3) * h, rw = 4 + detHash(i * 7.7) * 22;
    cg.fillStyle = detHash(i * 11.1) > 0.45 ? "rgba(255,252,246,0.16)" : "rgba(92,82,70,0.16)";
    cg.fillRect(x, y, rw, 2);
    bg.fillStyle = detHash(i * 13.7) > 0.5 ? "rgba(220,220,220,0.22)" : "rgba(40,40,40,0.22)";
    bg.fillRect(x, y, rw, 2);
  }
  // Welded pipe joint rings along the length
  for (const jx of [64, 168]) {
    cg.fillStyle = "rgba(85,76,66,0.38)"; cg.fillRect(jx, 0, 3, h);
    bg.fillStyle = "rgba(245,245,245,0.55)"; bg.fillRect(jx, 0, 2.5, h);
  }

  const map = new THREE.CanvasTexture(colC); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping;
  const normal = heightToNormalTexture(bmpC, 2.0, true);
  return { map, normal };
}

/** Coarse beach sand transitioning into pale wood-ash, dark soot and a glowing cherry-ember coal bed. */
function sandAshTexture(): { map: THREE.CanvasTexture; normal: THREE.CanvasTexture; emissive: THREE.CanvasTexture } {
  const size = 512;
  const colC = document.createElement("canvas"); colC.width = colC.height = size;
  const bmpC = document.createElement("canvas"); bmpC.width = bmpC.height = size;
  const emiC = document.createElement("canvas"); emiC.width = emiC.height = size;
  const cg = colC.getContext("2d")!, bg = bmpC.getContext("2d")!, eg = emiC.getContext("2d")!;

  cg.fillStyle = "#bfa989"; cg.fillRect(0, 0, size, size);
  bg.fillStyle = "#808080"; bg.fillRect(0, 0, size, size);
  eg.fillStyle = "#000000"; eg.fillRect(0, 0, size, size);

  // Broad sand scoops, raked hollows & moisture variation
  for (let i = 0; i < 480; i++) {
    const x = detHash(i * 3.1) * size, y = detHash(i * 7.3) * size, r = 10 + detHash(i * 11.7) * 34;
    const dark = detHash(i * 13.9) > 0.45;
    cg.fillStyle = dark ? "rgba(116,98,76,0.18)" : "rgba(232,216,190,0.18)";
    cg.beginPath(); cg.ellipse(x, y, r, r * 0.65, detHash(i * 2.1) * Math.PI, 0, Math.PI * 2); cg.fill();
    bg.fillStyle = dark ? "rgba(35,35,35,0.18)" : "rgba(225,225,225,0.18)";
    bg.beginPath(); bg.ellipse(x, y, r, r * 0.65, detHash(i * 2.1) * Math.PI, 0, Math.PI * 2); bg.fill();
  }

  // Deep perimeter AO shadow where the recessed sand bed meets the dark inner hull wall
  const rimTop = cg.createLinearGradient(0, 0, 0, 58);
  rimTop.addColorStop(0, "rgba(46,38,30,0.62)"); rimTop.addColorStop(1, "rgba(0,0,0,0)");
  cg.fillStyle = rimTop; cg.fillRect(0, 0, size, 58);
  const rimBot = cg.createLinearGradient(0, size - 58, 0, size);
  rimBot.addColorStop(0, "rgba(0,0,0,0)"); rimBot.addColorStop(1, "rgba(46,38,30,0.62)");
  cg.fillStyle = rimBot; cg.fillRect(0, size - 58, size, 58);
  const rimAft = cg.createLinearGradient(0, 0, 48, 0);
  rimAft.addColorStop(0, "rgba(46,38,30,0.52)"); rimAft.addColorStop(1, "rgba(0,0,0,0)");
  cg.fillStyle = rimAft; cg.fillRect(0, 0, 48, size);

  // Chalky white-grey wood-ash ring centered on BOAT_FIRE_X
  const fx = ((BOAT_FIRE_X + BOAT_LENGTH / 2 + 0.1) / (BOAT_LENGTH + 0.2)) * size;
  const fy = 0.5 * size;
  const ashHalo = cg.createRadialGradient(fx, fy, 18, fx, fy, 175);
  ashHalo.addColorStop(0, "rgba(246,243,238,0.98)");
  ashHalo.addColorStop(0.48, "rgba(226,221,212,0.88)");
  ashHalo.addColorStop(0.78, "rgba(182,172,158,0.48)");
  ashHalo.addColorStop(1, "rgba(190,169,137,0)");
  cg.fillStyle = ashHalo; cg.beginPath(); cg.arc(fx, fy, 180, 0, Math.PI * 2); cg.fill();

  // Dark soot & charred coal crater directly under the logs
  const soot = cg.createRadialGradient(fx, fy, 6, fx, fy, 78);
  soot.addColorStop(0, "rgba(24,20,18,0.97)");
  soot.addColorStop(0.58, "rgba(52,45,39,0.75)");
  soot.addColorStop(1, "rgba(210,205,198,0)");
  cg.fillStyle = soot; cg.beginPath(); cg.arc(fx, fy, 82, 0, Math.PI * 2); cg.fill();

  // Glowing ember bed painted into emissiveMap so live red-orange coals shine through the charcoal crevices in daylight
  const glowGrad = eg.createRadialGradient(fx, fy, 2, fx, fy, 54);
  glowGrad.addColorStop(0, "rgba(255,215,120,1)");
  glowGrad.addColorStop(0.45, "rgba(255,105,24,0.82)");
  glowGrad.addColorStop(0.82, "rgba(180,38,6,0.28)");
  glowGrad.addColorStop(1, "rgba(0,0,0,0)");
  eg.fillStyle = glowGrad; eg.beginPath(); eg.arc(fx, fy, 56, 0, Math.PI * 2); eg.fill();
  // Break up the ember glow with dark charcoal cracks so it reads as discrete glowing coals
  for (let i = 0; i < 160; i++) {
    const a = detHash(i * 4.1) * Math.PI * 2, rad = detHash(i * 8.9) * 52;
    const cx = fx + Math.cos(a) * rad, cy = fy + Math.sin(a) * rad;
    eg.fillStyle = detHash(i * 12.3) > 0.35 ? "rgba(0,0,0,0.72)" : "rgba(255,235,160,0.9)";
    eg.fillRect(cx, cy, 3 + detHash(i * 5.7) * 6, 2 + detHash(i * 3.3) * 5);
  }

  // Coarse sand grains, ash clumps & scattered charcoal bits
  for (let i = 0; i < 20000; i++) {
    const x = detHash(i * 1.9 + 11) * size, y = detHash(i * 4.3 + 29) * size;
    const dFire = Math.hypot(x - fx, y - fy);
    const sz = 1.1 + detHash(i * 9.7) * 2.4;
    const pick = detHash(i * 17.3);
    if (dFire < 145 && pick < 0.34) {
      cg.fillStyle = pick < 0.14 ? "rgba(22,19,16,0.85)" : "rgba(250,248,244,0.82)";
    } else {
      cg.fillStyle = pick < 0.45 ? "rgba(88,74,58,0.42)" : pick < 0.85 ? "rgba(238,226,204,0.42)" : "rgba(48,42,36,0.38)";
    }
    cg.fillRect(x, y, sz, sz);
    bg.fillStyle = pick < 0.5 ? "rgba(18,18,18,0.62)" : "rgba(245,245,245,0.62)";
    bg.fillRect(x, y, sz, sz);
  }

  const map = new THREE.CanvasTexture(colC); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const normal = heightToNormalTexture(bmpC, 3.2, false);
  const emissive = new THREE.CanvasTexture(emiC); emissive.colorSpace = THREE.SRGBColorSpace;
  return { map, normal, emissive };
}

/** Sun-bleached pale-barked log texture with dark charred end-burns (seen in IMG_2346 / IMG_2347). */
function paleBarkLogTexture(): { map: THREE.CanvasTexture; normal: THREE.CanvasTexture } {
  const size = 256;
  const colC = document.createElement("canvas"); colC.width = colC.height = size;
  const bmpC = document.createElement("canvas"); bmpC.width = bmpC.height = size;
  const cg = colC.getContext("2d")!, bg = bmpC.getContext("2d")!;

  cg.fillStyle = "#cfc6b6"; cg.fillRect(0, 0, size, size);
  bg.fillStyle = "#808080"; bg.fillRect(0, 0, size, size);

  for (let i = 0; i < 520; i++) {
    const x = detHash(i * 2.7) * size, y = detHash(i * 5.3) * size;
    const len = 16 + detHash(i * 7.9) * 54, th = 1.2 + detHash(i * 4.1) * 3.2;
    const p = detHash(i * 11.7);
    cg.fillStyle = p < 0.35 ? "rgba(112,92,72,0.52)" : p < 0.7 ? "rgba(238,232,220,0.62)" : "rgba(68,54,42,0.45)";
    cg.fillRect(x, y, len, th);
    bg.fillStyle = p < 0.45 ? "rgba(30,30,30,0.75)" : "rgba(235,235,235,0.75)";
    bg.fillRect(x, y, len, th);
  }
  const burn = cg.createLinearGradient(0, 0, size * 0.42, 0);
  burn.addColorStop(0, "rgba(28,24,22,0.92)");
  burn.addColorStop(0.55, "rgba(58,46,38,0.55)");
  burn.addColorStop(1, "rgba(0,0,0,0)");
  cg.fillStyle = burn; cg.fillRect(0, 0, size * 0.45, size);

  const map = new THREE.CanvasTexture(colC); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping;
  const normal = heightToNormalTexture(bmpC, 3.0, true);
  return { map, normal };
}

/** Rough charred bark + pale white-ash crust texture for split firewood logs. */
function charredLogTexture(): { map: THREE.CanvasTexture; normal: THREE.CanvasTexture } {
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
    cg.fillStyle = p < 0.35 ? "rgba(22,19,17,0.78)" : p < 0.62 ? "rgba(108,82,62,0.58)" : "rgba(224,218,210,0.72)";
    cg.fillRect(x, y, len, th);
    bg.fillStyle = p < 0.45 ? "rgba(20,20,20,0.78)" : "rgba(235,235,235,0.72)";
    bg.fillRect(x, y, len, th);
  }
  const map = new THREE.CanvasTexture(colC); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping;
  const normal = heightToNormalTexture(bmpC, 3.2, true);
  return { map, normal };
}

/** Cut wood end-grain texture with concentric growth rings & radial drying splits. */
function logEndGrainTexture(charred: boolean): { map: THREE.CanvasTexture; normal: THREE.CanvasTexture } {
  const size = 128;
  const colC = document.createElement("canvas"); colC.width = colC.height = size;
  const bmpC = document.createElement("canvas"); bmpC.width = bmpC.height = size;
  const cg = colC.getContext("2d")!, bg = bmpC.getContext("2d")!;

  cg.fillStyle = charred ? "#26201c" : "#b89068"; cg.fillRect(0, 0, size, size);
  bg.fillStyle = "#808080"; bg.fillRect(0, 0, size, size);

  for (let r = 8; r < 62; r += 4.5) {
    cg.strokeStyle = charred ? "rgba(68,54,44,0.55)" : "rgba(128,88,54,0.52)";
    cg.lineWidth = 1.6;
    cg.beginPath(); cg.arc(64, 64, r, 0, Math.PI * 2); cg.stroke();
    bg.strokeStyle = "rgba(40,40,40,0.65)"; bg.lineWidth = 1.5;
    bg.beginPath(); bg.arc(64, 64, r, 0, Math.PI * 2); bg.stroke();
  }
  // Bark rim + radial splits
  cg.strokeStyle = charred ? "#171412" : "#564232"; cg.lineWidth = 9;
  cg.beginPath(); cg.arc(64, 64, 60, 0, Math.PI * 2); cg.stroke();
  for (const ang of [0.4, 2.1, 4.3]) {
    cg.strokeStyle = "#1c1612"; cg.lineWidth = 2.2;
    cg.beginPath(); cg.moveTo(64, 64); cg.lineTo(64 + Math.cos(ang) * 54, 64 + Math.sin(ang) * 54); cg.stroke();
    bg.strokeStyle = "#101010"; bg.lineWidth = 2.5;
    bg.beginPath(); bg.moveTo(64, 64); bg.lineTo(64 + Math.cos(ang) * 54, 64 + Math.sin(ang) * 54); bg.stroke();
  }
  const map = new THREE.CanvasTexture(colC); map.colorSpace = THREE.SRGBColorSpace;
  const normal = heightToNormalTexture(bmpC, 2.5, false);
  return { map, normal };
}

/** Irregular split firewood geometry with rough bark displacement and underside ambient occlusion. */
function roughLogGeometry(length: number, r0: number, r1: number, sides: number, seed: number): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(r0, r1, length, sides, 6);
  geo.rotateZ(Math.PI / 2);
  const pos = geo.attributes.position;
  const col: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const r = Math.hypot(y, z);
    if (r > 0.002) {
      const ang = Math.atan2(z, y);
      const jitter = 0.84 + 0.30 * detHash(seed * 31 + Math.round(x * 20) * 7 + Math.round(ang * 5));
      pos.setY(i, y * jitter);
      pos.setZ(i, z * jitter);
      const ny = y / r;
      const ao = 0.34 + 0.66 * (0.5 + 0.5 * ny);
      col.push(ao, ao * 0.97, ao * 0.94);
    } else {
      col.push(0.75, 0.72, 0.68);
    }
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Irregular charred, ash-crusted and pale-barked firewood mound, fire-stones and glowing coals (matched to IMG_2223, IMG_2346, IMG_2347). */
function addCharredLogs(parent: THREE.Group, showFire = true): void {
  const logTex = charredLogTexture();
  const paleTex = paleBarkLogTexture();
  const cutEnd = logEndGrainTexture(false);
  const charEnd = logEndGrainTexture(true);

  const cutCapMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: cutEnd.map,
    normalMap: cutEnd.normal,
    normalScale: new THREE.Vector2(1.4, 1.4),
    roughness: 0.88,
  });
  const charCapMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: charEnd.map,
    normalMap: charEnd.normal,
    normalScale: new THREE.Vector2(1.6, 1.6),
    emissive: showFire ? new THREE.Color("#9e2804") : new THREE.Color("#000000"),
    emissiveIntensity: showFire ? 0.3 : 0,
    roughness: 0.95,
  });
  const baseMat = (tint: string, tex = logTex, glow = false) => new THREE.MeshStandardMaterial({
    color: tint,
    vertexColors: true,
    map: tex.map,
    normalMap: tex.normal,
    normalScale: new THREE.Vector2(1.75, 1.75),
    emissive: glow && showFire ? new THREE.Color("#b83206") : new THREE.Color("#000000"),
    emissiveIntensity: glow && showFire ? 0.32 : 0,
    roughness: 0.93,
  });
  const mats: THREE.Material[][] = [
    [baseMat("#ded8ce", logTex, false), cutCapMat, charCapMat],
    [baseMat("#786454", logTex, true), charCapMat, charCapMat],
    [baseMat("#4e3e34", logTex, true), charCapMat, cutCapMat],
    [baseMat("#ebe4d6", paleTex, false), cutCapMat, charCapMat],
  ];

  // Bed surface at BOAT_FIRE_X is around y ≈ 0.45..0.50 (with boatSheer ≈ 0.50..0.58)
  const pieces: { h: number; r0: number; r1: number; x: number; y: number; z: number; rot: [number, number, number]; mat: number; sides: number }[] = [
    { h: 0.66, r0: 0.080, r1: 0.064, x: BOAT_FIRE_X - 0.08, y: 0.475, z: 0.06, rot: [0.14, 0.34, 0.12], mat: 3, sides: 10 },
    { h: 0.56, r0: 0.068, r1: 0.054, x: BOAT_FIRE_X - 0.24, y: 0.465, z: -0.15, rot: [-0.08, 0.76, 0.08], mat: 3, sides: 9 },
    { h: 0.52, r0: 0.066, r1: 0.052, x: BOAT_FIRE_X + 0.09, y: 0.48, z: -0.08, rot: [0.22, 1.28, -0.16], mat: 1, sides: 9 },
    { h: 0.56, r0: 0.060, r1: 0.044, x: BOAT_FIRE_X - 0.12, y: 0.47, z: 0.12, rot: [-0.18, 1.88, 0.24], mat: 2, sides: 9 },
    { h: 0.46, r0: 0.064, r1: 0.046, x: BOAT_FIRE_X + 0.17, y: 0.47, z: 0.06, rot: [0.32, 0.68, -0.20], mat: 0, sides: 8 },
    { h: 0.44, r0: 0.056, r1: 0.038, x: BOAT_FIRE_X + 0.02, y: 0.545, z: -0.02, rot: [0.58, 0.45, 0.52], mat: 2, sides: 8 },
    { h: 0.38, r0: 0.050, r1: 0.038, x: BOAT_FIRE_X + 0.10, y: 0.55, z: 0.04, rot: [-0.56, 1.72, 0.68], mat: 1, sides: 8 },
    { h: 0.34, r0: 0.046, r1: 0.030, x: BOAT_FIRE_X + 0.02, y: 0.605, z: 0.01, rot: [0.38, 0.95, 0.85], mat: 3, sides: 8 },
  ];
  pieces.forEach((piece, idx) => {
    const log = new THREE.Mesh(roughLogGeometry(piece.h, piece.r0, piece.r1, piece.sides, idx + 1), mats[piece.mat]);
    log.position.set(piece.x, piece.y, piece.z);
    log.rotation.set(...piece.rot);
    log.castShadow = log.receiveShadow = true;
    parent.add(log);
  });

  // Heavy brown beach/fire stones partially buried in the sand/ash bed (visible in IMG_2346)
  const stoneMat = new THREE.MeshStandardMaterial({ color: "#705f4e", roughness: 0.94 });
  const stoneSpecs: [number, number, number, number, number, number][] = [
    [-0.32, 0.44, 0.19, 0.082, 0.052, 0.068],
    [-0.46, 0.432, -0.09, 0.074, 0.048, 0.062],
    [0.02, 0.46, -0.26, 0.068, 0.045, 0.058],
    [-0.14, 0.455, 0.27, 0.064, 0.042, 0.054],
  ];
  stoneSpecs.forEach(([sx, sy, sz, rx, ry, rz], k) => {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), stoneMat);
    stone.position.set(sx, sy, sz);
    stone.scale.set(rx, ry, rz);
    stone.rotation.set(k * 0.7, k * 1.3, 0.2);
    stone.castShadow = stone.receiveShadow = true;
    parent.add(stone);
  });

  // Glowing ember coals & charcoal chunks nestled deep in the fire crater
  const emberMat = new THREE.MeshStandardMaterial({
    color: "#3d160c",
    emissive: showFire ? "#ff5810" : "#000000",
    emissiveIntensity: showFire ? 1.65 : 0,
    roughness: 0.85,
  });
  const charMat = new THREE.MeshStandardMaterial({ color: "#1d1917", roughness: 0.98 });
  const coalGeo = new THREE.DodecahedronGeometry(0.038, 0);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + detHash(i * 3.7) * 0.4;
    const rad = i < 8 ? 0.04 + detHash(i * 5.3) * 0.11 : 0.15 + detHash(i * 9.1) * 0.16;
    const lump = new THREE.Mesh(coalGeo, i < 8 ? emberMat : charMat);
    lump.position.set(BOAT_FIRE_X + Math.cos(a) * rad, 0.465 + detHash(i * 2.9) * 0.024, Math.sin(a) * rad);
    lump.scale.set(0.85 + detHash(i * 4.1) * 0.9, 0.55 + detHash(i * 6.7) * 0.4, 0.85 + detHash(i * 8.3) * 0.8);
    lump.rotation.set(detHash(i * 1.1) * 3, detHash(i * 2.2) * 3, 0);
    lump.castShadow = true;
    parent.add(lump);
  }
}

/** Low flickering flames tucked between the logs, warm firelight on the ash bed, and delicate pale sunlit smoke. Left out of the static batch. */
function addBoatFire(parent: THREE.Group): void {
  const fire = new THREE.Group(); fire.name = "barraka-barbecue-fire"; fire.userData.dynamic = true; fire.position.set(BOAT_FIRE_X, 0.56, 0); parent.add(fire);
  const glow = new THREE.PointLight("#ff7c28", 0.55, 2.2, 2);
  glow.position.set(0, 0.04, 0);
  fire.add(glow);

  const flameMap = flameBlob(), smokeMap = smokePuff();
  const tongues = [
    { x: -0.01, y: 0.03, z: 0.01, w: 0.14, h: 0.22, rate: 10.4, phase: 0.2 },
    { x: -0.08, y: -0.02, z: 0.05, w: 0.11, h: 0.16, rate: 13.2, phase: 1.4 },
    { x: 0.09, y: -0.03, z: -0.04, w: 0.11, h: 0.17, rate: 8.3, phase: 2.2 },
    { x: 0.03, y: 0.08, z: -0.02, w: 0.095, h: 0.18, rate: 11.6, phase: 0.8 },
  ].map(spec => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameMap, transparent: true, depthWrite: false, opacity: 0.82, color: "#ffdfb8" }));
    sprite.center.set(0.5, 0.18); sprite.position.set(spec.x, spec.y, spec.z); sprite.scale.set(spec.w, spec.h, 1); fire.add(sprite);
    return { ...spec, sprite };
  });
  const puffs = Array.from({ length: 10 }, (_, i) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeMap, transparent: true, depthWrite: false, opacity: 0.36, color: "#ebf0f5" }));
    sprite.center.set(0.5, 0.22); fire.add(sprite);
    return { sprite, seed: i * 0.31 + 0.11 };
  });
  // A Group callback never runs; this sprite is drawn, so the flicker does.
  tongues[0].sprite.onBeforeRender = () => {
    const t = performance.now() * 0.001;
    glow.intensity = 0.46 + 0.16 * Math.sin(t * 9.3) + 0.08 * Math.cos(t * 15.7);
    for (const flame of tongues) {
      const flick = Math.sin(t * flame.rate + flame.phase), flick2 = Math.sin(t * flame.rate * 1.73 + flame.phase * 2.1);
      flame.sprite.scale.set(flame.w * (0.88 + flick2 * 0.12), flame.h * (0.76 + flick * 0.22 + flick2 * 0.06), 1);
      flame.sprite.position.set(flame.x + Math.sin(t * 2.7 + flame.phase) * 0.008, flame.y + Math.max(0, flick) * 0.012, flame.z + Math.cos(t * 2.2 + flame.phase) * 0.008);
      (flame.sprite.material as THREE.SpriteMaterial).opacity = 0.52 + Math.abs(flick) * 0.35;
    }
    for (const puff of puffs) {
      const life = 3.4, u = ((t * 0.29 + puff.seed) % life) / life, rise = u * u;
      puff.sprite.position.set(
        Math.sin(puff.seed * 5.2 + t * 0.52) * 0.12 * (0.28 + u) - rise * 0.22,
        0.05 + rise * 1.45,
        Math.cos(puff.seed * 3.7 + t * 0.40) * 0.10 * (0.28 + u) + rise * 0.14,
      );
      const width = 0.22 + rise * 0.92;
      puff.sprite.scale.set(width, width * 1.18, 1);
      (puff.sprite.material as THREE.SpriteMaterial).opacity = Math.sin(u * Math.PI) * 0.38;
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

/** Multi-lobed organic sunlit smoke puff matching IMG_2223. */
function smokePuff(): THREE.CanvasTexture {
  const size = 96, canvas = document.createElement("canvas"); canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  const lobe = (x: number, y: number, r: number, a0: number) => {
    const shade = g.createRadialGradient(x, y, 2, x, y, r);
    shade.addColorStop(0, `rgba(232,238,244,${a0})`);
    shade.addColorStop(0.48, `rgba(218,226,235,${(a0 * 0.48).toFixed(3)})`);
    shade.addColorStop(1, "rgba(210,218,228,0)");
    g.fillStyle = shade; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  };
  lobe(48, 52, 36, 0.52);
  lobe(36, 42, 28, 0.42);
  lobe(60, 40, 26, 0.38);
  lobe(48, 30, 24, 0.35);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
