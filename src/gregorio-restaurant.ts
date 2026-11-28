import * as THREE from "three";
import data from "../data/gregorio_restaurant.json";
import { centroid } from "./geom";
import { photoMetres, photoTexture, plasterMaterial } from "./materials";
import { addSprites, type SpritePlacement } from "./sprites";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

const mainRing = data.mainBuilding.ring as Vec2[];
const terraceRing = data.terrace.ring as Vec2[];
const outbuildingRing = data.outbuilding.ring as Vec2[];

/** Collision rings for the roofed restaurant hall and the rear Catastro part1 outbuilding. */
export const gregorioRestaurantRings = (): Vec2[][] => [mainRing, outbuildingRing];

/** Building local frame anchored at the SW corner of the SE terrace:
 *  +u runs SW -> NE along the terrace front; +v runs SE -> NW into the restaurant. */
function buildingFrame() {
  const origin = terraceRing[0];
  const seCorner = terraceRing[1];
  const mainCenter = centroid(mainRing);
  const dx = seCorner[0] - origin[0], dz = seCorner[1] - origin[1];
  const frontWidth = Math.hypot(dx, dz) || 1;
  const ux = dx / frontWidth, uz = dz / frontWidth;
  let vx = -uz, vz = ux;
  if (vx * (mainCenter.x - origin[0]) + vz * (mainCenter.z - origin[1]) < 0) {
    vx = -vx;
    vz = -vz;
  }
  const yaw = Math.atan2(-uz, ux);
  const toWorld = (u: number, v: number): Vec2 => [origin[0] + ux * u + vx * v, origin[1] + uz * u + vz * v];
  const toUV = ([x, z]: Vec2): Vec2 => {
    const rx = x - origin[0], rz = z - origin[1];
    return [rx * ux + rz * uz, rx * vx + rz * vz];
  };
  return { origin, frontWidth, ux, uz, vx, vz, yaw, toWorld, toUV };
}

function shapeOf(ring: Vec2[]): THREE.Shape {
  return new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
}

const hash = (a: number, b: number) => {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** Warm irregular Andalusian fieldstone cladding (site_banner.jpg, site_secundaria.jpg). */
function fieldstoneTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  g.fillStyle = data.colors.mortar;
  g.fillRect(0, 0, size, size);
  const tones = [data.colors.stoneBase, data.colors.stoneLight, data.colors.stoneDark, "#d4c3a4", "#bfa782", "#cbb48e"];
  const rows = 9;
  const rowH = size / rows;
  for (let r = 0; r < rows; r++) {
    let x = -((r * 41) % 70);
    let col = 0;
    while (x < size + 20) {
      const w = 52 + hash(r, col) * 58;
      const h = rowH * (0.76 + hash(col + 13, r) * 0.24);
      const y = r * rowH + (rowH - h) * 0.5;
      g.fillStyle = tones[Math.floor(hash(r * 7 + col, col * 3) * tones.length)];
      g.beginPath();
      const j = (k: number) => (hash(r * 19 + col * 5, k) - 0.5) * 9;
      g.moveTo(x + 4 + j(1), y + 3 + j(2));
      g.lineTo(x + w - 4 + j(3), y + 3 + j(4));
      g.lineTo(x + w - 3 + j(5), y + h - 3 + j(6));
      g.lineTo(x + 3 + j(7), y + h - 3 + j(8));
      g.closePath();
      g.fill();
      g.strokeStyle = "rgba(92,76,56,0.22)";
      g.lineWidth = 2;
      g.stroke();
      x += w + 3;
      col++;
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.setScalar(1 / 2.6);
  tex.anisotropy = 8;
  return tex;
}

/** Rustic reddish-brown brick texture for pilasters, arch surrounds and terrace piers. */
function brickTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#c8b9a3";
  g.fillRect(0, 0, size, size);
  const tones = [data.colors.brick, "#a85f44", "#8a4a35", "#9e5a40", "#7d422f"];
  const rows = 12, cols = 4;
  const rh = size / rows, cw = size / cols;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      g.fillStyle = tones[Math.floor(hash(r * 11 + c, c * 5) * tones.length)];
      g.fillRect(c * cw + off + 2, r * rh + 2, cw - 4, rh - 4);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.setScalar(1 / 1.1);
  tex.anisotropy = 8;
  return tex;
}

/** Terracotta square terrace tiles with small white diamond corner insets (site_terraza.jpg). */
function terraceTileTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#8d7c6a";
  g.fillRect(0, 0, size, size);
  const unit = size / 4;
  const tones = ["#b37152", "#aa6a4c", "#ba7757", "#a36547"];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      g.fillStyle = tones[(r * 3 + c * 5) % tones.length];
      g.fillRect(c * unit + 2, r * unit + 2, unit - 4, unit - 4);
    }
  }
  // Small white square diamond insets at tile corners (site_terraza.jpg).
  g.fillStyle = "#efeae0";
  const d = 5.5;
  for (let r = 0; r <= 4; r++) {
    for (let c = 0; c <= 4; c++) {
      const cx = c * unit, cy = r * unit;
      g.beginPath();
      g.moveTo(cx, cy - d);
      g.lineTo(cx + d, cy);
      g.lineTo(cx, cy + d);
      g.lineTo(cx - d, cy);
      g.closePath();
      g.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.setScalar(1 / 1.6);
  tex.anisotropy = 8;
  return tex;
}

/** Rooftop turret frieze sign band: RESTAURANTE GREGORIO (site_secundaria.jpg, site_banner.jpg). */
function signBandTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 128;
  const g = canvas.getContext("2d")!;
  g.fillStyle = data.colors.signBg;
  g.fillRect(0, 0, 1024, 128);
  g.strokeStyle = "#6c7a89";
  g.lineWidth = 6;
  g.strokeRect(8, 8, 1008, 112);
  g.fillStyle = data.colors.signText;
  g.font = "700 62px Georgia, serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 512, 66);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Four-sided sloped roof frustum (either a perimeter mansard skirt or a full hipped roof)
 *  with UVs in real metres so `roof-tiles` tiles at true scale down each slope. */
function slopedRoofGeometry(
  outerMinX: number, outerMaxX: number, outerMinZ: number, outerMaxZ: number, yLow: number,
  innerMinX: number, innerMaxX: number, innerMinZ: number, innerMaxZ: number, yHigh: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const addQuad = (a: [number, number, number], b: [number, number, number], c: [number, number, number], d: [number, number, number]) => {
    const along = Math.hypot(b[0] - a[0], b[2] - a[2]);
    const slope = Math.hypot((d[0] + c[0] - a[0] - b[0]) / 2, yHigh - yLow, (d[2] + c[2] - a[2] - b[2]) / 2);
    const topAlong = Math.hypot(c[0] - d[0], c[2] - d[2]);
    const inset = (along - topAlong) / 2;
    const tri = (p: [number, number, number], q: [number, number, number], r: [number, number, number], up: [number, number], uq: [number, number], ur: [number, number]) => {
      positions.push(...p, ...q, ...r);
      uvs.push(...up, ...uq, ...ur);
    };
    tri(a, b, c, [0, 0], [along, 0], [along - inset, slope]);
    tri(a, c, d, [0, 0], [along - inset, slope], [inset, slope]);
  };
  // Four outer slopes, wound counter-clockwise when viewed from outside (+normal outward/upward).
  // South-east (+Z face)
  addQuad([outerMinX, yLow, outerMaxZ], [outerMaxX, yLow, outerMaxZ], [innerMaxX, yHigh, innerMaxZ], [innerMinX, yHigh, innerMaxZ]);
  // North-east (+X face)
  addQuad([outerMaxX, yLow, outerMaxZ], [outerMaxX, yLow, outerMinZ], [innerMaxX, yHigh, innerMinZ], [innerMaxX, yHigh, innerMaxZ]);
  // North-west (-Z face)
  addQuad([outerMaxX, yLow, outerMinZ], [outerMinX, yLow, outerMinZ], [innerMinX, yHigh, innerMinZ], [innerMaxX, yHigh, innerMinZ]);
  // South-west (-X face)
  addQuad([outerMinX, yLow, outerMinZ], [outerMinX, yLow, outerMaxZ], [innerMinX, yHigh, innerMaxZ], [innerMinX, yHigh, innerMinZ]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

/** Arched window assembly with rustic brick surround, dark recessed frame and opaque glazing. */
function archedWindow(
  width: number, height: number, brickMat: THREE.Material, frameMat: THREE.Material, glassMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  const radius = width / 2;
  const straight = Math.max(0.1, height - radius);
  const archShape = (halfW: number, rise: number, bottom: number) => {
    const s = new THREE.Shape();
    s.moveTo(-halfW, bottom);
    s.lineTo(halfW, bottom);
    s.lineTo(halfW, straight);
    s.absellipse(0, straight, halfW, rise, 0, Math.PI, false);
    s.closePath();
    return s;
  };
  const border = 0.16;
  const surround = archShape(radius + border, radius + border, 0);
  const cutout = new THREE.Path();
  cutout.moveTo(-radius, 0.04);
  cutout.lineTo(radius, 0.04);
  cutout.lineTo(radius, straight);
  cutout.absellipse(0, straight, radius, radius, 0, Math.PI, false);
  cutout.closePath();
  surround.holes.push(cutout);

  const brickMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(surround, { depth: 0.12, bevelEnabled: false, curveSegments: 16 }), brickMat);
  brickMesh.castShadow = brickMesh.receiveShadow = true;
  g.add(brickMesh);

  const sill = new THREE.Mesh(new THREE.BoxGeometry(width + border * 2 + 0.08, 0.08, 0.18), brickMat);
  sill.position.set(0, 0.02, 0.06);
  sill.castShadow = sill.receiveShadow = true;
  g.add(sill);

  const frameMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(archShape(radius, radius, 0.04), { depth: 0.07, bevelEnabled: false, curveSegments: 16 }), frameMat);
  g.add(frameMesh);

  const innerR = Math.max(0.12, radius - 0.07);
  const glassMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(archShape(innerR, innerR, 0.11), { depth: 0.02, bevelEnabled: false, curveSegments: 16 }), glassMat);
  glassMesh.position.z = 0.065;
  g.add(glassMesh);
  return g;
}

function putBox(parent: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material, name?: string): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  if (name) mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Gregorio Restaurante (Calle Loira 2, Catastro parcel 6267302UF1366N):
 * - Single-storey fieldstone-and-brick restaurant hall with pitched terracotta barrel-tile skirt,
 *   flat roof deck and post-2016 rooftop turret carrying the RESTAURANTE GREGORIO sign.
 * - Open-air raised terracotta terrace on the SE half of Catastro part2, with white balustrade,
 *   brick piers, two ramps and three cream retractable awnings.
 * - Detached flat-roofed rear outbuilding (Catastro part1).
 * Visible in Inspect (Layout and Show details); outdoor furniture, pier lanterns, flower beds
 * and front palms appear with Show details.
 */
export function addGregorioRestaurant(scene: THREE.Scene): void {
  const group = new THREE.Group();
  group.name = data.id;
  group.userData.noDrape = true;
  group.userData.structural = true;
  scene.add(group);

  const frame = buildingFrame();
  const mainCenter = centroid(mainRing);
  const mainDatumY = siteY(mainCenter.x, mainCenter.z) + data.mainBuilding.floorOffset;

  // Materials (all opaque, reusing src/materials.ts where appropriate).
  const stoneTex = fieldstoneTexture();
  const stoneWallMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.94 });
  const brickTex = brickTexture();
  const brickMat = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.9 });
  const brickCapMat = new THREE.MeshStandardMaterial({ color: data.colors.brickCap, roughness: 0.86 });
  const flatRoofMat = new THREE.MeshStandardMaterial({ color: data.colors.flatRoof, roughness: 0.94 });
  const awningMat = new THREE.MeshStandardMaterial({ color: data.colors.awning, roughness: 0.85 });
  const balustradeMat = plasterMaterial(data.colors.balustrade);
  const frameMat = new THREE.MeshStandardMaterial({ color: data.colors.frame, roughness: 0.65 });
  const glassMat = new THREE.MeshStandardMaterial({ color: data.colors.glass, roughness: 0.14, metalness: 0.35 });
  const rampMat = new THREE.MeshStandardMaterial({ color: data.colors.ramp, roughness: 0.92 });
  const terraceTileMat = new THREE.MeshStandardMaterial({ map: terraceTileTexture(), roughness: 0.88 });

  const tileMap = photoTexture("roof-tiles").clone();
  const tileNorm = photoTexture("roof-tiles", true).clone();
  for (const t of [tileMap, tileNorm]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / photoMetres("roof-tiles"), 1 / photoMetres("roof-tiles"));
    t.needsUpdate = true;
  }
  const roofTileMat = new THREE.MeshStandardMaterial({
    color: "#ebb89e",
    map: tileMap,
    normalMap: tileNorm,
    roughness: 0.9,
  });

  // 1. Extruded main restaurant body on exact Catastro mainRing (part2 NW + part3), level datum.
  const mainTotalH = data.mainBuilding.flatRoofHeight + data.mainBuilding.foundationDepth;
  const mainGeo = new THREE.ExtrudeGeometry(shapeOf(mainRing), { depth: mainTotalH, bevelEnabled: false });
  mainGeo.rotateX(-Math.PI / 2);
  const mainMesh = new THREE.Mesh(mainGeo, [flatRoofMat, stoneWallMat]);
  mainMesh.name = "gregorio-main-body";
  mainMesh.position.y = mainDatumY - data.mainBuilding.foundationDepth;
  mainMesh.castShadow = mainMesh.receiveShadow = true;
  mainMesh.userData.structural = true;
  group.add(mainMesh);

  // 2. Extruded open-air raised terrace slab on exact Catastro SE terraceRing, flush with mainDatumY.
  const terraceGeo = new THREE.ExtrudeGeometry(shapeOf(terraceRing), { depth: data.terrace.slabThickness, bevelEnabled: false });
  terraceGeo.rotateX(-Math.PI / 2);
  const terraceMesh = new THREE.Mesh(terraceGeo, [terraceTileMat, stoneWallMat]);
  terraceMesh.name = "gregorio-terrace-slab";
  terraceMesh.position.y = mainDatumY - data.terrace.slabThickness;
  terraceMesh.castShadow = terraceMesh.receiveShadow = true;
  terraceMesh.userData.structural = true;
  group.add(terraceMesh);

  // 3. Local-aligned architectural group: local +X = +u (SW->NE), local -Z = +v (SE->NW), local +Z = outward SE.
  const local = new THREE.Group();
  local.name = "gregorio-architecture";
  local.position.set(frame.origin[0], mainDatumY, frame.origin[1]);
  local.rotation.y = frame.yaw;
  group.add(local);

  // Measure exact UV bounds of mainRing so roof skirt, pilasters and facades sit tightly on the Catastro walls.
  const mainUVs = mainRing.map(frame.toUV);
  const uMin = Math.min(...mainUVs.map((p) => p[0]));
  const uMax = Math.max(...mainUVs.map((p) => p[0]));
  const vFront = Math.min(...mainUVs.map((p) => p[1])); // ~8.93 m (SE facade wall)
  const vBack = Math.max(...mainUVs.map((p) => p[1]));  // ~21.9 m (NW rear wall)
  const zFront = -vFront;
  const zBack = -vBack;

  // 3a. Pitched terracotta Spanish barrel-tile roof skirt around all four walls of main building.
  const ov = data.mainBuilding.eaveOverhang;
  const sd = data.mainBuilding.skirtDepth;
  const skirtGeo = slopedRoofGeometry(
    uMin - ov, uMax + ov, zBack - ov, zFront + ov, data.mainBuilding.eaveHeight,
    uMin + sd, uMax - sd, zBack + sd, zFront - sd, data.mainBuilding.skirtRidgeHeight,
  );
  const skirtMesh = new THREE.Mesh(skirtGeo, roofTileMat);
  skirtMesh.name = "gregorio-roof-skirt";
  skirtMesh.castShadow = skirtMesh.receiveShadow = true;
  local.add(skirtMesh);

  // Under-eave soffit fascia & inner parapet wall closing the top of the skirt down to the flat roof.
  const parapetH = data.mainBuilding.skirtRidgeHeight - data.mainBuilding.flatRoofHeight;
  const innerW = (uMax - sd) - (uMin + sd);
  const innerD = (zFront - sd) - (zBack + sd);
  const innerCx = (uMin + uMax) / 2, innerCz = (zFront + zBack) / 2;
  const rimThick = 0.24;
  putBox(local, innerW + rimThick * 2, parapetH, rimThick, innerCx, data.mainBuilding.flatRoofHeight + parapetH / 2, zFront - sd, flatRoofMat);
  putBox(local, innerW + rimThick * 2, parapetH, rimThick, innerCx, data.mainBuilding.flatRoofHeight + parapetH / 2, zBack + sd, flatRoofMat);
  putBox(local, rimThick, parapetH, innerD, uMin + sd, data.mainBuilding.flatRoofHeight + parapetH / 2, innerCz, flatRoofMat);
  putBox(local, rimThick, parapetH, innerD, uMax - sd, data.mainBuilding.flatRoofHeight + parapetH / 2, innerCz, flatRoofMat);
  // White fascia strip directly beneath the terracotta eave tiles (site_secundaria.jpg).
  const fasciaW = (uMax - uMin) + ov * 2, fasciaD = (zFront - zBack) + ov * 2;
  putBox(local, fasciaW, 0.14, 0.12, (uMin + uMax) / 2, data.mainBuilding.eaveHeight - 0.05, zFront + ov - 0.06, balustradeMat);
  putBox(local, 0.12, 0.14, fasciaD, uMax + ov - 0.06, data.mainBuilding.eaveHeight - 0.05, (zFront + zBack) / 2, balustradeMat);

  // 3b. Stone-clad rooftop turret with RESTAURANTE GREGORIO sign band & hipped terracotta roof.
  const [tu0, tu1] = data.turret.uRange;
  const [tv0, tv1] = data.turret.vRange;
  const tw = tu1 - tu0, td = tv1 - tv0;
  const tcx = (tu0 + tu1) / 2, tcz = -(tv0 + tv1) / 2;
  const th = data.turret.eaveHeight - data.turret.baseHeight;
  putBox(local, tw, th, td, tcx, data.turret.baseHeight + th / 2, tcz, stoneWallMat, "gregorio-turret-body");
  // Brick corner quoins on the turret.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      putBox(local, 0.26, th, 0.26, tcx + sx * (tw / 2 - 0.08), data.turret.baseHeight + th / 2, tcz + sz * (td / 2 - 0.08), brickMat);
    }
  }
  // RESTAURANTE GREGORIO sign band on SE (+Z) and NE (+X) turret faces, matching band on SW/NW.
  const signTex = signBandTexture(data.turret.signText);
  const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.55 });
  const signBackMat = new THREE.MeshStandardMaterial({ color: data.colors.signBg, roughness: 0.65 });
  const sbH = data.turret.signBandHeight;
  const sbY = data.turret.eaveHeight - sbH / 2 - 0.04;
  // SE front sign (+Z face)
  const seSign = new THREE.Mesh(new THREE.PlaneGeometry(tw - 0.16, sbH), signMat);
  seSign.name = "gregorio-sign-se";
  seSign.position.set(tcx, sbY, tcz + td / 2 + 0.045);
  local.add(seSign);
  // NE side sign (+X face, visible in site_banner.jpg)
  const neSign = new THREE.Mesh(new THREE.PlaneGeometry(td - 0.16, sbH), signMat);
  neSign.name = "gregorio-sign-ne";
  neSign.position.set(tcx + tw / 2 + 0.045, sbY, tcz);
  neSign.rotation.y = Math.PI / 2;
  local.add(neSign);
  // Subtle white frieze backing band wrapping the turret top.
  putBox(local, tw + 0.04, sbH + 0.04, td + 0.04, tcx, sbY, tcz, signBackMat);

  // Hipped terracotta roof on the turret.
  const tov = data.turret.overhang;
  const ridgeHalfW = Math.max(0.25, (tw - td) / 2 + 0.35);
  const turretRoofGeo = slopedRoofGeometry(
    tu0 - tov, tu1 + tov, -tv1 - tov, -tv0 + tov, data.turret.eaveHeight,
    tcx - ridgeHalfW, tcx + ridgeHalfW, tcz - 0.08, tcz + 0.08, data.turret.peakHeight,
  );
  const turretRoofMesh = new THREE.Mesh(turretRoofGeo, roofTileMat);
  turretRoofMesh.name = "gregorio-turret-roof";
  turretRoofMesh.castShadow = turretRoofMesh.receiveShadow = true;
  local.add(turretRoofMesh);

  // 3c. SE Front Facade along the exact Catastro SE wall edge mainRing[0] -> mainRing[1].
  const seA = frame.toUV(mainRing[0]); // (~0.03, 8.93)
  const seB = frame.toUV(mainRing[1]); // (~11.45, 9.37)
  const seLen = Math.hypot(seB[0] - seA[0], seB[1] - seA[1]);
  const seYaw = Math.atan2(seB[1] - seA[1], seB[0] - seA[0]);
  const seWall = new THREE.Group();
  seWall.name = "gregorio-se-facade";
  seWall.position.set(seA[0], 0, -seA[1]);
  seWall.rotation.y = seYaw;
  local.add(seWall);

  // Brick corner pilasters on all four corners of main building.
  for (const corner of [mainRing[0], mainRing[1], mainRing[6], mainRing[8]]) {
    const [cu, cv] = frame.toUV(corner);
    putBox(local, 0.42, data.mainBuilding.eaveHeight, 0.42, cu, data.mainBuilding.eaveHeight / 2, -cv, brickMat);
  }
  // Low brick plinth flush along the SE facade.
  putBox(seWall, seLen - 0.1, 0.42, 0.14, seLen / 2, 0.21, 0.04, brickMat);

  // Central glazed entrance double door with brick jambs and dark frame.
  const door = data.frontFacade.door;
  putBox(seWall, door.width + 0.32, door.height + 0.14, 0.14, door.u, (door.height + 0.14) / 2, 0.05, brickMat, "gregorio-door-surround");
  putBox(seWall, door.width, door.height, 0.10, door.u, door.height / 2, 0.09, frameMat, "gregorio-door-frame");
  putBox(seWall, door.width - 0.2, door.height - 0.16, 0.04, door.u, door.height / 2, 0.13, glassMat, "gregorio-door-glass");
  putBox(seWall, 0.07, door.height - 0.16, 0.06, door.u, door.height / 2, 0.15, frameMat);
  putBox(seWall, door.width - 0.16, 0.07, 0.06, door.u, door.height - 0.42, 0.15, frameMat);

  // Symmetrical flanking narrow and wide arched windows.
  for (const w of [...data.frontFacade.narrowArches, ...data.frontFacade.wideArches]) {
    const win = archedWindow(w.width, w.height, brickMat, frameMat, glassMat);
    win.name = "gregorio-front-arch-window";
    win.position.set(w.u, w.sill, 0.03);
    seWall.add(win);
  }

  // Three cream retractable roll-out awnings across the SE front eave.
  for (const aw of data.terrace.awnings) {
    const awW = aw.to - aw.from;
    const awX = (aw.from + aw.to) / 2;
    const ag = new THREE.Group();
    ag.name = "gregorio-awning";
    ag.position.set(awX, data.terrace.awningY, 0.08);
    seWall.add(ag);
    // Roller housing bar
    putBox(ag, awW, 0.13, 0.14, 0, 0.02, 0.06, awningMat);
    // Sloped awning canvas panel
    const panel = putBox(ag, awW, 0.05, data.terrace.awningDepth, 0, -0.14, data.terrace.awningDepth / 2 + 0.04, awningMat);
    panel.rotation.x = 0.22;
    // Straight hanging front valance
    putBox(ag, awW, 0.26, 0.04, 0, -0.42, data.terrace.awningDepth + 0.02, awningMat);
  }

  // 3d. NE Side Facade along the exact Catastro NE wall line mainRing[2] -> mainRing[6].
  const neA = frame.toUV(mainRing[2]); // (~11.74, 9.38)
  const neB = frame.toUV(mainRing[6]); // (~11.27, 21.91)
  const neWallU = (v: number) => neA[0] + ((v - neA[1]) / (neB[1] - neA[1])) * (neB[0] - neA[0]);
  const neYaw = Math.PI / 2 - Math.atan2(neB[0] - neA[0], neB[1] - neA[1]);
  for (const nw of data.neWindows) {
    const wg = new THREE.Group();
    wg.name = "gregorio-ne-window";
    wg.position.set(neWallU(nw.v) + 0.04, nw.sill + nw.height / 2, -nw.v);
    wg.rotation.y = neYaw;
    local.add(wg);
    putBox(wg, nw.width + 0.28, nw.height + 0.24, 0.10, 0, 0, 0, brickMat);
    putBox(wg, nw.width + 0.34, 0.08, 0.16, 0, -nw.height / 2 - 0.10, 0.04, brickMat);
    putBox(wg, nw.width, nw.height, 0.08, 0, 0, 0.03, frameMat);
    putBox(wg, nw.width - 0.16, nw.height - 0.16, 0.04, 0, 0, 0.06, glassMat);
    putBox(wg, 0.06, nw.height - 0.14, 0.06, 0, 0, 0.08, frameMat);
  }
  // Intermediate brick pilasters along the NE side wall.
  for (const pv of [13.25, 16.55, 19.9]) {
    putBox(local, 0.18, data.mainBuilding.eaveHeight, 0.36, neWallU(pv) + 0.04, data.mainBuilding.eaveHeight / 2, -pv, brickMat);
  }

  // 3e. Open-Air Raised Terrace: white classical balustrade, red-brick piers & two SE ramps.
  const bH = data.terrace.balustradeHeight;
  const pW = data.terrace.pierWidth, pH = data.terrace.pierHeight;
  const pierPositions: [number, number][] = [];

  const addPier = (u: number, v: number) => {
    pierPositions.push([u, v]);
    putBox(local, pW, pH, pW, u, pH / 2, -v, brickMat, "gregorio-terrace-pier");
    putBox(local, pW + 0.08, 0.08, pW + 0.08, u, pH + 0.04, -v, brickCapMat);
  };

  const addBalustradeRun = (u0: number, v0: number, u1: number, v1: number) => {
    const len = Math.hypot(u1 - u0, v1 - v0);
    if (len < 0.3) return;
    const rg = new THREE.Group();
    rg.name = "gregorio-balustrade";
    rg.position.set((u0 + u1) / 2, 0, -(v0 + v1) / 2);
    rg.rotation.y = Math.atan2(v1 - v0, u1 - u0);
    local.add(rg);
    // Low base rail & moulded top handrail
    putBox(rg, len, 0.12, 0.18, 0, 0.06, 0, balustradeMat);
    putBox(rg, len, 0.10, 0.22, 0, bH - 0.05, 0, balustradeMat);
    // Classical turned-style balusters (slim posts with belly swelling)
    const count = Math.max(2, Math.floor(len / 0.24));
    for (let i = 0; i < count; i++) {
      const x = -len / 2 + ((i + 0.5) / count) * len;
      putBox(rg, 0.08, bH - 0.18, 0.08, x, bH / 2, 0, balustradeMat);
      putBox(rg, 0.11, 0.24, 0.11, x, bH * 0.44, 0, balustradeMat);
    }
  };

  // SE front terrace edge (v = 0.22), broken by the two access ramps.
  const vEdge = 0.22;
  const fw = frame.frontWidth;
  const [rampA, rampB] = data.terrace.frontRamps;
  const frontPierUs = [0.22, rampA.from, rampA.to, rampB.from, rampB.to, fw - 0.22];
  for (const u of frontPierUs) addPier(u, vEdge);
  addBalustradeRun(0.22 + pW / 2, vEdge, rampA.from - pW / 2, vEdge);
  addBalustradeRun(rampA.to + pW / 2, vEdge, rampB.from - pW / 2, vEdge);
  addBalustradeRun(rampB.to + pW / 2, vEdge, fw - 0.22 - pW / 2, vEdge);

  // SW terrace edge (u = 0.22, v = 0.22..vFront) & NE terrace edge (u = fw - 0.22, v = 0.22..vFront)
  addPier(0.22, vFront * 0.52);
  addBalustradeRun(0.22, vEdge + pW / 2, 0.22, vFront * 0.52 - pW / 2);
  addBalustradeRun(0.22, vFront * 0.52 + pW / 2, 0.22, vFront - 0.2);

  addPier(fw - 0.22, vFront * 0.52);
  addBalustradeRun(fw - 0.22, vEdge + pW / 2, fw - 0.22, vFront * 0.52 - pW / 2);
  addBalustradeRun(fw - 0.22, vFront * 0.52 + pW / 2, fw - 0.22, vFront - 0.2);

  // Two concrete/stone ramps leading up from the SE grey-sett forecourt (siteY + 0.275) to the terrace openings.
  for (const r of data.terrace.frontRamps) {
    const rw = r.to - r.from - pW * 0.4;
    const rc = (r.from + r.to) / 2;
    const [wx, wz] = frame.toWorld(rc, -1.7);
    const drop = Math.max(0.28, mainDatumY - (siteY(wx, wz) + 0.275));
    const run = 1.85;
    const rampShape = new THREE.Shape();
    rampShape.moveTo(0, 0);
    rampShape.lineTo(run, -drop);
    rampShape.lineTo(run, -drop - 0.35);
    rampShape.lineTo(0, -drop - 0.35);
    rampShape.closePath();
    const rGeo = new THREE.ExtrudeGeometry(rampShape, { depth: rw, bevelEnabled: false });
    rGeo.translate(0, 0, -rw / 2);
    rGeo.rotateY(-Math.PI / 2);
    const rMesh = new THREE.Mesh(rGeo, rampMat);
    rMesh.name = "gregorio-terrace-ramp";
    rMesh.position.set(rc, -0.01, -vEdge);
    rMesh.castShadow = rMesh.receiveShadow = true;
    local.add(rMesh);
  }

  // 4. Rear Catastro part1 outbuilding (flat-roofed white/light-grey service block).
  const p1Center = centroid(outbuildingRing);
  const p1DatumY = siteY(p1Center.x, p1Center.z) + 0.22;
  const outWallMat = plasterMaterial(data.colors.outbuildingWall);
  const outRoofMat = new THREE.MeshStandardMaterial({ color: data.colors.outbuildingRoof, roughness: 0.94 });
  const p1TotalH = data.outbuilding.height + data.outbuilding.foundationDepth;
  const p1Geo = new THREE.ExtrudeGeometry(shapeOf(outbuildingRing), { depth: p1TotalH, bevelEnabled: false });
  p1Geo.rotateX(-Math.PI / 2);
  const p1Mesh = new THREE.Mesh(p1Geo, [outRoofMat, outWallMat]);
  p1Mesh.name = data.outbuilding.id;
  p1Mesh.position.y = p1DatumY - data.outbuilding.foundationDepth;
  p1Mesh.castShadow = p1Mesh.receiveShadow = true;
  p1Mesh.userData.structural = true;
  group.add(p1Mesh);

  const p1Outline = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(outbuildingRing.map(([x, z]) => new THREE.Vector3(x, p1DatumY + data.outbuilding.height + 0.015, z))),
    new THREE.LineBasicMaterial({ color: "#59564e" }),
  );
  p1Outline.name = `${data.outbuilding.id}-outline`;
  group.add(p1Outline);

  // 5. Show details only: pier lanterns, terrace dining sets, low flowering beds & front palms.
  if (scene.userData.layoutOnly) return;

  const ironMat = new THREE.MeshStandardMaterial({ color: "#252422", roughness: 0.55 });
  const lampGlassMat = new THREE.MeshStandardMaterial({ color: "#f6ecd2", roughness: 0.3 });
  for (const [pu, pv] of pierPositions) {
    const lg = new THREE.Group();
    lg.name = "gregorio-pier-lantern";
    lg.position.set(pu, pH + 0.08, -pv);
    local.add(lg);
    putBox(lg, 0.14, 0.05, 0.14, 0, 0.025, 0, ironMat);
    putBox(lg, 0.15, 0.22, 0.15, 0, 0.16, 0, lampGlassMat);
    putBox(lg, 0.22, 0.06, 0.22, 0, 0.29, 0, ironMat);
    putBox(lg, 0.08, 0.07, 0.08, 0, 0.35, 0, ironMat);
  }

  // Outdoor terrace dining tables and tan chairs (site_terraza.jpg, aerial_raw.png).
  const tableMat = new THREE.MeshStandardMaterial({ color: data.colors.table, roughness: 0.72 });
  const chairMat = new THREE.MeshStandardMaterial({ color: data.colors.chair, roughness: 0.78 });
  const legMat = new THREE.MeshStandardMaterial({ color: "#706b64", roughness: 0.5, metalness: 0.35 });
  for (const [tu, tv] of data.details.tables as Vec2[]) {
    const tg = new THREE.Group();
    tg.name = "gregorio-terrace-table";
    tg.position.set(tu, 0, -tv);
    local.add(tg);
    putBox(tg, 0.92, 0.05, 0.92, 0, 0.74, 0, tableMat);
    for (const [lx, lz] of [[-0.36, -0.36], [0.36, -0.36], [-0.36, 0.36], [0.36, 0.36]] as const) {
      putBox(tg, 0.04, 0.72, 0.04, lx, 0.36, lz, legMat);
    }
    for (const [cx, cz, rot] of [[-0.74, 0, Math.PI / 2], [0.74, 0, -Math.PI / 2], [0, 0.74, Math.PI], [0, -0.74, 0]] as const) {
      const cg = new THREE.Group();
      cg.position.set(cx, 0, cz);
      cg.rotation.y = rot;
      tg.add(cg);
      putBox(cg, 0.44, 0.05, 0.44, 0, 0.45, 0, chairMat);
      putBox(cg, 0.44, 0.42, 0.05, 0, 0.68, -0.19, chairMat);
      for (const sx of [-0.18, 0.18]) putBox(cg, 0.05, 0.45, 0.05, sx, 0.225, 0, chairMat);
    }
  }

  // Low rock-bordered shrub/flower beds along the outside foot of the SE terrace balustrade.
  const foliageMat = new THREE.MeshStandardMaterial({ color: "#3d6634", roughness: 0.92 });
  const foliageLightMat = new THREE.MeshStandardMaterial({ color: "#4f7c40", roughness: 0.9 });
  const rockMat = new THREE.MeshStandardMaterial({ color: "#bdb29d", roughness: 0.94 });
  const bloomYellowMat = new THREE.MeshStandardMaterial({ color: "#e5b832", roughness: 0.85 });
  const bloomRedMat = new THREE.MeshStandardMaterial({ color: "#c43838", roughness: 0.85 });
  const shrubGeo = new THREE.DodecahedronGeometry(0.36, 1);
  const rockGeo = new THREE.DodecahedronGeometry(0.16, 0);
  const bloomGeo = new THREE.DodecahedronGeometry(0.11, 0);
  const bedSpans: [number, number][] = [
    [0.2, rampA.from - 0.25],
    [rampA.to + 0.25, rampB.from - 0.25],
    [rampB.to + 0.25, fw - 0.2],
  ];
  for (const [bu0, bu1] of bedSpans) {
    const bw = bu1 - bu0;
    const count = Math.max(2, Math.round(bw / 0.52));
    for (let k = 0; k < count; k++) {
      const u = bu0 + ((k + 0.5) / count) * bw;
      const [wx, wz] = frame.toWorld(u, -0.65);
      const y0 = siteY(wx, wz) + 0.26 - mainDatumY;
      const bush = new THREE.Mesh(shrubGeo, k % 2 ? foliageLightMat : foliageMat);
      bush.name = "gregorio-front-bed";
      bush.position.set(u, y0 + 0.34, 0.44 + (hash(u, k) - 0.5) * 0.14);
      bush.scale.set(1.0 + hash(k, u) * 0.35, 0.78 + hash(u, k + 3) * 0.35, 0.92);
      bush.castShadow = bush.receiveShadow = true;
      local.add(bush);
      const bloom = new THREE.Mesh(bloomGeo, k % 2 ? bloomRedMat : bloomYellowMat);
      bloom.position.set(u + (hash(k + 5, u) - 0.5) * 0.25, y0 + 0.56, 0.58);
      local.add(bloom);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(u, y0 + 0.08, 0.88 + (hash(u + 2, k) - 0.5) * 0.08);
      rock.scale.set(1.2, 0.65, 0.95);
      rock.receiveShadow = true;
      local.add(rock);
    }
  }

  // Four queen palms immediately in front of the SE terrace edge (site_banner.jpg, LiDAR).
  // Added directly to `scene` at y = 0.26 so `drapeScene` lifts them onto the forecourt paving.
  const palmPlaces: SpritePlacement[] = data.details.frontPalms.map((p) => {
    const [x, z] = frame.toWorld(p.u, p.v);
    return { x, y: 0.26, z, scale: p.scale, clearance: 0.3 };
  });
  addSprites(scene, "palm", palmPlaces);
}
