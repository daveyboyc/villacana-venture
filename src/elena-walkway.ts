import * as THREE from "three";
import data from "../data/elena_walkway.json";
import skeleton from "../public/map/skeleton.json";
import { centroid } from "./geom";
import { plasterMaterial } from "./materials";
import { silviaPavingCanvas } from "./silvia-paving";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/**
 * Calle Elena covered walkway (registry part 6265201UF1366N_part5): the portal steps and red ramp, the
 * patterned floor and pebble mat, tile signs, brown doors, arches, a lantern. data/elena_walkway.json.
 * Built in the walkway's own frame (x along it, z across, +z north) and stood on the lane level at the
 * middle of its east end. The registry block above, and the neighbouring blocks that are its walls, are
 * untouched; nothing here is solid, so walking is unchanged apart from standing on the raised floor.
 */
export const elenaWalkway = data;
const F = data.frame, O = F.origin as Vec2, U = F.along as Vec2, N = F.across as Vec2;
const HALF = F.halfWidth, LEN = F.length, LV = data.level;
/** The lane surface sits this far above the terrain datum (the walk's own 0.06). */
const LANE = 0.06;
const FLOOR = LANE + LV.rise;
/** ?walkway=off draws the model without these details (and their ground offset), for before/after renders. */
const off = (): boolean => new URLSearchParams(location.search).get("walkway") === "off";
const STEP_TOP = LV.risers.length;
const stepEnd = LV.risers[STEP_TOP - 1];

export const walkwayPoint = (a: number, b: number): Vec2 => [O[0] + U[0] * a + N[0] * b, O[1] + U[1] * a + N[1] * b];
const along = (x: number, z: number) => (x - O[0]) * U[0] + (z - O[1]) * U[1];
const across = (x: number, z: number) => (x - O[0]) * N[0] + (z - O[1]) * N[1];
/** The footprint the floor, steps and ramp stand in: the registry strip between its two long sides. */
export const walkwayRing = (): Vec2[] => [walkwayPoint(0, -HALF), walkwayPoint(LEN, -HALF), walkwayPoint(LEN, HALF), walkwayPoint(0, HALF)];

/** Whether a ground-floor wall position lies on the walkway's side walls or portal faces (generic shutters are skipped there). */
export function inElenaWalkway(x: number, z: number): boolean {
  if (off()) return false;
  const a = along(x, z), b = across(x, z);
  return a > -0.4 && a < LEN + 0.4 && Math.abs(b) < HALF + 0.4;
}

/** Floor height above the lane at a point of the walkway: steps on the south share, ramp on the north, then level. */
export function walkwayRise(a: number, b: number): number | undefined {
  if (a < 0 || a > LEN || b < -HALF || b > HALF) return undefined;
  if (b <= LV.stepAcross[1]) return (LV.rise * LV.risers.filter((r) => a >= r).length) / STEP_TOP;
  return LV.rise * Math.min(1, a / LV.rampLength);
}
/** Extra ground height the player stands on over the smooth terrain, so walking meets the visible floor. */
export function elenaWalkwayGroundOffset(x: number, z: number): number {
  if (off()) return 0;
  const rise = walkwayRise(along(x, z), across(x, z));
  return rise === undefined ? 0 : Math.max(0, siteY(O[0], O[1]) + rise - siteY(x, z));
}

function texture(canvas: HTMLCanvasElement, repeat = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function draw(w: number, h: number, paint: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement("canvas"); c.width = w; c.height = h; paint(c.getContext("2d")!); return c;
}
const hash = (a: number, b = 0) => { const f = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return f - Math.floor(f); };

/** Plain rectangular terracotta with pale grout, as on the three steps (IMG_2459): a 2 x 2 tile repeat. */
function plainTileCanvas(): HTMLCanvasElement {
  return draw(256, 256, (g) => {
    g.fillStyle = "#e2dccd"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const v = hash(i * 2 + j, 5);
      g.fillStyle = `rgb(${148 + v * 20},${72 + v * 14},${52 + v * 10})`;
      g.fillRect(i * 128 + 3, j * 128 + 3, 122, 122);
    }
  });
}
/** Red studded rubber ramp matting: a grid of square studs. */
function studCanvas(): HTMLCanvasElement {
  return draw(256, 256, (g) => {
    g.fillStyle = "#5a2a28"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
      g.fillStyle = "#a24c44"; g.fillRect(i * 16 + 2, j * 16 + 2, 12, 12);
      g.fillStyle = "#b8706a"; g.fillRect(i * 16 + 2, j * 16 + 2, 12, 3);
    }
  });
}
/** Dark pebble mosaic with a lighter diamond-and-border motif suggested, not copied from the photographs. */
function pebbleCanvas(): HTMLCanvasElement {
  return draw(512, 512, (g) => {
    g.fillStyle = "#3d3b36"; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
      const x = hash(i * 3 + 1) * 512, y = hash(i * 3 + 2) * 512;
      g.fillStyle = ["#5e5b52", "#33322d", "#706b5f", "#4a473f", "#24231f"][i % 5];
      g.beginPath(); g.ellipse(x, y, 2 + hash(i + 19) * 3, 3 + hash(i + 47) * 4, hash(i + 71) * Math.PI, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = "#8f8a7a"; g.lineWidth = 7;
    g.strokeRect(26, 26, 460, 460);
    g.beginPath(); g.moveTo(256, 70); g.lineTo(442, 256); g.lineTo(256, 442); g.lineTo(70, 256); g.closePath(); g.stroke();
    g.beginPath(); g.arc(256, 256, 70, 0, Math.PI * 2); g.stroke();
  });
}
/** Blue-and-white glazed letter tiles: one block per word, as on the north wall by the ramp. */
function signCanvas(words: string[], w: number, h: number, weights: number[]): HTMLCanvasElement {
  return draw(w, h, (g) => {
    g.fillStyle = "#f3f1e8"; g.fillRect(0, 0, w, h);
    const gap = h * 0.12, total = weights.reduce((s, x) => s + x, 0), free = w - gap * (words.length - 1);
    let x = 0;
    words.forEach((word, i) => {
      const ww = (free * weights[i]) / total;
      g.fillStyle = "#14213a"; g.fillRect(x, 0, ww, h);
      g.strokeStyle = "#f3f1e8"; g.lineWidth = Math.max(2, h * 0.03); g.strokeRect(x + 3, 3, ww - 6, h - 6);
      g.fillStyle = "#f6f3e6"; g.textAlign = "center"; g.textBaseline = "middle";
      g.font = `bold ${h * 0.7}px "Times New Roman", serif`;
      g.fillText(word, x + ww / 2, h * 0.54, ww - 10);
      x += ww + gap;
    });
  });
}
/** A 'CASA WILKES'-type plaque: dark blue lettering on white tiles, two lines. */
function plaqueCanvas(lines: string[]): HTMLCanvasElement {
  return draw(256, 280, (g) => {
    g.fillStyle = "#f4f2ea"; g.fillRect(0, 0, 256, 280);
    g.strokeStyle = "#233a68"; g.lineWidth = 6; g.strokeRect(8, 8, 240, 264);
    g.fillStyle = "#233a68"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "bold 64px Georgia, serif";
    lines.forEach((t, i) => g.fillText(t, 128, 88 + i * 100, 220));
  });
}
function hatchCanvas(): HTMLCanvasElement {
  return draw(256, 200, (g) => {
    g.fillStyle = "#ecebe3"; g.fillRect(0, 0, 256, 200);
    g.strokeStyle = "#bdbcb2"; g.lineWidth = 8; g.strokeRect(10, 10, 236, 180);
    g.fillStyle = "#a8a89e"; g.textAlign = "center"; g.font = "bold 36px Georgia, serif";
    g.fillText("AGUA", 128, 90); g.fillText("POTABLE", 128, 138);
  });
}
/** Brown panelled double door: two leaves, two raised panels each, small knobs at the meeting stiles. */
function doorCanvas(w: number, h: number): HTMLCanvasElement {
  return draw(w, h, (g) => {
    g.fillStyle = "#5a3a28"; g.fillRect(0, 0, w, h);
    const f = w * 0.06, leaf = (w - 2 * f) / 2;
    for (const lx of [f, f + leaf]) {
      g.fillStyle = "#6e4630"; g.fillRect(lx + 2, f, leaf - 4, h - f * 1.2);
      for (const [py, ph] of [[0.06, 0.4], [0.52, 0.4]]) {
        const px = lx + leaf * 0.14, pw = leaf * 0.72, y0 = h * py + f, hh = (h - f * 1.2) * ph;
        g.fillStyle = "#3f291c"; g.fillRect(px - 3, y0 - 3, pw + 6, hh + 6);
        g.fillStyle = "#7a4e36"; g.fillRect(px + 3, y0 + 3, pw - 6, hh - 6);
      }
    }
    g.fillStyle = "#2b1c14"; g.fillRect(w / 2 - 3, f, 6, h - f * 1.2);
    g.fillStyle = "#b9954a";
    for (const dx of [-0.07, 0.07]) { g.beginPath(); g.arc(w / 2 + w * dx, h * 0.47, w * 0.022, 0, Math.PI * 2); g.fill(); }
  });
}

export function addElenaWalkway(scene: THREE.Scene, details = false): THREE.Group {
  if (off()) return new THREE.Group();
  const root = new THREE.Group();
  root.name = data.id;
  root.userData.base = O; // drape lifts it by the terrain at the lane end, like a house
  root.rotation.y = Math.atan2(-U[1], U[0]);
  root.position.set(O[0], 0, O[1]);
  const building = (skeleton.buildings as unknown as { id: string; ring: Vec2[] }[]).find((b) => b.id === data.passageId);
  if (!building) throw new Error(`registry part ${data.passageId} not found`);
  const c = centroid(building.ring);
  // The registry strip's two long sides are not parallel to the frame (the north wall closes in by about 0.17 m
  // over the walkway), so wall furniture and the kerb follow each side's actual line.
  const ringLocal = building.ring.map(([x, z]) => [along(x, z), across(x, z)] as Vec2);
  const wallB = (side: number, a: number): number => {
    const pts = ringLocal.filter((p) => side * p[1] > 1).sort((p, q) => p[0] - q[0]);
    if (a <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (a <= pts[i][0]) { const t = (a - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]); return pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1]); }
    return pts[pts.length - 1][1];
  };
  const SPAN = HALF + 0.15; // floor, ceiling and arch plates run a little into the walls so no gap shows
  // The registry block over the walkway is lifted 2.6 m (src/slice.ts PASSAGE_HEADROOM) at its own terrain level.
  const soffit = 2.6 + siteY(c.x, c.z) - siteY(O[0], O[1]);

  const white = plasterMaterial("#f6f3e9"); white.side = THREE.DoubleSide;
  const standard = (map: THREE.Texture, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshStandardMaterial({ map, roughness: 0.92, side: THREE.DoubleSide, ...extra });
  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, name: string, shadows = true) => {
    const m = new THREE.Mesh(geo, mat); m.name = name; m.castShadow = m.receiveShadow = shadows; root.add(m); return m;
  };
  /** A horizontal quad over [a0,a1] x [b0,b1] at height y, with its texture laid in metres (period m per repeat). */
  const flat = (a0: number, a1: number, b0: number, b1: number, y: number, mat: THREE.Material, period: number, name: string) => {
    const g = new THREE.PlaneGeometry(a1 - a0, b1 - b0).rotateX(-Math.PI / 2).translate((a0 + a1) / 2, y, (b0 + b1) / 2);
    const p = g.getAttribute("position"), uv = g.getAttribute("uv");
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / period, p.getZ(i) / period);
    return mesh(g, mat, name, false);
  };

  // ---- Floor: the offset terracotta with blue-and-white inserts from the top riser west, one level to the arch.
  const pave = texture(silviaPavingCanvas(1024));
  const period = 17 * (LV.tile / 4);
  const floorMat = standard(pave, { color: "#e3d9ca", roughness: 0.78 });
  flat(stepEnd, LEN, -SPAN, LV.stepAcross[1], FLOOR, floorMat, period, "walkway-floor");
  flat(LV.rampLength, LEN, LV.rampAcross[0], SPAN, FLOOR, floorMat, period, "walkway-floor-ramp-side");

  // ---- Three steps: plain terracotta tiles, white rendered risers (IMG_2459, IMG_2518, IMG_2689).
  const plain = texture(plainTileCanvas());
  const plainMat = standard(plain, { roughness: 0.85 });
  const plainPeriod = LV.tile * 2;
  const stepW = LV.stepAcross[1] - LV.stepAcross[0];
  LV.risers.forEach((r, i) => {
    const y = LANE + (LV.rise * (i + 1)) / STEP_TOP, next = i + 1 < STEP_TOP ? LV.risers[i + 1] : stepEnd;
    if (i + 1 < STEP_TOP) flat(r, next, LV.stepAcross[0], LV.stepAcross[1], y, plainMat, plainPeriod, `walkway-step-tread-${i + 1}`);
    const riser = new THREE.PlaneGeometry(stepW, LV.rise / STEP_TOP).rotateY(-Math.PI / 2).translate(r, y - LV.rise / STEP_TOP / 2, (LV.stepAcross[0] + LV.stepAcross[1]) / 2);
    mesh(riser, white, `walkway-step-riser-${i + 1}`);
  });
  // The steps' open side beside the ramp: a stepped profile above the ramp's slope.
  const side = new THREE.Shape();
  const hStep = (i: number) => LANE + (LV.rise * (i + 1)) / STEP_TOP;
  side.moveTo(0, LANE); side.lineTo(LV.rampLength, FLOOR); side.lineTo(stepEnd, FLOOR);
  for (let i = STEP_TOP - 2; i >= 0; i--) { side.lineTo(LV.risers[i + 1], hStep(i + 1)); side.lineTo(LV.risers[i + 1], hStep(i)); }
  side.lineTo(0, hStep(0)); side.closePath();
  mesh(new THREE.ShapeGeometry(side).translate(0, 0, LV.stepAcross[1]), white, "walkway-step-side");

  // ---- Red studded ramp: a slope of matting from the lane up to the floor, beside the steps.
  const ramp = new THREE.BufferGeometry();
  const r0 = LV.rampAcross[0], r1 = LV.rampAcross[1];
  const v = [0, LANE, r0, LV.rampLength, FLOOR, r0, LV.rampLength, FLOOR, r1, 0, LANE, r1];
  ramp.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  const slope = Math.hypot(LV.rampLength, LV.rise), stud = 0.32;
  ramp.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, slope / stud, 0, slope / stud, (r1 - r0) / stud, 0, (r1 - r0) / stud], 2));
  ramp.setIndex([0, 2, 1, 0, 3, 2]); ramp.computeVertexNormals();
  mesh(ramp, standard(texture(studCanvas()), { color: "#e4c2bb", roughness: 0.95 }), "walkway-ramp");

  // ---- Pebble mat inset between the two double doors.
  const mat = data.pebbleMat, ma = mat.along as [number, number], mb = mat.across as [number, number];
  const edge = new THREE.MeshStandardMaterial({ color: "#b8b2a0", roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  flat(ma[0] - 0.05, ma[1] + 0.05, mb[0] - 0.05, mb[1] + 0.05, FLOOR + 0.004, edge, 1, "walkway-pebble-border");
  const pebbles = standard(texture(pebbleCanvas(), false), { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, roughness: 1 });
  const pg = new THREE.PlaneGeometry(ma[1] - ma[0], mb[1] - mb[0]).rotateX(-Math.PI / 2).translate((ma[0] + ma[1]) / 2, FLOOR + 0.008, (mb[0] + mb[1]) / 2);
  mesh(pg, pebbles, "walkway-pebble-mat", false);

  // ---- Ceiling in white, kerb strips, end arches.
  const ceiling = new THREE.PlaneGeometry(LEN, 2 * SPAN).rotateX(Math.PI / 2).translate(LEN / 2, soffit - 0.01, 0);
  mesh(ceiling, white, "walkway-ceiling", false);
  const K = data.kerb;
  for (const side of [-1, 1]) {
    const from = side === 1 ? Math.max(K.from, LV.rampLength) : K.from;
    const sh = new THREE.Shape();
    sh.moveTo(from, -wallB(side, from)); sh.lineTo(LEN, -wallB(side, LEN)); sh.lineTo(LEN, -(wallB(side, LEN) - side * K.depth)); sh.lineTo(from, -(wallB(side, from) - side * K.depth)); sh.closePath();
    const kerb = new THREE.ExtrudeGeometry(sh, { depth: K.height, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, FLOOR, 0);
    mesh(kerb, white, "walkway-wall-kerb");
  }
  const spring = data.arches.spring, crown = soffit - 0.12, depth = data.arches.depthAlong;
  const arch = new THREE.Shape();
  arch.moveTo(-SPAN, spring); arch.lineTo(-SPAN, soffit + 0.3); arch.lineTo(SPAN, soffit + 0.3); arch.lineTo(SPAN, spring); arch.lineTo(HALF, spring);
  arch.absellipse(0, spring, HALF, crown - spring, 0, Math.PI, false);
  for (const a of [depth, LEN]) {
    // Shape x is across, extruded depth runs along; rotate so x becomes +z (across) and depth -x (back from a).
    const g = new THREE.ExtrudeGeometry(arch, { depth, bevelEnabled: false, curveSegments: 36 }).rotateY(-Math.PI / 2);
    const m = mesh(g, white, a === LEN ? "walkway-west-arch" : "walkway-east-arch");
    m.position.x = a;
  }

  // ---- Wall furniture: tile signs, hatch, doors. side +1 is the north wall.
  const onWall = (side: number, a: number, up: number, w: number, h: number, mat: THREE.Material, name: string) => {
    const g = new THREE.PlaneGeometry(w, h);
    if (side === 1) g.rotateY(Math.PI);
    g.translate(a, FLOOR + up, wallB(side, a) - side * 0.012);
    return mesh(g, mat, name, false);
  };
  for (const s of data.signs) {
    const canvas = s.text.length === 4
      ? signCanvas(s.text, 1024, 110, [5, 5, 2.2, 2.2])
      : plaqueCanvas(s.text);
    onWall(s.side, s.along, s.up, s.width, s.height, standard(texture(canvas, false), { roughness: 0.6 }), `sign-${s.id}`);
  }
  const hx = data.hatch;
  onWall(hx.side, hx.along, hx.up, hx.width, hx.height, standard(texture(hatchCanvas(), false)), hx.id);
  const doorMat = standard(texture(doorCanvas(512, 920), false), { roughness: 0.55 });
  const frame = new THREE.MeshStandardMaterial({ color: "#5a3a28", roughness: 0.6 });
  for (const d of data.doors) {
    const wall = wallB(d.side, d.along) - d.side * 0.012;
    const slab = new THREE.BoxGeometry(d.width + 0.1, d.height + 0.06, 0.04).translate(d.along, FLOOR + (d.height + 0.06) / 2, wallB(d.side, d.along) - d.side * 0.022);
    mesh(slab, frame, `${d.id}-frame`);
    const g = new THREE.PlaneGeometry(d.width, d.height);
    if (d.side === 1) g.rotateY(Math.PI);
    g.translate(d.along, FLOOR + d.height / 2, wall - d.side * 0.036);
    mesh(g, doorMat, d.id, false);
  }

  // ---- Hanging lantern (Details): black frame and roof, glass, a lit bulb.
  if (details) {
    const L = data.lantern, dark = new THREE.MeshStandardMaterial({ color: "#1f2426", roughness: 0.65 });
    const lamp = new THREE.Group(); lamp.name = "walkway-lantern"; lamp.position.set(L.along, FLOOR + L.bottom, L.across); root.add(lamp);
    const part = (geo: THREE.BufferGeometry, mat: THREE.Material, y: number) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; lamp.add(m); return m; };
    part(new THREE.CylinderGeometry(0.01, 0.01, soffit - FLOOR - L.bottom - 0.35, 6), dark, 0.35 + (soffit - FLOOR - L.bottom - 0.35) / 2);
    part(new THREE.ConeGeometry(0.19, 0.12, 4), dark, 0.38).rotation.y = Math.PI / 4;
    part(new THREE.BoxGeometry(0.2, 0.26, 0.2), new THREE.MeshStandardMaterial({ color: "#cbd0c2", transparent: true, opacity: 0.45, roughness: 0.25 }), 0.19);
    part(new THREE.ConeGeometry(0.1, 0.09, 4), dark, 0.03).rotation.z = Math.PI;
    for (const x of [-0.1, 0.1]) for (const z of [-0.1, 0.1]) { const p = part(new THREE.BoxGeometry(0.014, 0.28, 0.014), dark, 0.19); p.position.x = x; p.position.z = z; }
  }
  scene.add(root);
  return root;
}
