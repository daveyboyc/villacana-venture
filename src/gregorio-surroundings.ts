import * as THREE from "three";
import data from "../data/gregorio_surroundings.json";
import { barrierRings } from "./boundaries";
import { carParkBarrier } from "./car-park-barrier";
import { photoMetres, photoTexture, plasterMaterial, surfaceTexture } from "./materials";
import { addSprites, type SpritePlacement } from "./sprites";
import { refine, siteY } from "./terrain";
import type { Vec2 } from "./types";

const ROAD = data.roadClearance;
const hash = (a: number, b: number) => {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** Collision rings for the stone retaining walls, entrance pier, NE forecourt wall and monument sign. */
export function gregorioSurroundingsRings(): Vec2[][] {
  const rings = barrierRings([
    { id: data.swRetainingWall.id, name: "Gregorio SW Loira retaining wall", points: data.swRetainingWall.points as Vec2[], height: 1.0, thickness: data.swRetainingWall.thickness, solid: true, trust: data.trust },
    { id: `${data.neLawnIsland.id}-driveway-wall`, name: "Gregorio NE island driveway wall", points: data.neLawnIsland.drivewayWall.points as Vec2[], height: 0.7, thickness: data.neLawnIsland.drivewayWall.thickness, solid: true, trust: data.trust },
    { id: `${data.neLawnIsland.id}-luz-wall`, name: "Gregorio NE island C. de la Luz wall", points: data.neLawnIsland.luzWall.points as Vec2[], height: 0.7, thickness: data.neLawnIsland.luzWall.thickness, solid: true, trust: data.trust },
    { id: data.neForecourtWall.id, name: "Gregorio NE forecourt retaining wall", points: data.neForecourtWall.points as Vec2[], height: 1.0, thickness: data.neForecourtWall.thickness, solid: true, trust: data.trust },
  ]);
  // Monument sign plinth footprint.
  const s = data.monumentSign;
  const [sx, sz] = s.at as Vec2;
  const fl = Math.hypot(s.face[0], s.face[1]) || 1;
  const fx = s.face[0] / fl, fz = s.face[1] / fl, ax = -fz, az = fx;
  const hw = s.width / 2, hd = s.depth / 2;
  rings.push([
    [sx + ax * hw + fx * hd, sz + az * hw + fz * hd],
    [sx - ax * hw + fx * hd, sz - az * hw + fz * hd],
    [sx - ax * hw - fx * hd, sz - az * hw - fz * hd],
    [sx + ax * hw - fx * hd, sz + az * hw - fz * hd],
  ]);
  return rings;
}

/** Light-grey interlocking concrete block pavers (setts) for the rising driveway and forecourt. */
function greySettsTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#8a8a85";
  g.fillRect(0, 0, size, size);
  const rows = 16, cols = 8;
  const rh = size / rows, cw = size / cols;
  const tones = ["#b9b8b2", "#c3c2bc", "#aeb0aa", "#c8c6bf", "#b4b4ae"];
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      g.fillStyle = tones[Math.floor(hash(r * 13 + c, c * 7) * tones.length)];
      g.fillRect(c * cw + off + 1.5, r * rh + 1.5, cw - 3, rh - 3);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.setScalar(1 / 1.8);
  tex.anisotropy = 8;
  return tex;
}

/** Warm irregular sandstone retaining-wall texture (Street View Oct 2024 at 2 C. Loira). */
function sandstoneTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#cfc7b7";
  g.fillRect(0, 0, size, size);
  const tones = ["#c8b38c", "#d8c6a3", "#b19b78", "#cab592", "#9e988a", "#d2be98"];
  const rows = 8;
  const rowH = size / rows;
  for (let r = 0; r < rows; r++) {
    let x = -((r * 37) % 64), col = 0;
    while (x < size + 24) {
      const w = 54 + hash(r, col) * 56;
      const h = rowH * (0.74 + hash(col + 9, r) * 0.24);
      const y = r * rowH + (rowH - h) * 0.5;
      g.fillStyle = tones[Math.floor(hash(r * 5 + col, col * 11) * tones.length)];
      g.beginPath();
      const j = (k: number) => (hash(r * 17 + col * 3, k) - 0.5) * 10;
      g.moveTo(x + 4 + j(1), y + 3 + j(2));
      g.lineTo(x + w - 4 + j(3), y + 3 + j(4));
      g.lineTo(x + w - 3 + j(5), y + h - 3 + j(6));
      g.lineTo(x + 3 + j(7), y + h - 3 + j(8));
      g.closePath();
      g.fill();
      g.strokeStyle = "rgba(85,74,58,0.28)";
      g.lineWidth = 2;
      g.stroke();
      x += w + 3;
      col++;
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.setScalar(1 / 2.2);
  tex.anisotropy = 8;
  return tex;
}

/** Red-brick soldier-course coping texture along the retaining walls. */
function brickCopingTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#c9bca8";
  g.fillRect(0, 0, size, size);
  const cols = 12;
  const cw = size / cols;
  const tones = ["#9d513b", "#ad5b42", "#8e4834", "#a4563e"];
  for (let c = 0; c < cols; c++) {
    g.fillStyle = tones[Math.floor(hash(c, 3) * tones.length)];
    g.fillRect(c * cw + 2, 3, cw - 4, size - 6);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.setScalar(1 / 0.9);
  tex.anisotropy = 8;
  return tex;
}

/** BAR / RESTAURANTE / GREGORIO monument sign face (Street View Oct 2024 & Galeria-entrada-camping.jpg). */
function monumentSignTexture(lines: string[]): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 384;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#f2efe6";
  g.fillRect(0, 0, 512, 384);
  g.strokeStyle = "#2d2a26";
  g.lineWidth = 10;
  g.strokeRect(24, 24, 464, 336);
  g.strokeStyle = "#6c655c";
  g.lineWidth = 3;
  g.strokeRect(36, 36, 440, 312);
  g.fillStyle = "#24221f";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "700 44px Georgia, serif";
  g.fillText(lines[0] ?? "BAR", 256, 108);
  g.font = "700 46px Georgia, serif";
  g.fillText(lines[1] ?? "RESTAURANTE", 256, 192);
  g.font = "700 54px Georgia, serif";
  g.fillText(lines[2] ?? "GREGORIO", 256, 276);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Small camper-park directional plaque beside the monument sign (Street View Oct 2024). */
function camperArrowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#f4f2ec";
  g.fillRect(0, 0, 256, 128);
  g.strokeStyle = "#242424";
  g.lineWidth = 6;
  g.strokeRect(6, 6, 244, 116);
  // Stylized camper silhouette + right arrow
  g.fillStyle = "#242424";
  g.fillRect(28, 40, 92, 46);
  g.fillStyle = "#f4f2ec";
  g.fillRect(42, 48, 28, 18);
  g.fillRect(82, 48, 24, 18);
  g.fillStyle = "#242424";
  g.beginPath(); g.arc(52, 88, 10, 0, Math.PI * 2); g.arc(100, 88, 10, 0, Math.PI * 2); g.fill();
  g.fillRect(142, 56, 56, 16);
  g.beginPath(); g.moveTo(194, 38); g.lineTo(232, 64); g.lineTo(194, 90); g.closePath(); g.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Create a flat horizontal polygon mesh with world-metre UVs, refined cleanly over `heightAt(x, z)`. */
function drapedSurface(ring: Vec2[], heightAt: (x: number, z: number) => number, material: THREE.Material, name: string): THREE.Mesh {
  const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
  const raw = new THREE.ShapeGeometry(shape);
  raw.rotateX(-Math.PI / 2);
  const pos = raw.getAttribute("position");
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2] = pos.getX(i);
    uvs[i * 2 + 1] = pos.getZ(i);
  }
  raw.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  const geo = refine(raw, heightAt, new THREE.Matrix4());
  if (geo !== raw) raw.dispose();
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = name;
  mesh.receiveShadow = true;
  mesh.userData.noDrape = true;
  mesh.userData.structural = true;
  return mesh;
}

/** Ribbon polygon of `width` metres along a polyline. */
function ribbon(points: Vec2[], width: number): Vec2[] {
  const half = width / 2, left: Vec2[] = [], right: Vec2[] = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
    const dx = next[0] - prev[0], dz = next[1] - prev[1], len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len * half, nz = dx / len * half;
    left.push([points[i][0] + nx, points[i][1] + nz]);
    right.push([points[i][0] - nx, points[i][1] - nz]);
  }
  return [...left, ...right.reverse()];
}

/** Retaining wall run following polyline `points`, extending `depthBelow` into the ground and topped
 *  with a red-brick soldier-course coping at `topY(index)`. */
function addRetainingWall(
  parent: THREE.Object3D,
  points: Vec2[],
  topY: (index: number) => number,
  thickness: number,
  wallMat: THREE.Material,
  copingMat: THREE.Material,
  name: string,
  depthBelow = 0.75,
): void {
  const copingH = 0.10, copingOver = 0.03;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 0.05) continue;
    const dx = (b[0] - a[0]) / len, dz = (b[1] - a[1]) / len;
    const y0 = topY(i), y1 = topY(i + 1);
    const base0 = Math.min(siteY(a[0], a[1]), y0 - 0.5) - depthBelow;
    const base1 = Math.min(siteY(b[0], b[1]), y1 - 0.5) - depthBelow;
    const start = i === 0 ? 0 : -thickness / 2;
    const end = i === points.length - 2 ? len : len + thickness / 2;

    const makeRibbonGeo = (bottomA: number, bottomB: number, topA: number, topB: number, w: number) => {
      const s = new THREE.Shape();
      s.moveTo(start, bottomA);
      s.lineTo(end, bottomB);
      s.lineTo(end, topB);
      s.lineTo(start, topA);
      s.closePath();
      const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false });
      const coords = geo.getAttribute("position");
      for (let k = 0; k < coords.count; k++) {
        const along = coords.getX(k), across = coords.getZ(k) - w / 2;
        coords.setXYZ(k, a[0] + dx * along - dz * across, coords.getY(k), a[1] + dz * along + dx * across);
      }
      geo.computeVertexNormals();
      return geo;
    };

    const body = new THREE.Mesh(makeRibbonGeo(base0, base1, y0 - copingH, y1 - copingH, thickness), wallMat);
    body.name = name;
    body.castShadow = body.receiveShadow = true;
    parent.add(body);

    const coping = new THREE.Mesh(makeRibbonGeo(y0 - copingH, y1 - copingH, y0, y1, thickness + copingOver * 2), copingMat);
    coping.name = `${name}-coping`;
    coping.castShadow = coping.receiveShadow = true;
    parent.add(coping);
  }
}

function addLantern(parent: THREE.Object3D, x: number, y: number, z: number, ironMat: THREE.Material, glassMat: THREE.Material, name: string): void {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x, y, z);
  const put = (w: number, h: number, d: number, py: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.y = py;
    m.castShadow = true;
    g.add(m);
  };
  put(0.14, 0.05, 0.14, 0.025, ironMat);
  put(0.15, 0.22, 0.15, 0.16, glassMat);
  put(0.22, 0.06, 0.22, 0.29, ironMat);
  put(0.08, 0.07, 0.08, 0.35, ironMat);
  parent.add(g);
}

/**
 * Surroundings of Gregorio Restaurante between Calle Loira, Calle de la Luz and the restaurant terrace:
 * - Rising grey-sett driveway ramp and wide forecourt paving (replaces generic pink paving).
 * - Stone-and-brick retaining walls holding up the raised SW lawn (with BAR / RESTAURANTE / GREGORIO sign),
 *   the NE curved lawn island (with tall sandstone entrance pier & big tree), and the NE forecourt edge.
 * - Calle de la Luz asphalt, yellow-and-white kerb, and red-and-white barrier arm.
 */
export function addGregorioSurroundings(scene: THREE.Scene): void {
  const group = new THREE.Group();
  group.name = data.id;
  group.userData.noDrape = true;
  group.userData.structural = true;
  scene.add(group);

  const settsMat = new THREE.MeshStandardMaterial({ map: greySettsTexture(), color: "#b4b2ad", roughness: 0.9 });
  const asphaltMat = new THREE.MeshStandardMaterial({ color: "#7f8384", roughness: 0.94 });
  const lawnMat = new THREE.MeshStandardMaterial({ color: "#6d834f", map: surfaceTexture("turf"), roughness: 0.96 });
  const stoneMat = new THREE.MeshStandardMaterial({ map: sandstoneTexture(), roughness: 0.93 });
  const copingMat = new THREE.MeshStandardMaterial({ map: brickCopingTexture(), roughness: 0.88 });
  const whiteWallMat = plasterMaterial("#f4f2ec");
  const ironMat = new THREE.MeshStandardMaterial({ color: "#262523", roughness: 0.55 });
  const lampGlassMat = new THREE.MeshStandardMaterial({ color: "#f6ecd2", roughness: 0.3 });

  const tileMap = photoTexture("roof-tiles").clone();
  const tileNorm = photoTexture("roof-tiles", true).clone();
  for (const t of [tileMap, tileNorm]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / photoMetres("roof-tiles"), 1 / photoMetres("roof-tiles"));
    t.needsUpdate = true;
  }
  const roofTileMat = new THREE.MeshStandardMaterial({ color: "#ebb89e", map: tileMap, normalMap: tileNorm, roughness: 0.9 });

  // 1. Grey-sett driveway ramp and wide forecourt paving draped over surveyed siteY + roadClearance.
  group.add(drapedSurface(
    data.drivewayForecourt.ring as Vec2[],
    (x, z) => siteY(x, z) + ROAD,
    settsMat,
    data.drivewayForecourt.id,
  ));

  // 2. Calle de la Luz asphalt strip draped over siteY + 0.27 (flush with Calle Loira / Bolivia).
  const luzRing = ribbon(data.calleDeLaLuz.points as Vec2[], data.calleDeLaLuz.width);
  group.add(drapedSurface(luzRing, (x, z) => siteY(x, z) + 0.27, asphaltMat, data.calleDeLaLuz.id));

  // Yellow-and-white painted kerb blocks along the SW edge of Calle de la Luz (Street View Oct 2024).
  const yellowMat = new THREE.MeshStandardMaterial({ color: "#e5bf24", roughness: 0.78 });
  const kerbWhiteMat = new THREE.MeshStandardMaterial({ color: "#f1efe9", roughness: 0.8 });
  const kPts = data.calleDeLaLuz.yellowWhiteKerb as Vec2[];
  let blockIdx = 0;
  for (let i = 0; i < kPts.length - 1; i++) {
    const a = kPts[i], b = kPts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const steps = Math.max(2, Math.round(len / 0.55)), stepLen = len / steps;
    const yaw = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    for (let s = 0; s < steps; s++) {
      const t = (s + 0.5) / steps;
      const kx = a[0] + (b[0] - a[0]) * t, kz = a[1] + (b[1] - a[1]) * t;
      const kerb = new THREE.Mesh(new THREE.BoxGeometry(stepLen - 0.02, 0.14, 0.16), blockIdx++ % 2 ? kerbWhiteMat : yellowMat);
      kerb.position.set(kx, siteY(kx, kz) + ROAD + 0.05, kz);
      kerb.rotation.y = yaw;
      kerb.castShadow = kerb.receiveShadow = true;
      group.add(kerb);
    }
  }

  // White-and-red car-park barrier arm across Calle de la Luz (reusing src/car-park-barrier.ts).
  const bar = data.calleDeLaLuz.barrier;
  const [bpX, bpZ] = bar.pivot as Vec2, [brX, brZ] = bar.rest as Vec2;
  const armLen = Math.hypot(brX - bpX, brZ - bpZ);
  const barrier = carParkBarrier({ armLength: armLen, name: bar.id, side: 1 });
  barrier.position.set(bpX, siteY(bpX, bpZ) + ROAD, bpZ);
  barrier.rotation.y = -Math.atan2(brZ - bpZ, brX - bpX);
  group.add(barrier);

  // 3. SW raised lawn behind the Calle Loira stone retaining wall (crisp step instead of smeared slope).
  const swMinY = data.swRaisedLawn.minY;
  group.add(drapedSurface(
    data.swRaisedLawn.ring as Vec2[],
    (x, z) => Math.max(siteY(x, z) + ROAD + 0.02, swMinY),
    lawnMat,
    data.swRaisedLawn.id,
  ));

  // SW stone-and-brick retaining wall along Calle Loira curving up the SW side of the driveway.
  const swPts = data.swRetainingWall.points as Vec2[];
  const swClear = data.swRetainingWall.topClearance;
  addRetainingWall(
    group,
    swPts,
    (i) => Math.max(siteY(swPts[i][0], swPts[i][1]) + ROAD + swClear[i], swMinY + 0.16),
    data.swRetainingWall.thickness,
    stoneMat,
    copingMat,
    data.swRetainingWall.id,
    0.85,
  );

  // 4. BAR / RESTAURANTE / GREGORIO monument sign on the SW raised lawn behind the curved wall corner.
  const ms = data.monumentSign;
  const [msX, msZ] = ms.at as Vec2;
  const msBaseY = Math.max(siteY(msX, msZ) + ROAD + 0.02, swMinY) - 0.12;
  const signGroup = new THREE.Group();
  signGroup.name = ms.id;
  signGroup.position.set(msX, msBaseY, msZ);
  signGroup.rotation.y = Math.atan2(ms.face[0], ms.face[1]);
  group.add(signGroup);

  const body = new THREE.Mesh(new THREE.BoxGeometry(ms.width, ms.height, ms.depth), whiteWallMat);
  body.position.y = ms.height / 2;
  body.castShadow = body.receiveShadow = true;
  signGroup.add(body);
  // Rustic brick side pillars framing the monument sign.
  for (const side of [-1, 1]) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.24, ms.height + 0.04, ms.depth + 0.06), copingMat);
    pil.position.set(side * (ms.width / 2 + 0.06), ms.height / 2, 0);
    pil.castShadow = pil.receiveShadow = true;
    signGroup.add(pil);
  }
  // Crisp BAR / RESTAURANTE / GREGORIO painted sign face on +Z (facing Calle Loira).
  const signFaceMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(ms.width - 0.16, ms.height - 0.24),
    new THREE.MeshStandardMaterial({ map: monumentSignTexture(ms.lines), roughness: 0.6 }),
  );
  signFaceMesh.position.set(0, ms.height / 2 + 0.02, ms.depth / 2 + 0.015);
  signGroup.add(signFaceMesh);
  // Pitched terracotta Spanish barrel-tile cap/hood atop the monument sign.
  const capW = ms.width + 0.56, capD = ms.depth + 0.44, capH = 0.34;
  const capShape = new THREE.Shape();
  capShape.moveTo(-capD / 2, 0);
  capShape.lineTo(capD / 2, 0);
  capShape.lineTo(0, capH);
  capShape.closePath();
  const capGeo = new THREE.ExtrudeGeometry(capShape, { depth: capW, bevelEnabled: false });
  capGeo.translate(0, 0, -capW / 2);
  capGeo.rotateY(Math.PI / 2);
  const capMesh = new THREE.Mesh(capGeo, roofTileMat);
  capMesh.position.y = ms.height;
  capMesh.castShadow = capMesh.receiveShadow = true;
  signGroup.add(capMesh);

  // Small camper-park arrow sign on a short post just to the SW side of the monument sign.
  const arrowGroup = new THREE.Group();
  arrowGroup.position.set(-ms.width / 2 - 0.58, 0, 0.22);
  const arrowPost = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.92, 0.06), ironMat);
  arrowPost.position.y = 0.46;
  arrowGroup.add(arrowPost);
  const arrowBoard = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.28, 0.04),
    [whiteWallMat, whiteWallMat, whiteWallMat, whiteWallMat, new THREE.MeshStandardMaterial({ map: camperArrowTexture(), roughness: 0.6 }), whiteWallMat],
  );
  arrowBoard.position.y = 0.86;
  arrowBoard.castShadow = true;
  arrowGroup.add(arrowBoard);
  signGroup.add(arrowGroup);

  // 5. NE curved raised lawn island, sandstone entrance pier & stepped return wall.
  const ep = data.entrancePier;
  const [epX, epZ] = ep.at as Vec2;
  const epBaseY = siteY(epX, epZ) + ROAD - 0.35;
  const epH = ep.height + 0.35;
  const epYaw = -Math.atan2(ep.returnTo[1] - epZ, ep.returnTo[0] - epX);
  const pierGroup = new THREE.Group();
  pierGroup.name = ep.id;
  pierGroup.position.set(epX, epBaseY, epZ);
  pierGroup.rotation.y = epYaw;
  group.add(pierGroup);

  const pierBody = new THREE.Mesh(new THREE.BoxGeometry(ep.size, epH, ep.size), stoneMat);
  pierBody.position.y = epH / 2;
  pierBody.castShadow = pierBody.receiveShadow = true;
  pierGroup.add(pierBody);
  const pierCap = new THREE.Mesh(new THREE.BoxGeometry(ep.size + 0.12, 0.09, ep.size + 0.12), copingMat);
  pierCap.position.y = epH + 0.045;
  pierCap.castShadow = true;
  pierGroup.add(pierCap);
  // Small white electrical box mounted on the SE face of the sandstone entrance pier (Street View 3a41c8e4).
  const elecBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.12), whiteWallMat);
  elecBox.position.set(0, epH - 0.36, ep.size / 2 + 0.04);
  pierGroup.add(elecBox);

  // Stepped lower sandstone-and-brick return wall toward Calle de la Luz + white concrete drainage kerb.
  const retPts: Vec2[] = [ep.at as Vec2, ep.returnTo as Vec2];
  addRetainingWall(
    group,
    retPts,
    (i) => siteY(retPts[i][0], retPts[i][1]) + ROAD + ep.returnHeight,
    0.34,
    stoneMat,
    copingMat,
    `${ep.id}-return`,
    0.45,
  );

  // Curved sandstone-and-brick retaining wall along the driveway side of the NE lawn island.
  const neDwPts = data.neLawnIsland.drivewayWall.points as Vec2[];
  addRetainingWall(
    group,
    neDwPts,
    (i) => siteY(neDwPts[i][0], neDwPts[i][1]) + ROAD + data.neLawnIsland.drivewayWall.height,
    data.neLawnIsland.drivewayWall.thickness,
    stoneMat,
    copingMat,
    `${data.neLawnIsland.id}-driveway-wall`,
    0.65,
  );

  // White-painted low retaining wall with red-brick coping along the Calle de la Luz side of the NE island.
  const neLuzPts = data.neLawnIsland.luzWall.points as Vec2[];
  addRetainingWall(
    group,
    neLuzPts,
    (i) => siteY(neLuzPts[i][0], neLuzPts[i][1]) + ROAD + data.neLawnIsland.luzWall.height,
    data.neLawnIsland.luzWall.thickness,
    whiteWallMat,
    copingMat,
    `${data.neLawnIsland.id}-luz-wall`,
    0.65,
  );

  // Raised green lawn filling the NE curved island.
  group.add(drapedSurface(
    data.neLawnIsland.ring as Vec2[],
    (x, z) => siteY(x, z) + ROAD + data.neLawnIsland.lawnLift,
    lawnMat,
    data.neLawnIsland.id,
  ));

  // 6. Straight sandstone-and-brick boundary/retaining wall along the NE edge of the forecourt beside C. de la Luz.
  const neWallPts = data.neForecourtWall.points as Vec2[];
  addRetainingWall(
    group,
    neWallPts,
    (i) => siteY(neWallPts[i][0], neWallPts[i][1]) + ROAD + data.neForecourtWall.heightAboveForecourt,
    data.neForecourtWall.thickness,
    stoneMat,
    copingMat,
    data.neForecourtWall.id,
    1.1,
  );
  for (const [px, pz] of data.neForecourtWall.piers as Vec2[]) {
    const py = siteY(px, pz) + ROAD + data.neForecourtWall.heightAboveForecourt;
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.95, 0.46), copingMat);
    pier.position.set(px, py - 0.30, pz);
    pier.castShadow = pier.receiveShadow = true;
    group.add(pier);
  }

  // 7. Show details: wall lanterns, spreading trees on the lawn islands, roadside palms, cycad & shrubs.
  if (scene.userData.layoutOnly) return;

  for (const [lx, lz] of data.swRetainingWall.lanternAt as Vec2[]) {
    addLantern(group, lx, Math.max(siteY(lx, lz) + ROAD + 0.92, swMinY + 0.16), lz, ironMat, lampGlassMat, "gregorio-sw-wall-lantern");
  }
  for (const [lx, lz] of data.neLawnIsland.drivewayWall.lanterns as Vec2[]) {
    addLantern(group, lx, siteY(lx, lz) + ROAD + data.neLawnIsland.drivewayWall.height, lz, ironMat, lampGlassMat, "gregorio-ne-island-lantern");
  }
  for (const [px, pz] of data.neForecourtWall.piers as Vec2[]) {
    addLantern(group, px, siteY(px, pz) + ROAD + data.neForecourtWall.heightAboveForecourt + 0.18, pz, ironMat, lampGlassMat, "gregorio-ne-wall-lantern");
  }

  // Lush green border shrubs along the C. de la Luz white wall of the NE island (Street View d6974e13).
  const foliageMat = new THREE.MeshStandardMaterial({ color: "#3b6533", roughness: 0.92 });
  const bushGeo = new THREE.DodecahedronGeometry(0.42, 1);
  for (const strip of data.planting.shrubStrips) {
    const [x0, z0] = strip.from as Vec2, [x1, z1] = strip.to as Vec2;
    for (let k = 0; k < strip.count; k++) {
      const t = (k + 0.5) / strip.count;
      const bx = x0 + (x1 - x0) * t, bz = z0 + (z1 - z0) * t;
      const bush = new THREE.Mesh(bushGeo, foliageMat);
      bush.position.set(bx, siteY(bx, bz) + ROAD + strip.yOffset + 0.22, bz);
      bush.scale.set(1.1 + hash(k, bx) * 0.3, 0.72 + hash(bz, k) * 0.25, 1.05);
      bush.castShadow = bush.receiveShadow = true;
      group.add(bush);
    }
  }

  // Reuse the app's existing 3D tree/palm/cycad sprite helpers (drapeScene lifts each by siteY).
  const treePlaces: SpritePlacement[] = data.planting.trees.map((t) => ({
    x: t.at[0], y: ROAD + t.yOffset, z: t.at[1], scale: t.scale, clearance: 0.3,
  }));
  addSprites(scene, "tree", treePlaces);

  const palmPlaces: SpritePlacement[] = data.planting.palms.map((p) => ({
    x: p.at[0], y: ROAD + p.yOffset, z: p.at[1], scale: p.scale, clearance: 0.3,
  }));
  addSprites(scene, "palm", palmPlaces);

  const cycadPlaces: SpritePlacement[] = data.planting.cycads.map((c) => ({
    x: c.at[0], y: ROAD + c.yOffset, z: c.at[1], scale: c.scale, clearance: 0.3,
  }));
  addSprites(scene, "cycad", cycadPlaces);
}
